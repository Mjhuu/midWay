import {Context, controller, del, get, inject, post, provide, put,} from 'midway';
import {AddDepartmentOptions, ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/department')
export class DepartmentController {

    @inject()
    ctx: Context;
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
