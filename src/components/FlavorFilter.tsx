import type { Flavor, FlavorId } from '../types/menu'
import { formatCurrency } from '../utils/formatters'

interface FlavorFilterProps {
  flavors: Flavor[]
  selected: FlavorId[]
  onChange: (selected: FlavorId[]) => void
}

export function FlavorFilter({ flavors, selected, onChange }: FlavorFilterProps) {
  function toggle(id: FlavorId) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  }

  return (
    <section className="control-section" aria-labelledby="flavor-title">
      <div className="control-heading"><h2 id="flavor-title">Quais sabores?</h2><span>Selecione</span></div>
      <div className="flavor-list">
        {flavors.map((flavor) => (
          <label className={`flavor-option ${selected.includes(flavor.id) ? 'is-selected' : ''}`} key={flavor.id}>
            <input type="checkbox" checked={selected.includes(flavor.id)} onChange={() => toggle(flavor.id)} aria-label={flavor.name} />
            <span className="flavor-copy">
              <strong>{flavor.name}</strong>
              <small>Desde {formatCurrency(Math.min(...flavor.options.map((option) => option.price)))}</small>
            </span>
          </label>
        ))}
      </div>
      <p className="control-hint">Escolhemos entre os sabores marcados. O pedido não precisa incluir todos.</p>
    </section>
  )
}
