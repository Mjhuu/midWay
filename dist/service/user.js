"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const midway_1 = require("midway");
const md5_nodejs_1 = require("md5-nodejs");
let UserService = class UserService {
    async getUser(options) {
        const { id } = options;
        const data = await this.ctx.model.Employee.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        if (!data) {
            return { status: 500, msg: '用户不存在' };
        }
        const jobData = await this.ctx.model.Job.findByPk(data.job_id, {
            attributes: ['job_id', 'job_name', 'department_id']
        });
        let departmentInfo = {};
        if (jobData) {
            departmentInfo = await this.ctx.model.Department.findByPk(jobData.department_id, {
                attributes: ['department_id', 'department_name']
            });
        }
        return { status: 0, msg: '用户信息获取成功', result: { userInfo: data, jobInfo: jobData, departmentInfo } };
    }
    async login(options) {
        let { username, captcha, password } = options;
        if (!this.ctx.session.captcha) {
            return { status: 500, msg: '验证码已过期' };
        }
        if (captcha.toUpperCase() !== this.ctx.session.captcha.toUpperCase()) {
            return { status: 500, msg: '验证码错误' };
        }
        password = md5_nodejs_1.default(password);
        const data = await this.ctx.model.Employee.findOne({
            where: {
                username, password
            }
        });
        if (!data) {
            return { status: 500, msg: '用户名或密码错误' };
        }
        return { status: 0, msg: '登录成功', result: { userInfo: data } };
    }
};
__decorate([
    midway_1.inject(),
    __metadata("design:type", Object)
], UserService.prototype, "ctx", void 0);
UserService = __decorate([
    midway_1.provide('userService')
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlL3VzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQWdEO0FBRWhELDJDQUE2QjtBQUc3QixJQUFhLFdBQVcsR0FBeEIsTUFBYSxXQUFXO0lBSXRCLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBcUI7UUFDakMsTUFBTSxFQUFDLEVBQUUsRUFBQyxHQUFHLE9BQU8sQ0FBQztRQUNyQixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFO1lBQ3RELFVBQVUsRUFBRSxFQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFDO1NBQ3BDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDVCxPQUFPLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDLENBQUM7U0FDcEM7UUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUM3RCxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FBQztTQUNwRCxDQUFDLENBQUM7UUFDSCxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxPQUFPLEVBQUU7WUFDWCxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7Z0JBQy9FLFVBQVUsRUFBRSxDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQzthQUNqRCxDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8sRUFBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBQyxFQUFDLENBQUM7SUFDbEcsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBcUI7UUFDL0IsSUFBSSxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFDLEdBQUcsT0FBTyxDQUFDO1FBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDN0IsT0FBTyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQyxDQUFDO1NBQ3JDO1FBQ0QsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3BFLE9BQU8sRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUMsQ0FBQztTQUNwQztRQUNELFFBQVEsR0FBRyxvQkFBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUNqRCxLQUFLLEVBQUU7Z0JBQ0wsUUFBUSxFQUFFLFFBQVE7YUFDbkI7U0FDRixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsT0FBTyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBQyxDQUFDO1NBQ3ZDO1FBQ0QsT0FBTyxFQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLEVBQUMsQ0FBQztJQUM1RCxDQUFDO0NBQ0YsQ0FBQTtBQXpDQztJQURDLGVBQU0sRUFBRTs7d0NBQ0k7QUFGRixXQUFXO0lBRHZCLGdCQUFPLENBQUMsYUFBYSxDQUFDO0dBQ1YsV0FBVyxDQTJDdkI7QUEzQ1ksa0NBQVcifQ==