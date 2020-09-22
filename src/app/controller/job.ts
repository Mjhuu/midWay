import {Context, controller, del, get, inject, post, provide, put,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/job')
export class JobController {

    @inject()
    ctx: Context;

    @get('/all/:departmentId')
    async getDepartmentJobs() {
        const departmentId: number = this.ctx.params.departmentId;
        const jobs = await this.ctx.model.Job.findAll({
            where: {department_id: departmentId}
        });
        this.ctx.body = {status: 0, msg: '职位获取成功', result: {
                jobList: jobs
            }} as SuccessResult;
    }

    @get('/all')
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
        this.ctx.body = {status: 0, msg: '获取成功', result: {departmentList}} as SuccessResult;
    }

    @post('/')
    async addJob() {
        const {job_name, department_id} = this.ctx.request.body;
        let data = await this.ctx.model.Job.findOne({
            where: {
                job_name,
                department_id
            }
        });
        if (data) {
            return this.ctx.body = {status: 500, msg: '此部门已存在此职位'} as ErrorResult;
        }
        data = await this.ctx.model.Job.create({
            job_name, department_id, job_id: uuid().replace(/\-/g, '')
        });
        this.ctx.body = {status: 0, msg: '职位添加成功', result: data} as SuccessResult;
    }

    @del('/')
    async delJob() {
        const {job_id} = this.ctx.request.body;
        const job = await this.ctx.model.Job.findOne({
            where: {job_id}
        });
        if (!job) {
            return this.ctx.body = {status: 500, msg: '此职位不存在'} as ErrorResult;
        }
        await job.destroy();
        this.ctx.body = {status: 0, msg: '职位删除成功'} as SuccessResult;
    }

    @put('/')
    async updateJob() {
        const {job_id, job_name} = this.ctx.request.body;
        const job = await this.ctx.model.Job.findOne({
            where: {job_id}
        });
        if (!job) {
            return this.ctx.body = {status: 500, msg: '此职位不存在'} as ErrorResult;
        }
        job.job_name = job_name;
        await job.save();
        this.ctx.body = {status: 0, msg: '职位信息修改成功'} as SuccessResult;
    }
}
