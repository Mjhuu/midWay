import {Application} from 'midway';
// 签字关联表
export default (app: Application) => {
    const { STRING } = app.Sequelize;

    const RoleSign = app.model.define('rolesign', {
        role_sign_id: { type: STRING(50), primaryKey: true },
        department_id: STRING(50),
        firstRole: STRING(50), // 部门经理
        secondRole: STRING(50), // 行政部门
        thirdRole: STRING(50), // 总经理
    }, {
        freezeTableName: true
    });

    return RoleSign;
};
