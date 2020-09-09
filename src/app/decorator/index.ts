import {uuid} from "uuidv4";
import {JobType} from "../common";

/**
 * 正常的自己操作的日志
 * @param logValue
 */
export function normalLog(logValue: string) {
    return function (target, key, descriptor) {
        let oldMethods = descriptor.value;
        descriptor.value = function (ctx, next) {
            const {userid} = ctx.headers;
            ctx.model.Log.create({
                log_id: uuid().replace(/\-/g, ''),
                user_id: userid,
                ip: ctx.request.ip,
                do_thing: logValue || '---',
                type: JobType.changePassword
            }).then(data => {
                console.log('log记录已入库');
            }).catch(e => console.error(e))
            return oldMethods.apply(this, arguments)
        };
        return descriptor
    }
}

/**
 * 操作更改他人信息的log
 * @param first
 * @param second
 * @param userId 用户id的key
 */
export function actionOtherLog({first, second, userId}: {first: string, second: string, userId: string}) {
    return function (target, key, descriptor) {
        let oldMethods = descriptor.value;
        descriptor.value = function (ctx, next) {
            const {userid} = ctx.headers;
            // 被修改者的id
            let beUserId = ctx.request.body[userId];
            ctx.model.Employee.findOne({
                where: {user_id: beUserId}
            }).then(data => {
                if (!data) {
                    return '用户不存在'
                }
                ctx.model.Log.create({
                    log_id: uuid().replace(/\-/g, ''),
                    user_id: userid,
                    ip: ctx.request.ip,
                    do_thing: first + `【 ${data.username} 】` + second,
                    type: JobType.changePassword
                }).then(data => {
                    console.log('log记录已入库');
                }).catch(e => console.error(e))
            });

            return oldMethods.apply(this, arguments)
        };
        return descriptor
    }
}
