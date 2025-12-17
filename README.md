# 🛰️ ORBITA - Ambiente de Programação Visual para Nanossatélites

![Status](https://img.shields.io/badge/Status-MVP_v2.1-success)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)
![React Flow](https://img.shields.io/badge/React_Flow-12.10-FF6B9D)

**ORBITA** é uma Single Page Application (SPA) para programação visual de nanossatélites. Permite criar lógica de missão através de interface drag-and-drop, gerando código MicroPython otimizado para execução em ESP32, com suporte a parâmetros dinâmicos baseados em conexões, catálogo de ações plugáveis para atuadores e perfis de hardware (kits) que travam pinos automaticamente.

**Novidades na v2.1**
- Perfis de hardware selecionáveis (ESP32 Genérico, Pion CanSat V1, CubeSat V1) com pinos travados e filtragem de drivers conforme o kit.
- Toolbar com salvar/carregar missão `.orbita`, presets rápidos de missão e seleção de kit ativa.
- Catálogo de ações para atuadores (LED RGB/branco, buzzer) com painel dedicado para arrastar/soltar e configurar.
- Biblioteca ampliada de drivers: sensores I2C (BME/BMP280, SHT20/31, CCS811, IMU), analógicos (LDR/VBAT), atuadores (servo, buzzer, logger SD) e blocos de tempo/lógica (sequencer, delay, comparator/threshold).

---

## 📚 Índice

- [Quick Start](#-quick-start)
- [Arquitetura de Software](#-arquitetura-de-software)
- [Fluxo de Dados](#-fluxo-de-dados)
- [Sistema de Componentes](#-sistema-de-componentes)
- [Transpilador](#-transpilador)
- [Comunicação Serial](#-comunicação-serial)
- [Interface do Usuário](#-interface-do-usuário)
- [Stack Tecnológico](#-stack-tecnológico)

---

## 🚀 Quick Start

### Instalar Dependências
```bash
npm install
```

### Modo Mock (Desenvolvimento sem Hardware)
```bash
npm run dev
```
Acesse: http://localhost:3000

### Modo Real (Com ESP32)
Edite `.env` e altere `VITE_USE_MOCK=false`

---

## 🏗️ Arquitetura de Software

### **Visão Geral**

ORBITA segue uma arquitetura **client-side** baseada em **componentes reativos** e **estado centralizado**. A aplicação é dividida em camadas bem definidas:

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE APRESENTAÇÃO                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Toolbar  │  │ Sidebar  │  │ Canvas   │  │Inspector │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Console                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE GERENCIAMENTO DE ESTADO            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Zustand Store (useOrbitaStore)            │ │
│  │  • nodes[]         • telemetryMessages[]              │ │
│  │  • edges[]         • serialStatus                     │ │
│  │  • selectedNode    • UI states                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE NEGÓCIO                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐│
│  │ Transpiler │  │Serial Bridge│ │   Driver Registry      ││
│  │(Topologic) │  │(Mock/Real) │  │  (6 componentes HW)   ││
│  └────────────┘  └────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE HARDWARE                        │
│           Web Serial API → ESP32 (MicroPython)              │
└─────────────────────────────────────────────────────────────┘
```

### **Padrões de Design Aplicados**

1. **Singleton Pattern**
   - `transpiler` (OrbitaTranspiler)
   - `serialBridge` (SerialBridge)
   - Garantem instância única para gerenciadores críticos

2. **Factory Pattern**
   - `createSerialBridge()` retorna MockSerialBridge ou RealSerialBridge baseado em `VITE_USE_MOCK`

3. **Observer Pattern**
   - `serialBridge.onTelemetry(callback)`
   - `serialBridge.onStatusChange(callback)`
   - Callbacks registrados no store Zustand

4. **Strategy Pattern**
   - Implementações intercambiáveis de `ISerialBridge` (Mock vs Real)

5. **Registry Pattern**
   - `DRIVER_REGISTRY` armazena todos os drivers de hardware disponíveis

---

## 🔄 Fluxo de Dados

### **1. Criação de Componentes**

```
Sidebar (Drag) → Canvas (Drop) → Store.addNode() → nodes[]
```

- Usuário arrasta driver da Sidebar
- Sidebar já aplica filtros de drivers permitidos pelo perfil de hardware ativo
- Canvas detecta drop e cria novo nó
- Store adiciona ao array `nodes[]` com ID único
- React Flow re-renderiza automaticamente

### **2. Conexão de Componentes**

```
Handle Source → Handle Target → Store.onConnect() → edges[]
```

- Usuário arrasta de handle de saída para entrada
- React Flow valida conexão
- Store adiciona ao array `edges[]`
- Inspector detecta nova conexão e atualiza parâmetros dinâmicos

### **3. Configuração de Parâmetros**

```
Inspector → Store.updateNodeData() → node.data.parameters
```

- Usuário seleciona nó no canvas
- Inspector renderiza campos baseados em:
  - `driver.parameters` (estáticos)
  - `driver.dynamicParameters` (aparecem se entrada conectada)
- Mudanças persistidas em `node.data.parameters`

### **4. Transpilação**

```
nodes[] + edges[] → Transpiler.transpile() → MicroPython code
```

**Algoritmo de Kahn (Topological Sort):**
```typescript
1. Calcular in-degree de cada nó
2. Adicionar nós com in-degree=0 à fila
3. Processar fila:
   - Remove nó da fila
   - Adiciona à lista ordenada
   - Reduz in-degree dos vizinhos
   - Se vizinho.in-degree=0 → adiciona à fila
4. Se lista.length !== nodes.length → CICLO DETECTADO
```

**Geração de Código:**
```typescript
1. Ordenar nós topologicamente
2. Gerar nomes de variáveis (sensor_temp_001)
3. Coletar imports únicos
4. Para cada nó:
   - Substituir {{var_name}}
   - Substituir {{parameters}}
   - Resolver {{input_xxx}} usando edges
   - Processar {{#if input_xxx}}...{{/if}}
5. Montar código final:
   - Header + Imports + Setup + Loop
```

### **5. Upload e Execução**

```
MicroPython Code → SerialBridge.upload() → ESP32 Raw REPL
```

**Protocolo Raw REPL:**
```
1. Ctrl+C (0x03)  → Interrompe execução atual
2. Ctrl+A (0x01)  → Entra em modo Raw REPL
3. Envia código em chunks de 256 bytes
4. Ctrl+D (0x04)  → Executa código (soft reboot)
5. Escuta saída serial continuamente
```

### **6. Telemetria**

```
ESP32 Serial → SerialBridge → Store.addTelemetryMessage() → Console
```

**Formato de Mensagem:**
```typescript
{
  timestamp: 1702416000000,
  type: 'data' | 'log' | 'error',
  content: "DATA: temp=25.3",
  parsed: { temp: 25.3 }
}
```

### **7. Persistência de Missões**

```
nodes + edges + hardwareProfile → saveMission() → arquivo .orbita
```

- O Toolbar exporta/importa `.orbita` com schema 2.1 (inclui assinatura de drivers e perfil ativo).
- Carregamento remapeia edges legadas e avisa sobre diferenças de versão/driver.

---

## 🧩 Sistema de Componentes

### **Estrutura de um Driver**

```typescript
interface HardwareDriver {
  id: string;                    // Identificador único
  name: string;                  // Nome exibido
  category: HardwareCategory;    // sensor/actuator/logic
  description: string;           // Descrição curta
  icon: string;                  // Nome do ícone Lucide React
  
  inputs: PortDefinition[];      // Portas de entrada
  outputs: PortDefinition[];     // Portas de saída
  
  parameters: Parameter[];       // Parâmetros estáticos
  dynamicParameters?: DynamicParameter[]; // Parâmetros condicionais
  
  code: {
    imports: string[];           // Ex: ["from machine import Pin"]
    setupCode: string;           // Executado uma vez (init)
    loopCode: string;            // Executado em loop
  };
}
```

### **Parâmetros Dinâmicos**

Sistema que exibe parâmetros **apenas quando a entrada correspondente está conectada**, mantendo o Inspector enxuto. Hoje é usado em drivers que reagem a múltiplos tipos de entrada (ex.: servo motor reagindo a temperatura **ou** valor analógico).

```typescript
dynamicParameters: [
  {
    inputId: 'temperature',      // Aparece quando 'temperature' está ligada
    parameters: [
      {
        id: 'servo_temp_operator',
        label: 'Condição de Temperatura',
        type: 'select',
        options: ['>', '<', '>=', '<=']
      },
      {
        id: 'servo_temp_threshold',
        label: 'Limite (°C)',
        type: 'number',
        default: 25
      },
      {
        id: 'servo_temp_angle',
        label: 'Ângulo quando ativo',
        type: 'number',
        default: 180
      }
    ]
  }
]
```

**Exemplo: Servo condicionado por temperatura**
- Usuário conecta `BME280.temperature` → `Servo.temperature`
- Inspector revela o card azul de condições para temperatura
- Usuário define: operador `>` e limite `30`, ângulo `180`
- O código gerado move o servo para 180° quando a condição é satisfeita

### **Componentes Disponíveis (v2.1)**

- **Sensores**: Gerador de Dados (mock), DHT11/22, BME/BMP280 (temp/umidade/pressão), SHT20/31, CCS811 (eCO2/TVOC), IMU MPU9250/BMX055, LDR (ADC), VBAT (ADC).
- **Atuadores**: LED branco/RGB (presets de cor, blink, ações), Buzzer (beep único, padrão, alerta), Servo Motor (ângulo direto ou condicionado), Console Log, Logger SD (append). 
- **Lógica / Tempo**: Comparador, Limiar, Delay Trigger (gatilho com atraso), Sequencer Timer (até 4 passos, repetir/loop).
- **Comunicação / Armazenamento**: Logger SD com CS configurável.

### **Perfis de Hardware (Kits)**
- **ESP32 Genérico**: todos os drivers liberados; pinos editáveis.
- **Pion CanSat V1**: pinos travados conforme datasheet; apenas drivers do kit aparecem na Sidebar.
- **CubeSat V1 (placeholder)**: pinos e drivers pré-selecionados para cenários CubeSat.

### **Ações para Atuadores**
- Painel dedicado permite anexar ações pré-definidas para LED (piscar periódico, cor fixa, alerta por limiar) e buzzer (beep, padrão, alerta). 
- Ações podem ser arrastadas para o Canvas ou aplicadas via clique, ficam listadas no Inspector e têm configuração própria.

---

## 🔧 Transpilador

### **Responsabilidades**

1. **Validação de Grafo**
   - Verifica drivers existentes
   - Detecta ciclos (DFS)
   - Valida conexões

2. **Ordenação Topológica**
   - Implementa Algoritmo de Kahn
   - Garante ordem de execução correta
   - Previne dependências circulares

3. **Geração de Código**
   - Substituição de templates ({{placeholders}})
   - Resolução de variáveis entre nós
   - Processamento de condicionais (`{{#if}}...{{/if}}`)
   - Indentação correta para Python

### **Exemplo de Transpilação**

**Input (Grafo Visual):**
```
Sequencer → [state] → LED
```

**Output (MicroPython):**
```python
# ================================================
# ORBITA - Código gerado automaticamente
# Total de nós: 2
# ================================================
from machine import Pin, PWM
import time

# ===== INICIALIZAÇÃO =====
sequence_timer_001_steps = [
  (True, 600),
  (False, 600)
]
sequence_timer_001_steps = [(s, d) for (s, d) in sequence_timer_001_steps if d > 0]
sequence_timer_001_index = 0
sequence_timer_001_last = time.ticks_ms()
sequence_timer_001_state = False
sequence_timer_001_step = 0
sequence_timer_001_start_delay = 0
sequence_timer_001_started = False

led_output_001_led = Pin(2, Pin.OUT)
led_output_001_pwm_r = PWM(Pin(12))
led_output_001_pwm_g = PWM(Pin(13))
led_output_001_pwm_b = PWM(Pin(14))
led_output_001_pwm_r.freq(1000)
led_output_001_pwm_g.freq(1000)
led_output_001_pwm_b.freq(1000)
led_output_001_blink_state = False
led_output_001_blink_last = 0
led_output_001_blink_done = 0

# ===== LOOP PRINCIPAL =====
while True:
  # Sequencer: liga/desliga de 600 ms
  start_active = True
  if len(sequence_timer_001_steps) == 0:
    sequence_timer_001_state = False
    sequence_timer_001_step = 0
  elif not start_active:
    sequence_timer_001_index = 0
    sequence_timer_001_started = False
    sequence_timer_001_last = time.ticks_ms()
    sequence_timer_001_state = False
    sequence_timer_001_step = 0
  else:
    now = time.ticks_ms()
    if not sequence_timer_001_started:
      sequence_timer_001_started = True
      sequence_timer_001_last = now

    target_state, duration_ms = sequence_timer_001_steps[sequence_timer_001_index]
    if time.ticks_diff(now, sequence_timer_001_last) >= duration_ms:
      sequence_timer_001_index += 1
      if sequence_timer_001_index >= len(sequence_timer_001_steps):
        sequence_timer_001_index = 0
      sequence_timer_001_last = now
      target_state, duration_ms = sequence_timer_001_steps[sequence_timer_001_index]

    sequence_timer_001_state = bool(target_state)
    sequence_timer_001_step = sequence_timer_001_index + 1

  # LED consome estado do sequencer
  has_input = True
  input_on = bool(sequence_timer_001_state)
  led_should_be_on = input_on

  # LED branco simples (sem blink)
  led_output_001_led.value(1 if led_should_be_on else 0)
  led_output_001_pwm_r.duty(0)
  led_output_001_pwm_g.duty(0)
  led_output_001_pwm_b.duty(0)
```

---

## 📡 Comunicação Serial

### **Modo Mock (Desenvolvimento)**

Simula ESP32 sem hardware real:

```typescript
class MockSerialBridge {
  async connect() {
    // Simula delay de 800ms
    // Envia mensagem de boas-vindas
  }
  
  async upload(code: string) {
    // Simula chunks de 256 bytes
    // Mostra progresso (0% → 100%)
    // Inicia telemetria fake
  }
  
  startMockTelemetry() {
    setInterval(() => {
      // Gera dados aleatórios:
      // temp: 20-30°C
      // humidity: 50-80%
    }, 1000);
  }
}
```

### **Modo Real (Web Serial API)**

Comunicação nativa com ESP32:

```typescript
class RealSerialBridge {
  async connect() {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    reader = port.readable.getReader();
    writer = port.writable.getWriter();
  }
  
  async upload(code: string) {
    await sendBytes([0x03]);        // Ctrl+C
    await sendBytes([0x01]);        // Ctrl+A (Raw REPL)
    
    // Envia código em chunks
    for (let chunk of splitIntoChunks(code, 256)) {
      await writer.write(chunk);
      await delay(50);
    }
    
    await sendBytes([0x04]);        // Ctrl+D (Execute)
  }
  
  async startReading() {
    while (true) {
      const { value } = await reader.read();
      parseTelemetry(decode(value));
    }
  }
}
```

**Detecção Automática:**
- Variável `VITE_USE_MOCK=true` → MockSerialBridge
- Variável `VITE_USE_MOCK=false` → RealSerialBridge

---

## 🎨 Interface do Usuário

### **Componentes de Layout**

1. **Toolbar** (Topo)
  - Botões: Conectar/Desconectar, Upload, Limpar Console, Nova missão, Salvar `.orbita`, Carregar `.orbita`
  - Dropdown de **perfil de hardware** (kits) e contagem de componentes
  - Presets rápidos de missão (preenche canvas com sequências prontas)
  - Badges de estado (mock/hardware, conectado/uploading/running)

2. **Sidebar** (Esquerda - 256px)
  - Lista de componentes filtrada pelo perfil de hardware selecionado
  - Busca e colapso por categoria
  - Arraste para o canvas

3. **Canvas** (Centro - React Flow)
  - Grid de pontos, zoom/pan, minimap colorido por categoria
  - Setas direcionais, edges suaves, deleção por Delete/Backspace
  - Suporta drop de componentes **e** ações (quando um atuador está selecionado)

4. **Inspector** (Direita - 320px)
  - Nome do componente e parâmetros estáticos
  - **Parâmetros dinâmicos** exibidos conforme entradas conectadas
  - Lista de conexões, avisos de segurança e teste rápido de atuadores
  - Configuração das ações anexadas (LED/buzzer)

5. **Action Panel** (Inferior opcional)
  - Catálogo de ações pré-definidas para o atuador selecionado
  - Arraste/solte para o canvas ou clique para anexar

6. **Console** (Inferior - 192px)
  - Logs de telemetria com timestamp
  - Cores por tipo: verde (data), cinza (log), vermelho (error)
  - Auto-scroll e limpeza rápida

### **Interações do Usuário**

| Ação | Resultado |
|------|-----------|
| Arrastar componente da Sidebar → Canvas | Cria novo nó (respeita drivers permitidos pelo perfil ativo) |
| Arrastar ação do Action Panel → Canvas | Anexa ação ao atuador selecionado |
| Arrastar handle circular → outro handle | Cria edge (conexão) |
| Clicar em nó | Seleciona e abre Inspector |
| Clicar em edge | Seleciona edge (fica dourada) |
| Delete (nó selecionado) | Remove nó + edges conectadas |
| Delete (edge selecionada) | Remove apenas a conexão |
| Ctrl + clique múltiplo | Seleção múltipla |
| Editar campo no Inspector | Atualiza `node.data.parameters` ou ações anexadas |
| Conectar entrada | Inspector mostra parâmetros dinâmicos quando existirem |
| Botão "Upload" | Transpila + Envia para ESP32 |
| Botões Salvar/Carregar | Exporta ou importa missão `.orbita` (inclui nodes, edges, perfil) |

### **Tema Visual**

```css
/* Cores principais */
--bg-primary: #030712 (gray-950)
--bg-secondary: #111827 (gray-900)
--border: #1F2937 (gray-800)
--text: #D1D5DB (gray-300)

/* Categoria de componentes */
--sensor: #3B82F6 (blue-500)
--actuator: #10B981 (green-500)
--logic: #A855F7 (purple-500)

/* Estados de edge */
--edge-default: #60A5FA (blue-400)
--edge-hover: #93C5FD (blue-300)
--edge-selected: #FBBF24 (amber-400)
```

---

## 🛠️ Stack Tecnológico

### **Frontend Framework**
- **React 18.2** - Biblioteca UI com hooks
- **TypeScript 5.2** - Tipagem estática forte
- **Vite 5.0** - Build tool ultra-rápido (ESBuild)

### **Gerenciamento de Estado**
- **Zustand 4.5** - State management minimalista
  - Sem boilerplate (vs Redux)
  - API simples e direta
  - Performance otimizada

### **Canvas Visual**
- **@xyflow/react 12.10** (React Flow)
  - Motor de grafos direcionados
  - Handles customizáveis
  - Minimap, controles, background
  - Eventos de drag/drop/select

### **UI/UX**
- **Tailwind CSS 3.4** - Utility-first CSS
- **Lucide React 0.300** - Ícones SVG otimizados
- **PostCSS + Autoprefixer** - Processamento CSS

### **Comunicação Hardware**
- **Web Serial API** (nativa do navegador)
  - Chrome/Edge 89+
  - Acesso direto à porta serial
  - Sem drivers ou backend

### **Tooling**
- **ESLint** - Linting TypeScript/React
- **TypeScript Compiler** - Type checking
- **Git** - Controle de versão

---

## 📦 Estrutura de Arquivos

```
Prototipo-3/
├── src/
│   ├── core/                    # Lógica de negócio
│   │   ├── types.ts            # Interfaces TypeScript (15+)
│   │   ├── drivers.ts          # Registro de componentes HW
│   │   ├── transpiler.ts       # Algoritmo topológico + codegen
│   │   └── serial.ts           # Mock + Real SerialBridge
│   │
│   ├── config/                 # Perfis de hardware e catálogos
│   │   ├── hardware-profiles.ts# Perfis (ESP32 gen, Pion CanSat, CubeSat)
│   │   ├── mission-presets.ts  # Missões rápidas (piscar/beep)
│   │   └── actions.ts          # Catálogo de ações para atuadores
│   │
│   ├── store/
│   │   └── useStore.ts         # Zustand store único
│   │
│   ├── components/
│   │   ├── nodes/
│   │   │   └── OrbitaNode.tsx  # Nó customizado React Flow
│   │   ├── layout/
│   │   │   ├── Toolbar.tsx     # Barra superior
│   │   │   ├── Sidebar.tsx     # Painel de componentes
│   │   │   ├── Canvas.tsx      # Área de trabalho
│   │   │   ├── Inspector.tsx   # Painel de config (params + ações)
│   │   │   └── ActionPanel.tsx # Painel de ações para atuadores
│   │   │   └── Console.tsx     # Telemetria
│   │   └── ui/
│   │       ├── Button.tsx      # Botão reutilizável
│   │       ├── Card.tsx        # Container
│   │       └── Badge.tsx       # Status badge
│   │
│   ├── App.tsx                 # Componente raiz
│   ├── main.tsx                # Entry point React
│   ├── index.css               # Estilos globais + Tailwind
│   └── vite-env.d.ts           # Type definitions
│
├── public/
├── node_modules/
├── package.json                # Dependências (8 principais)
├── tsconfig.json               # Config TypeScript (strict)
├── vite.config.ts              # Config Vite + path aliases
├── tailwind.config.js          # Tema dark customizado
├── postcss.config.js           # PostCSS plugins
├── .env                        # VITE_USE_MOCK=true
├── index.html                  # HTML base
├── README.md                   # Este arquivo
└── STATUS.md                   # Status detalhado do projeto
```

---

## 🎓 Projeto Acadêmico

**TCC - Engenharia de Computação - UFMA**  
**Autor:** João Pedro  
**Orientador:** [Nome do Orientador]  
**Data:** Dezembro/2025

### **Contribuições Técnicas**

1. **Sistema de Parâmetros Dinâmicos**
   - Parâmetros aparecem contextualmente baseados em conexões
   - Permite lógica condicional complexa sem nós extras

2. **Transpilador Topológico Adaptativo**
   - Processa templates condicionais `{{#if}}...{{/if}}`
   - Remove código não utilizado automaticamente
   - Gera variáveis semanticamente nomeadas

3. **Dual-Mode Serial Bridge**
   - Modo Mock para desenvolvimento rápido
   - Modo Real para hardware físico
   - Interface unificada (ISerialBridge)

4. **UX Otimizada para Engenharia**
   - Feedback visual claro (setas, cores, animações)
   - Deleção intuitiva (Delete key)
   - Seleção múltipla (Ctrl+click)

---

## 📄 Licença

MIT License - Uso livre para fins acadêmicos e comerciais.

---

**Feito com 💙 para nanossatélites** 🛰️
