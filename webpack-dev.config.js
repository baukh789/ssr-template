const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const { name, version } = require('./package.json');
const apiDomains = require('./api-domain.json');
const commonConfig = require('./webpack-common.config');
const mockUtils = require('mock-utils/utils');

const SERVER_HOST = '0.0.0.0';
// const SERVER_HOST = '172.30.136.77';
const SERVER_PORT = 8080;

const systemEnv = process.env.NODE_ENV;
const isDev = systemEnv === 'development';

const serverConfig = (args = {}) => {
	if (!isDev) {
		return {};
	}

	if (args.mock) {
		return {
			before: app => mockUtils(path.resolve(__dirname, './mock'), app)
		};
	}

	let target = '';
	if (args.qa) {
		target = 'http://test.api.com';
	}

	if (args.pro) {
		target = 'http://www.api.com';
	}
	return {
		// 连接后端机器联调的时候可以用到
		proxy: [
			{
				context: [
					'/ins/v1/',
				],
				// 后端ip地址
				target,
				changeOrigin: true,
				secure: true
			}
		]
	};
};

module.exports = args =>
    merge(commonConfig(), {
        mode: 'development',

        devtool: 'eval-cheap-module-source-map',

        output: {
	        path: path.resolve(__dirname, `./${name}`),
            // filename: '[name]_[contenthash].js',
	        filename: `${version}/[name].entry.js`,
	        // publicPath: `/${name}/`
            publicPath: `/${name}/`
        },

        devServer: {
            contentBase: path.resolve(__dirname, './'),
            port: SERVER_PORT,
            quiet: true, // 启用 quiet 后，除了初始启动信息之外的任何内容都不会被打印到控制台，这也意味着来自 webpack 的错误或警告在控制台不可见
            inline: true, // 内联模式开启，false为iframe模式
            overlay: true, // 当存在编译错误或警告时，在浏览器中显示全屏覆盖。默认情况下禁用。
            clientLogLevel: 'info', // 日志等级，默认info，可能的值有 none, error, warning 或者 info（默认值），当使用内联模式(inline mode)时，在开发工具(DevTools)的控制台(console)将显示消息
            // compress: true, // 一切服务都启用gzip 压缩
            // hot: true, // 开启热更新
            host: SERVER_HOST,
	        // allowedHosts: 'auto',
	        headers: {
		        "Access-Control-Allow-Origin": "*",
		        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
	        },
            ...serverConfig(args)
        },

        plugins: [
            new webpack.HotModuleReplacementPlugin(),

            // 配置环境变量
            new webpack.DefinePlugin({
                'process.env': {
                    API_DOMAIN: JSON.stringify(apiDomains[systemEnv]),
                    NODE_ENV: JSON.stringify(systemEnv)
                }
            }),

            // new BundleAnalyzerPlugin(),
            new FriendlyErrorsPlugin({
                compilationSuccessInfo: {
                    messages: [`Your application is running here: http://${SERVER_HOST}:8088`]
                }
            })
        ]
    });
