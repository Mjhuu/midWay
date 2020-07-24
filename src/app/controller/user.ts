import { Context, controller, get, inject, provide, post, put } from 'midway';
import {ErrorResult, IUserService, SuccessResult} from '../../interface';
import {uuid} from "uuidv4";
const md5 = require('md5-nodejs');

@provide()
@controller('/user')
export class UserController {

  @inject()
  ctx: Context;

  @inject('userService')
  service: IUserService;

  @put('/password')
  async updatePwd(){
    let {userId, password, verifycode: yzm} = this.ctx.request.body;
    if(Number(yzm) !== Number(this.ctx.session.yzm)){
      return this.ctx.body = {
        msg: '验证码错误',
        status: 500,
      } as ErrorResult;
    }
    let data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if(!data){
      return this.ctx.body = {
        msg: '用户不存在',
        status: 500,
      } as ErrorResult;
    }
    password = md5(password);
    data.password = password;
    await data.save();
    return this.ctx.body = {
      msg: '密码重置成功',
      status: 0,
    } as SuccessResult;
  }

  @put('/reset_password')
  async resetPwd(){
    let {userId, password} = this.ctx.request.body;
    let data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if(!data){
      return this.ctx.body = {
        msg: '用户不存在',
        status: 500,
      } as ErrorResult;
    }
    password = md5(password);
    data.password = password;
    await data.save();
    return this.ctx.body = {
      msg: '密码重置成功',
      status: 0,
    } as SuccessResult;
  }

  @put('/email')
  async updateEmail(){
    let {userId, email, verifycode: yzm} = this.ctx.request.body;
    if(Number(yzm) !== Number(this.ctx.session.yzm)){
      return this.ctx.body = {
        msg: '验证码错误',
        status: 500,
      } as ErrorResult;
    }
    let data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if(!data){
      return this.ctx.body = {
        msg: '用户不存在',
        status: 500,
      } as ErrorResult;
    }
    const { Op } = this.ctx.app['Sequelize'];
    let hasEmail = await this.ctx.model.Employee.findOne({where:{email, user_id: {[Op.ne]: userId}}});
    if(!!hasEmail){
      return this.ctx.body = {
        msg: '此邮箱已被占用',
        status: 500,
      } as ErrorResult;
    }
    data.email = email;
    await data.save();
    const user = await this.service.getUser({id: data.user_id});
    this.ctx.body = user;
  }
  @put('/')
  async updateUser(){
    let {userId, username, mobile, telphone, head_url, gender, email = '', job_id = '', role = '', joinTime = ''} = this.ctx.request.body;
    let data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    const { Op } = this.ctx.app['Sequelize'];
    if(!data){
      return this.ctx.body = {
        msg: '用户不存在',
        status: 500,
      } as ErrorResult;
    }
    let hasUsername = await this.ctx.model.Employee.findOne({where:{username, user_id: {[Op.ne]: userId}}});
    if(!!hasUsername){
      return this.ctx.body = {
        msg: '此用户名已被占用',
        status: 500,
      } as ErrorResult;
    }
    let hasPhone = await this.ctx.model.Employee.findOne({where:{mobile, user_id: {[Op.ne]: userId}}});
    if(!!hasPhone){
      return this.ctx.body = {
        msg: '此手机号已被占用',
        status: 500,
      } as ErrorResult;
    }
    if(username) data.username = username;
    if(mobile) data.mobile = mobile;
    if(telphone) data.telphone = telphone;
    if(head_url) data.head_url = head_url;
    if(gender) data.gender = gender;
    if(email){
      let hasEmail = await this.ctx.model.Employee.findOne({where:{email, user_id: {[Op.ne]: userId}}});
      if(!!hasEmail){
        return this.ctx.body = {
          msg: '此邮箱已被占用',
          status: 500,
        } as ErrorResult;
      }
      data.email = email;
    }
    if(job_id){
      data.job_id = job_id;
    }
    if(role){
      data.role = role;
    }
    if(joinTime){
      data.join_time = joinTime;
    }
    await data.save();
    const user = await this.service.getUser({id: userId});
    this.ctx.body = user;
  }

  @post('/')
  async addUser(): Promise<ErrorResult | SuccessResult> {
    let {headUrl, password, role, email, username, telphone, mobile, joinTime, jobId, gender} = this.ctx.request.body;
    joinTime = new Date(joinTime);
    password = md5(password);
    const { Op } = this.ctx.app['Sequelize'];
    let data = await this.ctx.model.Employee.findOne({
      where: {
        [Op.or]: [
          {email},
          {username},
          {mobile},
        ]
      }
    });
    if(data){
      return this.ctx.body = {status: 500, msg: '姓名或邮箱或手机号重复'} as ErrorResult
    }
    data = await this.ctx.model.Employee.create({
      head_url: headUrl, password, role, email, username, telphone, mobile, join_time: joinTime, job_id: jobId, gender, user_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '员工添加成功', result: data} as SuccessResult
  }

  @get('/:id')
  async getUser(): Promise<void> {
    const id: number = this.ctx.params.id;
    const user = await this.service.getUser({id});
    this.ctx.body = user;
  }
}
