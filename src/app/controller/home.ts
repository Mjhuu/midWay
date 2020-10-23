import {Context, inject, controller, get, post, provide, } from 'midway';
import {ErrorResult, IUserService, SuccessResult} from '../../interface';
import {getCode} from "../common";
import {sendEmail} from "../../otherConfig";

const svgCaptcha = require('svg-captcha');
const path = require('path');
const fs = require('fs');
// 故名思意 异步二进制 写入流
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入一个虫洞。
const sendToWormhole = require('stream-wormhole');
const dayjs = require('dayjs');

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

  @post('/sendCode')
  async sendCode() {
    try {
      const {email: toEmail} = this.ctx.request.body;
      const code = getCode(6);
      const data = await sendEmail(toEmail, 'WEBLINKON验证码', `【纬领工作平台】您的邮箱验证码是：${code}。验证码有效期：1分钟。工作人员不会向您索要，索要验证码的都是骗子，如非本人操作请忽略。`);
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
