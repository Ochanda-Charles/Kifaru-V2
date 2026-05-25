/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');

const nextConfig = {
    transpilePackages: ['antd', '@ant-design', '@ant-design/icons', '@ant-design/cssinjs'],
    async rewrites() {
        if (!apiProxyTarget) {
            return [];
        }

        return [
            {
                source: '/api/:path*',
                destination: `${apiProxyTarget}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
