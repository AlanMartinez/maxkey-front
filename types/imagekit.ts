export type ImageKitFolder = '/products' | '/carousel' | '/guides'

export interface ImageKitAuthResponse {
  token: string
  signature: string
  expire: number
  publicKey: string
}
