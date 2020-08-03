import { Context } from 'midway';
import { ErrorResult, IUserService, SuccessResult } from '../../interface';
export declare class UserController {
    ctx: Context;
    service: IUserService;
    updatePwd(): Promise<ErrorResult | SuccessResult>;
    resetPwd(): Promise<ErrorResult | SuccessResult>;
    updateEmail(): Promise<ErrorResult>;
    updateUser(): Promise<ErrorResult>;
    addUser(): Promise<ErrorResult | SuccessResult>;
    getUser(): Promise<void>;
}
