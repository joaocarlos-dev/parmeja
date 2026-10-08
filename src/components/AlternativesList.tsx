import type { Recommendation } from '../types/menu'
import { describeOrderItem, formatCurrency, formatMeals } from '../utils/formatters'

interface AlternativesListProps {
  alternatives: Recommendation[]
  bestPrice?: number
}

const assessmentLabels = { balanced: 'Na medida', generous: 'Com folga', excess: 'Pode sobrar' }

function describeDifference(price: number, bestPrice?: number): string | null {
  if (bestPrice === undefined) return null
  const difference = Math.round((price - bestPrice) * 100) / 100
  if (difference === 0) return 'Mesmo preço'
  return `${difference > 0 ? '+' : '−'}${formatCurrency(Math.abs(difference))}`
}

export function AlternativesList({ alternatives, bestPrice }: AlternativesListProps) {
  if (alternatives.length === 0) return null
  return (
    <details className="alternatives">
      <summary>Outras combinações<span>{alternatives.length} opções</span></summary>
      <ol className="alternative-list">
        {alternatives.map((alternative) => {
          const difference = describeDifference(alternative.totalPrice, bestPrice)
          return (
            <li className="alternative-row" key={alternative.items.map((item) => `${item.code}:${item.quantity}`).join('|')}>
              <div className="alternative-copy">
                <ul>
                  {alternative.items.map((item) => (
                    <li key={item.code}>
                      <p>{describeOrderItem(item)}</p>
                      <span>Para {item.serves} pessoas {item.quantity > 1 ? 'cada' : ''} · cód. {item.code}</span>
                    </li>
                  ))}
                </ul>
                <span className="alternative-coverage">{assessmentLabels[alternative.assessment]} · {formatMeals(alternative.totalServings)} · folga estimada de {formatMeals(alternative.expectedSurplus)} de referência</span>
              </div>
              <div className="alternative-price">
                <strong>{formatCurrency(alternative.totalPrice)}</strong>
                {difference && <span className="tag">{difference}</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </details>
  )
}
