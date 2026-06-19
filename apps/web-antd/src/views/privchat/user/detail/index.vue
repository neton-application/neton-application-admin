<script setup lang="ts">
import type { PrivchatUserApi } from '#/api/privchat/user';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Empty,
  message,
  Modal,
  Space,
  Spin,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  bumpSessions,
  getUserDetail,
  getUserDevices,
  getUserFriends,
  getUserJoinedGroups,
  getUserLoginLogs,
  revokeAllDevices,
  revokeDevice,
  suspendUser,
  unsuspendUser,
} from '#/api/privchat/user';
import QuickSendDrawer from '#/views/privchat/systemMessage/modules/QuickSendDrawer.vue';

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const uid = Number(route.query.uid);

const user = ref<PrivchatUserApi.User>();
const loading = ref(false);
const activeTab = ref<string>('profile');

const friends = ref<PrivchatUserApi.Friend[]>([]);
const friendsLoading = ref(false);
const joinedGroups = ref<PrivchatUserApi.JoinedGroup[]>([]);
const joinedGroupsLoading = ref(false);
const devices = ref<PrivchatUserApi.Device[]>([]);
const devicesLoading = ref(false);
const loginLogs = ref<PrivchatUserApi.LoginLog[]>([]);
const loginLogsLoading = ref(false);

// 系统消息快捷发送 drawer
const sysMsgDrawerOpen = ref(false);

async function loadUser() {
  if (!uid || Number.isNaN(uid)) {
    message.error('参数错误：缺少 uid');
    await closeCurrentTab();
    return;
  }
  loading.value = true;
  try {
    user.value = await getUserDetail(uid);
  } finally {
    loading.value = false;
  }
}

async function loadFriends() {
  friendsLoading.value = true;
  try {
    const res = await getUserFriends(uid);
    friends.value = res.friends ?? [];
  } finally {
    friendsLoading.value = false;
  }
}

async function loadJoinedGroups() {
  joinedGroupsLoading.value = true;
  try {
    const res = await getUserJoinedGroups(uid);
    joinedGroups.value = res.groups ?? [];
  } finally {
    joinedGroupsLoading.value = false;
  }
}

async function loadDevices() {
  devicesLoading.value = true;
  try {
    const res = await getUserDevices(uid);
    devices.value = res.devices ?? [];
  } finally {
    devicesLoading.value = false;
  }
}

async function loadLoginLogs() {
  loginLogsLoading.value = true;
  try {
    const res = await getUserLoginLogs(uid, { pageNo: 1, pageSize: 50 });
    loginLogs.value = res.list;
  } finally {
    loginLogsLoading.value = false;
  }
}

function handleTabChange(key: number | string) {
  activeTab.value = String(key);
  switch (key) {
    case 'devices': {
      if (devices.value.length === 0) loadDevices();
      break;
    }
    case 'friends': {
      if (friends.value.length === 0) loadFriends();
      break;
    }
    case 'groups': {
      if (joinedGroups.value.length === 0) loadJoinedGroups();
      break;
    }
    case 'login-logs': {
      if (loginLogs.value.length === 0) loadLoginLogs();
      break;
    }
  }
}

function handleViewChatHistory(friend: PrivchatUserApi.Friend) {
  router.push({
    name: 'PrivchatConversation',
    query: { uid, peerUid: friend.user_id },
  });
}

function handleViewFriend(friendUid: number) {
  router.push({ name: 'PrivchatUserDetail', query: { uid: friendUid } });
}

function friendDisplayName(f: PrivchatUserApi.Friend): string {
  return f.display_name ?? f.username ?? `uid:${f.user_id}`;
}

// ─── 操作按钮 ───
function handleSuspend() {
  Modal.confirm({
    title: '封禁用户',
    content: `确定要封禁用户 ${user.value?.username ?? uid} 吗？封禁后该用户的所有设备会被踢下线。`,
    onOk: async () => {
      await suspendUser(uid, { reason: 'admin manual' });
      message.success('已封禁');
      await loadUser();
    },
  });
}

function handleUnsuspend() {
  Modal.confirm({
    title: '解封用户',
    content: `确定要解封用户 ${user.value?.username ?? uid} 吗？`,
    onOk: async () => {
      await unsuspendUser(uid);
      message.success('已解封');
      await loadUser();
    },
  });
}

function handleRevokeAll() {
  Modal.confirm({
    title: '强制下线全部设备',
    content: '该操作会让用户所有设备的 IM token 立即失效，需重新登录。',
    onOk: async () => {
      await revokeAllDevices(uid, { reason: 'admin manual' });
      message.success('已下线全部设备');
      await loadDevices();
    },
  });
}

function handleRevokeDevice(deviceId: string) {
  Modal.confirm({
    title: '强制下线设备',
    content: `确定要踢出设备 ${deviceId} 吗？`,
    onOk: async () => {
      await revokeDevice(uid, deviceId, { reason: 'admin manual' });
      message.success('设备已下线');
      await loadDevices();
    },
  });
}

function handleBump() {
  Modal.confirm({
    title: 'Bump session',
    content:
      'session_version + 1，旧 IM token 立即失效但 session_state 不变；客户端应通过 refresh 流程恢复。',
    onOk: async () => {
      await bumpSessions(uid, { reason: 'admin manual' });
      message.success('已 bump session');
    },
  });
}

function handleViewGroup(groupId: number) {
  router.push({ name: 'PrivchatGroupDetail', query: { groupId } });
}

function statusColor(status?: string): string {
  switch (status) {
    case 'Active': {
      return 'green';
    }
    case 'Suspended': {
      return 'red';
    }
    case 'Deleted': {
      return 'default';
    }
    default: {
      return 'orange';
    }
  }
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

onMounted(async () => {
  await loadUser();
});
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <Card v-if="user" class="mb-4" title="基本信息">
        <template #extra>
          <Space>
            <Button type="primary" @click="sysMsgDrawerOpen = true">
              发系统消息
            </Button>
            <Button
              v-if="user.status !== 'Suspended'"
              danger
              @click="handleSuspend"
            >
              封号
            </Button>
            <Button
              v-if="user.status === 'Suspended'"
              type="primary"
              @click="handleUnsuspend"
            >
              解封
            </Button>
            <Button @click="handleRevokeAll">踢全部设备</Button>
            <Button @click="handleBump">Bump session</Button>
          </Space>
        </template>
        <Descriptions :column="3" size="small">
          <DescriptionsItem label="用户 ID">
            {{ user.user_id }}
          </DescriptionsItem>
          <DescriptionsItem label="用户名">
            {{ user.username ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="昵称">
            {{ user.display_name ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="手机号">
            {{ user.phone ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="邮箱">
            {{ user.email ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="statusColor(user.status)">
              {{ user.status ?? '-' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{ formatTime(user.created_at) }}
          </DescriptionsItem>
          <DescriptionsItem label="更新时间">
            {{ formatTime(user.updated_at) }}
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <Card>
        <Tabs :active-key="activeTab" @change="handleTabChange">
          <TabPane key="profile" tab="基础资料">
            <Descriptions v-if="user" :column="2" size="small">
              <DescriptionsItem label="头像 URL">
                {{ user.avatar_url ?? '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="user_type">
                {{ user.user_type }}
              </DescriptionsItem>
              <DescriptionsItem label="business_system_id">
                {{ user.business_system_id ?? '-' }}
              </DescriptionsItem>
            </Descriptions>
          </TabPane>

          <TabPane key="friends" tab="好友列表">
            <Spin :spinning="friendsLoading">
              <Empty v-if="friends.length === 0" description="暂无好友" />
              <Table
                v-else
                :columns="[
                  { title: '昵称', key: 'name', width: 220 },
                  { title: 'uid', dataIndex: 'user_id', width: 140 },
                  { title: '用户名', dataIndex: 'username', width: 160 },
                  { title: '操作', key: 'actions' },
                ]"
                :data-source="friends"
                :pagination="false"
                row-key="user_id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                    <Button
                      size="small"
                      type="link"
                      @click="handleViewFriend(record.user_id)"
                    >
                      {{ friendDisplayName(record as PrivchatUserApi.Friend) }}
                    </Button>
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <Button
                      size="small"
                      type="link"
                      @click="handleViewChatHistory(record as PrivchatUserApi.Friend)"
                    >
                      查看聊天记录
                    </Button>
                  </template>
                </template>
              </Table>
            </Spin>
          </TabPane>

          <TabPane key="groups" tab="加入的群">
            <Spin :spinning="joinedGroupsLoading">
              <Empty
                v-if="joinedGroups.length === 0"
                description="未加入任何群"
              />
              <Table
                v-else
                :columns="[
                  { title: 'group_id', dataIndex: 'group_id' },
                  { title: '群名', dataIndex: 'name' },
                  { title: '角色', dataIndex: 'role' },
                  { title: '群昵称', dataIndex: 'nickname' },
                  { title: '成员数', dataIndex: 'member_count' },
                  { title: '操作', key: 'actions' },
                ]"
                :data-source="joinedGroups"
                :pagination="false"
                row-key="group_id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'actions'">
                    <Button
                      size="small"
                      type="link"
                      @click="handleViewGroup(record.group_id)"
                    >
                      查看群详情
                    </Button>
                  </template>
                </template>
              </Table>
            </Spin>
          </TabPane>

          <TabPane key="devices" tab="在线设备">
            <Spin :spinning="devicesLoading">
              <Empty v-if="devices.length === 0" description="暂无设备" />
              <Table
                v-else
                :columns="[
                  { title: '设备 ID', dataIndex: 'device_id' },
                  { title: '类型', dataIndex: 'device_type' },
                  { title: '名称', dataIndex: 'device_name' },
                  { title: 'IP', dataIndex: 'ip_address' },
                  { title: '最后活跃', key: 'last_active_at' },
                  { title: '操作', key: 'actions' },
                ]"
                :data-source="devices"
                :pagination="false"
                row-key="device_id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'last_active_at'">
                    {{ formatTime(record.last_active_at) }}
                  </template>
                  <template v-if="column.key === 'actions'">
                    <Button
                      danger
                      size="small"
                      type="link"
                      @click="handleRevokeDevice(record.device_id)"
                    >
                      踢下线
                    </Button>
                  </template>
                </template>
              </Table>
            </Spin>
          </TabPane>

          <TabPane key="login-logs" tab="登录日志">
            <Spin :spinning="loginLogsLoading">
              <Empty v-if="loginLogs.length === 0" description="暂无登录日志" />
              <Table
                v-else
                :columns="[
                  { title: 'log_id', dataIndex: 'log_id' },
                  { title: '设备', dataIndex: 'device_type' },
                  { title: 'IP', dataIndex: 'ip_address' },
                  { title: '风险分', dataIndex: 'risk_score' },
                  { title: '新设备', dataIndex: 'is_new_device' },
                  { title: '时间', key: 'created_at' },
                ]"
                :data-source="loginLogs"
                :pagination="{ pageSize: 20 }"
                row-key="log_id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'created_at'">
                    {{ formatTime(record.created_at) }}
                  </template>
                </template>
              </Table>
            </Spin>
          </TabPane>
        </Tabs>
      </Card>
    </Spin>

    <QuickSendDrawer
      v-if="user"
      v-model:open="sysMsgDrawerOpen"
      :target-id="user.user_id"
      :target-label="user.display_name ?? user.username ?? `uid:${user.user_id}`"
      target-type="users"
    />
  </Page>
</template>
