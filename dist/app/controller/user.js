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
const decorator_1 = require("../decorator");
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
    decorator_1.normalLog('进行了修改自己账号密码的操作'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePwd", null);
__decorate([
    midway_1.put('/reset_password'),
    decorator_1.actionOtherLog({
        first: '进行了重置',
        second: '的密码操作',
        userId: 'userId'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "resetPwd", null);
__decorate([
    midway_1.put('/email'),
    decorator_1.normalLog('进行了修改自己邮箱的操作'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateEmail", null);
__decorate([
    midway_1.put('/'),
    decorator_1.normalLog('进行了修改用户信息的操作'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    midway_1.post('/'),
    decorator_1.normalLog('进行了新增员工的操作'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29udHJvbGxlci91c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUE4RTtBQUU5RSxtQ0FBNEI7QUFDNUIsNENBQXVEO0FBQ3ZELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUlsQyxJQUFhLGNBQWMsR0FBM0IsTUFBYSxjQUFjO0lBVXpCLEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSSxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUNoRSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDaEQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRztnQkFDckIsR0FBRyxFQUFFLE9BQU87Z0JBQ1osTUFBTSxFQUFFLEdBQUc7YUFDRyxDQUFDO1NBQ2xCO1FBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQ2pELEtBQUssRUFBRSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUM7U0FDekIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUc7Z0JBQ3JCLEdBQUcsRUFBRSxPQUFPO2dCQUNaLE1BQU0sRUFBRSxHQUFHO2FBQ0csQ0FBQztTQUNsQjtRQUNELFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsTUFB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