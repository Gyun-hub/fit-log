import { useNavigate } from 'react-router-dom'
import type { ClothingRecord } from '../types'
import { createRecord } from '../storage'
import RecordForm from './RecordForm'

export default function RecordNew() {
  const navigate = useNavigate()

  function handleCreate(data: Omit<ClothingRecord, 'id' | 'createdAt'>) {
    createRecord(data)
    navigate('/')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>이력 등록</h1>
      </div>
      <div className="panel">
        <RecordForm onSubmit={handleCreate} onCancel={() => navigate('/')} submitLabel="저장" />
      </div>
    </div>
  )
}
