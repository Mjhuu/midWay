import {Application} from 'midway';
// 补签表
export default (app: Application) => {
    const { STRING, INTEGER, DATE } = app.Sequelize;

    const Retroactive = app.model.define('retroactive', {
        retroactive_id: { type: STRING(50), primaryKey: true },
        user_id: STRING(50),
        firstRole: STRING(50), // 部门经理
        firstSign: {type: INTEGER, defaultValue: 0}, // 部门经理是否同意
        secondRole: STRING(50), // 行政部门
        secondSign: {type: INTEGER, defaultValue: 0}, // 行政部门是否同意
        thirdRole: STRING(50), // 总经理
        thirdSign: {type: INTEGER, defaultValue: 0}, // 总经理是否同意
        retroactiveTime: {type: DATE}, // 补签时间
        reason: STRING(200), // 未打卡原因
    }, {
        freezeTableName: true
    });

    return Retroactive;
};
