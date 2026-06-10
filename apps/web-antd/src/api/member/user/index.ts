import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MemberUserApi {
  /** 会员用户信息 */
  export interface User {
    id?: number;
    avatar?: string;
    birthday?: number;
    createTime?: number;
    loginDate?: number;
    loginIp: string;
    mark: string;
    mobile: string;
    name?: string;
    nickname?: string;
    registerIp: string;
    sex: number;
    status: number;
    areaId?: number;
    areaName?: string;
    levelName: string;
    point?: number;
    totalPoint?: number;
    experience?: number;
  }

  /** 会员用户等级更新信息 */
  export interface UserUpdateLevelReqVO {
    id: number;
    levelId: number;
  }

  /** 会员用户积分更新信息 */
  export interface UserPointUpdateReqVO {
    id: number;
    point: number;
  }

  /** 批量补陪玩机器人昵称的统计结果 */
  export interface FillBotNicknamesResult {
    /** 扫到的候选数 (is_robot=1 且 nickname 为空) */
    scanned: number;
    /** 成功补昵称的 bot 数 */
    filled: number;
    /** 词库未初始化或单边空 → generator 返 null, 该条跳过 */
    skippedPoolEmpty: number;
    /** 写库失败的条数 */
    errors: number;
  }
}

/** 查询会员用户列表 */
export function getUserPage(params: PageParam) {
  return requestClient.get<PageResult<MemberUserApi.User>>(
    '/member/user/page',
    {
      params,
    },
  );
}

/** 查询会员用户详情 */
export function getUser(id: number) {
  return requestClient.get<MemberUserApi.User>(`/member/user/get/${id}`);
}

/** 修改会员用户 */
export function updateUser(data: MemberUserApi.User) {
  return requestClient.put('/member/user/update', data);
}

/** 修改会员用户等级 */
export function updateUserLevel(data: MemberUserApi.UserUpdateLevelReqVO) {
  return requestClient.put('/member/user/update-level', data);
}

/** 修改会员用户积分 */
export function updateUserPoint(data: MemberUserApi.UserPointUpdateReqVO) {
  return requestClient.put('/member/user/update-point', data);
}

/** 批量给 is_robot=1 且 nickname 为空的陪玩机器人补昵称(用词库随机生成). */
export function fillBotNicknames() {
  return requestClient.post<MemberUserApi.FillBotNicknamesResult>(
    '/member/user/fill-bot-nicknames',
  );
}
