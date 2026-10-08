import type { AppetiteLevel } from '../types/appetite'
import { appetiteLevels } from '../utils/appetite'

interface AppetiteSelectorProps {
  value: AppetiteLevel
  onChange: (value: AppetiteLevel) => void
}

export function AppetiteSelector({ value, onChange }: AppetiteSelectorProps) {
  const selected = appetiteLevels.find((level) => level.value === value)!
  return (
    <section className="control-section" aria-labelledby="appetite-title">
      <div className="control-heading"><h2 id="appetite-title">Qual é a fome do grupo?</h2></div>
      <div className="appetite-summary"><strong>{selected.label}</strong><span>Nível {value} de 5</span></div>
      <div className="appetite-scale" role="radiogroup" aria-labelledby="appetite-title">
        {appetiteLevels.map((level) => (
          <label key={level.value} className={`appetite-option ${value === level.value ? 'is-selected' : ''}`}>
            <input type="radio" name="appetite" value={level.value} checked={value === level.value}
              onChange={() => onChange(level.value)} aria-label={level.label} />
            <span aria-hidden="true">{level.value}</span>
          </label>
        ))}
      </div>
      <div className="appetite-endpoints" aria-hidden="true"><span>Muito leve</span><span>Muito alta</span></div>
      <p className="appetite-description">{selected.description}</p>
    </section>
  )
}
