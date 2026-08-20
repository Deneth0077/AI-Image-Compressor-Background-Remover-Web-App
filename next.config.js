/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
    serverComponentsExternalPackages: ['sharp', '@imgly/background-removal-node', 'onnxruntime-node'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        sharp: 'commonjs sharp',
        '@imgly/background-removal-node': 'commonjs @imgly/background-removal-node',
        'onnxruntime-node': 'commonjs onnxruntime-node',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
