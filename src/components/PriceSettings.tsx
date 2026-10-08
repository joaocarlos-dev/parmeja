import { useRef, useState } from 'react'
import type { Flavor } from '../types/menu'
import { formatCurrency } from '../utils/formatters'
import { diffPrices, formatPriceInput, parsePrice, type PriceOverrides } from '../utils/prices'

interface PriceSettingsProps {
  defaultMenu: Flavor[]
  activeMenu: Flavor[]
  customCount: number
  onSave: (overrides: PriceOverrides) => void
}

type Draft = Record<number, string>

function toDraft(menu: Flavor[]): Draft {
  return Object.fromEntries(menu.flatMap((flavor) => flavor.options).map((option) => [option.code, formatPriceInput(option.price)]))
}

export function PriceSettings({ defaultMenu, activeMenu, customCount, onSave }: PriceSettingsProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState<Draft>(() => toDraft(activeMenu))
  const invalidCodes = Object.entries(draft).filter(([, value]) => parsePrice(value) === null).map(([code]) => Number(code))

  function open() {
    setDraft(toDraft(activeMenu))
    dialog.current?.showModal()
  }

  function save() {
    if (invalidCodes.length > 0) return
    const prices = Object.fromEntries(Object.entries(draft).map(([code, value]) => [Number(code), parsePrice(value)!]))
    onSave(diffPrices(defaultMenu, prices))
    dialog.current?.close()
  }

  return (
    <>
      <button type="button" className="ghost-button" aria-haspopup="dialog" onClick={open}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
        Preços
        {customCount > 0 && <>
          <span className="dot-badge" aria-hidden="true">{customCount}</span>
          <span className="sr-only">, {customCount} {customCount === 1 ? 'preço personalizado' : 'preços personalizados'}</span>
        </>}
      </button>

      <dialog ref={dialog} className="settings-dialog" aria-labelledby="settings-title">
        <form onSubmit={(event) => { event.preventDefault(); save() }}>
          <header className="dialog-header">
            <div>
              <h2 id="settings-title">Preços do cardápio</h2>
              <p>Atualize quando o restaurante mudar os valores. Fica salvo neste navegador.</p>
            </div>
            <button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>

          <div className="price-grid">
            {defaultMenu.map((flavor) => (
              <fieldset key={flavor.id} className="price-group">
                <legend>{flavor.name}</legend>
                {flavor.options.map((option) => {
                  const invalid = invalidCodes.includes(option.code)
                  const changed = !invalid && parsePrice(draft[option.code]) !== option.price
                  return (
                    <label key={option.code} className={`price-field ${invalid ? 'is-invalid' : ''} ${changed ? 'is-changed' : ''}`}>
                      <span className="price-label">Para {option.serves} <small>cód. {option.code}</small></span>
                      <span className="price-input">
                        <span aria-hidden="true">R$</span>
                        <input type="text" inputMode="decimal" autoComplete="off" value={draft[option.code] ?? ''}
                          aria-invalid={invalid} aria-describedby={`price-hint-${option.code}`} aria-label={`${flavor.name} para ${option.serves} pessoas, código ${option.code}`}
                          onChange={(event) => {
                            const { value } = event.target
                            setDraft((current) => ({ ...current, [option.code]: value }))
                          }} />
                      </span>
                      <span className="price-default" id={`price-hint-${option.code}`}>{invalid ? 'Valor inválido' : changed ? `Cardápio: ${formatCurrency(option.price)}` : ''}</span>
                    </label>
                  )
                })}
              </fieldset>
            ))}
          </div>

          <footer className="dialog-footer">
            <button type="button" className="text-button" onClick={() => setDraft(toDraft(defaultMenu))}>Restaurar cardápio</button>
            <div>
              <button type="button" className="ghost-button" onClick={() => dialog.current?.close()}>Cancelar</button>
              <button type="submit" className="primary-button" disabled={invalidCodes.length > 0}>Salvar preços</button>
            </div>
          </footer>
        </form>
      </dialog>
    </>
  )
}
