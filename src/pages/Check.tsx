import { useMemo, useState } from 'react'
import type { Category } from '../types'
import { CATEGORIES, CATEGORY_FIELDS } from '../types'
import { loadRecords } from '../storage'
import { judgeFit } from '../judge'
import type { JudgeResult } from '../judge'

export default function Check() {
  const [category, setCategory] = useState<Category>('상의')
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<JudgeResult | null>(null)

  const records = useMemo(() => loadRecords(), [])
  const sameCategoryCount = records.filter((r) => r.category === category).length

  function handleCategoryChange(next: Category) {
    setCategory(next)
    setValues({})
    setResult(null)
  }

  function setField(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    const target: Record<string, number> = {}
    for (const [field, raw] of Object.entries(values)) {
      const num = Number(raw)
      if (raw !== '' && !Number.isNaN(num)) target[field] = num
    }
    setResult(judgeFit(category, target, records))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>새 옷 판정</h1>
      </div>

      <p className="hint">
        같은 카테고리({category}) 이력 {sameCategoryCount}건 보유. 사려는 옷의 실측 사이즈를 입력하면 내 이력과 비교해서 핏을 판정.
      </p>

      <form className="check-form" onSubmit={handleCheck}>
        <label className="category-select">
          카테고리
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="measure-grid">
          {CATEGORY_FIELDS[category].map((field) => (
            <label key={field}>
              {field}
              <input
                type="number"
                step="0.1"
                value={values[field] ?? ''}
                onChange={(e) => setField(field, e.target.value)}
              />
            </label>
          ))}
        </div>

        <button type="submit" className="btn primary">
          판정하기
        </button>
      </form>

      {result && (
        <div className="panel result-panel">
          <div className={`overall-verdict verdict-${result.overall}`}>{result.overallLabel}</div>
          {result.usedFallback && (
            <p className="hint">주의: '적당함'으로 표시된 이력이 없어 전체 이력 평균으로 비교함.</p>
          )}
          <table className="result-table">
            <thead>
              <tr>
                <th>항목</th>
                <th>입력값</th>
                <th>내 기준값</th>
                <th>차이</th>
                <th>판정</th>
              </tr>
            </thead>
            <tbody>
              {result.fields.map((f) => (
                <tr key={f.field}>
                  <td>{f.field}</td>
                  <td>{f.target}</td>
                  <td>{f.sampleSize > 0 ? f.baseline.toFixed(1) : '-'}</td>
                  <td>{f.sampleSize > 0 ? (f.diff > 0 ? `+${f.diff.toFixed(1)}` : f.diff.toFixed(1)) : '-'}</td>
                  <td>{f.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
