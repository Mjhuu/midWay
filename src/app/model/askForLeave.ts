import {Application} from 'midway';
// 请假表
export default (app: Application) => {
    const { STRING, INTEGER, DATE } = app.Sequelize;

    const AskForLeave = app.model.define('askforleave', {
        leave_id: { type: STRING(50), primaryKey: true },
        user_id: STRING(50),
        firstRole: STRING(50), // 部门经理
        firstSign: {type: INTEGER, defaultValue: 0}, // 部门经理是否同意
        secondRole: STRING(50), // 行政部门
        secondSign: {type: INTEGER, defaultValue: 0}, // 行政部门是否同意
        thirdRole: STRING(50), // 总经理
        thirdSign: {type: INTEGER, defaultValue: 0}, // 总经理是否同意
        startTime: {type: DATE}, // 请假开始时间
        endTime: {type: DATE}, // 请假结束时间
        kind: {type: INTEGER, defaultValue: 1}, // 请假类别
        reason: STRING(200), // 请假原因
    }, {
        freezeTableName: true
    });

    return AskForLeave;
};
