const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules")
];
config.resolver.extraNodeModules = {
  "@expo/metro-runtime": path.resolve(
    projectRoot,
    "node_modules/expo-router/node_modules/@expo/metro-runtime"
  ),
  expo: path.resolve(projectRoot, "node_modules/expo"),
  "expo-constants": path.resolve(projectRoot, "node_modules/expo-constants"),
  "expo-linking": path.resolve(projectRoot, "node_modules/expo-linking"),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "react-native-safe-area-context": path.resolve(
    projectRoot,
    "node_modules/react-native-safe-area-context"
  ),
  "react-native-screens": path.resolve(
    projectRoot,
    "node_modules/react-native-screens"
  )
};

module.exports = config;
