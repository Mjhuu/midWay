"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jwt = void 0;
// 引入模块依赖
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
// 创建 token 类
class Jwt {
    constructor(data) {
        this.data = data;
    }
    // 生成token
    generateToken() {
        const data = this.data;
        const created = Math.floor(Date.now() / 1000);
        const cert = fs.readFileSync(path.join(__dirname, './../pem/rsa_private_key.pem')); // 私钥
        const token = jwt.sign({
            data,
            exp: created + 60 * 60 * 1,
        }, cert, { algorithm: 'RS256' });
        return token;
    }
    // 校验token
    verifyToken() {
        const token = this.data;
        const cert = fs.readFileSync(path.join(__dirname, './../pem/rsa_public_key.pem')); // 公钥
        let res;
        try {
            const result = jwt.verify(token, cert, { algorithms: ['RS256'] }) || {};
            const { exp = 0 } = result, current = Math.floor(Date.now() / 1000);
            if (current <= exp) {
                res = result.data || {};
            }
        }
        catch (e) {
            res = 'err';
        }
        return res;
    }
}
exports.Jwt = Jwt;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwcC9qd3Qvand0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQVM7QUFDVCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUVwQyxhQUFhO0FBQ2IsTUFBYSxHQUFHO0lBR1osWUFBWSxJQUFJO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUVELFVBQVU7SUFDVixhQUFhO1FBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM5QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7UUFDekYsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNuQixJQUFJO1lBQ0osR0FBRyxFQUFFLE9BQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7U0FDN0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUMvQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsVUFBVTtJQUNWLFdBQVc7UUFDUCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztRQUN4RixJQUFJLEdBQUcsQ0FBQztRQUNSLElBQUk7WUFDQSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RFLE1BQU0sRUFBQyxHQUFHLEdBQUcsQ0FBQyxFQUFDLEdBQUcsTUFBTSxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNsRSxJQUFJLE9BQU8sSUFBSSxHQUFHLEVBQUU7Z0JBQ2hCLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQzthQUMzQjtTQUNKO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDUixHQUFHLEdBQUcsS0FBSyxDQUFDO1NBQ2Y7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7Q0FDSjtBQW5DRCxrQkFtQ0MifQ==