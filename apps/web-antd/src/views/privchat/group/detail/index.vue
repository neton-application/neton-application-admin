<script setup lang="ts">
import type { PrivchatGroupApi } from '#/api/privchat/group';

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
} from 'ant-design-vue';

import {
  dissolveGroup,
  getGroupDetail,
  removeGroupMember,
  setGroupMemberRole,
} from '#/api/privchat/group';
import QuickSendDrawer from '#/views/privchat/systemMessage/modules/QuickSendDrawer.vue';

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const groupId = Number(route.query.groupId);

const group = ref<PrivchatGroupApi.GroupDetail>();
const loading = ref(false);

// 系统消息快捷发送 drawer
const sysMsgDrawerOpen = ref(false);

async function loadGroup() {
  if (!groupId || Number.isNaN(groupId)) {
    message.error('参数错误：缺少 groupId');
    await closeCurrentTab();
    return;
  }
  loading.value = true;
  try {
    group.value = await getGroupDetail(groupId);
  } finally {
    loading.value = false;
  }
}

function handleDissolve() {
  Modal.confirm({
    title: '解散群组',
    content: `确定解散「${group.value?.name ?? groupId}」吗？该操作不可逆。`,
    okText: '确认解散',
    okType: 'danger',
    onOk: async () => {
      await dissolveGroup(groupId);
      message.success('已解散');
      await closeCurrentTab();
    },
  });
}

function handleViewMember(uid: number) {
  router.push({ name: 'PrivchatUserDetail', query: { uid } });
}

function handleViewGroupMessages() {
  router.push({ name: 'PrivchatConversation', query: { groupId } });
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

function memberDisplayName(m: PrivchatGroupApi.Member): string {
  return m.display_name ?? m.username ?? `uid:${m.user_id}`;
}

function ownerDisplayName(g: PrivchatGroupApi.GroupDetail): string {
  return (
    g.owner_display_name ??
    g.owner_username ??
    (g.owner_id != null ? `uid:${g.owner_id}` : '-')
  );
}

function isOwner(m: PrivchatGroupApi.Member): boolean {
  return m.role === 'owner';
}

function handleRemoveMember(m: PrivchatGroupApi.Member) {
  Modal.confirm({
    title: '移除成员',
    content: `确定将 ${memberDisplayName(m)} 移出本群吗？`,
    okText: '移除',
    okType: 'danger',
    onOk: async () => {
      await removeGroupMember(groupId, m.user_id);
      message.success('已移除');
      await loadGroup();
    },
  });
}

function handleSetMemberRole(
  m: PrivchatGroupApi.Member,
  next: 'admin' | 'member',
) {
  if (m.role === next) {
    message.info(`已经是${next === 'admin' ? '管理员' : '普通成员'}`);
    return;
  }
  Modal.confirm({
    title: next === 'admin' ? '设为管理员' : '降为普通成员',
    content: `确定将 ${memberDisplayName(m)} 设为${next === 'admin' ? '管理员' : '普通成员'}吗？`,
    onOk: async () => {
      await setGroupMemberRole(groupId, m.user_id, next);
      message.success('角色已更新');
      await loadGroup();
    },
  });
}

onMounted(async () => {
  await loadGroup();
});
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <Card v-if="group" class="mb-4" title="群信息">
        <template #extra>
          <Space>
            <Button type="primary" @click="sysMsgDrawerOpen = true">
              发系统消息
            </Button>
            <Button @click="handleViewGroupMessages">查看群消息</Button>
            <Button danger @click="handleDissolve">解散群</Button>
          </Space>
        </template>
        <Descriptions :column="3" size="small">
          <DescriptionsItem label="群 ID">
            {{ group.group_id }}
          </DescriptionsItem>
          <DescriptionsItem label="频道 ID">
            {{ group.channel_id }}
          </DescriptionsItem>
          <DescriptionsItem label="群名">
            {{ group.name ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem :span="3" label="描述">
            {{ group.description ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="群主">
            <Button
              v-if="group.owner_id"
              size="small"
              type="link"
              @click="handleViewMember(group.owner_id)"
            >
              {{ ownerDisplayName(group) }}
              <span class="ml-1 text-gray-400">(uid:{{ group.owner_id }})</span>
            </Button>
            <span v-else>-</span>
          </DescriptionsItem>
          <DescriptionsItem label="成员数">
            {{ group.member_count }}
          </DescriptionsItem>
          <DescriptionsItem label="消息数">
            {{ group.message_count }}
          </DescriptionsItem>
          <DescriptionsItem label="最后消息时间">
            {{ formatTime(group.last_message_at) }}
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{ formatTime(group.created_at) }}
          </DescriptionsItem>
          <DescriptionsItem label="更新时间">
            {{ formatTime(group.updated_at) }}
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <Card
        v-if="group"
        :title="`成员列表 (${group.member_count})`"
      >
        <Empty
          v-if="!group.members || group.members.length === 0"
          description="暂无成员"
        />
        <Table
          v-else
          :columns="[
            { title: '昵称', key: 'name', width: 220 },
            { title: 'uid', dataIndex: 'user_id', width: 140 },
            { title: '群昵称', dataIndex: 'nickname', width: 140 },
            { title: '角色', dataIndex: 'role', width: 100 },
            { title: '加入时间', key: 'joined_at', width: 170 },
            { title: '操作', key: 'actions', width: 320 },
          ]"
          :data-source="group.members"
          :pagination="{ pageSize: 50 }"
          row-key="user_id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <Button
                size="small"
                type="link"
                @click="handleViewMember(record.user_id)"
              >
                {{ memberDisplayName(record as PrivchatGroupApi.Member) }}
              </Button>
            </template>
            <template v-else-if="column.key === 'joined_at'">
              {{ formatTime(record.joined_at) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space :size="0" wrap>
                <Button
                  size="small"
                  type="link"
                  @click="handleViewMember(record.user_id)"
                >
                  查看
                </Button>
                <template v-if="!isOwner(record as PrivchatGroupApi.Member)">
                  <Button
                    v-if="record.role !== 'admin'"
                    size="small"
                    type="link"
                    @click="handleSetMemberRole(record as PrivchatGroupApi.Member, 'admin')"
                  >
                    设为管理员
                  </Button>
                  <Button
                    v-if="record.role === 'admin'"
                    size="small"
                    type="link"
                    @click="handleSetMemberRole(record as PrivchatGroupApi.Member, 'member')"
                  >
                    降为成员
                  </Button>
                  <Button
                    danger
                    size="small"
                    type="link"
                    @click="handleRemoveMember(record as PrivchatGroupApi.Member)"
                  >
                    移除
                  </Button>
                </template>
              </Space>
            </template>
          </template>
        </Table>
      </Card>
    </Spin>

    <QuickSendDrawer
      v-if="group"
      v-model:open="sysMsgDrawerOpen"
      :target-id="group.group_id"
      :target-label="group.name ?? `group:${group.group_id}`"
      target-type="groups"
    />
  </Page>
</template>
