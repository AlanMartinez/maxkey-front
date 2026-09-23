<script setup lang="ts">
import { upload } from '@imagekit/vue'
import type { ImageKitAuthResponse, ImageKitFolder } from '~/types/imagekit'

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

const props = withDefaults(defineProps<{
  folder: ImageKitFolder
  multiple?: boolean
  disabled?: boolean
  label?: string
  compact?: boolean
}>(), { multiple: false, disabled: false, label: 'Subir imagen', compact: false })

const emit = defineEmits<{
  uploaded: [filePath: string]
  preview: [urls: string[]]
  register: [uploadSelected: () => Promise<string[]>]
}>()

const api = useApi()
const input = ref<HTMLInputElement>()
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const previewUrls = ref<string[]>([])
const selectedFiles = ref<File[]>([])

function clearPreviews() {
  for (const url of previewUrls.value) URL.revokeObjectURL(url)
  previewUrls.value = []
}

onUnmounted(clearPreviews)

function validationError(file: File): string | undefined {
  if (!file.type.startsWith('image/')) return 'Solo podés subir imágenes.'
  if (file.size > MAX_FILE_SIZE_BYTES) return 'La imagen supera el máximo de 20 MB.'
}

function authErrorMessage(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: unknown }).status
    : undefined

  if (status === 401 || status === 403) return 'No tenés permisos para subir imágenes.'
  if (status === 500) return 'ImageKit no está configurado en el servidor.'
  return 'No se pudo preparar la subida. Reintentá.'
}

function stageFiles(files: File[]) {
  if (!files.length || uploading.value || props.disabled) return

  const acceptedFiles = props.multiple ? files : files.slice(0, 1)
  error.value = ''
  const invalidFile = acceptedFiles.find(validationError)
  if (invalidFile) {
    error.value = validationError(invalidFile)!
    return
  }

  clearPreviews()
  selectedFiles.value = acceptedFiles
  previewUrls.value = acceptedFiles.map((file) => URL.createObjectURL(file))
  emit('preview', previewUrls.value)
}

async function uploadSelected(): Promise<string[]> {
  if (!selectedFiles.value.length || uploading.value || props.disabled) return []
  const uploadedPaths: string[] = []
  error.value = ''
  uploading.value = true
  progress.value = 0

  try {
    for (let index = 0; index < selectedFiles.value.length; index++) {
      const file = selectedFiles.value[index]!
      let auth: ImageKitAuthResponse
      try {
        auth = await api<ImageKitAuthResponse>('/admin/media/imagekit-auth', { method: 'GET' })
      } catch (cause) {
        error.value = authErrorMessage(cause)
        throw new Error(error.value)
      }

      const result = await upload({
        file,
        fileName: file.name,
        folder: props.folder,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
        onProgress: (event) => {
          const perFile = event.total ? event.loaded / event.total : 0
          progress.value = Math.round(((index + perFile) / selectedFiles.value.length) * 100)
        },
      })

      if (!result.filePath?.trim()) {
        error.value = 'No se pudo obtener la ruta de la imagen subida.'
        throw new Error(error.value)
      }
      const filePath = result.filePath.replace(/^\/+/, '')

      try {
        await api('/admin/media/imagekit-assets', {
          method: 'POST',
          body: { filePath },
        })
      } catch {
        error.value = 'No se pudo registrar la imagen subida.'
        throw new Error(error.value)
      }

      uploadedPaths.push(filePath)
      emit('uploaded', filePath)
    }
    selectedFiles.value = []
    return uploadedPaths
  } catch {
    if (!error.value) error.value = 'No se pudo subir la imagen.'
    throw new Error(error.value)
  } finally {
    uploading.value = false
    progress.value = 0
    if (input.value) input.value.value = ''
  }
}

function onInputChange(event: Event) {
  stageFiles(Array.from((event.target as HTMLInputElement).files ?? []))
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  stageFiles(Array.from(event.dataTransfer?.files ?? []))
}

defineExpose({ uploadSelected })
onMounted(() => emit('register', uploadSelected))
</script>

<template>
  <section class="flex flex-wrap items-center gap-2" aria-label="Subir imagen">
    <input
      ref="input"
      type="file"
      accept="image/*"
      :multiple="multiple"
      :disabled="disabled"
      class="sr-only"
      @change="onInputChange"
    />
    <button
      data-testid="image-upload-picker"
      type="button"
      class="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/30 bg-white/[0.025] text-center text-xs text-white/65 transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      :class="[
        compact ? 'h-9 px-3 font-medium' : 'h-20 w-20 flex-col px-1',
        { 'border-accent bg-accent/10': uploading, 'cursor-not-allowed opacity-60': disabled },
      ]"
      :disabled="uploading || disabled"
      :aria-disabled="disabled || uploading"
      aria-label="Subir imagen"
      @click="input?.click()"
      @dragover.prevent
      @drop="onDrop"
    >
      <template v-if="previewUrls[0] && !compact">
        <img :src="previewUrls[0]" alt="Vista previa de imagen" class="absolute inset-0 h-full w-full object-cover" />
        <span class="relative bg-black/65 px-1 py-0.5 text-[10px] text-white">Cambiar</span>
      </template>
      <template v-else>
        <span v-if="!compact" class="text-lg leading-none">+</span>
        <span>{{ label }}</span>
        <span v-if="!compact" class="text-[10px] text-white/40">20 MB</span>
      </template>
    </button>

    <div v-if="uploading" class="w-20 space-y-1" role="status" aria-live="polite">
      <div class="h-1 overflow-hidden rounded bg-white/10"><div class="h-full bg-accent" :style="{ width: `${progress}%` }" /></div>
      <p class="text-center text-[10px] text-white/70">{{ progress }}%</p>
    </div>

    <p v-if="error" role="alert" class="max-w-56 text-xs text-red-300">{{ error }}</p>

    <div v-if="previewUrls.length > 1" class="flex flex-wrap gap-2" aria-label="Vistas previas adicionales">
      <img v-for="url in previewUrls.slice(1)" :key="url" :src="url" alt="Vista previa de imagen" class="h-20 w-20 rounded-lg object-cover" />
    </div>
  </section>
</template>
