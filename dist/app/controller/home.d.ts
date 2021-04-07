import { Context } from 'midway';
import { IUserService } from '../../interface';
export declare class HomeController {
    ctx: Context;
    service: IUserService;
    index(): Promise<void>;
    chip(): Promise<void>;
    captcha(): Promise<void>;
    uploadFile(): Promise<void>;
    sendCode(): Promise<void>;
    sendEmail(): Promise<void>;
}
