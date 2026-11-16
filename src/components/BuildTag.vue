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
  color: var(--fg-4);
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
  border-radius: 999px;
  cursor: default;
  transition: color 0.18s, border-color 0.18s;
}

.build-tag:hover {
  color: color-mix(in srgb, #b99a4e var(--tone-mix), var(--fg));
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
</style>
