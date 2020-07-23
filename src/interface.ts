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
export interface AddDepartmentOptions {
  department_name: string;
  department_description: string;
  creator_id: string;
}

/**
 * @description User-Service response
 */

export interface ErrorResult {
  status: 500;
  msg: string;
  result?: object
}
export interface SuccessResult {
  status: 200 | 0,
  msg: string;
  result?: object
}

/**
 * @description User-Service abstractions
 */
export interface IUserService {
  getUser(options: IUserOptions): Promise<SuccessResult | ErrorResult>;
  login(options: LoginOptions): Promise<SuccessResult | ErrorResult>
}
