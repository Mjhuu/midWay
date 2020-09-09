import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, TEXT, INTEGER} = app.Sequelize;

    const Log = app.model.define('log', {
        log_id: { type: STRING(50), primaryKey: true },
        user_id: STRING(50),
        ip: TEXT,
        do_thing: TEXT,
        // 日志类型
        type: {type: INTEGER, allowNull: false, defaultValue: 1},
    }, {
        freezeTableName: true
    });

    return Log;
};
