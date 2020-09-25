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
const jwt_1 = require("../jwt/jwt");
const common_1 = require("../common");
const md5 = require('md5-nodejs');
let UserController = class UserController {
    updateToken() {
        const oldToken = this.ctx.headers.token;
        const jwt1 = new jwt_1.Jwt(oldToken);
        const result = jwt1.verifyToken();
        const uuid = result.userId;
        const jwt2 = new jwt_1.Jwt({
            userId: uuid
        });
        const token = jwt2.generateToken();
        this.ctx.body = { status: 0, msg: 'token更新成功', token };
    }
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
    async getDepartmentUsers() {
        const { Op } = this.ctx.app['Sequelize'];
        let departmentId = this.ctx.params.departmentId;
        const keyword = this.ctx.query.keyword || '';
        if (departmentId === '-1') {
            departmentId = '';
        }
        const userList = [];
        // 获取部门信息
        const departments = await this.ctx.model.Department.findAll({
            where: { department_id: { [Op.like]: `%${departmentId}%` } },
            attributes: ['department_id', 'department_name']
        });
        for (const index in departments) {
            // 获取所有职位
            const jobs = await this.ctx.model.Job.findAll({
                where: { department_id: departments[index].department_id }
            });
            const jobIdArr = [];
            for (const i in jobs) {
                jobIdArr.push(jobs[i].job_id);
            }
            const userArr = await this.ctx.model.Employee.findAll({
                where: {
                    job_id: { [Op.in]: jobIdArr },
                    username: { [Op.like]: `%${keyword}%` }
                },
                attributes: { exclude: ['password'] },
                order: [
                    ['createdAt', 'DESC']
                ],
            });
            const users = [];
            for (const userIndex in userArr) {
                const jobInfo = await this.ctx.model.Job.findByPk(userArr[userIndex].job_id, {
                    attributes: ['job_id', 'job_name', 'department_id']
                });
                users.push({
                    userInfo: userArr[userIndex],
                    jobInfo
                });
            }
            userList.push({
                departmentInfo: departments[index],
                users
            });
        }
        this.ctx.body = { status: 0, msg: '职位获取成功', result: {
                userList
            } };
    }
    async delUser() {
        const { userId } = this.ctx.request.body;
        const user = await this.ctx.model.Employee.findOne({
            where: { user_id: userId }
        });
        if (!user) {
            return this.ctx.body = { status: 500, msg: '此员工不存在' };
        }
        await user.destroy();
        this.ctx.body = { status: 0, msg: '员工删除成功' };
    }
    async login() {
        let { username, password, verifycode: captcha } = this.ctx.request.body;
        if (!this.ctx.session.captcha) {
            return this.ctx.body = {
                msg: '验证码已过期',
                status: 500,
            };
        }
        if (captcha.toUpperCase() !== this.ctx.session.captcha.toUpperCase()) {
            return this.ctx.body = {
                msg: '验证码错误',
                status: 500,
            };
        }
        password = md5(password);
        const data = await this.ctx.model.Employee.findOne({
            where: { username, password }
        });
        if (!data) {
            return this.ctx.body = {
                msg: '用户名或密码错误',
                status: 500,
            };
        }
        if (data.leaveOffice === 1) {
            return this.ctx.body = { status: 500, msg: '你已离职，无权使用系统' };
        }
        const user = await this.service.getUser({ id: data.user_id });
        const jwt = new jwt_1.Jwt({
            userId: data.user_id
        });
        const token = jwt.generateToken();
        // 登录日志
        this.ctx.model.Log.create({
            log_id: uuidv4_1.uuid().replace(/\-/g, ''),
            user_id: data.user_id,
            ip: this.ctx.request.ip,
            do_thing: '进行了登录操作',
            type: common_1.JobType.login
        }).then(data => {
            console.log('log记录已入库');
        }).catch(e => console.error(e));
        this.ctx.body = { status: 0, msg: '用户信息获取成功', result: user.result, token };
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
    midway_1.get('/updateToken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserController.prototype, "updateToken", null);
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
__decorate([
    midway_1.get('/all/:departmentId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getDepartmentUsers", null);
__decorate([
    midway_1.del('/'),
    decorator_1.actionOtherLog({
        first: '进行了删除',
        second: '员工操作',
        userId: 'userId'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "delUser", null);
__decorate([
    midway_1.post('/login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
UserController = __decorate([
    midway_1.provide(),
    midway_1.controller('/user')
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29udHJvbGxlci91c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUFpRjtBQUVqRixtQ0FBNEI7QUFDNUIsNENBQXVEO0FBQ3ZELG9DQUErQjtBQUMvQixzQ0FBa0M7QUFDbEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBSWxDLElBQWEsY0FBYyxHQUEzQixNQUFhLGNBQWM7SUFTekIsV0FBVztRQUNULE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN4QyxNQUFNLElBQUksR0FBRyxJQUFJLFNBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLFNBQUcsQ0FBQztZQUNuQixNQUFNLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQztRQUNILE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUN2RCxDQUFDO0lBSUQsS0FBSyxDQUFDLFNBQVM7UUFDYixJQUFJLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2hFLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FB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