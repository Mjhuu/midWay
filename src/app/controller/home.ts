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

  @get('/chip')
  async chip() {
    await this.ctx.render('chip', {
      // 芯片公司
      chipCompany: [
        {name: 'Xilinx', desc: '该公司发明了现场可编程逻辑门阵列，并由此成名。', url: 'https://www.xilinx.com/', logo: 'https://www.xilinx.com/etc.clientlibs/site/clientlibs/xilinx/site-all/resources/imgs/header/xilinx-header-logo.svg'},
        {name: '英特尔® FPGA', desc: 'FPGA是一种半导体集成电路，支持定制电气功能以加速关键工作负载。', url: 'https://www.intel.cn/content/www/cn/zh/products/programmable.html', logo: 'https://www.intel.cn/content/dam/logos/intel-header-logo.svg'},
        {name: 'ADI', desc: 'ADI是业界卓越的半导体公司', url: 'https://www.analog.com/', logo: 'https://assets.analog.com/images/en/ADI_Logo_AWP.png'},
        {name: '英飞凌', desc: 'Infineon Technologies AG英飞凌是世界功率半导体市场的领导者', url: 'https://www.infineon.com/cms/en/', logo: 'https://www.infineon.com/frontend/release_2020-11-2/dist/resources/img/logo-desktop-cn.png'},
        {name: '新思科技', desc: '新思科技是全球排名第一的电子设计自动化(EDA) 解决方案提供商', url: 'https://www.synopsys.com/', logo: 'https://bkimg.cdn.bcebos.com/pic/9f2f070828381f30c01c5783ab014c086e06f097'},
        {name: 'Microchip', desc: '连接和安全的嵌入式控制解决方案的领先提供商', url: 'https://www.microchip.com/', logo: 'https://www.microchip.com/content/experience-fragments/mchp/en_us/site/header/master/_jcr_content/root/responsivegrid/header/logo.coreimg.100.300.png/1605828081463/microchip.png'},
        {name: '韩国国家仪器有限公司', desc: '---', url: 'https://www.ni.com/ko-kr.html', logo: 'https://ni.scene7.com/is/image/ni/logo_2020?fmt=png-alpha'},
        {name: '京微雅格', desc: '---', url: 'http://www.capital-micro.com/', logo: 'http://www.capital-micro.com/cme/images/logo.jpg'},
        {name: '复旦微电子集团', desc: '---', url: 'http://www.fmsh.com/index.shtml', logo: 'http://www.fmsh.com/UpLoadFile/20170502/dcb56bd3-221e-4b86-b266-ecfb5f91fb24.jpg'},
        {name: '高云', desc: '专业从事国产现场可编程逻辑器件(FPGA)研发与产业化为核心,', url: 'http://www.gowinsemi.com.cn/search.aspx?key=FPGA', logo: 'https://0.rc.xiniu.com/g2/M00/88/36/CgAGfFrhK2GAamcdAAAmQTLsTfU468.png'},
        {name: '全球芯', desc: '---', url: 'http://www.globalizex.com/', logo: 'https://10792437.s21i.faiusr.com/2/ABUIABACGAAgw82M_wUojaObmgYw8gM40wE.jpg'},
        {name: 'AGM', desc: 'AGM Micro是领先的可编程SoC、通用32位MCU、和异构（MCU）边缘计算芯片和方案提供商', url: 'http://www.alta-gate.com/products.aspx?lang=cn&id=61&p=14', logo: 'http://www.alta-gate.com/images/common/logo-1.jpg'},
        {name: '安路', desc: '国产FPGA创新者', url: 'http://www.anlogic.com/', logo: 'https://0.rc.xiniu.com/g2/M00/1A/CA/CgAGe1yCYjWAQjUDAAAXmE88dpg262.png?d=20181205152921'},
        {name: '智多晶', desc: '公司专注可编程逻辑电路器件技术的研发', url: 'http://www.isilicontech.com/', logo: 'http://pro7761bf25.pic15.websiteonline.cn/upload/IST.png'},
      ],
      // 社区论坛
      BBS: [
        {name: 'Xilinx社区论坛', desc: '一个分享、讨论和相互协作解决问题的交流社区', url: 'https://forums.xilinx.com/', logo: 'https://www.xilinx.com/etc.clientlibs/site/clientlibs/xilinx/site-all/resources/imgs/header/xilinx-header-logo.svg'},
        {name: 'Xilinx博客', desc: '行业趋势，最新的Xilinx AI和软件新闻，产品更新和技术见解', url: 'https://www.xilinx.com/about/blogs.html', logo: 'https://www.xilinx.com/etc.clientlibs/site/clientlibs/xilinx/site-all/resources/imgs/header/xilinx-header-logo.svg'},
        {name: '知乎-FPGA', desc: '---', url: 'https://www.zhihu.com/topic/19570427/hot', logo: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1608089239188&di=70fbf0ab6002705353af17a378c0a539&imgtype=0&src=http%3A%2F%2Fg.hiphotos.baidu.com%2Fbaike%2Fpic%2Fitem%2F1b4c510fd9f9d72a26f9db77df2a2834349bbb3f.jpg'},
        {name: '英飞凌新闻', desc: 'Infineon Technologies AG英飞凌是世界功率半导体市场的领导者', url: 'https://www.infineon.com/cms/cn/about-infineon/press/press-releases/', logo: 'https://www.infineon.com/frontend/release_2020-11-2/dist/resources/img/logo-desktop-cn.png'},
        {name: '英飞凌应用领域', desc: 'Infineon Technologies AG英飞凌是世界功率半导体市场的领导者', url: 'https://www.infineon.com/cms/cn/applications/', logo: 'https://www.infineon.com/frontend/release_2020-11-2/dist/resources/img/logo-desktop-cn.png'},
        {name: 'D&R', desc: '传播有关电子虚拟组件（特别是IP（知识产权）和SoC（片上系统））的增值信息', url: 'https://www.design-reuse-china.com/', logo: 'https://www.design-reuse-china.com/IMAGES/Homepage/designreuse.gif'},
        {name: '新思科技博客', desc: '新思科技是全球排名第一的电子设计自动化(EDA) 解决方案提供商', url: 'https://www.synopsys.com/blogs/smart-everything/zh-cn/', logo: 'https://bkimg.cdn.bcebos.com/pic/9f2f070828381f30c01c5783ab014c086e06f097'},
        {name: '贸泽电子技术资源', desc: '贸泽电子(Mouser.cn)为半导体和电子元器件业的全球分销商', url: 'https://www.mouser.cn/technical-resources/', logo: 'https://www.mouser.cn/images/aptimized-png-1ED6E0CC675098CB75D482FDBA8FA948-MzU0UeZS1s$MTUxPLdbPzS8tTi3SLUpN183JT8$XTc4o1ivIS7fPyy8uKMosSQUA-dceeb62e.png'},
        {name: '得捷电子博客', desc: '供应商直授权电子元器件分销商', url: 'https://www.digikey.cn/zh/blog', logo: 'https://www.digikey.cn/-/media/Images/Header/logo_dk.png?la=zh-CN-RMB&ts=1a773fa3-b656-418a-8e50-67fff895081a'},
        {name: 'element14社区', desc: '---', url: 'https://www.element14.com/community/welcome', logo: 'https://kr.element14.com/wcsstore/AuroraB2BStorefrontAssetStore/images/element14-logo.svg'},
        {name: 'hackster', desc: '硬件社区', url: 'https://www.hackster.io/', logo: 'https://prod.hackster-cdn.online/assets/hackster_avnet_logo_blue-1b4e4fdb9ca5ceb1b0fff22a40150643485564c86e07fe4fc0dc562335b5fcdf.png'},
        {name: '电子发烧友论坛-FPGA|CPLD|ASIC论坛', desc: '---', url: 'https://bbs.elecfans.com/zhuti_fpga_1.html', logo: 'https://bbs.elecfans.com/static/image/common/logo_new.png'},
        {name: 'NI社区', desc: '---', url: 'https://forums.ni.com/?profile.language=ko', logo: 'https://ni.scene7.com/is/image/ni/logo_2020?fmt=png-alpha'},
        {name: '中国首个开放源码硬件社区', desc: '---', url: 'http://www.openhw.org/', logo: 'http://nwzimg.wezhan.hk/contents/sitefiles3601/18008104/images/1721556.png'},
        {name: '电子创新网赛灵思中文社区', desc: '---', url: 'http://xilinx.eetrend.com/', logo: 'http://xilinx.eetrend.com/sites/all/themes/Xilinx/logo.svg'},
        {name: '中国电子网', desc: '---', url: 'http://bbs.21ic.com', logo: 'https://bbs.21ic.com/qstatic/image/index/logo.jpg'},
        {name: '中国电子顶级开发网赛灵思（Xilinx）社区', desc: '---', url: 'http://xilinx.eetop.cn/', logo: 'http://xilinx.eetop.cn/statics/images/default/xilinx-logo.png'},
        {name: '易特创芯', desc: '---', url: 'http://bbs.eetop.cn/', logo: 'http://bbs.eetop.cn/static/image/common/logo_dz.png'},
        {name: '全球芯新闻', desc: '---', url: 'http://www.globalizex.com/h-col-104.html', logo: 'https://10792437.s21i.faiusr.com/2/ABUIABACGAAgw82M_wUojaObmgYw8gM40wE.jpg'},
        {name: '安路新闻', desc: '国产FPGA创新者', url: 'http://www.anlogic.com/news.aspx?FId=n2:2:2', logo: 'https://0.rc.xiniu.com/g2/M00/1A/CA/CgAGe1yCYjWAQjUDAAAXmE88dpg262.png?d=20181205152921'},
        {name: '紫光同创', desc: '---', url: 'https://www.pangomicro.com/news/Cnew/index.html', logo: 'https://www.pangomicro.com/common/images/zgtclogo.png'},
        {name: 'IEEE', desc: 'IEEE Xplore，提供对世界上最高质量的工程技术文献', url: 'https://ieeexplore.ieee.org/search/searchresult.jsp?newsearch=true&queryText=FPGA', logo: 'https://ieeexplore.ieee.org/assets/img/xplore_logo_white.png'},
      ],
      // 高校以及科研机构
      colleges: [
        {name: '清华大学微电子学研究所', desc: '---', url: 'http://www.ime.tsinghua.edu.cn/', logo: 'https://www.tsinghua.edu.cn/images/logo_1.svg'},
        {name: '复旦微电子学院', desc: '---', url: 'https://sme.fudan.edu.cn/', logo: 'https://sme.fudan.edu.cn/static/fudan/img/logo.png'},
      ],
      // 芯片商城
      shop: [
        {name: '贸泽电子', desc: '贸泽电子(Mouser.cn)为半导体和电子元器件业的全球分销商', url: 'https://www.mouser.cn/', logo: 'https://www.mouser.cn/images/aptimized-png-1ED6E0CC675098CB75D482FDBA8FA948-MzU0UeZS1s$MTUxPLdbPzS8tTi3SLUpN183JT8$XTc4o1ivIS7fPyy8uKMosSQUA-dceeb62e.png'},
        {name: '得捷电子', desc: '供应商直授权电子元器件分销商', url: 'https://www.digikey.cn/', logo: 'https://www.digikey.cn/-/media/Images/Header/logo_dk.png?la=zh-CN-RMB&ts=1a773fa3-b656-418a-8e50-67fff895081a'},
        {name: 'element14', desc: '---', url: 'https://kr.element14.com/', logo: 'https://kr.element14.com/wcsstore/AuroraB2BStorefrontAssetStore/images/element14-logo.svg'},
        {name: 'pandaparts', desc: '熊猫配件，购买电子配件的第一服务', url: 'https://pandaparts.co.kr/', logo: 'https://pandaparts.co.kr/assets/images/pandalogo.png'},
        {name: 'ICBANQ', desc: '---', url: 'https://www.icbanq.com/', logo: 'https://www.icbanq.com/images/renew_pc/common/logo_newone.jpg'},
      ]
    });
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
