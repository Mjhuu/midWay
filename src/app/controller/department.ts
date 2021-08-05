import {Context, controller, del, get, inject, post, provide, put,} from 'midway';
import {AddDepartmentOptions, ErrorResult, IUserService, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/department')
export class DepartmentController {

    @inject()
    ctx: Context;

    @inject('userService')
    service: IUserService;

    @post('/')
    async addDepartment() {
        const {department_description, department_name, creator_id}: AddDepartmentOptions = this.ctx.request.body;
        let data = await this.ctx.model.Department.findOne({
            where: {
                department_name
            }
        });
        if (data) {
            return this.ctx.body = {status: 500, msg: '已存在同名部门'} as ErrorResult;
        }
        data = await this.ctx.model.Department.create({
            department_description, department_name, creator_id, department_id: uuid().replace(/\-/g, '')
        });
        this.ctx.body = {status: 0, msg: '部门添加成功', result: data} as SuccessResult;
    }

    @post('/roleSign')
    async updateRoleSign() {
        try {
            const {department_id, firstRole = '', secondRole = '', thirdRole = ''} = this.ctx.request.body;
            // 获取此用户的授权列表
            let data = await this.ctx.model.RoleSign.findOne({
                where: {
                    department_id
                }
            })
            if (!data) {
                let obj = {role_sign_id: uuid().replace(/\-/g, ''), department_id
                }
                if(firstRole) obj['firstRole'] = firstRole;
                if(secondRole) obj['secondRole'] = secondRole;
                if(thirdRole) obj['thirdRole'] = thirdRole;
                data = await this.ctx.model.RoleSign.create({
                   ...obj
                })
            }

            data['firstRole'] = firstRole || null
            if(secondRole) data['secondRole'] = secondRole;
            if(thirdRole) data['thirdRole'] = thirdRole;
            await data.save()
            this.ctx.body = {
                status: 0,
                msg: '请假审批人员更新成功',
                result: data
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '请假审批更新失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @get('/getAskLeaveList')
    async getAskLeaveList() {
        try {
            // 2021-07-01 00:00:00
            // 2021-07-31 23:59:59
            const {timeEnd, timeStart} = this.ctx.query;
            const {Op} = this.ctx.app['Sequelize'];
            let askLists = await this.ctx.model.AskForLeave.findAll({
                where: {
                    [Op.or]: [
                        {startTime: {[Op.between]: [timeStart,timeEnd ]}},
                        {endTime: {[Op.between]: [timeStart,timeEnd ]}},
                    ]
                },
                order: [
                    ['createdAt', 'DESC']
                ],
            });
            let askLeaveList = [];
            for(let i in askLists){
                const userInfo = await this.service.getUser({id: askLists[i].user_id})

                const firstInfo = askLists[i].firstRole ? await this.ctx.model.Employee.findByPk(askLists[i].firstRole, {
                    attributes: ['username']
                }) : {username: ''};
                const secondInfo = await this.ctx.model.Employee.findByPk(askLists[i].secondRole, {
                    attributes: ['username']
                });
                const thirdInfo = await this.ctx.model.Employee.findByPk(askLists[i].thirdRole, {
                    attributes: ['username']
                });

                askLeaveList.push({
                    userInfo: userInfo.result['userInfo'],
                    departmentInfo: userInfo.result['departmentInfo'],
                    jobInfo: userInfo.result['jobInfo'],
                    firstInfo,
                    secondInfo,
                    thirdInfo,
                    askLeaveInfo: askLists[i]
                })
            }
            this.ctx.body = {
                status: 0,
                msg: '请假列表获取成功',
                result: askLeaveList
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '请假列表获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @get('/getRetroactiveList')
    async getRetroactiveList() {
        try {
            // 2021-07-01 00:00:00
            // 2021-07-31 23:59:59
            const {timeEnd, timeStart} = this.ctx.query;
            const {Op} = this.ctx.app['Sequelize'];
            let retroactives = await this.ctx.model.Retroactive.findAll({
                where: {
                    retroactiveTime: {[Op.between]: [timeStart,timeEnd ]}
                },
                order: [
                    ['createdAt', 'DESC']
                ],
            });
            let retroactiveList = [];
            for(let i in retroactives){
                const userInfo = await this.service.getUser({id: retroactives[i].user_id})

                const firstInfo = retroactives[i].firstRole ? await this.ctx.model.Employee.findByPk(retroactives[i].firstRole, {
                    attributes: ['username']
                }) : {username: ''};
                const secondInfo = await this.ctx.model.Employee.findByPk(retroactives[i].secondRole, {
                    attributes: ['username']
                });
                const thirdInfo = await this.ctx.model.Employee.findByPk(retroactives[i].thirdRole, {
                    attributes: ['username']
                });

                retroactiveList.push({
                    userInfo: userInfo.result['userInfo'],
                    departmentInfo: userInfo.result['departmentInfo'],
                    jobInfo: userInfo.result['jobInfo'],
                    firstInfo,
                    secondInfo,
                    thirdInfo,
                    retroactiveInfo: retroactives[i]
                })
            }
            this.ctx.body = {
                status: 0,
                msg: '补签列表获取成功',
                result: retroactiveList
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '补签列表获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @get('/roleSign')
    async getRoleSign() {
        try {
            const {department_id} = this.ctx.query;
            // 获取此用户的授权列表
            let data = await this.ctx.model.RoleSign.findOne({
                where: {
                    department_id
                }
            })
            if (!data) {
                return this.ctx.body = {
                    msg: '此部门请假审批人员尚未选择',
                    status: 500,
                } as ErrorResult;
            }
            const firstInfo = data.firstRole ? await this.ctx.model.Employee.findByPk(data.firstRole, {
                attributes: ['username']
            }) : {username: ''};
            const secondInfo = await this.ctx.model.Employee.findByPk(data.secondRole, {
                attributes: ['username']
            });
            const thirdInfo = await this.ctx.model.Employee.findByPk(data.thirdRole, {
                attributes: ['username']
            });
            this.ctx.body = {
                status: 0,
                msg: '请假审批人员获取成功',
                result: {
                    firstInfo,
                    secondInfo,
                    thirdInfo,
                    roleSign: data,
                }
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '请假审批获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @get('/all')
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
        this.ctx.body = {status: 0, msg: '部门列表获取成功', result: {departmentList}} as SuccessResult;
    }

    @del('/')
    async delDepartment() {
        const {department_id} = this.ctx.request.body;
        const department = await this.ctx.model.Department.findOne({
            where: {department_id}
        });
        if (!department) {
            return this.ctx.body = {status: 500, msg: '此部门不存在'} as ErrorResult;
        }
        await department.destroy();
        this.ctx.body = {status: 0, msg: '部门删除成功'} as SuccessResult;
    }

    @put('/')
    async updateDepartment() {
        const {department_id, department_name, department_description} = this.ctx.request.body;
        const department = await this.ctx.model.Department.findOne({
            where: {department_id}
        });
        if (!department) {
            return this.ctx.body = {status: 500, msg: '此部门不存在'} as ErrorResult;
        }
        department.department_name = department_name;
        department.department_description = department_description;
        await department.save();
        this.ctx.body = {status: 0, msg: '部门信息修改成功'} as SuccessResult;
    }
}
