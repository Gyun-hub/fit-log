export type Category = '상의' | '하의' | '아우터' | '원피스'

export const CATEGORIES: Category[] = ['상의', '하의', '아우터', '원피스']

export const CATEGORY_FIELDS: Record<Category, string[]> = {
  상의: ['어깨너비', '가슴단면', '총장', '소매길이'],
  하의: ['허리단면', '엉덩이단면', '허벅지단면', '밑위', '총장'],
  아우터: ['어깨너비', '가슴단면', '총장', '소매길이'],
  원피스: ['어깨너비', '가슴단면', '허리단면', '총장'],
}

export type FitOverall = 'tight' | 'perfect' | 'loose'

export const FIT_LABEL: Record<FitOverall, string> = {
  tight: '타이트함',
  perfect: '적당함',
  loose: '넉넉함',
}

export interface ClothingRecord {
  id: string
  category: Category
  brand: string
  sizeLabel: string
  measurements: Record<string, number>
  fitOverall: FitOverall
  fitNotes: string
  source: string
  purchaseDate: string
  productUrl: string
  imageUrl: string
  createdAt: string
}
