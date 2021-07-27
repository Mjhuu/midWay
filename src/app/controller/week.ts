import {Context, controller, get, inject, post, provide,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";
import {JobType} from "../common";
import dayjs = require("dayjs");

@provide()
@controller('/week')
export class WeekController {

    @inject()
    ctx: Context;

    @get('/')
    async getWeekEvaluate() {
        let {evaluated_id, startweekdate, endweekdate, } = this.ctx.query;
        startweekdate = new Date(decodeURI(startweekdate));
        endweekdate = new Date(decodeURI(endweekdate));
        console.log(startweekdate, endweekdate);
        const data = await this.ctx.model.Week.findOne({
            where: {
                startweekdate, endweekdate, evaluated_id
            }
        });
        if (!data) {
            return this.ctx.body = {status: 500, msg: '评语不存在'} as ErrorResult;
        }
        this.ctx.body = {status: 0, msg: '评语获取成功', result: data, } as SuccessResult;
    }

    @post('/')
    async addWeekEvaluate() {
        let {score, evaluate = '', startweekdate, endweekdate, evaluator_id, evaluated_id, leader_next_week_plan = '', myself_next_week_plan = '', weekly_summary = '', fileInfo = '', type = 1} = this.ctx.request.body;
        /*判断是否是领导*/
        /*****************开始*****************/
        const {userid} = this.ctx.headers;
        const user = await this.ctx.model.Employee.findOne({
            where: {user_id: userid}
        });
        // 如果不是领导改也没用
        if(user.role !== 1){
            score = '';
            let begin = new Date(startweekdate).getTime();
            let end = new Date(endweekdate).getTime();
            let now = new Date().getTime();
            if(!(begin <= now && end >= now)){
                return this.ctx.body = {status: 500, msg: '保存失败：只能保存当前周工作信息'} as ErrorResult;
            }
        }else {
            if(score){
                this.ctx.model.Employee.findOne({
                    where: {user_id: evaluated_id}
                }).then(data => {
                    if (!data) {
                        return '用户不存在'
                    }
                    this.ctx.model.Log.create({
                        log_id: uuid().replace(/\-/g, ''),
                        user_id: userid,
                        ip: this.ctx.request.ip,
                        do_thing: `${user.username}给${data.username}在${dayjs(startweekdate).format('YYYY-MM-DD')}---${dayjs(endweekdate).format('YYYY-MM-DD')}周中，打了${score}分`,
                        type: JobType.score
                    }).then(data => {
                        console.log('log记录已入库');
                    }).catch(e => console.error(e))
                });
            }
        }
        /*****************结束*****************/
        startweekdate = new Date(startweekdate);
        endweekdate = new Date(endweekdate);
        let data = await this.ctx.model.Week.findOne({
            where: {
                startweekdate, endweekdate, evaluated_id
            }
        });
        if (data) {
            if (score) { data.score = score; }
            if (evaluate) { data.evaluate = evaluate; }
            if (leader_next_week_plan) { data.leader_next_week_plan = leader_next_week_plan; }
            if (myself_next_week_plan) { data.myself_next_week_plan = myself_next_week_plan; }
            if (weekly_summary) { data.weekly_summary = weekly_summary; }
            if (evaluator_id) { data.evaluator_id = evaluator_id; }
            if (fileInfo) {
                if(type === 1){
                    let oldList = data.fileList ? JSON.parse(data.fileList) : [];
                    oldList.push(fileInfo)
                    data.fileList = JSON.stringify(oldList);
                }else {
                    data.fileList = JSON.stringify(fileInfo);
                }
            }
            await data.save();
        } else {
            if(score){
                await this.ctx.model.Week.create({
                    score, evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id, week_id: uuid().replace(/\-/g, ''), leader_next_week_plan, myself_next_week_plan, weekly_summary
                });
            }else{
                await this.ctx.model.Week.create({
                    evaluate, startweekdate, endweekdate, evaluator_id, evaluated_id, week_id: uuid().replace(/\-/g, ''), leader_next_week_plan, myself_next_week_plan, weekly_summary
                });
            }
        }
        this.ctx.body = {status: 0, msg: '保存成功'} as SuccessResult;
    }
}
