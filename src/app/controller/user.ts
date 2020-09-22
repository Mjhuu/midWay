import {Context, controller, get, inject, provide, post, put, del} from 'midway';
import {ErrorResult, IUserService, SuccessResult} from '../../interface';
import {uuid} from 'uuidv4';
import {normalLog, actionOtherLog} from "../decorator";
import {Jwt} from "../jwt/jwt";
import {JobType} from "../common";
const md5 = require('md5-nodejs');

@provide()
@controller('/user')
export class UserController {

  @inject()
  ctx: Context;

  @inject('userService')
  service: IUserService;

  @get('/updateToken')
  updateToken() {
    const oldToken = this.ctx.headers.token;
    const jwt1 = new Jwt(oldToken);
    const result = jwt1.verifyToken();
    const uuid = result.userId;
    const jwt2 = new Jwt({
      userId: uuid
    });
    const token = jwt2.generateToken();
    this.ctx.body = {status: 0, msg: 'token更新成功', token};
  }

  @put('/password')
  @normalLog('进行了修改自己账号密码的操作')
  async updatePwd() {
    let {userId, password, verifycode: yzm} = this.ctx.request.body;
    if (Number(yzm) !== Number(this.ctx.session.yzm)) {
      return this.ctx.body = {
        msg: '验证码错误',
        status: 500,
      } as ErrorResult;
    }
    const data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if (!data) {
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
  @actionOtherLog({
    first: '进行了重置',
    second: '的密码操作',
    userId: 'userId'
  })
  async resetPwd() {
    let {userId, password} = this.ctx.request.body;
    const data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if (!data) {
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
  @normalLog('进行了修改自己邮箱的操作')
  async updateEmail() {
    const {userId, email, verifycode: yzm} = this.ctx.request.body;
    if (Number(yzm) !== Number(this.ctx.session.yzm)) {
      return this.ctx.body = {
        msg: '验证码错误',
        status: 500,
      } as ErrorResult;
    }
    const data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if (!data) {
      return this.ctx.body = {
        msg: '用户不存在',
        status: 500,
      } as ErrorResult;
    }
    const { Op } = this.ctx.app['Sequelize'];
    const hasEmail = await this.ctx.model.Employee.findOne({where: {email, user_id: {[Op.ne]: userId}}});
    if (!!hasEmail) {
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
  @normalLog('进行了修改用户信息的操作')
  async updateUser() {
    const {userId, username, mobile, telphone, head_url, gender, email = '', job_id = '', role = '', joinTime = '', leaveOffice} = this.ctx.request.body;
    const data = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    const { Op } = this.ctx.app['Sequelize'];
    if (!data) {
      return this.ctx.body = {
        msg: '用户不存在',
        status: 500,
      } as ErrorResult;
    }
    const hasUsername = await this.ctx.model.Employee.findOne({where: {username, user_id: {[Op.ne]: userId}}});
    if (!!hasUsername) {
      return this.ctx.body = {
        msg: '此用户名已被占用',
        status: 500,
      } as ErrorResult;
    }
    const hasPhone = await this.ctx.model.Employee.findOne({where: {mobile, user_id: {[Op.ne]: userId}}});
    if (!!hasPhone) {
      return this.ctx.body = {
        msg: '此手机号已被占用',
        status: 500,
      } as ErrorResult;
    }
    if (username) { data.username = username; }
    if (mobile) { data.mobile = mobile; }
    if (telphone) { data.telphone = telphone; }
    if (head_url) { data.head_url = head_url; }
    if (gender !== undefined) { data.gender = gender; }
    if (leaveOffice !== undefined) { data.leaveOffice = leaveOffice; }
    if (email) {
      const hasEmail = await this.ctx.model.Employee.findOne({where: {email, user_id: {[Op.ne]: userId}}});
      if (!!hasEmail) {
        return this.ctx.body = {
          msg: '此邮箱已被占用',
          status: 500,
        } as ErrorResult;
      }
      data.email = email;
    }
    if (job_id) {
      data.job_id = job_id;
    }
    if (role) {
      data.role = role;
    }
    if (joinTime) {
      data.join_time = joinTime;
    }
    await data.save();
    const user = await this.service.getUser({id: userId});
    this.ctx.body = user;
  }

  @post('/')
  @normalLog('进行了新增员工的操作')
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
    if (data) {
      return this.ctx.body = {status: 500, msg: '姓名或邮箱或手机号重复'} as ErrorResult;
    }
    data = await this.ctx.model.Employee.create({
      head_url: headUrl, password, role, email, username, telphone, mobile, join_time: joinTime, job_id: jobId, gender, user_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '员工添加成功', result: data} as SuccessResult;
  }

  @get('/:id')
  async getUser(): Promise<void> {
    const id: number = this.ctx.params.id;
    const user = await this.service.getUser({id});
    this.ctx.body = user;
  }

  @get('/all/:departmentId')
  async getDepartmentUsers() {
    const { Op } = this.ctx.app['Sequelize'];
    let departmentId: string = this.ctx.params.departmentId;
    const keyword: string = this.ctx.query.keyword || '';
    if (departmentId === '-1') {
      departmentId = '';
    }
    const userList: any[] = [];
    // 获取部门信息
    const departments = await this.ctx.model.Department.findAll({
      where: {department_id: {[Op.like]: `%${departmentId}%`}},
      attributes: ['department_id', 'department_name']
    });
    for (const index in departments) {
      // 获取所有职位
      const jobs = await this.ctx.model.Job.findAll({
        where: {department_id: departments[index].department_id}
      });
      const jobIdArr = [];
      for (const i in jobs) {
        jobIdArr.push(jobs[i].job_id);
      }
      const userArr = await this.ctx.model.Employee.findAll({
        where: {
          job_id: {[Op.in]: jobIdArr},
          username: {[Op.like]: `%${keyword}%`}
        },
        attributes: {exclude: ['password']},
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
    this.ctx.body = {status: 0, msg: '职位获取成功', result: {
        userList
      }} as SuccessResult;
  }

  @del('/')
  @actionOtherLog({
    first: '进行了删除',
    second: '员工操作',
    userId: 'userId'
  })
  async delUser() {
    const {userId} = this.ctx.request.body;
    const user = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if (!user) {
      return this.ctx.body = {status: 500, msg: '此员工不存在'} as ErrorResult;
    }
    await user.destroy();
    this.ctx.body = {status: 0, msg: '员工删除成功'} as SuccessResult;
  }

  @post('/login')
  async login() {
    let {username, password, verifycode: captcha} = this.ctx.request.body;
    if (!this.ctx.session.captcha) {
      return this.ctx.body = {
        msg: '验证码已过期',
        status: 500,
      } as ErrorResult;
    }
    if (captcha.toUpperCase() !== this.ctx.session.captcha.toUpperCase()) {
      return this.ctx.body = {
        msg: '验证码错误',
        status: 500,
      } as ErrorResult;
    }
    password = md5(password);
    const data = await this.ctx.model.Employee.findOne({
      where: {username, password}
    });
    if (!data) {
      return this.ctx.body = {
        msg: '用户名或密码错误',
        status: 500,
      } as ErrorResult;
    }
    if(data.leaveOffice === 1){
      return this.ctx.body = {status: 500, msg: '你已离职，无权使用系统'} as ErrorResult;
    }
    const user = await this.service.getUser({id: data.user_id});
    const jwt = new Jwt({
      userId: data.user_id
    });
    const token = jwt.generateToken();
    // 登录日志
    this.ctx.model.Log.create({
      log_id: uuid().replace(/\-/g, ''),
      user_id: data.user_id,
      ip: this.ctx.request.ip,
      do_thing: '进行了登录操作',
      type: JobType.login
    }).then(data => {
      console.log('log记录已入库');
    }).catch(e => console.error(e))
    this.ctx.body = {status: 0, msg: '用户信息获取成功', result: user.result, token};
  }
}
