import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ClothingRecord } from '../types'
import { FIT_LABEL } from '../types'
import { loadRecords, updateRecord, deleteRecord } from '../storage'
import RecordForm from './RecordForm'

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record] = useState<ClothingRecord | undefined>(() => loadRecords().find((r) => r.id === id))
  const [editing, setEditing] = useState(false)

  if (!record) {
    return (
      <div className="page">
        <p className="empty">이력을 찾을 수 없음.</p>
        <Link to="/" className="btn secondary">
          목록으로
        </Link>
      </div>
    )
  }

  function handleUpdate(data: Omit<ClothingRecord, 'id' | 'createdAt'>) {
    if (!record) return
    updateRecord(record.id, data)
    navigate('/')
  }

  function handleDelete() {
    if (!record) return
    if (!confirm('이 이력을 삭제할까요?')) return
    deleteRecord(record.id)
    navigate('/')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{editing ? '이력 수정' : '이력 상세'}</h1>
        {!editing && (
          <div className="record-actions">
            <button className="btn small" onClick={() => setEditing(true)}>
              수정
            </button>
            <button className="btn small danger" onClick={handleDelete}>
              삭제
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="panel">
          <RecordForm
            initial={record}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="수정 완료"
          />
        </div>
      ) : (
        <div className="panel record-detail">
          <div className="record-card-head">
            {record.imageUrl && <img className="record-thumb" src={record.imageUrl} alt={record.brand} />}
            <span className="tag">{record.category}</span>
            <strong>{record.brand}</strong>
            <span className="size-label">{record.sizeLabel}</span>
            <span className={`fit-badge fit-${record.fitOverall}`}>{FIT_LABEL[record.fitOverall]}</span>
          </div>
          <div className="measure-summary">
            {Object.entries(record.measurements).map(([field, value]) => (
              <span key={field}>
                {field} {value}
              </span>
            ))}
          </div>
          {record.fitNotes && <p className="notes-text">{record.fitNotes}</p>}
          <p className="hint">
            {record.source} {record.purchaseDate}
            {record.productUrl && (
              <>
                {' '}
                ·{' '}
                <a href={record.productUrl} target="_blank" rel="noreferrer">
                  상품 링크
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
