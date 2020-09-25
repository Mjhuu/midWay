"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const otherConfig_1 = require("../otherConfig");
const fs = require('fs');
exports.default = (appInfo) => {
    const config = {};
    // 注意，开启此模式后，应用就默认自己处于反向代理之后，
    // 会支持通过解析约定的请求头来获取用户真实的 IP，协议和域名。
    // 如果你的服务未部署在反向代理之后，请不要开启此配置，以防被恶意用户伪造请求 IP 等信息。
    config.proxy = true;
    config.keys = appInfo.name + '_{{keys}}';
    config.siteFile = {
        '/favicon.ico': fs.readFileSync('favicon.ico'),
    };
    // add your config here
    config.middleware = [
        'jwt'
    ];
    config.view = {
        defaultViewEngine: 'nunjucks',
        mapping: {
            '.html': 'nunjucks',
        }
    };
    config.security = {
        csrf: {
            enable: false,
        },
        domainWhiteList: [otherConfig_1.localWebIpAndPort, otherConfig_1.onlineServerIpAndPort, otherConfig_1.onlineServerDomainAndPort, otherConfig_1.onlineServerHttpsDomainAndPort]
    };
    config.cors = {
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
        credentials: true,
    };
    config.sequelize = {
        dialect: 'mysql',
        host: otherConfig_1.mysqlHostAndPassword.host,
        port: 3306,
        username: 'root',
        password: otherConfig_1.mysqlHostAndPassword.password,
        database: 'work',
        timezone: '+08:00',
        logging: false,
        define: {
            timestamps: true,
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    };
    config.static = {
        prefix: '/',
    };
    config.multipart = {
        fileSize: '200mb',
        fileExtensions: ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.txt', '.ppt', '.pptx']
    };
    config.session = {
        key: 'WEBLINKON_SESS',
        maxAge: 60 * 1000,
        httpOnly: false,
        encrypt: true,
    };
    config.cluster = {
        listen: {
            path: '',
            port: 7003,
            hostname: '0.0.0.0',
        }
    };
    return config;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmRlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL2NvbmZpZy5kZWZhdWx0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsZ0RBS3dCO0FBQ3hCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUl6QixrQkFBZSxDQUFDLE9BQW1CLEVBQUUsRUFBRTtJQUNyQyxNQUFNLE1BQU0sR0FBRyxFQUFtQixDQUFDO0lBRXJDLDZCQUE2QjtJQUM3QixrQ0FBa0M7SUFDbEMsZ0RBQWdEO0lBQzlDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBRXBCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7SUFDekMsTUFBTSxDQUFDLFFBQVEsR0FBRztRQUNoQixjQUFjLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUM7S0FDL0MsQ0FBQztJQUNGLHVCQUF1QjtJQUN2QixNQUFNLENBQUMsVUFBVSxHQUFHO1FBQ2xCLEtBQUs7S0FDTixDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksR0FBRztRQUNaLGlCQUFpQixFQUFFLFVBQVU7UUFDN0IsT0FBTyxFQUFFO1lBQ1AsT0FBTyxFQUFFLFVBQVU7U0FDcEI7S0FDRixDQUFDO0lBQ0YsTUFBTSxDQUFDLFFBQVEsR0FBRztRQUNoQixJQUFJLEVBQUU7WUFDSixNQUFNLEVBQUUsS0FBSztTQUNkO1FBQ0QsZUFBZSxFQUFFLENBQUMsK0JBQWlCLEVBQUUsbUNBQXFCLEVBQUUsdUNBQXlCLEVBQUUsNENBQThCLENBQUM7S0FDdkgsQ0FBQztJQUNGLE1BQU0sQ0FBQyxJQUFJLEdBQUc7UUFDWixZQUFZLEVBQUUsd0NBQXdDO1FBQ3RELFdBQVcsRUFBRSxJQUFJO0tBQ2xCLENBQUM7SUFDRixNQUFNLENBQUMsU0FBUyxHQUFHO1FBQ2pCLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLElBQUksRUFBRSxrQ0FBb0IsQ0FBQyxJQUFJO1FBQy9CLElBQUksRUFBRSxJQUFJO1FBQ1YsUUFBUSxFQUFFLE1BQU07UUFDaEIsUUFBUSxFQUFFLGtDQUFvQixDQUFDLFFBQVE7UUFDdkMsUUFBUSxFQUFFLE1BQU07UUFDaEIsUUFBUSxFQUFFLFFBQVE7UUFDbEIsT0FBTyxFQUFFLEtBQUs7UUFDZCxNQUFNLEVBQUU7WUFDTixVQUFVLEVBQUUsSUFBSTtZQUNoQixTQUFTLEVBQUUsV0FBVztZQUN0QixTQUFTLEVBQUUsV0FBVztTQUN2QjtLQUNGLENBQUM7SUFDRixNQUFNLENBQUMsTUFBTSxHQUFHO1FBQ2QsTUFBTSxFQUFFLEdBQUc7S0FDWixDQUFDO0lBQ0YsTUFBTSxDQUFDLFNBQVMsR0FBRztRQUNqQixRQUFRLEVBQUUsT0FBTztRQUNqQixjQUFjLEVBQUUsQ0FBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFFO0tBQ3RGLENBQUM7SUFDRixNQUFNLENBQUMsT0FBTyxHQUFHO1FBQ2YsR0FBRyxFQUFFLGdCQUFnQjtRQUNyQixNQUFNLEVBQUUsRUFBRSxHQUFHLElBQUk7UUFDakIsUUFBUSxFQUFFLEtBQUs7UUFDZixPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUM7SUFDRixNQUFNLENBQUMsT0FBTyxHQUFHO1FBQ2YsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBSTtZQUNWLFFBQVEsRUFBRSxTQUFTO1NBQ3BCO0tBQ0YsQ0FBQztJQUNGLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyJ9