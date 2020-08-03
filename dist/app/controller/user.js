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
exports.UserController = void 0;
const midway_1 = require("midway");
const uuidv4_1 = require("uuidv4");
const md5 = require('md5-nodejs');
let UserController = class UserController {
    async updatePwd() {
        let { userId, password, verifycode: yzm } = this.ctx.request.body;
        if (Number(yzm) !== Number(this.ctx.session.yzm)) {
            return this.ctx.body = {
                msg: '验证码错误',
                status: 500,
            };
        }
        const data = await this.ctx.model.Employee.findOne({
            where: { user_id: userId }
        });
        if (!data) {
            return this.ctx.body = {
                msg: '用户不存在',
                status: 500,
            };
        }
        password = md5(password);
        data.password = password;
        await data.save();
        return this.ctx.body = {
            msg: '密码重置成功',
            status: 0,
        };
    }
    async resetPwd() {
        let { userId, password } = this.ctx.request.body;
        const data = await this.ctx.model.Employee.findOne({
            where: { user_id: userId }
        });
        if (!data) {
            return this.ctx.body = {
                msg: '用户不存在',
                status: 500,
            };
        }
        password = md5(password);
        data.password = password;
        await data.save();
        return this.ctx.body = {
            msg: '密码重置成功',
            status: 0,
        };
    }
    async updateEmail() {
        const { userId, email, verifycode: yzm } = this.ctx.request.body;
        if (Number(yzm) !== Number(this.ctx.session.yzm)) {
            return this.ctx.body = {
                msg: '验证码错误',
                status: 500,
            };
        }
        const data = await this.ctx.model.Employee.findOne({
            where: { user_id: userId }
        });
        if (!data) {
            return this.ctx.body = {
                msg: '用户不存在',
                status: 500,
            };
        }
        const { Op } = this.ctx.app['Sequelize'];
        const hasEmail = await this.ctx.model.Employee.findOne({ where: { email, user_id: { [Op.ne]: userId } } });
        if (!!hasEmail) {
            return this.ctx.body = {
                msg: '此邮箱已被占用',
                status: 500,
            };
        }
        data.email = email;
        await data.save();
        const user = await this.service.getUser({ id: data.user_id });
        this.ctx.body = user;
    }
    async updateUser() {
        const { userId, username, mobile, telphone, head_url, gender, email = '', job_id = '', role = '', joinTime = '', leaveOffice } = this.ctx.request.body;
        const data = await this.ctx.model.Employee.findOne({
            where: { user_id: userId }
        });
        const { Op } = this.ctx.app['Sequelize'];
        if (!data) {
            return this.ctx.body = {
                msg: '用户不存在',
                status: 500,
            };
        }
        const hasUsername = await this.ctx.model.Employee.findOne({ where: { username, user_id: { [Op.ne]: userId } } });
        if (!!hasUsername) {
            return this.ctx.body = {
                msg: '此用户名已被占用',
                status: 500,
            };
        }
        const hasPhone = await this.ctx.model.Employee.findOne({ where: { mobile, user_id: { [Op.ne]: userId } } });
        if (!!hasPhone) {
            return this.ctx.body = {
                msg: '此手机号已被占用',
                status: 500,
            };
        }
        if (username) {
            data.username = username;
        }
        if (mobile) {
            data.mobile = mobile;
        }
        if (telphone) {
            data.telphone = telphone;
        }
        if (head_url) {
            data.head_url = head_url;
        }
        if (gender !== undefined) {
            data.gender = gender;
        }
        if (leaveOffice !== undefined) {
            data.leaveOffice = leaveOffice;
        }
        if (email) {
            const hasEmail = await this.ctx.model.Employee.findOne({ where: { email, user_id: { [Op.ne]: userId } } });
            if (!!hasEmail) {
                return this.ctx.body = {
                    msg: '此邮箱已被占用',
                    status: 500,
                };
            }
            data.email = email;
        }
        if (job_id) {
            data.job_id = job_id;
        }
        if (role) {
            data.role = role;
        }
        if (joinTime) {
            data.join_time = joinTime;
        }
        await data.save();
        const user = await this.service.getUser({ id: userId });
        this.ctx.body = user;
    }
    async addUser() {
        let { headUrl, password, role, email, username, telphone, mobile, joinTime, jobId, gender } = this.ctx.request.body;
        joinTime = new Date(joinTime);
        password = md5(password);
        const { Op } = this.ctx.app['Sequelize'];
        let data = await this.ctx.model.Employee.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username },
                    { mobile },
                ]
            }
        });
        if (data) {
            return this.ctx.body = { status: 500, msg: '姓名或邮箱或手机号重复' };
        }
        data = await this.ctx.model.Employee.create({
            head_url: headUrl, password, role, email, username, telphone, mobile, join_time: joinTime, job_id: jobId, gender, user_id: uuidv4_1.uuid().replace(/\-/g, '')
        });
        this.ctx.body = { status: 0, msg: '员工添加成功', result: data };
    }
    async getUser() {
        const id = this.ctx.params.id;
        const user = await this.service.getUser({ id });
        this.ctx.body = user;
    }
};
__decorate([
    midway_1.inject(),
    __metadata("design:type", Object)
], UserController.prototype, "ctx", void 0);
__decorate([
    midway_1.inject('userService'),
    __metadata("design:type", Object)
], UserController.prototype, "service", void 0);
__decorate([
    midway_1.put('/password'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePwd", null);
__decorate([
    midway_1.put('/reset_password'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "resetPwd", null);
__decorate([
    midway_1.put('/email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateEmail", null);
__decorate([
    midway_1.put('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    midway_1.post('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "addUser", null);
__decorate([
    midway_1.get('/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
UserController = __decorate([
    midway_1.provide(),
    midway_1.controller('/user')
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29udHJvbGxlci91c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUE4RTtBQUU5RSxtQ0FBNEI7QUFDNUIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBSWxDLElBQWEsY0FBYyxHQUEzQixNQUFhLGNBQWM7SUFTekIsS0FBSyxDQUFDLFNBQVM7UUFDYixJQUFJLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2hFLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNoRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHO2dCQUNyQixHQUFHLEVBQUUsT0FBTztnQkFDWixNQUFNLEVBQUUsR0FBRzthQUNHLENBQUM7U0FDbEI7UUFDRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDakQsS0FBSyxFQUFFLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQztTQUN6QixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRztnQkFDckIsR0FBRyxFQUFFLE9BQU87Z0JBQ1osTUFBTSxFQUFFLEdBQUc7YUFDRyxDQUFDO1NBQ2xCO1FBQ0QsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixNQUFNLElBQUksQ0FBQyxJ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