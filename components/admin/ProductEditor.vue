<script setup lang="ts">
import type { AdminCurrency, AdminProduct, CreateProductVariantRequest, UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'
import { PLACEHOLDER_IMAGE } from '~/utils/productImage'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{ product: AdminProduct; saving: boolean }>()
const emit = defineEmits<{
  save: [body: UpdateProductRequest]
  saveVariant: [variantId: string, body: UpdateProductVariantRequest]
  deleteProduct: []
  deleteVariant: [variantId: string]
  createVariant: [body: CreateProductVariantRequest]
}>()

// Collapsed by default so the list stays scannable with many products; click the header to expand.
const expanded = ref(false)

// Name/description/imageKey/isActive are the editable fields (design D3 UI scope); platform and
// slug travel through unchanged since PUT takes the full record.
const name = ref(props.product.name)
const description = ref(props.product.description)
const imageKey = ref(props.product.imageKey ?? '')
const detailImageKey = ref(props.product.detailImageKey ?? '')
const activationGuideUrl = ref(props.product.activationGuideUrl ?? '')
const activationType = ref(props.product.activationType ?? '')
const imageKeys = ref<string[]>([...(props.product.imageKeys ?? [])])
const isActive = ref(props.product.isActive)
const descriptionInput = ref<HTMLTextAreaElement | null>(null)
const showDescriptionPreview = ref(false)
const saved = ref(false)

function onPreviewKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') showDescriptionPreview.value = false
}
onMounted(() => window.addEventListener('keydown', onPreviewKeydown))
onUnmounted(() => window.removeEventListener('keydown', onPreviewKeydown))

// Wraps the current textarea selection in a Markdown marker (bold/italic); with nothing selected,
// inserts a placeholder word so the admin has something to type over. CommonMark won't treat a
// closing `**`/`*` as emphasis if it's preceded by whitespace, so leading/trailing spaces in the
// selection are kept OUTSIDE the markers instead of wrapping them (e.g. "word " → "**word** ").
function wrapDescriptionSelection(marker: string) {
  const el = descriptionInput.value
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const value = description.value
  const rawSelected = value.slice(start, end)
  const trimmed = rawSelected.trim() || 'texto'
  const leadingWs = rawSelected.match(/^\s*/)?.[0] ?? ''
  const trailingWs = rawSelected.match(/\s*$/)?.[0] ?? ''
  description.value = value.slice(0, start) + leadingWs + marker + trimmed + marker + trailingWs + value.slice(end)
  const selStart = start + leadingWs.length
  nextTick(() => {
    el.focus()
    el.setSelectionRange(selStart + marker.length, selStart + marker.length + trimmed.length)
  })
}

// Prefixes every line touched by the selection with a Markdown bullet, so selecting several lines
// turns them all into one list instead of just the first.
function prefixDescriptionLines(prefix: string) {
  const el = descriptionInput.value
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const value = description.value
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEndIdx = value.indexOf('\n', end)
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx
  const block = value.slice(lineStart, lineEnd)
  const prefixed = block.split('\n').map((line) => (line ? `${prefix}${line}` : line)).join('\n')
  description.value = value.slice(0, lineStart) + prefixed + value.slice(lineEnd)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(lineStart, lineStart + prefixed.length)
  })
}
let savedTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(savedTimer))

watch(() => props.product, (product) => {
  name.value = product.name
  description.value = product.description
  imageKey.value = product.imageKey ?? ''
  detailImageKey.value = product.detailImageKey ?? ''
  activationGuideUrl.value = product.activationGuideUrl ?? ''
  activationType.value = product.activationType ?? ''
  imageKeys.value = [...(product.imageKeys ?? [])]
  isActive.value = product.isActive
})

async function submit() {
  emit('save', {
    name: name.value,
    platform: props.product.platform,
    description: description.value,
    imageKey: imageKey.value || undefined,
    detailImageKey: detailImageKey.value || undefined,
    activationGuideUrl: activationGuideUrl.value || null,
    activationType: activationType.value || null,
    imageKeys: imageKeys.value.map((k) => k.trim()).filter(Boolean),
    isActive: isActive.value,
  })
  saved.value = true
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => (saved.value = false), 2000)
}

const currencies: AdminCurrency[] = ['ARS', 'USD']
const showNewVariant = ref(false)
// basePrice is the real/list price the admin types (shows struck-through to buyers). The
// backend's `price` field means the already-discounted charge amount, so we compute that
// below rather than sending basePrice straight through.
const newVariant = ref({ region: '', edition: '', basePrice: 0, discountPercentage: undefined as number | undefined, currency: 'ARS' as AdminCurrency })

const newVariantFinalPrice = computed(() => {
  const { basePrice, discountPercentage } = newVariant.value
  if (!discountPercentage || !basePrice) return basePrice
  return Math.round(basePrice * (1 - discountPercentage / 100) * 100) / 100
})

function submitNewVariant() {
  emit('createVariant', {
    region: newVariant.value.region || undefined,
    edition: newVariant.value.edition || undefined,
    price: newVariantFinalPrice.value,
    discountPercentage: newVariant.value.discountPercentage || undefined,
    currency: newVariant.value.currency,
    sortOrder: props.product.variants.length,
    isActive: true,
  })
  newVariant.value = { region: '', edition: '', basePrice: 0, discountPercentage: undefined, currency: 'ARS' }
  showNewVariant.value = false
}
</script>

<template>
  <div class="glass flex flex-col gap-4 rounded-2xl p-6" :class="{ 'opacity-50': !product.isActive }">
    <button type="button" class="flex items-center justify-between gap-3 text-left" @click="expanded = !expanded">
      <div class="flex min-w-0 items-center gap-3">
        <img :src="product.imageUrl || PLACEHOLDER_IMAGE" :alt="product.name" class="h-14 w-11 shrink-0 rounded-lg object-cover" />
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold">{{ product.name }}</h2>
          <p class="truncate text-xs text-white/50">{{ product.slug }} · {{ product.platform }} · {{ product.variants.length }} variante(s)</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <AppBadge :tone="isActive ? 'success' : 'neutral'">{{ isActive ? 'Activo' : 'Inactivo' }}</AppBadge>
        <span class="text-white/50 transition" :class="{ 'rotate-180': expanded }">⌄</span>
      </div>
    </button>

    <form v-if="expanded" class="flex flex-col gap-4" @submit.prevent="submit">
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Nombre</span>
        <input v-model="name" type="text" required class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
      </label>

      <div class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Descripción (admite Markdown: **negrita**, *cursiva*, listas)</span>
        <div class="flex gap-1.5">
          <button type="button" title="Negrita" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white/70 hover:border-white/30 hover:text-white" @click="wrapDescriptionSelection('**')">B</button>
          <button type="button" title="Cursiva" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm italic text-white/70 hover:border-white/30 hover:text-white" @click="wrapDescriptionSelection('*')">I</button>
          <button type="button" title="Lista con viñetas" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:border-white/30 hover:text-white" @click="prefixDescriptionLines('- ')">•</button>
          <button
            type="button"
            :disabled="!description.trim()"
            class="ml-auto text-sm font-medium text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            @click="showDescriptionPreview = true"
          >
            Vista previa
          </button>
        </div>
        <textarea ref="descriptionInput" v-model="description" rows="5" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-accent" />
      </div>

      <Teleport to="body">
        <div v-if="showDescriptionPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="showDescriptionPreview = false" />
          <div role="dialog" aria-modal="true" aria-labelledby="description-preview-title" class="glass relative flex max-h-[80vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl p-6">
            <button type="button" aria-label="Cerrar" class="absolute right-3 top-3 rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white" @click="showDescriptionPreview = false">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <h2 id="description-preview-title" class="text-lg font-semibold">Vista previa</h2>
            <div class="markdown-body text-white/70" v-html="renderMarkdown(description)" />
          </div>
        </div>
      </Teleport>

      <div class="flex flex-wrap gap-4">
        <label class="flex min-w-56 flex-1 flex-col gap-2 text-sm">
          <span class="text-white/70">Clave de imagen — catálogo (R2, 3:4)</span>
          <div class="flex items-center gap-3">
            <img :src="product.imageUrl || PLACEHOLDER_IMAGE" :alt="product.name" class="h-16 w-[3.2rem] shrink-0 rounded-lg border border-white/10 object-cover" />
            <input v-model="imageKey" type="text" placeholder="products/slug.png" class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
          </div>
        </label>

        <label class="flex min-w-56 flex-1 flex-col gap-2 text-sm">
          <span class="text-white/70">Clave de imagen — vista de producto (R2)</span>
          <div class="flex items-center gap-3">
            <img :src="product.detailImageUrl || PLACEHOLDER_IMAGE" :alt="product.name" class="h-16 w-[3.2rem] shrink-0 rounded-lg border border-white/10 object-cover" />
            <input v-model="detailImageKey" type="text" placeholder="products/slug-detail.png" class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
          </div>
        </label>
      </div>
      <p class="-mt-2 text-xs text-white/40">La miniatura se actualiza al guardar el producto.</p>

      <div class="flex flex-wrap gap-4">
        <label class="flex min-w-56 flex-1 flex-col gap-2 text-sm">
          <span class="text-white/70">Guía de activación (URL)</span>
          <input v-model="activationGuideUrl" type="url" placeholder="https://..." class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
        </label>

        <label class="flex min-w-56 flex-1 flex-col gap-2 text-sm">
          <span class="text-white/70">Tipo</span>
          <input v-model="activationType" type="text" placeholder="Enlace de activación" class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
        </label>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-white/70">Imágenes adicionales de galería (R2, se muestran después de la imagen principal)</span>
        <div v-for="(key, i) in imageKeys" :key="i" class="flex items-center gap-3">
          <img :src="product.images?.[i] || PLACEHOLDER_IMAGE" :alt="product.name" class="h-16 w-[3.2rem] shrink-0 rounded-lg border border-white/10 object-cover" />
          <input v-model="imageKeys[i]" type="text" placeholder="products/slug-2.png" class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
          <AppButton type="button" variant="ghost" size="sm" @click="imageKeys.splice(i, 1)">Quitar</AppButton>
        </div>
        <button type="button" class="self-start text-sm text-accent hover:text-accent-hover" @click="imageKeys.push('')">
          + Agregar imagen
        </button>
      </div>

      <label class="flex items-center gap-2 text-sm text-white/70">
        <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
        Producto activo
      </label>

      <div class="flex items-center gap-2">
        <AppButton type="submit" size="sm" :loading="saving" class="self-start">Guardar producto</AppButton>
        <span v-if="saved" class="text-xs text-emerald-300">Guardado ✓</span>
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          class="ml-auto self-start text-red-300 hover:border-red-400/60 hover:text-red-300"
          :loading="saving"
          @click="emit('deleteProduct')"
        >
          Eliminar producto
        </AppButton>
      </div>

      <div class="flex flex-col gap-2 border-t border-white/10 pt-4">
        <VariantRow
          v-for="variant in product.variants"
          :key="variant.id"
          :variant="variant"
          :saving="saving"
          @save="(body) => emit('saveVariant', variant.id, body)"
          @delete="emit('deleteVariant', variant.id)"
        />

        <button
          v-if="!showNewVariant"
          type="button"
          class="self-start text-sm text-accent hover:text-accent-hover"
          @click="showNewVariant = true"
        >
          + Agregar variante
        </button>

        <div v-else class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 p-3 text-sm">
          <input v-model="newVariant.region" type="text" placeholder="Región" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
          <input v-model="newVariant.edition" type="text" placeholder="Edición" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
          <input v-model.number="newVariant.basePrice" type="number" min="0" step="0.01" placeholder="Precio real" title="Precio real (sin descuento)" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
          <input v-model.number="newVariant.discountPercentage" type="number" min="0" max="99" step="1" placeholder="% off" class="h-9 w-20 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
          <select v-model="newVariant.currency" class="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent">
            <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
          </select>
          <span v-if="newVariant.discountPercentage" class="flex items-center gap-1.5 text-xs">
            <span class="text-white/40 line-through">{{ formatMoney(newVariant.basePrice, newVariant.currency) }}</span>
            <span class="font-semibold text-emerald-300">{{ formatMoney(newVariantFinalPrice, newVariant.currency) }}</span>
            <AppBadge tone="success">-{{ newVariant.discountPercentage }}%</AppBadge>
          </span>
          <AppButton type="button" size="sm" :loading="saving" @click="submitNewVariant()">Crear</AppButton>
          <AppButton type="button" variant="ghost" size="sm" @click="showNewVariant = false">Cancelar</AppButton>
        </div>
      </div>
    </form>
  </div>
</template>
