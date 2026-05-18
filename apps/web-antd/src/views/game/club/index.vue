<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Alert, Card, Typography } from 'ant-design-vue';
</script>

<template>
  <Page auto-content-height>
    <Card title="俱乐部管理">
      <Alert
        type="info"
        message="占位页 — P-club-adm 待落地"
        description="后端 admin Club controller 还未实现。当前 /app/club/* 是 owner-self 视角 (创建 / 加入 / 离开 / dissolve owner-only)。 admin 强 dissolve / 转让 owner / 踢人 / 列所有 club 等能力还未做。"
        show-icon
      />
      <div class="mt-4">
        <Typography.Title :level="5">已规划的 admin 端能力 (P-club-adm)</Typography.Title>
        <Typography.Paragraph>
          <ul class="list-disc pl-6">
            <li>列出全部 club (含 DISSOLVED) + filter (owner_user_id / status)</li>
            <li>club 详情: 成员 / 邀请 / 活跃桌</li>
            <li>admin force-dissolve (绕 owner-only)</li>
            <li>转让 owner / role 升降</li>
            <li>踢人 (admin 强 leave)</li>
            <li>邀请 sweeper (清理过期 PENDING)</li>
          </ul>
        </Typography.Paragraph>
        <Typography.Paragraph>
          相关 spec: <Typography.Text code>GAME_V1_RELEASE_PROVING.md §6 P-club-adm</Typography.Text>.
        </Typography.Paragraph>
      </div>
    </Card>
  </Page>
</template>
