import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, INTEGER, } = app.Sequelize;

    const SubscribeMsg = app.model.define('subscribeMsg', {
        id: { type: STRING(50), primaryKey: true },
        meetNotify: {type: INTEGER, allowNull: false, defaultValue: 0},
        user_id: STRING(50),
    }, {
        freezeTableName: true
    });

    return SubscribeMsg;
};
