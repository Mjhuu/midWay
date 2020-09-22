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
        let logs = await this.ctx.model.Log.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        let logList = [];
        for(let i in logs){
            let user_id = logs[i].user_id;
            let userInfo = await this.ctx.model.Employee.findByPk(user_id, {
                attributes: ['username']
            });
            logList.push({
                userInfo,
                logInfo: logs[i]
            })
        }
        this.ctx.body = {
            status: 0, msg: '获取成功', result: {
                logList
            }
        } as SuccessResult;
    }
}
