"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../jwt/jwt");
const otherConfig_1 = require("../../otherConfig");
module.exports = options => {
    return async function jwt(ctx, next) {
        const { clientip } = ctx.headers;
        /*修改IP开始*/
        if (clientip && clientip !== 'null') {
            ctx.request.ip = clientip;
        }
        /*修改IP结束*/
        if (ctx.url !== '/' && !ctx.url.includes('/login') && !ctx.url.includes('/captcha')) {
            if (!ctx.headers.referer) {
                return ctx.body = { status: 403, msg: '只能在纬领工作台使用此接口' };
            }
            if (!ctx.headers.referer.includes(otherConfig_1.localWebIpAndPort) && !ctx.headers.referer.includes(otherConfig_1.localServerIpAndPort) && !ctx.headers.referer.includes(otherConfig_1.onlineServerIpAndPort) && !ctx.headers.referer.includes(otherConfig_1.onlineServerDomainAndPort) && !ctx.headers.referer.includes(otherConfig_1.onlineServerHttpsDomainAndPort)) {
                return ctx.body = { status: 403, msg: '非法请求' };
            }
            const { token, userid } = ctx.headers;
            if (!token) {
                return ctx.body = { status: 403, msg: '只能已登录用户才可以在纬领工作台使用此接口' };
            }
            const jwt = new jwt_1.Jwt(token);
            const result = jwt.verifyToken();
            if (result === 'err') {
                return ctx.body = { status: 403, msg: '登录已过期，请重新登录' };
            }
            else { // token未过期
                const userId = result.userId;
                if (userId !== userid) {
                    return ctx.body = { status: 403, msg: '非法用户' };
                }
                // 查询管理员信息
                const user = await ctx.model.Employee.findOne({ where: { user_id: userId } });
                if (!user) {
                    return ctx.body = { status: 403, msg: '暂无此用户' };
                }
                if (user.leaveOffice === 1) {
                    return ctx.body = { status: 403, msg: '你已离职，无权使用系统' };
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
        }
        else {
            await next();
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwcC9taWRkbGV3YXJlL2p3dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLG9DQUErQjtBQUMvQixtREFLMkI7QUFFM0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsRUFBRTtJQUN2QixPQUFPLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBWSxFQUFFLElBQUk7UUFDeEMsTUFBTSxFQUFDLFFBQVEsRUFBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDL0IsVUFBVTtRQUNWLElBQUcsUUFBUSxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUM7WUFDL0IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDO1NBQzdCO1FBQ0QsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ2pGLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtnQkFDdEIsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFnQixDQUFDO2FBQ3hFO1lBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQywrQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGtDQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsbUNBQXFCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyx1Q0FBeUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLDRDQUE4QixDQUFDLEVBQUU7Z0JBQzlSLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBZ0IsQ0FBQzthQUMvRDtZQUNELE1BQU0sRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNwQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNSLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLHVCQUF1QixFQUFnQixDQUFDO2FBQ2hGO1lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pDLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtnQkFDbEIsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFnQixDQUFDO2FBQ3RFO2lCQUFNLEVBQUUsV0FBVztnQkFDaEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDN0IsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO29CQUNuQixPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQWdCLENBQUM7aUJBQy9EO2dCQUNELFVBQVU7Z0JBQ1YsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQyxLQUFLLEVBQUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNQLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBZ0IsQ0FBQztpQkFDaEU7Z0JBQ0QsSUFBRyxJQUFJLENBQUMsV0FBVyxLQUFLLENBQUMsRUFBQztvQkFDdEIsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFnQixDQUFDO2lCQUN0RTtnQkFDRCxRQUFRO2dCQUNUOzs7Ozs7OztrREFRa0M7Z0JBQ2pDLE1BQU0sSUFBSSxFQUFFLENBQUM7YUFDaEI7U0FDSjthQUFNO1lBQ0gsTUFBTSxJQUFJLEVBQUUsQ0FBQztTQUNoQjtJQUNMLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyJ9