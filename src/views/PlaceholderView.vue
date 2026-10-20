<template>
  <div class="placeholder">
    <el-icon :size="64" color="#d4af37"><Compass /></el-icon>
    <h1>{{ title }}板块</h1>
    <p>该板块正在建设之中，敬请期待……</p>
    <el-button type="primary" plain @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup>
defineProps({
  title: String,
})
</script>

<style scoped>
.placeholder {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

h1 {
  margin: 0;
  color: #d4af37;
}

p {
  color: #8a8574;
  margin: 0 0 8px;
}
</style>
