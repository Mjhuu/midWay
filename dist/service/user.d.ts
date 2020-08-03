import { Context } from 'midway';
import { IUserService, IUserOptions, LoginOptions, ErrorResult, SuccessResult } from '../interface';
export declare class UserService implements IUserService {
    ctx: Context;
    getUser(options: IUserOptions): Promise<ErrorResult | SuccessResult>;
    login(options: LoginOptions): Promise<ErrorResult | SuccessResult>;
}
