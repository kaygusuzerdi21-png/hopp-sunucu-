import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';

export default function App() {
  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: 'file:///android_asset/hopp index.html' }}
        style={styles.webview}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});