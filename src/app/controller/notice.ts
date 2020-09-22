import {Context, controller, get, inject, post, provide, put,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/notice')
export class NoticeController {

    @inject()
    ctx: Context;

    @put('/')
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

    @get('/all')
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

    @post('/')
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
}
