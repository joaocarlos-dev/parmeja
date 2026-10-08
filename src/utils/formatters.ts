import type { OrderItem } from '../types/menu'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrency(value: number): string {
  return currency.format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}

// Decides the noun from the displayed number, so 0.96 shown as "1" stays singular.
export function formatMeals(value: number): string {
  const formatted = formatNumber(value)
  return `${formatted} ${formatted === '1' ? 'refeição' : 'refeições'}`
}

export function describeOrderItem(item: OrderItem): string {
  const flavor = item.flavorName.replace(/^./, (letter) => letter.toLocaleLowerCase('pt-BR'))
  return `${item.quantity} ${item.quantity === 1 ? 'porção' : 'porções'} de parmegiana de ${flavor}`
}
