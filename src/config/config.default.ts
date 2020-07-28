import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
const fs = require('fs');

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
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
    domainWhiteList: ['http://192.168.0.102:3000']
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
