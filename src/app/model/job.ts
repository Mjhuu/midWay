import {Application} from 'midway';

export default (app: Application) => {
    const { STRING } = app.Sequelize;

    const Job = app.model.define('job', {
        job_id: { type: STRING(50), primaryKey: true },
        job_name: STRING(30),
        department_id: STRING(50),
    }, {
        freezeTableName: true
    });

    return Job;
};
