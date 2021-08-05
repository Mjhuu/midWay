/*这里主要是其他公共的配置性文件*/
let os = require("os");
const nodeMailer = require('nodemailer');

let networkInterfaces = os.networkInterfaces();

/*******************本机IP以及服务端IP开始*******************/

// 本机IP
export const localIp = networkInterfaces['本地连接'][1].address;
// 本地前端IP+PORT
export const localWebIpAndPort = `http://${localIp}:3000`;
// 本地服务器IP+PORT
export const localServerIpAndPort = `http://${localIp}:7003`;
// 线上服务器IP+PORT
export const onlineServerIpAndPort = `http://192.168.0.79:7003`;
// 线上服务器域名+PORT
export const onlineServerDomainAndPort = `http://desk.weblinkon.com:7003`;
// https服务
export const onlineServerHttpsDomainAndPort = `https://desk.weblinkon.com`;
export const wxMiniProgrammer = `https://servicewechat.com/wx2efdadeb0747c17a`;

/*******************本机IP以及服务端IP结束*******************/


/*******************mysql数据库开始*******************/
interface mysqlConfig{
    host: string,
    password: string
}
export const localMysqlHostAndPassword: mysqlConfig = {
    host: localIp, // 测试环境
    password: 'itnihao',
}

export const onlineMysqlHostAndPassword: mysqlConfig = {
    host: '192.168.0.75', // 正式环境
    password: 'itnihao666',
}
// 本地测试环境与线上部署环境的自动切换
export const mysqlHostAndPassword: mysqlConfig = process.env.NODE_ENV === 'local' ? localMysqlHostAndPassword : onlineMysqlHostAndPassword;
// 线上部署环境
// export const mysqlHostAndPassword: mysqlConfig = onlineMysqlHostAndPassword;
// console.log(process.env.NODE_ENV, '------------------');
/*******************mysql数据库结束*******************/


/*******************邮箱配置开始*******************/

export const transporter = nodeMailer.createTransport({
    host: 'smtp.qq.com', // 邮箱服务的主机，如smtp.qq.com
    port: 465, // 对应的端口号
    // 开启安全连接
    // secure: false,
    secureConnection: true,
    // 用户信息
    auth: {
        user: '1441901570@qq.com',
        pass: 'nyhcoegvmyhmhgei'
    }
});

export const sendEmail = (toEmail, title = '', text = '', html = '') => {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: '纬领工作平台 <1441901570@qq.com>',
            to: toEmail,
            subject: title,
            text,
            html
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            resolve({
                Message: info.messageId,
                sent: info.response
            });
        });
    });
};
/*******************邮箱配置结束*******************/

/*******************微信小程序开始*******************/
export const AppID = 'wx2efdadeb0747c17a';
export const AppSecret = '243192bca718ecfea82b61c67646bea5';
/*******************微信小程序结束*******************/
