import { useState } from 'react'
import type { Category, ClothingRecord, FitOverall } from '../types'
import { CATEGORIES, CATEGORY_FIELDS, FIT_LABEL } from '../types'

interface Props {
  initial?: ClothingRecord
  onSubmit: (data: Omit<ClothingRecord, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

export default function RecordForm({ initial, onSubmit, onCancel }: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? '상의')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [sizeLabel, setSizeLabel] = useState(initial?.sizeLabel ?? '')
  const [measurements, setMeasurements] = useState<Record<string, number>>(initial?.measurements ?? {})
  const [fitOverall, setFitOverall] = useState<FitOverall>(initial?.fitOverall ?? 'perfect')
  const [fitNotes, setFitNotes] = useState(initial?.fitNotes ?? '')
  const [source, setSource] = useState(initial?.source ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '')
  const [productUrl, setProductUrl] = useState(initial?.productUrl ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [previewInfo, setPreviewInfo] = useState('')

  function handleCategoryChange(next: Category) {
    setCategory(next)
    setMeasurements({})
  }

  function setField(field: string, value: string) {
    const num = value === '' ? undefined : Number(value)
    setMeasurements((prev) => {
      const copy = { ...prev }
      if (num === undefined || Number.isNaN(num)) delete copy[field]
      else copy[field] = num
      return copy
    })
  }

  async function handleFetchPreview() {
    const trimmed = productUrl.trim()
    if (!trimmed) return
    setPreviewBusy(true)
    setPreviewError('')
    setPreviewInfo('')
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '가져오기 실패')
      if (data.image) setImageUrl(data.image)
      const infoParts = [data.title, data.price ? `${data.price}원` : ''].filter(Boolean)
      if (infoParts.length > 0) setPreviewInfo(infoParts.join(' · '))
      if (!data.image && infoParts.length === 0) setPreviewError('가져올 정보 없음 (사이트가 og 태그 미지원)')
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : '가져오기 실패')
    } finally {
      setPreviewBusy(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand.trim()) return
    onSubmit({
      category,
      brand: brand.trim(),
      sizeLabel: sizeLabel.trim(),
      measurements,
      fitOverall,
      fitNotes,
      source: source.trim(),
      purchaseDate,
      productUrl: productUrl.trim(),
      imageUrl: imageUrl.trim(),
    })
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          카테고리
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          브랜드
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="예: 유니클로" required />
        </label>
        <label>
          사이즈 표기
          <input value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)} placeholder="예: M, 95" />
        </label>
      </div>

      <fieldset className="measurements">
        <legend>실측 (cm)</legend>
        <div className="measure-grid">
          {CATEGORY_FIELDS[category].map((field) => (
            <label key={field}>
              {field}
              <input
                type="number"
                step="0.1"
                value={measurements[field] ?? ''}
                onChange={(e) => setField(field, e.target.value)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-row">
        <label>
          착용 결과
          <select value={fitOverall} onChange={(e) => setFitOverall(e.target.value as FitOverall)}>
            {(Object.keys(FIT_LABEL) as FitOverall[]).map((key) => (
              <option key={key} value={key}>
                {FIT_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <label>
          구매처
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="예: 무신사" />
        </label>
        <label>
          구매일
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </label>
      </div>

      <div className="form-row">
        <label>
          상품 URL
          <div className="url-fetch-row">
            <input
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
            />
            <button
              type="button"
              className="btn small"
              onClick={handleFetchPreview}
              disabled={previewBusy || !productUrl.trim()}
            >
              {previewBusy ? '가져오는 중...' : '가져오기'}
            </button>
          </div>
        </label>
        <label>
          이미지 URL
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>
      </div>
      {(previewInfo || previewError) && (
        <p className={previewError ? 'sync-error' : 'hint'}>{previewError || previewInfo}</p>
      )}

      <label className="notes">
        메모
        <textarea value={fitNotes} onChange={(e) => setFitNotes(e.target.value)} placeholder="예: 어깨는 맞는데 기장이 좀 짧음" />
      </label>

      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn primary">
          저장
        </button>
      </div>
    </form>
  )
}
