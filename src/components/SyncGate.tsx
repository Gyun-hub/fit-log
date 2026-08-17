import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabaseEnabled } from '../supabaseClient'
import { getSyncCode, setSyncCode, pullRecords, pushRecords } from '../sync'
import { setLocalCache } from '../storage'

interface Props {
  children: ReactNode
}

export default function SyncGate({ children }: Props) {
  const [ready, setReady] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const existing = getSyncCode()
    if (!existing || !supabaseEnabled) return
    let cancelled = false
    setBusy(true)
    pullRecords(existing)
      .then((remote) => {
        if (cancelled) return
        setLocalCache(remote ?? [])
        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setError('DB 연결 실패. 새로고침 해보거나 네트워크 확인.')
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!supabaseEnabled) {
    return (
      <div className="sync-gate">
        <p>Supabase 설정 안 됨 (.env.local 확인).</p>
      </div>
    )
  }

  if (ready) return <>{children}</>

  if (getSyncCode() && !error) {
    return (
      <div className="sync-gate">
        <p>불러오는 중...</p>
      </div>
    )
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setBusy(true)
    setError('')
    try {
      const remote = await pullRecords(trimmed)
      if (remote) {
        const proceed = confirm(`코드 "${trimmed}"에 저장된 이력 ${remote.length}건 발견. 불러올까요?`)
        if (!proceed) {
          setBusy(false)
          return
        }
        setLocalCache(remote)
      } else {
        const proceed = confirm(`코드 "${trimmed}"는 처음 쓰는 코드입니다. 새 동기화 그룹을 만들까요?`)
        if (!proceed) {
          setBusy(false)
          return
        }
        setLocalCache([])
        await pushRecords([])
      }
      setSyncCode(trimmed)
      setReady(true)
    } catch (err) {
      setError('연결 실패. 코드나 네트워크 확인.')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sync-gate">
      <form className="sync-gate-form" onSubmit={handleConnect}>
        <h1>Fit Log</h1>
        <p>동기화 코드를 입력하세요. 처음이면 원하는 번호를 정해서 입력하면 새로 시작됩니다.</p>
        <input
          placeholder="동기화 코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={busy}
        />
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? '연결 중...' : '시작하기'}
        </button>
        {error && <p className="sync-error">{error}</p>}
      </form>
    </div>
  )
}
