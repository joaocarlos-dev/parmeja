import type { Recommendation } from '../types/menu'
import { appetiteLevels } from '../utils/appetite'
import { describeOrderItem, formatCurrency, formatNumber } from '../utils/formatters'

interface RecommendationCardProps {
  recommendation?: Recommendation
  people: number
}

const assessmentCopy = {
  balanced: { label: 'Na medida', description: 'Quantidade próxima ao consumo estimado do grupo.' },
  generous: { label: 'Com uma folga', description: 'Uma pequena margem para quem comer um pouco mais.' },
  excess: { label: 'Pode sobrar', description: 'As porções disponíveis deixam uma folga maior para este grupo.' },
}

export function RecommendationCard({ recommendation, people }: RecommendationCardProps) {
  if (!recommendation) {
    return (
      <section className="recommendation-card empty-recommendation">
        <span className="result-eyebrow">Seu pedido</span>
        <h2>Selecione um sabor para calcular</h2>
        <p>Marque ao menos uma parmegiana para ver a quantidade para {people} pessoas.</p>
      </section>
    )
  }

  const portionCount = recommendation.items.reduce((total, item) => total + item.quantity, 0)
  const appetite = appetiteLevels.find((level) => level.value === recommendation.demand.level)!
  const fit = assessmentCopy[recommendation.assessment]
  const consumptionPercent = Math.min(100, recommendation.demand.expectedServings / recommendation.totalServings * 100)

  return (
    <section className="recommendation-card" aria-labelledby="recommendation-title">
      <div className="result-header">
        <div><span className="result-eyebrow">Pedido recomendado</span><h2 id="recommendation-title">Para {people} pessoas</h2></div>
        <span className="appetite-badge">Fome {appetite.label.toLocaleLowerCase('pt-BR')}</span>
      </div>

      <ul className="order-list">
        {recommendation.items.map((item) => (
          <li className="order-row" key={item.code}>
            <div className="order-copy">
              <h3>{describeOrderItem(item)}</h3>
              <p>{item.quantity === 1 ? 'Esta porção serve' : 'Cada porção serve'} {item.serves} pessoas no cardápio.</p>
              <small>Cód. {item.code} · {formatCurrency(item.price)} por porção</small>
            </div>
            <strong className="item-total">{formatCurrency(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>

      <div className={`fit-panel fit-${recommendation.assessment}`}>
        <div className="fit-heading"><strong>{fit.label}</strong><span>{portionCount} {portionCount === 1 ? 'porção compartilhada' : 'porções compartilhadas'}</span></div>
        <p>{fit.description}</p>
        <div className="balance-track" role="img"
          aria-label={`Consumo estimado: ${formatNumber(recommendation.demand.expectedServings)} refeições de referência. Pedido: ${recommendation.totalServings}.`}>
          <span style={{ width: `${consumptionPercent}%` }} />
        </div>
        <div className="balance-labels">
          <span>Consumo esperado <strong>{formatNumber(recommendation.demand.expectedServings)}</strong></span>
          <span>No pedido <strong>{recommendation.totalServings}</strong></span>
        </div>
        <small>1 refeição = a quantidade do cardápio para 1 pessoa.</small>
      </div>

      <dl className="totals">
        <div className="total-row"><dt>Total do pedido</dt><dd>{formatCurrency(recommendation.totalPrice)}</dd></div>
        <div className="per-person-row"><dt>Dividindo entre {people}</dt><dd>{formatCurrency(recommendation.pricePerPerson)} por pessoa</dd></div>
        <div className="per-person-row"><dt>Custo por refeição pedida</dt><dd>{formatCurrency(recommendation.totalPrice / recommendation.totalServings)}</dd></div>
      </dl>

      <details className="calculation-details">
        <summary>Como chegamos a esse pedido?</summary>
        <div>
          <p>Este nível de fome considera {formatNumber(recommendation.demand.multiplier * 100)}% da quantidade individual do cardápio. Para {people} pessoas, estimamos o equivalente a <strong>{formatNumber(recommendation.demand.expectedServings)} refeições individuais</strong>. A faixa de variação considerada vai de {formatNumber(recommendation.demand.lowerServings)} a {formatNumber(recommendation.demand.upperServings)}.</p>
          <p>O pedido oferece {recommendation.totalServings} refeições de referência, com folga estimada de {formatNumber(recommendation.expectedSurplus)}. Comparamos preço, possível sobra e margem para quem come mais.</p>
          <p>Uma porção para 4 pessoas equivale a 4 refeições de referência. Os fatores de fome são hipóteses ajustáveis, pois o cardápio não informa o peso dos pratos.</p>
        </div>
      </details>
    </section>
  )
}
