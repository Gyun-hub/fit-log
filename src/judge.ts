import type { Category, ClothingRecord } from './types'

const TOLERANCE_CM = 1

type FieldVerdict = 'short' | 'ok' | 'long' | 'tight' | 'loose'

export interface FieldResult {
  field: string
  target: number
  baseline: number
  diff: number
  sampleSize: number
  verdict: FieldVerdict
  label: string
}

export interface JudgeResult {
  overall: 'tight' | 'ok' | 'loose' | 'unknown'
  overallLabel: string
  fields: FieldResult[]
  usedFallback: boolean
}

function isLengthField(field: string): boolean {
  return field.includes('길이') || field.includes('총장') || field.includes('밑위')
}

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function judgeFit(
  category: Category,
  target: Record<string, number>,
  records: ClothingRecord[],
): JudgeResult {
  const sameCategory = records.filter((r) => r.category === category)
  let baseline = sameCategory.filter((r) => r.fitOverall === 'perfect')
  let usedFallback = false
  if (baseline.length === 0) {
    baseline = sameCategory
    usedFallback = true
  }

  const fields: FieldResult[] = []

  for (const [field, targetValue] of Object.entries(target)) {
    const samples = baseline
      .map((r) => r.measurements[field])
      .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))

    if (samples.length === 0) {
      fields.push({
        field,
        target: targetValue,
        baseline: NaN,
        diff: NaN,
        sampleSize: 0,
        verdict: 'ok',
        label: '비교 불가 (기준 데이터 없음)',
      })
      continue
    }

    const base = average(samples)
    const diff = targetValue - base
    const lengthType = isLengthField(field)

    let verdict: FieldVerdict = 'ok'
    let label = '적당'

    if (diff < -TOLERANCE_CM) {
      verdict = lengthType ? 'short' : 'tight'
      label = lengthType ? '짧음' : '타이트함'
    } else if (diff > TOLERANCE_CM) {
      verdict = lengthType ? 'long' : 'loose'
      label = lengthType ? '김' : '넉넉함'
    }

    fields.push({ field, target: targetValue, baseline: base, diff, sampleSize: samples.length, verdict, label })
  }

  const comparable = fields.filter((f) => f.sampleSize > 0)
  const tightCount = comparable.filter((f) => f.verdict === 'tight' || f.verdict === 'short').length
  const looseCount = comparable.filter((f) => f.verdict === 'loose' || f.verdict === 'long').length

  let overall: JudgeResult['overall'] = 'unknown'
  let overallLabel = '판정 불가 (기준 데이터 부족)'

  if (comparable.length > 0) {
    if (tightCount === 0 && looseCount === 0) {
      overall = 'ok'
      overallLabel = '적당함'
    } else if (tightCount > looseCount) {
      overall = 'tight'
      overallLabel = '타이트할 가능성 높음'
    } else if (looseCount > tightCount) {
      overall = 'loose'
      overallLabel = '넉넉할 가능성 높음'
    } else {
      overall = 'ok'
      overallLabel = '적당함 (판정 항목 혼재)'
    }
  }

  return { overall, overallLabel, fields, usedFallback }
}
