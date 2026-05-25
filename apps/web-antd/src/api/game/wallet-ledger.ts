import { requestClient } from '#/api/request';

/**
 * Game admin Wallet Ledger API (OPS-B/C).
 * 对接 controller/admin/wallet/WalletLedgerController (/admin/game/wallet-ledger/*).
 *
 * 跟 game_ledger_entry (牌局经济事实) 平行的 audit 流:
 *   任何 wallet balance 变化都有 1 行 (HAND_SETTLE / BUY_IN_FREEZE / CASH_OUT /
 *   TOPUP / DEDUCT / WITHDRAW / ADJUSTMENT / REFUND).
 *
 * wallet_kind 编码:
 *   1 = platform   (留 OPS-E)
 *   2 = alliance   (留 OPS-E)
 *   3 = club
 *   4 = agent
 *   5 = club_member
 */

export namespace GameWalletLedgerApi {
  export const WALLET_KIND_PLATFORM = 1;
  export const WALLET_KIND_ALLIANCE = 2;
  export const WALLET_KIND_CLUB = 3;
  export const WALLET_KIND_AGENT = 4;
  export const WALLET_KIND_MEMBER = 5;

  export interface LedgerRow {
    entry_id: number;
    wallet_kind: number;
    scope_alliance_id?: null | number;
    scope_club_id?: null | number;
    scope_agent_id?: null | number;
    scope_user_id?: null | number;
    currency_type: string;
    direction: number;                 // 1=CREDIT, -1=DEBIT
    amount: number;
    balance_before: number;
    balance_after: number;
    source_type: string;
    source_id?: null | number;
    reason?: null | string;
    operator_user_id?: null | number;
    match_id?: null | number;          // 对局 id（牌局相关流水带；人工上下分为 null）
    created_at: number;
  }

  export interface ListResponse {
    list: LedgerRow[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }

  export interface QueryParams {
    page: number;
    page_size: number;
    wallet_kind?: number;
    club_id?: number;
    user_id?: number;
    agent_id?: number;
    alliance_id?: number;
    source_type?: string;
    from?: number;
    to?: number;
  }
}

const BASE = '/game/wallet-ledger';

export async function getWalletLedgerPage(
  params: GameWalletLedgerApi.QueryParams,
): Promise<{ list: GameWalletLedgerApi.LedgerRow[]; total: number }> {
  const data = await requestClient.get<GameWalletLedgerApi.ListResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

export function walletKindLabel(kind: number): string {
  switch (kind) {
    case 1: {
      return '平台';
    }
    case 2: {
      return '联盟';
    }
    case 3: {
      return '俱乐部';
    }
    case 4: {
      return '代理';
    }
    case 5: {
      return '玩家';
    }
    default: {
      return `kind=${kind}`;
    }
  }
}

export function sourceTypeLabel(s: string): string {
  switch (s) {
    case 'HAND_SETTLE': {
      return '牌局结算';
    }
    case 'BUY_IN_FREEZE': {
      return '入桌冻结';
    }
    case 'CASH_OUT': {
      return '离桌兑出';
    }
    case 'TOPUP': {
      return '充值';
    }
    case 'DEDUCT': {
      return '扣账';
    }
    case 'WITHDRAW': {
      return '提现';
    }
    case 'ADJUSTMENT': {
      return '人工调账';
    }
    case 'REFUND': {
      return '退款';
    }
    default: {
      return s;
    }
  }
}
