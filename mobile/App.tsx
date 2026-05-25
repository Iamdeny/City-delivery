import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const DEFAULT_URL = 'http://localhost:3000';

function resolveWebUrl(): string {
  return (
    process.env.EXPO_PUBLIC_WEB_URL ||
    (Constants.expoConfig?.extra?.webUrl as string | undefined) ||
    DEFAULT_URL
  );
}

export default function App() {
  const webUrl = useMemo(() => resolveWebUrl(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const onLoadError = useCallback(() => {
    setError(
      `Не удалось открыть ${webUrl}. Запустите frontend (npm run dev:lan), backend (:5000) и убедитесь, что телефон в той же Wi‑Fi сети.`,
    );
    setLoading(false);
  }, [webUrl]);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
        {error ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Нет подключения</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.hint}>URL: {webUrl}</Text>
            <Pressable style={styles.button} onPress={retry}>
              <Text style={styles.buttonText}>Повторить</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : null}
            <WebView
              key={reloadKey}
              source={{ uri: webUrl }}
              style={styles.webview}
              onLoadEnd={() => setLoading(false)}
              onError={onLoadError}
              onHttpError={onLoadError}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsBackForwardNavigationGestures
              setSupportMultipleWindows={false}
              originWhitelist={['http://*', 'https://*']}
            />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  centered: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
