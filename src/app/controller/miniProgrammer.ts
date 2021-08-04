import {Context, inject, controller, get, post, provide,} from 'midway';
import {ErrorResult, IUserService, SuccessResult, MessageId} from '../../interface';
import {GetOpenid, GetAccess_token, SendMessage} from "../common/wxProgrammer";
import {AppID, sendEmail} from "../../otherConfig";
import {Jwt} from "../jwt/jwt";
import {uuid} from "uuidv4";
import {JobType, sha1, decrypt} from "../common";
import WXBizDataCrypt from '../common/wxProgrammer/WXBizDataCrypt'
import dayjs = require("dayjs");

const md5 = require('md5-nodejs');
const pushToken = 'weblinkon';
const EncodingAESKey = 'CwXyXw7vVWkKaVJ2JjKWTh0fAk4pEHRE7UCIRqlcpdx';

@provide()
@controller('/wx')
export class MiniProgrammer {

    @inject()
    ctx: Context;

    @inject('userService')
    service: IUserService;

    // 接收微信推送消息
    @post('/')
    async wxPush() {
        try {
            const {Encrypt} = this.ctx.request.body;
            const {timestamp, nonce, msg_signature} = this.ctx.query;
            // 开发者计算签名
            let devMsgSignature = sha1(pushToken, timestamp, nonce, Encrypt);
            if (devMsgSignature === msg_signature) {
                let decryptMsg = decrypt({
                    AESKey: EncodingAESKey,
                    text: Encrypt,
                    corpid: AppID
                });
                switch (decryptMsg.msg.Event) {
                    // 当用户触发订阅消息弹框后
                    case "subscribe_msg_popup_event":
                        // console.log('subscribe_msg_popup_event', decryptMsg.msg);

                        break;
                    // 当用户在手机端服务通知里消息卡片右上角“...”管理消息时，或者在小程序设置管理中的订阅消息管理页面内管理消息时，相应的行为事件会推送至开发者所配置的服务器地址。（目前只推送取消订阅的事件，即对消息设置“拒收”）
                    case "subscribe_msg_change_event":
                        // console.log('subscribe_msg_change_event', decryptMsg.msg);
                        break;
                    // 调用订阅消息接口发送消息给用户的最终结果，会推送下发结果事件至开发者所配置的服务器地址
                    case "subscribe_msg_sent_event":
                        // console.log('subscribe_msg_sent_event', decryptMsg.msg);
                        break;
                    default:
                        break;
                }
                this.ctx.body = 'success';
            } else {
                this.ctx.body = 'error';
            }
        } catch (e) {
            this.ctx.body = 'error';
        }
    }

    @get('/')
    async index() {
        try {
            let {signature, echostr, timestamp, nonce} = this.ctx.query;

            let a = sha1(pushToken, timestamp, nonce);
            // console.log(signature, a);

            if (a === signature) {
                this.ctx.body = echostr
            } else {
                this.ctx.body = {
                    data: 'check msg error',
                    status: 400,
                };
            }
        } catch (e) {
            this.ctx.body = {
                msg: 'error',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @post('/updatePhone')
    async updatePhone() {
        try {
            let {mobile, userId} = this.ctx.request.body;
            const data = await this.ctx.model.Employee.findOne({
                where: {user_id: userId}
            });
            const {Op} = this.ctx.app['Sequelize'];
            if (!data) {
                return this.ctx.body = {
                    msg: '用户不存在',
                    status: 500,
                } as ErrorResult;
            }
            const hasPhone = await this.ctx.model.Employee.findOne({where: {mobile, user_id: {[Op.ne]: userId}}});
            if (!!hasPhone) {
                return this.ctx.body = {
                    msg: '修改失败，此手机号已被其他用户占用',
                    status: 500,
                } as ErrorResult;
            }
            data.mobile = mobile;
            await data.save();

            // 登录日志
            this.ctx.model.Log.create({
                log_id: uuid().replace(/\-/g, ''),
                user_id: data.user_id,
                ip: this.ctx.request.ip,
                do_thing: '修改手机号操作',
                type: JobType.editInfo
            }).then(data => {
                console.log('log记录已入库');
            }).catch(e => console.error(e))


            this.ctx.body = {status: 0, msg: '手机号更换成功'} as SuccessResult;
        } catch (e) {
            this.ctx.body = {
                msg: '绑定信息获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @post('/bindLogin')
    async bindLogin() {
        try {
            let {openId, username, password, avatarUrl} = this.ctx.request.body;

            password = md5(password);
            const hasOpenId = await this.ctx.model.Employee.findOne({
                where: {openId}
            });
            if (hasOpenId) {
                return this.ctx.body = {status: 500, msg: '此微信号已与其他账号关联，请先解绑后再关联'} as ErrorResult;
            }
            const data = await this.ctx.model.Employee.findOne({
                where: {username, password}
            });

            if (!data) {
                return this.ctx.body = {status: 500, msg: '用户名或密码错误'} as ErrorResult;
            }
            if (data.openId) {
                return this.ctx.body = {status: 500, msg: '此账号已与其他微信号关联，请先解绑后再关联'} as ErrorResult;
            }
            if (data.leaveOffice === 1) {
                return this.ctx.body = {status: 500, msg: '你已离职，无权使用系统'} as ErrorResult;
            }
            data.openId = openId;
            data.head_url = avatarUrl;
            await data.save();
            const user = await this.service.getUser({id: data.user_id});
            const jwt = new Jwt({
                userId: data.user_id
            });
            const token = jwt.generateToken();

            // 登录日志
            this.ctx.model.Log.create({
                log_id: uuid().replace(/\-/g, ''),
                user_id: data.user_id,
                ip: this.ctx.request.ip,
                do_thing: '小程序授权绑定操作',
                type: JobType.login
            }).then(data => {
                console.log('log记录已入库');
            }).catch(e => console.error(e))

            this.ctx.body = {status: 0, msg: '已成功绑定', result: user.result, token} as SuccessResult;
        } catch (e) {
            this.ctx.body = {
                msg: '绑定信息获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @post('/isBind')
    async isBind() {
        try {
            const {openId} = this.ctx.request.body;
            const data = await this.ctx.model.Employee.findOne({
                where: {
                    openId
                }
            });
            if (!data) {
                return this.ctx.body = {status: 500, msg: '尚未绑定'} as ErrorResult;
            }
            const user = await this.service.getUser({id: data.user_id});
            const jwt = new Jwt({
                userId: data.user_id
            });
            const token = jwt.generateToken();
            // 登录日志
            this.ctx.model.Log.create({
                log_id: uuid().replace(/\-/g, ''),
                user_id: data.user_id,
                ip: this.ctx.request.ip,
                do_thing: '小程序授权登录操作',
                type: JobType.login
            }).then(data => {
                console.log('log记录已入库');
            }).catch(e => console.error(e))
            this.ctx.body = {status: 0, msg: '已绑定', result: user.result, token} as SuccessResult;
        } catch (e) {
            this.ctx.body = {
                msg: '绑定信息获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @post('/getOpenId')
    async getOpenId() {
        try {
            const {code} = this.ctx.request.body;
            const result = await GetOpenid(code)
            this.ctx.body = {
                status: 0,
                msg: 'openId获取成功',
                result: result
            } as SuccessResult;
        } catch (e) {
            this.ctx.body = {
                msg: 'openId获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @post('/decodePhoneNumber')
    async decodePhoneNumber() {
        try {
            const {session_key, encryptedData, iv} = this.ctx.request.body;
            const pc = new WXBizDataCrypt(AppID, session_key)
            const result = pc.decryptData(encryptedData, iv)
            this.ctx.body = {
                status: 0,
                msg: 'phone解密成功',
                result: result
            } as SuccessResult;
        } catch (e) {
            this.ctx.body = {
                msg: 'phone解密失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    // 修改服务端的授权列表
    @post('/updateSubscribeMsg')
    async updateSubscribeMsg() {
        try {
            const userId = this.ctx.headers.userid;
            let {key, value} = this.ctx.request.body;
            value = Number(value);
            // 获取此用户的授权列表
            let data = await this.ctx.model.SubscribeMsg.findOne({
                where: {
                    user_id: userId
                }
            })
            if (!data) {
                data = await this.ctx.model.SubscribeMsg.create({
                    user_id: userId, id: uuid().replace(/\-/g, ''),
                    [key]: value
                })
            }
            data[key] = value;
            await data.save();
            this.ctx.body = {
                status: 0,
                msg: '用户消息通知授权列表获取成功',
                result: data
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '用户消息通知授权修改失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    sendEmail({notifyEmail, userRes, toUsername, kindLabel, reason, startTime, endTime}){
        sendEmail(notifyEmail, `${userRes.result['userInfo'].username}正在审请请假`, ``, `亲爱的同事：${toUsername}，你好。<br/>${userRes.result['userInfo'].username}，正在申请请假。<br/>请假原因：${kindLabel}<br/>请假事由：${reason}<br/>请假开始时间：${dayjs(startTime).format('MM/DD HH:mm:ss')}<br/>请假结束时间：${dayjs(endTime).format('MM/DD HH:mm:ss')}<br/><span style="color: #08acee;font-weight:bold;">请立即前往小程序-“请假”模块进行审批。</span><div style="position:relative;zoom:1"><p style="margin: 0">--</p><div><span style="color: rgb(0, 0, 0);">祝好！商祺~</span></div><div><span style="color: rgb(0, 0, 0);">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;纬领办公OA 于</span><span style="color: rgb(0, 0, 128);">&nbsp;</span>${dayjs().format('YYYY年MM月DD日')}</div><div><span style="color: rgb(128, 128, 0);">-----------------------------------------------------------------------------</span></div><div><span style="color: rgb(128, 128, 0);">纬领（青岛）网络安全研究院有限公司</span></div><div><span style="color: rgb(128, 128, 0);">TEL：<span style="border-bottom:1px dashed #ccc;z-index:1" t="7" onclick="return false;" data="（0532）58511027">（0532）58511027</span></span></div><div><span style="color: rgb(128, 128, 0);">Mobile：<span style="border-bottom:1px dashed #ccc;z-index:1" t="7" onclick="return false;" data="13963962166">13963962166</span></span></div><div><span style="color: rgb(128, 128, 0);">微信：yjli<span style="border-bottom:1px dashed #ccc;z-index:1" t="7" onclick="return false;" data="20128877">20128877</span></span></div><div><span style="color: rgb(128, 128, 0);">地址：山东.青岛.市北区.山东路168号时代国际广场1908室</span></div><div><span style="color: rgb(128, 128, 0);">网址：</span><a style="color: rgb(128, 128, 0); text-decoration: underline;"><span style="color: rgb(128, 128, 0);">www.weblinkon.com</span></a> </div><div><span style="color: rgb(128, 128, 0);">------------------------------------------------------------------------------</span></div><div style="clear:both"></div></div>`).then(d => {
            console.log(d);
        })
    }

    async dealAskLeaveList(askLists){
        let askLeaveList = [];
        for (let i in askLists) {
            const firstInfo = askLists[i].firstRole ? await this.ctx.model.Employee.findByPk(askLists[i].firstRole, {
                attributes: ['username']
            }) : {username: ''};
            const secondInfo = await this.ctx.model.Employee.findByPk(askLists[i].secondRole, {
                attributes: ['username']
            });
            const thirdInfo = await this.ctx.model.Employee.findByPk(askLists[i].thirdRole, {
                attributes: ['username']
            });

            const userInfo = await this.ctx.model.Employee.findByPk(askLists[i].user_id, {
                attributes: ['username']
            });
            askLeaveList.push({
                askLeaveInfo: askLists[i],
                firstInfo,
                secondInfo,
                thirdInfo,
                userInfo
            })
        }

        return askLeaveList
    }

    @post('/agreeLeave')
    async agreeLeave() {
        try {
            const {leave_id, currentSign, user_id, kindLabel, reason, startTime, endTime, secondRole, thirdRole} = this.ctx.request.body;
            const askLeave = await this.ctx.model.AskForLeave.findOne({
                where: {
                    leave_id
                }
            });
            if(!askLeave){
                return this.ctx.body = {
                    msg: '批准失败，此记录不存在',
                    status: 500,
                } as ErrorResult;
            }
            askLeave[currentSign] = 1;
            await askLeave.save();

            let userRes = await this.service.getUser({id: user_id});
            let toUsername = '';
            let notifyEmail = '';
            if(currentSign === 'firstSign'){
                const secondRoleRes = await this.service.getUser({id: secondRole});
                toUsername = secondRoleRes.result['userInfo'].username;
                notifyEmail = secondRoleRes.result['userInfo'].email;
            }else if(currentSign === 'secondSign'){
                const thirdRoleRes = await this.service.getUser({id: thirdRole});
                toUsername = thirdRoleRes.result['userInfo'].username;
                notifyEmail = thirdRoleRes.result['userInfo'].email;
           }else if(currentSign === 'thirdSign') {
                console.log('请假审核已通过');
                sendEmail(userRes.result['userInfo'].email, '请假已通过', userRes.result['userInfo'].username + '的请假审核已通过').then(d => {
                    console.log(d);
                });
                let accessToken = await GetAccess_token();
                SendMessage({
                    accessToken,
                    openId: userRes.result['userInfo'].openId,
                    templateId: MessageId.leave,
                    page: '/pages/askLeave/askLeave',
                    data: {
                        "name1": {
                            "value": userRes.result['userInfo'].username
                        },
                        "thing2": {
                            "value": `${dayjs(startTime).format('M月D日 H')}-${dayjs(endTime).format('M月D日 H')}`
                        },
                        "thing3": {
                            "value": reason
                        },
                        "phrase4": {
                            "value": kindLabel
                        },
                        "phrase5": {
                            "value": '领导已批准'
                        }
                    }
                }).catch(d => {
                    console.log(userRes.result['userInfo'].openId, '发送失败', d);
                });
            }
            if(notifyEmail && toUsername){
                this.sendEmail({
                    notifyEmail, userRes, toUsername, kindLabel, reason, startTime, endTime
                })
            }
            this.ctx.body = {
                msg: '批准成功',
                status: 0,
            } as SuccessResult;
        } catch (e) {
            this.ctx.body = {
                msg: '批准失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    // 通知开会
    @post('/notifyMeeting')
    async notifyMeeting() {
        try {
            const userId = this.ctx.headers.userid;
            let {
                meetName,
                host,
                meetTime,
                meetingUserName,
                meetingUserId,
                meetingUserOpenId,
                address
            } = this.ctx.request.body;
            console.log(userId, meetName, host, meetTime, meetingUserName, meetingUserId, meetingUserOpenId, address);
            let data = await this.ctx.model.Meeting.findOne({
                where: {
                    user_id: userId, meetName, host, meetTime,
                }
            });
            if (data) {
                return this.ctx.body = {
                    msg: '已存在相同会议',
                    status: 500,
                } as ErrorResult;
            }
            const id = uuid().replace(/\-/g, '');
            data = await this.ctx.model.Meeting.create({
                id,
                meetName, host, meetTime,
                user_id: userId, meetingUserName: JSON.stringify(meetingUserName),
                meetingUserId: JSON.stringify(meetingUserId),
                notifyUserName: JSON.stringify([]),
                address,
            });
            // 微信通知
            this.wxNotifyMeeting(meetingUserOpenId, {
                meetName, host, meetTime, meetingUserName, address, id
            });

            this.ctx.body = {
                status: 0,
                msg: '会议通知成功',
                result: data
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '会议通知失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    async wxNotifyMeeting(openIdArr: Array<string>, {
        meetName, host, meetTime, meetingUserName, address, id
    }) {
        // console.log(meetName, host, meetTime, meetingUserName, address, id);
        for (const index in openIdArr) {
            const openId = openIdArr[index]
            let accessToken = await GetAccess_token();
            let res = await SendMessage({
                accessToken,
                openId,
                templateId: MessageId.meet,
                data: {
                    "thing1": {
                        "value": meetName
                    },
                    "thing2": {
                        "value": host
                    },
                    "time3": {
                        "value": meetTime
                    },
                    "thing4": {
                        "value": meetingUserName.join('，')
                    },
                    "thing5": {
                        "value": address
                    }
                }
            }).catch(d => {
                console.log(openId, '发送失败', d);
            });
            // console.log({res});
            if (res && res['errcode'] === 0) {
                let data = await this.ctx.model.Meeting.findOne({
                    where: {
                        id
                    }
                });
                if (data) {
                    let notifyUserName = data.notifyUserName ? JSON.parse(data.notifyUserName) : [];
                    let user = await this.ctx.model.Employee.findOne({
                        where: {
                            openId
                        }
                    });
                    if (user) {
                        notifyUserName.push(user.username)
                        data.notifyUserName = JSON.stringify(notifyUserName);
                        await data.save();
                        let subscribeMsg = await this.ctx.model.SubscribeMsg.findOne({
                            where: {
                                user_id: user.user_id
                            }
                        });
                        if (subscribeMsg) {
                            subscribeMsg.meetNotify = 0;
                            await subscribeMsg.save()
                        }
                        console.log(user.username, '发送成功')
                    }
                }
            }
        }
    }

    // 获取我的请假记录
    @get('/getMyAskLeaveList')
    async getMyAskLeaveList() {
        try {
            const user_id = this.ctx.headers.userid;

            let askLists = await this.ctx.model.AskForLeave.findAll({
                where: {
                    user_id
                },
                order: [
                    ['createdAt', 'DESC']
                ],
            });
            let askLeaveList = await this.dealAskLeaveList(askLists);

            this.ctx.body = {
                status: 0,
                result: askLeaveList,
                msg: '请假记录获取成功'
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '我的请假记录获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    // 获取需要我审核的记录
    @get('/getMySignAskLeaveList')
    async getMySignAskLeaveList() {
        try {
            const user_id = this.ctx.headers.userid;
            const {Op} = this.ctx.app['Sequelize'];
            let askLists = await this.ctx.model.AskForLeave.findAll({
                where: {
                    [Op.or]: [
                        {firstRole: user_id},
                        {secondRole: user_id},
                        {thirdRole: user_id},
                    ]
                },
                order: [
                    ['createdAt', 'DESC']
                ],
            });
            let askLeaveList = await this.dealAskLeaveList(askLists);

            this.ctx.body = {
                status: 0,
                result: askLeaveList,
                msg: '审核记录获取成功'
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '我的审核记录获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    @post('/addAskLeave')
    async addAskLeave() {
        try {
            const user_id = this.ctx.headers.userid;
            const {
                startTime,
                endTime,
                firstRole,
                secondRole,
                thirdRole,
                kind,
                reason,
                kindLabel
            } = this.ctx.request.body;
            console.log({startTime, endTime, firstRole, secondRole, thirdRole, kind, reason, user_id});
            let notifyEmail = '';
            let toUsername = '';

            let askLeave = await this.ctx.model.AskForLeave.findOne({
                where: {
                    user_id, startTime, endTime
                }
            });
            if (askLeave) {
                return this.ctx.body = {
                    msg: '已存在相同请假',
                    status: 500,
                } as ErrorResult;
            }

            let userRes = await this.service.getUser({id: user_id});
            if (firstRole) {
                const firstRoleRes = await this.service.getUser({id: firstRole});
                if (firstRoleRes.status === 0) {
                    if (firstRoleRes.result['userInfo'].leaveOffice === 1) {
                        return this.ctx.body = {
                            msg: '部门经理已离职，请通知管理员修改审核人员',
                            status: 500,
                        } as ErrorResult;
                    } else {
                        notifyEmail = firstRoleRes.result['userInfo'].email;
                        toUsername = firstRoleRes.result['userInfo'].username;
                    }
                } else {
                    return this.ctx.body = {
                        msg: firstRoleRes.msg,
                        status: 500,
                    } as ErrorResult;
                }
            }
            const secondRoleRes = await this.service.getUser({id: secondRole});
            if (secondRoleRes.status === 0) {
                if (secondRoleRes.result['userInfo'].leaveOffice === 1) {
                    return this.ctx.body = {
                        msg: '行政审核员已离职，请通知管理员修改审核人员',
                        status: 500,
                    } as ErrorResult;
                } else {
                    if (!notifyEmail) {
                        notifyEmail = secondRoleRes.result['userInfo'].email
                        toUsername = secondRoleRes.result['userInfo'].username
                    }
                }
            } else {
                return this.ctx.body = {
                    msg: secondRoleRes.msg,
                    status: 500,
                } as ErrorResult;
            }

            console.log({notifyEmail});
            askLeave = await this.ctx.model.AskForLeave.create({
                leave_id: uuid().replace(/\-/g, ''),
                user_id,
                startTime,
                endTime,
                kind,
                reason,
                firstRole, secondRole, thirdRole,
            })

            this.ctx.body = {
                status: 0,
                msg: '请假审批已发送',
                result: askLeave
            } as SuccessResult

            this.sendEmail({
                notifyEmail, userRes, toUsername, kindLabel, reason, startTime, endTime
            })

        } catch (e) {
            this.ctx.body = {
                msg: '会议列表获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    // 获取会议列表
    @get('/getMeeting')
    async getMeeting() {
        try {
            const userId = this.ctx.headers.userid;
            const {Op} = this.ctx.app['Sequelize'];
            // 获取此用户的授权列表
            let data = await this.ctx.model.Meeting.findAll({
                where: {
                    [Op.or]: [
                        {
                            user_id: userId
                        },
                        {
                            meetingUserId: {
                                [Op.like]: `%${userId}%`
                            }
                        }
                    ]
                },
                order: [
                    ['createdAt', 'DESC']
                ],
            })

            this.ctx.body = {
                status: 0,
                msg: '会议列表获取成功',
                result: data
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '会议列表获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }

    // 获取用户消息通知授权列表
    @get('/getSubscribeMsg')
    async getSubscribeMsg() {
        try {
            const userId = this.ctx.headers.userid;
            // 获取此用户的授权列表
            let data = await this.ctx.model.SubscribeMsg.findOne({
                where: {
                    user_id: userId
                }
            })
            if (!data) {
                data = await this.ctx.model.SubscribeMsg.create({
                    user_id: userId, id: uuid().replace(/\-/g, '')
                })
            }
            this.ctx.body = {
                status: 0,
                msg: '用户消息通知授权列表获取成功',
                result: data
            } as SuccessResult
        } catch (e) {
            this.ctx.body = {
                msg: '用户消息通知授权列表获取失败',
                status: 500,
                result: e
            } as ErrorResult;
        }
    }
}
