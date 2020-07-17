import {Context, inject, provide} from 'midway';
import {IUserService, IUserOptions, IUserResult, LoginOptions, ErrorResult, SuccessResult} from '../interface';
import md5 from 'blueimp-md5'

@provide('userService')
export class UserService implements IUserService {
  @inject()
  ctx: Context;

  async getUser(options: IUserOptions): Promise<IUserResult> {
    return {
      id: options.id,
      username: 'mockedName',
      phone: '12345678901',
      email: 'xxx.xxx@xxx.com',
    };
  }

  async login(options: LoginOptions): Promise<ErrorResult | SuccessResult> {
    let {username, captcha, password} = options;
    if(!this.ctx.session.captcha){
      return {status: 500, msg: '验证码已过期'}
    }
    if(captcha.toUpperCase() !== this.ctx.session.captcha.toUpperCase()){
      return {status: 500, msg: '验证码错误'}
    }
    password = md5(password)
    let data = await this.ctx.model.Employee.findOne({
      where: {
        username, password
      }
    });
    if(!data){
      return {status: 500, msg: '用户名或密码错误'}
    }
    return {status: 200, msg: '登录成功', result: {userInfo: data}}
  }
}
