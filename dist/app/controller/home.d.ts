import { Context } from 'midway';
import { ErrorResult, IUserService } from '../../interface';
export declare const sendEmail: (toEmail: any, title?: string, text?: string, html?: string) => Promise<unknown>;
export declare class HomeController {
    ctx: Context;
    service: IUserService;
    index(): Promise<void>;
    getLogs(): Promise<void>;
    assessmentLogs(): Promise<void>;
    addAssessment(): Promise<void>;
    assessment(): Promise<void>;
    captcha(): Promise<void>;
    /*********************部门Api************************/
    addDepartment(): Promise<ErrorResult>;
    getAllDepartments(): Promise<void>;
    delDepartment(): Promise<ErrorResult>;
    delUser(): Promise<ErrorResult>;
    updateDepartment(): Promise<ErrorResult>;
    getDepartmentJobs(): Promise<void>;
    getDepartmentUsers(): Promise<void>;
    getJobs(): Promise<void>;
    addJob(): Promise<ErrorResult>;
    delJob(): Promise<ErrorResult>;
    updateJob(): Promise<ErrorResult>;
    getUserMemos(): Promise<void>;
    addMemo(): Promise<void>;
    updateMemo(): Promise<ErrorResult>;
    delMemo(): Promise<ErrorResult>;
    getProjectInfo(): Promise<ErrorResult>;
    getAllProject(): Promise<void>;
    addProject(): Promise<ErrorResult>;
    updateProject(): Promise<ErrorResult>;
    delProject(): Promise<ErrorResult>;
    joinProject(): Promise<ErrorResult>;
    exitProject(): Promise<ErrorResult>;
    getUserProjectJob(): Promise<ErrorResult>;
    getJoinProjects(): Promise<void>;
    addJobLogging(): Promise<void>;
    getDayJobLogging(): Promise<void>;
    getWeekJobLoggings(): Promise<void>;
    getMonthUnfinishedJobLogging(): Promise<void>;
    getDateProgress(timeStart: any, timeEnd: any, userId: any): Promise<number>;
    getJobProgress(): Promise<void>;
    updateTeamWork(): Promise<ErrorResult>;
    delTeamWork(): Promise<ErrorResult>;
    addTeamWork(): Promise<void>;
    updateJobLogging(): Promise<ErrorResult>;
    delJobLogging(): Promise<ErrorResult>;
    getWeekEvaluate(): Promise<ErrorResult>;
    addWeekEvaluate(): Promise<void>;
    updateNotice(): Promise<ErrorResult>;
    getAllNotices(): Promise<void>;
    addNotice(): Promise<ErrorResult>;
    uploadFile(): Promise<void>;
    login(): Promise<ErrorResult>;
    updateToken(): void;
    sendCode(): Promise<void>;
    sendEmail(): Promise<void>;
}
