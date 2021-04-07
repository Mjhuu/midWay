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
        'waf', 'jwt'
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
        fileExtensions: ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.txt', '.ppt', '.pptx', '.md']
    };
    config.session = {
        key: 'WEBLINKON_SESS',
        maxAge: 60 * 1000,
        httpOnly: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmRlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL2NvbmZpZy5kZWZhdWx0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsZ0RBS3dCO0FBQ3hCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUl6QixrQkFBZSxDQUFDLE9BQW1CLEVBQUUsRUFBRTtJQUNyQyxNQUFNLE1BQU0sR0FBRyxFQUFtQixDQUFDO0lBRXJDLDZCQUE2QjtJQUM3QixrQ0FBa0M7SUFDbEMsZ0RBQWdEO0lBQzlDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBRXBCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7SUFDekMsTUFBTSxDQUFDLFFBQVEsR0FBRztRQUNoQixjQUFjLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUM7S0FDL0MsQ0FBQztJQUNGLHVCQUF1QjtJQUN2QixNQUFNLENBQUMsVUFBVSxHQUFHO1FBQ2xCLEtBQUssRUFBRSxLQUFLO0tBQ2IsQ0FBQztJQUNGLE1BQU0sQ0FBQyxJQUFJLEdBQUc7UUFDWixpQkFBaUIsRUFBRSxVQUFVO1FBQzdCLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRSxVQUFVO1NBQ3BCO0tBQ0YsQ0FBQztJQUNGLE1BQU0sQ0FBQyxRQUFRLEdBQUc7UUFDaEIsSUFBSSxFQUFFO1lBQ0osTUFBTSxFQUFFLEtBQUs7U0FDZDtRQUNELGVBQWUsRUFBRSxDQUFDLCtCQUFpQixFQUFFLG1DQUFxQixFQUFFLHVDQUF5QixFQUFFLDRDQUE4QixDQUFDO0tBQ3ZILENBQUM7SUFDRixNQUFNLENBQUMsSUFBSSxHQUFHO1FBQ1osWUFBWSxFQUFFLHdDQUF3QztRQUN0RCxXQUFXLEVBQUUsSUFBSTtLQUNsQixDQUFDO0lBQ0YsTUFBTSxDQUFDLFNBQVMsR0FBRztRQUNqQixPQUFPLEVBQUUsT0FBTztRQUNoQixJQUFJLEVBQUUsa0NBQW9CLENBQUMsSUFBSTtRQUMvQixJQUFJLEVBQUUsSUFBSTtRQUNWLFFBQVEsRUFBRSxNQUFNO1FBQ2hCLFFBQVEsRUFBRSxrQ0FBb0IsQ0FBQyxRQUFRO1FBQ3ZDLFFBQVEsRUFBRSxNQUFNO1FBQ2hCLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsTUFBTSxFQUFFO1lBQ04sVUFBVSxFQUFFLElBQUk7WUFDaEIsU0FBUyxFQUFFLFdBQVc7WUFDdEIsU0FBUyxFQUFFLFdBQVc7U0FDdkI7S0FDRixDQUFDO0lBQ0YsTUFBTSxDQUFDLE1BQU0sR0FBRztRQUNkLE1BQU0sRUFBRSxHQUFHO0tBQ1osQ0FBQztJQUNGLE1BQU0sQ0FBQyxTQUFTLEdBQUc7UUFDakIsUUFBUSxFQUFFLE9BQU87UUFDakIsY0FBYyxFQUFFLENBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUU7S0FDN0YsQ0FBQztJQUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7UUFDZixHQUFHLEVBQUUsZ0JBQWdCO1FBQ3JCLE1BQU0sRUFBRSxFQUFFLEdBQUcsSUFBSTtRQUNqQixRQUFRLEVBQUUsSUFBSTtRQUNkLE9BQU8sRUFBRSxJQUFJO0tBQ2QsQ0FBQztJQUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7UUFDZixNQUFNLEVBQUU7WUFDTixJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLFNBQVM7U0FDcEI7S0FDRixDQUFDO0lBQ0YsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDIn0=