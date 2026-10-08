import { afterEach, describe, expect, it, vi } from 'vitest'
import { menu } from '../data/menu'
import { optimizeMenu } from './optimizer'
import { applyPrices, diffPrices, formatPriceInput, loadPriceOverrides, parsePrice, savePriceOverrides } from './prices'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
    data,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('preços configuráveis', () => {
  it.each([
    ['143', 143], ['143,5', 143.5], ['R$ 1.234,56', 1234.56], ['99.90', 99.9], [' 70,00 ', 70],
  ])('interpreta "%s"', (input, expected) => {
    expect(parsePrice(input)).toBe(expected)
  })

  it.each(['', '0', '-10', 'abc', '10,999', '1e3', '100001'])('rejeita "%s"', (input) => {
    expect(parsePrice(input)).toBeNull()
  })

  it('formata com vírgula para edição', () => {
    expect(formatPriceInput(143)).toBe('143,00')
    expect(formatPriceInput(99.9)).toBe('99,90')
  })

  it('aplica preços sem modificar o cardápio original', () => {
    const original = structuredClone(menu)
    const updated = applyPrices(menu, { 414: 200 })
    expect(updated[1].options.find((option) => option.code === 414)!.price).toBe(200)
    expect(menu).toEqual(original)
  })

  it('guarda só os preços que diferem do cardápio', () => {
    expect(diffPrices(menu, { 402: 70, 414: 200, 999: 10, 403: -1 })).toEqual({ 414: 200 })
  })

  it('o novo preço muda a recomendação', () => {
    const [before] = optimizeMenu(menu, 4, ['frango'])
    const [after] = optimizeMenu(applyPrices(menu, { 414: 300 }), 4, ['frango'])
    expect(before.items).toEqual([expect.objectContaining({ code: 414 })])
    expect(after.items).toEqual([expect.objectContaining({ code: 412, quantity: 2 })])
    expect(after.totalPrice).toBe(190)
  })

  it('salva e carrega do armazenamento local, ignorando dados inválidos', () => {
    const storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
    savePriceOverrides({ 414: 200 })
    expect(loadPriceOverrides(menu)).toEqual({ 414: 200 })

    storage.setItem('parmeja:precos:v1', JSON.stringify({ 414: 'caro', 402: 75, 123: 50 }))
    expect(loadPriceOverrides(menu)).toEqual({ 402: 75 })

    storage.setItem('parmeja:precos:v1', '{quebrado')
    expect(loadPriceOverrides(menu)).toEqual({})

    savePriceOverrides({})
    expect(storage.data.size).toBe(0)
  })

  it('funciona sem armazenamento disponível', () => {
    expect(loadPriceOverrides(menu)).toEqual({})
    expect(() => savePriceOverrides({ 414: 200 })).not.toThrow()
  })
})
