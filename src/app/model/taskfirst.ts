import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

    const Taskfirst = app.model.define('taskfirst', {
        tf_id: { type: STRING(50), primaryKey: true },
        create_date: {type: DATE, defaultValue: () => new Date()},
        modfiy_date: {type: DATE, defaultValue: () => new Date()},
        status: {type: INTEGER, allowNull: false},
        tf_content: TEXT,
        note: TEXT,
        creator_id: STRING(50),
        creator_role: INTEGER,
        urgent: INTEGER,
        executor_id: STRING(50),
        project_id: STRING(50),
        description: TEXT,
        fileList: TEXT,
    }, {
        freezeTableName: true
    });

    return Taskfirst;
};
