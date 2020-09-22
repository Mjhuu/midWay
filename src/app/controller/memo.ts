import {Context, controller, del, get, inject, post, provide, put,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/memo')
export class MemoController {

    @inject()
    ctx: Context;

    @get('/all/:userId')
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

    @post('/')
    async addMemo() {
        const {userId} = this.ctx.request.body;
        const data = await this.ctx.model.Memo.create({
            user_id: userId, memo_id: uuid().replace(/\-/g, '')
        });
        this.ctx.body = {status: 0, msg: '新增备忘录成功', result: data} as SuccessResult;
    }

    @put('/')
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

    @del('/')
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
}
