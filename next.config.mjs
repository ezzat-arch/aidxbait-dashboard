/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	webpack: (config, { isServer }) => {
		// Fix for Supabase realtime issues
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			net: false,
			dns: false,
			child_process: false,
			tls: false,
		};

		// Ignore critical dependency warnings for these packages
		config.ignoreWarnings = [
			...(config.ignoreWarnings || []),
			{
				module: /node_modules\/supabase/,
				message:
					/Critical dependency: the request of a dependency is an expression/,
			},
			{
				module: /node_modules\/@supabase/,
				message:
					/Critical dependency: the request of a dependency is an expression/,
			},
			{
				module: /node_modules\/ws/,
				message:
					/Critical dependency: the request of a dependency is an expression/,
			},
		];

		// Exclude server-only modules from client bundle
		if (!isServer) {
			config.resolve.alias = {
				...config.resolve.alias,
				"utf-8-validate": false,
				bufferutil: false,
			};
		}

		return config;
	},
};

export default nextConfig;
