# Planejamento do ParmeJá

## Direção visual

Dark mode minimalista: fundo `#09090b`, superfícies `#111113` e `#18181b`, bordas `#232328`/`#2f2f36`, texto `#f4f4f5`, secundário `#a1a1aa` e um único destaque laranja `#ff7a45` (com um brilho radial sutil no topo). Verde, amarelo e vermelho aparecem só como indicadores do encaixe (na medida, com folga, pode sobrar). Controles compactos, espaços consistentes, tipografia sem fontes externas e hierarquia visível. O pedido e os controles ocupam a primeira tela; preços e detalhes ficam em seções expansíveis.

## Estimativa de fome

Uma refeição de referência equivale à quantidade que o cardápio atribui a uma pessoa. Assim, uma porção compartilhada indicada para quatro pessoas oferece quatro refeições de referência, incluindo os acompanhamentos.

| Fome média | Multiplicador | Consumo estimado para 20 pessoas |
| --- | --- | --- |
| Muito leve | 0,65 | 13 refeições de referência |
| Leve | 0,80 | 16 |
| Normal | 1,00 | 20 |
| Alta | 1,20 | 24 |
| Muito alta | 1,40 | 28 |

Estimar a demanda média como `pessoas × multiplicador`. Criar cenários mais leve e mais intenso usando uma variação de `0,18 × raiz quadrada do número de pessoas`. Essa escolha assume que diferenças individuais se compensam parcialmente em grupos maiores. Os multiplicadores e a faixa são hipóteses de projeto, sem medição de peso dos pratos ou calibração estatística.

## Escolha do pedido

1. Considerar somente os sabores selecionados e porções cadastradas na foto.
2. Gerar combinações com capacidade que cubra pelo menos a demanda média arredondada para cima.
3. Usar programação dinâmica para manter as quatro melhores combinações distintas por capacidade, evitando enumerar todos os pedidos. Duas combinações com a mesma quantidade de cada sabor entregam a mesma comida; só a mais barata (e, no empate, com menos porções) é mantida.
4. Para cada pedido, comparar preço real mais uma penalidade de decisão para faltar ou sobrar comida nos três cenários.
5. Dar pesos 0,2 / 0,6 / 0,2 aos cenários leve / médio / intenso. A penalidade por falta é oito vezes o menor custo por refeição de referência disponível; por sobra, 0,2 vez. Esses pesos expressam uma preferência para ordenar pedidos, não probabilidades observadas ou custos cobrados.
6. Ordenar pela pontuação; desempatar por preço, menor capacidade excedente e menos porções. O preço mostrado continua sendo apenas a soma do cardápio.
7. Informar “Na medida” até 15% de folga, “Com uma folga” até 25% e “Pode sobrar” acima disso.
8. Como os sabores são tratados como intercambiáveis, o mais barato marcado sempre vence. Para que marcar outros sabores tenha efeito, mostrar também o melhor pedido só com cada sabor e a diferença de preço para o mais barato.

A heurística pode escolher uma combinação um pouco mais cara quando a margem adicional compensa a variação estimada do apetite. Ela nunca recomenda deliberadamente menos que a média estimada.

## Preços configuráveis

Os preços padrão vêm da foto (`src/data/menu.ts`). O diálogo **Preços** permite substituí-los; os valores aceitam vírgula ou ponto, precisam ser positivos e ficam salvos no `localStorage` apenas quando diferem do padrão. Dados inválidos no armazenamento são ignorados.

## Explicação para quem usa

Mostrar a quantidade de porções compartilhadas por extenso, o tamanho de cada uma, o código do prato, preço unitário, total e divisão entre as pessoas reais. Comparar consumo esperado com quantidade pedida em refeições de referência. Expor a escala escolhida, a faixa de variação e a possível sobra em “Como chegamos a esse pedido?”.

## Validação

Verificar os limites de 2 e 20 pessoas, os cinco níveis de fome, arredondamento decimal, porções pequenas que já representam excesso, filtros, totais, alternativas únicas, ausência de mutações e comparação com busca exaustiva independente. Inspecionar desktop e celular, navegação por teclado, contrastes, estados vazios e build estático.

Todo o processamento e os dados continuam locais. A paleta é incorporada ao CSS; a aplicação não consulta a internet durante o uso. Os preços personalizados ficam só no navegador de quem os definiu.
