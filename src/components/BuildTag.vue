<template>
  <span class="build-tag" :title="APP_TITLE">{{ APP_LABEL }}</span>
</template>

<script setup>
import { APP_LABEL, APP_TITLE } from '../utils/version.js'
</script>

<style scoped>
.build-tag {
  display: inline-block;
  padding: 2px 9px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  line-height: 1.7;
  color: #6b6555;
  background: #171717;
  border: 1px solid #332d20;
  border-radius: 999px;
  cursor: default;
  transition: color 0.18s, border-color 0.18s;
}

.build-tag:hover {
  color: #b99a4e;
  border-color: #6b5c2e;
}
</style>
