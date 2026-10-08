import { MAX_PEOPLE, MIN_PEOPLE } from '../utils/optimizer'

interface PeopleSelectorProps {
  value: number
  onChange: (value: number) => void
}

export function PeopleSelector({ value, onChange }: PeopleSelectorProps) {
  return (
    <section className="control-section" aria-labelledby="people-title">
      <div className="control-heading"><h2 id="people-title">Pessoas na mesa</h2><span>Até 20</span></div>
      <div className="people-control" role="group" aria-label="Número de pessoas">
        <button type="button" className="step-button"
          onClick={() => onChange(Math.max(MIN_PEOPLE, value - 1))}
          disabled={value <= MIN_PEOPLE} aria-label="Diminuir número de pessoas">−</button>
        <output className="people-output"><strong>{value}</strong><span>pessoas</span></output>
        <button type="button" className="step-button"
          onClick={() => onChange(Math.min(MAX_PEOPLE, value + 1))}
          disabled={value >= MAX_PEOPLE} aria-label="Aumentar número de pessoas">+</button>
      </div>
      <input className="people-range" type="range" min={MIN_PEOPLE} max={MAX_PEOPLE}
        value={value} onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Quantidade de pessoas" aria-valuetext={`${value} pessoas`} />
      <div className="range-labels" aria-hidden="true"><span>{MIN_PEOPLE} pessoas</span><span>{MAX_PEOPLE} pessoas</span></div>
    </section>
  )
}
