import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, DATE } = app.Sequelize;

    const Assessment = app.model.define('assessment', {
        // 考核记录id
        assessment_id: { type: STRING(50), primaryKey: true },
        // user_id 谁
        user_id: STRING(50),
        // type 1--查看or2--下载
        type: {type: INTEGER, allowNull: false, defaultValue: 1},
        // month
        month: STRING(3),
        // 年
        year: STRING(4),
        // beginDate
        beginDate: DATE,
        // endDate
        endDate: DATE,
    }, {
        freezeTableName: true
    });

    return Assessment;
};
