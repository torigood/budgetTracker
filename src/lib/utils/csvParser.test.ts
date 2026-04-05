import { describe, it, expect } from 'vitest'
import { parseCsvRow, parseRawRow, normalizePayment, MAX_CSV_ROWS } from './csvParser'

// ── parseCsvRow ──────────────────────────────────────────────────────────────
describe('parseCsvRow', () => {
  it('일반 행을 올바르게 파싱', () => {
    expect(parseCsvRow('2026-01-01,지출,식비,마트,32.50,크레딧,메모'))
      .toEqual(['2026-01-01', '지출', '식비', '마트', '32.50', '크레딧', '메모'])
  })

  it('따옴표로 감싼 필드 처리', () => {
    expect(parseCsvRow('"2026-01-01","지출","식비","마트, 대형",32.50,크레딧,'))
      .toEqual(['2026-01-01', '지출', '식비', '마트, 대형', '32.50', '크레딧', ''])
  })

  it('이스케이프된 따옴표("") 처리', () => {
    const result = parseCsvRow('2026-01-01,지출,식비,"Tim ""Hortons""",5.00,크레딧,')
    expect(result[3]).toBe('Tim "Hortons"')
  })

  it('쉼표가 포함된 금액 파싱', () => {
    expect(parseCsvRow('2026-01-01,지출,식비,마트,"1,234.56",크레딧,'))
      .toContain('1,234.56')
  })
})

// ── parseRawRow ──────────────────────────────────────────────────────────────
describe('parseRawRow - 유효한 행', () => {
  it('정상 지출 행 파싱', () => {
    const cols = ['2026-01-15', '지출', '식비', '마트', '32.50', '크레딧', '메모']
    const result = parseRawRow(cols)
    expect(result).not.toBeNull()
    expect(result?.date).toBe('2026-01-15')
    expect(result?.type).toBe('지출')
    expect(result?.amount).toBe(32.5)
  })

  it('정상 수입 행 파싱', () => {
    const cols = ['2026-03-01', '수입', '급여', '월급', '3000', '크레딧', '']
    const result = parseRawRow(cols)
    expect(result?.type).toBe('수입')
    expect(result?.amount).toBe(3000)
  })

  it('쉼표 포함 금액 파싱', () => {
    const cols = ['2026-01-01', '지출', '식비', '마트', '1,234.56', '크레딧', '']
    const result = parseRawRow(cols)
    expect(result?.amount).toBe(1234.56)
  })
})

describe('parseRawRow - 날짜 검증', () => {
  it('날짜 형식이 틀리면 null 반환', () => {
    const cols = ['01/15/2026', '지출', '식비', '마트', '32.50', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })

  it('존재하지 않는 월(13월)이면 null 반환', () => {
    const cols = ['2026-13-01', '지출', '식비', '마트', '32.50', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })

  it('존재하지 않는 일(45일)이면 null 반환', () => {
    const cols = ['2026-01-45', '지출', '식비', '마트', '32.50', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })

  it('2월 30일이면 null 반환', () => {
    const cols = ['2026-02-30', '지출', '식비', '마트', '32.50', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })
})

describe('parseRawRow - 금액 검증', () => {
  it('음수 금액이면 null 반환', () => {
    const cols = ['2026-01-01', '지출', '식비', '마트', '-32.50', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })

  it('0이면 null 반환', () => {
    const cols = ['2026-01-01', '지출', '식비', '마트', '0', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })

  it('숫자가 아니면 null 반환', () => {
    const cols = ['2026-01-01', '지출', '식비', '마트', 'abc', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })

  it('Infinity면 null 반환', () => {
    const cols = ['2026-01-01', '지출', '식비', '마트', 'Infinity', '크레딧', '']
    expect(parseRawRow(cols)).toBeNull()
  })
})

describe('parseRawRow - 컬럼 수 검증', () => {
  it('컬럼이 5개 미만이면 null 반환', () => {
    expect(parseRawRow(['2026-01-01', '지출', '식비', '마트'])).toBeNull()
  })
})

// ── normalizePayment ─────────────────────────────────────────────────────────
describe('normalizePayment', () => {
  it('알려진 결제 수단 정규화', () => {
    expect(normalizePayment('현금')).toBe('현금')
    expect(normalizePayment('데빗')).toBe('데빗')
    expect(normalizePayment('자동 지출')).toBe('자동지출')
    expect(normalizePayment('TD Debit Card')).toBe('데빗')
  })

  it('알 수 없는 결제 수단은 크레딧으로 기본 처리', () => {
    expect(normalizePayment('알수없음')).toBe('크레딧')
    expect(normalizePayment('')).toBe('크레딧')
  })
})

// ── MAX_CSV_ROWS ─────────────────────────────────────────────────────────────
describe('MAX_CSV_ROWS', () => {
  it('5000으로 설정되어 있어야 함', () => {
    expect(MAX_CSV_ROWS).toBe(5000)
  })
})
