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
        if (ctx.url !== '/' && !ctx.url.includes('/chip') && !ctx.url.includes('/login') && !ctx.url.includes('/captcha')) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwcC9taWRkbGV3YXJlL2p3dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLG9DQUErQjtBQUMvQixtREFLMkI7QUFFM0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsRUFBRTtJQUN2QixPQUFPLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBWSxFQUFFLElBQUk7UUFDeEMsTUFBTSxFQUFDLFFBQVEsRUFBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDL0IsVUFBVTtRQUNWLElBQUcsUUFBUSxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUM7WUFDL0IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDO1NBQzdCO1FBQ0QsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDL0csSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO2dCQUN0QixPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxlQUFlLEVBQWdCLENBQUM7YUFDeEU7WUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLCtCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsa0NBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxtQ0FBcUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHVDQUF5QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsNENBQThCLENBQUMsRUFBRTtnQkFDOVIsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFnQixDQUFDO2FBQy9EO1lBQ0QsTUFBTSxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1IsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsdUJBQXVCLEVBQWdCLENBQUM7YUFDaEY7WUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDakMsSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO2dCQUNsQixPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQWdCLENBQUM7YUFDdEU7aUJBQU0sRUFBRSxXQUFXO2dCQUNoQixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUM3QixJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7b0JBQ25CLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBZ0IsQ0FBQztpQkFDL0Q7Z0JBQ0QsVUFBVTtnQkFDVixNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLEtBQUssRUFBRSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQzFFLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ1AsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFnQixDQUFDO2lCQUNoRTtnQkFDRCxJQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQyxFQUFDO29CQUN0QixPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQWdCLENBQUM7aUJBQ3RFO2dCQUNELFFBQVE7Z0JBQ1Q7Ozs7Ozs7O2tEQVFrQztnQkFDakMsTUFBTSxJQUFJLEVBQUUsQ0FBQzthQUNoQjtTQUNKO2FBQU07WUFDSCxNQUFNLElBQUksRUFBRSxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDIn0=