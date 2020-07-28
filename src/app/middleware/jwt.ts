import {Context} from 'midway';
import {ErrorResult} from '../../interface';
import {Jwt} from '../jwt/jwt';

module.exports = options => {
    return async function jwt(ctx: Context, next) {
        if (ctx.url !== '/' && !ctx.url.includes('/login') && !ctx.url.includes('/captcha')) {
            if (!ctx.headers.referer) {
                return ctx.body = {status: 403, msg: '只能在纬领工作台使用此接口'} as ErrorResult;
            }
            if (!ctx.headers.referer.includes('http://192.168.0.102:3000') && !ctx.headers.referer.includes('http://192.168.0.102:7001') && !ctx.headers.referer.includes('http://192.168.0.79:7003')) {
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
                await next();
            }
        } else {
            await next();
        }
    };
};
