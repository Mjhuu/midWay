const crypto = require('crypto')

export enum JobType {
    callApi = 1, // 调用api
    changePassword, // 修改密码
    editInfo, // 修改资料
    login,
    score, // 打分
}
/*
    @explain: 微信的消息密文解密方法
    @params:
        obj.AESKey:解密的aesKey值  这里的key就是配置消息推送的那部分
        obj.text: 需要解密的密文
        obj.corpid: 企业的id / 微信小程序的appid

    @return
        obj.noncestr  随机数
        obj.msg_len   微信密文的len
        obj.msg       解密后的明文
*/

export const decrypt = function (obj) {
    let aesKey = Buffer.from(obj.AESKey + '=', 'base64');
    const cipherEncoding = 'base64';
    const clearEncoding = 'utf8';
    const cipher = crypto.createDecipheriv('aes-256-cbc',aesKey,aesKey.slice(0, 16));
    cipher.setAutoPadding(false); // 是否取消自动填充 不取消
    let this_text = cipher.update(obj.text, cipherEncoding, clearEncoding) + cipher.final(clearEncoding);

    return {
        nonceStr:this_text.substring(0,16),
        msgLen:this_text.substring(16,20),
        msg:JSON.parse(this_text.substring(20,this_text.lastIndexOf("}")+1))
    }
};
export const sha1 = function (...arr) {
    return crypto.createHash('sha1').update(arr.sort().join('')).digest('hex');
};

export function getCode(length: number): string {
    const codeArr: Array<number> = [1, 3, 4, 2, 6, 7, 5, 9, 8, 0];
    const codeLength: number = length;
    let code: string = '';
    for (let i: number = 0; i < codeLength; i++) {
        code += codeArr[parseInt(String(Math.random() * codeArr.length))];
    }
    return code;
}

//使用正则表达式，检测字符串是否含有攻击特征，检测到攻击特征返回true，没检测到返回false
export function waf_detect(str_to_detect) {

    var regexp_rule = [
        /select.+(from|limit)/i,
        /(?:(union(.*?)select))/i,
        /sleep\((\s*)(\d*)(\s*)\)/i,
        /group\s+by.+\(/i,
        /(?:from\W+information_schema\W)/i,
        /(?:(?:current_)user|database|schema|connection_id)\s*\(/i,
        /\s*or\s+.*=.*/i,
        /order\s+by\s+.*--$/i,
        /benchmark\((.*)\,(.*)\)/i,
        /base64_decode\(/i,
        /(?:(?:current_)user|database|version|schema|connection_id)\s*\(/i,
        /(?:etc\/\W*passwd)/i,
        /into(\s+)+(?:dump|out)file\s*/i,
        /xwork.MethodAccessor/i,
        /(?:define|eval|file_get_contents|include|require|require_once|shell_exec|phpinfo|system|passthru|preg_\w+|execute|echo|print|print_r|var_dump|(fp)open|alert|showmodaldialog)\(/i,
        /\<(iframe|script|body|img|layer|div|meta|style|base|object|input)/i,
        /(onmouseover|onmousemove|onerror|onload)\=/i,
        /javascript:/i,
        /\.\.\/\.\.\//i,
        /\|\|.*(?:ls|pwd|whoami|ll|ifconfog|ipconfig|&&|chmod|cd|mkdir|rmdir|cp|mv)/i,
        /(?:ls|pwd|whoami|ll|ifconfog|ipconfig|&&|chmod|cd|mkdir|rmdir|cp|mv).*\|\|/i,
        /(gopher|doc|php|glob|file|phar|zlib|ftp|ldap|dict|ogg|data)\:\//i
    ];
    for (let i = 0; i < regexp_rule.length; i++) {
        if (regexp_rule[i].test(str_to_detect) == true) {
            console.log("attack detected, rule number:", "(" + i + ")", regexp_rule[i]);
            return true;
        }
    }
    return false;
}
