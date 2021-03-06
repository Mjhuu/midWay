// 引入模块依赖
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// 创建 token 类
export class Jwt {
    public data: any;

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
            exp: created + 60 * 60 * 1, // 1小时
        }, cert, {algorithm: 'RS256'});
        return token;
    }

    // 校验token
    verifyToken() {
        const token = this.data;
        const cert = fs.readFileSync(path.join(__dirname, './../pem/rsa_public_key.pem')); // 公钥
        let res;
        try {
            const result = jwt.verify(token, cert, {algorithms: ['RS256']}) || {};
            const {exp = 0} = result, current = Math.floor(Date.now() / 1000);
            if (current <= exp) {
                res = result.data || {};
            }
        } catch (e) {
            res = 'err';
        }
        return res;
    }
}
