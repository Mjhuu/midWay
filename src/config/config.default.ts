import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
import {
  localWebIpAndPort,
  mysqlHostAndPassword,
  onlineServerDomainAndPort, onlineServerHttpsDomainAndPort,
  onlineServerIpAndPort
} from "../otherConfig";
const fs = require('fs');

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

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
    domainWhiteList: [localWebIpAndPort, onlineServerIpAndPort, onlineServerDomainAndPort, onlineServerHttpsDomainAndPort]
  };
  config.cors = {
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true,
  };
  config.sequelize = {
    dialect: 'mysql',
    host: mysqlHostAndPassword.host,
    port: 3306,
    username: 'root',
    password: mysqlHostAndPassword.password,
    database: 'work',
    timezone: '+08:00', // 东八时区
    logging: false, // 不打印SQL日志
    define: {
      timestamps: true,
      createdAt: 'createdAt',  // 自定义时间戳
      updatedAt: 'updatedAt', // 自定义时间戳
    },
  };
  config.static = {
    prefix: '/',
  };
  config.multipart = {
    fileSize: '200mb', // 默认大小为10Mb
    fileExtensions: [ '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.txt', '.ppt', '.pptx', '.md' ]
  };
  config.session = {
    key: 'WEBLINKON_SESS',
    maxAge: 60 * 1000,  // 1m
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
