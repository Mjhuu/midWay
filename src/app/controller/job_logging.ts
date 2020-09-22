import {Context, controller, del, get, inject, post, provide, put,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/job_logging')
export class JobLoggingController {

    @inject()
    ctx: Context;

    @get('/all/month')
    async getMonthUnfinishedJobLogging() {
        const userId: string = this.ctx.query.userId;
        const timeStart: string = this.ctx.query.timeStart;
        const timeEnd: string = this.ctx.query.timeEnd;
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
                }, // 不返回已拒绝的
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
        this.ctx.body = {status: 0, msg: '获取任务列表成功', result: {
                twList,
                tfList: taskFirsts,
            }} as SuccessResult;
    }

    @get('/:userId/:projectId')
    async getUserProjectJob() {
        const userId: string = this.ctx.params.userId;
        const projectId: string = this.ctx.params.projectId;
        const data = await this.ctx.model.Projectgroup.findOne({
            where: {
                user_id: userId,
                project_id: projectId
            }
        });
        if (!data) {
            return this.ctx.body = {status: 500, msg: '此成员已退出此项目'} as ErrorResult;
        }
        // 获取协同记录
        const twList = [];
        const teamWorks = await this.ctx.model.Teamwork.findAll({
            where: {
                project_id: projectId,
                executor_id: userId,
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
        this.ctx.body = {status: 0, msg: '获取项目成功', result: {
                twList,
                tfList,
            }} as SuccessResult;
    }

    @post('/')
    async addJobLogging() {
        try {
            // type === 0 ? '自己' : '领导'
            const {status, tf_content, creator_id, creator_role, urgent, executor_id, project_id, description, teamWorkList, type = 0, createdAt} = this.ctx.request.body;
            let jobLogging;
            // 如果没有选择项目
            if (project_id === 'null') {
                jobLogging = await this.ctx.model.Taskfirst.create({
                    tf_id: uuid().replace(/\-/g, ''), status, tf_content, creator_id, creator_role, urgent, executor_id, description, createdAt: new Date(createdAt)
                });
            } else {// 如果选择了项目
                jobLogging = await this.ctx.model.Taskfirst.create({
                    tf_id: uuid().replace(/\-/g, ''), status, tf_content, creator_id, creator_role, urgent, executor_id, description, project_id, createdAt: new Date(createdAt)
                });
            }
            // 获取任务记录ID
            const tf_id = jobLogging.tf_id;
            // 循环遍历协作写入库
            for (const i in teamWorkList) {
                const {status, content, urgent, executor_id, creator_id, creator_role, project_id, createdAt} = teamWorkList[i];
                if (project_id === 'null') {
                    await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
                    });
                } else {
                    await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
                    });
                }
            }
            this.ctx.body = {status: 0, msg: '任务记录添加成功', result: {}} as SuccessResult;
        } catch (e) {
            this.ctx.body = {status: 500, msg: '任务记录添加失败', result: e} as ErrorResult;
        }
    }

    @get('/day')
    async getDayJobLogging() {
        const userId: string = this.ctx.query.userId;
        const timeStart: string = this.ctx.query.timeStart;
        const timeEnd: string = this.ctx.query.timeEnd;
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
                }, // 不返回已拒绝的
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
        this.ctx.body = {status: 0, msg: '获取任务列表成功', result: {
                twList,
                tfList,
            }} as SuccessResult;
    }

    @post('/week')
    async getWeekJobLoggings() {
        const userId: string = this.ctx.request.body.userId;
        const weekArr: any[] = this.ctx.request.body.weekArr;
        const weekList = [];
        const { Op } = this.ctx.app['Sequelize'];
        for (const i in weekArr) {
            let {timeStart, timeEnd, week} = weekArr[i];
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
                    }, // 不返回已拒绝的
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
                    }, // 不返回已拒绝的
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
                    }, // 不返回已拒绝的
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
                    }, // 不返回已拒绝的
                    status: 3
                }
            });
            unfinishedCount = tfUnfinishedCount + twUnfinishedCount;
            weekList.push({
                timeStart, timeEnd, week, total, finishingCount, finishedCount, unfinishedCount
            });
        }
        this.ctx.body = {status: 0, msg: '获取任务列表成功', result: {
                weekList
            }} as SuccessResult;
    }

    @put('/')
    async updateJobLogging() {
        const {tf_id, tfInfo, fileInfo = '', type = 1} = this.ctx.request.body;
        const taskfirst = await this.ctx.model.Taskfirst.findOne({
            where: {tf_id}
        });
        if (!taskfirst) {
            return this.ctx.body = {status: 500, msg: '任务记录不存在'} as ErrorResult;
        }
        for (const i in tfInfo) {
            taskfirst[i] = tfInfo[i];
        }
        if (fileInfo) {
            if(type === 1){
                let oldList = taskfirst.fileList ? JSON.parse(taskfirst.fileList) : [];
                oldList.push(fileInfo)
                taskfirst.fileList = JSON.stringify(oldList);
            }else {
                taskfirst.fileList = JSON.stringify(fileInfo);
            }
        }
        await taskfirst.save();
        this.ctx.body = {status: 0, msg: '任务信息修改成功'} as SuccessResult;
    }

    @del('/')
    async delJobLogging() {
        const {tf_id} = this.ctx.request.body;
        const taskfirst = await this.ctx.model.Taskfirst.findOne({
            where: {tf_id}
        });
        if (!taskfirst) {
            return this.ctx.body = {status: 500, msg: '任务记录不存在'} as ErrorResult;
        }
        await taskfirst.destroy();
        this.ctx.body = {status: 0, msg: '任务记录删除成功'} as SuccessResult;
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
                }, // 不返回已拒绝的
                status: 2,
                createdAt: {
                    [Op.between]: [new Date(timeStart), new Date(timeEnd)]
                },
            }
        });
        finishedCount = tfFinishedCount + twFinishedCount;
        return (finishedCount / total) * 100;
    }

    @post('/progress')
    async getJobProgress() {
        const userId: string = this.ctx.request.body.userId;
        const dayArr: any[] = this.ctx.request.body.dayArr;
        const weekArr: any[] = this.ctx.request.body.weekArr;
        const monthArr: any[] = this.ctx.request.body.monthArr;
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
        let totalProgress: any = 0;
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
                }, // 不返回已拒绝的
                status: 2
            }
        });
        finishedCount = tfFinishedCount + twFinishedCount;
        totalProgress = (finishedCount / total) * 100;
        progressList.push({
            title: '总工作完成度',
            progress: totalProgress
        });
        this.ctx.body = {status: 0, msg: '获取任务进度成功', result: {
                progressList
            }} as SuccessResult;
    }
}
