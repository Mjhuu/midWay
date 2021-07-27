import {Application} from 'midway';

export default (app: Application) => {
    const { STRING, TEXT } = app.Sequelize;

    const Meeting = app.model.define('meeting', {
        id: { type: STRING(50), primaryKey: true },
        user_id: { type: STRING(50) },
        meetName: STRING(50), // 会议名称
        host: STRING(20), // 会议主持
        meetTime: STRING(50), // 会议时间
        meetingUserName: TEXT, // 参会人员名称
        meetingUserId: TEXT, // 参会人员id
        notifyUserName: TEXT, // 已通知人员
        address: STRING(20), // 会议地点
    }, {
        freezeTableName: true
    });

    return Meeting;
};
