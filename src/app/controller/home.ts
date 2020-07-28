import {Context, inject, controller, get, post, del, put, provide, } from 'midway';
import {AddDepartmentOptions, ErrorResult, IUserService, SuccessResult} from '../../interface';
import { uuid } from 'uuidv4';
import {Jwt} from './../jwt/jwt';
const svgCaptcha = require('svg-captcha');
const path = require('path');
const fs = require('fs');
// 故名思意 异步二进制 写入流
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入一个虫洞。
const sendToWormhole = require('stream-wormhole');
const dayjs = require('dayjs');
const md5 = require('md5-nodejs');
const nodeMailer = require('nodemailer');

function getCode(length) {
  const codeArr = [1, 3, 4, 2, 6, 7, 5, 9, 8, 0];
  const codeLength = length;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += codeArr[parseInt(String(Math.random() * codeArr.length))];
  }
  return code;
}

const transporter = nodeMailer.createTransport({
  host: 'smtp.qq.com', // 邮箱服务的主机，如smtp.qq.com
  port: 465, // 对应的端口号
  // 开启安全连接
  // secure: false,
  secureConnection: true,
  // 用户信息
  auth: {
    user: '1441901570@qq.com',
    pass: 'nyhcoegvmyhmhgei'
  }
});

export const sendEmail = (toEmail, title = '', text = '', html = '') => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: '纬领工作平台 <1441901570@qq.com>',
      to: toEmail,
      subject: title,
      text,
      html
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve({
        Message: info.messageId,
        sent: info.response
      });
    });
  });
};

@provide()
@controller('/')
export class HomeController {

  @inject()
  ctx: Context;

  @inject('userService')
  service: IUserService;

  @get('/')
  async index() {
    await this.ctx.render('index');
  }

  // 获取验证码
  @get('/captcha')
  async captcha() {
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: 'oO1il', // 排除oO1il
      noise: 5, // 干扰线条
      height: 44,
    });
    this.ctx.session.captcha = captcha.text.toLocaleLowerCase(); // 设置session captcha 为生成的验证码字符串
    this.ctx.response['type'] = 'svg';
    this.ctx.body = captcha.data;
  }
  /*********************部门Api************************/
  @post('/department')
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

  @get('/departments')
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

  @del('/department')
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

  @del('/user')
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

  @put('/department')
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

  @get('/jobs/:departmentId')
  async getDepartmentJobs() {
    const departmentId: number = this.ctx.params.departmentId;
    const jobs = await this.ctx.model.Job.findAll({
      where: {department_id: departmentId}
    });
    this.ctx.body = {status: 0, msg: '职位获取成功', result: {
      jobList: jobs
      }} as SuccessResult;
  }

  @get('/users/:departmentId')
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

  @get('/jobs')
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

  @post('/job')
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

  @del('/job')
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

  @put('/job')
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

  @get('/memos/:userId')
  async getUserMemos() {
    const userId: string = this.ctx.params.userId;
    const memos = await this.ctx.model.Memo.findAll({
      where: {
        user_id: userId
      },
      order: [
        ['createdAt', 'DESC']
      ],
    });
    this.ctx.body = {status: 0, msg: '获取成功', result: {memoList: memos}} as SuccessResult;
  }

  @post('/memo')
  async addMemo() {
    const {userId} = this.ctx.request.body;
    const data = await this.ctx.model.Memo.create({
      user_id: userId, memo_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '新增备忘录成功', result: data} as SuccessResult;
  }

  @put('/memo')
  async updateMemo() {
    const {memoId, content} = this.ctx.request.body;
    const memo = await this.ctx.model.Memo.findOne({
      where: {memo_id: memoId}
    });
    if (!memo) {
      return this.ctx.body = {status: 500, msg: '此备忘录不存在'} as ErrorResult;
    }
    memo.content = content;
    await memo.save();
    this.ctx.body = {status: 0, msg: '备忘录保存成功'} as SuccessResult;
  }

  @del('/memo')
  async delMemo() {
    const {memoId} = this.ctx.request.body;
    const memo = await this.ctx.model.Memo.findOne({
      where: {memo_id: memoId}
    });
    if (!memo) {
      return this.ctx.body = {status: 500, msg: '此备忘录不存在'} as ErrorResult;
    }
    await memo.destroy();
    this.ctx.body = {status: 0, msg: '备忘录删除成功'} as SuccessResult;
  }

  @get('/project/:projectId')
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
        attributes: ['username', 'user_id', 'head_url']
      });
      peopleList.push({
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
        tfUserInfo,
        creatorInfo,
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

  @get('/projects')
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

  @post('/project')
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

  @put('/project')
  async updateProject() {
    const {project_id, bgcolor, project_name, project_description, endtime, starttime, status} = this.ctx.request.body;
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
    await project.save();
    this.ctx.body = {status: 0, msg: '项目保存成功'} as SuccessResult;
  }

  @del('/project')
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

  @post('/project/join')
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

  @del('/project/exit')
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

  @get('/job_logging/:userId/:projectId')
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

  @get('/projects/:userId')
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

  @post('/job_logging')
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

  @get('/job_logging/day')
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

  @post('/job_logging/week')
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

  @get('/job_loggings/month')
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

  @post('/job_progress')
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

  @put('/job_together')
  async updateTeamWork() {
    const {tw_id, twInfo} = this.ctx.request.body;
    const teamWork = await this.ctx.model.Teamwork.findOne({
      where: {tw_id}
    });
    if (!teamWork) {
      return this.ctx.body = {status: 500, msg: '协同记录不存在'} as ErrorResult;
    }
    for (const i in twInfo) {
      teamWork[i] = twInfo[i];
    }
    await teamWork.save();
    this.ctx.body = {status: 0, msg: '协同信息修改成功'} as SuccessResult;
  }

  @del('/job_together')
  async delTeamWork() {
    const {tw_id} = this.ctx.request.body;
    const teamWork = await this.ctx.model.Teamwork.findOne({
      where: {tw_id}
    });
    if (!teamWork) {
      return this.ctx.body = {status: 500, msg: '协同记录不存在'} as ErrorResult;
    }
    await teamWork.destroy();
    this.ctx.body = {status: 0, msg: '协同记录删除成功'} as SuccessResult;
  }

  @post('/job_together')
  async addTeamWork() {
    const {status, content, urgent, executor_id, creator_id, creator_role, project_id, tf_id, type = 0, createdAt} = this.ctx.request.body;
    if (project_id === 'null') {
      await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
      });
    } else {
      await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
      });
    }
    this.ctx.body = {status: 0, msg: '协同记录添加成功'} as SuccessResult;
  }

  @put('/job_logging')
  async updateJobLogging() {
    const {tf_id, tfInfo} = this.ctx.request.body;
    const taskfirst = await this.ctx.model.Taskfirst.findOne({
      where: {tf_id}
    });
    if (!taskfirst) {
      return this.ctx.body = {status: 500, msg: '任务记录不存在'} as ErrorResult;
    }
    for (const i in tfInfo) {
      taskfirst[i] = tfInfo[i];
    }
    await taskfirst.save();
    this.ctx.body = {status: 0, msg: '任务信息修改成功'} as SuccessResult;
  }

  @del('/job_logging')
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

  @get('/week')
  async getWeekEvaluate() {
    let {evaluated_id, startweekdate, endweekdate, } = this.ctx.query;
    startweekdate = new Date(startweekdate);
    endweekdate = new Date(endweekdate);
    const data = await this.ctx.model.Week.findOne({
      where: {
        startweekdate, endweekdate, evaluated_id
      }
    });
    if (!data) {
      return this.ctx.body = {status: 500, msg: '评语不存在'} as ErrorResult;
    }
    this.ctx.body = {status: 0, msg: '评语获取成功', result: data, } as SuccessResult;
  }

  @post('/week')
  async addWeekEvaluate() {
    let {score = 5, evaluate = '', startweekdate, endweekdate, evaluator_id, evaluated_id, leader_next_week_plan = '', myself_next_week_plan = '', weekly_summary = ''} = this.ctx.request.body;
    startweekdate = new Date(startweekdate);
    endweekdate = new Date(endweekdate);
    let data = await this.ctx.model.Week.findOne({
      where: {
        startweekdate, endweekdate, evaluated_id
      }
    });
    if (data) {
      if (score) { data.score = score; }
      if (evaluate) { data.evaluate = evaluate; }
      if (leader_next_week_plan) { data.leader_next_week_plan = leader_next_week_plan; }
      if (myself_next_week_plan) { data.myself_next_week_plan = myself_next_week_plan; }
      if (weekly_summary) { data.weekly_summary = weekly_summary; }
      if (evaluator_id) { data.evaluator_id = evaluator_id; }
      await data.save();
    } else {
      data = await this.ctx.model.Week.create({
        score, evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id, week_id: uuid().replace(/\-/g, ''), leader_next_week_plan, myself_next_week_plan, weekly_summary
      });
    }
    this.ctx.body = {status: 0, msg: '保存成功'} as SuccessResult;
  }

  @put('/notice')
  async updateNotice() {
    const {notice_id} = this.ctx.request.body;
    const data = await this.ctx.model.Notice.findOne({
      where: {
        notice_id
      }
    });
    if (!data) {
      return this.ctx.body = {status: 500, msg: '此提醒不存在'} as ErrorResult;
    }
    data.isRead = 1;
    await data.save();
    this.ctx.body = {status: 0, msg: '已读成功'} as SuccessResult;
  }

  @get('/notices')
  async getAllNotices() { // 获取所有未读消息
    const notices = await this.ctx.model.Notice.findAll({
      where: {
        isRead: 0,
      },
      order: [
        ['createdAt', 'DESC']
      ],
    });
    const noticeList = [];
    for (const i in notices) {
      const userInfo = await this.ctx.model.Employee.findByPk(notices[i].reminder_id, {
        attributes: ['username', 'user_id', 'role', 'head_url']
      });
      noticeList.push({
        reminderInfo: userInfo,
        notice: notices[i]
      });
    }
    this.ctx.body = {status: 0, msg: '未读消息获取成功', result: {noticeList}} as SuccessResult;
  }

  @post('/notice')
  async addNotice() {
    const {reminder_id, message} = this.ctx.request.body;
    let data = await this.ctx.model.Notice.findOne({
      where: {
        message, reminder_id
      }
    });
    if (data) {
      return this.ctx.body = {status: 500, msg: '你已经提醒过一次了'} as ErrorResult;
    }
    data = await this.ctx.model.Notice.create({
      reminder_id, message, notice_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '提醒成功'} as SuccessResult;
  }

  @post('/uploadFile')
  async uploadFile() {
    const { ctx } = this;
    // 获取文件流
    const stream = await ctx.getFileStream();
    const {userId} = ctx.query;
    // 基础的目录
    const uploadBasePath = './../public/upload';
    // 生成文件名
    const filename = `${Date.now()}${Number.parseInt(String(Math.random() * 1000))}${path.extname(stream.filename).toLocaleLowerCase()}`;
    // 生成文件夹
    const dirname = (userId ? userId : 'null') + '/' + dayjs(Date.now()).format('YYYY/MM/DD');
    function mkdirsSync(dirname) {
      if (fs.existsSync(dirname)) {
        return true;
      }
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
    mkdirsSync(path.join(__dirname, uploadBasePath, dirname));
    // 生成写入路径
    const target = path.join(__dirname, uploadBasePath, dirname, filename);
    // 写入流
    const writeStream = fs.createWriteStream(target);
    try {
      // 异步把文件流 写入
      await awaitWriteStream(stream.pipe(writeStream));
    } catch (err) {
      // 如果出现错误，关闭管道
      await sendToWormhole(stream);
      ctx.body = {
        msg: '文件上传失败',
        result: err,
        status: 500,
      } as ErrorResult;
    }
    ctx.body = {
      result: {
        url: path.join('/upload', dirname, filename)
      },
      msg: '文件上传成功',
      fields: stream.fields,
      status: 0,
    } as SuccessResult;
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
    this.ctx.body = {status: 0, msg: '用户信息获取成功', result: user.result, token};
  }

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

  @post('/sendCode')
  async sendCode() {
    try {
      const {email: toEmail} = this.ctx.request.body;
      const code = getCode(6);
      const data = await sendEmail(toEmail, 'WEBLINKON验证码', `【纬领工作平台平台】您的邮箱验证码是：${code}。验证码有效期：1分钟。工作人员不会向您索要，索要验证码的都是骗子，如非本人操作请忽略。`);
      this.ctx.session.yzm = code; // 设置session captcha 为生成的验证码字符串
      this.ctx.body = {
        status: 0,
        msg: '验证码发送成功',
        result: data
      } as SuccessResult;
    } catch (e) {
      this.ctx.body = {
        msg: '邮箱发送失败',
        status: 500,
        result: e
      } as ErrorResult;
    }
  }

  @post('/sendEmail')
  async sendEmail() {
    try {
      const {email: toEmail, title, text, html} = this.ctx.request.body;
      const data = await sendEmail(toEmail, title, text, html);
      this.ctx.body = {
        status: 0,
        msg: '邮箱发送成功',
        result: data
      } as SuccessResult;
    } catch (e) {
      this.ctx.body = {
        msg: '邮箱发送失败',
        status: 500,
        result: e
      } as ErrorResult;
    }
  }

}
