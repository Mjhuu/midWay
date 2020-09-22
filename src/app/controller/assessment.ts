import {Context, controller, get, inject, post, provide,} from 'midway';
import {SuccessResult} from "../../interface";
import {uuid} from "uuidv4";
const dayjs = require('dayjs');

@provide()
@controller('/assessment')
export class AssessmentController {

    @inject()
    ctx: Context;

    @get('/logs')
    async assessmentLogs() {
        let assessments = await this.ctx.model.Assessment.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
        });
        let assessmentList = [];
        for(let i in assessments){
            let user_id = assessments[i].user_id;
            let userInfo = await this.ctx.model.Employee.findByPk(user_id, {
                attributes: ['username']
            });
            assessmentList.push({
                userInfo,
                assessmentInfo: assessments[i]
            })
        }
        this.ctx.body = {
            status: 0, msg: '获取成功', result: {
                assessmentList
            }
        } as SuccessResult;
    }

    // 新增月度考核记录
    @post('/')
    async addAssessment() {
        const {userid} = this.ctx.headers;
        const {type = 1, dateStart, dateEnd, month, year} = this.ctx.request.body;
        await this.ctx.model.Assessment.create({
            assessment_id: uuid().replace(/\-/g, ''),
            user_id: userid,
            month,
            year,
            type,
            beginDate: dateStart,
            endDate: dateEnd
        });
        // 入库结束
        this.ctx.body = {
            status: 0, msg: '考核记录已入库', result: {}
        } as SuccessResult;
    }

    // 获取月度考核记录
    @get('/')
    async assessment() {
        const {userid} = this.ctx.headers;
        const {dateStart, dateEnd, month, year} = this.ctx.query;
        let assessments = await this.ctx.model.query(`SELECT employee.username,employee.user_id,IFNULL(t1.count, 0) veryGoodCount,IFNULL(t2.count, 0) goodCount,IFNULL(t3.count, 0) dontPass FROM employee LEFT JOIN ( SELECT evaluated_id, score, COUNT(*) count FROM week WHERE score = 5 AND startweekdate >= '${dateStart}' AND endweekdate <= '${dateEnd}' GROUP BY evaluated_id ) t1 ON t1.evaluated_id = employee.user_id LEFT JOIN ( SELECT evaluated_id, score, COUNT(*) count FROM week WHERE score = 4.5 AND startweekdate >= '${dateStart}' AND endweekdate <= '${dateEnd}' GROUP BY evaluated_id ) t2 ON t2.evaluated_id = employee.user_id LEFT JOIN ( SELECT evaluated_id, score, COUNT(*) count FROM week WHERE score < 4 AND startweekdate >= '${dateStart}' AND endweekdate <= '${dateEnd}' GROUP BY evaluated_id ) t3 ON t3.evaluated_id = employee.user_id GROUP BY employee.user_id`,{ type: this.ctx.model.QueryTypes.SELECT});
        // 将查看信息入库
        this.ctx.model.Employee.findByPk(userid).then(user => {
            this.ctx.model.Assessment.create({
                assessment_id: uuid().replace(/\-/g, ''),
                user_id: userid,
                month,
                year,
                beginDate: dateStart,
                endDate: dateEnd
            }).then(data => {
                console.log('记录已入库');
            })
        })
        // 入库结束
        this.ctx.body = {
            status: 0, msg: '考核记录获取成功', result: {
                title: `${year}年度${month}月【${dayjs(dateStart).format('YYYY-MM-DD')}--${dayjs(dateEnd).format('YYYY-MM-DD')}】，员工考核记录汇总表`,
                assessments
            }
        } as SuccessResult;
    }
}
