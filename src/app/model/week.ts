import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, DATE, TEXT, FLOAT } = app.Sequelize;

    const Week = app.model.define('week', {
        week_id: { type: STRING(50), primaryKey: true },
        startweekdate: DATE,
        endweekdate: DATE,
        evaluator_id: STRING(50), // 评价人
        evaluated_id: STRING(50), // 被评价人
        score: FLOAT,
        evaluate: TEXT, // 评价内容
        leader_next_week_plan: TEXT, // 领导写的下周计划
        myself_next_week_plan: TEXT, // 自己写的下周计划
        weekly_summary: TEXT, // 本周周结
        fileList: TEXT, // 需要上传的周文件
    }, {
        freezeTableName: true
    });

    return Week;
};
