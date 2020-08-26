"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../jwt/jwt");
module.exports = options => {
    return async function jwt(ctx, next) {
        if (ctx.url !== '/' && !ctx.url.includes('/login') && !ctx.url.includes('/captcha')) {
            if (!ctx.headers.referer) {
                return ctx.body = { status: 403, msg: '只能在纬领工作台使用此接口' };
            }
            if (!ctx.headers.referer.includes('http://192.168.0.105:3000') && !ctx.headers.referer.includes('http://192.168.0.105:7003') && !ctx.headers.referer.includes('http://192.168.0.79:7003') && !ctx.headers.referer.includes('http://chain.weblinkon.com:7003')) {
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
                await next();
            }
        }
        else {
            await next();
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwcC9taWRkbGV3YXJlL2p3dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLG9DQUErQjtBQUUvQixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxFQUFFO0lBQ3ZCLE9BQU8sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFZLEVBQUUsSUFBSTtRQUN4QyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNqRixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7Z0JBQ3RCLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBZ0IsQ0FBQzthQUN4RTtZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsaUNBQWlDLENBQUMsRUFBRTtnQkFDM1AsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFnQixDQUFDO2FBQy9EO1lBQ0QsTUFBTSxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1IsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsdUJBQXVCLEVBQWdCLENBQUM7YUFDaEY7WUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDakMsSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO2dCQUNsQixPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQWdCLENBQUM7YUFDdEU7aUJBQU0sRUFBRSxXQUFXO2dCQUNoQixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUM3QixJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7b0JBQ25CLE9BQU8sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBZ0IsQ0FBQztpQkFDL0Q7Z0JBQ0QsVUFBVTtnQkFDVixNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLEtBQUssRUFBRSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQzFFLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ1AsT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFnQixDQUFDO2lCQUNoRTtnQkFDRCxJQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQyxFQUFDO29CQUN0QixPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQWdCLENBQUM7aUJBQ3RFO2dCQUNELE1BQU0sSUFBSSxFQUFFLENBQUM7YUFDaEI7U0FDSjthQUFNO1lBQ0gsTUFBTSxJQUFJLEVBQUUsQ0FBQztTQUNoQjtJQUNMLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyJ9