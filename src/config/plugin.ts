import { EggPlugin } from 'midway';
export default {
  static: true, // default is true
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks',
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
} as EggPlugin;
