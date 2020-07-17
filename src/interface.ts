/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  id: number;
}
export interface LoginOptions {
  username: string;
  password: string;
  captcha: string;
}

/**
 * @description User-Service response
 */
export interface IUserResult {
  id: number;
  username: string;
  phone: string;
  email?: string;
}
export interface ErrorResult {
  status: 500;
  msg: string;
  result?: object
}
export interface SuccessResult {
  status: 200,
  msg: string;
  result?: object
}

/**
 * @description User-Service abstractions
 */
export interface IUserService {
  getUser(options: IUserOptions): Promise<IUserResult>;
  login(options: LoginOptions): Promise<SuccessResult | ErrorResult>
}
