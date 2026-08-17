import { supabaseEnabled } from '../supabaseClient'
import { getSyncCode, setSyncCode } from '../sync'
import { clearLocalCache } from '../storage'

export default function SyncBar() {
  if (!supabaseEnabled) return null
  const code = getSyncCode()
  if (!code) return null

  function handleDisconnect() {
    if (!confirm('동기화 해제할까요? 이 기기에 캐시된 이력은 삭제됩니다 (DB에는 그대로 남습니다).')) return
    setSyncCode(null)
    clearLocalCache()
    window.location.reload()
  }

  return (
    <div className="sync-bar">
      <span>동기화 코드: {code}</span>
      <button className="btn small" onClick={handleDisconnect}>
        연결 해제
      </button>
    </div>
  )
}
