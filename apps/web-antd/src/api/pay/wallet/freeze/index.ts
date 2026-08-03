import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PayWalletFreezeApi {
  /** 冻结记录。amount 为 null 表示全额司法冻结（无上限，冻结额随余额浮动）。 */
  export interface Freeze {
    id: number;
    walletId: number;
    userId: number;
    /** 1=提现冻结 2=单笔风控 3=账户冻结（司法） */
    freezeType: number;
    amount: null | number;
    /** 0=冻结中 1=已解除 2=已扣除 3=已到期 */
    status: number;
    refType: number;
    refId: string;
    reasonCode?: string;
    reasonText?: string;
    operatorId: number;
    /** 0 = 无期限 */
    expiresAt: number;
    createdAt: number;
    releasedAt: number;
  }

  /** 单笔风控冻结：金额固定，可用余额不足会直接失败。 */
  export interface PlaceRiskHoldReqVO {
    userId: number;
    amount: number;
    /** 幂等键：账变流水 id 或唯一工单号 */
    refId: string;
    reasonText?: string;
  }

  /** 账户冻结（司法）：targetAmount 留空 = 全额冻结。 */
  export interface PlaceJudicialReqVO {
    userId: number;
    targetAmount?: null | number;
    /** 法律文书号，同时是幂等键 */
    legalDocNo: string;
    reasonText?: string;
    /** epoch 毫秒；0 = 无期限 */
    expiresAt?: number;
  }
}

/** 冻结分页 */
export function getFreezePage(
  params: { freezeType?: number; status?: number; userId?: number } & PageParam,
) {
  return requestClient.get<PageResult<PayWalletFreezeApi.Freeze>>(
    '/wallet/freeze/page',
    { params },
  );
}

/** 下单笔风控冻结 */
export function placeRiskHold(data: PayWalletFreezeApi.PlaceRiskHoldReqVO) {
  return requestClient.post<PayWalletFreezeApi.Freeze>(
    '/wallet/freeze/risk-hold',
    data,
  );
}

/** 下账户冻结（司法）。独立权限点：这是对用户全部资产的强制处分。 */
export function placeJudicialFreeze(
  data: PayWalletFreezeApi.PlaceJudicialReqVO,
) {
  return requestClient.post<PayWalletFreezeApi.Freeze>(
    '/wallet/freeze/judicial',
    data,
  );
}

/** 解除冻结（放行，钱回到可用余额） */
export function releaseFreeze(id: number) {
  return requestClient.post<boolean>(`/wallet/freeze/release/${id}`);
}

/**
 * 把到期的冻结翻成 EXPIRED。
 *
 * 到期本身不需要调这个：过期的冻结在可用余额计算里当场失效，这里只是把状态和
 * 缓存追上事实，晚跑漏跑都不影响用户的钱。
 */
export function sweepExpiredFreezes(limit = 200) {
  return requestClient.post<number>('/wallet/freeze/sweep-expired', undefined, {
    params: { limit },
  });
}
