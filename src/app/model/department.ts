import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, TEXT } = app.Sequelize;

    const Department = app.model.define('department', {
        department_id: { type: STRING(50), primaryKey: true },
        department_name: STRING(30),
        creator_id: STRING(50),
        department_description: TEXT,
    }, {
        freezeTableName: true
    });

    return Department;
};
