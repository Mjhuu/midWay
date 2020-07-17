import { Context, inject, controller, get, provide } from 'midway';
let svgCaptcha = require('svg-captcha');

@provide()
@controller('/')
export class HomeController {

  @inject()
  ctx: Context;

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
}
