import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, TEXT } = app.Sequelize;

    const Memo = app.model.define('memo', {
        memo_id: { type: STRING(50), primaryKey: true },
        title: STRING(255),
        content: TEXT,
        user_id: STRING(50),
    }, {
        freezeTableName: true
    });

    return Memo;
};
