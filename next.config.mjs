/** @type {import('next').NextConfig} */

/*
 * HEADERS SEGURAS
 */

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },

  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  {
    key: "Referrer-Policy",
    value:
      "strict-origin-when-cross-origin",
  },

  {
    key: "Permissions-Policy",

    value:
      "camera=(), microphone=(), geolocation=()",
  },

  {
    key:
      "Content-Security-Policy",

    value: `
      default-src 'self';

      script-src
        'self'
        'unsafe-inline'
        'unsafe-eval'
        https://www.youtube.com
        https://youtube.com
        https://www.google.com
        https://maps.googleapis.com;

      style-src
        'self'
        'unsafe-inline'
        https://fonts.googleapis.com;

      img-src
        'self'
        data:
        blob:
        https:;

      media-src
        'self'
        blob:
        https:;

      font-src
        'self'
        data:
        https:
        https://fonts.gstatic.com;

      connect-src
        'self'
        https:
        https://apiadministrador.upea.bo
        https://maps.googleapis.com;

      frame-src
        'self'
        blob:
        data:
        https://www.youtube.com
        https://youtube.com
        https://www.youtube-nocookie.com
        https://www.google.com
        https://maps.google.com
        https://www.google.com/maps
        https://maps.googleapis.com
        https://archivosminio.upea.bo
        https://*.upea.bo;

      child-src
        'self'
        blob:
        https://www.google.com
        https://maps.google.com
        https://maps.googleapis.com
        https://archivosminio.upea.bo;

      worker-src
        'self'
        blob:;

      object-src 'none';

      base-uri 'self';

      form-action 'self';

      frame-ancestors 'self';
    `
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

const nextConfig = {
  poweredByHeader: false,
  /*
   * TYPESCRIPT
   */

  typescript: {
    ignoreBuildErrors: true,
  },

  /*
   * IMÁGENES
   */

  images: {
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",

        hostname:
          "archivosminio.upea.bo",
      },

      {
        protocol: "https",

        hostname: "**.upea.bo",
      },

      {
        protocol: "https",

        hostname:
          "maps.googleapis.com",
      },

      {
        protocol: "https",

        hostname:
          "www.google.com",
      },
    ],
  },

  /*
   * HEADERS
   */

  async headers() {
    return [
      {
        source: "/(.*)",

        headers:
          securityHeaders,
      },
    ];
  },
};

export default nextConfig;