import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';

export type DefaultConfig = PowerPartial<EggAppConfig>

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_{{keys}}';

  // add your config here
  config.middleware = [
  ];
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: ['http://localhost:3000']
  };
  config.cors = {
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true,
  };
  config.sequelize = {
    dialect: 'mysql',
    host: '192.168.0.70',
    port: 3306,
    username: "root",
    password: '123456',
    database: 'work',
    timezone: '+08:00', //东八时区
    logging: true, // 不打印SQL日志
    define: {
      timestamps: true,
      createdAt: "createdAt",  //自定义时间戳
      updatedAt: "updatedAt", // 自定义时间戳
    },
  };
  config.session = {
    key: 'WEBLINKON_SESS',
    maxAge: 60 * 1000,  // 1m
    httpOnly: false,
    encrypt: true,
  };
  return config;
};
