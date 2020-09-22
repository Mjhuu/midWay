import {Context, controller, del, inject, post, provide, put,} from 'midway';
import {ErrorResult, SuccessResult} from "../../interface";
import {uuid} from "uuidv4";

@provide()
@controller('/job_together')
export class JobTogetherController {

    @inject()
    ctx: Context;

    @put('/')
    async updateTeamWork() {
        const {tw_id, twInfo, fileInfo = '', type = 1} = this.ctx.request.body;
        const teamWork = await this.ctx.model.Teamwork.findOne({
            where: {tw_id}
        });
        if (!teamWork) {
            return this.ctx.body = {status: 500, msg: '协同记录不存在'} as ErrorResult;
        }
        for (const i in twInfo) {
            teamWork[i] = twInfo[i];
        }
        if (fileInfo) {
            if(type === 1){
                let oldList = teamWork.fileList ? JSON.parse(teamWork.fileList) : [];
                oldList.push(fileInfo)
                teamWork.fileList = JSON.stringify(oldList);
            }else {
                teamWork.fileList = JSON.stringify(fileInfo);
            }
        }
        await teamWork.save();
        this.ctx.body = {status: 0, msg: '协同信息修改成功'} as SuccessResult;
    }

    @del('/')
    async delTeamWork() {
        const {tw_id} = this.ctx.request.body;
        const teamWork = await this.ctx.model.Teamwork.findOne({
            where: {tw_id}
        });
        if (!teamWork) {
            return this.ctx.body = {status: 500, msg: '协同记录不存在'} as ErrorResult;
        }
        await teamWork.destroy();
        this.ctx.body = {status: 0, msg: '协同记录删除成功'} as SuccessResult;
    }

    @post('/')
    async addTeamWork() {
        const {status, content, urgent, executor_id, creator_id, creator_role, project_id, tf_id, type = 0, createdAt} = this.ctx.request.body;
        if (project_id === 'null') {
            await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
            });
        } else {
            await this.ctx.model.Teamwork.create({tw_id: uuid().replace(/\-/g, ''), tf_id, project_id, creator_id, content, status, creator_role, urgent, executor_id, isrefuse: type, createdAt: new Date(createdAt)
            });
        }
        this.ctx.body = {status: 0, msg: '协同记录添加成功'} as SuccessResult;
    }
}
