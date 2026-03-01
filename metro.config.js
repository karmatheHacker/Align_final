const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force all expo-crypto imports to use the root version (v15.x, no ExpoCryptoAES).
// expo-auth-session (used by @clerk/clerk-expo) bundles expo-crypto@55 which
// loads the ExpoCryptoAES native module that is not available in Expo Go.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-crypto') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo-crypto/build/Crypto.js'),
      type: 'sourceFile',
    };
  }
  // react-dom is not available in React Native; provide an empty shim
  // so @clerk/clerk-react doesn't crash at import time.
  if (moduleName === 'react-dom') {
    return {
      filePath: path.resolve(__dirname, 'react-dom-shim.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
