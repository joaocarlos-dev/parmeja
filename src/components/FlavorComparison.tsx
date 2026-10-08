import type { FlavorComparison as Comparison } from '../utils/optimizer'
import { formatCurrency } from '../utils/formatters'

interface FlavorComparisonProps {
  comparisons: Comparison[]
}

function describePortions(comparison: Comparison): string {
  return comparison.recommendation.items
    .map((item) => `${item.quantity} × para ${item.serves}`)
    .join(' + ')
}

export function FlavorComparison({ comparisons }: FlavorComparisonProps) {
  if (comparisons.length < 2) return null
  return (
    <section className="comparison" aria-labelledby="comparison-title">
      <div className="section-heading">
        <h2 id="comparison-title">Comparar sabores</h2>
        <span>Melhor pedido só com cada sabor</span>
      </div>
      <ol className="comparison-list">
        {comparisons.map((comparison) => (
          <li key={comparison.flavorId} className="comparison-row">
            <div className="comparison-copy">
              <strong>{comparison.flavorName}</strong>
              <span>{describePortions(comparison)} · {formatCurrency(comparison.recommendation.pricePerPerson)} por pessoa</span>
            </div>
            <div className="comparison-price">
              <strong>{formatCurrency(comparison.recommendation.totalPrice)}</strong>
              {comparison.differenceFromBest === 0
                ? <span className="tag tag-accent">Mais em conta</span>
                : <span className="tag">+{formatCurrency(comparison.differenceFromBest)}</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
