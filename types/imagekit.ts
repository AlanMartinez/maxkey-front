export type ImageKitFolder = '/products' | '/carousel'

export interface ImageKitAuthResponse {
  token: string
  signature: string
  expire: number
  publicKey: string
}
