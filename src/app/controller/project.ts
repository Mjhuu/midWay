import {Context, controller, del, get, inject, post, provide, put,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/project')
export class ProjectController {

    @inject()
    ctx: Context;

    @get('/all')
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
        this.ctx.body = {status: 0, msg: '获取成功', result: {projectList}} as SuccessResult;
    }

    @get('/:projectId')
    async getProjectInfo() {
        const projectId: string = this.ctx.params.projectId;
        const project = await this.ctx.model.Project.findByPk(projectId);
        if (!project) {
            return this.ctx.body = {status: 500, msg: '此项目不存在'} as ErrorResult;
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
            // 如果用户存在则添加
            userInfo && peopleList.push({
                userInfo,
                groupInfo: peoples[pIndex]
            });
        }
        // 获取协同记录
        const twList = [];
        const teamWorks = await this.ctx.model.Teamwork.findAll({
            where: {
                project_id: project.project_id,
                isrefuse: 2, // 已接受
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
                tfUserInfo: tfUserInfo || {username: '已删除', user_id: 'null', role: 3},
                twUserInfo: twUserInfo || {username: '已删除', user_id: 'null', role: 3},
                creatorInfo: creatorInfo || {username: '已删除', user_id: 'null', role: 3},
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
                tfUserInfo: tfUserInfo || {username: '已删除', user_id: 'null', role: 3},
                creatorInfo: creatorInfo || {username: '已删除', user_id: 'null', role: 3},
                taskFirst: taskFirsts[tfIndex]
            });
        }
        this.ctx.body = {status: 0, msg: '获取项目成功', result: {
                creatorInfo,
                projectInfo: project,
                peopleList,
                twList,
                tfList,
            }} as SuccessResult;
    }

    @post('/')
    async addProject() {
        const {userId, bgcolor, project_name, project_description, starttime, endtime, status} = this.ctx.request.body;
        const data = await this.ctx.model.Project.findOne({
            where: {
                project_name
            }
        });
        if (data) {
            return this.ctx.body = {status: 500, msg: '此项目已存在'} as ErrorResult;
        }
        const project = await this.ctx.model.Project.create({
            creator_id: userId, bgcolor, project_name, project_description, starttime, endtime, status, project_id: uuid().replace(/\-/g, '')
        });
        this.ctx.body = {status: 0, msg: '新增项目成功', result: project} as SuccessResult;
    }

    @put('/')
    async updateProject() {
        const {project_id, bgcolor, project_name, project_description, endtime, starttime, status, fileList = ''} = this.ctx.request.body;
        const project = await this.ctx.model.Project.findOne({
            where: {project_id}
        });
        if (!project) {
            return this.ctx.body = {status: 500, msg: '此项目不存在'} as ErrorResult;
        }
        project.bgcolor = bgcolor;
        project.project_name = project_name;
        project.project_description = project_description;
        project.endtime = endtime;
        project.starttime = starttime;
        project.status = status;
        project.fileList = fileList ? JSON.stringify(fileList) : fileList;
        await project.save();
        this.ctx.body = {status: 0, msg: '项目保存成功'} as SuccessResult;
    }

    @del('/')
    async delProject() {
        const {project_id} = this.ctx.request.body;
        const project = await this.ctx.model.Project.findOne({
            where: {project_id}
        });
        if (!project) {
            return this.ctx.body = {status: 500, msg: '此项目不存在'} as ErrorResult;
        }
        await project.destroy();
        this.ctx.body = {status: 0, msg: '项目删除成功'} as SuccessResult;
    }

    @post('/join')
    async joinProject() {
        const {user_role, user_id, project_id} = this.ctx.request.body;
        const data = await this.ctx.model.Projectgroup.findOne({
            where: {
                user_id,
                project_id
            }
        });
        if (data) {
            return this.ctx.body = {status: 500, msg: '此成员已加入此项目'} as ErrorResult;
        }
        const projectGroup = await this.ctx.model.Projectgroup.create({
            user_role, user_id, project_id
        });
        this.ctx.body = {status: 0, msg: '加入项目成功', result: projectGroup} as SuccessResult;
    }

    @del('/exit')
    async exitProject() {
        const {user_id, project_id} = this.ctx.request.body;
        const data = await this.ctx.model.Projectgroup.findOne({
            where: {
                user_id,
                project_id
            }
        });
        if (!data) {
            return this.ctx.body = {status: 500, msg: '此成员已退出此项目'} as ErrorResult;
        }
        await data.destroy();
        this.ctx.body = {status: 0, msg: '成功将此成员踢出项目'} as SuccessResult;
    }

    @get('/all/:userId')
    async getJoinProjects() {
        const userId: string = this.ctx.params.userId;
        const { Op } = this.ctx.app['Sequelize'];
        // 获取加入的所有项目
        const joinProjects = await this.ctx.model.Projectgroup.findAll({
            where: {user_id: userId}
        });
        const projectIdArr = [];
        for (const j in joinProjects) {
            projectIdArr.push(joinProjects[j].project_id);
        }
        const projects = await this.ctx.model.Project.findAll({
            where: {
                project_id: {[Op.in]: projectIdArr},
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
        this.ctx.body = {status: 0, msg: '获取成功', result: {projectList}} as SuccessResult;
    }
}
