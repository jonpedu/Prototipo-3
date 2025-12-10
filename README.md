# 🛰️ ORBITA - Ambiente de Programação Visual para Nanossatélites

![Status](https://img.shields.io/badge/Status-MVP_v2-success)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)
![React Flow](https://img.shields.io/badge/React_Flow-12.10-FF6B9D)

**ORBITA** é uma Single Page Application (SPA) para programação visual de nanossatélites. Permite criar lógica de missão através de interface drag-and-drop, gerando código MicroPython otimizado para execução em ESP32, com suporte a parâmetros dinâmicos baseados em conexões entre componentes.

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

Sistema inovador que mostra parâmetros **apenas quando entrada está conectada**:

```typescript
dynamicParameters: [
  {
    inputId: 'temperature',      // Aparece quando 'temperature' conectada
    parameters: [
      {
        id: 'temp_operator',
        label: 'Condição de Temperatura',
        type: 'select',
        options: ['>', '<', '>=', '<=', '==']
      },
      {
        id: 'temp_threshold',
        label: 'Limite (°C)',
        type: 'number',
        default: 30
      }
    ]
  }
]
```

**Exemplo: LED com Temperatura**
- Usuário conecta `DHT11.temperature` → `LED.temperature`
- Inspector detecta conexão automaticamente
- Exibe card azul com "Condições da Entrada 'Temperatura'"
- Usuário configura: `temp > 30`
- Transpiler gera: `if temp_sensor_001_temperature > 30: led.value(1)`

### **Componentes Disponíveis**

| Categoria | Componente | Entradas | Saídas | Parâmetros Dinâmicos |
|-----------|-----------|----------|--------|---------------------|
| **Sensores** | Gerador de Dados | - | value | - |
| | DHT11/DHT22 | - | temperature, humidity | - |
| **Atuadores** | LED | temperature, humidity, value, state | - | ✅ Condições para cada entrada |
| | Console Log | value | - | - |
| **Lógica** | Comparador | a, b | result | - |
| | Limiar | value | active | - |

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
DHT11 (pin=4) → [temperature] → LED (pin=2, temp>30)
```

**Output (MicroPython):**
```python
# ================================================
# ORBITA - Código gerado automaticamente
# 2025-12-10T15:30:00.000Z
# Total de nós: 2
# ================================================
from machine import Pin
import dht
import time

# ===== INICIALIZAÇÃO =====
temperature_sensor_001_sensor = dht.DHT11(Pin(4))
temperature_sensor_001_last_read = 0
temperature_sensor_001_temp = 0
temperature_sensor_001_hum = 0

led_output_001_led = Pin(2, Pin.OUT)

# ===== LOOP PRINCIPAL =====
while True:
    if time.ticks_diff(time.ticks_ms(), temperature_sensor_001_last_read) >= 2000:
        try:
            temperature_sensor_001_sensor.measure()
            temperature_sensor_001_temp = temperature_sensor_001_sensor.temperature()
            temperature_sensor_001_hum = temperature_sensor_001_sensor.humidity()
            temperature_sensor_001_last_read = time.ticks_ms()
        except Exception as e:
            print("Erro DHT:", e)
    
    # Avalia condições baseadas nas entradas conectadas
    led_should_be_on = False
    
    if temperature_sensor_001_temperature > 30:
        led_should_be_on = True
    
    led_output_001_led.value(1 if led_should_be_on else 0)
    
    time.sleep_ms(50)  # Pequeno delay para evitar sobrecarga
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
   - Botões: Conectar, Upload, Limpar Console
   - Status: Conexão, Modo Mock, Contador de nós
   - Badges coloridos por estado (verde/amarelo/vermelho)

2. **Sidebar** (Esquerda - 256px)
   - Lista de componentes por categoria
   - Drag handles para arrastar ao canvas
   - Ícones Lucide React

3. **Canvas** (Centro - React Flow)
   - Grid de pontos (BackgroundVariant.Dots)
   - Controles de zoom/pan
   - Minimap com cores por categoria
   - Setas direcionais nas edges
   - Deleção: Select + Delete key

4. **Inspector** (Direita - 320px)
   - Nome do componente (editável)
   - Parâmetros estáticos (card cinza)
   - **Parâmetros dinâmicos** (card azul) ← NOVIDADE
   - Lista de conectores (inputs/outputs)
   - Botão de remoção

5. **Console** (Inferior - 192px)
   - Logs de telemetria com timestamp
   - Cores por tipo: verde (data), cinza (log), vermelho (error)
   - Auto-scroll
   - Contador de mensagens

### **Interações do Usuário**

| Ação | Resultado |
|------|-----------|
| Arrastar componente da Sidebar → Canvas | Cria novo nó |
| Arrastar handle circular → outro handle | Cria edge (conexão) |
| Clicar em nó | Seleciona e abre Inspector |
| Clicar em edge | Seleciona edge (fica dourada) |
| Delete (nó selecionado) | Remove nó + edges conectadas |
| Delete (edge selecionada) | Remove apenas a conexão |
| Ctrl + clique múltiplo | Seleção múltipla |
| Editar campo no Inspector | Atualiza `node.data.parameters` |
| Conectar entrada | Inspector mostra parâmetros dinâmicos |
| Botão "Upload" | Transpila + Envia para ESP32 |

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
│   │   │   ├── Inspector.tsx   # Painel de config (com dinâmicos)
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
