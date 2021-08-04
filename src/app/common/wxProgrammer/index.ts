const https = require('https')
const request = require('request');
import {AppID, AppSecret} from "../../../otherConfig";

let accessToken: unknown = "";
let expires_in = null;

//获取access_token
export function GetAccess_token() {
    return new Promise(async (resolve, reject) => {
        if (!accessToken) {
            https.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${AppID}&secret=${AppSecret}`, (req, res) => {
                var responData = ''
                req.on('data', data => {
                    responData += data
                });
                req.on('end', () => {
                    responData = JSON.parse(responData)
                    if (responData['access_token']) {
                        accessToken = responData['access_token'];
                        expires_in = Date.now() + (responData['expires_in']) * 1000
                        console.log('获取accessToken');
                        resolve(accessToken)
                    }
                })
            })
        } else {
            // 判断是否过期
            if (Date.now >= expires_in || (expires_in - Date.now() > 0 && expires_in - Date.now() <= 5 * 60 * 1000)) {
                accessToken = "";
                expires_in = null;
                console.log('重新获取accessToken');
                resolve(await GetAccess_token())
            } else {
                console.log('使用旧的accessToken');
                resolve(accessToken)
            }
        }
    })
}

// 发送订阅消息
export function SendMessage({accessToken, openId, templateId, data, page = '/pages/meeting/meeting'}) {
    console.log(data);
    return new Promise((resolve, reject) => {
        request.post({
            url: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
            body: JSON.stringify({
                "touser": openId,
                "template_id": templateId,
                "miniprogram_state": "formal", // developer为开发版；trial为体验版；formal为正式版
                "lang": "zh_CN",
                "data": data,
                "page": page
            }),
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                if(body.errcode === 0){
                    resolve(body)
                }else {
                    reject(body);
                }
            } else {
                reject(body);
            }

        });
    })
}

//获取用户信息
export async function GetUserInfo(access_token, openid) {
    var uerInfo = await new Promise((resolve, reject) => {
        https.get(' https://api.weixin.qq.com/sns/userinfo?access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN', (req, res) => {
            // 这个异步回调里可以获取ticket
            var responData = ''
            req.on('data', data => {
                responData += data
            });
            req.on('end', () => {
                resolve(responData)
            })
        })
    })
    return uerInfo
}

//校验access_token
export async function AuthAccess_token(access_token, openid) {
    var result = await new Promise((resolve, reject) => {
        https.get('https://api.weixin.qq.com/sns/auth?access_token=' + access_token + '&openid=' + openid, (req, res) => {
            var responData = ''
            req.on('data', data => {
                responData += data
            });
            req.on('end', () => {
                resolve(responData)
            })
        })
    })
    return result
}

//刷新access_token
export async function RefreshAccess_token(access_token) {
    var result = await new Promise((resolve, reject) => {
        https.get('https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + AppID + '&grant_type=refresh_token&refresh_token=REFRESH_TOKEN', (req, res) => {
            var responData = ''
            req.on('data', data => {
                responData += data
            });
            req.on('end', () => {
                resolve(responData)
            })
        })
    })
    return result
}

//微信小程序-获取openid
export async function GetOpenid(code) {
    var openInfo = await new Promise((resolve, reject) => {
        https.get('https://api.weixin.qq.com/sns/jscode2session?appid=' + AppID + '&secret=' + AppSecret + '&js_code=' + code + '&grant_type=authorization_code', (req, res) => {
            var responData = ''
            req.on('data', data => {
                responData += data
            });
            req.on('end', () => {
                resolve(responData)
            })
        })
    })
    return JSON.parse(<string>openInfo)
}
