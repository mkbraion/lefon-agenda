/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three/webgpu e os nós TSL são ESM puro e precisam ser transpilados
  transpilePackages: ['three'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
