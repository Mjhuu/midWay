import {Context} from 'midway';
import {ErrorResult} from '../../interface';
import {waf_detect} from "../common";

module.exports = options => {
    return async function waf(ctx: Context, next) {
        let path = ctx.url;
        console.log(path);
        if(!waf_detect(path)){
            await next();
        }else {
            return ctx.body = {status: 403, msg: '非法验证'} as ErrorResult;
        }
    };
};
