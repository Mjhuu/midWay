import { Context, controller, get, inject, provide, post } from 'midway';
import {IUserService, IUserResult, LoginOptions} from '../../interface';

@provide()
@controller('/user')
export class UserController {

  @inject()
  ctx: Context;

  @inject('userService')
  service: IUserService;

  @post('/login')
  async addUser(): Promise<void> {
    let {username = '', password = '', captcha = ''} : LoginOptions = this.ctx.request.body;
    let data = await this.service.login({username, captcha, password});
    this.ctx.body = data;
  }

  @get('/:id')
  async getUser(): Promise<void> {
    const id: number = this.ctx.params.id;
    const user: IUserResult = await this.service.getUser({id});
    this.ctx.body = {success: true, message: 'OK', data: user};
  }
}
