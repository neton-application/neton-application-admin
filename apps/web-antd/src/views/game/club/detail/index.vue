<script lang="ts" setup>
import type { GameAgentApi } from '#/api/game/agent';
import type { GameClubApi } from '#/api/game/club';
import type { GameTableApi } from '#/api/game/table';
import type { GameLedgerApi } from '#/api/game/ledger';
import type { GameAuditApi } from '#/api/game/audit';
import type { GameWalletApi } from '#/api/game/wallet';
import type { GameWalletLedgerApi } from '#/api/game/wallet-ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  TabPane,
  Tag,
  Typography,
} from 'ant-design-vue';

import { bindClubToAgent, getAgentDetail } from '#/api/game/agent';
import {
  createRoomTemplate,
  deleteRoomTemplate,
  getClubDetail,
  getClubMembers,
  getClubRevenueSummary,
  getClubSettings,
  getRoomTemplates,
  updateClubSettings,
  updateRoomTemplate,
} from '#/api/game/club';
import { getTablePage } from '#/api/game/table';
import { getLedgerPage } from '#/api/game/ledger';
import { getWalletLedgerPage, sourceTypeLabel } from '#/api/game/wallet-ledger';
import { getAuditPage } from '#/api/game/audit';
import {
  deductMemberWallet,
  getClubMemberWallets,
  getClubWallet,
  topupMemberWallet,
} from '#/api/game/wallet';
import {
  batchCreateAutoPlayers,
  fillAutoPlayers,
  leaveAutoPlayers,
  listAutoPlayers,
  listClubRooms,
  type GameAutoPlayerApi,
} from '#/api/game/auto-player';

/**
 * 俱乐部详情页 (P-club-game-center) — 俱乐部老板视角入口.
 *
 * 5 Tabs (与 spec doc 一致):
 *   - Overview: 基本信息 + member/table 统计 + 创建/更新时间
 *   - Members:  成员列表 (含 owner/admin/member 角色)
 *   - Tables:   本 club 桌列表 (复用 getTablePage + club_id filter)
 *   - Game Records: 本 club 游戏日志 (audit; 默认 club_id + scope_type='game_table' 走 JOIN)
 *   - Ledger:   本 club 资金流水 (复用 getLedgerPage + club_id filter)
 *   - Revenue:  抽水统计 (read-only summary; 真实分账见 GAME_REVENUE_SHARE_SPEC v1.1+)
 *
 * 跳转规则:
 *   - Tables 行 → 牌桌详情 (GameTableDetail) 同款入口
 *   - 顶级菜单 (游戏日志 / 资金流水) 是跨 club 平台超管视角, 与此并列共存
 */

const route = useRoute();
const router = useRouter();

const clubId = computed(() => Number(route.query.clubId ?? 0));

const detailLoading = ref(false);
const detail = ref<GameClubApi.ClubDetail | null>(null);

const membersLoading = ref(false);
const members = ref<GameClubApi.ClubMember[]>([]);
// user_id → club_credit 可用余额 (与成员列表同源展示, 来自 member wallet)
const memberBalances = ref<Record<number, number>>({});

const tablesLoading = ref(false);
const tables = ref<GameTableApi.TableListItem[]>([]);
const tablesPage = ref({ current: 1, pageSize: 20, total: 0 });

const auditLoading = ref(false);
const auditRows = ref<GameAuditApi.Event[]>([]);
const auditPage = ref({ current: 1, pageSize: 20, total: 0 });

const ledgerLoading = ref(false);
const ledgerRows = ref<GameLedgerApi.Entry[]>([]);
const ledgerPage = ref({ current: 1, pageSize: 20, total: 0 });

const revenueLoading = ref(false);
const revenue = ref<GameClubApi.RevenueSummary | null>(null);

// P-revenue-runtime: 钱包 + 代理绑定
const walletLoading = ref(false);
const clubWallet = ref<GameWalletApi.ClubWallet | null>(null);
const memberWallets = ref<GameWalletApi.MemberWallet[]>([]);
const bindAgentOpen = ref(false);
const bindForm = reactive({ agent_id: 0 });
const bindAgentDetail = ref<GameAgentApi.AgentRow | null>(null);

// OPS-B: topup / deduct modal
const adjustOpen = ref(false);
const adjustMode = ref<'deduct' | 'topup'>('topup');
const adjustTargetUserId = ref(0);
const adjustForm = reactive({ amount: 0, reason: '', remark: '' });

// 成员资金流水（上分/下分/赢/输 完整日志）：复用 wallet-ledger（club_member 钱包 kind=5）。
// 注意与上方 club 级 ledger（ledgerRows/loadLedger）区分，统一加 memberLedger 前缀。
const memberLedgerOpen = ref(false);
const memberLedgerUserId = ref(0);
const memberLedgerLoading = ref(false);
const memberLedgerRows = ref<GameWalletLedgerApi.LedgerRow[]>([]);
const memberLedgerPage = reactive({ current: 1, pageSize: 20, total: 0 });

async function loadDetail() {
  if (!clubId.value) return;
  detailLoading.value = true;
  try {
    detail.value = await getClubDetail(clubId.value);
  } finally {
    detailLoading.value = false;
  }
}

async function loadMembers() {
  if (!clubId.value) return;
  membersLoading.value = true;
  try {
    members.value = await getClubMembers(clubId.value);
    const wallets = await getClubMemberWallets(clubId.value, 200);
    const m: Record<number, number> = {};
    for (const w of wallets) m[w.user_id] = w.available_balance;
    memberBalances.value = m;
  } finally {
    membersLoading.value = false;
  }
}

async function loadTables(page = 1) {
  if (!clubId.value) return;
  tablesLoading.value = true;
  try {
    const data = await getTablePage({
      page,
      page_size: tablesPage.value.pageSize,
      club_id: clubId.value,
    });
    tables.value = data.list;
    tablesPage.value = { ...tablesPage.value, current: page, total: data.total };
  } finally {
    tablesLoading.value = false;
  }
}

async function loadAudit(page = 1) {
  if (!clubId.value) return;
  auditLoading.value = true;
  try {
    const data = await getAuditPage({
      page,
      page_size: auditPage.value.pageSize,
      club_id: clubId.value,
    });
    auditRows.value = data.list;
    auditPage.value = { ...auditPage.value, current: page, total: data.total };
  } finally {
    auditLoading.value = false;
  }
}

async function loadLedger(page = 1) {
  if (!clubId.value) return;
  ledgerLoading.value = true;
  try {
    const data = await getLedgerPage({
      page,
      page_size: ledgerPage.value.pageSize,
      club_id: clubId.value,
    });
    ledgerRows.value = data.list;
    ledgerPage.value = { ...ledgerPage.value, current: page, total: data.total };
  } finally {
    ledgerLoading.value = false;
  }
}

async function loadRevenue() {
  if (!clubId.value) return;
  revenueLoading.value = true;
  try {
    revenue.value = await getClubRevenueSummary(clubId.value);
  } finally {
    revenueLoading.value = false;
  }
}

async function loadWallet() {
  if (!clubId.value) return;
  walletLoading.value = true;
  try {
    clubWallet.value = await getClubWallet(clubId.value);
    memberWallets.value = await getClubMemberWallets(clubId.value, 200);
  } finally {
    walletLoading.value = false;
  }
}

async function openBindAgent() {
  bindForm.agent_id = 0;
  bindAgentDetail.value = null;
  bindAgentOpen.value = true;
}

async function lookupAgent() {
  if (!bindForm.agent_id) {
    bindAgentDetail.value = null;
    return;
  }
  try {
    bindAgentDetail.value = await getAgentDetail(bindForm.agent_id);
  } catch {
    bindAgentDetail.value = null;
    message.warning(`agent_id=${bindForm.agent_id} 不存在`);
  }
}

async function submitBindAgent() {
  if (!bindForm.agent_id || !bindAgentDetail.value) {
    message.error('请输入合法的 agent_id');
    return;
  }
  await bindClubToAgent({
    club_id: clubId.value,
    agent_id: bindForm.agent_id,
  });
  message.success(`已绑定到代理 ${bindAgentDetail.value.display_name}`);
  bindAgentOpen.value = false;
}

// ===== 俱乐部设置（club 级 + 牌桌组 RoomTemplate）=====
const settingsOpen = ref(false);
const settingsLoading = ref(false);
const clubSettings = reactive<GameClubApi.ClubSettings>({
  play_mode: 'standard',
  auto_play_enabled: false,
  orchestrator_enabled: false,
  auto_player_pool_limit: 0,
});
const templates = ref<GameClubApi.RoomTemplate[]>([]);

// 牌桌组按 game_type 分组展示
const templatesByType = computed(() => {
  const groups: Record<string, GameClubApi.RoomTemplate[]> = {};
  for (const t of templates.value) {
    (groups[t.game_type] ||= []).push(t);
  }
  return Object.entries(groups).map(([gameType, list]) => ({ gameType, list }));
});

const GAME_TYPE_LABEL: Record<string, string> = {
  texas_holdem: '德州扑克',
  dou_dizhu: '斗地主',
  zha_jin_hua: '炸金花',
  niu_niu: '牛牛',
};
function gameTypeLabel(t: string) {
  return GAME_TYPE_LABEL[t] ?? t;
}

async function openSettings() {
  settingsOpen.value = true;
  settingsLoading.value = true;
  try {
    const [s, tpls] = await Promise.all([
      getClubSettings(clubId.value),
      getRoomTemplates(clubId.value),
    ]);
    Object.assign(clubSettings, s);
    templates.value = tpls;
  } catch {
    message.error('加载俱乐部设置失败');
  } finally {
    settingsLoading.value = false;
  }
}

async function saveClubSettings() {
  try {
    await updateClubSettings(clubId.value, { ...clubSettings });
    message.success('俱乐部设置已保存');
  } catch {
    message.error('保存失败');
  }
}

async function reloadTemplates() {
  templates.value = await getRoomTemplates(clubId.value);
}

// ----- 牌桌组 创建/编辑 modal -----
const tplModalOpen = ref(false);
const tplEditingId = ref<null | number>(null);
const tplForm = reactive<GameClubApi.RoomTemplateInput>({
  game_type: 'texas_holdem',
  name: '',
  enabled: true,
  small_blind: 1,
  big_blind: 2,
  buy_in_min: 100,
  buy_in_max: 400,
  max_seats: 6,
  min_active_rooms: 2,
  max_active_rooms: 8,
  expand_when_occupancy_percent: 80,
  session_duration_minutes: 0,
  target_seated_count: 3,
  max_auto_players_per_room: 3,
  auto_play_difficulty: 40,
  difficulty_spread: 20,
  play_mode: 'standard',
  deck_mode: 'fair_random',
  currency_type: 'club_credit',
  insurance_enabled: false,
  sort_order: 0,
});

function openTplCreate(gameType = 'texas_holdem') {
  tplEditingId.value = null;
  Object.assign(tplForm, {
    game_type: gameType,
    name: '',
    enabled: true,
    small_blind: 1,
    big_blind: 2,
    buy_in_min: 100,
    buy_in_max: 400,
    max_seats: 6,
    min_active_rooms: 2,
    max_active_rooms: 8,
    expand_when_occupancy_percent: 80,
    session_duration_minutes: 0,
    target_seated_count: 3,
    max_auto_players_per_room: 3,
    auto_play_difficulty: 40,
    difficulty_spread: 20,
    play_mode: 'standard',
    deck_mode: 'fair_random',
    currency_type: 'club_credit',
    insurance_enabled: false,
    sort_order: 0,
  });
  tplModalOpen.value = true;
}

function openTplEdit(t: GameClubApi.RoomTemplate) {
  tplEditingId.value = t.template_id;
  Object.assign(tplForm, {
    game_type: t.game_type,
    name: t.name,
    enabled: t.enabled,
    small_blind: t.small_blind,
    big_blind: t.big_blind,
    buy_in_min: t.buy_in_min,
    buy_in_max: t.buy_in_max,
    max_seats: t.max_seats,
    min_active_rooms: t.min_active_rooms,
    max_active_rooms: t.max_active_rooms,
    expand_when_occupancy_percent: t.expand_when_occupancy_percent,
    session_duration_minutes: t.session_duration_minutes,
    target_seated_count: t.target_seated_count,
    max_auto_players_per_room: t.max_auto_players_per_room,
    auto_play_difficulty: t.auto_play_difficulty,
    difficulty_spread: t.difficulty_spread,
    play_mode: t.play_mode,
    deck_mode: t.deck_mode,
    currency_type: t.currency_type,
    insurance_enabled: t.insurance_enabled,
    sort_order: t.sort_order,
  });
  tplModalOpen.value = true;
}

async function saveTpl() {
  if (!tplForm.name.trim()) {
    message.error('请填写房型名称');
    return;
  }
  // UI 层提示同盲注重复(DB 不硬拦)。
  const dup = templates.value.find(
    (t) =>
      t.template_id !== tplEditingId.value &&
      t.game_type === tplForm.game_type &&
      t.small_blind === tplForm.small_blind &&
      t.big_blind === tplForm.big_blind,
  );
  if (dup && tplEditingId.value === null) {
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '盲注重复',
        content: `该俱乐部已有 ${tplForm.small_blind}/${tplForm.big_blind} 的「${dup.name}」，确认继续创建？`,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!ok) return;
  }
  try {
    if (tplEditingId.value === null) {
      await createRoomTemplate(clubId.value, { ...tplForm });
      message.success('房型已创建');
    } else {
      await updateRoomTemplate(clubId.value, tplEditingId.value, { ...tplForm });
      message.success('房型已更新');
    }
    tplModalOpen.value = false;
    await reloadTemplates();
  } catch {
    message.error('保存房型失败');
  }
}

async function toggleTplEnabled(t: GameClubApi.RoomTemplate) {
  try {
    await updateRoomTemplate(clubId.value, t.template_id, {
      ...t,
      enabled: !t.enabled,
    });
    await reloadTemplates();
  } catch {
    message.error('操作失败');
  }
}

function removeTpl(t: GameClubApi.RoomTemplate) {
  Modal.confirm({
    title: '删除房型',
    content: `确认删除「${t.name}」？删除后不再开新桌，历史对局仍可追溯。`,
    okButtonProps: { danger: true },
    onOk: async () => {
      await deleteRoomTemplate(clubId.value, t.template_id);
      message.success('房型已删除');
      await reloadTemplates();
    },
  });
}

// OPS-B: 给会员充值 / 扣账
function resetAdjustForm() {
  adjustForm.amount = 0;
  adjustForm.reason = '';
  adjustForm.remark = '';
}

function openTopupModal(userId: number) {
  adjustMode.value = 'topup';
  adjustTargetUserId.value = userId;
  resetAdjustForm();
  adjustOpen.value = true;
}

function openDeductModal(userId: number) {
  adjustMode.value = 'deduct';
  adjustTargetUserId.value = userId;
  resetAdjustForm();
  adjustOpen.value = true;
}

// 成员流水：上分/下分(TOPUP/DEDUCT/WITHDRAW/ADJUSTMENT) + 赢/输(HAND_SETTLE/CASH_OUT/BUY_IN_FREEZE/REFUND)
// 全在 club_member 钱包流水里，direction 1=入账(+) -1=出账(-)。
async function loadMemberLedger(page = 1) {
  if (!clubId.value || !memberLedgerUserId.value) return;
  memberLedgerLoading.value = true;
  try {
    const { list, total } = await getWalletLedgerPage({
      page,
      page_size: memberLedgerPage.pageSize,
      wallet_kind: 5, // club_member
      club_id: clubId.value,
      user_id: memberLedgerUserId.value,
    });
    memberLedgerRows.value = list;
    memberLedgerPage.current = page;
    memberLedgerPage.total = total;
  } catch {
    message.error('加载流水失败');
  } finally {
    memberLedgerLoading.value = false;
  }
}

function openMemberLedgerModal(userId: number) {
  memberLedgerUserId.value = userId;
  memberLedgerRows.value = [];
  memberLedgerPage.current = 1;
  memberLedgerPage.total = 0;
  memberLedgerOpen.value = true;
  loadMemberLedger(1);
}

async function submitAdjust() {
  if (!adjustForm.amount || adjustForm.amount <= 0) {
    message.error('amount 必须 > 0');
    return;
  }
  if (!adjustForm.reason.trim()) {
    message.error('reason 必填');
    return;
  }
  const fn = adjustMode.value === 'topup' ? topupMemberWallet : deductMemberWallet;
  try {
    await fn(clubId.value, adjustTargetUserId.value, {
      amount: adjustForm.amount,
      request_id: crypto.randomUUID(),
      reason: adjustForm.reason.trim(),
      remark: adjustForm.remark.trim() || null,
    });
    message.success(adjustMode.value === 'topup' ? '充值成功' : '扣账成功');
    adjustOpen.value = false;
    await Promise.all([loadWallet(), loadMembers()]);
  } catch (e: any) {
    message.error(`操作失败: ${e?.message ?? e}`);
  }
}

// 切 tab 时按需 lazy load (Overview 已经在 mount 时 loadDetail).
function handleTabChange(key: number | string) {
  if (key === 'members' && members.value.length === 0) loadMembers();
  if (key === 'tables' && tables.value.length === 0) loadTables(1);
  if (key === 'audit' && auditRows.value.length === 0) loadAudit(1);
  if (key === 'ledger' && ledgerRows.value.length === 0) loadLedger(1);
  if (key === 'revenue' && !revenue.value) loadRevenue();
  if (key === 'wallet' && !clubWallet.value) loadWallet();
  if (key === 'auto_player') {
    if (autoPlayers.value.length === 0) loadAutoPlayers();
    loadClubRooms();
  }
}

// 陪玩机器人 (admin 专属；玩家端无感)
const autoPlayers = ref<GameAutoPlayerApi.AutoPlayerRow[]>([]);
const autoPlayersLoading = ref(false);
const batchOpen = ref(false);
const batchForm = reactive({ count: 6, initialBalance: 5000, autoPlayEnabled: true });

async function loadAutoPlayers() {
  if (!clubId.value) return;
  autoPlayersLoading.value = true;
  try {
    autoPlayers.value = await listAutoPlayers(clubId.value);
  } finally {
    autoPlayersLoading.value = false;
  }
}

// 可用房间下拉 (补位用)。
const clubRooms = ref<GameAutoPlayerApi.ClubRoomOption[]>([]);
async function loadClubRooms() {
  if (!clubId.value) return;
  try {
    clubRooms.value = await listClubRooms(clubId.value);
    // 默认选第一个可用房间，避免空选 / 误填。
    const first = clubRooms.value[0];
    if (!fillForm.roomId && first) {
      fillForm.roomId = first.room_id;
    }
  } catch {
    clubRooms.value = [];
  }
}

async function submitBatchCreate() {
  if (batchForm.count < 1 || batchForm.count > 20) {
    message.error('数量需 1~20');
    return;
  }
  try {
    const r = await batchCreateAutoPlayers(clubId.value, {
      request_id: `batch-${clubId.value}-${Date.now()}`,
      count: batchForm.count,
      initial_balance: batchForm.initialBalance,
      auto_play_enabled: batchForm.autoPlayEnabled,
    });
    message.success(`创建成功 ${r.created_count}，失败 ${r.failed_count}`);
    batchOpen.value = false;
    await loadAutoPlayers();
  } catch (e: any) {
    message.error(`创建失败: ${e?.message ?? e}`);
  }
}

const fillForm = reactive({ roomId: 0, count: 3 });
async function submitFill() {
  if (!fillForm.roomId) {
    message.error('请先选择房间');
    return;
  }
  try {
    const r = await fillAutoPlayers(clubId.value, {
      room_id: fillForm.roomId,
      count: fillForm.count,
    });
    message.success(`补位 ${r.seated}，跳过 ${r.skipped}`);
    await Promise.all([loadAutoPlayers(), loadClubRooms()]);
  } catch (e: any) {
    message.error(`补位失败: ${e?.message ?? e}`);
  }
}

async function submitLeave() {
  if (!fillForm.roomId) {
    message.error('请先选择房间');
    return;
  }
  try {
    const r = await leaveAutoPlayers(clubId.value, { room_id: fillForm.roomId });
    message.success(`已让 ${r.left} 个机器人离开`);
    await Promise.all([loadAutoPlayers(), loadClubRooms()]);
  } catch (e: any) {
    message.error(`清空失败: ${e?.message ?? e}`);
  }
}

function handleBack() {
  router.push({ path: '/game/club' });
}

function openTable(row: GameTableApi.TableListItem) {
  router.push({
    name: 'GameTableDetail',
    query: { tableId: String(row.table_id) },
  });
}

function statusTag(s: number) {
  if (s === 1) return { color: 'green', text: 'ACTIVE' };
  if (s === 2) return { color: 'default', text: 'DISSOLVED' };
  return { color: 'default', text: `status=${s}` };
}

function roleLabel(r: number) {
  if (r === 2) return { color: 'gold', text: 'OWNER' };
  if (r === 1) return { color: 'blue', text: 'ADMIN' };
  return { color: 'default', text: 'MEMBER' };
}

function tableStateLabel(s: number) {
  switch (s) {
    case 0:
      return { color: 'green', text: 'OPEN' };
    case 1:
      return { color: 'blue', text: 'PLAYING' };
    case 2:
      return { color: 'orange', text: 'SETTLING' };
    case 3:
      return { color: 'default', text: 'CLOSED' };
    default:
      return { color: 'default', text: `state=${s}` };
  }
}

function directionLabel(d: number): string {
  if (d === 1) return 'CREDIT';
  if (d === -1) return 'DEBIT';
  return `dir=${d}`;
}

watch(clubId, (v, old) => {
  if (v && v !== old) {
    detail.value = null;
    members.value = [];
    tables.value = [];
    auditRows.value = [];
    ledgerRows.value = [];
    revenue.value = null;
    loadDetail();
  }
});

onMounted(loadDetail);
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex justify-between">
      <Space>
        <Button @click="handleBack">返回俱乐部列表</Button>
        <Button type="primary" :loading="detailLoading" @click="loadDetail">
          刷新
        </Button>
      </Space>
      <Space>
        <Button v-if="detail" type="primary" @click="openSettings">
          俱乐部设置
        </Button>
        <Button v-if="detail" @click="openBindAgent">绑定代理</Button>
      </Space>
    </div>

    <Empty v-if="!detailLoading && !detail" description="俱乐部不存在或无权限" />

    <Tabs
      v-if="detail"
      default-active-key="overview"
      type="card"
      @change="handleTabChange"
    >
      <!-- Overview -->
      <TabPane key="overview" tab="概览">
        <Card>
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="俱乐部 ID">
              {{ detail.club_id }}
            </DescriptionsItem>
            <DescriptionsItem label="名称">
              {{ detail.name }}
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="statusTag(detail.status).color">
                {{ statusTag(detail.status).text }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="创建人 user_id">
              {{ detail.owner_user_id }}
            </DescriptionsItem>
            <DescriptionsItem label="成员数">
              {{ detail.member_count }}
            </DescriptionsItem>
            <DescriptionsItem label="活跃 / 总桌数">
              {{ detail.active_table_count }} / {{ detail.total_table_count }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ detail.created_at ? formatDateTime(detail.created_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="更新时间">
              {{ detail.updated_at ? formatDateTime(detail.updated_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="描述" :span="2">
              {{ detail.description ?? '(无)' }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </TabPane>

      <!-- Members -->
      <TabPane key="members" tab="成员">
        <Card>
          <div class="mb-2 flex justify-end">
            <Button :loading="membersLoading" size="small" @click="loadMembers">
              刷新
            </Button>
          </div>
          <Table
            :data-source="members"
            :loading="membersLoading"
            :pagination="{ pageSize: 50 }"
            row-key="user_id"
            size="small"
            :columns="[
              { title: '角色', dataIndex: 'role', width: 110 },
              { title: 'User ID', dataIndex: 'user_id', width: 160 },
              { title: '余额', dataIndex: 'balance', width: 120 },
              { title: '加入时间', dataIndex: 'joined_at', width: 200 },
              { title: '操作', dataIndex: 'action', width: 160 },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'role'">
                <Tag :color="roleLabel(record.role).color">
                  {{ roleLabel(record.role).text }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'balance'">
                {{ (memberBalances[record.user_id] ?? 0).toLocaleString() }}
              </template>
              <template v-else-if="column.dataIndex === 'joined_at'">
                {{ record.joined_at ? formatDateTime(record.joined_at) : '-' }}
              </template>
              <template v-else-if="column.dataIndex === 'action'">
                <Button
                  size="small"
                  type="link"
                  @click="openTopupModal(record.user_id)"
                >
                  上分
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="openDeductModal(record.user_id)"
                >
                  下分
                </Button>
                <Button
                  size="small"
                  type="link"
                  @click="openMemberLedgerModal(record.user_id)"
                >
                  流水
                </Button>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Tables -->
      <TabPane key="tables" tab="牌桌">
        <Card>
          <div class="mb-2 flex justify-end">
            <Button :loading="tablesLoading" size="small" @click="loadTables(tablesPage.current)">
              刷新
            </Button>
          </div>
          <Table
            :data-source="tables"
            :loading="tablesLoading"
            :pagination="{
              current: tablesPage.current,
              pageSize: tablesPage.pageSize,
              total: tablesPage.total,
              showSizeChanger: false,
              onChange: (p: number) => loadTables(p),
            }"
            row-key="table_id"
            size="small"
            :columns="[
              { title: 'Table ID', dataIndex: 'table_id', width: 110, fixed: 'left' },
              { title: 'Game Kind', dataIndex: 'game_kind', width: 160 },
              { title: '状态', dataIndex: 'state', width: 110 },
              { title: 'Phase', dataIndex: 'phase', width: 120 },
              { title: 'Players', dataIndex: 'player_count', width: 100 },
              { title: 'Seats', dataIndex: 'seat_count', width: 90 },
              { title: 'Pot', dataIndex: 'pot', width: 110 },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
              { title: '操作', key: 'action', width: 110, fixed: 'right' },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'state'">
                <Tag :color="tableStateLabel(record.state).color">
                  {{ tableStateLabel(record.state).text }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button
                  size="small"
                  type="link"
                  @click="openTable(record as GameTableApi.TableListItem)"
                >
                  详情
                </Button>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Game Records (audit, by club_id, scope_type='game_table' JOIN) -->
      <TabPane key="audit" tab="游戏记录">
        <Card>
          <div class="mb-2 flex justify-between">
            <Typography.Text type="secondary">
              本俱乐部下所有桌的 audit (来自 game_audit_event JOIN game_table by club_id).
              单局 hand-by-hand 明细请进牌桌详情 Hands tab.
            </Typography.Text>
            <Button :loading="auditLoading" size="small" @click="loadAudit(auditPage.current)">
              刷新
            </Button>
          </div>
          <Table
            :data-source="auditRows"
            :loading="auditLoading"
            :pagination="{
              current: auditPage.current,
              pageSize: auditPage.pageSize,
              total: auditPage.total,
              showSizeChanger: false,
              onChange: (p: number) => loadAudit(p),
            }"
            row-key="id"
            size="small"
            :columns="[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Table', dataIndex: 'scope_id', width: 110 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Event Type', dataIndex: 'event_type', width: 220 },
              { title: 'Payload', dataIndex: 'payload_json', ellipsis: true },
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
            ]"
          />
        </Card>
      </TabPane>

      <!-- Ledger (by club_id) -->
      <TabPane key="ledger" tab="资金流水">
        <Card>
          <div class="mb-2 flex justify-end">
            <Button :loading="ledgerLoading" size="small" @click="loadLedger(ledgerPage.current)">
              刷新
            </Button>
          </div>
          <Table
            :data-source="ledgerRows"
            :loading="ledgerLoading"
            :pagination="{
              current: ledgerPage.current,
              pageSize: ledgerPage.pageSize,
              total: ledgerPage.total,
              showSizeChanger: false,
              onChange: (p: number) => loadLedger(p),
            }"
            row-key="created_at"
            size="small"
            :columns="[
              { title: 'Table', dataIndex: 'table_id', width: 90 },
              { title: 'Round', dataIndex: 'round_id', width: 80 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Currency', dataIndex: 'currency_type', width: 120 },
              { title: 'Amount', dataIndex: 'amount', width: 100 },
              {
                title: 'Direction',
                dataIndex: 'direction',
                width: 100,
                customRender: ({ value }) => directionLabel(Number(value)),
              },
              { title: 'Reason', dataIndex: 'reason', width: 130 },
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
            ]"
          />
        </Card>
      </TabPane>

      <!-- Wallet (P-revenue-runtime: 真实钱包余额) -->
      <TabPane key="wallet" tab="资金池">
        <Alert
          type="success"
          message="P-revenue-runtime: 实时分账钱包"
          description="每一手抽水按 game_revenue_share_rule 实时拆账, 俱乐部份额直接入此钱包. 玩家在本俱乐部内的余额隔离 (不跨 club)."
          show-icon
          class="mb-4"
        />
        <div v-if="clubWallet" class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="俱乐部可用余额">
            <Statistic
              :value="clubWallet.available_balance"
              :value-style="{
                color: clubWallet.available_balance >= 0 ? '#3f8600' : '#cf1322',
              }"
            />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              {{ clubWallet.currency_type }}
            </Typography.Text>
          </Card>
          <Card title="历史累计">
            <Statistic title="抽水入账" :value="clubWallet.total_rake_received" />
            <Statistic
              title="出账"
              :value="clubWallet.total_paid_out"
              class="mt-2"
              :value-style="{ color: '#cf1322' }"
            />
          </Card>
          <Card title="冻结 / 版本">
            <Statistic title="frozen" :value="clubWallet.frozen_balance" />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              version: {{ clubWallet.version }} · 更新:
              {{ clubWallet.updated_at ? formatDateTime(clubWallet.updated_at) : '-' }}
            </Typography.Text>
          </Card>
        </div>
        <Card class="mt-4" title="会员钱包 (本俱乐部隔离)">
          <Alert
            v-if="memberWallets.length === 0 && !walletLoading"
            type="info"
            message="还没有会员钱包记录. settleHand 时会自动创建零余额行 + UPSERT."
            show-icon
            class="mb-2"
          />
          <Table
            :data-source="memberWallets"
            :loading="walletLoading"
            :pagination="{ pageSize: 20 }"
            :row-key="(row: any) => `${row.club_id}-${row.user_id}-${row.currency_type}`"
            size="small"
            :columns="[
              { title: 'User ID', dataIndex: 'user_id', width: 140 },
              { title: 'Currency', dataIndex: 'currency_type', width: 110 },
              { title: '可用余额', dataIndex: 'available_balance', width: 120 },
              { title: '冻结', dataIndex: 'frozen_balance', width: 100 },
              { title: '净盈亏', dataIndex: 'win_loss_total', width: 130 },
              { title: '累计买入', dataIndex: 'buy_in_total', width: 120 },
              { title: '累计兑出', dataIndex: 'cash_out_total', width: 120 },
              {
                title: '更新',
                dataIndex: 'updated_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
              { title: '操作', key: 'wallet_action', width: 160, fixed: 'right' },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'wallet_action'">
                <Space size="small">
                  <Button
                    size="small"
                    type="link"
                    @click="openTopupModal(record.user_id)"
                  >
                    充值
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    @click="openDeductModal(record.user_id)"
                  >
                    扣账
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Revenue (read-only summary) -->
      <TabPane key="revenue" tab="抽水 / 利润">
        <Alert
          type="info"
          message="抽水流水统计 (game_ledger_entry 聚合视角)"
          description="本视图来自 ledger 聚合, 包含历史 rake_take (V009 前) 和 club_share (V009 后实时分账). 当前真实余额请看'资金池' tab."
          show-icon
          class="mb-4"
        />
        <div v-if="revenue" class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="抽水统计">
            <Statistic title="历史累计抽水" :value="revenue.total_rake" />
            <Statistic title="今日抽水 (UTC)" :value="revenue.today_rake" class="mt-2" />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              今日窗口: {{ formatDateTime(revenue.today_start) }} —
              {{ formatDateTime(revenue.today_end) }}
            </Typography.Text>
          </Card>
          <Card title="对局统计">
            <Statistic title="已结账局数" :value="revenue.hand_count" />
            <Statistic
              title="活跃 / 总桌数"
              :value="`${revenue.active_table_count} / ${revenue.total_table_count}`"
              class="mt-2"
            />
          </Card>
          <Card title="出入账总额">
            <Statistic
              title="Debit (玩家出账)"
              :value="revenue.debit_total"
              :value-style="{ color: '#cf1322' }"
            />
            <Statistic
              title="Credit (玩家入账)"
              :value="revenue.credit_total"
              :value-style="{ color: '#3f8600' }"
              class="mt-2"
            />
          </Card>
        </div>
        <Card v-else>
          <Empty v-if="!revenueLoading" description="点击刷新加载抽水统计" />
          <div v-else>加载中…</div>
        </Card>
      </TabPane>

      <!-- 陪玩机器人 (admin 专属；玩家端无感) -->
      <TabPane key="auto_player" tab="陪玩机器人">
        <Alert
          type="info"
          message="陪玩机器人 (auto-player)"
          description="机器人是 normal member + club_member 标记，玩家端完全无感(模拟真人)。批量创建会生成账号+俱乐部成员+钱包初始余额。给房间补位会让机器人入座并自动开局。"
          show-icon
          class="mb-4"
        />
        <Card>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <Button type="primary" @click="batchOpen = true">批量创建机器人</Button>
            <Button :loading="autoPlayersLoading" @click="loadAutoPlayers">刷新</Button>
            <span class="mx-2 text-gray-400">|</span>
            <span class="text-gray-500 text-sm">给房间补位：</span>
            <Select
              v-model:value="fillForm.roomId"
              placeholder="选择房间"
              style="width: 240px"
              :options="clubRooms.map((r) => ({
                value: r.room_id,
                label: `#${r.room_id} ${r.label}（${r.seated_count}/${r.max_seats}）`,
              }))"
              :notFoundContent="clubRooms.length === 0 ? '本俱乐部暂无可用房间' : undefined"
            />
            <Button size="small" @click="loadClubRooms">刷新房间</Button>
            <InputNumber v-model:value="fillForm.count" :min="1" :max="9" style="width: 80px" />
            <Button @click="submitFill">补位并开局</Button>
            <Button danger @click="submitLeave">清空机器人</Button>
          </div>
          <Table
            :data-source="autoPlayers"
            :loading="autoPlayersLoading"
            :pagination="{ pageSize: 50 }"
            row-key="user_id"
            size="small"
            :columns="[
              { title: 'User ID', dataIndex: 'user_id', width: 140 },
              { title: '托管启用', dataIndex: 'auto_play_enabled', width: 90 },
              { title: '风格', dataIndex: 'auto_play_profile', width: 90 },
              { title: '所在房间', dataIndex: 'current_room_id', width: 100 },
              { title: '房间类型', dataIndex: 'current_room_label', width: 160 },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'auto_play_enabled'">
                <Tag :color="record.auto_play_enabled ? 'green' : 'default'">
                  {{ record.auto_play_enabled ? '启用' : '停用' }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'auto_play_profile'">
                {{ record.auto_play_profile ?? 'normal' }}
              </template>
              <template v-else-if="column.dataIndex === 'current_room_id'">
                <Tag v-if="record.current_room_id" color="blue">
                  {{ record.current_room_id }}
                </Tag>
                <span v-else class="text-gray-400">未在桌</span>
              </template>
              <template v-else-if="column.dataIndex === 'current_room_label'">
                {{ record.current_room_label ?? '-' }}
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>
    </Tabs>

    <!-- 批量创建陪玩机器人 modal -->
    <Modal
      v-model:open="batchOpen"
      title="批量创建陪玩机器人"
      width="480"
      :destroy-on-close="true"
      @ok="submitBatchCreate"
    >
      <Alert
        type="warning"
        message="一次最多 20 个。每个机器人 = 平台账号(不可登录) + 俱乐部成员 + 钱包初始余额。"
        show-icon
        class="mb-4"
      />
      <Form :label-col="{ span: 7 }">
        <FormItem label="创建数量" required>
          <InputNumber v-model:value="batchForm.count" :min="1" :max="20" style="width: 100%" />
        </FormItem>
        <FormItem label="初始余额" required>
          <InputNumber v-model:value="batchForm.initialBalance" :min="0" :max="100_000_000" style="width: 100%" />
        </FormItem>
        <FormItem label="立即启用托管">
          <Switch v-model:checked="batchForm.autoPlayEnabled" />
        </FormItem>
      </Form>
    </Modal>

    <!-- OPS-B: 会员充值 / 扣账 modal -->
    <Modal
      v-model:open="adjustOpen"
      :title="adjustMode === 'topup'
        ? `给玩家 #${adjustTargetUserId} 充值`
        : `从玩家 #${adjustTargetUserId} 扣账`"
      width="520"
      :destroy-on-close="true"
      @ok="submitAdjust"
    >
      <Alert
        v-if="adjustMode === 'topup'"
        type="info"
        message="充值 = 给玩家 club_credit available 余额加钱. 不影响俱乐部钱包 (club_credit 是内部记账 token, 不是真钱). 操作留 wallet_ledger 审计."
        show-icon
        class="mb-4"
      />
      <Alert
        v-else
        type="warning"
        message="扣账 = 从玩家 available 直接扣. 校验 available >= amount 不足拒. 操作留 wallet_ledger 审计."
        show-icon
        class="mb-4"
      />
      <Form :label-col="{ span: 6 }">
        <FormItem label="金额" required>
          <InputNumber
            v-model:value="adjustForm.amount"
            :min="1"
            :max="100_000_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="原因" required>
          <Input
            v-model:value="adjustForm.reason"
            placeholder="必填: 活动补偿 / 测试上分 / 风控扣回 等短分类原因"
          />
        </FormItem>
        <FormItem label="备注">
          <Input
            v-model:value="adjustForm.remark"
            placeholder="可选: 工单号 / 操作附言"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 成员资金流水（上分/下分/赢/输 完整日志） -->
    <Modal
      v-model:open="memberLedgerOpen"
      :title="`玩家 #${memberLedgerUserId} 资金流水`"
      width="860"
      :footer="null"
      :destroy-on-close="true"
    >
      <Alert
        type="info"
        message="该玩家在本俱乐部的完整资金流水：上分/下分(人工调账)、入桌冻结、牌局结算(赢/输)、离桌兑出、退款。入账为 +(绿)、出账为 -(红)。"
        show-icon
        class="mb-3"
      />
      <Table
        :data-source="memberLedgerRows"
        :loading="memberLedgerLoading"
        row-key="entry_id"
        size="small"
        :pagination="{
          current: memberLedgerPage.current,
          pageSize: memberLedgerPage.pageSize,
          total: memberLedgerPage.total,
          showSizeChanger: false,
          onChange: (p: number) => loadMemberLedger(p),
        }"
        :columns="[
          {
            title: '时间',
            dataIndex: 'created_at',
            width: 170,
            customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
          },
          { title: '类型', dataIndex: 'source_type', width: 110 },
          { title: '变动', dataIndex: 'amount', width: 130, align: 'right' },
          {
            title: '变动后余额',
            dataIndex: 'balance_after',
            width: 120,
            align: 'right',
            customRender: ({ value }) => Number(value ?? 0).toLocaleString(),
          },
          { title: '原因', dataIndex: 'reason' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'source_type'">
            <Tag>{{ sourceTypeLabel(record.source_type) }}</Tag>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span :style="{ color: record.direction >= 0 ? '#3f8600' : '#cf1322' }">
              {{ record.direction >= 0 ? '+' : '-'
              }}{{ Number(record.amount ?? 0).toLocaleString() }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'reason'">
            {{ record.reason || '-' }}
          </template>
        </template>
      </Table>
    </Modal>

    <!-- Bind agent modal -->
    <Modal
      v-model:open="bindAgentOpen"
      :title="`绑定俱乐部 #${clubId} 到代理`"
      width="560"
      :destroy-on-close="true"
      @ok="submitBindAgent"
    >
      <Alert
        type="warning"
        message="绑定 = 1:1 替换. 该 club 之前如果绑了别的代理, 会被覆盖. 历史 ledger 不动."
        show-icon
        class="mb-4"
      />
      <Form :label-col="{ span: 7 }">
        <FormItem label="Agent ID" required>
          <Space>
            <InputNumber v-model:value="bindForm.agent_id" :min="1" />
            <Button size="small" @click="lookupAgent">查询代理</Button>
          </Space>
        </FormItem>
        <FormItem v-if="bindAgentDetail" label="代理信息">
          <Tag color="blue">{{ bindAgentDetail.display_name }}</Tag>
          <span class="ml-2 text-gray-500 text-xs">
            level={{ bindAgentDetail.level }} status={{ bindAgentDetail.status }}
          </span>
        </FormItem>
      </Form>
    </Modal>

    <!-- 俱乐部设置：club 级 + 牌局配置(牌桌组) -->
    <Modal
      v-model:open="settingsOpen"
      title="俱乐部设置"
      width="860px"
      :footer="null"
      destroy-on-close
    >
      <div v-if="settingsLoading" class="py-8 text-center text-gray-400">
        加载中…
      </div>
      <template v-else>
        <Card size="small" title="基础 / 自动玩家" class="mb-4">
          <Form layout="vertical">
            <div class="grid grid-cols-2 gap-x-6">
              <FormItem label="玩法模式">
                <Select
                  v-model:value="clubSettings.play_mode"
                  :options="[
                    { value: 'standard', label: '标准 STANDARD' },
                    { value: 'crazy', label: '疯狂 CRAZY' },
                  ]"
                />
              </FormItem>
              <FormItem label="自动玩家总上限 (0=不限)">
                <InputNumber
                  v-model:value="clubSettings.auto_player_pool_limit"
                  :min="0"
                  class="w-full"
                />
              </FormItem>
              <FormItem label="启用陪玩">
                <Switch v-model:checked="clubSettings.auto_play_enabled" />
              </FormItem>
              <FormItem label="启用自动编排(开桌/补位)">
                <Switch v-model:checked="clubSettings.orchestrator_enabled" />
              </FormItem>
            </div>
            <Button type="primary" @click="saveClubSettings">保存基础设置</Button>
          </Form>
        </Card>

        <Card size="small" title="牌局配置（牌桌组）">
          <template #extra>
            <Button size="small" type="primary" @click="openTplCreate()">
              + 新增房型
            </Button>
          </template>
          <Empty
            v-if="templates.length === 0"
            description="还没有牌桌组，点「新增房型」创建"
          />
          <div
            v-for="grp in templatesByType"
            :key="grp.gameType"
            class="mb-4"
          >
            <div class="mb-2 font-medium">{{ gameTypeLabel(grp.gameType) }}</div>
            <Table
              :data-source="grp.list"
              :pagination="false"
              row-key="template_id"
              size="small"
              :columns="[
                { title: '房型名', dataIndex: 'name' },
                { title: '盲注', dataIndex: 'blind', width: 90 },
                { title: '桌数 min/max', dataIndex: 'rooms', width: 120 },
                { title: '难度', dataIndex: 'difficulty', width: 100 },
                { title: '操作', dataIndex: 'action', width: 180 },
              ]"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'name'">
                  {{ record.name }}
                  <Tag v-if="!record.enabled" color="default">停用</Tag>
                </template>
                <template v-else-if="column.dataIndex === 'blind'">
                  {{ record.small_blind }}/{{ record.big_blind }}
                </template>
                <template v-else-if="column.dataIndex === 'rooms'">
                  {{ record.min_active_rooms }}/{{ record.max_active_rooms }}
                </template>
                <template v-else-if="column.dataIndex === 'difficulty'">
                  {{ record.auto_play_difficulty }}±{{ record.difficulty_spread }}
                </template>
                <template v-else-if="column.dataIndex === 'action'">
                  <Button
                    type="link"
                    size="small"
                    @click="openTplEdit(record as GameClubApi.RoomTemplate)"
                  >
                    编辑
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    @click="toggleTplEnabled(record as GameClubApi.RoomTemplate)"
                  >
                    {{ record.enabled ? '停用' : '启用' }}
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    @click="removeTpl(record as GameClubApi.RoomTemplate)"
                  >
                    删除
                  </Button>
                </template>
              </template>
            </Table>
          </div>
        </Card>
      </template>
    </Modal>

    <!-- 牌桌组 创建/编辑 -->
    <Modal
      v-model:open="tplModalOpen"
      :title="tplEditingId === null ? '新增房型' : '编辑房型'"
      width="720px"
      ok-text="保存"
      @ok="saveTpl"
    >
      <Form layout="vertical">
        <div class="grid grid-cols-2 gap-x-6">
          <FormItem label="游戏类型">
            <Select
              v-model:value="tplForm.game_type"
              :disabled="tplEditingId !== null"
              :options="[
                { value: 'texas_holdem', label: '德州扑克' },
                { value: 'dou_dizhu', label: '斗地主' },
                { value: 'zha_jin_hua', label: '炸金花' },
                { value: 'niu_niu', label: '牛牛' },
              ]"
            />
          </FormItem>
          <FormItem label="房型名称" required>
            <Input v-model:value="tplForm.name" placeholder="如 德州 1/2 普通桌" />
          </FormItem>
          <FormItem label="小盲">
            <InputNumber v-model:value="tplForm.small_blind" :min="1" class="w-full" />
          </FormItem>
          <FormItem label="大盲">
            <InputNumber v-model:value="tplForm.big_blind" :min="1" class="w-full" />
          </FormItem>
          <FormItem label="最低买入">
            <InputNumber v-model:value="tplForm.buy_in_min" :min="1" class="w-full" />
          </FormItem>
          <FormItem label="最高买入">
            <InputNumber v-model:value="tplForm.buy_in_max" :min="1" class="w-full" />
          </FormItem>
          <FormItem label="座位数">
            <InputNumber v-model:value="tplForm.max_seats" :min="2" :max="9" class="w-full" />
          </FormItem>
          <FormItem label="货币类型">
            <Input v-model:value="tplForm.currency_type" />
          </FormItem>
          <FormItem label="最小牌桌数 (进来至少几桌, 空也算)">
            <InputNumber v-model:value="tplForm.min_active_rooms" :min="0" :max="50" class="w-full" />
          </FormItem>
          <FormItem label="最大牌桌数 (自动扩桌上限)">
            <InputNumber v-model:value="tplForm.max_active_rooms" :min="0" :max="50" class="w-full" />
          </FormItem>
          <FormItem label="扩桌占座率阈值 %">
            <InputNumber
              v-model:value="tplForm.expand_when_occupancy_percent"
              :min="1"
              :max="100"
              class="w-full"
            />
          </FormItem>
          <FormItem label="牌局时长 (分钟, 0=无限; 到时回收关房)">
            <InputNumber
              v-model:value="tplForm.session_duration_minutes"
              :min="0"
              :max="1440"
              class="w-full"
            />
          </FormItem>
          <FormItem label="每桌目标在座">
            <InputNumber v-model:value="tplForm.target_seated_count" :min="0" class="w-full" />
          </FormItem>
          <FormItem label="每桌陪玩上限">
            <InputNumber v-model:value="tplForm.max_auto_players_per_room" :min="0" class="w-full" />
          </FormItem>
          <FormItem label="难度 (0-100)">
            <InputNumber v-model:value="tplForm.auto_play_difficulty" :min="0" :max="100" class="w-full" />
          </FormItem>
          <FormItem label="难度浮动 ±">
            <InputNumber v-model:value="tplForm.difficulty_spread" :min="0" :max="100" class="w-full" />
          </FormItem>
          <FormItem label="玩法模式">
            <Select
              v-model:value="tplForm.play_mode"
              :options="[
                { value: 'standard', label: '标准' },
                { value: 'crazy', label: '疯狂' },
              ]"
            />
          </FormItem>
          <FormItem label="启用">
            <Switch v-model:checked="tplForm.enabled" />
          </FormItem>
          <FormItem label="保险玩法">
            <Switch v-model:checked="tplForm.insurance_enabled" />
          </FormItem>
        </div>
      </Form>
    </Modal>
  </Page>
</template>
