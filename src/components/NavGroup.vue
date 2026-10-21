<template>
  <div class="nav-group">
    <button
      ref="buttonRef"
      class="nav-trigger"
      :class="{ active: isGroupActive, open }"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="toggle"
    >
      {{ label }}
      <span class="caret" :class="{ open }"></span>
    </button>

    <!-- 面板必须 Teleport 到 body：
         窄屏时 .nav 是 overflow-x: auto 的横向滚动容器，
         绝对定位的子元素会被它裁掉，固定定位 + JS 计算坐标才不会被切。 -->
    <Teleport to="body">
      <div v-if="open" class="nav-panel-backdrop" @click="close"></div>
      <div
        v-if="open"
        ref="panelRef"
        class="nav-panel"
        :style="panelStyle"
        role="menu"
        @click="close"
      >
        <RouterLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="panel-link"
          :class="{ active: isItemActive(item) }"
          role="menuitem"
        >
          <span class="panel-label">{{ item.label }}</span>
          <span v-if="item.desc" class="panel-desc">{{ item.desc }}</span>
        </RouterLink>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, required: true },
})

const route = useRoute()
const open = ref(false)
const buttonRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({})

const matches = (item) => route.path === item.path || route.path.startsWith(`${item.path}/`)

// /main-quest/regions 同时满足 /main-quest 与 /main-quest/regions，
// 取匹配到的最长路径作为当前项，否则会同时高亮两个
const activePath = computed(() => {
  const hit = props.items.filter(matches).sort((a, b) => b.path.length - a.path.length)[0]
  return hit ? hit.path : ''
})

const isItemActive = (item) => item.path === activePath.value

const isGroupActive = computed(() => Boolean(activePath.value))

function position() {
  const button = buttonRef.value
  if (!button) return
  const rect = button.getBoundingClientRect()
  const width = Math.min(260, window.innerWidth - 24)
  // 贴住按钮左边缘，但不要超出视口
  const left = Math.min(Math.max(rect.left, 12), window.innerWidth - width - 12)
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
    width: `${width}px`,
  }
}

function toggle() {
  if (open.value) {
    close()
    return
  }
  position()
  open.value = true
}

function close() {
  open.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

// 固定定位的面板不会跟着页面滚动，滚动时直接关掉最省事
function onScroll() {
  if (open.value) close()
}

watch(open, (value) => {
  if (typeof window === 'undefined') return
  if (value) {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
  } else {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', close)
  }
})

// 路由一变就收起面板
watch(() => route.fullPath, close)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', close)
})
</script>

<style scoped>
.nav-group {
  display: inline-flex;
}

.nav-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #b8b2a0;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s;
}

.nav-trigger:hover,
.nav-trigger.open {
  color: #d4af37;
  background: #1f1d16;
}

.nav-trigger.active {
  color: #d4af37;
}

.caret {
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-top: 4px solid currentColor;
  opacity: 0.7;
  transition: transform 0.18s;
}

.caret.open {
  transform: rotate(180deg);
}

.nav-panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
}

.nav-panel {
  position: fixed;
  z-index: 901;
  display: flex;
  flex-direction: column;
  padding: 6px;
  border: 1px solid #3a3324;
  border-radius: 10px;
  background: #1a1915;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}

.panel-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  border-radius: 7px;
  text-decoration: none;
  transition: background 0.16s;
}

.panel-link:hover {
  background: #24211a;
}

.panel-link.active {
  background: #24211a;
}

.panel-link.active .panel-label {
  color: #d4af37;
}

.panel-label {
  font-size: 13.5px;
  color: #e5e3d8;
}

.panel-desc {
  font-size: 11.5px;
  color: #6b6555;
}

@media (max-width: 980px) {
  .nav-trigger {
    padding: 6px 9px;
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>
