import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, } = app.Sequelize;

    const Projectgroup = app.model.define('projectgroup', {
        user_id: { type: STRING(50), primaryKey: true },
        project_id: STRING(50),
        user_role: {type: INTEGER, allowNull: false}
    }, {
        freezeTableName: true
    });

    return Projectgroup;
};
