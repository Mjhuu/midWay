import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, TEXT } = app.Sequelize;

    const Teamwork = app.model.define('teamwork', {
        tw_id: { type: STRING(50), primaryKey: true },
        tf_id: STRING(50),
        project_id: STRING(50),
        creator_id: STRING(50),
        content: TEXT,
        description: TEXT,
        longtext: TEXT,
        status: {type: INTEGER, allowNull: false, },
        creator_role: {type: INTEGER, allowNull: false},
        isrefuse: {type: INTEGER, allowNull: false, defaultValue: 0}, // 0 - 未拒绝 1-已拒绝 2-接收
        urgent: {type: INTEGER, allowNull: false},
        executor_id: STRING(50),
        fileList: {type: TEXT, defaultValue: '[]'},
    }, {
        freezeTableName: true
    });

    return Teamwork;
};
