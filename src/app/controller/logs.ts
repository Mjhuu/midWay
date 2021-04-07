import {Context, controller, get, inject, provide,} from 'midway';
import {SuccessResult} from "../../interface";

@provide()
@controller('/logs')
export class LogsController {

    @inject()
    ctx: Context;
    // 获取日志
    @get('/')
    async getLogs() {
        let { page = 1, size = 10 } = this.ctx.query;
        let offset = (page - 1) * size;
        size = parseInt(size);
        offset = offset <= 0 ? 0 : offset;
        let logs = await this.ctx.model.Log.findAll({
            limit: size,
            offset: offset,
            order: [
                ['createdAt', 'DESC']
            ],
        });
        let allCount = await this.ctx.model.Log.count({});
        let logList = [];
        for(let i in logs){
            let user_id = logs[i].user_id;
            let userInfo = await this.ctx.model.Employee.findByPk(user_id, {
                attributes: ['username']
            });
            logList.push({
                userInfo: userInfo || {username: '已删除'},
                logInfo: logs[i]
            })
        }
        this.ctx.body = {
            status: 0, msg: '获取成功', result: {
                logList,
                total: allCount
            }
        } as SuccessResult;
    }
}
