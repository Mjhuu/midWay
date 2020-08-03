import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, } = app.Sequelize;

    const Notice = app.model.define('notice', {
        notice_id: { type: STRING(50), primaryKey: true },
        reminder_id: STRING(50),
        reminderd_id: STRING(50),
        message: STRING(255),
        isRead: {type: INTEGER, allowNull: false, defaultValue: 0},
    }, {
        freezeTableName: true
    });

    return Notice;
};
