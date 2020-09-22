"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        domainWhiteList: ['http://192.168.0.105:3000', 'http://chain.weblinkon.com:7003', 'http://192.168.0.79:7003']
    };
    config.cors = {
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
        credentials: true,
    };
    config.sequelize = {
        dialect: 'mysql',
        host: '192.168.0.79',
        port: 3306,
        username: 'root',
        password: 'itnihao',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmRlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL2NvbmZpZy5kZWZhdWx0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBSXpCLGtCQUFlLENBQUMsT0FBbUIsRUFBRSxFQUFFO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLEVBQW1CLENBQUM7SUFFckMsNkJBQTZCO0lBQzdCLGtDQUFrQztJQUNsQyxnREFBZ0Q7SUFDOUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFcEIsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQztJQUN6QyxNQUFNLENBQUMsUUFBUSxHQUFHO1FBQ2hCLGNBQWMsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQztLQUMvQyxDQUFDO0lBQ0YsdUJBQXVCO0lBQ3ZCLE1BQU0sQ0FBQyxVQUFVLEdBQUc7UUFDbEIsS0FBSztLQUNOLENBQUM7SUFDRixNQUFNLENBQUMsSUFBSSxHQUFHO1FBQ1osaUJBQWlCLEVBQUUsVUFBVTtRQUM3QixPQUFPLEVBQUU7WUFDUCxPQUFPLEVBQUUsVUFBVTtTQUNwQjtLQUNGLENBQUM7SUFDRixNQUFNLENBQUMsUUFBUSxHQUFHO1FBQ2hCLElBQUksRUFBRTtZQUNKLE1BQU0sRUFBRSxLQUFLO1NBQ2Q7UUFDRCxlQUFlLEVBQUUsQ0FBQywyQkFBMkIsRUFBRSxpQ0FBaUMsRUFBRSwwQkFBMEIsQ0FBQztLQUM5RyxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksR0FBRztRQUNaLFlBQVksRUFBRSx3Q0FBd0M7UUFDdEQsV0FBVyxFQUFFLElBQUk7S0FDbEIsQ0FBQztJQUNGLE1BQU0sQ0FBQyxTQUFTLEdBQUc7UUFDakIsT0FBTyxFQUFFLE9BQU87UUFDaEIsSUFBSSxFQUFFLGNBQWM7UUFDcEIsSUFBSSxFQUFFLElBQUk7UUFDVixRQUFRLEVBQUUsTUFBTTtRQUNoQixRQUFRLEVBQUUsU0FBUztRQUNuQixRQUFRLEVBQUUsTUFBTTtRQUNoQixRQUFRLEVBQUUsUUFBUTtRQUNsQixPQUFPLEVBQUUsS0FBSztRQUNkLE1BQU0sRUFBRTtZQUNOLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLFNBQVMsRUFBRSxXQUFXO1NBQ3ZCO0tBQ0YsQ0FBQztJQUNGLE1BQU0sQ0FBQyxNQUFNLEdBQUc7UUFDZCxNQUFNLEVBQUUsR0FBRztLQUNaLENBQUM7SUFDRixNQUFNLENBQUMsU0FBUyxHQUFHO1FBQ2pCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLGNBQWMsRUFBRSxDQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUU7S0FDdEYsQ0FBQztJQUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7UUFDZixHQUFHLEVBQUUsZ0JBQWdCO1FBQ3JCLE1BQU0sRUFBRSxFQUFFLEdBQUcsSUFBSTtRQUNqQixRQUFRLEVBQUUsS0FBSztRQUNmLE9BQU8sRUFBRSxJQUFJO0tBQ2QsQ0FBQztJQUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7UUFDZixNQUFNLEVBQUU7WUFDTixJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLFNBQVM7U0FDcEI7S0FDRixDQUFDO0lBQ0YsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDIn0=