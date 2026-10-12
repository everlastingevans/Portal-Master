import { randomBytes } from 'crypto';

/**
 * Storage name for a user-uploaded file. The client's file name is untrusted: keep only a short,
 * safe base name (no directories, so "../" can't escape the upload folder) and add a random suffix
 * so stored keys and URLs can't be guessed from the user id and time.
 */
export function safeUploadName(userId: number | string, clientName: string | undefined | null, fallback = 'recording.webm'): string {
  const base = String(clientName || '')
    .split(/[\\/]/)
    .pop()!
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(-80);
  return `${userId}-${Date.now()}-${randomBytes(8).toString('hex')}-${base || fallback}`;
}
