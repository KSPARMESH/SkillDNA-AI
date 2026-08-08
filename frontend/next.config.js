/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@skilldna/shared'],
  images: {
    domains: ['res.cloudinary.com', 'avatars.githubusercontent.com'],
  },
};

module.exports = nextConfig;
