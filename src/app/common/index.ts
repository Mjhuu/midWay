export enum JobType {
    callApi=1, // 调用api
    changePassword, // 修改密码
    editInfo, // 修改资料
    login,
    score, // 打分
}

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
export function waf_detect(str_to_detect){

    var regexp_rule =[
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
    for(let i=0; i< regexp_rule.length; i++){
        if(regexp_rule[i].test(str_to_detect) == true){
            console.log("attack detected, rule number:", "("+i+")", regexp_rule[i]);
            return true;
        }
    }
    return false;
}
