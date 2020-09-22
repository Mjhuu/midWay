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
