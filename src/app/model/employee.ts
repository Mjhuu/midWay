import {Application} from "midway";

export default (app: Application) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

    const Employee = app.model.define('employee', {
        user_id: { type: STRING(50), primaryKey: true },
        username: STRING(30),
        password: STRING(100),
        role: {type: INTEGER, defaultValue: 3},
        join_time: DATE,
        mobile: STRING(15),
        telphone: STRING(15),
        email: STRING(30),
        job_id: STRING(50),
        head_url: TEXT,
        description: TEXT,
        gender: {type: INTEGER, allowNull: false, defaultValue: 1}
    }, {
        freezeTableName: true
    });

    return Employee;
};