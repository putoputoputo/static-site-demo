<template>
  <div class="place-picker" :class="{ open }">
    <input
      ref="inputEl"
      class="field-input"
      type="text"
      :value="query"
      :placeholder="placeholder"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="commitActive"
      @keydown.esc="close"
      @blur="onBlur"
    />

    <div v-if="open" class="picker-panel">
      <template v-if="grouped.length">
        <div v-for="group in grouped" :key="group.id" class="picker-group">
          <div class="picker-group-label">
            {{ group.label }}
            <span v-if="group.id === 'amap' && loading" class="picker-loading">搜索中…</span>
          </div>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="picker-item"
            :class="{ on: item.id === activeId, picked: modelValue && item.id === modelValue.id }"
            @mousedown.prevent="pick(item)"
          >
            <span class="picker-name">{{ item.name }}</span>
            <em class="picker-hint">{{ item.hint }}</em>
          </button>
        </div>
      </template>
      <div v-else class="picker-empty">
        <strong>{{ query.trim().length >= 2 && loading ? '正在搜高德…' : '没有匹配的地点' }}</strong>
        <span v-if="error">{{ error }}</span>
        <span v-else>本地库有 17 个景点和 9 个交通枢纽；输入两个字以上会同时搜高德，任意地点都能选。</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { placeGroups, searchPlaces } from '../../data/travel/places.js'
import { searchAmapPlaces } from '../../utils/amap.js'
import { gcj02ToWgs84 } from '../../utils/geo.js'

const props = defineProps({
  // v-model 绑定的是整个地点对象：{ id, name, lat, lng, gcj? }
  modelValue: { type: Object, default: null },
  placeholder: { type: String, default: '输入地名搜，或点开选' },
})
const emit = defineEmits(['update:modelValue'])

const inputEl = ref(null)
const open = ref(false)
const query = ref('')
const activeId = ref('')
const remoteItems = ref([])
const loading = ref(false)
const error = ref('')
let timer = null
let seq = 0

// 外部换了选中值（点「对调起终点」、或从 URL 恢复），输入框文字跟着走
watch(
  () => props.modelValue,
  (place) => {
    if (place) query.value = place.name
  },
  { immediate: true }
)

// 打字 350ms 后才请求高德：中文输入法一个词会触发多次 input，
// 不防抖会把配额烧在「北」「北京」「北京南」这种半截词上。
watch(query, (value) => {
  clearTimeout(timer)
  const keyword = value.trim()
  if (!open.value || keyword.length < 2) {
    remoteItems.value = []
    error.value = ''
    return
  }
  loading.value = true
  error.value = ''
  const current = ++seq
  timer = setTimeout(async () => {
    const result = await searchAmapPlaces(keyword)
    if (current !== seq) return
    loading.value = false
    if (!result.ok) {
      error.value = result.error
      remoteItems.value = []
      return
    }
    remoteItems.value = result.items.map((item) => ({
      ...item,
      group: 'amap',
      hint: item.address || '高德搜索',
    }))
  }, 350)
})

const grouped = computed(() => {
  const localHits = searchPlaces(query.value, 8)
  const groups = placeGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => localHits.includes(item)) }))
    .filter((group) => group.items.length)
  if (remoteItems.value.length) {
    groups.push({ id: 'amap', label: '高德搜索 · 任意地点', items: remoteItems.value })
  }
  return groups
})

const activeList = computed(() => grouped.value.flatMap((group) => group.items))

const onInput = (event) => {
  query.value = event.target.value
  open.value = true
  activeId.value = ''
}

const onFocus = () => {
  open.value = true
  activeId.value = ''
}

const onBlur = () => {
  // 失焦时把文字还原成当前选中项，避免框里留一句没被采纳的半截输入
  query.value = props.modelValue ? props.modelValue.name : ''
  open.value = false
}

const close = () => {
  open.value = false
  query.value = props.modelValue ? props.modelValue.name : ''
  inputEl.value?.blur()
}

const move = (step) => {
  if (!open.value) open.value = true
  const list = activeList.value
  if (!list.length) return
  const index = list.findIndex((item) => item.id === activeId.value)
  const next = index === -1 ? 0 : (index + step + list.length) % list.length
  activeId.value = list[next].id
}

const pick = (item) => {
  // 高德返回的是 GCJ-02，存进状态前先转成 WGS-84：
  // 全站其余坐标（景点、地图投影、通勤距离）都是 WGS-84，混用会整体偏 300—500 米。
  // 调高德接口时再转回 GCJ-02，转换只发生在边界上。
  const coord = item.gcj ? gcj02ToWgs84(item.lng, item.lat) : { lng: item.lng, lat: item.lat }
  emit('update:modelValue', {
    id: item.id,
    name: item.name,
    lat: coord.lat,
    lng: coord.lng,
    group: item.group,
    address: item.address || '',
  })
  query.value = item.name
  open.value = false
  activeId.value = ''
}

const commitActive = () => {
  const item = activeList.value.find((entry) => entry.id === activeId.value) || activeList.value[0]
  if (item) pick(item)
}
</script>
