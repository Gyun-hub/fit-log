import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClothingRecord } from '../types'
import { FIT_LABEL } from '../types'
import { loadRecords } from '../storage'

export default function History() {
  const [records] = useState<ClothingRecord[]>(() => loadRecords())
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const visibleRecords = useMemo(() => {
    return records.filter((r) => {
      if (dateFrom && (!r.purchaseDate || r.purchaseDate < dateFrom)) return false
      if (dateTo && (!r.purchaseDate || r.purchaseDate > dateTo)) return false
      return true
    })
  }, [records, dateFrom, dateTo])

  return (
    <div className="page">
      <div className="page-header">
        <h1>내 옷 이력</h1>
        <Link to="/new" className="btn primary">
          + 이력 등록
        </Link>
      </div>

      <div className="date-filter">
        <label>
          구매일 시작
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          구매일 끝
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            className="btn small"
            onClick={() => {
              setDateFrom('')
              setDateTo('')
            }}
          >
            초기화
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="empty">등록된 옷 이력이 없음. 위 버튼으로 추가.</p>
      ) : visibleRecords.length === 0 ? (
        <p className="empty">해당 기간에 등록된 이력이 없음.</p>
      ) : (
        <div className="record-list">
          {visibleRecords.map((r) => (
            <Link key={r.id} to={`/record/${r.id}`} className="record-card record-card-link">
              <div className="record-card-head">
                {r.imageUrl && <img className="record-thumb" src={r.imageUrl} alt={r.brand} />}
                <span className="tag">{r.category}</span>
                <strong>{r.brand}</strong>
                <span className="size-label">{r.sizeLabel}</span>
                <span className={`fit-badge fit-${r.fitOverall}`}>{FIT_LABEL[r.fitOverall]}</span>
              </div>
              <div className="measure-summary">
                {Object.entries(r.measurements).map(([field, value]) => (
                  <span key={field}>
                    {field} {value}
                  </span>
                ))}
              </div>
              {r.fitNotes && <p className="notes-text">{r.fitNotes}</p>}
              <div className="record-card-foot">
                <span>
                  {r.source} {r.purchaseDate}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
