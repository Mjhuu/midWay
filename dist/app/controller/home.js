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
exports.HomeController = exports.sendEmail = void 0;
const midway_1 = require("midway");
const uuidv4_1 = require("uuidv4");
const jwt_1 = require("./../jwt/jwt");
const decorator_1 = require("../decorator");
const common_1 = require("../common");
const svgCaptcha = require('svg-captcha');
const path = require('path');
const fs = require('fs');
// 故名思意 异步二进制 写入流
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入一个虫洞。
const sendToWormhole = require('stream-wormhole');
const dayjs = require('dayjs');
const md5 = require('md5-nodejs');
const nodeMailer = require('nodemailer');
function getCode(length) {
    const codeArr = [1, 3, 4, 2, 6, 7, 5, 9, 8, 0];
    const codeLength = length;
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        code += codeArr[parseInt(String(Math.random() * codeArr.length))];
    }
    return code;
}
const transporter = nodeMailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    // 开启安全连接
    // secure: false,
    secureConnection: true,
    // 用户信息
    auth: {
        user: '1441901570@qq.com',
        pass: 'nyhcoegvmyhmhgei'
    }
});
exports.sendEmail = (toEmail, title = '', text = '', html = '') => {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: '纬领工作平台 <1441901570@qq.com>',
            to: toEmail,
            subject: title,
            text,
            html
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            resolve({
                Message: info.messageId,
                sent: info.response
            });
        });
    });
};
let HomeController = class HomeController {
    async index() {
        await this.ctx.render('index');
    }
    // 获取日志
    async getLogs() {
        let logs = await this.ctx.model.Log.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        let logList = [];
        for (let i in logs) {
            let user_id = logs[i].user_id;
            let userInfo = await this.ctx.model.Employee.findByPk(user_id, {
                attributes: ['username']
            });
            logList.push({
                userInfo,
                logInfo: logs[i]
            });
        }
        this.ctx.body = {
            status: 0, msg: '获取成功', result: {
                logList
            }
        };
    }
    async assessmentLogs() {
        let assessments = await this.ctx.model.Assessment.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        let assessmentList = [];
        for (let i in assessments) {
            let user_id = assessments[i].user_id;
            let userInfo = await this.ctx.model.Employee.findByPk(user_id, {
                attributes: ['username']
            });
            assessmentList.push({
                userInfo,
                assessmentInfo: assessments[i]
            });
        }
        this.ctx.body = {
            status: 0, msg: '获取成功', result: {
                assessmentList
            }
        };
    }
    // 新增月度考核记录
    async addAssessment() {
        const { userid } = this.ctx.headers;
        const { type = 1, dateStart, dateEnd, month, year } = this.ctx.request.body;
        await this.ctx.model.Assessment.create({
            assessment_id: uuidv4_1.uuid().replace(/\-/g, ''),
            user_id: userid,
            month,
            year,
            type,
            beginDate: dateStart,
            endDate: dateEnd
        });
        // 入库结束
        this.ctx.body = {
            status: 0, msg: '考核记录已入库', result: {}
        };
    }
    // 获取月度考核记录
    async assessment() {
        const { userid } = this.ctx.headers;
        const { dateStart, dateEnd, month, year } = this.ctx.query;
        let assessments = await this.ctx.model.query(`SELECT employee.username,employee.user_id,IFNULL(t1.count, 0) veryGoodCount,IFNULL(t2.count, 0) goodCount,IFNULL(t3.count, 0) dontPass FROM employee LEFT JOIN ( SELECT evaluated_id, score, COUNT(*) count FROM week WHERE score = 5 AND startweekdate >= '${dateStart}' AND endweekdate <= '${dateEnd}' GROUP BY evaluated_id ) t1 ON t1.evaluated_id = employee.user_id LEFT JOIN ( SELECT evaluated_id, score, COUNT(*) count FROM week WHERE score = 4.5 AND startweekdate >= '${dateStart}' AND endweekdate <= '${dateEnd}' GROUP BY evaluated_id ) t2 ON t2.evaluated_id = employee.user_id LEFT JOIN ( SELECT evaluated_id, score, COUNT(*) count FROM week WHERE score < 4 AND startweekdate >= '${dateStart}' AND endweekdate <= '${dateEnd}' GROUP BY evaluated_id ) t3 ON t3.evaluated_id = employee.user_id GROUP BY employee.user_id`, { type: this.ctx.model.QueryTypes.SELECT });
        // 将查看信息入库
        this.ctx.model.Employee.findByPk(userid).then(user => {
            this.ctx.model.Assessment.create({
                assessment_id: uuidv4_1.uuid().replace(/\-/g, ''),
                user_id: userid,
                month,
                year,
                beginDate: dateStart,
                endDate: dateEnd
            }).then(data => {
                console.log('记录已入库');
            });
        });
        // 入库结束
        this.ctx.body = {
            status: 0, msg: '考核记录获取成功', result: {
                title: `${year}年度${month}月【${dayjs(dateStart).format('YYYY-MM-DD')}--${dayjs(dateEnd).format('YYYY-MM-DD')}】，员工考核记录汇总表`,
                assessments
            }
        };
    }
    // 获取验证码
    async captcha() {
        const captcha = svgCaptcha.create({
            size: 4,
            ignoreChars: 'oO1il',
            noise: 5,
            height: 44,
        });
        this.ctx.session.captcha = captcha.text.toLocaleLowerCase(); // 设置session captcha 为生成的验证码字符串
        this.ctx.response['type'] = 'svg';
        this.ctx.body = captcha.data;
    }
    /*********************部门Api************************/
    async addDepartment() {
        const { department_description, department_name, creator_id } = this.ctx.request.body;
        let data = await this.ctx.model.Department.findOne({
            where: {
                department_name
            }
        });
        if (data) {
            return this.ctx.body = { status: 500, msg: '已存在同名部门' };
        }
        data = await this.ctx.model.Department.create({
            department_description, department_name, creator_id, department_id: uuidv4_1.uuid().replace(/\-/g, '')
        });
        this.ctx.body = { status: 0, msg: '部门添加成功', result: data };
    }
    async getAllDepartments() {
        const departments = await this.ctx.model.Department.findAll();
        const departmentList = [];
        for (const i in departments) {
            const creator = await this.ctx.model.Employee.findByPk(departments[i].creator_id, {
                attributes: ['user_id', 'username']
            });
            departmentList.push({
                departmentInfo: departments[i],
                creator
            });
        }
        this.ctx.body = { status: 0, msg: '部门列表获取成功', result: { departmentList } };
    }
    async delDepartment() {
        const { department_id } = this.ctx.request.body;
        const department = await this.ctx.model.Department.findOne({
            where: { department_id }
        });
        if (!department) {
            return this.ctx.body = { status: 500, msg: '此部门不存在' };
        }
        await department.destroy();
        this.ctx.body = { status: 0, msg: '部门删除成功' };
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
    async updateDepartment() {
        const { department_id, department_name, department_description } = this.ctx.request.body;
        const department = await this.ctx.model.Department.findOne({
            where: { department_id }
        });
        if (!department) {
            return this.ctx.body = { status: 500, msg: '此部门不存在' };
        }
        department.department_name = department_name;
        department.department_description = department_description;
        await department.save();
        this.ctx.body = { status: 0, msg: '部门信息修改成功' };
    }
    async getDepartmentJobs() {
        const departmentId = this.ctx.params.departmentId;
        const jobs = await this.ctx.model.Job.findAll({
            where: { department_id: departmentId }
        });
        this.ctx.body = { status: 0, msg: '职位获取成功', result: {
                jobList: jobs
            } };
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
    async getJobs() {
        const departments = await this.ctx.model.Department.findAll({
            attributes: ['department_id', 'department_name']
        });
        const departmentList = [];
        for (const i in departments) {
            const jobList = await this.ctx.model.Job.findAll({
                where: {
                    department_id: departments[i].department_id
                },
                attributes: ['job_id', 'job_name']
            });
            departmentList.push({
                departmentInfo: departments[i],
                jobList
            });
        }
        this.ctx.body = { status: 0, msg: '获取成功', result: { departmentList } };
    }
    async addJob() {
        const { job_name, department_id } = this.ctx.request.body;
        let data = await this.ctx.model.Job.findOne({
            where: {
                job_name,
                department_id
            }
        });
        if (data) {
            return this.ctx.body = { status: 500, msg: '此部门已存在此职位' };
        }
        data = await this.ctx.model.Job.create({
            job_name, department_id, job_id: uuidv4_1.uuid().replace(/\-/g, '')
        });
        this.ctx.body = { status: 0, msg: '职位添加成功', result: data };
    }
    async delJob() {
        const { job_id } = this.ctx.request.body;
        const job = await this.ctx.model.Job.findOne({
            where: { job_id }
        });
        if (!job) {
            return this.ctx.body = { status: 500, msg: '此职位不存在' };
        }
        await job.destroy();
        this.ctx.body = { status: 0, msg: '职位删除成功' };
    }
    async updateJob() {
        const { job_id, job_name } = this.ctx.request.body;
        const job = await this.ctx.model.Job.findOne({
            where: { job_id }
        });
        if (!job) {
            return this.ctx.body = { status: 500, msg: '此职位不存在' };
        }
        job.job_name = job_name;
        await job.save();
        this.ctx.body = { status: 0, msg: '职位信息修改成功' };
    }
    async getUserMemos() {
        const userId = this.ctx.params.userId;
        const memos = await this.ctx.model.Memo.findAll({
            where: {
                user_id: userId
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        this.ctx.body = { status: 0, msg: '获取成功', result: { memoList: memos } };
    }
    async addMemo() {
        const { userId } = this.ctx.request.body;
        const data = await this.ctx.model.Memo.create({
            user_id: userId, memo_id: uuidv4_1.uuid().replace(/\-/g, '')
        });
        this.ctx.body = { status: 0, msg: '新增备忘录成功', result: data };
    }
    async updateMemo() {
        const { memoId, content } = this.ctx.request.body;
        const memo = await this.ctx.model.Memo.findOne({
            where: { memo_id: memoId }
        });
        if (!memo) {
            return this.ctx.body = { status: 500, msg: '此备忘录不存在' };
        }
        memo.content = content;
        await memo.save();
        this.ctx.body = { status: 0, msg: '备忘录保存成功' };
    }
    async delMemo() {
        const { memoId } = this.ctx.request.body;
        const memo = await this.ctx.model.Memo.findOne({
            where: { memo_id: memoId }
        });
        if (!memo) {
            return this.ctx.body = { status: 500, msg: '此备忘录不存在' };
        }
        await memo.destroy();
        this.ctx.body = { status: 0, msg: '备忘录删除成功' };
    }
    async getProjectInfo() {
        const projectId = this.ctx.params.projectId;
        const project = await this.ctx.model.Project.findByPk(projectId);
        if (!project) {
            return this.ctx.body = { status: 500, msg: '此项目不存在' };
        }
        // 每个项目的创建者
        const creatorInfo = await this.ctx.model.Employee.findByPk(project.creator_id, {
            attributes: ['username', 'user_id']
        });
        // 获取加入的人
        const peoples = await this.ctx.model.Projectgroup.findAll({
            where: {
                project_id: project.project_id
            }
        });
        const peopleList = [];
        for (const pIndex in peoples) {
            const userInfo = await this.ctx.model.Employee.findByPk(peoples[pIndex].user_id, {
                attributes: ['username', 'user_id', 'head_url', 'leaveOffice', 'email']
            });
            peopleList.push({
                userInfo,
                groupInfo: peoples[pIndex]
            });
        }
        // 获取协同记录
        const twList = [];
        const teamWorks = await this.ctx.model.Teamwork.findAll({
            where: {
                project_id: project.project_id,
                isrefuse: 2,
            }
        });
        for (const tIndex in teamWorks) {
            // 获取帮助的工作记录
            const taskFirst = await this.ctx.model.Taskfirst.findOne({
                where: {
                    tf_id: teamWorks[tIndex].tf_id
                }
            });
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
                attributes: ['username', 'user_id']
            });
            // 获取协同记录的用户信息
            const twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].executor_id, {
                attributes: ['username', 'user_id']
            });
            // 获取创建者信息
            const creatorInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].creator_id, {
                attributes: ['username', 'user_id']
            });
            twList.push({
                taskFirst,
                tfUserInfo,
                twUserInfo,
                creatorInfo,
                teamWork: teamWorks[tIndex]
            });
        }
        // 获取工作记录
        const tfList = [];
        const taskFirsts = await this.ctx.model.Taskfirst.findAll({
            where: {
                project_id: project.project_id
            }
        });
        for (const tfIndex in taskFirsts) {
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].executor_id, {
                attributes: ['username', 'user_id']
            });
            // 获取创建者信息
            const creatorInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].creator_id, {
                attributes: ['username', 'user_id']
            });
            tfList.push({
                tfUserInfo,
                creatorInfo,
                taskFirst: taskFirsts[tfIndex]
            });
        }
        this.ctx.body = { status: 0, msg: '获取项目成功', result: {
                creatorInfo,
                projectInfo: project,
                peopleList,
                twList,
                tfList,
            } };
    }
    async getAllProject() {
        const projects = await this.ctx.model.Project.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        const projectList = [];
        for (const i in projects) {
            const project = projects[i];
            // 每个项目的创建者
            const creatorInfo = await this.ctx.model.Employee.findByPk(project.creator_id, {
                attributes: ['username', 'user_id']
            });
            // 获取加入的人
            const peoples = await this.ctx.model.Projectgroup.findAll({
                where: {
                    project_id: project.project_id
                }
            });
            const peopleList = [];
            for (const pIndex in peoples) {
                const userInfo = await this.ctx.model.Employee.findByPk(peoples[pIndex].user_id, {
                    attributes: ['username', 'user_id', 'head_url']
                });
                peopleList.push({
                    userInfo,
                    groupInfo: peoples[pIndex]
                });
            }
            projectList.push({
                creatorInfo,
                projectInfo: project,
                peopleList,
            });
        }
        this.ctx.body = { status: 0, msg: '获取成功', result: { projectList } };
    }
    async addProject() {
        const { userId, bgcolor, project_name, project_description, starttime, endtime, status } = this.ctx.request.body;
        const data = await this.ctx.model.Project.findOne({
            where: {
                project_name
            }
        });
        if (data) {
            return this.ctx.body = { status: 500, msg: '此项目已存在' };
        }
        const project = await this.ctx.model.Project.create({
            creator_id: userId, bgcolor, project_name, project_description, starttime, endtime, status, project_id: uuidv4_1.uuid().replace(/\-/g, '')
        });
        this.ctx.body = { status: 0, msg: '新增项目成功', result: project };
    }
    async updateProject() {
        const { project_id, bgcolor, project_name, project_description, endtime, starttime, status, fileList = '' } = this.ctx.request.body;
        const project = await this.ctx.model.Project.findOne({
            where: { project_id }
        });
        if (!project) {
            return this.ctx.body = { status: 500, msg: '此项目不存在' };
        }
        project.bgcolor = bgcolor;
        project.project_name = project_name;
        project.project_description = project_description;
        project.endtime = endtime;
        project.starttime = starttime;
        project.status = status;
        project.fileList = fileList ? JSON.stringify(fileList) : fileList;
        await project.save();
        this.ctx.body = { status: 0, msg: '项目保存成功' };
    }
    async delProject() {
        const { project_id } = this.ctx.request.body;
        const project = await this.ctx.model.Project.findOne({
            where: { project_id }
        });
        if (!project) {
            return this.ctx.body = { status: 500, msg: '此项目不存在' };
        }
        await project.destroy();
        this.ctx.body = { status: 0, msg: '项目删除成功' };
    }
    async joinProject() {
        const { user_role, user_id, project_id } = this.ctx.request.body;
        const data = await this.ctx.model.Projectgroup.findOne({
            where: {
                user_id,
                project_id
            }
        });
        if (data) {
            return this.ctx.body = { status: 500, msg: '此成员已加入此项目' };
        }
        const projectGroup = await this.ctx.model.Projectgroup.create({
            user_role, user_id, project_id
        });
        this.ctx.body = { status: 0, msg: '加入项目成功', result: projectGroup };
    }
    async exitProject() {
        const { user_id, project_id } = this.ctx.request.body;
        const data = await this.ctx.model.Projectgroup.findOne({
            where: {
                user_id,
                project_id
            }
        });
        if (!data) {
            return this.ctx.body = { status: 500, msg: '此成员已退出此项目' };
        }
        await data.destroy();
        this.ctx.body = { status: 0, msg: '成功将此成员踢出项目' };
    }
    async getUserProjectJob() {
        const userId = this.ctx.params.userId;
        const projectId = this.ctx.params.projectId;
        const data = await this.ctx.model.Projectgroup.findOne({
            where: {
                user_id: userId,
                project_id: projectId
            }
        });
        if (!data) {
            return this.ctx.body = { status: 500, msg: '此成员已退出此项目' };
        }
        // 获取协同记录
        const twList = [];
        const teamWorks = await this.ctx.model.Teamwork.findAll({
            where: {
                project_id: projectId,
                executor_id: userId,
                isrefuse: 2,
            }
        });
        for (const tIndex in teamWorks) {
            // 获取帮助的工作记录
            const taskFirst = await this.ctx.model.Taskfirst.findOne({
                where: {
                    tf_id: teamWorks[tIndex].tf_id
                }
            });
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
                attributes: ['username', 'user_id']
            });
            // 获取协同记录的用户信息
            const twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].executor_id, {
                attributes: ['username', 'user_id']
            });
            // 获取创建者信息
            const creatorInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].creator_id, {
                attributes: ['username', 'user_id']
            });
            twList.push({
                taskFirst,
                tfUserInfo,
                twUserInfo,
                creatorInfo,
                teamWork: teamWorks[tIndex]
            });
        }
        // 获取工作记录
        const tfList = [];
        const taskFirsts = await this.ctx.model.Taskfirst.findAll({
            where: {
                project_id: projectId,
                executor_id: userId
            }
        });
        for (const tfIndex in taskFirsts) {
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].executor_id, {
                attributes: ['username', 'user_id']
            });
            // 获取创建者信息
            const creatorInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].creator_id, {
                attributes: ['username', 'user_id']
            });
            tfList.push({
                tfUserInfo,
                creatorInfo,
                taskFirst: taskFirsts[tfIndex]
            });
        }
        this.ctx.body = { status: 0, msg: '获取项目成功', result: {
                twList,
                tfList,
            } };
    }
    async getJoinProjects() {
        const userId = this.ctx.params.userId;
        const { Op } = this.ctx.app['Sequelize'];
        // 获取加入的所有项目
        const joinProjects = await this.ctx.model.Projectgroup.findAll({
            where: { user_id: userId }
        });
        const projectIdArr = [];
        for (const j in joinProjects) {
            projectIdArr.push(joinProjects[j].project_id);
        }
        const projects = await this.ctx.model.Project.findAll({
            where: {
                project_id: { [Op.in]: projectIdArr },
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        const projectList = [];
        for (const i in projects) {
            const project = projects[i];
            // 每个项目的创建者
            const creatorInfo = await this.ctx.model.Employee.findByPk(project.creator_id, {
                attributes: ['username', 'user_id']
            });
            // 获取加入的人
            const peoples = await this.ctx.model.Projectgroup.findAll({
                where: {
                    project_id: project.project_id
                }
            });
            const peopleList = [];
            for (const pIndex in peoples) {
                const userInfo = await this.ctx.model.Employee.findByPk(peoples[pIndex].user_id, {
                    attributes: ['username', 'user_id', 'head_url']
                });
                peopleList.push({
                    userInfo,
                    groupInfo: peoples[pIndex]
                });
            }
            projectList.push({
                creatorInfo,
                projectInfo: project,
                peopleList,
            });
        }
        this.ctx.body = { status: 0, msg: '获取成功', result: { projectList } };
    }
    async addJobLogging() {
        try {
            // type === 0 ? '自己' : '领导'
            const { status, tf_content, creator_id, creator_role, urgent, executor_id, project_id, description, teamWorkList, type = 0, createdAt } = this.ctx.request.body;
            let jobLogging;
            // 如果没有选择项目
            if (project_id === 'null') {
                jobLogging = await this.ctx.model.Taskfirst.create({
                    tf_id: uuidv4_1.uuid().replace(/\-/g, ''), status, tf_content, creator_id, creator_role, urgent, executor_id, description, createdAt: new Date(createdAt)
                });
            }
            else { // 如果选择了项目
                jobLogging = await this.ctx.model.Taskfirst.create({
                    tf_id: uuidv4_1.uuid().replace(/\-/g, ''), status, tf_content, creator_id, creator_role, urgent, executor_id, description, project_id, createdAt: new Date(createdAt)
                });
            }
            // 获取任务记录ID
            const tf_id = jobLogging.tf_id;
            // 循环遍历协作写入库
            for (const i in teamWorkList) {
                const { status, content, urgent, executor_id, creator_id, creator_role, project_id, createdAt } = teamWorkList[i];
                if (project_id === 'null') {
                    await this.ctx.model.Teamwork.create({ tw_id: uuidv4_1.uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
                    });
                }
                else {
                    await this.ctx.model.Teamwork.create({ tw_id: uuidv4_1.uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
                    });
                }
            }
            this.ctx.body = { status: 0, msg: '任务记录添加成功', result: {} };
        }
        catch (e) {
            this.ctx.body = { status: 500, msg: '任务记录添加失败', result: e };
        }
    }
    async getDayJobLogging() {
        const userId = this.ctx.query.userId;
        const timeStart = this.ctx.query.timeStart;
        const timeEnd = this.ctx.query.timeEnd;
        const { Op } = this.ctx.app['Sequelize'];
        // 获取我的协同记录
        const twList = [];
        const teamWorks = await this.ctx.model.Teamwork.findAll({
            where: {
                executor_id: userId,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
                isrefuse: {
                    [Op.ne]: 1,
                },
            }
        });
        for (const tIndex in teamWorks) {
            // 获取帮助的工作记录
            const taskFirst = await this.ctx.model.Taskfirst.findOne({
                where: {
                    tf_id: teamWorks[tIndex].tf_id
                }
            });
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
                attributes: ['username', 'user_id', 'head_url', 'role']
            });
            // 获取协同记录的用户信息
            const twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].executor_id, {
                attributes: ['username', 'user_id', 'head_url', 'role']
            });
            // 获取创建者信息
            const creatorInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].creator_id, {
                attributes: ['username', 'user_id', 'head_url', 'role']
            });
            // 获取项目信息
            const project = await this.ctx.model.Project.findByPk(teamWorks[tIndex].project_id);
            twList.push({
                taskFirst,
                tfUserInfo,
                twUserInfo,
                creatorInfo,
                project,
                teamWork: teamWorks[tIndex]
            });
        }
        // 获取工作记录
        const tfList = [];
        const taskFirsts = await this.ctx.model.Taskfirst.findAll({
            where: {
                executor_id: userId,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
            }
        });
        for (const tfIndex in taskFirsts) {
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].executor_id, {
                attributes: ['username', 'user_id', 'head_url', 'role']
            });
            // 获取创建者信息
            const creatorInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].creator_id, {
                attributes: ['username', 'user_id', 'head_url', 'role']
            });
            // 获取项目信息
            const project1 = await this.ctx.model.Project.findByPk(taskFirsts[tfIndex].project_id);
            // 获取此工作记录的协同列表信息
            const twList1 = [];
            const teamWorks1 = await this.ctx.model.Teamwork.findAll({
                where: {
                    tf_id: taskFirsts[tfIndex].tf_id,
                }
            });
            for (const tIndex in teamWorks1) {
                // 获取协同记录的用户信息
                const twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks1[tIndex].executor_id, {
                    attributes: ['username', 'user_id', 'head_url', 'role']
                });
                twList1.push({
                    twUserInfo,
                    teamWork: teamWorks1[tIndex]
                });
            }
            tfList.push({
                tfUserInfo,
                creatorInfo,
                project: project1,
                taskFirst: taskFirsts[tfIndex],
                twList: twList1
            });
        }
        this.ctx.body = { status: 0, msg: '获取任务列表成功', result: {
                twList,
                tfList,
            } };
    }
    async getWeekJobLoggings() {
        const userId = this.ctx.request.body.userId;
        const weekArr = this.ctx.request.body.weekArr;
        const weekList = [];
        const { Op } = this.ctx.app['Sequelize'];
        for (const i in weekArr) {
            let { timeStart, timeEnd, week } = weekArr[i];
            timeStart = new Date(timeStart);
            timeEnd = new Date(timeEnd);
            // 获取总任务数
            let total = 0;
            const tfTotal = await this.ctx.model.Taskfirst.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                }
            });
            const twTotal = await this.ctx.model.Teamwork.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    isrefuse: {
                        [Op.ne]: 1,
                    },
                }
            });
            total = tfTotal + twTotal;
            // 获取正在进行总
            let finishingCount = 0;
            const tfFinishingCount = await this.ctx.model.Taskfirst.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    status: 1
                }
            });
            const twFinishingCount = await this.ctx.model.Teamwork.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    isrefuse: {
                        [Op.ne]: 1,
                    },
                    status: 1
                }
            });
            finishingCount = tfFinishingCount + twFinishingCount;
            // 获取已完成数
            let finishedCount = 0;
            const tfFinishedCount = await this.ctx.model.Taskfirst.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    status: 2
                }
            });
            const twFinishedCount = await this.ctx.model.Teamwork.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    isrefuse: {
                        [Op.ne]: 1,
                    },
                    status: 2
                }
            });
            finishedCount = tfFinishedCount + twFinishedCount;
            // 获取未完成数
            let unfinishedCount = 0;
            const tfUnfinishedCount = await this.ctx.model.Taskfirst.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    status: 3
                }
            });
            const twUnfinishedCount = await this.ctx.model.Teamwork.count({
                where: {
                    executor_id: userId,
                    createdAt: {
                        [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                    },
                    isrefuse: {
                        [Op.ne]: 1,
                    },
                    status: 3
                }
            });
            unfinishedCount = tfUnfinishedCount + twUnfinishedCount;
            weekList.push({
                timeStart, timeEnd, week, total, finishingCount, finishedCount, unfinishedCount
            });
        }
        this.ctx.body = { status: 0, msg: '获取任务列表成功', result: {
                weekList
            } };
    }
    async getMonthUnfinishedJobLogging() {
        const userId = this.ctx.query.userId;
        const timeStart = this.ctx.query.timeStart;
        const timeEnd = this.ctx.query.timeEnd;
        const { Op } = this.ctx.app['Sequelize'];
        // 获取我的协同记录
        const twList = [];
        const teamWorks = await this.ctx.model.Teamwork.findAll({
            where: {
                executor_id: userId,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
                status: {
                    [Op.ne]: 2,
                },
                isrefuse: {
                    [Op.ne]: 1,
                },
            }
        });
        for (const tIndex in teamWorks) {
            // 获取帮助的工作记录
            const taskFirst = await this.ctx.model.Taskfirst.findOne({
                where: {
                    tf_id: teamWorks[tIndex].tf_id
                }
            });
            // 获取此工作记录的用户信息
            const tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
                attributes: ['username', 'user_id', 'head_url', 'role']
            });
            twList.push({
                tfUserInfo,
                teamWork: teamWorks[tIndex]
            });
        }
        // 获取工作记录
        const taskFirsts = await this.ctx.model.Taskfirst.findAll({
            where: {
                executor_id: userId,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
                status: {
                    [Op.ne]: 2,
                },
            }
        });
        this.ctx.body = { status: 0, msg: '获取任务列表成功', result: {
                twList,
                tfList: taskFirsts,
            } };
    }
    async getDateProgress(timeStart, timeEnd, userId) {
        timeStart = new Date(timeStart);
        timeEnd = new Date(timeEnd);
        const { Op } = this.ctx.app['Sequelize'];
        let total = 0;
        const tfTotal = await this.ctx.model.Taskfirst.count({
            where: {
                executor_id: userId,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
            }
        });
        const twTotal = await this.ctx.model.Teamwork.count({
            where: {
                executor_id: userId,
                isrefuse: {
                    [Op.ne]: 1,
                },
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
            }
        });
        total = tfTotal + twTotal;
        // 获取已完成数
        let finishedCount = 0;
        const tfFinishedCount = await this.ctx.model.Taskfirst.count({
            where: {
                executor_id: userId,
                status: 2,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
            }
        });
        const twFinishedCount = await this.ctx.model.Teamwork.count({
            where: {
                executor_id: userId,
                isrefuse: {
                    [Op.ne]: 1,
                },
                status: 2,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
            }
        });
        finishedCount = tfFinishedCount + twFinishedCount;
        return (finishedCount / total) * 100;
    }
    async getJobProgress() {
        const userId = this.ctx.request.body.userId;
        const dayArr = this.ctx.request.body.dayArr;
        const weekArr = this.ctx.request.body.weekArr;
        const monthArr = this.ctx.request.body.monthArr;
        const progressList = [];
        const { Op } = this.ctx.app['Sequelize'];
        // 日
        const dayProgress = await this.getDateProgress(dayArr[0], dayArr[1], userId);
        progressList.push({
            title: '日工作完成度',
            progress: dayProgress
        });
        // 周
        const weekProgress = await this.getDateProgress(weekArr[0], weekArr[1], userId);
        progressList.push({
            title: '周工作完成度',
            progress: weekProgress
        });
        // 月
        const monthProgress = await this.getDateProgress(monthArr[0], monthArr[1], userId);
        progressList.push({
            title: '月工作完成度',
            progress: monthProgress
        });
        // 总进度
        let totalProgress = 0;
        let total = 0;
        const tfTotal = await this.ctx.model.Taskfirst.count({
            where: {
                executor_id: userId,
            }
        });
        const twTotal = await this.ctx.model.Teamwork.count({
            where: {
                executor_id: userId,
                isrefuse: {
                    [Op.ne]: 1,
                },
            }
        });
        total = tfTotal + twTotal;
        // 获取已完成数
        let finishedCount = 0;
        const tfFinishedCount = await this.ctx.model.Taskfirst.count({
            where: {
                executor_id: userId,
                status: 2
            }
        });
        const twFinishedCount = await this.ctx.model.Teamwork.count({
            where: {
                executor_id: userId,
                isrefuse: {
                    [Op.ne]: 1,
                },
                status: 2
            }
        });
        finishedCount = tfFinishedCount + twFinishedCount;
        totalProgress = (finishedCount / total) * 100;
        progressList.push({
            title: '总工作完成度',
            progress: totalProgress
        });
        this.ctx.body = { status: 0, msg: '获取任务进度成功', result: {
                progressList
            } };
    }
    async updateTeamWork() {
        const { tw_id, twInfo, fileInfo = '', type = 1 } = this.ctx.request.body;
        const teamWork = await this.ctx.model.Teamwork.findOne({
            where: { tw_id }
        });
        if (!teamWork) {
            return this.ctx.body = { status: 500, msg: '协同记录不存在' };
        }
        for (const i in twInfo) {
            teamWork[i] = twInfo[i];
        }
        if (fileInfo) {
            if (type === 1) {
                let oldList = teamWork.fileList ? JSON.parse(teamWork.fileList) : [];
                oldList.push(fileInfo);
                teamWork.fileList = JSON.stringify(oldList);
            }
            else {
                teamWork.fileList = JSON.stringify(fileInfo);
            }
        }
        await teamWork.save();
        this.ctx.body = { status: 0, msg: '协同信息修改成功' };
    }
    async delTeamWork() {
        const { tw_id } = this.ctx.request.body;
        const teamWork = await this.ctx.model.Teamwork.findOne({
            where: { tw_id }
        });
        if (!teamWork) {
            return this.ctx.body = { status: 500, msg: '协同记录不存在' };
        }
        await teamWork.destroy();
        this.ctx.body = { status: 0, msg: '协同记录删除成功' };
    }
    async addTeamWork() {
        const { status, content, urgent, executor_id, creator_id, creator_role, project_id, tf_id, type = 0, createdAt } = this.ctx.request.body;
        if (project_id === 'null') {
            await this.ctx.model.Teamwork.create({ tw_id: uuidv4_1.uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
            });
        }
        else {
            await this.ctx.model.Teamwork.create({ tw_id: uuidv4_1.uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
            });
        }
        this.ctx.body = { status: 0, msg: '协同记录添加成功' };
    }
    async updateJobLogging() {
        const { tf_id, tfInfo, fileInfo = '', type = 1 } = this.ctx.request.body;
        const taskfirst = await this.ctx.model.Taskfirst.findOne({
            where: { tf_id }
        });
        if (!taskfirst) {
            return this.ctx.body = { status: 500, msg: '任务记录不存在' };
        }
        for (const i in tfInfo) {
            taskfirst[i] = tfInfo[i];
        }
        if (fileInfo) {
            if (type === 1) {
                let oldList = taskfirst.fileList ? JSON.parse(taskfirst.fileList) : [];
                oldList.push(fileInfo);
                taskfirst.fileList = JSON.stringify(oldList);
            }
            else {
                taskfirst.fileList = JSON.stringify(fileInfo);
            }
        }
        await taskfirst.save();
        this.ctx.body = { status: 0, msg: '任务信息修改成功' };
    }
    async delJobLogging() {
        const { tf_id } = this.ctx.request.body;
        const taskfirst = await this.ctx.model.Taskfirst.findOne({
            where: { tf_id }
        });
        if (!taskfirst) {
            return this.ctx.body = { status: 500, msg: '任务记录不存在' };
        }
        await taskfirst.destroy();
        this.ctx.body = { status: 0, msg: '任务记录删除成功' };
    }
    async getWeekEvaluate() {
        let { evaluated_id, startweekdate, endweekdate, } = this.ctx.query;
        startweekdate = new Date(startweekdate);
        endweekdate = new Date(endweekdate);
        const data = await this.ctx.model.Week.findOne({
            where: {
                startweekdate, endweekdate, evaluated_id
            }
        });
        if (!data) {
            return this.ctx.body = { status: 500, msg: '评语不存在' };
        }
        this.ctx.body = { status: 0, msg: '评语获取成功', result: data, };
    }
    async addWeekEvaluate() {
        let { score, evaluate = '', startweekdate, endweekdate, evaluator_id, evaluated_id, leader_next_week_plan = '', myself_next_week_plan = '', weekly_summary = '', fileInfo = '', type = 1 } = this.ctx.request.body;
        startweekdate = new Date(startweekdate);
        endweekdate = new Date(endweekdate);
        let data = await this.ctx.model.Week.findOne({
            where: {
                startweekdate, endweekdate, evaluated_id
            }
        });
        if (data) {
            if (score) {
                data.score = score;
            }
            if (evaluate) {
                data.evaluate = evaluate;
            }
            if (leader_next_week_plan) {
                data.leader_next_week_plan = leader_next_week_plan;
            }
            if (myself_next_week_plan) {
                data.myself_next_week_plan = myself_next_week_plan;
            }
            if (weekly_summary) {
                data.weekly_summary = weekly_summary;
            }
            if (evaluator_id) {
                data.evaluator_id = evaluator_id;
            }
            if (fileInfo) {
                if (type === 1) {
                    let oldList = data.fileList ? JSON.parse(data.fileList) : [];
                    oldList.push(fileInfo);
                    data.fileList = JSON.stringify(oldList);
                }
                else {
                    data.fileList = JSON.stringify(fileInfo);
                }
            }
            await data.save();
        }
        else {
            if (score) {
                data = await this.ctx.model.Week.create({
                    score, evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id, week_id: uuidv4_1.uuid().replace(/\-/g, ''), leader_next_week_plan, myself_next_week_plan, weekly_summary
                });
            }
            else {
                data = await this.ctx.model.Week.create({
                    evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id, week_id: uuidv4_1.uuid().replace(/\-/g, ''), leader_next_week_plan, myself_next_week_plan, weekly_summary
                });
            }
        }
        this.ctx.body = { status: 0, msg: '保存成功' };
    }
    async updateNotice() {
        const { notice_id } = this.ctx.request.body;
        const data = await this.ctx.model.Notice.findOne({
            where: {
                notice_id
            }
        });
        if (!data) {
            return this.ctx.body = { status: 500, msg: '此提醒不存在' };
        }
        data.isRead = 1;
        await data.save();
        this.ctx.body = { status: 0, msg: '已读成功' };
    }
    async getAllNotices() {
        const notices = await this.ctx.model.Notice.findAll({
            where: {
                isRead: 0,
            },
            order: [
                ['createdAt', 'DESC']
            ],
        });
        const noticeList = [];
        for (const i in notices) {
            const userInfo = await this.ctx.model.Employee.findByPk(notices[i].reminder_id, {
                attributes: ['username', 'user_id', 'role', 'head_url']
            });
            noticeList.push({
                reminderInfo: userInfo,
                notice: notices[i]
            });
        }
        this.ctx.body = { status: 0, msg: '未读消息获取成功', result: { noticeList } };
    }
    async addNotice() {
        const { reminder_id, message } = this.ctx.request.body;
        let data = await this.ctx.model.Notice.findOne({
            where: {
                message, reminder_id
            }
        });
        if (data) {
            return this.ctx.body = { status: 500, msg: '你已经提醒过一次了' };
        }
        data = await this.ctx.model.Notice.create({
            reminder_id, message, notice_id: uuidv4_1.uuid().replace(/\-/g, '')
        });
        this.ctx.body = { status: 0, msg: '提醒成功' };
    }
    async uploadFile() {
        const { ctx } = this;
        // 获取文件流
        const stream = await ctx.getFileStream();
        const { userId } = ctx.query;
        // 基础的目录
        const uploadBasePath = './../public/upload';
        // 生成文件名
        const filename = `${Date.now()}${Number.parseInt(String(Math.random() * 1000))}${path.extname(stream.filename).toLocaleLowerCase()}`;
        // 生成文件夹
        const dirname = (userId ? userId : 'null') + '/' + dayjs(Date.now()).format('YYYY/MM/DD');
        function mkdirsSync(dirname) {
            if (fs.existsSync(dirname)) {
                return true;
            }
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
        mkdirsSync(path.join(__dirname, uploadBasePath, dirname));
        // 生成写入路径
        const target = path.join(__dirname, uploadBasePath, dirname, filename);
        // 写入流
        const writeStream = fs.createWriteStream(target);
        try {
            // 异步把文件流 写入
            await awaitWriteStream(stream.pipe(writeStream));
        }
        catch (err) {
            // 如果出现错误，关闭管道
            await sendToWormhole(stream);
            ctx.body = {
                msg: '文件上传失败',
                result: err,
                status: 500,
            };
        }
        ctx.body = {
            result: {
                url: path.join('/upload', dirname, filename)
            },
            msg: '文件上传成功',
            fields: stream.fields,
            status: 0,
        };
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
    async sendCode() {
        try {
            const { email: toEmail } = this.ctx.request.body;
            const code = getCode(6);
            const data = await exports.sendEmail(toEmail, 'WEBLINKON验证码', `【纬领工作平台平台】您的邮箱验证码是：${code}。验证码有效期：1分钟。工作人员不会向您索要，索要验证码的都是骗子，如非本人操作请忽略。`);
            this.ctx.session.yzm = code; // 设置session captcha 为生成的验证码字符串
            this.ctx.body = {
                status: 0,
                msg: '验证码发送成功',
                result: data
            };
        }
        catch (e) {
            this.ctx.body = {
                msg: '邮箱发送失败',
                status: 500,
                result: e
            };
        }
    }
    async sendEmail() {
        try {
            const { email: toEmail, title, text, html } = this.ctx.request.body;
            const data = await exports.sendEmail(toEmail, title, text, html);
            this.ctx.body = {
                status: 0,
                msg: '邮箱发送成功',
                result: data
            };
        }
        catch (e) {
            this.ctx.body = {
                msg: '邮箱发送失败',
                status: 500,
                result: e
            };
        }
    }
};
__decorate([
    midway_1.inject(),
    __metadata("design:type", Object)
], HomeController.prototype, "ctx", void 0);
__decorate([
    midway_1.inject('userService'),
    __metadata("design:type", Object)
], HomeController.prototype, "service", void 0);
__decorate([
    midway_1.get('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "index", null);
__decorate([
    midway_1.get('/logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getLogs", null);
__decorate([
    midway_1.get('/assessmentLogs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "assessmentLogs", null);
__decorate([
    midway_1.post('/assessment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addAssessment", null);
__decorate([
    midway_1.get('/assessment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "assessment", null);
__decorate([
    midway_1.get('/captcha'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "captcha", null);
__decorate([
    midway_1.post('/department'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addDepartment", null);
__decorate([
    midway_1.get('/departments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getAllDepartments", null);
__decorate([
    midway_1.del('/department'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delDepartment", null);
__decorate([
    midway_1.del('/user'),
    decorator_1.actionOtherLog({
        first: '进行了删除',
        second: '员工操作',
        userId: 'userId'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delUser", null);
__decorate([
    midway_1.put('/department'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateDepartment", null);
__decorate([
    midway_1.get('/jobs/:departmentId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getDepartmentJobs", null);
__decorate([
    midway_1.get('/users/:departmentId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getDepartmentUsers", null);
__decorate([
    midway_1.get('/jobs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getJobs", null);
__decorate([
    midway_1.post('/job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addJob", null);
__decorate([
    midway_1.del('/job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delJob", null);
__decorate([
    midway_1.put('/job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateJob", null);
__decorate([
    midway_1.get('/memos/:userId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getUserMemos", null);
__decorate([
    midway_1.post('/memo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addMemo", null);
__decorate([
    midway_1.put('/memo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateMemo", null);
__decorate([
    midway_1.del('/memo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delMemo", null);
__decorate([
    midway_1.get('/project/:projectId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getProjectInfo", null);
__decorate([
    midway_1.get('/projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getAllProject", null);
__decorate([
    midway_1.post('/project'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addProject", null);
__decorate([
    midway_1.put('/project'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateProject", null);
__decorate([
    midway_1.del('/project'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delProject", null);
__decorate([
    midway_1.post('/project/join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "joinProject", null);
__decorate([
    midway_1.del('/project/exit'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "exitProject", null);
__decorate([
    midway_1.get('/job_logging/:userId/:projectId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getUserProjectJob", null);
__decorate([
    midway_1.get('/projects/:userId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getJoinProjects", null);
__decorate([
    midway_1.post('/job_logging'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addJobLogging", null);
__decorate([
    midway_1.get('/job_logging/day'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getDayJobLogging", null);
__decorate([
    midway_1.post('/job_logging/week'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getWeekJobLoggings", null);
__decorate([
    midway_1.get('/job_loggings/month'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getMonthUnfinishedJobLogging", null);
__decorate([
    midway_1.post('/job_progress'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getJobProgress", null);
__decorate([
    midway_1.put('/job_together'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateTeamWork", null);
__decorate([
    midway_1.del('/job_together'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delTeamWork", null);
__decorate([
    midway_1.post('/job_together'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addTeamWork", null);
__decorate([
    midway_1.put('/job_logging'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateJobLogging", null);
__decorate([
    midway_1.del('/job_logging'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "delJobLogging", null);
__decorate([
    midway_1.get('/week'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getWeekEvaluate", null);
__decorate([
    midway_1.post('/week'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addWeekEvaluate", null);
__decorate([
    midway_1.put('/notice'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "updateNotice", null);
__decorate([
    midway_1.get('/notices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getAllNotices", null);
__decorate([
    midway_1.post('/notice'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "addNotice", null);
__decorate([
    midway_1.post('/uploadFile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "uploadFile", null);
__decorate([
    midway_1.post('/login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "login", null);
__decorate([
    midway_1.get('/updateToken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HomeController.prototype, "updateToken", null);
__decorate([
    midway_1.post('/sendCode'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "sendCode", null);
__decorate([
    midway_1.post('/sendEmail'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "sendEmail", null);
HomeController = __decorate([
    midway_1.provide(),
    midway_1.controller('/')
], HomeController);
exports.HomeController = HomeController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9tZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29udHJvbGxlci9ob21lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUFtRjtBQUVuRixtQ0FBOEI7QUFDOUIsc0NBQWlDO0FBQ2pDLDRDQUE0QztBQUM1QyxzQ0FBa0M7QUFDbEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsaUJBQWlCO0FBQ2pCLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxDQUFDO0FBQzdELFlBQVk7QUFDWixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNsRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV6QyxTQUFTLE9BQU8sQ0FBQyxNQUFNO0lBQ3JCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0MsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDO0lBQzFCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbkMsSUFB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