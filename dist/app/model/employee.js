"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (app) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
    const Employee = app.model.define('employee', {
        user_id: { type: STRING(50), primaryKey: true },
        username: STRING(30),
        password: STRING(100),
        role: { type: INTEGER, defaultValue: 3 },
        join_time: DATE,
        mobile: STRING(15),
        telphone: STRING(15),
        email: STRING(30),
        job_id: STRING(50),
        head_url: TEXT,
        description: TEXT,
        gender: { type: INTEGER, allowNull: false, defaultValue: 1 },
        leaveOffice: { type: INTEGER, defaultValue: 0 },
        weblink_admin: { type: INTEGER, defaultValue: 0 },
        openId: STRING(100),
    }, {
        freezeTableName: true
    });
    return Employee;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wbG95ZWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBwL21vZGVsL2VtcGxveWVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsa0JBQWUsQ0FBQyxHQUFnQixFQUFFLEVBQUU7SUFDaEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7SUFFdEQsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQzFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtRQUMvQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNwQixRQUFRLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNyQixJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUM7UUFDdEMsU0FBUyxFQUFFLElBQUk7UUFDZixNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNsQixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNwQixLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNqQixNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNsQixRQUFRLEVBQUUsSUFBSTtRQUNkLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFDO1FBQzFELFdBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBQztRQUM3QyxhQUFhLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUM7UUFDL0MsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUM7S0FDdEIsRUFBRTtRQUNDLGVBQWUsRUFBRSxJQUFJO0tBQ3hCLENBQUMsQ0FBQztJQUVILE9BQU8sUUFBUSxDQUFDO0FBQ3BCLENBQUMsQ0FBQyJ9