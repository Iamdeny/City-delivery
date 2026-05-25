import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [summary, setSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, dailyRes, topRes] = await Promise.all([
        axios.get('/api/admin/analytics/recommendations/summary', {
          params: dateRange,
        }),
        axios.get('/api/admin/analytics/recommendations/daily', {
          params: dateRange,
        }),
        axios.get('/api/admin/analytics/recommendations/top-products', {
          params: { ...dateRange, limit: 10 },
        }),
      ]);
      setSummary(summaryRes.data?.data ?? null);
      setDailyStats(Array.isArray(dailyRes.data?.data) ? dailyRes.data.data : []);
      setTopProducts(Array.isArray(topRes.data?.data) ? topRes.data.data : []);
    } catch (error) {
      // Если не авторизованы или не хватает прав — отправляем на страницу логина
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('cd_admin_access_token');
          window.localStorage.removeItem('cd_admin_refresh_token');
        }
        navigate('/login');
        return;
      }
      console.error('Error fetching analytics:', error);
      setSummary(null);
      setDailyStats([]);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className='p-8'>Загрузка...</div>;

  return (
    <div className='p-8'>
      <h1 className='text-3xl font-bold mb-6'>Аналитика рекомендаций</h1>

      {/* Фильтр по датам */}
      <div className='flex gap-4 mb-8'>
        <div>
          <label className='block text-sm font-medium'>От</label>
          <input
            type='date'
            name='from'
            value={dateRange.from}
            onChange={handleDateChange}
            className='border rounded p-2'
          />
        </div>
        <div>
          <label className='block text-sm font-medium'>До</label>
          <input
            type='date'
            name='to'
            value={dateRange.to}
            onChange={handleDateChange}
            className='border rounded p-2'
          />
        </div>
      </div>

      {/* Сводка */}
      {summary && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='text-gray-500 text-sm'>Показы</div>
            <div className='text-3xl font-bold'>{summary.impressions}</div>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='text-gray-500 text-sm'>Клики</div>
            <div className='text-3xl font-bold'>{summary.clicks}</div>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='text-gray-500 text-sm'>CTR</div>
            <div className='text-3xl font-bold'>{summary.ctr}%</div>
          </div>
        </div>
      )}

      {/* График по дням */}
      <div className='bg-white rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>Показы и клики по дням</h2>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={dailyStats}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='date'
              tickFormatter={(str) => format(new Date(str), 'dd.MM')}
            />
            <YAxis yAxisId='left' />
            <YAxis yAxisId='right' orientation='right' />
            <Tooltip
              labelFormatter={(label) => format(new Date(label), 'dd.MM.yyyy')}
            />
            <Legend />
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='impressions'
              stroke='#8884d8'
              name='Показы'
            />
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='clicks'
              stroke='#82ca9d'
              name='Клики'
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* График CTR по дням */}
      <div className='bg-white rounded-lg shadow p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>CTR по дням (%)</h2>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={dailyStats}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='date'
              tickFormatter={(str) => format(new Date(str), 'dd.MM')}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip
              labelFormatter={(label) => format(new Date(label), 'dd.MM.yyyy')}
            />
            <Bar dataKey='ctr' fill='#ffc658' name='CTR %' />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Топ товаров */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Топ-10 товаров по кликам</h2>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead>
            <tr>
              <th className='px-4 py-2 text-left'>Товар</th>
              <th className='px-4 py-2 text-left'>Категория</th>
              <th className='px-4 py-2 text-right'>Показы</th>
              <th className='px-4 py-2 text-right'>Клики</th>
              <th className='px-4 py-2 text-right'>CTR</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product) => (
              <tr key={product.id}>
                <td className='px-4 py-2'>{product.name}</td>
                <td className='px-4 py-2'>{product.category}</td>
                <td className='px-4 py-2 text-right'>{product.impressions}</td>
                <td className='px-4 py-2 text-right'>{product.clicks}</td>
                <td className='px-4 py-2 text-right'>{product.ctr}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
