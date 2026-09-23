<script setup lang="ts">
import { upload } from '@imagekit/vue'
import type { ImageKitAuthResponse, ImageKitFolder } from '~/types/imagekit'

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

const props = withDefaults(defineProps<{
  folder: ImageKitFolder
  multiple?: boolean
  disabled?: boolean
}>(), { multiple: false, disabled: false })

const emit = defineEmits<{ uploaded: [filePath: string] }>()

const api = useApi()
const input = ref<HTMLInputElement>()
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const previewUrls = ref<string[]>([])

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

async function uploadFiles(files: File[]) {
  if (!files.length || uploading.value || props.disabled) return

  const selectedFiles = props.multiple ? files : files.slice(0, 1)
  error.value = ''
  const invalidFile = selectedFiles.find(validationError)
  if (invalidFile) {
    error.value = validationError(invalidFile)!
    return
  }

  clearPreviews()
  previewUrls.value = selectedFiles.map((file) => URL.createObjectURL(file))
  uploading.value = true
  progress.value = 0

  try {
    for (let index = 0; index < selectedFiles.length; index++) {
      const file = selectedFiles[index]!
      let auth: ImageKitAuthResponse
      try {
        auth = await api<ImageKitAuthResponse>('/admin/media/imagekit-auth', { method: 'GET' })
      } catch (cause) {
        error.value = authErrorMessage(cause)
        return
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
          progress.value = Math.round(((index + perFile) / selectedFiles.length) * 100)
        },
      })

      if (!result.filePath?.trim()) {
        error.value = 'No se pudo obtener la ruta de la imagen subida.'
        return
      }
      emit('uploaded', result.filePath)
    }
  } catch {
    error.value = 'No se pudo subir la imagen. Reintentá.'
  } finally {
    uploading.value = false
    progress.value = 0
    if (input.value) input.value.value = ''
  }
}

function onInputChange(event: Event) {
  void uploadFiles(Array.from((event.target as HTMLInputElement).files ?? []))
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  void uploadFiles(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <section class="space-y-3" aria-label="Subir imagen">
    <input
      ref="input"
      type="file"
      accept="image/*"
      :multiple="multiple"
      :disabled="disabled"
      class="sr-only"
      @change="onInputChange"
    />
    <div
      class="rounded-xl border border-dashed border-white/30 p-4 text-center text-sm text-white/70"
      :class="{ 'border-accent bg-accent/10': uploading, 'cursor-not-allowed opacity-60': disabled }"
      :aria-disabled="disabled || uploading"
      @dragover.prevent
      @drop="onDrop"
    >
      <p>Arrastrá imágenes acá o</p>
      <button type="button" class="mt-2 text-accent underline" :disabled="uploading || disabled" @click="input?.click()">
        seleccionar archivo
      </button>
      <p class="mt-2 text-xs">JPG, PNG, WEBP u otro formato de imagen. Máximo 20 MB.</p>
    </div>

    <div v-if="uploading" class="space-y-1" role="status" aria-live="polite">
      <div class="h-2 overflow-hidden rounded bg-white/10"><div class="h-full bg-accent" :style="{ width: `${progress}%` }" /></div>
      <p class="text-xs text-white/70">Subiendo {{ progress }}%</p>
    </div>

    <p v-if="error" role="alert" class="text-sm text-red-300">{{ error }}</p>

    <div v-if="previewUrls.length" class="flex flex-wrap gap-2" aria-label="Vista previa">
      <img v-for="url in previewUrls" :key="url" :src="url" alt="Vista previa de imagen" class="h-20 w-20 rounded-lg object-cover" />
    </div>
  </section>
</template>
