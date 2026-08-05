import { requestClient } from '#/api/request';

export namespace PayBankCardApi {
  /** 银行卡视图。**只有掩码卡号**，完整卡号只能走 revealBankCardNo 单独换。 */
  export interface BankCard {
    id: number;
    userId: number;
    holderName: string;
    bankName: string;
    bankCode?: null | string;
    cardNoMasked: string;
    status: number;
    createdAt?: null | number;
  }
}

/** 查某个用户绑定的银行卡（掩码） */
export function getUserBankCards(userId: number) {
  return requestClient.get<PayBankCardApi.BankCard[]>(
    `/wallet/bank-cards/user/${userId}`,
  );
}

/**
 * 解密完整卡号（打款/审核用）。
 *
 * 每次调用服务端都写一条敏感操作审计（经办人 / IP / traceId），所以不要为了
 * 「顺手展示」而在列表加载时批量调它——那会把审计表变成噪音，真正的打款记录就淹了。
 */
export function revealBankCardNo(id: number) {
  return requestClient.post<string>(`/wallet/bank-cards/reveal/${id}`);
}
