import type { ClothingRecord } from './types'
import { supabase, supabaseEnabled } from './supabaseClient'

const SYNC_CODE_KEY = 'fitlog_sync_code'
const TABLE = 'fitlog_sync'

export function getSyncCode(): string | null {
  return localStorage.getItem(SYNC_CODE_KEY)
}

export function setSyncCode(code: string | null): void {
  if (code) localStorage.setItem(SYNC_CODE_KEY, code)
  else localStorage.removeItem(SYNC_CODE_KEY)
}

export function isSyncActive(): boolean {
  return supabaseEnabled && getSyncCode() !== null
}

export async function pushRecords(records: ClothingRecord[]): Promise<void> {
  const code = getSyncCode()
  if (!supabase || !code) return
  const { error } = await supabase
    .from(TABLE)
    .upsert({ sync_key: code, records, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function pullRecords(code: string): Promise<ClothingRecord[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from(TABLE).select('records').eq('sync_key', code).maybeSingle()
  if (error) throw error
  return data ? (data.records as ClothingRecord[]) : null
}
