<template>
  <div class="build-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>构筑器</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">构筑器</h1>
        <p class="hero-sub">
          选武器、四个护符和记忆格里的法术，实时算出总负重、负重档位、属性需求有没有达标。
          计算全在本地完成，构筑会同步进地址栏 —— 把链接发给别人就能看到同一套配装。
        </p>
      </div>
      <div class="hero-actions">
        <button class="hero-btn" type="button" @click="copyLink">
          <el-icon :size="13"><CopyDocument /></el-icon>
          {{ copied ? '已复制' : '复制链接' }}
        </button>
        <button class="hero-btn ghost" type="button" @click="resetBuild">清空</button>
      </div>
    </header>

    <!-- 预设 -->
    <div class="preset-bar">
      <span class="preset-label">抄一套现成的</span>
      <button
        v-for="preset in buildPresets"
        :key="preset.key"
        type="button"
        class="preset-chip"
        :class="{ on: activePresetKey === preset.key }"
        @click="applyPreset(preset)"
      >
        {{ preset.name }}
        <em>{{ preset.tag }}</em>
      </button>
    </div>

    <div v-if="activePreset" class="preset-note">
      <p class="preset-summary">{{ activePreset.summary }}</p>
      <ul class="preset-tips">
        <li v-for="tip in activePreset.notes" :key="tip">{{ tip }}</li>
      </ul>
    </div>

    <div class="build-layout">
      <div class="build-main">
        <!-- 属性 -->
        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">角色属性</h2>
            <span class="panel-meta">合计 {{ statTotal }} 点</span>
          </div>
          <div class="stat-grid">
            <div v-for="attr in ATTRS" :key="attr.key" class="stat-cell">
              <div class="stat-top">
                <span class="stat-label">{{ attr.label }}</span>
                <span
                  v-if="reqByAttr[attr.key]"
                  class="stat-req"
                  :class="{ miss: !reqByAttr[attr.key].ok }"
                  :title="reqByAttr[attr.key].ok ? '已满足最高需求' : '还有装备没满足需求'"
                >
                  需 {{ reqByAttr[attr.key].need }}
                </span>
              </div>
              <div class="stat-ctrl">
                <button type="button" class="step-btn" @click="stepStat(attr.key, -1)">−</button>
                <input
                  class="stat-input"
                  type="number"
                  :min="STAT_MIN"
                  :max="STAT_MAX"
                  :value="stats[attr.key]"
                  @change="onStatInput(attr.key, $event.target.value)"
                />
                <button type="button" class="step-btn" @click="stepStat(attr.key, 1)">+</button>
              </div>
            </div>
          </div>
          <p class="panel-hint">
            属性会影响两件事：能不能拿起装备（需求）与最大负重（耐力）。
            补正收益不在这里算 —— 那要看具体武器的补正等级，去武器详情页更准。
          </p>
        </section>

        <!-- 武器 -->
        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">武器</h2>
            <span class="panel-meta">{{ summary.weaponWeight.toFixed(1) }} 负重</span>
          </div>
          <div class="slot-grid">
            <div class="slot">
              <div class="slot-head">
                <span class="slot-label">主手</span>
                <span v-if="mainWeapon" class="slot-weight">{{ mainWeapon.stats.weight }} 负重</span>
              </div>
              <ItemPicker
                v-model="mainId"
                :items="weaponOptions"
                placeholder="选择主手武器"
                search-placeholder="武器名 / 类别 / 区域"
                empty-text="没有匹配的武器，换个关键词试试"
              />
              <div class="slot-foot">
                <span v-if="mainWeapon" class="slot-type">{{ mainWeapon.type }} · {{ mainWeapon.region }}</span>
                <span v-else class="slot-type muted">未装备</span>
                <div class="slot-tools">
                  <button
                    v-if="mainWeapon && canTwoHand(mainWeapon.type)"
                    type="button"
                    class="mini-toggle"
                    :class="{ on: twoHand }"
                    @click="twoHand = !twoHand"
                  >
                    双手持握
                  </button>
                  <RouterLink
                    v-if="mainWeapon"
                    :to="`/weapons/${encodeURIComponent(mainWeapon.id)}`"
                    class="slot-link"
                  >
                    详情
                  </RouterLink>
                </div>
              </div>
            </div>

            <div class="slot">
              <div class="slot-head">
                <span class="slot-label">副手</span>
                <span v-if="offWeapon" class="slot-weight">{{ offWeapon.stats.weight }} 负重</span>
              </div>
              <ItemPicker
                v-model="offId"
                :items="weaponOptions"
                placeholder="选择副手武器"
                search-placeholder="武器名 / 类别 / 区域"
                empty-text="没有匹配的武器，换个关键词试试"
              />
              <div class="slot-foot">
                <span v-if="offWeapon" class="slot-type">{{ offWeapon.type }} · {{ offWeapon.region }}</span>
                <span v-else class="slot-type muted">可以不装</span>
                <div class="slot-tools">
                  <RouterLink
                    v-if="offWeapon"
                    :to="`/weapons/${encodeURIComponent(offWeapon.id)}`"
                    class="slot-link"
                  >
                    详情
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
          <p class="panel-hint">
            双手持握只对主手生效：力气按 1.5 倍算（向下取整），能省下不少力气点。
            法杖、圣印记、弓弩与盾牌不支持双手持握，所以这里不显示这个开关。
          </p>
        </section>

        <!-- 护符 -->
        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">护符</h2>
            <span class="panel-meta">
              {{ summary.talismanWeight.toFixed(1) }} 负重
              <template v-if="load.sources.length">· 负重加成 +{{ loadBonusPercent }}%</template>
            </span>
          </div>
          <div class="talisman-grid">
            <div v-for="(slot, index) in talismanSlots" :key="index" class="slot">
              <div class="slot-head">
                <span class="slot-label">栏位 {{ index + 1 }}</span>
                <span v-if="slot" class="slot-weight">{{ slot.weight ?? 0 }} 负重</span>
              </div>
              <ItemPicker
                :model-value="talismanIds[index] || ''"
                :items="talismanOptions"
                :placeholder="`选择护符 ${index + 1}`"
                search-placeholder="护符名 / 效果 / 分类"
                empty-text="没有匹配的护符"
                @pick="(item) => setTalisman(index, item)"
              />
              <div v-if="slot" class="slot-foot">
                <span class="slot-type">{{ slot.category }}</span>
                <RouterLink :to="`/runes/${encodeURIComponent(slot.id)}`" class="slot-link">详情</RouterLink>
              </div>
              <div v-else class="slot-foot">
                <span class="slot-type muted">空栏位</span>
              </div>
            </div>
          </div>
          <p class="panel-hint">
            护符只能戴四个，负重类护符（众武护符系、黄金树的恩惠系）按乘法叠加：
            {{ load.sources.length ? load.sources.map((item) => `${item.name} +${item.bonus}%`).join(' × ') : '当前没有带负重加成' }}。
          </p>
        </section>

        <!-- 法术 -->
        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">记忆格</h2>
            <label class="cap-field">
              上限
              <input
                class="cap-input"
                type="number"
                :min="1"
                :max="12"
                :value="memoryCap"
                @change="onCapInput($event.target.value)"
              />
              格
            </label>
          </div>

          <div class="spell-add">
            <ItemPicker
              model-value=""
              :items="spellOptions"
              placeholder="+ 添加魔法或祷告"
              search-placeholder="法术名 / 学派 / 效果"
              empty-text="没有匹配的法术"
              @pick="addSpell"
            />
          </div>

          <ul v-if="selectedSpells.length" class="spell-list">
            <li v-for="spell in selectedSpells" :key="spell.value" class="spell-row">
              <span class="spell-kind">{{ spell.kind }}</span>
              <span class="spell-name">{{ spell.name }}</span>
              <span class="spell-meta">{{ spell.fp }} FP · {{ spell.slots }} 格</span>
              <button type="button" class="spell-remove" @click="removeSpell(spell.value)">×</button>
            </li>
          </ul>
          <p v-else class="empty-hint">
            还没加法术。记忆格上限按你实际开出的格数填，初始 2 格，每颗记忆石 +1。
          </p>
        </section>
      </div>

      <!-- 结果栏 -->
      <aside class="build-side">
        <section class="panel result-panel">
          <div class="panel-head">
            <h2 class="panel-title">负重</h2>
            <span class="tier-badge" :style="{ color: tierColorValue, borderColor: tierColorValue }">
              {{ tier.label }}
            </span>
          </div>

          <div class="load-figure">
            <strong class="load-now">{{ summary.totalWeight.toFixed(1) }}</strong>
            <span class="load-max">/ {{ load.total.toFixed(1) }}</span>
            <span class="load-pct" :style="{ color: tierColorValue }">{{ Math.round(tier.percent) }}%</span>
          </div>

          <div class="bar">
            <i class="bar-fill" :style="{ width: `${barWidth}%`, background: tierColorValue }"></i>
            <span class="bar-mark" style="left: 30%"></span>
            <span class="bar-mark" style="left: 70%"></span>
          </div>
          <div class="bar-legend">
            <span class="legend-start">0</span>
            <span class="legend-mark" style="left: 30%">轻 30%</span>
            <span class="legend-mark" style="left: 70%">重 70%</span>
            <span class="legend-end">100%</span>
          </div>

          <p class="tier-note">{{ tier.note }}</p>

          <ul class="break-list">
            <li>
              <span>主手</span>
              <b>{{ mainWeapon ? mainWeapon.stats.weight : '—' }}</b>
            </li>
            <li>
              <span>副手</span>
              <b>{{ offWeapon ? offWeapon.stats.weight : '—' }}</b>
            </li>
            <li>
              <span>护符 ×{{ selectedTalismans.length }}</span>
              <b>{{ summary.talismanWeight.toFixed(1) }}</b>
            </li>
          </ul>

          <div class="formula-box">
            <p class="formula-line">
              耐力 {{ stats.endurance }} 级 → <b>{{ load.base }}</b> 负重上限
            </p>
            <p v-if="load.sources.length" class="formula-line">
              × 护符 <b>{{ load.multiplier.toFixed(3) }}</b>
              <span class="formula-src">（{{ load.sources.map((item) => `${item.name} +${item.bonus}%`).join('、') }}）</span>
            </p>
            <p class="formula-line total">
              = 可承重 <b>{{ load.total.toFixed(1) }}</b>
            </p>
          </div>

          <p class="advice" :class="{ warn: tier.key === 'overloaded' || tier.key === 'heavy' }">{{ advice }}</p>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">记忆与 FP</h2>
            <span class="panel-meta">{{ summary.spellSlots }} / {{ memory.capacity }} 格</span>
          </div>
          <div class="bar">
            <i
              class="bar-fill"
              :style="{ width: `${slotWidth}%`, background: memory.ok ? '#7e9a5c' : '#d9534f' }"
            ></i>
          </div>
          <ul class="break-list">
            <li>
              <span>占用记忆格</span>
              <b :class="{ over: !memory.ok }">{{ summary.spellSlots }}</b>
            </li>
            <li>
              <span>一套法术总 FP</span>
              <b>{{ summary.spellFp }}</b>
            </li>
            <li>
              <span>法术件数</span>
              <b>{{ selectedSpells.length }}</b>
            </li>
          </ul>
          <p v-if="!memory.ok" class="advice warn">
            超出 {{ memory.over }} 格。去掉一些法术，或者换成占格更少的版本。
          </p>
          <p v-else class="panel-hint">
            FP 是「把带上的法术各放一遍」的总消耗，用来估蓝瓶够不够，不是单次循环的量。
          </p>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">需求检查</h2>
            <span class="panel-meta">{{ gapRows.length ? `${gapRows.length} 项不达标` : '全部达标' }}</span>
          </div>

          <p v-if="!reqRows.length" class="empty-hint">还没装备任何东西。</p>
          <template v-else>
            <p v-if="!gapRows.length" class="ok-hint">
              当前属性满足所有装备的需求。
            </p>
            <ul v-else class="gap-list">
              <li v-for="row in gapRows" :key="row.item + row.key" class="gap-row">
                <div class="gap-main">
                  <span class="gap-attr">{{ row.label }}</span>
                  <span class="gap-num">{{ row.have }} / {{ row.need }}</span>
                  <span class="gap-diff">差 {{ row.gap }}</span>
                </div>
                <span class="gap-item">{{ row.item }}</span>
              </li>
            </ul>
          </template>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { CopyDocument } from '@element-plus/icons-vue'
import ItemPicker from '../components/ItemPicker.vue'
import { useQuerySync } from '../composables/useQuerySync'
import weapons from '../data/weapons.js'
import talismans from '../data/talismans.js'
import sorceries from '../data/sorceries.js'
import incantations from '../data/incantations.js'
import { buildPresets } from '../data/buildPresets.js'
import {
  ATTRS,
  DEFAULT_STATS,
  STAT_MAX,
  STAT_MIN,
  canTwoHand,
  checkRequirements,
  enduranceForTier,
  loadTier,
  lighterTier,
  maxEquipLoad,
  memoryStatus,
  parseRequirements,
  summarize,
  tierColor,
} from '../utils/build.js'

// ==================== 状态 ====================
//
// 属性存成一行字符串（"40,20,25,20,20,10,10,10"）而不是八个 ref：
// URL 里只需要一个 st 参数，分享链接短一半，也少八个 watch。
const DEFAULT_STAT_LINE = ATTRS.map((attr) => DEFAULT_STATS[attr.key]).join(',')
const DEFAULT_MEMORY_CAP = 8

const mainId = ref('')
const offId = ref('')
const talismanIds = ref([])
const spellIds = ref([])
const statLine = ref(DEFAULT_STAT_LINE)
const twoHand = ref(false)
const memoryCap = ref(DEFAULT_MEMORY_CAP)
const activePresetKey = ref('')
const copied = ref(false)

useQuerySync(
  {
    w: mainId,
    o: offId,
    t: talismanIds,
    s: spellIds,
    st: statLine,
    tw: twoHand,
    mc: memoryCap,
  },
  { st: DEFAULT_STAT_LINE, mc: DEFAULT_MEMORY_CAP }
)

function clampStat(value) {
  const num = Math.round(Number(value))
  if (Number.isNaN(num)) return 1
  return Math.min(Math.max(num, STAT_MIN), STAT_MAX)
}

const stats = computed(() => {
  const parts = String(statLine.value).split(',')
  const result = {}
  ATTRS.forEach((attr, index) => {
    const parsed = Number(parts[index])
    result[attr.key] = Number.isFinite(parsed) && parts[index] !== '' ? clampStat(parsed) : DEFAULT_STATS[attr.key]
  })
  return result
})

function writeStat(key, value) {
  const index = ATTRS.findIndex((attr) => attr.key === key)
  if (index < 0) return
  const parts = String(statLine.value).split(',')
  while (parts.length < ATTRS.length) parts.push('10')
  parts[index] = String(clampStat(value))
  statLine.value = parts.join(',')
}

function onStatInput(key, raw) {
  writeStat(key, raw)
}

function stepStat(key, delta) {
  writeStat(key, stats.value[key] + delta)
}

const statTotal = computed(() => ATTRS.reduce((sum, attr) => sum + stats.value[attr.key], 0))

// ==================== 选项表 ====================
const weaponOptions = computed(() =>
  weapons.map((weapon) => ({
    value: weapon.id,
    label: weapon.name,
    meta: `${weapon.type} · ${weapon.stats.weight}`,
    // 搜索时允许用类别和区域找：「大剑」「盖利德」都能命中
    search: `${weapon.name} ${weapon.type} ${weapon.region} ${weapon.stats.weight}`,
  }))
)

const talismanOptions = computed(() =>
  talismans.map((talisman) => ({
    value: talisman.id,
    label: talisman.name,
    meta: `${talisman.weight ?? 0} 负重`,
    search: `${talisman.name} ${talisman.category} ${talisman.effect}`,
  }))
)

// 魔法与祷告合到一张表里选，但 value 加前缀：两张表都以「法术名」当 id，
// 不加前缀的话将来出现同名法术会静默串味。
// 顺手建一份 value → 法术 的索引，选中后要靠它取 FP / 记忆格 / 需求。
const SPELL_LIST = []
const SPELL_MAP = new Map()

function registerSpells(source, kind, prefix) {
  source.forEach((spell) => {
    const value = `${prefix}:${spell.id}`
    SPELL_MAP.set(value, {
      value,
      kind,
      id: spell.id,
      name: spell.name,
      fp: spell.fp,
      slots: spell.slots,
      req: spell.req,
    })
    SPELL_LIST.push({
      value,
      label: spell.name,
      meta: `${spell.fp} FP · ${spell.slots} 格`,
      search: `${spell.name} ${kind} ${spell.category} ${spell.effect}`,
    })
  })
}

registerSpells(sorceries, '魔法', 'sc')
registerSpells(incantations, '祷告', 'inc')

const spellOptions = SPELL_LIST

// ==================== 选中项 ====================
//
// 这里不用 find(...) 直接查，而是先过一层「宽松查找」：
// 护符有很多 +1 / +2 的强化版，名字里的 + 在 URL query 里是 %2B，
// 只要中间有一环把它还原成字面的 +，就会在解析时被当成空格
// （「黄金树的恩惠+2」→「黄金树的恩惠 2」），护符就静默消失了。
// 换回 + 再查一次，链接就不会因为这种细节少一件装备。
function normalizePlus(id) {
  return String(id ?? '').replace(/ /g, '+')
}

function findWeapon(id) {
  if (!id) return null
  return weapons.find((weapon) => weapon.id === id) || null
}

function findTalisman(id) {
  if (!id) return null
  return (
    talismans.find((talisman) => talisman.id === id) ||
    talismans.find((talisman) => talisman.id === normalizePlus(id)) ||
    null
  )
}

function findSpell(id) {
  return SPELL_MAP.get(id) || SPELL_MAP.get(normalizePlus(id)) || null
}

const mainWeapon = computed(() => findWeapon(mainId.value))
const offWeapon = computed(() => findWeapon(offId.value))
const selectedWeapons = computed(() => [mainWeapon.value, offWeapon.value].filter(Boolean))

const selectedTalismans = computed(() => talismanIds.value.map((id) => findTalisman(id)).filter(Boolean))
// 固定渲染四格：空栏位也要占位，玩家才知道还能放几个
const talismanSlots = computed(() => [0, 1, 2, 3].map((index) => selectedTalismans.value[index] || null))

const selectedSpells = computed(() => spellIds.value.map((id) => findSpell(id)).filter(Boolean))

/**
 * 护符栏位本身没有位置含义（游戏里四个栏位是等价的），所以数组里不留空位：
 * 选中的护符始终从第 1 格开始连续排。
 *
 * 这里有一个坑：点到第 3 格（空栏位）时不能按下标写入 —— 那样数组会变成
 * ['A', '', 'B']，压缩后 B 跑到第 2 格，玩家会以为点错了。空栏位一律追加。
 */
function setTalisman(index, item) {
  const current = talismanIds.value.slice(0, 4)
  if (!item) {
    talismanIds.value = current.filter((_, i) => i !== index)
    return
  }
  // 同一件护符不能戴两次，先把它从别的位置摘掉
  const without = current.filter((id) => id !== item.value)
  if (index >= without.length) {
    talismanIds.value = [...without, item.value].slice(0, 4)
  } else {
    without.splice(index, 0, item.value)
    talismanIds.value = without.slice(0, 4)
  }
}

function addSpell(item) {
  if (!item) return
  if (spellIds.value.includes(item.value)) return
  spellIds.value = [...spellIds.value, item.value]
}

function removeSpell(value) {
  spellIds.value = spellIds.value.filter((id) => id !== value)
}

function onCapInput(raw) {
  const num = Math.round(Number(raw))
  memoryCap.value = Number.isNaN(num) ? DEFAULT_MEMORY_CAP : Math.min(Math.max(num, 1), 12)
}

// ==================== 计算 ====================
const load = computed(() => maxEquipLoad(stats.value.endurance, selectedTalismans.value))
const summary = computed(() =>
  summarize({ weapons: selectedWeapons.value, talismans: selectedTalismans.value, spells: selectedSpells.value })
)
const tier = computed(() => loadTier(summary.value.totalWeight, load.value.total))
const tierColorValue = computed(() => tierColor(tier.value.key))
const barWidth = computed(() => Math.min(100, Math.round(tier.value.percent)))
const loadBonusPercent = computed(() => Math.round((load.value.multiplier - 1) * 1000) / 10)
const memory = computed(() => memoryStatus(summary.value.spellSlots, memoryCap.value))
const slotWidth = computed(() =>
  memory.value.capacity ? Math.min(100, Math.round((memory.value.used / memory.value.capacity) * 100)) : 0
)

const advice = computed(() => {
  const current = summary.value.totalWeight
  if (!current) return '还没装东西，先选一把武器试试。'
  const room = load.value.total - current
  if (tier.value.key === 'overloaded') {
    return `超重了，必须减掉 ${Math.abs(room).toFixed(1)} 负重才能翻滚。先卸下重的那件，或者加耐力。`
  }
  if (tier.value.key === 'light') {
    return `还有 ${room.toFixed(1)} 负重余量，可以再加护符或换更重的武器，仍然保持轻负重。`
  }
  const targetKey = lighterTier(tier.value.key)
  const targetLabel = targetKey === 'light' ? '轻负重' : targetKey === 'medium' ? '中负重' : '重负重'
  const need = enduranceForTier(current, selectedTalismans.value, targetKey)
  if (!need) {
    return `99 耐力也压不进${targetLabel}，想更轻只能换掉最重的那件装备。`
  }
  const gap = need.endurance - stats.value.endurance
  return `想进${targetLabel}，耐力至少 ${need.endurance} 级${gap > 0 ? `（还要再加 ${gap} 点）` : ''}；余量还有 ${room.toFixed(1)}。`
})

// 每件装备单独查需求：双手持握只对主手生效，所以不能合并成一次检查
const reqRows = computed(() => {
  const entries = []
  if (mainWeapon.value) {
    entries.push({
      item: mainWeapon.value.name,
      req: mainWeapon.value.requirements,
      twoHand: twoHand.value && canTwoHand(mainWeapon.value.type),
    })
  }
  if (offWeapon.value) {
    entries.push({ item: offWeapon.value.name, req: offWeapon.value.requirements, twoHand: false })
  }
  selectedSpells.value.forEach((spell) => {
    entries.push({ item: spell.name, req: parseRequirements(spell.req), twoHand: false })
  })

  return entries.flatMap((entry) =>
    checkRequirements(stats.value, entry.req, { twoHand: entry.twoHand }).map((row) => ({ ...row, item: entry.item }))
  )
})

const gapRows = computed(() => reqRows.value.filter((row) => !row.ok))

// 属性格旁边的「需 X」小标：取所有装备在这个属性上的最高需求
const reqByAttr = computed(() => {
  const map = {}
  reqRows.value.forEach((row) => {
    const exist = map[row.key]
    if (!exist) {
      map[row.key] = { need: row.need, ok: row.ok }
      return
    }
    map[row.key] = {
      need: Math.max(exist.need, row.need),
      // 任何一件不达标就算整体不达标
      ok: exist.ok && row.ok,
    }
  })
  return map
})

// ==================== 操作 ====================
function resolveWeapon(name) {
  const hit = weapons.find((weapon) => weapon.name === name || weapon.id === name)
  if (!hit) throw new Error(`[buildPresets] 预设引用了不存在的武器「${name}」`)
  return hit
}

function resolveTalisman(name) {
  const hit = talismans.find((talisman) => talisman.name === name || talisman.id === name)
  if (!hit) throw new Error(`[buildPresets] 预设引用了不存在的护符「${name}」`)
  return hit
}

function resolveSpell(name) {
  const hit = SPELL_LIST.find((option) => option.label === name)
  if (!hit) throw new Error(`[buildPresets] 预设引用了不存在的法术「${name}」`)
  return hit
}

function applyPreset(preset) {
  mainId.value = resolveWeapon(preset.main).id
  offId.value = preset.off ? resolveWeapon(preset.off).id : ''
  talismanIds.value = preset.talismans.map((name) => resolveTalisman(name).id).slice(0, 4)
  spellIds.value = preset.spells.map((name) => resolveSpell(name).value)
  statLine.value = ATTRS.map((attr) => clampStat(preset.stats[attr.key] ?? 10)).join(',')
  twoHand.value = false
  activePresetKey.value = preset.key
  // 记下「应用完预设后的构筑指纹」，之后玩家一改就不再高亮这套预设
  presetSignature = buildSignature.value
}

const activePreset = computed(() => buildPresets.find((preset) => preset.key === activePresetKey.value) || null)

// 构筑指纹：任何一项装备或属性变了，就不再算「正在用这套预设」
const buildSignature = computed(() =>
  [
    mainId.value,
    offId.value,
    talismanIds.value.join('|'),
    spellIds.value.join('|'),
    statLine.value,
    twoHand.value ? '1' : '0',
  ].join('/')
)
let presetSignature = ''

watch(buildSignature, (value) => {
  if (activePresetKey.value && value !== presetSignature) activePresetKey.value = ''
})

function resetBuild() {
  mainId.value = ''
  offId.value = ''
  talismanIds.value = []
  spellIds.value = []
  statLine.value = DEFAULT_STAT_LINE
  twoHand.value = false
  memoryCap.value = DEFAULT_MEMORY_CAP
  activePresetKey.value = ''
  copied.value = false
}

async function copyLink() {
  if (typeof window === 'undefined') return
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    // 非 https 或剪贴板未授权时退回「让用户自己从地址栏复制」
    copied.value = false
    window.prompt('复制下面的链接：', url)
  }
}

// ==================== URL 兜底 ====================
// 分享出去的链接可能带着改名或已删除的旧 id，也可能是手改过的。
// 挂载前统一清洗一遍：认不出的直接丢掉，认得出但写法不对的（见 normalizePlus）改回正确写法。
// 不做这一步的话，界面上会「少一件装备」却看不出原因，比报错更难查。
pruneQueryBuild()

function pruneQueryBuild() {
  const nextTalismans = talismanIds.value.map((id) => findTalisman(id)?.id).filter(Boolean)
  if (nextTalismans.join(',') !== talismanIds.value.join(',')) talismanIds.value = nextTalismans

  const nextSpells = spellIds.value.filter((id) => Boolean(findSpell(id)))
  if (nextSpells.length !== spellIds.value.length) spellIds.value = nextSpells

  if (mainId.value && !findWeapon(mainId.value)) mainId.value = ''
  if (offId.value && !findWeapon(offId.value)) offId.value = ''
}
</script>

<style scoped>
.build-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crumb {
  font-size: 13px;
}

.page-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e1c16 0%, #16150f 100%);
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-title {
  margin: 0 0 9px;
  font-size: 25px;
  color: #d4af37;
}

.hero-sub {
  margin: 0;
  max-width: 700px;
  font-size: 13.5px;
  line-height: 1.85;
  color: #a9a496;
}

.hero-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-family: inherit;
  font-size: 12.5px;
  color: #d9c47a;
  cursor: pointer;
  background: #241f14;
  border: 1px solid #4a3f20;
  border-radius: 7px;
  transition: all 0.18s;
}

.hero-btn:hover {
  color: #d4af37;
  background: #2c2617;
  border-color: #6b5c2e;
}

.hero-btn.ghost {
  color: #8a8574;
  background: transparent;
  border-color: #332d20;
}

.hero-btn.ghost:hover {
  color: #c9c4b4;
  border-color: #4a4231;
}

.preset-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-label {
  font-size: 12px;
  color: #6b6555;
  letter-spacing: 0.5px;
}

.preset-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 12px;
  font-family: inherit;
  font-size: 12.5px;
  color: #b8b2a0;
  cursor: pointer;
  background: #1c1c1c;
  border: 1px solid #332d20;
  border-radius: 999px;
  transition: all 0.18s;
}

.preset-chip em {
  font-size: 10px;
  font-style: normal;
  color: #6f6a5c;
}

.preset-chip:hover {
  color: #d4af37;
  border-color: #5a4f2c;
}

.preset-chip.on {
  color: #d4af37;
  background: #241f14;
  border-color: #6b5c2e;
}

.preset-note {
  padding: 14px 16px;
  border: 1px solid #3a3324;
  border-left: 3px solid #6b5c2e;
  border-radius: 9px;
  background: #1a1915;
}

.preset-summary {
  margin: 0 0 8px;
  font-size: 12.5px;
  line-height: 1.75;
  color: #a9a496;
}

.preset-tips {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.preset-tips li {
  font-size: 12px;
  line-height: 1.7;
  color: #817c6c;
}

.build-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

.build-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.build-side {
  position: sticky;
  top: 78px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  padding: 18px 20px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.2;
  color: #d4af37;
  padding-left: 10px;
  border-left: 3px solid #d4af37;
}

.panel-meta {
  font-size: 12px;
  color: #8a8574;
  font-variant-numeric: tabular-nums;
}

.panel-hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.75;
  color: #6b6555;
}

/* ---------- 属性 ---------- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-cell {
  padding: 9px 10px;
  border: 1px solid #2c2a22;
  border-radius: 8px;
  background: #191919;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 7px;
}

.stat-label {
  font-size: 12px;
  color: #9c9686;
}

.stat-req {
  padding: 0 4px;
  font-size: 10px;
  color: #7e9a5c;
  background: rgba(126, 154, 92, 0.1);
  border: 1px solid rgba(126, 154, 92, 0.3);
  border-radius: 3px;
  font-variant-numeric: tabular-nums;
}

.stat-req.miss {
  color: #d9534f;
  background: rgba(217, 83, 79, 0.1);
  border-color: rgba(217, 83, 79, 0.35);
}

.stat-ctrl {
  display: flex;
  align-items: center;
  gap: 4px;
}

.step-btn {
  width: 20px;
  height: 22px;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  color: #8a8574;
  cursor: pointer;
  background: #232323;
  border: 1px solid #322c1f;
  border-radius: 4px;
  transition: all 0.15s;
}

.step-btn:hover {
  color: #d4af37;
  border-color: #5a4f2c;
}

.stat-input {
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #e8d9a8;
  text-align: center;
  background: #141414;
  border: 1px solid #322c1f;
  border-radius: 4px;
  outline: none;
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
}

.stat-input:focus {
  border-color: #6b5c2e;
}

.stat-input::-webkit-outer-spin-button,
.stat-input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

/* ---------- 装备槽 ---------- */
.slot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.talisman-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.slot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.slot-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.slot-label {
  font-size: 11.5px;
  color: #6b6555;
  letter-spacing: 0.5px;
}

.slot-weight {
  font-size: 11px;
  color: #8a7440;
  font-variant-numeric: tabular-nums;
}

.slot-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 18px;
}

.slot-type {
  font-size: 11px;
  color: #6f6a5c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-type.muted {
  color: #4e4a3f;
}

.slot-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.slot-link {
  font-size: 11px;
  color: #8a8574;
  text-decoration: none;
  border-bottom: 1px dashed #3a3324;
}

.slot-link:hover {
  color: #d4af37;
  border-bottom-color: #6b5c2e;
}

.mini-toggle {
  padding: 2px 7px;
  font-family: inherit;
  font-size: 10.5px;
  color: #7a7565;
  cursor: pointer;
  background: #1e1e1e;
  border: 1px solid #322c1f;
  border-radius: 4px;
  transition: all 0.15s;
}

.mini-toggle:hover {
  color: #c9c4b4;
  border-color: #4a4231;
}

.mini-toggle.on {
  color: #d4af37;
  background: #241f14;
  border-color: #6b5c2e;
}

/* ---------- 法术 ---------- */
.cap-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8a8574;
}

.cap-input {
  width: 44px;
  height: 24px;
  padding: 0 4px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: #e8d9a8;
  text-align: center;
  background: #141414;
  border: 1px solid #322c1f;
  border-radius: 4px;
  outline: none;
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
}

.cap-input::-webkit-outer-spin-button,
.cap-input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.spell-add {
  max-width: 340px;
}

.spell-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spell-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border: 1px solid #2c2a22;
  border-radius: 7px;
  background: #191919;
}

.spell-kind {
  flex-shrink: 0;
  padding: 0 5px;
  font-size: 10px;
  color: #8a7440;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid #4a3f20;
  border-radius: 3px;
}

.spell-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12.5px;
  color: #cfc9b8;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spell-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: #6f6a5c;
  font-variant-numeric: tabular-nums;
}

.spell-remove {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  padding: 0;
  font-size: 13px;
  line-height: 1;
  color: #6f6a5c;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
}

.spell-remove:hover {
  color: #d9534f;
  border-color: rgba(217, 83, 79, 0.35);
}

.empty-hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.75;
  color: #5d5849;
}

/* ---------- 结果栏 ---------- */
.tier-badge {
  padding: 2px 9px;
  font-size: 11.5px;
  border: 1px solid;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
}

.load-figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
}

.load-now {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  color: #e8d9a8;
  font-variant-numeric: tabular-nums;
}

.load-max {
  font-size: 13px;
  color: #6f6a5c;
  font-variant-numeric: tabular-nums;
}

.load-pct {
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bar {
  position: relative;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #262626;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background 0.3s ease;
}

.bar-mark {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
}

.bar-legend {
  position: relative;
  height: 14px;
  margin-top: 4px;
  font-size: 10px;
  color: #4e4a3f;
  font-variant-numeric: tabular-nums;
}

.legend-start,
.legend-end {
  position: absolute;
  top: 0;
}

.legend-start {
  left: 0;
}

.legend-end {
  right: 0;
}

/* 刻度线画在 30% / 70%，文字也跟着对到这个位置，否则文字和线对不上 */
.legend-mark {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}

.tier-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #8a8574;
}

.break-list {
  margin: 14px 0 0;
  padding: 12px 0 0;
  list-style: none;
  border-top: 1px solid #282419;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.break-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #8a8574;
}

.break-list b {
  color: #c9c4b4;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.break-list b.over {
  color: #d9534f;
}

.formula-box {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #2c2a22;
  border-radius: 7px;
  background: #181818;
}

.formula-line {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.9;
  color: #7a7565;
  font-variant-numeric: tabular-nums;
}

.formula-line b {
  color: #c9c4b4;
  font-weight: 600;
}

.formula-line.total b {
  color: #d4af37;
  font-size: 12.5px;
}

.formula-src {
  color: #5d5849;
}

.advice {
  margin: 12px 0 0;
  padding: 9px 11px;
  font-size: 12px;
  line-height: 1.7;
  color: #9db884;
  border: 1px solid #3a4a34;
  border-radius: 7px;
  background: #1a1f18;
}

.advice.warn {
  color: #d9b06a;
  border-color: #4a3f20;
  background: #211d15;
}

.ok-hint {
  margin: 0;
  padding: 9px 11px;
  font-size: 12px;
  line-height: 1.7;
  color: #9db884;
  border: 1px solid #3a4a34;
  border-radius: 7px;
  background: #1a1f18;
}

.gap-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gap-row {
  padding: 8px 10px;
  border: 1px solid #3f2b28;
  border-radius: 7px;
  background: #1e1917;
}

.gap-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.gap-attr {
  font-size: 12.5px;
  font-weight: 600;
  color: #d9534f;
}

.gap-num {
  font-size: 12px;
  color: #b8b2a0;
}

.gap-diff {
  margin-left: auto;
  font-size: 11px;
  color: #c9705f;
}

.gap-item {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #6f6a5c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1080px) {
  .build-layout {
    grid-template-columns: 1fr;
  }

  .build-side {
    position: static;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 680px) {
  .page-hero {
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
  }

  .slot-grid,
  .talisman-grid {
    grid-template-columns: 1fr;
  }

  .spell-add {
    max-width: none;
  }
}
</style>
