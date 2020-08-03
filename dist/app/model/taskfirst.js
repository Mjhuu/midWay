"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (app) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
    const Taskfirst = app.model.define('taskfirst', {
        tf_id: { type: STRING(50), primaryKey: true },
        create_date: { type: DATE, defaultValue: () => new Date() },
        modfiy_date: { type: DATE, defaultValue: () => new Date() },
        status: { type: INTEGER, allowNull: false },
        tf_content: TEXT,
        note: TEXT,
        creator_id: STRING(50),
        creator_role: INTEGER,
        urgent: INTEGER,
        executor_id: STRING(50),
        project_id: STRING(50),
        description: TEXT,
        fileList: TEXT,
    }, {
        freezeTableName: true
    });
    return Taskfirst;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza2ZpcnN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwcC9tb2RlbC90YXNrZmlyc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxrQkFBZSxDQUFDLEdBQWdCLEVBQUUsRUFBRTtJQUNoQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUV0RCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7UUFDNUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO1FBQzdDLFdBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUM7UUFDekQsV0FBVyxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBQztRQUN6RCxNQUFNLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUM7UUFDekMsVUFBVSxFQUFFLElBQUk7UUFDaEIsSUFBSSxFQUFFLElBQUk7UUFDVixVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUN0QixZQUFZLEVBQUUsT0FBTztRQUNyQixNQUFNLEVBQUUsT0FBTztRQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3ZCLFVBQVUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3RCLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLFFBQVEsRUFBRSxJQUFJO0tBQ2pCLEVBQUU7UUFDQyxlQUFlLEVBQUUsSUFBSTtLQUN4QixDQUFDLENBQUM7SUFFSCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDLENBQUMifQ==