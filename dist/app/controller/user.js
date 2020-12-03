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
        const { userId, username, mobile, telphone, head_url, gender, email = '', job_id = '', role = '', joinTime = '', leaveOffice, weblink_admin } = this.ctx.request.body;
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
        if (weblink_admin !== undefined) {
            data.weblink_admin = weblink_admin;
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
        let { headUrl, password, role, email, username, telphone, mobile, joinTime, jobId, gender, weblink_admin } = this.ctx.request.body;
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
            head_url: headUrl, password, weblink_admin, role, email, username, telphone, mobile, join_time: joinTime, job_id: jobId, gender, user_id: uuidv4_1.uuid().replace(/\-/g, '')
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