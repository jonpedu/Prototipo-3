# ARQUITETURA FINAL - ORBITA VPL v2.1

**Sistema de Programação Visual para Kit CanSat PION (ESP32)**

## 📋 Sumário Executivo

ORBITA é uma **Single Page Application (SPA)** de programação visual por componentes, desenvolvida especificamente para o **Kit CanSat PION**, que utiliza o microcontrolador **ESP32** com **MicroPython**. O sistema permite que estudantes criem lógicas de missão através de um canvas visual drag-and-drop, gerando código MicroPython otimizado que é transpilado e enviado ao hardware via **Web Serial API** nativa do navegador.

**Decisão Arquitetural Principal:** Todo o processamento (validação, ordenação topológica, geração de código) ocorre no **cliente** (navegador), sem necessidade de backend. Isso garante portabilidade máxima e elimina dependências de servidor.

---

## 1. ARQUITETURA GERAL (Frontend Client-Side)

### 1.1 Stack Tecnológico

|        Tecnologia         | Versão |                 Função               |
|---------------------------|--------|--------------------------------------|
| **React**                 |  18.2  | Framework UI reativo                 |
| **TypeScript**            |   5.2  | Type safety e contratos de interface |
| **Vite**                  |  5.0   | Build tool (ESBuild) com HMR         |
| **XYFlow (React Flow)**   | 12.10  | Biblioteca de grafos visuais         |
| **Zustand**               |   4.5  | State management centralizado        |
| **Web Serial API**        | Nativa | Comunicação serial com ESP32         |
| **TailwindCSS**           |   3.4  | Estilização responsiva               |

### 1.2 Diagrama de Fluxo de Dados Unidirecional

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE INTERAÇÃO                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │   Sidebar    │  │   Canvas     │  │      Inspector           │   │
│  │ (Componentes)│  │ (React Flow) │  │   (Propriedades)         │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────────┘   │
│         │                 │                 │                       │
│         └─────────────────┴─────────────────┘                       │
│                           ↓                                         │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   ZUSTAND (Store Centralizado)                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • nodes: OrbitaNode[]        (Componentes do grafo)           │ │
│  │  • edges: OrbitaEdge[]        (Conexões entre nós)             │ │
│  │  • hardwareProfile            (Kit PION selecionado)           │ │
│  │  • serialStatus               (Conectado/Desconectado/...)     │ │
│  │  • telemetryMessages[]        (Dados do ESP32)                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      CAMADA DE TRANSPILAÇÃO                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ OrbitaTranspiler (Singleton)                                   │ │
│  │  1. Validação de Grafo                                         │ │
│  │  2. Ordenação Topológica (Kahn's Algorithm)                    │ │
│  │  3. Geração de Código Template                                 │ │
│  │  4. Montagem do Script MicroPython                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  CAMADA DE COMUNICAÇÃO SERIAL                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ RealSerialBridge (Web Serial API)                              │ │
│  │  • Raw REPL Protocol (Ctrl+A / Ctrl+C / Ctrl+D)                │ │
│  │  • Upload em chunks de 256 bytes                               │ │
│  │  • Parsing de telemetria contínua                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        ESP32 (MicroPython)                          │
│  • Execução do código gerado                                        │
│  • Envio de telemetria via Serial (UART0)                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Justificativa da Arquitetura Client-Only

**Vantagens:**
1. **Zero Dependências de Servidor:** Estudantes podem usar offline após carregar a página
2. **Latência Zero:** Transpilação instantânea (< 100ms para grafos de 10 nós)
3. **Escalabilidade Infinita:** Cada navegador é uma instância independente
4. **Portabilidade:** Pode ser hospedado em GitHub Pages, servidor local ou pen drive
5. **Segurança:** Nenhum código do aluno é enviado para servidores externos

**Trade-offs Aceitos:**
- Processamento limitado pelo dispositivo do aluno (mitigado: transpilação é leve)
- Sem persistência cloud nativa (mitigado: export/import `.orbita` local)

---

## 2. O SISTEMA DE INTERAÇÃO (As 3 Abas Principais)

### 2.1 Gerenciador de Componentes (Sidebar)

**Localização:** `src/components/layout/Sidebar.tsx`

**Função:** Catálogo visual de drivers de hardware disponíveis, filtrado dinamicamente pelo **Perfil de Hardware** ativo.

#### Arquitetura de Filtro Baseado em Perfil

```typescript
// src/config/hardware-profiles.ts
export const PION_CANSAT_V1: HardwareProfile = {
    id: HardwareProfileType.PION_CANSAT_V1,
    name: 'Pion CanSat V1',
    allowedDrivers: [
        // Sensores físicos do Kit PION
        'bme280_sensor',      // Temperatura, Pressão, Umidade (I2C)
        'sht30_sensor',       // Temperatura, Umidade (I2C)
        'ccs811_sensor',      // eCO2, TVOC (I2C)
        'imu_mpu9250',        // Acelerômetro, Giroscópio, Magnetômetro (I2C)
        'ldr_sensor',         // Sensor de Luz (ADC GPIO34)
        'vbat_sensor',        // Monitor de Bateria (ADC GPIO35)
        
        // Atuadores físicos do Kit PION
        'led_output',         // LED Branco GPIO2 + RGB GPIO12/13/14
        'buzzer',             // Buzzer GPIO25
        
        // Armazenamento
        'sd_logger',          // SD Card (SPI CS GPIO15)
        
        // Blocos lógicos virtuais
        'sequence_timer',     // Sequenciador temporal (até 4 passos)
        'delay_trigger',      // Gatilho com atraso
        'comparator',         // Comparação A x B ou limites
        'threshold'           // Limiar simples
    ],
    allowCustomPins: false  // Pinos travados para segurança
};
```

**Fluxo de Renderização:**

1. Zustand `hardwareProfile` indica perfil ativo (`PION_CANSAT_V1`)
2. Sidebar lê `HARDWARE_PROFILES[profile].allowedDrivers`
3. `DRIVER_REGISTRY` é filtrado para exibir apenas drivers compatíveis
4. Drivers incompatíveis (ex: Servo Motor não presente no Kit PION) **não aparecem**

**Benefício Educacional:** Impede que alunos usem componentes inexistentes no kit físico, evitando confusão e erros de hardware.

---

### 2.2 O Inspector Dinâmico (Core Innovation)

**Localização:** `src/components/layout/Inspector.tsx` + `src/hooks/useNodeConnections.ts`

#### Conceito: Injeção de Dependência Visual

O Inspector implementa um sistema de **parâmetros condicionais** que só aparecem quando uma **aresta (Edge)** conecta um sensor a um atuador. Isso elimina a necessidade de nós lógicos intermediários para casos simples.

#### Fluxo Técnico Detalhado

```typescript
// 1. Detecção de Conexões (Hook customizado)
// src/hooks/useNodeConnections.ts
export const useNodeConnections = (nodeId: string | null) => {
    const { edges, nodes } = useOrbitaStore();
    
    if (!nodeId) return [];
    
    // Encontra todas as arestas que TERMINAM neste nó
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    // Para cada aresta, encontra o nó de origem
    return incomingEdges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source)!;
        const sourceDriver = getDriver(sourceNode.data.driverId);
        const sourceOutput = sourceDriver.outputs.find(o => o.id === edge.sourceHandle);
        
        return {
            edgeId: edge.id,
            sourceNode,
            sourceHandle: edge.sourceHandle,
            sourceHandleLabel: sourceOutput?.label || edge.sourceHandle,
            targetHandle: edge.targetHandle
        };
    });
};
```

```typescript
// 2. Renderização Condicional no Inspector
// src/components/layout/Inspector.tsx
const Inspector = () => {
    const { selectedNode } = useOrbitaStore();
    const connections = useNodeConnections(selectedNode?.id);
    const driver = getDriver(selectedNode.data.driverId);
    
    // Para cada conexão detectada, verifica se há parâmetros dinâmicos
    connections.forEach(connection => {
        const dynamicParams = driver.dynamicParameters?.find(
            dp => dp.triggeredByInput === connection.targetHandle
        );
        
        if (dynamicParams) {
            // RENDERIZA CARD AZUL com parâmetros específicos
            return (
                <Card className="border-blue-500 bg-blue-950/20">
                    <h4>⚡ Condições: {connection.sourceHandleLabel}</h4>
                    <p>Conectado a: {connection.sourceNode.data.label}</p>
                    
                    {dynamicParams.parameters.map(param => (
                        <InputField key={param.id} {...param} />
                    ))}
                </Card>
            );
        }
    });
};
```

#### Exemplo Concreto: LED Controlado por Temperatura

**Estado Inicial (Nenhuma Conexão):**
```
Inspector do LED:
┌─────────────────────────┐
│ LED Branco              │
├─────────────────────────┤
│ ⚙️ Pino GPIO: 2        | ← Parâmetro estático
└─────────────────────────┘
```

**Após Conectar `BME280.temperature` → `LED.input`:**
```
Inspector do LED:
┌────────────────────────────────────────┐
│ LED Branco                             │
├────────────────────────────────────────┤
│ ⚙️ Pino GPIO: 2                       │
├────────────────────────────────────────┤
│ ⚡ Condições: Temperatura             │ ← NOVO!
│   Conectado a: "BME280 → Temperatura"  │
│                                        │
│   Operador: [> Maior que ▼]            │
│   Limite (°C): [30]                    │
└────────────────────────────────────────┘
```

**Código Gerado:**
```python
# Transpilador detecta a conexão e gera:
led_should_be_on = False

if bme280_001_temp > 30:  # ← Parâmetros do Inspector
    led_should_be_on = True

led_002_led.value(1 if led_should_be_on else 0)
```

#### Vantagens do Sistema

1. **Grafo Limpo:** Elimina nós intermediários de comparação para casos simples
2. **Descoberta Progressiva:** Interface revela funcionalidades conforme o aluno conecta componentes
3. **Type Safety:** Parâmetros dinâmicos só aparecem para tipos de dados compatíveis (ex: temperatura é `NUMBER`, não aceita `BOOLEAN`)

---

### 2.3 O Painel de Ações (Action Panel)

**Localização:** `src/components/layout/ActionPanel.tsx` + `src/config/actions.ts`

#### Conceito: Catálogo de Comportamentos Pré-Definidos

Ações são **templates de configuração** que podem ser arrastados para atuadores, modificando seus parâmetros internos de forma atômica.

#### Arquitetura de Ações

```typescript
// src/config/actions.ts
export interface ActionDefinition {
    id: string;
    label: string;
    description: string;
    driverIds: string[];  // Quais atuadores aceitam esta ação
    fields: ParameterDefinition[];  // Campos configuráveis
}

// Exemplo: Ação de Piscar Alerta
export const LED_ALERT_ACTION: ActionDefinition = {
    id: 'led_alert',
    label: 'Alerta Condicionado',
    description: 'Pisca LED quando sensor exceder limiar',
    driverIds: ['led_output'],
    fields: [
        { id: 'operator', label: 'Operador', type: 'select', 
          options: ['>', '<', '>=', '<='], default: '>' },
        { id: 'threshold', label: 'Limite', type: 'number', 
          default: 30, min: -100, max: 200 },
        { id: 'color', label: 'Cor do alerta', type: 'select',
          options: ['red', 'orange', 'white'], default: 'red' }
    ]
};
```

#### Fluxo de Uso

1. **Drag & Drop:**
   - Aluno seleciona LED no canvas
   - Arrasta ação "Alerta Condicionado" do painel
   - Sistema anexa ação ao nó LED

2. **Configuração:**
   - Inspector exibe seção "Ações Anexadas"
   - Aluno ajusta operador (`>`), limite (`30`) e cor (`red`)

3. **Transpilação:**
   - Transpilador lê `node.data.actions[]`
   - Mescla configuração da ação com template do driver LED
   - Gera código condicional automático

#### Exemplo: Buzzer com Padrão de Beeps

**Ação Aplicada:**
```json
{
  "id": "action_001",
  "type": "buzzer_pattern",
  "config": {
    "tone": "high",
    "duration": 200,
    "interval": 400,
    "count": 3
  }
}
```

**Código Gerado:**
```python
# Buzzer configurado pela ação
buzzer_pwm = PWM(Pin(25), freq=2000)  # Tom 'high'
buzzer_repeat_interval = 400
buzzer_repeat_count = 3
buzzer_beep_duration = 200

# No loop:
if buzzer_should_beep:
    buzzer_pwm.duty(512)
    time.sleep_ms(buzzer_beep_duration)
    buzzer_pwm.duty(0)
    time.sleep_ms(buzzer_repeat_interval)
```

---

## 3. MOTOR DE TRANSPILAÇÃO (De Grafo para MicroPython)

### 3.1 Pipeline de Transpilação em 4 Fases

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1: VALIDAÇÃO                                               │
│  • Detectar ciclos (DFS)                                        │
│  • Verificar drivers existentes                                 │
│  • Validar tipos de conexões                                    │
│  • Checar parâmetros obrigatórios                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FASE 2: ORDENAÇÃO TOPOLÓGICA (Kahn's Algorithm)                 │
│  • Calcular in-degree de cada nó                                │
│  • Processar nós com in-degree=0 primeiro                       │
│  • Garantir ordem de execução linear                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FASE 3: GERAÇÃO DE CÓDIGO TEMPLATE                              │
│  • Gerar nomes de variáveis (sensor_temp_001)                   │
│  • Substituir {{placeholders}} por valores reais                │
│  • Processar condicionais {{#if}}...{{/if}}                     │
│  • Acumular imports, setup e loop code                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ FASE 4: MONTAGEM DO SCRIPT MICROPYTHON                          │
│  • Deduplicate/merge imports                                    │
│  • Gerar guards de bibliotecas (_ensure_lib)                    │
│  • Montar estrutura: imports → setup → while True (loop)        │
│  • Formatar indentação e adicionar comentários                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Algoritmo de Kahn (Ordenação Topológica)

**Localização:** `src/core/transpiler.ts:topologicalSort()`

**Pseudocódigo:**

```python
def topological_sort(nodes, edges):
    # 1. Calcular in-degree (número de arestas chegando)
    in_degree = {node.id: 0 for node in nodes}
    for edge in edges:
        in_degree[edge.target] += 1
    
    # 2. Iniciar fila com nós sem dependências
    queue = [node for node in nodes if in_degree[node.id] == 0]
    sorted_nodes = []
    
    # 3. Processar fila
    while queue:
        node = queue.pop(0)
        sorted_nodes.append(node)
        
        # Reduzir in-degree dos vizinhos
        for edge in edges:
            if edge.source == node.id:
                in_degree[edge.target] -= 1
                if in_degree[edge.target] == 0:
                    queue.append(find_node(edge.target))
    
    # 4. Verificar ciclos
    if len(sorted_nodes) != len(nodes):
        raise Error("CICLO DETECTADO: Grafo inválido")
    
    return sorted_nodes
```

**Complexidade:** `O(V + E)` onde V = nós, E = arestas

**Exemplo Concreto:**

```
Grafo:
BME280 → Comparador → LED
   ↓
   └────→ Buzzer

Ordenação Topológica:
1. BME280 (in-degree=0, sem dependências)
2. Comparador (depende de BME280)
3. LED (depende de Comparador)
4. Buzzer (depende de BME280)

Código gerado segue esta ordem linear.
```

### 3.3 Sistema de Templates e Substituição

**Drivers possuem templates com placeholders:**

```typescript
// src/core/drivers.ts
export const BME280_DRIVER = {
    id: 'bme280_sensor',
    code: {
        imports: ['from machine import Pin, I2C', 'from bme280 import BME280'],
        setupCode: `
{{var_name}}_i2c = I2C(0, sda=Pin({{sda}}), scl=Pin({{scl}}))
{{var_name}}_sensor = BME280(i2c={{var_name}}_i2c, addr={{i2c_addr}})
{{var_name}}_temp = 0
{{var_name}}_press = 0
{{var_name}}_hum = 0
        `,
        loopCode: `
try:
    {{var_name}}_temp = {{var_name}}_sensor.temperature
    {{var_name}}_press = {{var_name}}_sensor.pressure
    {{var_name}}_hum = {{var_name}}_sensor.humidity
except Exception as e:
    print("Erro BME280:", e)
        `
    }
};
```

**Transpilador substitui:**

```typescript
// Para nó com id="bme280_001" e parâmetros {sda:21, scl:22, i2c_addr:0x76}
const varName = "bme280_001";
const params = { sda: 21, scl: 22, i2c_addr: 0x76 };

let code = driver.code.setupCode;
code = code.replace(/\{\{var_name\}\}/g, varName);
code = code.replace(/\{\{sda\}\}/g, String(params.sda));
code = code.replace(/\{\{scl\}\}/g, String(params.scl));
code = code.replace(/\{\{i2c_addr\}\}/g, `0x${params.i2c_addr.toString(16)}`);

// Resultado:
// bme280_001_i2c = I2C(0, sda=Pin(21), scl=Pin(22))
// bme280_001_sensor = BME280(i2c=bme280_001_i2c, addr=0x76)
```

### 3.4 Processamento de Condicionais

**Templates podem ter blocos condicionais:**

```python
{{#if input_temperature}}
if {{input_temperature}} > {{threshold}}:
    led_should_be_on = True
{{/if}}
```

**Lógica de Processamento:**

```typescript
function processConditionals(template: string, connections: Connection[]): string {
    const ifRegex = /\{\{#if input_(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(ifRegex, (match, inputId, content) => {
        // Verifica se existe conexão para esta entrada
        const hasConnection = connections.some(c => c.targetHandle === inputId);
        
        if (hasConnection) {
            // Mantém o bloco e substitui {{input_xxx}} pela variável upstream
            const sourceVar = connections.find(c => c.targetHandle === inputId).sourceVar;
            return content.replace(`{{input_${inputId}}}`, sourceVar);
        } else {
            // Remove o bloco completamente (código morto)
            return '';
        }
    });
}
```

**Benefício:** Código gerado contém apenas lógica realmente usada, reduzindo tamanho e melhorando legibilidade.

### 3.5 Gestão de Imports e Deduplicação

**Problema:** Múltiplos drivers podem importar o mesmo módulo

```python
# Driver BME280
from machine import Pin, I2C

# Driver SHT30
from machine import Pin, I2C

# Driver LED
from machine import Pin, PWM
```

**Solução: Merge Inteligente**

```typescript
class GeneratorState {
    private imports = new Set<string>();
    
    addImport(value: string) {
        // Detecta imports "from X import Y, Z"
        const match = value.match(/^from\s+([^\s]+)\s+import\s+(.+)$/);
        
        if (match) {
            const module = match[1];  // "machine"
            const names = match[2].split(',').map(s => s.trim());  // ["Pin", "I2C"]
            
            // Acumula em mapa: { "machine": Set(["Pin", "I2C", "PWM"]) }
            if (!this.fromImports.has(module)) {
                this.fromImports.set(module, new Set());
            }
            names.forEach(n => this.fromImports.get(module).add(n));
        } else {
            this.imports.add(value);
        }
    }
    
    emit(): string {
        // Mescla imports duplicados
        const merged = Array.from(this.fromImports.entries())
            .map(([mod, names]) => 
                `from ${mod} import ${Array.from(names).sort().join(', ')}`
            );
        
        return merged.join('\n');
        // Resultado:
        // from machine import I2C, PWM, Pin  (único import, ordenado)
    }
}
```

---

## 4. COMUNICAÇÃO SERIAL E HARDWARE

### 4.1 Implementação do Raw REPL Protocol

**Localização:** `src/core/serial.ts:RealSerialBridge`

#### Protocolo Raw REPL do MicroPython

Raw REPL é um modo especial do MicroPython que permite envio de código via serial sem interferência do shell interativo.

**Sequência de Bytes:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Ctrl+C (0x03) → Interrompe execução atual                    │
│    Response: "KeyboardInterrupt\r\n>>>"                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Ctrl+A (0x01) → Entra em Raw REPL mode                       │
│    Response: "raw REPL; CTRL-B to exit\r\n>"                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Envia código em chunks de 256 bytes                          │
│    (Delay de 20ms entre chunks para evitar overflow do buffer)  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Ctrl+D (0x04) → Executa código (soft reboot)                 │
│    Response: "OK<binary output>OK"                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Leitura contínua de telemetria (loop infinito)               │
│    Parser: "DATA: key=value" → {parsed: {key: value}}           │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementação Técnica

```typescript
// src/core/serial.ts
async upload(code: string): Promise<void> {
    const encoder = new TextEncoder();
    const codeBytes = encoder.encode(code);
    const CHUNK_SIZE = 256;
    const DELAY_MS = 20;
    
    // 1. Interrompe execução
    await this.sendBytes(new Uint8Array([0x03]));  // Ctrl+C
    await this.delay(100);
    
    // 2. Entra em Raw REPL
    await this.sendBytes(new Uint8Array([0x01]));  // Ctrl+A
    await this.delay(200);
    
    // 3. Envia código em chunks
    for (let i = 0; i < codeBytes.length; i += CHUNK_SIZE) {
        const chunk = codeBytes.slice(i, i + CHUNK_SIZE);
        await this.writer.write(chunk);
        await this.delay(DELAY_MS);
        
        const progress = Math.floor((i / codeBytes.length) * 100);
        this.sendTelemetry({ type: 'log', content: `Upload: ${progress}%` });
    }
    
    // 4. Executa código
    await this.sendBytes(new Uint8Array([0x04]));  // Ctrl+D
    await this.delay(500);
    
    this.updateStatus(SerialStatus.RUNNING);
    this.startReading();  // Inicia leitura contínua
}
```

#### Parsing de Telemetria

**Código MicroPython gerado sempre usa padrão:**

```python
print(f"DATA: temp={temp:.1f},hum={hum:.1f},press={press:.1f}")
```

**Parser no navegador:**

```typescript
private parseTelemetry(line: string): TelemetryMessage {
    const dataMatch = line.match(/^DATA:\s*(.+)$/);
    
    if (dataMatch) {
        const pairs = dataMatch[1].split(',');
        const parsed: Record<string, number> = {};
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            parsed[key.trim()] = parseFloat(value);
        });
        
        return {
            timestamp: Date.now(),
            type: 'data',
            content: line,
            parsed  // { temp: 25.3, hum: 60.2, press: 1013.5 }
        };
    }
    
    return { timestamp: Date.now(), type: 'log', content: line };
}
```

### 4.2 Sistema de Perfis de Hardware (Pin Locking)

**Localização:** `src/config/hardware-profiles.ts`

#### Conceito: Prevenção de Erros Físicos

Perfis de hardware **travam pinos GPIO** para evitar que alunos configurem conexões erradas que poderiam danificar o ESP32.

#### Estrutura de um Perfil

```typescript
export interface HardwareProfile {
    id: HardwareProfileType;
    name: string;
    description: string;
    pinMappings: PinMapping[];        // Mapa de pinos obrigatórios
    allowCustomPins: boolean;         // Permitir edição?
    allowedDrivers: string[];         // Whitelist de drivers
}

interface PinMapping {
    driverId: string;      // 'bme280_sensor'
    pin: number;           // 21 (SDA)
    label: string;         // 'I2C SDA (GPIO21)'
    locked: boolean;       // true (não editável)
    parameterId?: string;  // 'sda' (qual campo do driver)
}
```

#### Perfil PION CanSat V1 (Completo)

```typescript
export const PION_CANSAT_V1: HardwareProfile = {
    id: HardwareProfileType.PION_CANSAT_V1,
    name: 'Pion CanSat V1',
    allowCustomPins: false,  // ← Pinos TRAVADOS
    
    pinMappings: [
        // Barramento I2C (compartilhado por todos os sensores I2C)
        { driverId: 'bme280_sensor', pin: 21, label: 'I2C SDA (21)', 
          locked: true, parameterId: 'sda' },
        { driverId: 'bme280_sensor', pin: 22, label: 'I2C SCL (22)', 
          locked: true, parameterId: 'scl' },
        { driverId: 'sht30_sensor', pin: 21, label: 'I2C SDA (21)', 
          locked: true, parameterId: 'sda' },
        { driverId: 'sht30_sensor', pin: 22, label: 'I2C SCL (22)', 
          locked: true, parameterId: 'scl' },
        { driverId: 'ccs811_sensor', pin: 21, label: 'I2C SDA (21)', 
          locked: true, parameterId: 'sda' },
        { driverId: 'ccs811_sensor', pin: 22, label: 'I2C SCL (22)', 
          locked: true, parameterId: 'scl' },
        { driverId: 'imu_mpu9250', pin: 21, label: 'I2C SDA (21)', 
          locked: true, parameterId: 'sda' },
        { driverId: 'imu_mpu9250', pin: 22, label: 'I2C SCL (22)', 
          locked: true, parameterId: 'scl' },
        
        // Analógicos (ADC exclusivos)
        { driverId: 'ldr_sensor', pin: 34, label: 'LDR (GPIO34)', 
          locked: true },
        { driverId: 'vbat_sensor', pin: 35, label: 'VBAT (GPIO35)', 
          locked: true },
        
        // Digital (pinos dedicados)
        { driverId: 'buzzer', pin: 25, label: 'Buzzer (GPIO25)', 
          locked: true },
        { driverId: 'led_output', pin: 2, label: 'LED Branco (GPIO2)', 
          locked: true },
        { driverId: 'led_output', pin: 12, label: 'LED RGB R (GPIO12)', 
          locked: true, parameterId: 'pin_r' },
        { driverId: 'led_output', pin: 13, label: 'LED RGB G (GPIO13)', 
          locked: true, parameterId: 'pin_g' },
        { driverId: 'led_output', pin: 14, label: 'LED RGB B (GPIO14)', 
          locked: true, parameterId: 'pin_b' },
        
        // SPI (SD Card)
        { driverId: 'sd_logger', pin: 15, label: 'SD CS (GPIO15)', 
          locked: true, parameterId: 'cs_pin' }
    ],
    
    allowedDrivers: [
        'bme280_sensor', 'sht30_sensor', 'ccs811_sensor', 'imu_mpu9250',
        'ldr_sensor', 'vbat_sensor', 'led_output', 'buzzer', 'sd_logger',
        'sequence_timer', 'delay_trigger', 'comparator', 'threshold'
    ]
};
```

#### Aplicação no Inspector

```typescript
// src/components/layout/Inspector.tsx
const Inspector = ({ selectedNode }) => {
    const { hardwareProfile } = useOrbitaStore();
    const profile = getHardwareProfile(hardwareProfile);
    const driver = getDriver(selectedNode.data.driverId);
    
    // Para cada parâmetro do driver
    driver.parameters.forEach(param => {
        // Verifica se existe mapeamento de pino no perfil
        const pinMapping = getPinMapping(profile, driver.id, param.id);
        
        if (pinMapping && pinMapping.locked) {
            // Exibe campo DESABILITADO com valor fixo
            return (
                <input
                    type="number"
                    value={pinMapping.pin}
                    disabled={true}
                    title={`Pino travado pelo perfil ${profile.name}`}
                    className="bg-gray-800 text-gray-500 cursor-not-allowed"
                />
            );
        } else {
            // Exibe campo editável (perfil genérico)
            return (
                <input
                    type="number"
                    value={selectedNode.data.parameters[param.id]}
                    onChange={(e) => handleParameterChange(param.id, e.target.value)}
                    className="bg-gray-900 text-gray-200"
                />
            );
        }
    });
};
```

**Resultado Visual:**

```
Inspector do BME280 (Perfil PION ativo):
┌────────────────────────────────────┐
│ BME280 - Sensor Ambiental          │
├────────────────────────────────────┤
│ 🔒 Pino SDA: 21 [TRAVADO]         │ ← Campo desabilitado
│ 🔒 Pino SCL: 22 [TRAVADO]         │ ← Campo desabilitado
│ 📍 Endereço I2C: [0x76 ▼]         │ ← Editável
└────────────────────────────────────┘
```

---

## 5. FLUXO COMPLETO: DO DRAG-AND-DROP AO ESP32

### 5.1 Cenário Real: Alerta de Temperatura

**Objetivo:** LED liga e buzzer toca se temperatura > 35°C.

#### Passo a Passo no Sistema

```
1. DRAG-AND-DROP (Sidebar → Canvas)
   • Arrasta "BME280" para canvas
   • Arrasta "LED" para canvas
   • Arrasta "Buzzer" para canvas

2. CONEXÕES (Canvas)
   • BME280.temperature → LED.input
   • BME280.temperature → Buzzer.input

3. CONFIGURAÇÃO (Inspector)
   LED selecionado:
     - Operador: > (maior que)
     - Limite: 35
   
   Buzzer selecionado:
     - Operador: > (maior que)
     - Limite: 35
     - Tom: Alto
     - Duração: 500ms

4. TRANSPILAÇÃO (Toolbar → Upload)
   • Zustand coleta nodes[] e edges[]
   • Transpiler valida grafo (sem ciclos)
   • Ordenação topológica: [BME280, LED, Buzzer]
   • Geração de código template
   • Montagem final

5. UPLOAD (Serial Bridge)
   • Ctrl+C (interrompe execução atual)
   • Ctrl+A (Raw REPL mode)
   • Envia código em chunks de 256 bytes
   • Ctrl+D (executa)
   • Feedback: "Upload: 100%"

6. EXECUÇÃO (ESP32)
   • Loop principal lê BME280 a cada 50ms
   • Se temp > 35:
       - LED.value(1)
       - Buzzer PWM liga por 500ms
   • Telemetria via Serial: "DATA: temp=36.2"

7. MONITORAMENTO (Console)
   • Parser detecta "DATA: temp=36.2"
   • Renderiza linha verde: "📊 36.2°C"
   • Aluno observa em tempo real
```

#### Código MicroPython Gerado (Completo)

```python
# ================================================
# ORBITA - Código gerado automaticamente
# 2025-12-18T15:30:00.000Z
# Total de nós: 3
# ================================================
from machine import Pin, I2C, PWM
from bme280 import BME280
import time

# ===== INICIALIZAÇÃO =====
# BME280 Sensor
bme280_001_i2c = I2C(0, sda=Pin(21), scl=Pin(22))
bme280_001_sensor = BME280(i2c=bme280_001_i2c, addr=0x76)
bme280_001_temp = 0
bme280_001_press = 0
bme280_001_hum = 0

# LED Branco
led_002_led = Pin(2, Pin.OUT)
led_002_led.value(0)

# Buzzer
buzzer_003_pwm = PWM(Pin(25), freq=2000)
buzzer_003_pwm.duty(0)
buzzer_003_last_beep = 0

# ===== LOOP PRINCIPAL =====
while True:
    # BME280: Leitura do sensor
    try:
        bme280_001_temp = bme280_001_sensor.temperature
        bme280_001_press = bme280_001_sensor.pressure
        bme280_001_hum = bme280_001_sensor.humidity
        print(f"DATA: temp={bme280_001_temp:.1f},press={bme280_001_press:.1f},hum={bme280_001_hum:.1f}")
    except Exception as e:
        print("Erro BME280:", e)
    
    # LED: Controle baseado em temperatura
    led_should_be_on = False
    if bme280_001_temp > 35:
        led_should_be_on = True
    led_002_led.value(1 if led_should_be_on else 0)
    
    # Buzzer: Beep se temperatura > 35
    buzzer_should_beep = False
    if bme280_001_temp > 35:
        buzzer_should_beep = True
    
    if buzzer_should_beep:
        now = time.ticks_ms()
        if time.ticks_diff(now, buzzer_003_last_beep) >= 1000:  # Cooldown 1s
            buzzer_003_pwm.duty(512)  # 50% duty
            time.sleep_ms(500)
            buzzer_003_pwm.duty(0)
            buzzer_003_last_beep = now
    
    time.sleep_ms(50)  # Loop throttle
```

---

## 6. DECISÕES TÉCNICAS E TRADE-OFFS

### 6.1 Por que Client-Side Only?

| Aspecto | Decisão | Justificativa |
|---------|---------|---------------|
| **Performance** | Transpilação no navegador | Grafos típicos (10 nós) compilam em < 100ms. Hardware aluno adequado. |
| **Escalabilidade** | Sem servidor | Ilimitado. Cada aluno é uma instância isolada. |
| **Offline-First** | SPA + Web Serial | Funciona sem internet após carregamento inicial. |
| **Segurança** | Código não sai do dispositivo | Zero risco de vazamento de projetos dos alunos. |
| **Custo** | Hospedagem estática | GitHub Pages gratuito. Sem custos de backend. |

**Trade-off Aceito:** Limitação de recursos do dispositivo do aluno. **Mitigação:** Transpilador leve (< 1MB minified), validação incremental.

### 6.2 Por que XYFlow (React Flow)?

| Alternativa | Por que foi rejeitada |
|-------------|----------------------|
| **D3.js** | Muito baixo nível, precisaria implementar drag-and-drop, zoom, minimap do zero |
| **Cytoscape.js** | Focado em análise de grafos científicos, não em interação visual educacional |
| **GoJS** | Proprietário (licença cara), lock-in de vendor |
| **Custom Canvas API** | 3-4 semanas de desenvolvimento, bugs de rendering |

**Escolha:** XYFlow (React Flow) - Open source, hooks nativos, ecosystem maduro (20k+ stars), documentação excelente.

### 6.3 Por que MicroPython e não Arduino C++?

| Critério | MicroPython | Arduino C++ |
|----------|-------------|-------------|
| **Curva de Aprendizado** | ✅ Sintaxe Python familiar | ❌ Ponteiros, tipos, compilação |
| **Iteração Rápida** | ✅ Upload instantâneo via Serial | ❌ Compilação + upload 30s+ |
| **Depuração** | ✅ REPL interativo, print() nativo | ❌ Serial.print(), sem REPL |
| **Educacional** | ✅ Foco em lógica, não sintaxe | ❌ Overhead de aprender C++ |
| **Portabilidade** | ✅ Roda em ESP32, RP2040, STM32 | ❌ Código específico de plataforma |

**Decisão:** MicroPython prioriza a **experiência de aprendizado** sobre performance bruta (não crítica para CanSat).

---

## 7. MÉTRICAS E ESTATÍSTICAS

### 7.1 Métricas de Código

| Métrica                        | Valor        |
|--------------------------------|--------------|
| **Total de Linhas TypeScript** | ~4.800       |
| **Componentes React**          | 15           |
| **Hooks Customizados**         | 3            |
| **Drivers de Hardware**        | 14           |
| **Ações Pré-Definidas**        | 7            |
| **Perfis de Hardware**         | 3            |
| **Bundle Size (minified)**     | ~980 KB      |
| **Dependências**               | 8 principais |

### 7.2 Performance

| Operação                  | Tempo Médio | Worst Case |
|---------------------------|-------------|------------|
| **Transpilação (10 nós)** | 45ms        | 120ms      |
| **Upload Serial (5KB)**   | 2.5s        | 4s         |
| **Parsing Telemetria**    | < 1ms/linha | 3ms/linha  |
| **Render UI (30 nós)**    | 60 FPS      | 45 FPS     |

### 7.3 Suporte a Navegadores

|   Navegador | Versão Mínima | Web Serial API       |
|-------------|---------------|----------------------|
| **Chrome**  | 89+           | ✅ Nativo           |
| **Edge**    | 89+           | ✅ Nativo           |
| **Opera**   | 75+           | ✅ Nativo           |
| **Firefox** |       -       | ❌ Não suportado    |
| **Safari**  |       -       | ❌ Não suportado    |

**Recomendação Oficial:** Chrome/Edge em Windows, macOS ou Linux.

---

## 8. PONTOS DE EXTENSÃO FUTUROS

### 8.1 Arquitetura Preparada Para

1. **Multi-Target Transpilers**
   - `CircuitPythonTranspiler` para Adafruit boards
   - `ArduinoCppTranspiler` para código C++ compilado

2. **Cloud Persistence**
   - Integração com Firebase/Supabase para backup de projetos
   - Sistema de compartilhamento de missões entre alunos

3. **Simulação 3D**
   - Three.js para visualizar trajetória de lançamento
   - Dados de IMU renderizados em tempo real

4. **Depuração Avançada**
   - Breakpoints visuais no grafo
   - Step-by-step execution com highlight de nó ativo

5. **Biblioteca de Missões**
   - Templates pré-definidos (Detecção de Apogeu, Data Logging, etc)
   - Sistema de rating e comentários

---

## 9. CONCLUSÃO TÉCNICA

A arquitetura do ORBITA v2.1 demonstra que é viável criar uma **IDE visual completa** executando inteiramente no navegador, sem sacrificar funcionalidade ou experiência do usuário. As decisões de design (client-only, XYFlow, MicroPython, perfis de hardware) priorizam **acessibilidade educacional** e **confiabilidade operacional** para o contexto de ensino de engenharia aeroespacial com kits CanSat.

O sistema de **perfis de hardware com pinos travados** é uma inovação crítica que previne erros físicos custosos, enquanto o **Inspector Dinâmico** reduz a complexidade cognitiva ao eliminar nós lógicos intermediários. A combinação dessas features cria uma experiência de programação **progressiva**: alunos iniciantes usam conexões simples (sensor → atuador com condições inline), enquanto avançados criam grafos complexos com sequenciadores e lógica multi-sensor.

A arquitetura está **pronta para escala**, suportando desde protótipos individuais até adoção institucional em cursos de engenharia aeroespacial, mantendo zero custo operacional de infraestrutura.

---

**Versão do Documento:** 1.0  
**Data:** 18 de Dezembro de 2025  
**Autor:** Sistema ORBITA v2.1  
**Público-Alvo:** Capítulo 4 - Engenharia do Sistema (TCC)
