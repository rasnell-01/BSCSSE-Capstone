const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../../packages/shared')
];

config.resolver.extraNodeModules = {
    '@shared': path.resolve(__dirname, '../../packages/shared'),
};

module.exports = config;
