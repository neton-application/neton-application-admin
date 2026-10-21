import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MemberUserApi {
  /** 账号信息。等级 / 分组 / 积分 / 成长值来自会员档案（member 模块），由下面的查询合并进来。 */
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
    levelName?: string;
    groupName?: string;
    point?: number;
    totalPoint?: number;
    experience?: number;
  }

  /** 会员档案（member 模块，按 userId 与账号合并） */
  export interface Profile {
    userId: number;
    levelId?: number;
    levelName?: string;
    experience: number;
    point: number;
    groupId?: number;
    groupName?: string;
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

  /** 会员登录密码重设入参（明文只用于这次请求；服务端加盐哈希后落库） */
  export interface UserPasswordUpdateReqVO {
    id: number;
    password: string;
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

/**
 * 合并会员档案。没装 member 或没有 member:profile:query 时请求会失败，
 * 这时账号照常返回，等级 / 积分列留空 —— 账号页不依赖会员模块。
 */
async function withProfiles(users: MemberUserApi.User[]) {
  const ids = users.map((u) => u.id).filter((id): id is number => !!id);
  if (ids.length === 0) return users;
  let profiles: MemberUserApi.Profile[] = [];
  try {
    profiles = await requestClient.get<MemberUserApi.Profile[]>(
      '/member/user/profiles',
      { params: { ids: ids.join(',') } },
    );
  } catch {
    return users;
  }
  const byId = new Map(profiles.map((p) => [p.userId, p]));
  return users.map((u) => {
    const p = u.id ? byId.get(u.id) : undefined;
    return p
      ? {
          ...u,
          levelName: p.levelName,
          groupName: p.groupName,
          point: p.point,
          experience: p.experience,
        }
      : u;
  });
}

/** 查询账号列表 */
export async function getUserPage(params: PageParam) {
  const page = await requestClient.get<PageResult<MemberUserApi.User>>(
    '/account/user/page',
    {
      params,
    },
  );
  return { ...page, list: await withProfiles(page.list ?? []) };
}

/** 查询账号详情 */
export async function getUser(id: number) {
  const user = await requestClient.get<MemberUserApi.User>(
    `/account/user/get/${id}`,
  );
  return (await withProfiles([user]))[0] ?? user;
}

/** 修改账号 */
export function updateUser(data: MemberUserApi.User) {
  return requestClient.put('/account/user/update', data);
}

/** 修改会员用户等级 */
export function updateUserLevel(data: MemberUserApi.UserUpdateLevelReqVO) {
  return requestClient.put('/member/user/update-level', data);
}

/** 修改会员用户积分 */
export function updateUserPoint(data: MemberUserApi.UserPointUpdateReqVO) {
  return requestClient.put('/member/user/update-point', data);
}

/** 重设会员登录密码（管理员操作，无需旧密码；明文只用于本次请求，不回显） */
export function updateUserPassword(data: MemberUserApi.UserPasswordUpdateReqVO) {
  return requestClient.put('/account/user/update-password', data);
}

/** 批量给 is_robot=1 且 nickname 为空的陪玩机器人补昵称(用词库随机生成). */
export function fillBotNicknames() {
  return requestClient.post<MemberUserApi.FillBotNicknamesResult>(
    '/account/user/fill-bot-nicknames',
  );
}
