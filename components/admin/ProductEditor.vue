<script setup lang="ts">
import type { AdminCurrency, AdminProduct, CreateProductVariantRequest, GuideDto, UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'
import { PLACEHOLDER_IMAGE } from '~/utils/productImage'
import { PLATFORMS, findPlatform } from '~/utils/platforms'
import { PRODUCT_TYPES } from '~/utils/productTypes'

const props = defineProps<{ product: AdminProduct; guides: GuideDto[]; saving: boolean; initiallyExpanded?: boolean }>()
const emit = defineEmits<{
  save: [body: UpdateProductRequest]
  saveVariant: [variantId: string, body: UpdateProductVariantRequest]
  deleteProduct: []
  deleteVariant: [variantId: string]
  createVariant: [body: CreateProductVariantRequest]
}>()

// Collapsed by default so the list stays scannable with many products; click the header to expand.
// initiallyExpanded lets /admin/catalog?product=<id> (coming from the "Ver en Catálogo" Vault link) open pre-expanded.
const expanded = ref(props.initiallyExpanded ?? false)

// Name/platform/description/imageKey/isActive are the editable fields (design D3 UI scope); PUT
// takes the full record. Slug is editable too — renaming it breaks any bookmarked or previously
// shared /product/{slug} link.
const slug = ref(props.product.slug)
const name = ref(props.product.name)
const platform = ref(props.product.platform)
// Products created before the platform enum may hold a free-text value; keep it as an extra option
// so the select shows the real stored value instead of silently swapping it on save.
const platformOptions = computed(() =>
  findPlatform(platform.value) ? PLATFORMS : [{ value: platform.value, logo: '' }, ...PLATFORMS],
)
const description = ref(props.product.description)
const imageKey = ref(props.product.imageKey ?? '')
const activationGuideId = ref(props.product.activationGuideId ?? '')
const activationType = ref(props.product.activationType ?? '')
const imageKeys = ref<string[]>([...(props.product.imageKeys ?? [])])
const coverPreview = ref<string | null>(null)
const galleryPreviews = ref<string[]>([])
type DeferredUpload = { uploadSelected: () => Promise<string[]> }
const coverUpload = ref<DeferredUpload>()
const galleryUpload = ref<DeferredUpload>()
const uploadingMedia = ref(false)
const isActive = ref(props.product.isActive)
const saved = ref(false)

// One row per existing variant; ProductEditor reads each row's current field state on submit
// instead of the row saving itself — there is a single "Guardar producto" action now.
type VariantRowHandle = { getBody: () => UpdateProductVariantRequest }
const variantRows = ref<Record<string, VariantRowHandle>>({})
function registerVariantRow(variantId: string, el: VariantRowHandle | null) {
  if (el) variantRows.value[variantId] = el
  else delete variantRows.value[variantId]
}

let savedTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(savedTimer))

watch(() => props.product, (product) => {
  slug.value = product.slug
  name.value = product.name
  platform.value = product.platform
  description.value = product.description
  imageKey.value = product.imageKey ?? ''
  activationGuideId.value = product.activationGuideId ?? ''
  activationType.value = product.activationType ?? ''
  imageKeys.value = [...(product.imageKeys ?? [])]
  coverPreview.value = null
  galleryPreviews.value = []
  isActive.value = product.isActive
})

function setCoverPreview(urls: string[]) {
  coverPreview.value = urls[0] ?? null
}

function setGalleryPreviews(urls: string[]) {
  galleryPreviews.value = urls
}

async function submit() {
  if (uploadingMedia.value) return
  uploadingMedia.value = true
  try {
    const [coverPaths, galleryPaths] = await Promise.all([
      coverUpload.value?.uploadSelected() ?? Promise.resolve([]),
      galleryUpload.value?.uploadSelected() ?? Promise.resolve([]),
    ])
    if (coverPaths[0]) imageKey.value = coverPaths[0]
    imageKeys.value.push(...galleryPaths)
  emit('save', {
    slug: slug.value.trim().toLowerCase(),
    name: name.value,
    platform: platform.value,
    description: description.value,
    imageKey: imageKey.value || undefined,
    activationGuideId: activationGuideId.value || null,
    activationType: activationType.value || null,
    imageKeys: imageKeys.value.map((k) => k.trim()).filter(Boolean),
    isActive: isActive.value,
  })
  for (const variant of props.product.variants) {
    const row = variantRows.value[variant.id]
    if (row) emit('saveVariant', variant.id, row.getBody())
  }
  saved.value = true
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => (saved.value = false), 2000)
  } catch {
    // AdminImageUpload renders upload error; do not persist partial media keys.
  } finally {
    uploadingMedia.value = false
  }
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
  <div :id="`catalog-product-${product.id}`" class="glass flex flex-col gap-4 rounded-2xl p-6" :class="{ 'opacity-50': !product.isActive }">
    <div class="flex items-center justify-between gap-3">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="expanded = !expanded">
        <img :src="product.imageUrl || PLACEHOLDER_IMAGE" :alt="product.name" class="h-14 w-11 shrink-0 rounded-lg object-cover" />
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold">{{ product.name }}</h2>
          <p class="flex items-center gap-1.5 truncate text-xs text-white/50">{{ product.slug }} · <PlatformLogo :platform="product.platform" /> · {{ product.variants.length }} variante(s)</p>
        </div>
      </button>
      <div class="flex shrink-0 items-center gap-3">
        <NuxtLink :to="`/admin/vault?product=${product.id}`" class="text-sm text-accent hover:text-accent-hover">Ver en Vault →</NuxtLink>
        <AppBadge :tone="isActive ? 'success' : 'neutral'">{{ isActive ? 'Activo' : 'Inactivo' }}</AppBadge>
        <button type="button" class="text-white/50 transition" :class="{ 'rotate-180': expanded }" @click="expanded = !expanded">⌄</button>
      </div>
    </div>

    <form v-if="expanded" class="flex flex-col gap-4" @submit.prevent="submit">
      <section role="group" :aria-labelledby="`product-details-title-${product.id}`" class="rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <h3 :id="`product-details-title-${product.id}`" class="mb-3 text-sm font-semibold text-white">Información básica</h3>
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(12rem,.8fr)]">
          <label class="flex min-w-0 flex-col gap-2 text-sm">
            <span class="text-white/70">Slug (URL: /product/…)</span>
            <input v-model="slug" name="slug" type="text" required pattern="[a-z0-9-]+" class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
            <span class="text-xs text-amber-300/80">Cambiarlo rompe links compartidos o indexados.</span>
          </label>

          <label class="flex min-w-0 flex-col gap-2 text-sm">
            <span class="text-white/70">Nombre</span>
            <input v-model="name" name="name" type="text" required class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
          </label>

          <label class="flex min-w-0 flex-col gap-2 text-sm">
            <span class="text-white/70">Plataforma</span>
            <select v-model="platform" name="platform" required class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent">
              <option v-for="option in platformOptions" :key="option.value" :value="option.value">{{ option.value }}</option>
            </select>
          </label>
        </div>
      </section>

      <section :aria-labelledby="`product-description-title-${product.id}`" class="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm">
        <div>
          <h3 :id="`product-description-title-${product.id}`" class="font-semibold text-white">Descripción</h3>
          <p class="mt-1 text-xs text-white/45">Contenido visible en la ficha del producto.</p>
        </div>
        <MarkdownEditor v-model="description" label="Descripción (admite Markdown: **negrita**, *cursiva*, listas)" />
      </section>

      <section :aria-labelledby="`product-images-title-${product.id}`" class="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div>
          <h3 :id="`product-images-title-${product.id}`" class="text-sm font-semibold text-white">Imágenes</h3>
          <p class="mt-1 text-xs text-white/45">Portada para catálogo y galería para ficha de producto.</p>
        </div>

        <div data-testid="catalog-cover" class="flex items-center gap-4">
          <img :src="coverPreview || product.imageUrl || PLACEHOLDER_IMAGE" :alt="`Portada de ${product.name}`" class="h-32 w-24 shrink-0 rounded-xl border border-white/10 object-cover" />
          <div class="flex flex-col items-start gap-2">
            <div>
              <h4 class="text-sm font-medium text-white">Portada de catálogo</h4>
              <p class="mt-1 text-xs text-white/45">Formato vertical 3:4.</p>
            </div>
            <AdminImageUpload ref="coverUpload" folder="/products" label="Cambiar portada" compact :disabled="saving || uploadingMedia" @preview="setCoverPreview" @register="coverUpload = { uploadSelected: $event }" />
          </div>
        </div>

        <div data-testid="product-gallery" class="border-t border-white/10 pt-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="mr-auto">
              <h4 class="text-sm font-medium text-white">Galería de producto</h4>
              <p class="mt-1 text-xs text-white/45">Miniaturas cuadradas para ficha y carrusel del producto.</p>
            </div>
            <AdminImageUpload ref="galleryUpload" folder="/products" label="Agregar imágenes" compact multiple :disabled="saving || uploadingMedia" @preview="setGalleryPreviews" @register="galleryUpload = { uploadSelected: $event }" />
          </div>
          <div v-if="galleryPreviews.length || imageKeys.length" class="mt-3 flex flex-wrap gap-3">
            <img v-for="url in galleryPreviews" :key="url" :src="url" alt="Vista previa de galería" class="h-20 w-20 rounded-lg border border-white/10 object-cover" />
            <div v-for="(_, i) in imageKeys" :key="`saved-${i}`" class="group relative h-20 w-20">
              <img :src="product.images?.[i] || PLACEHOLDER_IMAGE" :alt="`${product.name}, imagen adicional ${i + 1}`" class="h-20 w-20 rounded-lg border border-white/10 object-cover" />
              <button type="button" :aria-label="`Quitar imagen adicional ${i + 1}`" class="absolute -right-1 -top-1 hidden h-5 w-5 rounded-full bg-black/80 text-xs text-white group-hover:block focus:block" @click="imageKeys.splice(i, 1)">×</button>
            </div>
          </div>
        </div>
      </section>

      <section :aria-labelledby="`product-activation-title-${product.id}`" class="rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <h3 :id="`product-activation-title-${product.id}`" class="mb-3 text-sm font-semibold text-white">Activación</h3>
        <div class="flex flex-col gap-4">
          <div class="grid gap-4 md:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] md:items-end">
            <label class="flex min-w-0 flex-col gap-2 text-sm">
              <span class="text-white/70">Tipo</span>
              <select v-model="activationType" class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent">
                <option value="">Sin definir</option>
                <option v-for="option in PRODUCT_TYPES" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label class="flex min-w-0 flex-col gap-2 text-sm">
              <span class="text-white/70">Guía de activación</span>
              <select v-model="activationGuideId" name="activationGuideId" class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent">
                <option value="">Sin guía</option>
                <option v-for="guide in guides" :key="guide.id" :value="guide.id">{{ guide.title }}</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section :aria-labelledby="`product-variants-title-${product.id}`" class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 :id="`product-variants-title-${product.id}`" class="text-sm font-semibold text-white">Variantes</h3>
            <p class="mt-1 text-xs text-white/45">Precio, descuento y disponibilidad por producto.</p>
          </div>
          <button
            v-if="!showNewVariant && !product.variants.length"
            type="button"
            class="shrink-0 rounded-lg border border-accent/30 px-3 py-1.5 text-sm font-medium text-accent transition hover:border-accent/60 hover:bg-accent/10 hover:text-accent-hover"
            @click="showNewVariant = true"
          >
            + Agregar variante
          </button>
        </div>

        <!-- Every product has exactly one variant now, and it is always the recommended one — see
             VariantRow.getBody(). The "+ Agregar variante" form above only shows while there is none. -->
        <div aria-label="Lista de variantes" class="flex flex-col gap-2 overflow-x-auto pb-1">
          <VariantRow
            v-for="variant in product.variants"
            :key="variant.id"
            :ref="(el) => registerVariantRow(variant.id, el as unknown as VariantRowHandle | null)"
            :variant="variant"
            :saving="saving"
            @delete="emit('deleteVariant', variant.id)"
          />

          <div v-if="showNewVariant && !product.variants.length" role="group" aria-label="Nueva variante" class="flex min-w-max flex-nowrap items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 p-3 text-sm">
            <input v-model="newVariant.region" type="text" aria-label="Región" placeholder="Región" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
            <input v-model="newVariant.edition" type="text" aria-label="Edición" placeholder="Edición" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
            <input v-model.number="newVariant.basePrice" type="number" min="0" step="0.01" aria-label="Precio real" placeholder="Precio real" title="Precio real (sin descuento)" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
            <input v-model.number="newVariant.discountPercentage" type="number" min="0" max="99" step="1" aria-label="Descuento porcentual" placeholder="% off" class="h-9 w-20 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
            <select v-model="newVariant.currency" aria-label="Moneda" class="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent">
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
      </section>

      <div class="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <label class="flex items-center gap-2 text-sm text-white/70">
          <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
          Producto activo
        </label>
        <AppButton type="submit" size="sm" :loading="saving">Guardar producto</AppButton>
        <span v-if="saved" class="text-xs text-emerald-300">Guardado ✓</span>
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          class="ml-auto text-red-300 hover:border-red-400/60 hover:text-red-300"
          :loading="saving"
          @click="emit('deleteProduct')"
        >
          Eliminar producto
        </AppButton>
      </div>
    </form>
  </div>
</template>
