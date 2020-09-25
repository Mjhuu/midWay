"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeController = void 0;
const midway_1 = require("midway");
const common_1 = require("../common");
const otherConfig_1 = require("../../otherConfig");
const svgCaptcha = require('svg-captcha');
const path = require('path');
const fs = require('fs');
// 故名思意 异步二进制 写入流
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入一个虫洞。
const sendToWormhole = require('stream-wormhole');
const dayjs = require('dayjs');
let HomeController = class HomeController {
    async index() {
        await this.ctx.render('index');
    }
    // 获取验证码
    async captcha() {
        const captcha = svgCaptcha.create({
            size: 4,
            ignoreChars: 'oO1il',
            noise: 5,
            height: 44,
        });
        this.ctx.session.captcha = captcha.text.toLocaleLowerCase(); // 设置session captcha 为生成的验证码字符串
        this.ctx.response['type'] = 'svg';
        this.ctx.body = captcha.data;
    }
    async uploadFile() {
        const { ctx } = this;
        // 获取文件流
        const stream = await ctx.getFileStream();
        const { userId } = ctx.query;
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
        }
        catch (err) {
            // 如果出现错误，关闭管道
            await sendToWormhole(stream);
            ctx.body = {
                msg: '文件上传失败',
                result: err,
                status: 500,
            };
        }
        ctx.body = {
            result: {
                url: path.join('/upload', dirname, filename)
            },
            msg: '文件上传成功',
            fields: stream.fields,
            status: 0,
        };
    }
    async sendCode() {
        try {
            const { email: toEmail } = this.ctx.request.body;
            const code = common_1.getCode(6);
            const data = await otherConfig_1.sendEmail(toEmail, 'WEBLINKON验证码', `【纬领工作平台平台】您的邮箱验证码是：${code}。验证码有效期：1分钟。工作人员不会向您索要，索要验证码的都是骗子，如非本人操作请忽略。`);
            this.ctx.session.yzm = code; // 设置session captcha 为生成的验证码字符串
            this.ctx.body = {
                status: 0,
                msg: '验证码发送成功',
                result: data
            };
        }
        catch (e) {
            this.ctx.body = {
                msg: '邮箱发送失败',
                status: 500,
                result: e
            };
        }
    }
    async sendEmail() {
        try {
            const { email: toEmail, title, text, html } = this.ctx.request.body;
            const data = await otherConfig_1.sendEmail(toEmail, title, text, html);
            this.ctx.body = {
                status: 0,
                msg: '邮箱发送成功',
                result: data
            };
        }
        catch (e) {
            this.ctx.body = {
                msg: '邮箱发送失败',
                status: 500,
                result: e
            };
        }
    }
};
__decorate([
    midway_1.inject(),
    __metadata("design:type", Object)
], HomeController.prototype, "ctx", void 0);
__decorate([
    midway_1.inject('userService'),
    __metadata("design:type", Object)
], HomeController.prototype, "service", void 0);
__decorate([
    midway_1.get('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "index", null);
__decorate([
    midway_1.get('/captcha'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "captcha", null);
__decorate([
    midway_1.post('/uploadFile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "uploadFile", null);
__decorate([
    midway_1.post('/sendCode'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "sendCode", null);
__decorate([
    midway_1.post('/sendEmail'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "sendEmail", null);
HomeController = __decorate([
    midway_1.provide(),
    midway_1.controller('/')
], HomeController);
exports.HomeController = HomeController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9tZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcHAvY29udHJvbGxlci9ob21lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF5RTtBQUV6RSxzQ0FBa0M7QUFDbEMsbURBQTRDO0FBRTVDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMxQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLGlCQUFpQjtBQUNqQixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUM3RCxZQUFZO0FBQ1osTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDbEQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBSS9CLElBQWEsY0FBYyxHQUEzQixNQUFhLGNBQWM7SUFTekIsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCxRQUFRO0lBRVIsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ2hDLElBQUksRUFBRSxDQUFDO1lBQ1AsV0FBVyxFQUFFLE9BQU87WUFDcEIsS0FBSyxFQUFFLENBQUM7WUFDUixNQUFNLEVBQUUsRUFBRTtTQUNYLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQywrQkFBK0I7UUFDNUYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDL0IsQ0FBQztJQUdELEtBQUssQ0FBQyxVQUFVO1FBQ2QsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNyQixRQUFRO1FBQ1IsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDekMsTUFBTSxFQUFDLE1BQU0sRUFBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDM0IsUUFBUTtRQUNSLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDO1FBQzVDLFFBQVE7UUFDUixNQUFNLFFBQVEsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUM7UUFDckksUUFBUTtRQUNSLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzFGLFNBQVMsVUFBVSxDQUFDLE9BQU87WUFDekIsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMxQixPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN0QixPQUFPLElBQUksQ0FBQzthQUNiO1FBQ0gsQ0FBQztRQUNELFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUMxRCxTQUFTO1FBQ1QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RSxNQUFNO1FBQ04sTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELElBQUk7WUFDRixZQUFZO1lBQ1osTUFBTSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7U0FDbEQ7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLGNBQWM7WUFDZCxNQUFNLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QixHQUFHLENBQUMsSUFBSSxHQUFHO2dCQUNULEdBQUcsRUFBRSxRQUFRO2dCQUNiLE1BQU0sRUFBRSxHQUFHO2dCQUNYLE1BQU0sRUFBRSxHQUFHO2FBQ0csQ0FBQztTQUNsQjtRQUNELEdBQUcsQ0FBQyxJQUFJLEdBQUc7WUFDVCxNQUFNLEVBQUU7Z0JBQ04sR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUM7YUFDN0M7WUFDRCxHQUFHLEVBQUUsUUFBUTtZQUNiLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtZQUNyQixNQUFNLEVBQUUsQ0FBQztTQUNPLENBQUM7SUFDckIsQ0FBQztJQUdELEtBQUssQ0FBQyxRQUFRO1FBQ1osSUFBSTtZQUNGLE1BQU0sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQy9DLE1BQU0sSUFBSSxHQUFHLGdCQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBUyxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsc0JBQXNCLElBQUksOENBQThDLENBQUMsQ0FBQztZQUNoSSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsK0JBQStCO1lBQzVELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHO2dCQUNkLE1BQU0sRUFBRSxDQUFDO2dCQUNULEdBQUcsRUFBRSxTQUFTO2dCQUNkLE1BQU0sRUFBRSxJQUFJO2FBQ0ksQ0FBQztTQUNwQjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUc7Z0JBQ2QsR0FBRyxFQUFFLFFBQVE7Z0JBQ2IsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsTUFBTSxFQUFFLENBQUM7YUFDSyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztJQUdELEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSTtZQUNGLE1BQU0sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ2xFLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRztnQkFDZCxNQUFNLEVBQUUsQ0FBQztnQkFDVCxHQUFHLEVBQUUsUUFBUTtnQkFDYixNQUFNLEVBQUUsSUFBSTthQUNJLENBQUM7U0FDcEI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHO2dCQUNkLEdBQUcsRUFBRSxRQUFRO2dCQUNiLE1BQU0sRUFBRSxHQUFHO2dCQUNYLE1BQU0sRUFBRSxDQUFDO2FBQ0ssQ0FBQztTQUNsQjtJQUNILENBQUM7Q0FFRixDQUFBO0FBaEhDO0lBREMsZUFBTSxFQUFFOzsyQ0FDSTtBQUdiO0lBREMsZUFBTSxDQUFDLGFBQWEsQ0FBQzs7K0NBQ0E7QUFHdEI7SUFEQyxZQUFHLENBQUMsR0FBRyxDQUFDOzs7OzJDQUdSO0FBSUQ7SUFEQyxZQUFHLENBQUMsVUFBVSxDQUFDOzs7OzZDQVdmO0FBR0Q7SUFEQyxhQUFJLENBQUMsYUFBYSxDQUFDOzs7O2dEQThDbkI7QUFHRDtJQURDLGFBQUksQ0FBQyxXQUFXLENBQUM7Ozs7OENBbUJqQjtBQUdEO0lBREMsYUFBSSxDQUFDLFlBQVksQ0FBQzs7OzsrQ0FpQmxCO0FBakhVLGNBQWM7SUFGMUIsZ0JBQU8sRUFBRTtJQUNULG1CQUFVLENBQUMsR0FBRyxDQUFDO0dBQ0gsY0FBYyxDQW1IMUI7QUFuSFksd0NBQWMifQ==