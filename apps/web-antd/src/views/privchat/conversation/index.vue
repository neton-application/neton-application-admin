<script setup lang="ts">
import type { PrivchatGroupApi } from '#/api/privchat/group';
import type { PrivchatUserApi } from '#/api/privchat/user';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  Button,
  Card,
  Empty,
  Image as AImage,
  Input,
  message,
  Space,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getGroupDetail,
  getGroupMessages,
} from '#/api/privchat/group';
import {
  getConversationMessages,
  getUserDetail,
} from '#/api/privchat/user';

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

// 模式判定：query 里有 groupId 就是群聊；有 uid+peerUid 就是私聊。
const groupId = route.query.groupId
  ? Number(route.query.groupId)
  : undefined;
const uid = route.query.uid ? Number(route.query.uid) : undefined;
const peerUid = route.query.peerUid ? Number(route.query.peerUid) : undefined;
const mode: 'direct' | 'group' | 'invalid' = (() => {
  if (groupId && !Number.isNaN(groupId)) return 'group';
  if (uid && peerUid && !Number.isNaN(uid) && !Number.isNaN(peerUid))
    return 'direct';
  return 'invalid';
})();

const self = ref<PrivchatUserApi.User>();
const peer = ref<PrivchatUserApi.User>();
const group = ref<PrivchatGroupApi.GroupDetail>();

const messages = ref<PrivchatUserApi.Message[]>([]);
const loading = ref(false);
const errorMsg = ref<string>();
const keyword = ref('');

const filteredMessages = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return messages.value;
  return messages.value.filter((m) =>
    (m.content ?? '').toLowerCase().includes(kw.toLowerCase()),
  );
});

const headerTitle = computed(() => {
  if (mode === 'group') {
    return `${group.value?.name ?? '群'} (gid:${groupId}) 的群消息`;
  }
  if (mode === 'direct') {
    const a = self.value?.username ?? `uid:${uid}`;
    const b = peer.value?.username ?? `uid:${peerUid}`;
    return `${a} ⇄ ${b} 的聊天记录`;
  }
  return '聊天记录';
});

// 群聊：sender_id → 显示昵称。优先级：群内 nickname > 全局 display_name > username。
const groupSenderNameMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const m of group.value?.members ?? []) {
    if (m.user_id == null) continue;
    const name = m.nickname ?? m.display_name ?? m.username;
    if (name) map[m.user_id] = name;
  }
  return map;
});

async function loadAll() {
  if (mode === 'invalid') {
    message.error('参数错误：缺少 groupId 或 (uid, peerUid)');
    await closeCurrentTab();
    return;
  }
  loading.value = true;
  errorMsg.value = undefined;
  try {
    if (mode === 'group') {
      const [g, m] = await Promise.allSettled([
        getGroupDetail(groupId!),
        getGroupMessages(groupId!, { pageNo: 1, pageSize: 200 }),
      ]);
      if (g.status === 'fulfilled') group.value = g.value;
      if (m.status === 'fulfilled') {
        messages.value = m.value.list;
      } else {
        errorMsg.value =
          (m.reason as any)?.response?.data?.message ??
          (m.reason as any)?.message ??
          '加载群消息失败';
      }
    } else {
      const [s, p, m] = await Promise.allSettled([
        getUserDetail(uid!),
        getUserDetail(peerUid!),
        getConversationMessages(uid!, peerUid!, { pageNo: 1, pageSize: 200 }),
      ]);
      if (s.status === 'fulfilled') self.value = s.value;
      if (p.status === 'fulfilled') peer.value = p.value;
      if (m.status === 'fulfilled') {
        messages.value = m.value.list;
      } else {
        errorMsg.value =
          (m.reason as any)?.response?.data?.message ??
          (m.reason as any)?.message ??
          '加载聊天记录失败';
      }
    }
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  if (mode === 'group') {
    router.push({ name: 'PrivchatGroupDetail', query: { groupId } });
  } else if (mode === 'direct') {
    router.push({ name: 'PrivchatUserDetail', query: { uid } });
  }
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

function senderName(senderId: number): string {
  if (mode === 'direct') {
    if (senderId === uid) {
      return (
        self.value?.display_name ??
        self.value?.username ??
        `uid:${senderId}`
      );
    }
    if (senderId === peerUid) {
      return (
        peer.value?.display_name ??
        peer.value?.username ??
        `uid:${senderId}`
      );
    }
    return `uid:${senderId}`;
  }
  return groupSenderNameMap.value[senderId] ?? `uid:${senderId}`;
}

function senderColor(senderId: number): string | undefined {
  if (mode === 'direct' && senderId === uid) {
    return 'var(--ant-color-primary)';
  }
  if (mode === 'group' && senderId === group.value?.owner_id) {
    return 'var(--ant-color-warning)';
  }
  return undefined;
}

function imageUrlOf(m: PrivchatUserApi.Message): string | null {
  const meta = m.metadata as Record<string, unknown> | null | undefined;
  if (meta) {
    const candidates = ['url', 'image_url', 'thumbnail_url', 'src'];
    for (const k of candidates) {
      const v = meta[k];
      if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v;
    }
  }
  if (typeof m.content === 'string' && /^https?:\/\//i.test(m.content)) {
    return m.content;
  }
  return null;
}

function videoUrlOf(m: PrivchatUserApi.Message): string | null {
  const meta = m.metadata as Record<string, unknown> | null | undefined;
  if (meta) {
    const candidates = ['url', 'video_url', 'src'];
    for (const k of candidates) {
      const v = meta[k];
      if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v;
    }
  }
  if (typeof m.content === 'string' && /^https?:\/\//i.test(m.content)) {
    return m.content;
  }
  return null;
}

function fileUrlOf(m: PrivchatUserApi.Message): string | null {
  const meta = m.metadata as Record<string, unknown> | null | undefined;
  if (meta) {
    const v = meta['url'] ?? meta['file_url'] ?? meta['src'];
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v;
  }
  if (typeof m.content === 'string' && /^https?:\/\//i.test(m.content)) {
    return m.content;
  }
  return null;
}

onMounted(async () => {
  await loadAll();
});
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <Card class="mb-4">
        <template #title>
          <Space>
            <Button @click="handleBack">
              ← 返回{{ mode === 'group' ? '群详情' : '用户详情' }}
            </Button>
            <span class="text-base">{{ headerTitle }}</span>
          </Space>
        </template>
        <Space :size="12" wrap>
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="按消息内容关键字筛选"
            style="width: 280px"
          />
          <span class="text-gray-500">
            共 {{ messages.length }} 条
            <template v-if="keyword">
              · 匹配 {{ filteredMessages.length }} 条
            </template>
          </span>
        </Space>
      </Card>

      <Card>
        <Empty v-if="errorMsg" :description="errorMsg" />
        <Empty
          v-else-if="!loading && messages.length === 0"
          description="暂无消息"
        />
        <Table
          v-else
          :columns="[
            { title: 'message_id', dataIndex: 'message_id', width: 180 },
            { title: '发送方', key: 'sender', width: 140 },
            { title: '类型', dataIndex: 'message_type', width: 80 },
            { title: '内容', key: 'content' },
            { title: '时间', key: 'created_at', width: 170 },
            { title: '状态', key: 'state', width: 100 },
          ]"
          :data-source="filteredMessages"
          :pagination="{ pageSize: 50, showSizeChanger: true }"
          row-key="message_id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sender'">
              <span :style="{ color: senderColor(record.sender_id) }">
                {{ senderName(record.sender_id) }}
              </span>
            </template>

            <template v-else-if="column.key === 'content'">
              <template v-if="record.message_type === 'image'">
                <AImage
                  v-if="imageUrlOf(record as PrivchatUserApi.Message)"
                  :src="imageUrlOf(record as PrivchatUserApi.Message) ?? ''"
                  :width="120"
                  :preview="true"
                />
                <span v-else class="text-gray-400">[图片] {{ record.content }}</span>
              </template>

              <template v-else-if="record.message_type === 'video'">
                <video
                  v-if="videoUrlOf(record as PrivchatUserApi.Message)"
                  :src="videoUrlOf(record as PrivchatUserApi.Message) ?? ''"
                  controls
                  preload="metadata"
                  style="max-width: 240px; max-height: 160px"
                ></video>
                <span v-else class="text-gray-400">[视频] {{ record.content }}</span>
              </template>

              <template v-else-if="record.message_type === 'file'">
                <a
                  v-if="fileUrlOf(record as PrivchatUserApi.Message)"
                  :href="fileUrlOf(record as PrivchatUserApi.Message) ?? ''"
                  rel="noopener"
                  target="_blank"
                >
                  下载文件
                </a>
                <span v-else class="text-gray-400">[文件] {{ record.content }}</span>
              </template>

              <template v-else>
                <span class="whitespace-pre-wrap break-all">
                  {{ record.content }}
                </span>
              </template>
            </template>

            <template v-else-if="column.key === 'created_at'">
              {{ formatTime(record.created_at) }}
            </template>

            <template v-else-if="column.key === 'state'">
              <Tag v-if="record.revoked" color="red">已撤回</Tag>
              <Tag v-else-if="record.deleted" color="default">已删除</Tag>
              <Tag v-else color="green">正常</Tag>
            </template>
          </template>
        </Table>
      </Card>
    </Spin>
  </Page>
</template>
