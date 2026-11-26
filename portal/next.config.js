const os = require("os");

//* Dev only: Next blocks its dev scripts for any host other than localhost, which leaves the page
//* un-hydrated (no clicks, no theme switch) when opened via 127.0.0.1 or the machine's network IP.
const lanHosts = Object.values(os.networkInterfaces())
  .flat()
  .filter((net) => net && net.family === "IPv4" && !net.internal)
  .map((net) => net.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", ...lanHosts],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
