import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

    const Project = app.model.define('project', {
        project_id: { type: STRING(50), primaryKey: true },
        project_name: STRING(50),
        creator_id: STRING(50),
        project_description: STRING(255),
        bgcolor: STRING(20),
        starttime: DATE,
        fileList: TEXT,
        endtime: DATE,
        status: {type: INTEGER, allowNull: false}
    }, {
        freezeTableName: true
    });

    return Project;
};
