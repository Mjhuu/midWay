import {Context, inject, controller, get, post, del, put, provide,} from 'midway';
import {AddDepartmentOptions, ErrorResult, IUserService, SuccessResult} from "../../interface";
import { uuid } from 'uuidv4';
let svgCaptcha = require('svg-captcha');
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
  let codeArr = [1, 3, 4, 2, 6, 7, 5, 9, 8, 0];
  let codeLength = length;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += codeArr[parseInt(String(Math.random() * codeArr.length))];
  }
  return code;
}

let transporter= nodeMailer.createTransport({
  host: 'smtp.qq.com',//邮箱服务的主机，如smtp.qq.com
  port: 465,//对应的端口号
  //开启安全连接
  // secure: false,
  secureConnection: true,
  //用户信息
  auth:{
    user: '1441901570@qq.com',
    pass: 'nyhcoegvmyhmhgei'
  }
});

export const sendEmail = (toEmail, title = '', text = '', html = '') =>{
  return new Promise((resolve, reject) => {
    let mailOptions={
      from: '纬领工作平台 <1441901570@qq.com>',
      to: toEmail,
      subject: title,
      text,
      html
    };
    transporter.sendMail(mailOptions,(error,info)=>{
      if(error)
        return reject(error);
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
    this.ctx.body = `纬领安全工作平台api`;
  }

  // 获取验证码
  @get('/captcha')
  async captcha() {
    let captcha = svgCaptcha.create({
      size: 4, //验证码长度
      ignoreChars: 'oO1il', //排除oO1il
      noise: 5, //干扰线条
      color: true,
      height: 44
    });
    this.ctx.session.captcha = captcha.text.toLocaleLowerCase(); //设置session captcha 为生成的验证码字符串
    this.ctx.response['type'] = 'svg';
    this.ctx.body = captcha.data;
  }
  /*********************部门Api************************/
  @post('/department')
  async addDepartment(){
    let {department_description, department_name, creator_id} : AddDepartmentOptions = this.ctx.request.body;
    let data = await this.ctx.model.Department.findOne({
      where: {
        department_name
      }
    });
    if(data){
      return this.ctx.body = {status: 500, msg: '已存在同名部门'} as ErrorResult
    }
    data = await this.ctx.model.Department.create({
      department_description, department_name, creator_id, department_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '部门添加成功', result: data} as SuccessResult
  }

  @get('/departments')
  async getAllDepartments(){
    let departments = await this.ctx.model.Department.findAll();
    let departmentList = [];
    for(let i in departments){
      let creator = await this.ctx.model.Employee.findByPk(departments[i].creator_id, {
        attributes: ['user_id', 'username']
      });
      departmentList.push({
        departmentInfo: departments[i],
        creator
      })
    }
    this.ctx.body = {status: 0, msg: '部门列表获取成功', result: {departmentList}} as SuccessResult
  }

  @del('/department')
  async delDepartment(){
    let {department_id} = this.ctx.request.body;
    let department = await this.ctx.model.Department.findOne({
      where: {department_id}
    });
    if(!department){
      return this.ctx.body = {status: 500, msg: '此部门不存在'} as ErrorResult
    }
    await department.destroy();
    this.ctx.body = {status: 0, msg: '部门删除成功'} as SuccessResult
  }

  @del('/user')
  async delUser(){
    let {userId} = this.ctx.request.body;
    let user = await this.ctx.model.Employee.findOne({
      where: {user_id: userId}
    });
    if(!user){
      return this.ctx.body = {status: 500, msg: '此员工不存在'} as ErrorResult
    }
    await user.destroy();
    this.ctx.body = {status: 0, msg: '员工删除成功'} as SuccessResult
  }

  @put('/department')
  async updateDepartment(){
    let {department_id, department_name, department_description} = this.ctx.request.body;
    let department = await this.ctx.model.Department.findOne({
      where: {department_id}
    });
    if(!department){
      return this.ctx.body = {status: 500, msg: '此部门不存在'} as ErrorResult
    }
    department.department_name = department_name;
    department.department_description = department_description;
    await department.save();
    this.ctx.body = {status: 0, msg: '部门信息修改成功'} as SuccessResult
  }

  @get('/jobs/:departmentId')
  async getDepartmentJobs(){
    const departmentId: number = this.ctx.params.departmentId;
    let jobs = await this.ctx.model.Job.findAll({
      where: {department_id: departmentId}
    });
    this.ctx.body = {status: 0, msg: '职位获取成功', result: {
      jobList: jobs
      }} as SuccessResult
  }

  @get('/users/:departmentId')
  async getDepartmentUsers(){
    const { Op } = this.ctx.app['Sequelize'];
    let departmentId: string = this.ctx.params.departmentId;
    const keyword: string = this.ctx.query.keyword || '';
    if(departmentId === '-1'){
      departmentId = ''
    }
    let userList: Array<any> = [];
    // 获取部门信息
    let departments = await this.ctx.model.Department.findAll({
      where: {department_id: {[Op.like]: `%${departmentId}%`}},
      attributes: ['department_id', 'department_name']
    });
    for(let index in departments){
      // 获取所有职位
      let jobs = await this.ctx.model.Job.findAll({
        where: {department_id: departments[index].department_id}
      });
      let jobIdArr = [];
      for(let i in jobs){
        jobIdArr.push(jobs[i].job_id)
      }
      let userArr = await this.ctx.model.Employee.findAll({
        where: {
          job_id: {[Op.in]: jobIdArr},
          username: {[Op.like]: `%${keyword}%`}
        },
        attributes: {exclude: ['password']},
        order: [
          ['createdAt', 'DESC']
        ],
      });
      let users = [];
      for(let userIndex in userArr){
        let jobInfo = await this.ctx.model.Job.findByPk(userArr[userIndex].job_id, {
          attributes: ['job_id', 'job_name', 'department_id']
        });
        users.push({
          userInfo: userArr[userIndex],
          jobInfo
        })
      }
      userList.push({
        departmentInfo: departments[index],
        users
      })
    }
    this.ctx.body = {status: 0, msg: '职位获取成功', result: {
        userList
      }} as SuccessResult
  }

  @get('/jobs')
  async getJobs(){
    let departments = await this.ctx.model.Department.findAll({
      attributes: ['department_id', 'department_name']
    });
    let departmentList = [];
    for(let i in departments){
      let jobList = await this.ctx.model.Job.findAll({
        where: {
          department_id: departments[i].department_id
        },
        attributes: ['job_id', 'job_name']
      });
      departmentList.push({
        departmentInfo: departments[i],
        jobList
      })
    }
    this.ctx.body = {status: 0, msg: '获取成功', result: {departmentList}} as SuccessResult
  }

  @post('/job')
  async addJob(){
    let {job_name, department_id} = this.ctx.request.body;
    let data = await this.ctx.model.Job.findOne({
      where: {
        job_name,
        department_id
      }
    });
    if(data){
      return this.ctx.body = {status: 500, msg: '此部门已存在此职位'} as ErrorResult
    }
    data = await this.ctx.model.Job.create({
      job_name, department_id, job_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '职位添加成功', result: data} as SuccessResult
  }

  @del('/job')
  async delJob(){
    let {job_id} = this.ctx.request.body;
    let job = await this.ctx.model.Job.findOne({
      where: {job_id}
    });
    if(!job){
      return this.ctx.body = {status: 500, msg: '此职位不存在'} as ErrorResult
    }
    await job.destroy();
    this.ctx.body = {status: 0, msg: '职位删除成功'} as SuccessResult
  }

  @put('/job')
  async updateJob(){
    let {job_id, job_name} = this.ctx.request.body;
    let job = await this.ctx.model.Job.findOne({
      where: {job_id}
    });
    if(!job){
      return this.ctx.body = {status: 500, msg: '此职位不存在'} as ErrorResult
    }
    job.job_name = job_name;
    await job.save();
    this.ctx.body = {status: 0, msg: '职位信息修改成功'} as SuccessResult
  }

  @get('/memos/:userId')
  async getUserMemos(){
    let userId: string = this.ctx.params.userId;
    let memos = await this.ctx.model.Memo.findAll({
      where: {
        user_id: userId
      },
      order: [
        ['createdAt', 'DESC']
      ],
    });
    this.ctx.body = {status: 0, msg: '获取成功', result: {memoList: memos}} as SuccessResult
  }

  @post('/memo')
  async addMemo(){
    let {userId} = this.ctx.request.body;
    let data = await this.ctx.model.Memo.create({
      user_id: userId, memo_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '新增备忘录成功', result: data} as SuccessResult
  }

  @put('/memo')
  async updateMemo(){
    let {memoId, content} = this.ctx.request.body;
    let memo = await this.ctx.model.Memo.findOne({
      where: {memo_id: memoId}
    });
    if(!memo){
      return this.ctx.body = {status: 500, msg: '此备忘录不存在'} as ErrorResult
    }
    memo.content = content;
    await memo.save();
    this.ctx.body = {status: 0, msg: '备忘录保存成功'} as SuccessResult
  }

  @del('/memo')
  async delMemo(){
    let {memoId} = this.ctx.request.body;
    let memo = await this.ctx.model.Memo.findOne({
      where: {memo_id: memoId}
    });
    if(!memo){
      return this.ctx.body = {status: 500, msg: '此备忘录不存在'} as ErrorResult
    }
    await memo.destroy();
    this.ctx.body = {status: 0, msg: '备忘录删除成功'} as SuccessResult
  }

  @get('/project/:projectId')
  async getProjectInfo(){
    let projectId: string = this.ctx.params.projectId;
    let project = await this.ctx.model.Project.findByPk(projectId);
    if(!project){
      return this.ctx.body = {status: 500, msg: '此项目不存在'} as ErrorResult
    }
    // 每个项目的创建者
    let creatorInfo = await this.ctx.model.Employee.findByPk(project.creator_id, {
      attributes: ['username', 'user_id']
    });
    // 获取加入的人
    let peoples = await this.ctx.model.Projectgroup.findAll({
      where: {
        project_id: project.project_id
      }
    });
    let peopleList = [];
    for(let pIndex in peoples){
      let userInfo = await this.ctx.model.Employee.findByPk(peoples[pIndex].user_id, {
        attributes: ['username', 'user_id', 'head_url']
      });
      peopleList.push({
        userInfo,
        groupInfo: peoples[pIndex]
      });
    }
    // 获取协同记录
    let twList = [];
    let teamWorks = await this.ctx.model.Teamwork.findAll({
      where: {
        project_id: project.project_id,
        isrefuse: 2, // 已接受
      }
    })
    for(let tIndex in teamWorks){
      // 获取帮助的工作记录
      let taskFirst = await this.ctx.model.Taskfirst.findOne({
        where: {
          tf_id: teamWorks[tIndex].tf_id
        }
      });
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
        attributes: ['username', 'user_id']
      });
      // 获取协同记录的用户信息
      let twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].executor_id, {
        attributes: ['username', 'user_id']
      });
      // 获取创建者信息
      let creatorInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].creator_id, {
        attributes: ['username', 'user_id']
      });
      twList.push({
        taskFirst,
        tfUserInfo,
        twUserInfo,
        creatorInfo,
        teamWork: teamWorks[tIndex]
      })
    }
    // 获取工作记录
    let tfList = [];
    let taskFirsts = await this.ctx.model.Taskfirst.findAll({
      where: {
        project_id: project.project_id
      }
    });
    for(let tfIndex in taskFirsts){
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].executor_id, {
        attributes: ['username', 'user_id']
      });
      // 获取创建者信息
      let creatorInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].creator_id, {
        attributes: ['username', 'user_id']
      });
      tfList.push({
        tfUserInfo,
        creatorInfo,
        taskFirst: taskFirsts[tfIndex]
      })
    }
    this.ctx.body = {status: 0, msg: '获取项目成功', result: {
        creatorInfo,
        projectInfo: project,
        peopleList,
        twList,
        tfList,
      }} as SuccessResult
  }

  @get('/projects')
  async getAllProject(){
    let projects = await this.ctx.model.Project.findAll({
      order: [
        ['createdAt', 'DESC']
      ],
    });
    let projectList = [];
    for (let i in projects){
      let project = projects[i];
      // 每个项目的创建者
      let creatorInfo = await this.ctx.model.Employee.findByPk(project.creator_id, {
        attributes: ['username', 'user_id']
      });
      // 获取加入的人
      let peoples = await this.ctx.model.Projectgroup.findAll({
        where: {
          project_id: project.project_id
        }
      });
      let peopleList = [];
      for(let pIndex in peoples){
        let userInfo = await this.ctx.model.Employee.findByPk(peoples[pIndex].user_id, {
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
      })
    }
    this.ctx.body = {status: 0, msg: '获取成功', result: {projectList}} as SuccessResult
  }

  @post('/project')
  async addProject(){
    let {userId, bgcolor, project_name, project_description, starttime, endtime, status} = this.ctx.request.body;
    let data = await this.ctx.model.Project.findOne({
      where: {
        project_name
      }
    });
    if(data){
      return this.ctx.body = {status: 500, msg: '此项目已存在'} as ErrorResult
    }
    let project = await this.ctx.model.Project.create({
      creator_id: userId, bgcolor, project_name, project_description, starttime, endtime, status, project_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '新增项目成功', result: project} as SuccessResult
  }

  @put('/project')
  async updateProject(){
    let {project_id, bgcolor, project_name, project_description, endtime, starttime, status} = this.ctx.request.body;
    let project = await this.ctx.model.Project.findOne({
      where: {project_id}
    });
    if(!project){
      return this.ctx.body = {status: 500, msg: '此项目不存在'} as ErrorResult
    }
    project.bgcolor = bgcolor;
    project.project_name = project_name;
    project.project_description = project_description;
    project.endtime = endtime;
    project.starttime = starttime;
    project.status = status;
    await project.save();
    this.ctx.body = {status: 0, msg: '项目保存成功'} as SuccessResult
  }

  @del('/project')
  async delProject(){
    let {project_id} = this.ctx.request.body;
    let project = await this.ctx.model.Project.findOne({
      where: {project_id}
    });
    if(!project){
      return this.ctx.body = {status: 500, msg: '此项目不存在'} as ErrorResult
    }
    await project.destroy();
    this.ctx.body = {status: 0, msg: '项目删除成功'} as SuccessResult
  }

  @post('/project/join')
  async joinProject(){
    let {user_role, user_id, project_id} = this.ctx.request.body;
    let data = await this.ctx.model.Projectgroup.findOne({
      where: {
        user_id,
        project_id
      }
    });
    if(data){
      return this.ctx.body = {status: 500, msg: '此成员已加入此项目'} as ErrorResult
    }
    let projectGroup = await this.ctx.model.Projectgroup.create({
      user_role, user_id, project_id
    });
    this.ctx.body = {status: 0, msg: '加入项目成功', result: projectGroup} as SuccessResult
  }

  @del('/project/exit')
  async exitProject(){
    let {user_id, project_id} = this.ctx.request.body;
    let data = await this.ctx.model.Projectgroup.findOne({
      where: {
        user_id,
        project_id
      }
    });
    if(!data){
      return this.ctx.body = {status: 500, msg: '此成员已退出此项目'} as ErrorResult
    }
    await data.destroy();
    this.ctx.body = {status: 0, msg: '成功将此成员踢出项目'} as SuccessResult
  }

  @get('/job_logging/:userId/:projectId')
  async getUserProjectJob(){
    let userId: string = this.ctx.params.userId;
    let projectId: string = this.ctx.params.projectId;
    let data = await this.ctx.model.Projectgroup.findOne({
      where: {
        user_id: userId,
        project_id: projectId
      }
    });
    if(!data){
      return this.ctx.body = {status: 500, msg: '此成员已退出此项目'} as ErrorResult
    }
    // 获取协同记录
    let twList = [];
    let teamWorks = await this.ctx.model.Teamwork.findAll({
      where: {
        project_id: projectId,
        executor_id: userId,
        isrefuse: 2, // 已接受
      }
    })
    for(let tIndex in teamWorks){
      // 获取帮助的工作记录
      let taskFirst = await this.ctx.model.Taskfirst.findOne({
        where: {
          tf_id: teamWorks[tIndex].tf_id
        }
      });
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
        attributes: ['username', 'user_id']
      });
      // 获取协同记录的用户信息
      let twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].executor_id, {
        attributes: ['username', 'user_id']
      });
      // 获取创建者信息
      let creatorInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].creator_id, {
        attributes: ['username', 'user_id']
      });
      twList.push({
        taskFirst,
        tfUserInfo,
        twUserInfo,
        creatorInfo,
        teamWork: teamWorks[tIndex]
      })
    }
    // 获取工作记录
    let tfList = [];
    let taskFirsts = await this.ctx.model.Taskfirst.findAll({
      where: {
        project_id: projectId,
        executor_id: userId
      }
    });
    for(let tfIndex in taskFirsts){
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].executor_id, {
        attributes: ['username', 'user_id']
      });
      // 获取创建者信息
      let creatorInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].creator_id, {
        attributes: ['username', 'user_id']
      });
      tfList.push({
        tfUserInfo,
        creatorInfo,
        taskFirst: taskFirsts[tfIndex]
      })
    }
    this.ctx.body = {status: 0, msg: '获取项目成功', result: {
        twList,
        tfList,
      }} as SuccessResult
  }

  @get('/projects/:userId')
  async getJoinProjects(){
    let userId: string = this.ctx.params.userId;
    const { Op } = this.ctx.app['Sequelize'];
    // 获取加入的所有项目
    let joinProjects = await this.ctx.model.Projectgroup.findAll({
      where: {user_id: userId}
    });
    let projectIdArr = [];
    for(let j in joinProjects){
      projectIdArr.push(joinProjects[j].project_id)
    }
    let projects = await this.ctx.model.Project.findAll({
      where: {
        project_id: {[Op.in]: projectIdArr},
      },
      order: [
        ['createdAt', 'DESC']
      ],
    });
    let projectList = [];
    for (let i in projects){
      let project = projects[i];
      // 每个项目的创建者
      let creatorInfo = await this.ctx.model.Employee.findByPk(project.creator_id, {
        attributes: ['username', 'user_id']
      });
      // 获取加入的人
      let peoples = await this.ctx.model.Projectgroup.findAll({
        where: {
          project_id: project.project_id
        }
      });
      let peopleList = [];
      for(let pIndex in peoples){
        let userInfo = await this.ctx.model.Employee.findByPk(peoples[pIndex].user_id, {
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
      })
    }
    this.ctx.body = {status: 0, msg: '获取成功', result: {projectList}} as SuccessResult
  }

  @post('/job_logging')
  async addJobLogging(){
    try {
      // type === 0 ? '自己' : '领导'
      let {status, tf_content, creator_id, creator_role, urgent, executor_id, project_id, description, teamWorkList, type = 0, createdAt} = this.ctx.request.body;
      let jobLogging;
      // 如果没有选择项目
      if(project_id === 'null'){
        jobLogging = await this.ctx.model.Taskfirst.create({
          tf_id: uuid().replace(/\-/g, ''), status, tf_content, creator_id, creator_role, urgent, executor_id, description, createdAt: new Date(createdAt)
        })
      }else {// 如果选择了项目
        jobLogging = await this.ctx.model.Taskfirst.create({
          tf_id: uuid().replace(/\-/g, ''), status, tf_content, creator_id, creator_role, urgent, executor_id, description, project_id, createdAt: new Date(createdAt)
        })
      }
      // 获取任务记录ID
      let tf_id = jobLogging.tf_id;
      // 循环遍历协作写入库
      for(let i in teamWorkList){
        let {status, content, urgent, executor_id, creator_id, creator_role, project_id, createdAt} = teamWorkList[i];
        if(project_id === 'null'){
          await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
          })
        }else {
          await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
          })
        }
      }
      this.ctx.body = {status: 0, msg: '任务记录添加成功', result: {}} as SuccessResult
    }catch (e) {
      this.ctx.body = {status: 500, msg: '任务记录添加失败', result: e} as ErrorResult
    }
  }

  @get('/job_logging/day')
  async getDayJobLogging(){
    let userId: string = this.ctx.query.userId;
    let timeStart: string = this.ctx.query.timeStart;
    let timeEnd: string = this.ctx.query.timeEnd;
    const { Op } = this.ctx.app['Sequelize'];
    // 获取我的协同记录
    let twList = [];
    let teamWorks = await this.ctx.model.Teamwork.findAll({
      where: {
        executor_id: userId,
        createdAt: {
          [Op.between]: [new Date(timeStart), new Date(timeEnd)]
        },
        isrefuse: {
          [Op.ne]: 1,
        }, // 不返回已拒绝的
      }
    })
    for(let tIndex in teamWorks){
      // 获取帮助的工作记录
      let taskFirst = await this.ctx.model.Taskfirst.findOne({
        where: {
          tf_id: teamWorks[tIndex].tf_id
        }
      });
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
        attributes: ['username', 'user_id', 'head_url', 'role']
      });
      // 获取协同记录的用户信息
      let twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].executor_id, {
        attributes: ['username', 'user_id', 'head_url', 'role']
      });
      // 获取创建者信息
      let creatorInfo = await this.ctx.model.Employee.findByPk(teamWorks[tIndex].creator_id, {
        attributes: ['username', 'user_id', 'head_url', 'role']
      });
      // 获取项目信息
      let project = await this.ctx.model.Project.findByPk(teamWorks[tIndex].project_id);
      twList.push({
        taskFirst,
        tfUserInfo,
        twUserInfo,
        creatorInfo,
        project,
        teamWork: teamWorks[tIndex]
      })
    }
    // 获取工作记录
    let tfList = [];
    let taskFirsts = await this.ctx.model.Taskfirst.findAll({
      where: {
        executor_id: userId,
        createdAt: {
          [Op.between]: [new Date(timeStart), new Date(timeEnd)]
        },
      }
    });
    for(let tfIndex in taskFirsts){
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].executor_id, {
        attributes: ['username', 'user_id', 'head_url', 'role']
      });
      // 获取创建者信息
      let creatorInfo = await this.ctx.model.Employee.findByPk(taskFirsts[tfIndex].creator_id, {
        attributes: ['username', 'user_id', 'head_url', 'role']
      });
      // 获取项目信息
      let project1 = await this.ctx.model.Project.findByPk(taskFirsts[tfIndex].project_id);
      // 获取此工作记录的协同列表信息
      let twList1 = [];
      let teamWorks1 = await this.ctx.model.Teamwork.findAll({
        where: {
          tf_id: taskFirsts[tfIndex].tf_id,
        }
      });
      for(let tIndex in teamWorks1){
        // 获取协同记录的用户信息
        let twUserInfo = await this.ctx.model.Employee.findByPk(teamWorks1[tIndex].executor_id, {
          attributes: ['username', 'user_id', 'head_url', 'role']
        });
        twList1.push({
          twUserInfo,
          teamWork: teamWorks1[tIndex]
        })
      }
      tfList.push({
        tfUserInfo,
        creatorInfo,
        project: project1,
        taskFirst: taskFirsts[tfIndex],
        twList: twList1
      })
    }
    this.ctx.body = {status: 0, msg: '获取任务列表成功', result: {
        twList,
        tfList,
      }} as SuccessResult
  }

  @post('/job_logging/week')
  async getWeekJobLoggings(){
    let userId: string = this.ctx.request.body.userId;
    let weekArr: Array<any> = this.ctx.request.body.weekArr;
    let weekList = [];
    const { Op } = this.ctx.app['Sequelize'];
    for(let i in weekArr){
      let {timeStart, timeEnd, week} = weekArr[i];
      timeStart = new Date(timeStart);
      timeEnd = new Date(timeEnd);
      // 获取总任务数
      let total = 0;
      let tfTotal = await this.ctx.model.Taskfirst.count({
        where: {
          executor_id: userId,
          createdAt: {
            [Op.between]: [new Date(timeStart), new Date(timeEnd)]
          },
        }
      });
      let twTotal = await this.ctx.model.Teamwork.count({
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
      let tfFinishingCount = await this.ctx.model.Taskfirst.count({
        where: {
          executor_id: userId,
          createdAt: {
            [Op.between]: [new Date(timeStart), new Date(timeEnd)]
          },
          status: 1
        }
      });
      let twFinishingCount = await this.ctx.model.Teamwork.count({
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
      let tfFinishedCount = await this.ctx.model.Taskfirst.count({
        where: {
          executor_id: userId,
          createdAt: {
            [Op.between]: [new Date(timeStart), new Date(timeEnd)]
          },
          status: 2
        }
      });
      let twFinishedCount = await this.ctx.model.Teamwork.count({
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
      let tfUnfinishedCount = await this.ctx.model.Taskfirst.count({
        where: {
          executor_id: userId,
          createdAt: {
            [Op.between]: [new Date(timeStart), new Date(timeEnd)]
          },
          status: 3
        }
      });
      let twUnfinishedCount = await this.ctx.model.Teamwork.count({
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
      })
    }
    this.ctx.body = {status: 0, msg: '获取任务列表成功', result: {
        weekList
      }} as SuccessResult
  }

  @get('/job_loggings/month')
  async getMonthUnfinishedJobLogging(){
    let userId: string = this.ctx.query.userId;
    let timeStart: string = this.ctx.query.timeStart;
    let timeEnd: string = this.ctx.query.timeEnd;
    const { Op } = this.ctx.app['Sequelize'];
    // 获取我的协同记录
    let twList = [];
    let teamWorks = await this.ctx.model.Teamwork.findAll({
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
    })
    for(let tIndex in teamWorks){
      // 获取帮助的工作记录
      let taskFirst = await this.ctx.model.Taskfirst.findOne({
        where: {
          tf_id: teamWorks[tIndex].tf_id
        }
      });
      // 获取此工作记录的用户信息
      let tfUserInfo = await this.ctx.model.Employee.findByPk(taskFirst.executor_id, {
        attributes: ['username', 'user_id', 'head_url', 'role']
      });
      twList.push({
        tfUserInfo,
        teamWork: teamWorks[tIndex]
      })
    }
    // 获取工作记录
    let taskFirsts = await this.ctx.model.Taskfirst.findAll({
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
      }} as SuccessResult
  }

  async getDateProgress(timeStart, timeEnd, userId){
    timeStart = new Date(timeStart);
    timeEnd = new Date(timeEnd);
    const { Op } = this.ctx.app['Sequelize'];
    let total = 0;
    let tfTotal = await this.ctx.model.Taskfirst.count({
      where: {
        executor_id: userId,
        createdAt: {
          [Op.between]: [new Date(timeStart), new Date(timeEnd)]
        },
      }
    });
    let twTotal = await this.ctx.model.Teamwork.count({
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
    let tfFinishedCount = await this.ctx.model.Taskfirst.count({
      where: {
        executor_id: userId,
        status: 2,
        createdAt: {
          [Op.between]: [new Date(timeStart), new Date(timeEnd)]
        },
      }
    });
    let twFinishedCount = await this.ctx.model.Teamwork.count({
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
  async getJobProgress(){
    let userId: string = this.ctx.request.body.userId;
    let dayArr: Array<any> = this.ctx.request.body.dayArr;
    let weekArr: Array<any> = this.ctx.request.body.weekArr;
    let monthArr: Array<any> = this.ctx.request.body.monthArr;
    let progressList = [];
    const { Op } = this.ctx.app['Sequelize'];
    // 日
    let dayProgress = await this.getDateProgress(dayArr[0], dayArr[1], userId);
    progressList.push({
      title: '日工作完成度',
      progress: dayProgress
    });
    // 周
    let weekProgress = await this.getDateProgress(weekArr[0], weekArr[1], userId);
    progressList.push({
      title: '周工作完成度',
      progress: weekProgress
    });
    // 月
    let monthProgress = await this.getDateProgress(monthArr[0], monthArr[1], userId);
    progressList.push({
      title: '月工作完成度',
      progress: monthProgress
    });
    // 总进度
    let totalProgress: any = 0;
    let total = 0;
    let tfTotal = await this.ctx.model.Taskfirst.count({
      where: {
        executor_id: userId,
      }
    });
    let twTotal = await this.ctx.model.Teamwork.count({
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
    let tfFinishedCount = await this.ctx.model.Taskfirst.count({
      where: {
        executor_id: userId,
        status: 2
      }
    });
    let twFinishedCount = await this.ctx.model.Teamwork.count({
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
      }} as SuccessResult
  }

  @put('/job_together')
  async updateTeamWork(){
    let {tw_id, twInfo} = this.ctx.request.body;
    let teamWork = await this.ctx.model.Teamwork.findOne({
      where: {tw_id}
    });
    if(!teamWork){
      return this.ctx.body = {status: 500, msg: '协同记录不存在'} as ErrorResult
    }
    for (let i in twInfo){
      teamWork[i] = twInfo[i]
    }
    await teamWork.save();
    this.ctx.body = {status: 0, msg: '协同信息修改成功'} as SuccessResult
  }

  @del('/job_together')
  async delTeamWork(){
    let {tw_id} = this.ctx.request.body;
    let teamWork = await this.ctx.model.Teamwork.findOne({
      where: {tw_id}
    });
    if(!teamWork){
      return this.ctx.body = {status: 500, msg: '协同记录不存在'} as ErrorResult
    }
    await teamWork.destroy();
    this.ctx.body = {status: 0, msg: '协同记录删除成功'} as SuccessResult
  }

  @post('/job_together')
  async addTeamWork(){
    let {status, content, urgent, executor_id, creator_id, creator_role, project_id, tf_id, type = 0, createdAt} = this.ctx.request.body;
    if(project_id === 'null'){
      await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
      })
    }else {
      await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
      })
    }
    this.ctx.body = {status: 0, msg: '协同记录添加成功'} as SuccessResult
  }

  @put('/job_logging')
  async updateJobLogging(){
    let {tf_id, tfInfo} = this.ctx.request.body;
    let taskfirst = await this.ctx.model.Taskfirst.findOne({
      where: {tf_id}
    });
    if(!taskfirst){
      return this.ctx.body = {status: 500, msg: '任务记录不存在'} as ErrorResult
    }
    for (let i in tfInfo){
      taskfirst[i] = tfInfo[i]
    }
    await taskfirst.save();
    this.ctx.body = {status: 0, msg: '任务信息修改成功'} as SuccessResult
  }

  @del('/job_logging')
  async delJobLogging(){
    let {tf_id} = this.ctx.request.body;
    let taskfirst = await this.ctx.model.Taskfirst.findOne({
      where: {tf_id}
    });
    if(!taskfirst){
      return this.ctx.body = {status: 500, msg: '任务记录不存在'} as ErrorResult
    }
    await taskfirst.destroy();
    this.ctx.body = {status: 0, msg: '任务记录删除成功'} as SuccessResult
  }

  @get('/week')
  async getWeekEvaluate(){
    let {evaluated_id, startweekdate, endweekdate,} = this.ctx.query;
    startweekdate = new Date(startweekdate);
    endweekdate = new Date(endweekdate);
    let data = await this.ctx.model.Week.findOne({
      where: {
        startweekdate, endweekdate, evaluated_id
      }
    });
    if(!data){
      return this.ctx.body = {status: 500, msg: '评语不存在'} as ErrorResult
    }
    this.ctx.body = {status: 0, msg: '评语获取成功', result: data,} as SuccessResult
  }

  @post('/week')
  async addWeekEvaluate(){
    let {score, evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id} = this.ctx.request.body;
    startweekdate = new Date(startweekdate);
    endweekdate = new Date(endweekdate);
    let data = await this.ctx.model.Week.findOne({
      where: {
        startweekdate, endweekdate, evaluated_id
      }
    });
    if(data){
      data.score = score;
      data.evaluate = evaluate;
      await data.save();
    }else {
      data = await this.ctx.model.Week.create({
        score, evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id, week_id: uuid().replace(/\-/g, '')
      });
    }
    this.ctx.body = {status: 0, msg: '评语保存成功'} as SuccessResult
  }

  @put('/notice')
  async updateNotice(){
    let {notice_id} = this.ctx.request.body;
    let data = await this.ctx.model.Notice.findOne({
      where: {
        notice_id
      }
    });
    if(!data){
      return this.ctx.body = {status: 500, msg: '此提醒不存在'} as ErrorResult
    }
    data.isRead = 1;
    await data.save();
    this.ctx.body = {status: 0, msg: '已读成功'} as SuccessResult
  }

  @get('/notices')
  async getAllNotices(){ // 获取所有未读消息
    let notices = await this.ctx.model.Notice.findAll({
      where: {
        isRead: 0,
      },
      order: [
        ['createdAt', 'DESC']
      ],
    });
    let noticeList = [];
    for(let i in notices){
      let userInfo = await this.ctx.model.Employee.findByPk(notices[i].reminder_id, {
        attributes: ['username', 'user_id', 'role', 'head_url']
      });
      noticeList.push({
        reminderInfo: userInfo,
        notice: notices[i]
      })
    }
    this.ctx.body = {status: 0, msg: '未读消息获取成功', result: {noticeList}} as SuccessResult
  }

  @post('/notice')
  async addNotice(){
    let {reminder_id, message} = this.ctx.request.body;
    let data = await this.ctx.model.Notice.findOne({
      where: {
        message, reminder_id
      }
    });
    if(data){
      return this.ctx.body = {status: 500, msg: '你已经提醒过一次了'} as ErrorResult
    }
    data = await this.ctx.model.Notice.create({
      reminder_id, message, notice_id: uuid().replace(/\-/g, '')
    });
    this.ctx.body = {status: 0, msg: '提醒成功'} as SuccessResult
  }

  @post('/uploadFile')
  async uploadFile(){
    const { ctx } = this;
    // 获取文件流
    const stream = await ctx.getFileStream();
    let {userId} = ctx.query;
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
    mkdirsSync(path.join(__dirname,uploadBasePath, dirname));
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
  async login(){
    let {username, password, verifycode: captcha} = this.ctx.request.body;
    if(!this.ctx.session.captcha){
      return this.ctx.body = {
        msg: '验证码已过期',
        status: 500,
      } as ErrorResult;
    }
    if(captcha.toUpperCase() !== this.ctx.session.captcha.toUpperCase()){
      return this.ctx.body = {
        msg: '验证码错误',
        status: 500,
      } as ErrorResult;
    }
    password = md5(password);
    let data = await this.ctx.model.Employee.findOne({
      where: {username, password}
    });
    if(!data){
      return this.ctx.body = {
        msg: '用户名或密码错误',
        status: 500,
      } as ErrorResult;
    }
    const user = await this.service.getUser({id: data.user_id});
    this.ctx.body = user;
  }

  @post('/sendCode')
  async sendCode(){
    try {
      let {email: toEmail} = this.ctx.request.body;
      let code = getCode(6);
      console.log(code);
      let data = await sendEmail(toEmail, 'WEBLINKON验证码', `【纬领工作平台平台】您的邮箱验证码是：${code}。验证码有效期：1分钟。工作人员不会向您索要，索要验证码的都是骗子，如非本人操作请忽略。`);
      this.ctx.session.yzm = code; //设置session captcha 为生成的验证码字符串
      this.ctx.body = {
        status: 0,
        msg: '验证码发送成功',
        result: data
      } as SuccessResult
    }catch (e) {
      this.ctx.body = {
        msg: '邮箱发送失败',
        status: 500,
        result: e
      } as ErrorResult;
    }
  }

  @post('/sendEmail')
  async sendEmail(){
    try {
      let {email: toEmail, title, text, html} = this.ctx.request.body;
      let data = await sendEmail(toEmail, title, text, html);
      this.ctx.body = {
        status: 0,
        msg: '邮箱发送成功',
        result: data
      } as SuccessResult
    }catch (e) {
      this.ctx.body = {
        msg: '邮箱发送失败',
        status: 500,
        result: e
      } as ErrorResult;
    }
  }

}
