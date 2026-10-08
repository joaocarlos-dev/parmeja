import { useMemo, useRef, useState } from 'react'
import { AlternativesList } from './components/AlternativesList'
import { AppetiteSelector } from './components/AppetiteSelector'
import { FlavorComparison } from './components/FlavorComparison'
import { FlavorFilter } from './components/FlavorFilter'
import { PeopleSelector } from './components/PeopleSelector'
import { PriceSettings } from './components/PriceSettings'
import { RecommendationCard } from './components/RecommendationCard'
import { menu, menuNote } from './data/menu'
import type { AppetiteLevel } from './types/appetite'
import type { FlavorId } from './types/menu'
import { formatCurrency } from './utils/formatters'
import { compareFlavors, optimizeMenu } from './utils/optimizer'
import { applyPrices, loadPriceOverrides, savePriceOverrides, type PriceOverrides } from './utils/prices'

function App() {
  const menuDetails = useRef<HTMLDetailsElement>(null)
  const [people, setPeople] = useState(4)
  const [appetite, setAppetite] = useState<AppetiteLevel>(3)
  const [selectedFlavors, setSelectedFlavors] = useState<FlavorId[]>(menu.map((flavor) => flavor.id))
  const [priceOverrides, setPriceOverrides] = useState<PriceOverrides>(() => loadPriceOverrides(menu))
  const activeMenu = useMemo(() => applyPrices(menu, priceOverrides), [priceOverrides])
  const recommendations = useMemo(
    () => optimizeMenu(activeMenu, people, selectedFlavors, appetite),
    [activeMenu, people, selectedFlavors, appetite],
  )
  const comparisons = useMemo(
    () => compareFlavors(activeMenu, people, selectedFlavors, appetite),
    [activeMenu, people, selectedFlavors, appetite],
  )
  const hasCustomPrices = Object.keys(priceOverrides).length > 0

  function updatePrices(overrides: PriceOverrides) {
    setPriceOverrides(overrides)
    savePriceOverrides(overrides)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Ir para o cálculo</a>
      <header className="topbar">
        <a href="#main" className="brand">
          <span className="brand-mark" aria-hidden="true">p</span>
          <span>parmejá</span>
        </a>
        <nav className="topbar-actions" aria-label="Ações">
          <a className="ghost-button" href="#cardapio" onClick={() => {
            if (menuDetails.current) menuDetails.current.open = true
          }}>Cardápio</a>
          <PriceSettings defaultMenu={menu} activeMenu={activeMenu} customCount={Object.keys(priceOverrides).length} onSave={updatePrices} />
        </nav>
      </header>

      <main id="main">
        <div className="intro">
          <h1>O pedido certo, <span>pelo menor preço.</span></h1>
          <p>Diga quantas pessoas e o tamanho da fome. A gente monta a combinação de porções com melhor custo-benefício.</p>
        </div>

        <div className="workspace">
          <div className="controls-panel">
            <PeopleSelector value={people} onChange={setPeople} />
            <AppetiteSelector value={appetite} onChange={setAppetite} />
            <FlavorFilter flavors={activeMenu} selected={selectedFlavors} onChange={setSelectedFlavors} />
            <p className="menu-note">{menuNote}</p>
          </div>
          <div className="results-column">
            <div aria-live="polite" aria-atomic="true">
              <RecommendationCard recommendation={recommendations[0]} people={people} />
            </div>
            <FlavorComparison comparisons={comparisons} />
            <AlternativesList alternatives={recommendations.slice(1)} bestPrice={recommendations[0]?.totalPrice} />
          </div>
        </div>

        <details className="menu-details" id="cardapio" ref={menuDetails}>
          <summary>Cardápio e preços <span>{hasCustomPrices ? 'Com preços personalizados' : 'Porções para compartilhar'}</span></summary>
          <div className="menu-content">
            <p>{menuNote}</p>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Preços das parmegianas por tamanho da porção</caption>
                <thead>
                  <tr><th scope="col">Parmegiana</th><th scope="col">2 pessoas</th><th scope="col">3 pessoas</th><th scope="col">4 pessoas</th></tr>
                </thead>
                <tbody>
                  {activeMenu.map((flavor) => (
                    <tr key={flavor.id}>
                      <th scope="row">{flavor.name}</th>
                      {flavor.options.map((option) => (
                        <td key={option.code} className={option.code in priceOverrides ? 'is-custom' : undefined}>
                          {formatCurrency(option.price)}
                          <small>{formatCurrency(option.price / option.serves)}/pessoa</small>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="source-note">
              {hasCustomPrices
                ? 'Os valores destacados foram alterados em Preços e substituem os da foto. '
                : 'Valores da foto enviada. '}
              A seção JK está sem preços visíveis e não entra no cálculo.{' '}
              <a href={`${import.meta.env.BASE_URL}cardapio-original.png`} target="_blank" rel="noreferrer">Ver foto original</a>
            </p>
          </div>
        </details>
      </main>

      <footer><span>parmejá</span><span>O apetite é estimado. Os preços são do cardápio ou os que você salvou.</span></footer>
    </div>
  )
}

export default App
