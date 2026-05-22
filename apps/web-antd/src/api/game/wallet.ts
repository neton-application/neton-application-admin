import { requestClient } from '#/api/request';

/**
 * Game admin Wallet API (P-revenue-runtime).
 * 对接 controller/admin/wallet/WalletController (/admin/game/wallets/*).
 *
 * 三层钱包 (只读 v1; 调账走 v1.1+ 双人审批):
 *   - club wallet: 俱乐部经营账户 (rake 实时入账后存在这里)
 *   - club member wallet: 玩家在 club 内余额 (隔离, 不跨 club)
 *   - agent wallet: 代理经营账户 (分成实时入账)
 *
 * 钱包不存在时后端返零余额占位 (避免前端 404 噪音).
 *
 * 权限点: game:wallet:read
 */

export namespace GameWalletApi {
  export interface ClubWallet {
    club_id: number;
    currency_type: string;
    available_balance: number;
    frozen_balance: number;
    total_rake_received: number;
    total_paid_out: number;
    version: number;
    updated_at: number;
  }

  export interface AgentWallet {
    agent_id: number;
    currency_type: string;
    available_balance: number;
    total_rake_received: number;
    total_paid_out: number;
    version: number;
    updated_at: number;
  }

  export interface MemberWallet {
    club_id: number;
    user_id: number;
    currency_type: string;
    available_balance: number;
    frozen_balance: number;
    buy_in_total: number;
    cash_out_total: number;
    win_loss_total: number;
    version: number;
    updated_at: number;
  }
}

const BASE = '/game/wallets';

// G-WALLET-A + DBCTX Phase A: admin 人工调账入参.
//   - request_id: 必填. 幂等键 (UUID/工单号); 同 source_type 内 UNIQUE, 重复不重复加钱.
//   - reason: 必填. 短分类原因 (入 wallet_ledger.reason, 给流水视图).
//   - remark: 可选. 自由备注 (拼到 reason 后).
export interface MemberWalletAdjustBody {
  amount: number;
  currency_type?: null | string;
  request_id: string;
  reason: string;
  remark?: null | string;
}

export function getClubWallet(clubId: number, currencyType?: string) {
  return requestClient.get<GameWalletApi.ClubWallet>(`${BASE}/club/${clubId}`, {
    params: currencyType ? { currency_type: currencyType } : undefined,
  });
}

export function getClubMemberWallets(clubId: number, limit?: number) {
  return requestClient.get<GameWalletApi.MemberWallet[]>(
    `${BASE}/club/${clubId}/members`,
    { params: limit ? { limit } : undefined },
  );
}

export function getMemberWallet(
  clubId: number,
  userId: number,
  currencyType?: string,
) {
  return requestClient.get<GameWalletApi.MemberWallet>(
    `${BASE}/club/${clubId}/member/${userId}`,
    { params: currencyType ? { currency_type: currencyType } : undefined },
  );
}

export function getAgentWallet(agentId: number, currencyType?: string) {
  return requestClient.get<GameWalletApi.AgentWallet>(
    `${BASE}/agent/${agentId}`,
    { params: currencyType ? { currency_type: currencyType } : undefined },
  );
}

// OPS-B: admin 给玩家充值
export function topupMemberWallet(
  clubId: number,
  userId: number,
  body: MemberWalletAdjustBody,
) {
  return requestClient.post<GameWalletApi.MemberWallet>(
    `${BASE}/club/${clubId}/member/${userId}/topup`,
    body,
  );
}

// OPS-B: admin 扣玩家余额
export function deductMemberWallet(
  clubId: number,
  userId: number,
  body: MemberWalletAdjustBody,
) {
  return requestClient.post<GameWalletApi.MemberWallet>(
    `${BASE}/club/${clubId}/member/${userId}/deduct`,
    body,
  );
}
