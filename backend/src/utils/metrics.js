/**
 * Minimal in-memory metrics collector (no external deps).
 *
 * - Tracks HTTP latency + status groups by method + normalized path
 * - Tracks named operation latency (inventory.reserve, orders.createOrderTx, etc.)
 *
 * Note:
 * - This is intentionally simple and in-memory for MVP.
 * - When we move to Prometheus/OpenTelemetry, only adapters should change.
 */

const { performance } = require('perf_hooks');

const MAX_SAMPLES = 2000;

function nowMs() {
  return performance.now();
}

function clampSamples(arr) {
  if (arr.length <= MAX_SAMPLES) return;
  arr.splice(0, arr.length - MAX_SAMPLES);
}

function quantile(sorted, q) {
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] === undefined) return sorted[base];
  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function summarize(samples) {
  const arr = samples.slice().sort((a, b) => a - b);
  return {
    count: arr.length,
    p50: quantile(arr, 0.5),
    p95: quantile(arr, 0.95),
    p99: quantile(arr, 0.99),
    min: arr.length ? arr[0] : null,
    max: arr.length ? arr[arr.length - 1] : null,
  };
}

function normalizePath(p) {
  // strip query if any
  const pathOnly = String(p || '').split('?')[0];
  return pathOnly
    // numeric ids
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    // uuid-like
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:uuid'
    );
}

class Metrics {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.http = new Map(); // key -> { count, errors, samples: [] }
    this.ops = new Map(); // name -> { count, errors, samples: [] }
    this.counters = new Map(); // key -> number
  }

  static counterKey(name, labels) {
    const base = String(name);
    if (!labels || typeof labels !== 'object') return base;
    const entries = Object.entries(labels)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [String(k), String(v)]);
    if (entries.length === 0) return base;
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const labelStr = entries
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(',');
    return `${base}{${labelStr}}`;
  }

  inc(name, labels, value = 1) {
    const key = Metrics.counterKey(name, labels);
    const prev = this.counters.get(key) || 0;
    this.counters.set(key, prev + (Number.isFinite(value) ? value : 1));
  }

  observeHttp({ method, path, statusCode, durationMs }) {
    const norm = normalizePath(path);
    const statusGroup = Math.floor((statusCode || 0) / 100) || 0;
    const key = `${method || 'GET'} ${norm} ${statusGroup}xx`;

    const entry = this.http.get(key) || { count: 0, errors: 0, samples: [] };
    entry.count += 1;
    if (statusCode >= 500) entry.errors += 1;
    entry.samples.push(durationMs);
    clampSamples(entry.samples);
    this.http.set(key, entry);
  }

  observeOp({ name, ok, durationMs }) {
    const key = String(name);
    const entry = this.ops.get(key) || { count: 0, errors: 0, samples: [] };
    entry.count += 1;
    if (!ok) entry.errors += 1;
    entry.samples.push(durationMs);
    clampSamples(entry.samples);
    this.ops.set(key, entry);
  }

  async timeOp(name, fn) {
    const start = nowMs();
    try {
      const result = await fn();
      this.observeOp({ name, ok: true, durationMs: nowMs() - start });
      return result;
    } catch (err) {
      this.observeOp({ name, ok: false, durationMs: nowMs() - start });
      throw err;
    }
  }

  snapshot() {
    const http = {};
    for (const [key, v] of this.http.entries()) {
      http[key] = { ...summarize(v.samples), errors: v.errors };
    }

    const ops = {};
    for (const [key, v] of this.ops.entries()) {
      ops[key] = { ...summarize(v.samples), errors: v.errors };
    }

    const counters = {};
    for (const [key, value] of this.counters.entries()) {
      counters[key] = value;
    }

    return {
      startedAt: this.startedAt,
      http,
      ops,
      counters,
    };
  }
}

const metrics = new Metrics();

function metricsMiddleware(req, res, next) {
  const start = nowMs();
  res.on('finish', () => {
    metrics.observeHttp({
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: nowMs() - start,
    });
  });
  next();
}

module.exports = {
  metrics,
  metricsMiddleware,
};

