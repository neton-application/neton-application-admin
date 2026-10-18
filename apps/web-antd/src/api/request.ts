/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { $t, $te, i18n } from '@vben/locales';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';
import { createApiEncrypt } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const apiEncrypt = createApiEncrypt(import.meta.env);

const MACHINE_CODE = /^[A-Z][A-Z0-9_]{2,}$/;
const ERROR_NAMESPACE_PREFIX = 'error-';
/** 框架内建码（信封码 + 字段码，spec ERROR_CODE_SPEC §2/§3）。 */
const FRAMEWORK_NAMESPACE = 'error-framework';
/** 只是「校验没过」的总括码：带字段错误时优先说字段。 */
const UMBRELLA_CODES = new Set(['INVALID_PARAMS', 'VALIDATION_FAILED']);
/** 接口路径第一段 → 模块 id（不同的才列）。 */
const PATH_MODULE_ALIASES: Record<string, string> = {
  pay: 'payment',
  wallet: 'payment',
};

interface ApiFieldError {
  code?: string;
  field?: string;
  message?: string;
  params?: Record<string, unknown>;
}

/** 按接口路径猜出发出错误的模块，它的语言包优先（同一个码在不同模块可能有不同说法）。 */
function moduleOfUrl(url: string | undefined): string | undefined {
  const segment = url
    ?.replace(/^[a-z]+:\/\/[^/]+/i, '')
    .split('?')[0]
    ?.split('/')
    .find(Boolean);
  if (!segment) return undefined;
  return PATH_MODULE_ALIASES[segment] ?? segment;
}

/**
 * 当前语言下要查的命名空间：发出错误的模块 `error-<模块>` → `error-framework` → 其余模块
 * （路径猜不出模块时，别的模块的同名码只作兜底，不盖过框架的通用说法）。
 */
function errorNamespaces(module: string | undefined): string[] {
  const locale = i18n.global.locale.value;
  const modules = Object.keys(
    i18n.global.getLocaleMessage(locale) ?? {},
  ).filter(
    (ns) => ns.startsWith(ERROR_NAMESPACE_PREFIX) && ns !== FRAMEWORK_NAMESPACE,
  );
  const own = module ? `${ERROR_NAMESPACE_PREFIX}${module}` : undefined;
  if (!own || !modules.includes(own)) return [FRAMEWORK_NAMESPACE, ...modules];
  return [
    own,
    FRAMEWORK_NAMESPACE,
    ...modules.filter((namespace) => namespace !== own),
  ];
}

/**
 * 机器码（如 ROLE_NOT_FOUND / TOO_SHORT）翻译成当前语言，`params`（min/max）代入 `{min}` / `{max}`。
 * 与新后台 front 的 `error.<CODE>` 是同一套码。不是机器码或没有翻译时返回 undefined。
 */
function translateCode(
  code: string | undefined,
  namespaces: string[],
  params?: Record<string, unknown>,
): string | undefined {
  if (!code || !MACHINE_CODE.test(code)) return undefined;
  for (const namespace of namespaces) {
    const key = `${namespace}.${code}`;
    if ($te(key)) return params ? $t(key, params) : $t(key);
  }
  return undefined;
}

/** 一条字段错误：只按 `code` 翻译（缺省用 message，二者相同），前面带上字段路径。 */
function describeFieldError(item: ApiFieldError, namespaces: string[]): string {
  const code = item.code ?? item.message ?? '';
  const text = translateCode(code, namespaces, item.params) ?? code;
  return item.field && item.field !== '$' ? `${item.field}: ${text}` : text;
}

/**
 * Neton 错误信封 → 提示文案：`message` 是机器码，按模块语言包 → 框架语言包翻译；是总括码
 * （VALIDATION_FAILED / INVALID_PARAMS）或没有翻译、且带 `errors[]` 时逐条说字段；都没有时原样返回
 * （尚未改成机器码的接口仍是句子）。
 */
export function describeApiError(
  responseData: any,
  url?: string,
): string | undefined {
  const raw = responseData?.error ?? responseData?.message ?? responseData?.msg;
  const code = typeof raw === 'string' && raw ? raw : undefined;
  const namespaces = errorNamespaces(moduleOfUrl(url));
  const fields: ApiFieldError[] = Array.isArray(responseData?.errors)
    ? responseData.errors
    : [];
  const ownTranslation =
    code && !UMBRELLA_CODES.has(code)
      ? translateCode(code, namespaces)
      : undefined;
  if (ownTranslation) return ownTranslation;
  if (fields.length > 0) {
    return fields.map((f) => describeFieldError(f, namespaces)).join('; ');
  }
  return translateCode(code, namespaces) ?? code;
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const refreshToken = accessStore.refreshToken as string;
    if (!refreshToken) {
      throw new Error('Refresh token is null!');
    }
    const resp = await refreshTokenApi(refreshToken);
    const newToken = resp?.data?.data?.accessToken;
    // Neton：这里一定要抛出 resp.data，从而触发 authenticateResponseInterceptor 中，刷新令牌失败！！！
    if (!newToken) {
      throw resp.data;
    }
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;

      // 是否 API 加密
      if ((config.headers || {}).isEncrypt) {
        try {
          // 加密请求数据
          if (config.data) {
            config.data = apiEncrypt.encryptRequest(config.data);
            // 设置加密标识头
            config.headers[apiEncrypt.getEncryptHeader()] = 'true';
          }
        } catch (error) {
          console.error('请求数据加密失败:', error);
          throw error;
        }
      }
      return config;
    },
  });

  // API 解密响应拦截器
  client.addResponseInterceptor({
    fulfilled: (response) => {
      // 检查是否需要解密响应数据
      const encryptHeader = apiEncrypt.getEncryptHeader();
      const isEncryptResponse =
        response.headers[encryptHeader] === 'true' ||
        response.headers[encryptHeader.toLowerCase()] === 'true';
      if (isEncryptResponse && typeof response.data === 'string') {
        try {
          // 解密响应数据
          response.data = apiEncrypt.decryptResponse(response.data);
        } catch (error) {
          console.error('响应数据解密失败:', error);
          throw new Error(`响应数据解密失败: ${(error as Error).message}`);
        }
      }
      return response;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = describeApiError(responseData, error?.config?.url);
      // Neton：特殊：避免 401 “账号未登录”，重复提示。因为，此时会跳转到登录界面，只需提示一次！！！
      if (error?.data?.code === 401) {
        return;
      }
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
baseRequestClient.addRequestInterceptor({
  fulfilled: (config) => {
    return config;
  },
});
