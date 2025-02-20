/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  
  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // NOTE: This fixes the problem with static site hosted in S3 failing when user refreshes a page
  // or shares a link
  trailingSlash: true,

  // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
  // skipTrailingSlashRedirect: true,

  // Optional: Change the output directory `out` -> `dist`
  // distDir: 'dist',
  // NOTE: If you change from `out` to `dist` then npm run dev clashes with npm run build

  assetPrefix: '/', // for relative paths so we can serve directly from an AWS S3 bucket

  // we need to pre-optimize images at build time
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
