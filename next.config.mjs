/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs", "nodemailer"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent next/document from being bundled into server chunks
      config.externals = [...(config.externals || []), "next/document"];
    }
    return config;
  },
};

export default nextConfig;
