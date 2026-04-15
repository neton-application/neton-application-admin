import type { AuthPermissionInfo } from '@vben/types';

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    captchaVerification?: string;
    // 绑定社交登录时，需要传递如下参数
    socialType?: number;
    socialCode?: string;
    socialState?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    userId: number;
    expiresTime: number;
  }


  /** 手机验证码获取接口参数 */
  export interface SmsCodeParams {
    mobile: string;
    scene: number;
  }

  /** 手机验证码登录接口参数 */
  export interface SmsLoginParams {
    mobile: string;
    code: string;
  }

  // 管理员后台不允许注册，已禁用
  // /** 注册接口参数 */
  // export interface RegisterParams {
  //   username: string;
  //   password: string;
  //   captchaVerification: string;
  // }

  /** 重置密码接口参数 */
  export interface ResetPasswordParams {
    password: string;
    mobile: string;
    code: string;
  }

  /** 社交快捷登录接口参数 */
  export interface SocialLoginParams {
    type: number;
    code: string;
    state: string;
  }
}

/** 登录 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/system/auth/login', data, {
    headers: {
      isEncrypt: false,
    },
  });
}

/** 刷新 accessToken */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post('/system/auth/refresh-token', { refreshToken });
}

/** 退出登录 */
export async function logoutApi(accessToken: string) {
  return baseRequestClient.post(
    '/system/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

/** 获取权限信息 */
export async function getAuthPermissionInfoApi() {
  return requestClient.get<AuthPermissionInfo>(
    '/system/auth/get-permission-info',
  );
}


/** 获取验证码 */
export async function getCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/get', data);
}

/** 校验验证码 */
export async function checkCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/check', data);
}

/** 获取登录验证码 */
export async function sendSmsCode(data: AuthApi.SmsCodeParams) {
  return requestClient.post('/system/auth/send-sms-code', data);
}

/** 短信验证码登录 */
export async function smsLogin(data: AuthApi.SmsLoginParams) {
  return requestClient.post('/system/auth/sms-login', data);
}

// 管理员后台不允许注册，已禁用
// /** 注册 */
// export async function register(data: AuthApi.RegisterParams) {
//   return requestClient.post('/system/auth/register', data);
// }

/** 通过短信重置密码 */
export async function smsResetPassword(data: AuthApi.ResetPasswordParams) {
  return requestClient.post('/system/auth/reset-password', data);
}

/** 社交授权的跳转 */
export async function socialAuthRedirect(type: number, redirectUri: string) {
  return requestClient.get('/system/auth/social-auth-redirect', {
    params: {
      type,
      redirectUri,
    },
  });
}

/** 社交快捷登录 */
export async function socialLogin(data: AuthApi.SocialLoginParams) {
  return requestClient.post<AuthApi.LoginResult>(
    '/system/auth/social-login',
    data,
  );
}
