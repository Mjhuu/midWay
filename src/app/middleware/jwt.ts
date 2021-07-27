import {Context} from 'midway';
import {ErrorResult} from '../../interface';
import {Jwt} from '../jwt/jwt';
import {
    localServerIpAndPort,
    localWebIpAndPort,
    onlineServerDomainAndPort, onlineServerHttpsDomainAndPort,
    onlineServerIpAndPort, wxMiniProgrammer
} from "../../otherConfig";

module.exports = options => {
    return async function jwt(ctx: Context, next) {
        const {clientip} = ctx.headers;
        /*修改IP开始*/
        if(clientip && clientip !== 'null'){
            ctx.request.ip = clientip;
        }
        /*修改IP结束*/
        if (ctx.url !== '/' && !ctx.url.includes('/chip') && !ctx.url.includes('/login') && !ctx.url.includes('/captcha') && !ctx.url.includes('/wx')) {
            if (!ctx.headers.referer) {
                return ctx.body = {status: 403, msg: '只能在纬领工作台使用此接口'} as ErrorResult;
            }
            if (!ctx.headers.referer.includes(localWebIpAndPort) && !ctx.headers.referer.includes(localServerIpAndPort) && !ctx.headers.referer.includes(onlineServerIpAndPort) && !ctx.headers.referer.includes(onlineServerDomainAndPort) && !ctx.headers.referer.includes(onlineServerHttpsDomainAndPort) && !ctx.headers.referer.includes(wxMiniProgrammer)) {
                return ctx.body = {status: 403, msg: '非法请求'} as ErrorResult;
            }
            const {token, userid} = ctx.headers;
            if (!token) {
                return ctx.body = {status: 403, msg: '只能已登录用户才可以在纬领工作台使用此接口'} as ErrorResult;
            }
            const jwt = new Jwt(token);
            const result = jwt.verifyToken();
            if (result === 'err') {
                return ctx.body = {status: 403, msg: '登录已过期，请重新登录'} as ErrorResult;
            } else { // token未过期
                const userId = result.userId;
                if (userId !== userid) {
                    return ctx.body = {status: 403, msg: '非法用户'} as ErrorResult;
                }
                // 查询管理员信息
                const user = await ctx.model.Employee.findOne({where: {user_id: userId}});
                if (!user) {
                    return ctx.body = {status: 403, msg: '暂无此用户'} as ErrorResult;
                }
                if(user.leaveOffice === 1){
                    return ctx.body = {status: 403, msg: '你已离职，无权使用系统'} as ErrorResult;
                }
                // 暂时不需要
               /* ctx.model.Log.create({
                    log_id: uuid().replace(/\-/g, ''),
                    user_id: userid,
                    ip: ctx.request.ip,
                    do_thing: `调用了（${ctx.url}）Api`,
                    type: JobType.callApi
                }).then(data => {
                    console.log('log记录已入库');
                }).catch(e => console.error(e))*/
                await next();
            }
        } else {
            await next();
        }
    };
};
