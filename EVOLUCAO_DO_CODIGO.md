# EVOLUÇÃO DO CÓDIGO - ORBITA (Narrativa por Ciclos)

Documento para o Capítulo de Metodologia (Prototipagem Evolutiva) descrevendo a maturação técnica do ORBITA até a versão atual (v2.1). Baseado em análise do repositório, estrutura de pastas e documentação de status/README. Onde indicado, há inferências explícitas.

---

## CICLO 1: A FUNDAÇÃO (MVP v1.0)

**Hipótese técnica:** primeira entrega focada em provar a viabilidade do editor visual usando React Flow, sem geração de código real.

**Linha do tempo (git):**
- 2025-12-09 — `9b7f139` (Initial commit)
- 2025-12-09 — `d67f0f4` (UI + Zustand para estados básicos de grafo)

**Foco:**
- Renderizar grafo visual, drag-and-drop, seleção e conexão entre nós.
- Estado centralizado inicial via Zustand (nodes, edges, seleção).

**Artefatos-chave:**
- [src/components/layout/Canvas.tsx](src/components/layout/Canvas.tsx) — montagem do React Flow com drop de nós.
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) — catálogo básico de drivers para arrastar.
- [src/store/useStore.ts](src/store/useStore.ts) — store inicial com `nodes[]` e `edges[]` (inferência: presença atual de funções ricas sugere crescimento incremental a partir de um núcleo simples).

**Resultado:** MVP visual confirmando interação de grafo; sem lógica de geração de código ou comunicação com hardware.

---

## CICLO 2: O MOTOR LÓGICO (Transpilação)

**Marco:** projeto deixa de ser apenas visual e passa a produzir MicroPython.

**Linha do tempo (git):**
- 2025-12-10 — `109d07c` (Serial Bridge Mock/Real: base para upload)
- 2025-12-11 — `ff2743b` (Types + perfis iniciais), `6197ea5` (Inspector reativo com regras), `3217daf` (Transpiler trata regras), `dabe4f6` (Toolbar com persistência básica e seletor de perfil)
- 2025-12-11 — `b14927f` (Merge PR refactor-orbita-react-flow consolida fases 1-5)

**Foco:**
- Implementar ordenação topológica (Algoritmo de Kahn) para garantir ordem de execução.
- Introduzir templates de código por driver, substituição de placeholders e resolução de conexões.

**Artefatos-chave:**
- [src/core/transpiler.ts](src/core/transpiler.ts) — implementação de Kahn, validação de ciclos, geração de código estruturada (imports, setup, loop).
- [src/core/drivers.ts](src/core/drivers.ts) — primeiro catálogo de drivers com `code.setupCode` e `code.loopCode` para mapear hardware do PION.
- [README.md](README.md) — seção “Transpilador” descreve pipeline de geração e exemplo de output MicroPython (prova de que este ciclo se consolidou).

**Resultado:** Código MicroPython gerado a partir do grafo; ORBITA passa a ser uma ferramenta de programação, não só de desenho.

---

## CICLO 3: REFINAMENTO E UX (v2.0 - Inspector Dinâmico)

**Marco:** lógica condicional sai de nós específicos e migra para o Inspector via parâmetros dinâmicos.

**Linha do tempo (git):**
- 2025-12-12 — `b638a38` (Dynamic Inspector e parâmetros sensíveis ao contexto)
- 2025-12-12 — `4ceba49` (Refino de Inspector e handles), `7565ce3` (Sensores/atuadores I2C/GPIO extra), `767408f` (Perfil de hardware na transpilação)

**Foco:**
- `dynamicParameters` em drivers para revelar campos apenas quando entradas estão conectadas.
- UX do Inspector com cards estáticos e azuis (condicionais), múltiplas entradas, tipos seguros.
- Modo Mock para desenvolvimento sem hardware real.

**Artefatos-chave:**
- [src/components/layout/Inspector.tsx](src/components/layout/Inspector.tsx) — renderização condicional por conexões detectadas; ações anexadas; avisos de segurança.
- [src/hooks/useNodeConnections.ts](src/hooks/useNodeConnections.ts) — detecção de edges para habilitar parâmetros dinâmicos.
- [src/core/serial.ts](src/core/serial.ts) — `MockSerialBridge` com telemetria simulada, permitindo validar UX sem ESP32.
- [STATUS.md](STATUS.md) — destaca “Inspector Inteligente” e parâmetros dinâmicos como novidade, indicando migração da lógica para o painel.

**Resultado:** UI mais enxuta e progressiva; alunos configuram lógica sem proliferar nós; testes em modo Mock aceleram iterações.

---

## CICLO 4: EXPANSÃO E PROFISSIONALIZAÇÃO (v2.1 - Atual)

**Marco:** kit-orquestração, reuso e persistência se tornam de primeira classe.

**Linha do tempo (git):**
- 2025-12-12 — `c2e111a` (Pin locking nos perfis), `2b2fc12` (Novos perfis + restrição de drivers), `38db611` (Sequencer + presets + novas ações), `3947b2f` (Action handling para atuadores)
- 2025-12-16 — `4c0f624` (README/STATUS atualizados para v2.1 com perfis/ações/persistência)
- 2025-12-17 — `47de3b3` (GeneratorState para imports/setup/loop), `01a5fe4` (Bibliotecas externas no transpiler), `86f8a1c` (Guia técnico do transpilador)

**Foco:**
- Perfis de hardware com pinos travados e filtragem de drivers (segurança física e UX guiada).
- Painel de Ações para atuadores (templates plugáveis arrastáveis) e presets de missão.
- Persistência completa `.orbita` (nodes, edges, perfil, assinatura de drivers) + carregamento com migração de versão.

**Artefatos-chave:**
- [src/config/hardware-profiles.ts](src/config/hardware-profiles.ts) — mapeamento de pinos e whitelist de drivers por kit (Pion CanSat V1, etc.).
- [src/config/actions.ts](src/config/actions.ts) e [src/components/layout/ActionPanel.tsx](src/components/layout/ActionPanel.tsx) — catálogo e painel drag-and-drop de ações para LED/Buzzer.
- [src/store/useStore.ts](src/store/useStore.ts) — persistência `.orbita`, presets rápidos, seleção de perfil.
- [src/components/layout/Toolbar.tsx](src/components/layout/Toolbar.tsx) — salvar/carregar, seletor de perfil, presets.
- [README.md](README.md) e [STATUS.md](STATUS.md) — changelog de v2.1 listando perfis, ações e persistência como novidades.

**Resultado:** Plataforma pronta para uso educacional real: segurança de pinos, reuso via ações, continuidade de trabalho via persistência.

---

## QUADRO CRONOLÓGICO RESUMIDO (git)

| Data (UTC-3) | Commit | Marco | Ciclo |
| --- | --- | --- | --- |
| 2025-12-09 19:01 | 9b7f139 | Initial commit | Fundação (C1) |
| 2025-12-09 19:30 | d67f0f4 | UI + Zustand (grafo básico) | Fundação (C1) |
| 2025-12-10 01:28 | 109d07c | Serial Bridge Mock/Real | Motor Lógico (C2) |
| 2025-12-11 20:56 | ff2743b | Types + perfis iniciais | Motor Lógico (C2) |
| 2025-12-11 21:01 | 6197ea5 | Inspector reativo com regras | Motor Lógico (C2) |
| 2025-12-11 21:02 | 3217daf | Transpiler trata regras | Motor Lógico (C2) |
| 2025-12-11 21:04 | dabe4f6 | Toolbar + persistência básica + seletor de perfil | Motor Lógico (C2) |
| 2025-12-11 18:24 | b14927f | Merge refactor-orbita-react-flow (fases 1-5) | Consolidação C1–C2 |
| 2025-12-12 01:05 | b638a38 | Dynamic Inspector | Refinamento/UX (C3) |
| 2025-12-12 01:20 | 4ceba49 | Refino Inspector/handles | Refinamento/UX (C3) |
| 2025-12-12 01:34 | 7565ce3 | Sensores/atuadores I2C/GPIO extra | Refinamento/UX (C3) |
| 2025-12-12 01:37 | 767408f | Perfil de hardware na transpilação | Refinamento/UX (C3) |
| 2025-12-12 02:00 | c2e111a | Pin locking nos perfis | Expansão (C4) |
| 2025-12-12 02:15 | 2b2fc12 | Novos perfis + restrição de drivers | Expansão (C4) |
| 2025-12-12 03:04 | 38db611 | Sequencer + presets + ações | Expansão (C4) |
| 2025-12-12 20:09 | 3947b2f | Actions para atuadores | Expansão (C4) |
| 2025-12-16 23:54 | 4c0f624 | README/STATUS v2.1 (perfis/ações/persistência) | Expansão (C4) |
| 2025-12-17 01:17 | 47de3b3 | GeneratorState (imports/setup/loop) | Expansão (C4) |
| 2025-12-17 01:31 | 01a5fe4 | Bibliotecas externas no transpiler | Expansão (C4) |
| 2025-12-17 02:10 | 86f8a1c | Guia técnico do transpilador | Expansão (C4) |

---

## INSIGHTS PARA A METODOLOGIA (Conclusão)

- **Evolução da Arquitetura de Pastas:**
  - Início centrado em `components/` + `store/`; à medida que o domínio cresceu, emergiu `core/` para transpilação/serial e `config/` para perfis e ações, evidenciando segregação de responsabilidades.
  - A criação de `config/` (perfis, ações, presets) mostra externalização de regras, permitindo iterar sem tocar no núcleo de geração.

- **Modularidade como Alavanca:**
  - Drivers em [src/core/drivers.ts](src/core/drivers.ts) e Perfis em [src/config/hardware-profiles.ts](src/config/hardware-profiles.ts) possibilitaram adicionar kits/ações sem quebrar grafos antigos (backward compatibility via templates e pin locking).
  - O Transpiler centralizado em [src/core/transpiler.ts](src/core/transpiler.ts) isola a complexidade de geração; novos blocos lógicos se plugam apenas via templates.

- **Prototipagem Evolutiva Evidenciada:**
  - Cada ciclo adicionou uma camada: 1) interação visual → 2) geração de código → 3) UX e simulação → 4) governança de hardware e persistência.
  - O Modo Mock (ciclo 3) permitiu validar UX enquanto o hardware real era integrado no ciclo 4, típica estratégia incremental.

- **Indicadores de Refatoração:**
  - Tamanho e riqueza de [src/store/useStore.ts](src/store/useStore.ts) sugerem crescimento incremental com adição de responsabilidades (telemetria, ações, persistência), alinhado à evolução iterativa.
  - A presença de `dynamicParameters` e `actions` indica que lógica antes embutida em nós foi extraída para configuradores e templates, reduzindo acoplamento.

- **Conclusão para o Capítulo de Metodologia:**
  - O histórico por ciclos demonstra entregas incrementais e verificáveis: primeiro provar UI, depois provar geração de código, em seguida refinar experiência e simulação, por fim profissionalizar com segurança de hardware e persistência. Essa sequência evidencia Prototipagem Evolutiva com feedback contínuo e ampliação controlada do escopo.
