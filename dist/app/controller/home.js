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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9tZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29udHJvbGxlci9ob21lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUFtRjtBQUVuRixtQ0FBOEI7QUFDOUIsc0NBQWlDO0FBQ2pDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMxQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLGlCQUFpQjtBQUNqQixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUM3RCxZQUFZO0FBQ1osTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDbEQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFekMsU0FBUyxPQUFPLENBQUMsTUFBTTtJQUNyQixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9DLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztJQUMxQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7SUFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ25DLElBQUksSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFD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