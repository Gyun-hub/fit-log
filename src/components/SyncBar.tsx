import { useState } from 'react'
import { supabaseEnabled } from '../supabaseClient'
import { getSyncCode, setSyncCode, pullRecords, pushRecords } from '../sync'
import { loadRecords, saveRecords } from '../storage'

export default function SyncBar() {
  const [code, setCode] = useState(getSyncCode() ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const connected = getSyncCode() !== null

  if (!supabaseEnabled) return null

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setBusy(true)
    setError('')
    try {
      const remote = await pullRecords(trimmed)
      if (remote) {
        const proceed = confirm(
          `코드 "${trimmed}"에 저장된 이력 ${remote.length}건 발견. 불러오면 이 기기의 현재 이력은 덮어써짐. 계속할까?`,
        )
        if (!proceed) {
          setBusy(false)
          return
        }
        saveRecords(remote)
      } else {
        const proceed = confirm(`코드 "${trimmed}"는 처음 쓰는 코드임. 새 동기화 그룹을 만들까?`)
        if (!proceed) {
          setBusy(false)
          return
        }
        await pushRecords(loadRecords())
      }
      setSyncCode(trimmed)
      window.location.reload()
    } catch (err) {
      setError('연결 실패. 코드나 네트워크 확인.')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  function handleDisconnect() {
    if (!confirm('동기화 해제할까요? 이 기기에 저장된 이력은 그대로 남음.')) return
    setSyncCode(null)
    window.location.reload()
  }

  if (connected) {
    return (
      <div className="sync-bar">
        <span>동기화 코드: {getSyncCode()}</span>
        <button className="btn small" onClick={handleDisconnect}>
          연결 해제
        </button>
      </div>
    )
  }

  return (
    <form className="sync-bar" onSubmit={handleConnect}>
      <input
        placeholder="동기화 코드 입력"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={busy}
      />
      <button className="btn small" type="submit" disabled={busy}>
        {busy ? '연결 중...' : '연결'}
      </button>
      {error && <span className="sync-error">{error}</span>}
    </form>
  )
}
