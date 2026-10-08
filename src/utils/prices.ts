import type { Flavor } from '../types/menu'

// Maps a menu code to a custom price. Only prices that differ from the menu are
// stored, so future updates to the default menu still reach unchanged items.
export type PriceOverrides = Record<number, number>

const STORAGE_KEY = 'parmeja:precos:v1'
const MAX_PRICE = 100_000

export function parsePrice(input: string): number | null {
  let normalized = input.replace(/R\$|\s/g, '')
  if (normalized.includes(',')) normalized = normalized.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const value = Number(normalized)
  return isValidPrice(value) ? value : null
}

export function formatPriceInput(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_PRICE &&
    Math.abs(Math.round(value * 100) - value * 100) < 1e-6
}

export function applyPrices(menu: Flavor[], overrides: PriceOverrides): Flavor[] {
  return menu.map((flavor) => ({
    ...flavor,
    options: flavor.options.map((option) =>
      isValidPrice(overrides[option.code]) ? { ...option, price: overrides[option.code] } : option,
    ),
  }))
}

export function diffPrices(menu: Flavor[], prices: PriceOverrides): PriceOverrides {
  const overrides: PriceOverrides = {}
  for (const option of menu.flatMap((flavor) => flavor.options)) {
    const price = prices[option.code]
    if (isValidPrice(price) && price !== option.price) overrides[option.code] = price
  }
  return overrides
}

export function loadPriceOverrides(menu: Flavor[]): PriceOverrides {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (typeof stored !== 'object' || stored === null) return {}
    return diffPrices(menu, Object.fromEntries(
      Object.entries(stored).map(([code, price]) => [Number(code), price]),
    ))
  } catch {
    return {}
  }
}

export function savePriceOverrides(overrides: PriceOverrides): void {
  try {
    if (Object.keys(overrides).length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // Storage can be unavailable (private mode, blocked site data); prices
    // still apply for the current session.
  }
}
