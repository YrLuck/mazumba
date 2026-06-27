import { getTokens } from './client'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export interface UploadedFile {
  id: string
  owner_id: string
  kind: string
  original_filename: string
  url: string
  mime_type: string
  size_bytes: number
  created_at: string
}

async function uploadMultipart<T>(path: string, file: File): Promise<T> {
  const { access } = getTokens()
  const form = new FormData()
  form.append('upload', file)
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: access ? { Authorization: `Bearer ${access}` } : {},
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Upload failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const uploadFile = (file: File) =>
  uploadMultipart<UploadedFile>('/files/upload', file)

export const uploadAvatar = (file: File) =>
  uploadMultipart<import('../types/api').UserPublic>('/files/avatar', file)
