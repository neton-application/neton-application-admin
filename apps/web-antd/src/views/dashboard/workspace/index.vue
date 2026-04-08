<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();

// 这是一个示例数据，实际项目中需要根据实际情况进行调整
// url 也可以是内部路由，在 navTo 方法中识别处理，进行内部跳转
// 例如：url: /dashboard/workspace
const projectItems: WorkbenchProjectItem[] = [
  {
    color: '#6DB33F',
    content: 'Neton Application - 基于 Neton Framework 的后台管理系统',
    date: '2025-01-02',
    group: 'Kotlin/Native 后端 + Vue3 管理端',
    icon: 'simple-icons:kotlin',
    title: 'Neton Application',
    url: 'https://github.com/netoncode/neton-application',
  },
  {
    color: '#e18525',
    content: 'github.com/netoncode/neton-ui-admin-vben',
    date: '2025-05-06',
    group: 'Vue3 + vben5(antd) 管理后台',
    icon: 'devicon:antdesign',
    title: 'neton-ui-admin-vben',
    url: 'https://github.com/netoncode/neton-ui-admin-vben',
  },
  {
    color: '#2f54eb',
    content: 'github.com/netoncode/neton',
    date: '2025-03-14',
    group: 'Kotlin/Native Web Framework',
    icon: 'simple-icons:kotlin',
    title: 'Neton Framework',
    url: 'https://github.com/netoncode/neton',
  },
  {
    color: '#13c2c2',
    content: '会员、支付、开放平台等独立业务模块仓库',
    date: '2025-06-01',
    group: 'Composite Build 模块化扩展',
    icon: 'lucide:blocks',
    title: 'Neton Application Modules',
    url: 'https://github.com/netoncode',
  },
];

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: '首页',
    url: '/',
  },
  {
    color: '#1677ff',
    icon: 'lucide:users',
    title: '用户管理',
    url: '/system/user',
  },
  {
    color: '#13c2c2',
    icon: 'lucide:settings-2',
    title: '系统配置',
    url: '/infra/config',
  },
  {
    color: '#722ed1',
    icon: 'lucide:badge-dollar-sign',
    title: '支付应用',
    url: '/pay/app',
  },
  {
    color: '#52c41a',
    icon: 'lucide:user-round-cog',
    title: '会员管理',
    url: '/member/user',
  },
  {
    color: '#fa8c16',
    icon: 'lucide:shield-check',
    title: '角色权限',
    url: '/system/role',
  },
];

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: '继续收敛 neton-application 的字段、接口和脚手架硬规范',
    date: '2026-03-31 09:30:00',
    title: '工程规范',
  },
  {
    completed: false,
    content: '清理 admin 里与当前后端无关的 mall、demo、platform 模板残留',
    date: '2026-03-31 10:00:00',
    title: '前端瘦身',
  },
  {
    completed: false,
    content: '把主键 CRUD、0/1 字段、DTO 写接口这些规则固化成测试',
    date: '2026-03-31 11:00:00',
    title: '规范测试',
  },
  {
    completed: false,
    content: '修复 module-system 的 KSP 生成链路，恢复完整编译验证',
    date: '2026-03-31 14:00:00',
    title: '构建健康',
  },
]);
const trendItems: WorkbenchTrendItem[] = [
  {
    avatar: 'svg:avatar-1',
    content: `完成了 <a>MemberConfig</a> 的单例资源化整改`,
    date: '刚刚',
    title: 'Neton Team',
  },
  {
    avatar: 'svg:avatar-2',
    content: `将 <a>PayApp.update-status</a> 调整为主键路径接口`,
    date: '1个小时前',
    title: 'Neton Team',
  },
  {
    avatar: 'svg:avatar-3',
    content: `收敛了 <a>PayWallet</a> 和 <a>PayChannel</a> 的业务键查询命名`,
    date: '2个小时前',
    title: 'Neton Team',
  },
  {
    avatar: 'svg:avatar-4',
    content: `新增了 <a>neton-application 开发硬规范 v1</a>`,
    date: '今天',
    title: 'Neton Team',
  },
];

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        早安, {{ userStore.userInfo?.nickname }}, 开始您一天的工作吧！
      </template>
      <template #description> 今日晴，20℃ - 32℃！ </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject :items="projectItems" title="项目" @click="navTo" />
        <WorkbenchTrends :items="trendItems" class="mt-5" title="最新动态" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷导航"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" title="待办事项" />
        <AnalysisChartCard class="mt-5" title="访问来源">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
