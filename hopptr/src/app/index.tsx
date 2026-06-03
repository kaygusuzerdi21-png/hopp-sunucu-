import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { useAssets } from 'expo-asset';

export default function App() {
  const [assets] = useAssets([require('../../assets/index.html')]);
  
  return (
    <View style={styles.container}>
      <WebView 
        source={assets ? { uri: assets[0].localUri! } : { html: '<h1>Yükleniyor...</h1>' }}
        style={styles.webview}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});