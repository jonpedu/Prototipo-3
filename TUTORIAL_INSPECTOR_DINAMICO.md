# 🎓 Tutorial: Sistema de Lógica Visual do ORBITA

## 📝 Visão Geral

Este tutorial mostra como usar o **Sistema de Lógica Visual** do ORBITA, uma plataforma de programação por componentes para missões CanSat/CubeSat com MicroPython.

---

## 🎯 Conceito Central

> **Fluxo de dados visual.**  
> Conecte sensores → nós lógicos → atuadores para criar comportamentos complexos sem escrever código.

**Arquitetura do Sistema**:
```
Sensor → Nó Lógico → Atuador
  ↓         ↓           ↓
 Leitura  Decisão    Ação
```

**Exemplo Prático**:
```
SHT20/31 → Comparador → LED
 (temp)    (> 30°C?)   (liga/desliga)
```

---

## 📖 Tutorial 1: LED Controlado por Temperatura

### Objetivo
Criar um LED que acende quando a temperatura ultrapassa 30°C usando o nó Comparador.

### Passos

#### 1️⃣ Adicionar Componentes
- Arraste **"Sensor de Temperatura"** da sidebar (categoria **Sensores**)
- Arraste **"Comparador"** da sidebar (categoria **Lógica**)
- Arraste **"LED"** da sidebar (categoria **Atuadores**)

#### 2️⃣ Conectar Sensor → Comparador
- Clique e arraste da porta **`temperature`** (verde 🟢) do sensor
- Solte na porta **`A`** (azul 🔵) do Comparador
- ✅ Uma linha aparece conectando os dois

#### 3️⃣ Conectar Comparador → LED
- Clique e arraste da porta **`result`** (verde 🟢) do Comparador
- Solte na porta **`input`** (azul 🔵) do LED
- ✅ Segunda conexão criada

#### 4️⃣ Configurar o Comparador
Clique no nó **Comparador** para abrir o Inspector à direita:
```
┌─────────────────────────────┐
│ Comparador                  │
├─────────────────────────────┤
│ 📝 Nome do Componente       │
│   Comparador                │
│                             │
│ ⚙️ Configurações            │
│                             │
│   Modo                      │
│   [Comparar com limites ▼]  │
│                             │
│   Operador A                │
│   [Maior que (>) ▼]         │
│                             │
│   Limite A                  │
│   [30]                      │
│                             │
│   Combinar (limites)        │
│   [OR (A ou B) ▼]           │
└─────────────────────────────┘
```

Configure:
- **Modo**: `Comparar com limites`
- **Operador A**: `Maior que (>)`
- **Limite A**: `30`

#### 5️⃣ Testar no Modo Simulação
1. Verifique se o badge **🟡 SIMULAÇÃO** está ativo
2. Verifique se **MODO MOCK** está ativo na toolbar
3. Observe o Console exibir dados simulados:
   ```
   📊 Temperatura: 25.3°C → LED: OFF (25.3 ≤ 30)
   📊 Temperatura: 31.2°C → LED: ON (31.2 > 30)
   ```

#### 6️⃣ Código Gerado (MicroPython)
```python
# Sensor de Temperatura (SHT20/31)
import time
from machine import Pin, I2C

i2c = I2C(0, sda=Pin(21), scl=Pin(22), freq=100000)
temp_sensor_001_temp = 0

# Comparador (resultado da comparação)
comparator_001_result = False

# LED
led_001_led = Pin(2, Pin.OUT)

while True:
    # Lê temperatura do sensor
    # [código de leitura I2C do SHT20/31]
    temp_sensor_001_temp = 26.5  # exemplo
    
    # Avalia comparação: temperatura > 30?
    comparator_001_result = temp_sensor_001_temp > 30
    
    # Controla LED baseado no resultado
    led_001_led.value(1 if comparator_001_result else 0)
    
    time.sleep_ms(50)
```

---

## 📖 Tutorial 2: LED com Múltiplas Condições

### Objetivo
LED acende se **temperatura > 30°C** OU **umidade > 60%**.

### Passos
 (OR/AND)

### Objetivo
LED acende se **temperatura > 30°C** OU **umidade > 60%**.

### Passos

#### 1️⃣ Adicionar Componentes
- **Sensor de Temperatura** (já tem temperatura e umidade)
- **Comparador** (para avaliar as duas condições)
- **LED**

#### 2️⃣ Fazer as Conexões
```
Sensor → Comparador → LED
  ├──────────┤
  temperature → A
  humidity → B
```

Conexões:
- `Sensor.temperature` → `Comparador.A`
- `Sensor.humidity` → `Comparador.B`
- `Comparador.result` → `LED.input`

#### 3️⃣ Configurar o Comparador
Clique no nó **Comparador**:
```
┌─────────────────────────────┐
│ Comparador                  │
├─────────────────────────────┤
│ Modo                        │
│ [Comparar com limites ▼]    │
│                             │
│ Operador A                  │
│ [Maior que (>) ▼]           │
│ Limite A: [30]              │
│                             │
│ Operador B                  │
│ [Maior que (>) ▼]           │
│ Limite B: [60]              │
│                             │
│ Combinar (limites)          │
│ [OR (A ou B) ▼]             │ ← Escolha OR ou AND
└─────────────────────────────┘
```

Configure:
- **Modo**: `Comparar com limites`Sensor

### Objetivo
Controlar um servo motor baseado na leitura de um sensor usando o Comparador para definir posições.

### Passos

#### 1️⃣ Adicionar Componentes
- **Gerador de Dados** (simula sensor com valores 0-100)
- **Comparador** (define faixas de valores)
- **Servo Motor**

#### 2️⃣ Conectar
```
Gerador → Comparador → Servo
  value       A        input
```

Conexões:
- `Gerador.value` → `Comparador.A`
- `Comparador.result` → `Servo.input`

#### 3️⃣ Configurar Comparador
Modo: **Comparar com limites**
```
Operador A: [Maior que (>) ▼]
Limite A: [50]
```

Isso faz o servo mover para:
- **0°** se valor ≤ 50
- **180°** se valor > 50

#### 4️⃣ Configurar Servo Motor
Clique no nó **Servo Motor**:
```
┌─────────────────────────────┐
│ Servo Motor                 │
├─────────────────────────────┤
│ Pino GPIO: [18]             │
│ Ângulo Mínimo: [0]          │
│ Ângulo Máximo: [180]        │
│ Ângulo Inicial: [90]        │
└─────────────────────────────┘
```

#### 5️⃣ Código Gerado
```python
from machine import Pin, PWM

# Gerador de dados (simulação)
data_gen_001 = 50

# Comparador
comparator_001_result = data_gen_001com Buzzer

### Objetivo
Buzzer toca se **temperatura > 35°C** E **umidade < 30%** (condições críticas simultâneas).

### Passos

#### 1️⃣ Componentes
- **Sensor de Temperatura** (fornece temp e umidade)
- **Comparador** (avalia as duas condições)
- **Buzzer** (alarme sonoro)

#### 2️⃣ Conexões
```
Sensor → Comparador → Buzzer
  ├──────────┤
  temperature → A
  humidity → B
```

Conexões:
- `Sensor.temperature` → `Comparador.A`
- `Sensor.humidity` → `Comparador.B`
- `Comparador.result` → `Buzzer.input`

#### 3️⃣ Configurar Comparador para AND
```
┌─────────────────────────────┐
│ Modo                        │
│ [Comparar com limites ▼]    │
│                             │
│ Operador A: [> Maior que]   │
│ Limite A: [35]              │
│                             │
│ Operador B: [< Menor que]   │
│ Limite B: [30]              │
│                             │
│ Combinar: [AND (A e B) ▼]   │ ← Ambas devem ser True
└─────────────────────────────┘
```

#### 4️⃣ Configurar Buzzer
```
┌─────────────────────────────┐
│ Buzzer                      │
├─────────────────────────────┤
│ Pino GPIO: [23]             │
│ Tom: [Alto]                 │
│ Duração (ms): [500]         │
│ Repetir: [Sim]              │
│ Intervalo (ms): [1000]      │
└─────────────────────────────┘
```

#### 5️⃣ Comportamento
```python
# Avalia condições com AND
cond_a = temp > 35    # Temperatura crítica alta
cond_b = humidity < 30  # Umidade crítica baixa

comparator_001_result = cond_a and cond_b  # Ambas devem ser True

if comparator_001_result:
    # Toca buzzer em padrão repetitivo
    buzzer_pwm.duty(512)  # 50% duty cycle
    time.sleep_ms(500)
    buzzer_pwm.duty(0)
    time.sleeas Portas**
- 🟢 **Verde**: Portas de saída (outputs) - dados fluem PARA FORA
- 🔵 **Azul**: Portas de entrada (inputs) - dados fluem PARA DENTRO
- **Regra**: Sempre conecte Verde → Azul (output → input)

### **Cores dos Nós**
- 🔵 **Azul**: Sensores (SHT20/31, DHT11, GPS, etc.)
- 🟢 **Verde**: Atuadores (LED, Buzzer, Servo, SD Card)
- 🟣 **Roxo**: Lógica (Comparador, Timer, Sequenciador)
- 🟡 **Amarelo**: Comunicação (Logger SD, Console Log)

### **Feedback Visual**
- ✅ **Edge azul sólida**: Conexão válida
- ✅ **Edge dourada**: Conexão selecionada
- ❌ **Edge vermelha tracejada**: Conexão inválida (tipos incompatíveis)
- 🎯 **Setas nas edges**: Indicam direção do fluxo de dados

### **Atalhos de Teclado**
- `Delete` ou `Backspace`: Remove nó/edge selecionado
### **1. Experimente Padrões Comuns**

**Monitoramento Simples:**
```
Sensor → Console Log
```

**Controle com Threshold:**
```
Sensor → Comparador → Atuador
```

**Alarme Duplo:**
```
Sensor → Comparador → Buzzer
       └──────────────→ LED
```

**Sistema Complexo:**
```
Sensor A ┐
Sensor B ├→ Comparador → Sequenciador → [Ações temporais]
Sensor C ┘
```

### **2. Ajuste Parâmetros**

**Operadores Disponíveis:**
- `>` Maior que
- `<` Menor que
- `>=` Maior ou igual
- `<=` Menor ou igual
- `==` Igual
- `!=` Diferente

**Lógica Combinatória:**
- `OR (A ou B)`: Liga se **qualquer** condição for True
- `AND (A e B)`: Liga apenas se **todas** as condições forem True

### **3. Monitore em Tempo Real**

- **Console Log** no canvas mostra valores simulados
- Use o badge **🟡 SIMULAÇÃO** para testar sem hardware
- Valores aparecem no formato: `📊 temperatura: 25.3°C`

### **4Como sei quais portas conectar?
**R:** Use as cores:
- 🟢 **Verde** = Saída (output) - conecte DAQUI
- 🔵 **Azul** = Entrada (input) - conecte PARA CÁ
- **Sempre**: Verde → Azul

### P: Posso conectar múltiplas saídas na mesma entrada?
**R:** Não. Cada porta de entrada aceita apenas **1 conexão**. Para avaliar múltiplas condições:
- Use o **Comparador** com entradas A e B
- Configure o modo `Comparar com limites` para avaliar ambas

### P: O que significa "Modo Mock" na toolbar?
**R:** 
- **MODO MOCK ON**: Usa dados simulados (não precisa de hardware)
- **MODO MOCK OFF**: Usa hardware real (ESP32 conectado via USB)

### P: Como remover uma conexão?
**R:** 
1. Clique na **edge** (linha conectando os nós)
2. Pressione `Delete` ou `Backspace`
3. A conexão desaparecerá

##Sistema de Lógica Visual do ORBITA permite criar missões complexas para CanSat/CubeSat sem escrever código:

### **Benefícios**

✅ **Visual e Intuitivo**: Arraste, conecte e configure - sem sintaxe para memorizar  
✅ **Validação Automática**: Erros de conexão e parâmetros detectados antes do upload  
✅ **Código Otimizado**: Transpilador gera MicroPython eficiente com deduplicação de imports  
✅ **Simulação Integrada**: Teste sem hardware usando o modo Mock  
✅ **Missões Reais**: Código executado em ESP32 real para voos CanSat/CubeSat  

### **Componentes Principais**

| Tipo | Exemplos | Uso |
|------|----------|-----|
| **Sensores** | DHT11, BME280, GPS, IMU | Coleta de dados ambientais |
| **Lógica** | Comparador, Sequenciador, Timer | Decisões e temporização |
| **Atuadores** | LED, Buzzer, Servo, SD Card | Ações físicas e armazenamento |
| **Comunicação** | Logger SD, Console Log, LoRa | Telemetria e debug |

### **Próximos Recursos**

🚧 **Em desenvolvimento:**
- Persistência local de projetos
- Biblioteca de templates de missão
- Debugging visual com breakpoints
- Simulador 3D de trajetória
- Integração com telemetria LoRa

**Experimente e construa sua missão espacial! 🚀🛰️**

---

## 📚 Recursos Adicionais

- **Documentação Técnica**: `docs/transpilador-guia.md`
- **Perfis de Hardware**: `src/core/profiles.ts`
- **Drivers Disponíveis**: `src/core/drivers.ts`
- **Repositório GitHub**: `github.com/jonpedu/Prototipo-3`
export const DRIVER_REGISTRY: Record<string, HardwareDriver> = {
  my_custom_sensor: {
    id: 'my_custom_sensor',
    name: 'Meu Sensor',
    category: HardwareCategory.SENSOR,
    inputs: [],
    outputs: [
      { id: 'value', label: 'Valor', type: DataType.NUMBER }
    ],
    parameters: [
      { id: 'pin', label: 'Pino', type: 'number', default: 4 }
    ],
    code: {
      imports: ['from machine import Pin'],
      setupCode: '{{var_name}}_pin = Pin({{pin}}, Pin.IN)',
      loopCode: '{{var_name}} = {{var_name}}_pin.value()'
    }
  }
}
```

### P: O que é o Transpilador?
**R:** É o componente que converte o grafo visual em código MicroPython executável. Ver documentação completa em `docs/transpilador-guia.md`

#### 4️⃣ Comportamento
```python
led_should_be_on = False

if temperature_sensor_001_temp > 35:
    led_should_be_on = True

# Estado direto sobrescreve condições anteriores
led_should_be_on = bool(data_generator_001)

led_output_001_led.value(1 if led_should_be_on else 0)
```

**Prioridade:** `state` > condições (temperatura, umidade, etc.)

---

## 🎨 Dicas de UI

### **Cores dos Cards**
- 🟦 **Card Azul com ⚡**: Parâmetros dinâmicos (aparecem com conexões)
- ⬛ **Card Cinza**: Parâmetros estáticos (sempre visíveis)
- 🟪 **Card Roxo**: Logic Rules (automações avançadas)

### **Feedback Visual**
- ✅ **Edge azul**: Conexão normal
- ✅ **Edge dourada**: Conexão selecionada
- ✅ **Setas nas edges**: Indicam direção do fluxo de dados

### **Atalhos de Teclado**
- `Delete` ou `Backspace`: Remove nó/edge selecionado
- `Ctrl + Click`: Seleção múltipla
- Mouse drag no background: Move canvas

---

## 🚀 Próximos Passos

1. **Experimente combinações:**
   - 1 sensor → múltiplos atuadores
   - Múltiplos sensores → 1 atuador
   - Sensores → Lógica → Atuadores

2. **Ajuste valores:**
   - Teste diferentes operadores (`>`, `<`, `>=`, `<=`, `==`)
   - Varie thresholds para encontrar valores ideais

3. **Monitore telemetria:**
   - Console mostra valores em tempo real
   - Use para debug e validação

4. **Deploy real:**
   - Altere `.env` para `VITE_USE_MOCK=false`
   - Conecte ESP32 via USB
   - Clique "Conectar" e autorize porta serial

---

## ❓ FAQ

### P: O card dinâmico não aparece?
**R:** Verifique se a conexão foi feita corretamente:
- A edge deve conectar portas compatíveis (cores iguais)
- Selecione o nó **destino** (LED, Servo) no canvas
- Aguarde 1 segundo (React pode demorar para re-renderizar)

### P: Posso conectar múltiplas fontes na mesma porta?
**R:** Não. Cada porta de entrada aceita apenas 1 conexão. Para múltiplas condições, use as diferentes portas disponíveis (temperature, humidity, value).

### P: Como remover um parâmetro dinâmico?
**R:** Remova a conexão (selecione a edge e pressione Delete). O card desaparecerá automaticamente.

### P: Os valores dos parâmetros são salvos?
**R:** Sim, ficam no estado Zustand em `node.data.parameters`. Porém, ao recarregar a página, o canvas volta ao estado inicial (não há persistência local ainda).

### P: Posso criar meus próprios drivers com parâmetros dinâmicos?
**R:** Sim! Edite `src/core/drivers.ts` e adicione um novo driver com o campo `dynamicParameters`. Siga a estrutura dos exemplos existentes (LED, Servo Motor).

---

## 🎉 Conclusão

O Inspector Dinâmico é uma inovação que simplifica drasticamente a criação de lógicas condicionais em programação visual. Ao eliminar nós intermediários, você ganha:

- ✅ **Grafos mais limpos** (menos poluição visual)
- ✅ **Desenvolvimento mais rápido** (menos cliques)
- ✅ **Código mais eficiente** (menos overhead)
- ✅ **Curva de aprendizado reduzida** (lógica no contexto)

**Experimente e explore as possibilidades! 🚀**
