import {Context, inject, provide} from 'midway';
import {IUserService, IUserOptions, LoginOptions, ErrorResult, SuccessResult} from '../interface';
import md5 from 'md5-nodejs';

@provide('userService')
export class UserService implements IUserService {
  @inject()
  ctx: Context;

  async getUser(options: IUserOptions): Promise<ErrorResult | SuccessResult> {
    const {id} = options;
    const data = await this.ctx.model.Employee.findByPk(id, {
      attributes: {exclude: ['password']}
    });
    if (!data) {
      return {status: 500, msg: '用户不存在'};
    }
    const jobData = await this.ctx.model.Job.findByPk(data.job_id, {
      attributes: ['job_id', 'job_name', 'department_id']
    });
    let departmentInfo = {};
    if (jobData) {
      departmentInfo = await this.ctx.model.Department.findByPk(jobData.department_id, {
        attributes: ['department_id', 'department_name']
      });
    }
    return {status: 0, msg: '用户信息获取成功', result: {userInfo: data, jobInfo: jobData, departmentInfo}};
  }

  async login(options: LoginOptions): Promise<ErrorResult | SuccessResult> {
    let {username, captcha, password} = options;
    if (!this.ctx.session.captcha) {
      return {status: 500, msg: '验证码已过期'};
    }
    if (captcha.toUpperCase() !== this.ctx.session.captcha.toUpperCase()) {
      return {status: 500, msg: '验证码错误'};
    }
    password = md5(password);
    const data = await this.ctx.model.Employee.findOne({
      where: {
        username, password
      }
    });
    if (!data) {
      return {status: 500, msg: '用户名或密码错误'};
    }
    return {status: 0, msg: '登录成功', result: {userInfo: data}};
  }
}
