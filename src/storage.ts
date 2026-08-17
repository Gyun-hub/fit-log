import type { ClothingRecord } from './types'
import { isSyncActive, pushRecords } from './sync'

const RECORDS_KEY = 'fitlog_records'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function loadRecords(): ClothingRecord[] {
  const raw = localStorage.getItem(RECORDS_KEY)
  if (!raw) return []
  return JSON.parse(raw) as ClothingRecord[]
}

export function saveRecords(records: ClothingRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  if (isSyncActive()) {
    pushRecords(records).catch((err) => {
      console.error('sync push failed', err)
      alert('저장 실패: 서버에 반영되지 않았습니다. 네트워크 확인 후 다시 시도하세요.')
    })
  }
}

export function setLocalCache(records: ClothingRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

export function clearLocalCache(): void {
  localStorage.removeItem(RECORDS_KEY)
}

export function createRecord(data: Omit<ClothingRecord, 'id' | 'createdAt'>): ClothingRecord {
  const records = loadRecords()
  const record: ClothingRecord = { ...data, id: uid(), createdAt: new Date().toISOString() }
  records.unshift(record)
  saveRecords(records)
  return record
}

export function updateRecord(id: string, data: Partial<Omit<ClothingRecord, 'id'>>): void {
  const records = loadRecords()
  const idx = records.findIndex((r) => r.id === id)
  if (idx === -1) return
  records[idx] = { ...records[idx], ...data }
  saveRecords(records)
}

export function deleteRecord(id: string): void {
  saveRecords(loadRecords().filter((r) => r.id !== id))
}
