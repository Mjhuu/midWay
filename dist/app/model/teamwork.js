"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (app) => {
    const { STRING, INTEGER, TEXT } = app.Sequelize;
    const Teamwork = app.model.define('teamwork', {
        tw_id: { type: STRING(50), primaryKey: true },
        tf_id: STRING(50),
        project_id: STRING(50),
        creator_id: STRING(50),
        content: TEXT,
        description: TEXT,
        longtext: TEXT,
        status: { type: INTEGER, allowNull: false, },
        creator_role: { type: INTEGER, allowNull: false },
        isrefuse: { type: INTEGER, allowNull: false, defaultValue: 0 },
        urgent: { type: INTEGER, allowNull: false },
        executor_id: STRING(50),
        fileList: { type: TEXT, defaultValue: '[]' },
    }, {
        freezeTableName: true
    });
    return Teamwork;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBwL21vZGVsL3RlYW13b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsa0JBQWUsQ0FBQyxHQUFnQixFQUFFLEVBQUU7SUFDaEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUVoRCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDMUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO1FBQzdDLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2pCLFVBQVUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3RCLFVBQVUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3RCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsV0FBVyxFQUFFLElBQUk7UUFDakIsUUFBUSxFQUFFLElBQUk7UUFDZCxNQUFNLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEdBQUc7UUFDM0MsWUFBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFDO1FBQy9DLFFBQVEsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFDO1FBQzVELE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBQztRQUN6QyxXQUFXLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUN2QixRQUFRLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUM7S0FDN0MsRUFBRTtRQUNDLGVBQWUsRUFBRSxJQUFJO0tBQ3hCLENBQUMsQ0FBQztJQUVILE9BQU8sUUFBUSxDQUFDO0FBQ3BCLENBQUMsQ0FBQyJ9