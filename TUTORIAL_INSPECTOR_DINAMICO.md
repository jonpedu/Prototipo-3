# 🎓 Tutorial: Inspector Dinâmico Sensível ao Contexto

## 📝 Visão Geral

Este tutorial mostra como usar o **Inspector Dinâmico** do ORBITA v2.1, uma funcionalidade revolucionária que faz a interface reagir inteligentemente às conexões entre componentes.

---

## 🎯 Conceito Central

> **Conexões ditam a interface.**  
> Quando você conecta um sensor a um atuador, o Inspector automaticamente exibe campos de configuração específicos para aquela conexão.

**Sem Inspector Dinâmico** ❌:
```
Sensor → Comparador → LED
         ↑
    Configure aqui
```

**Com Inspector Dinâmico** ✅:
```
Sensor → LED
         ↑
    Configure aqui (contexto automático)
```

---

## 📖 Tutorial 1: LED Inteligente Básico

### Objetivo
Criar um LED que acende quando a temperatura ultrapassa 30°C.

### Passos

#### 1️⃣ Adicionar Componentes
- Arraste **"Sensor de Temperatura"** da sidebar (categoria Sensores)
- Arraste **"LED"** da sidebar (categoria Atuadores)

#### 2️⃣ Fazer a Conexão
- Clique e arraste da porta **`temperature`** (laranja) do sensor
- Solte na porta **`temperature`** (azul) do LED
- ✅ Uma linha azul aparece conectando os dois

#### 3️⃣ Observar o Inspector
**Antes da conexão:**
```
┌─────────────────────────────┐
│ LED                         │
├─────────────────────────────┤
│ 📝 Nome do Componente       │
│   LED Output                │
│                             │
│ ⚙️ Configurações            │
│   Pino GPIO: [2]            │
│                             │
│ 🔌 Conectores               │
│   Entradas: (vazio)         │
└─────────────────────────────┘
```

**Depois da conexão:**
```
┌─────────────────────────────┐
│ LED                         │
├─────────────────────────────┤
│ 📝 Nome do Componente       │
│   LED Output                │
│                             │
│ ⚙️ Configurações            │
│   Pino GPIO: [2]            │
│                             │
│ ⚡ Condições: Temperatura   │ ← NOVO!
│   Conectado a: "Sensor DHT  │
│   → Temperatura"            │
│                             │
│   Condição de Temperatura   │
│   [> Maior que ▼]           │
│                             │
│   Limite de Temperatura (°C)│
│   [30]                      │
└─────────────────────────────┘
```

#### 4️⃣ Configurar Parâmetros
- **Condição**: Mantenha `>` (maior que)
- **Limite**: Deixe `30` ou ajuste conforme necessário

#### 5️⃣ Testar
1. Clique em **"Conectar"** na toolbar
2. Clique em **"Upload"**
3. Console mostrará:
   ```
   ✓ Conexão estabelecida
   ✓ Código transpilado (2 nós)
   >>> Upload: 100%
   === Código em execução ===
   DATA: temp=25.3  ← LED apagado (25 < 30)
   DATA: temp=31.2  ← LED aceso (31 > 30)
   ```

#### 6️⃣ Código Gerado (para curiosidade)
```python
# Sensor DHT
temperature_sensor_001_sensor = dht.DHT11(Pin(4))
temperature_sensor_001_temp = 0

# LED
led_output_001_led = Pin(2, Pin.OUT)

while True:
    # Lê sensor
    temperature_sensor_001_sensor.measure()
    temperature_sensor_001_temp = temperature_sensor_001_sensor.temperature()
    
    # Avalia condição dinâmica
    led_should_be_on = False
    if temperature_sensor_001_temp > 30:  # ← Parâmetros dinâmicos aplicados
        led_should_be_on = True
    
    led_output_001_led.value(1 if led_should_be_on else 0)
    time.sleep_ms(50)
```

---

## 📖 Tutorial 2: LED com Múltiplas Condições

### Objetivo
LED acende se **temperatura > 30°C** OU **umidade > 60%**.

### Passos

#### 1️⃣ Partir do Tutorial 1
- Você já tem Sensor DHT e LED conectados via `temperature`

#### 2️⃣ Adicionar Segunda Conexão
- Clique e arraste da porta **`humidity`** do sensor
- Solte na porta **`humidity`** do LED
- ✅ Agora há **2 linhas azuis** conectando os componentes

#### 3️⃣ Observar o Inspector
```
┌─────────────────────────────┐
│ LED                         │
├─────────────────────────────┤
│ ⚙️ Configurações            │
│   Pino GPIO: [2]            │
│                             │
│ ⚡ Condições: Temperatura   │
│   Condição: [> Maior que ▼] │
│   Limite (°C): [30]         │
│                             │
│ ⚡ Condições: Umidade       │ ← NOVO CARD!
│   Condição: [> Maior que ▼] │
│   Limite (%): [60]          │
└─────────────────────────────┘
```

#### 4️⃣ Configurar Ambas as Condições
- **Temperatura**: `>` e `30`
- **Umidade**: `>` e `60`

#### 5️⃣ Comportamento
```python
led_should_be_on = False

if temperature_sensor_001_temp > 30:
    led_should_be_on = True  # Condição 1

if temperature_sensor_001_hum > 60:
    led_should_be_on = True  # Condição 2 (OR lógico)

led_output_001_led.value(1 if led_should_be_on else 0)
```

**Resultado:** LED liga se QUALQUER das condições for verdadeira.

---

## 📖 Tutorial 3: Servo Motor Controlado por Valor

### Objetivo
Mapear valores de um sensor (0-100) para ângulos de um servo (0-180°).

### Passos

#### 1️⃣ Adicionar Componentes
- **"Gerador de Dados"** (Sensores) - simula valores 0-100
- **"Servo Motor"** (Atuadores)

#### 2️⃣ Conectar
- `Gerador de Dados.value` → `Servo Motor.value`

#### 3️⃣ Inspector do Servo
```
┌─────────────────────────────┐
│ Servo Motor                 │
├─────────────────────────────┤
│ ⚙️ Configurações            │
│   Pino GPIO: [5]            │
│   Ângulo Inicial: [90]      │
│                             │
│ ⚡ Condições: Valor Genérico│ ← NOVO!
│   Valor Mínimo de Entrada   │
│   [0]                       │
│                             │
│   Valor Máximo de Entrada   │
│   [100]                     │
└─────────────────────────────┘
```

#### 4️⃣ Configurar Mapeamento
- **Min**: `0` (valor mínimo do sensor)
- **Max**: `100` (valor máximo do sensor)

#### 5️⃣ Código Gerado
```python
# Mapeia valor de entrada (0-100) para ângulo (0-180)
mapped_value = max(0, min(data_generator_001, 100))
target_angle = int((mapped_value - 0) / (100 - 0) * 180)

# Converte ângulo para duty cycle PWM
servo_motor_001_duty = int(40 + (target_angle / 180) * 75)
servo_motor_001_servo.duty(servo_motor_001_duty)
```

**Resultado:** 
- Sensor em `0` → Servo em `0°`
- Sensor em `50` → Servo em `90°`
- Sensor em `100` → Servo em `180°`

---

## 📖 Tutorial 4: Sistema de Alarme Avançado

### Objetivo
LED liga se **temperatura > 35°C** E pode ser desligado manualmente por um botão virtual.

### Passos

#### 1️⃣ Componentes
- **Sensor Temperatura**
- **Gerador de Dados** (simula botão, valores 0 ou 1)
- **LED**

#### 2️⃣ Conexões
1. `Sensor.temperature` → `LED.temperature`
2. `Gerador.value` → `LED.state` (entrada de estado direto)

#### 3️⃣ Inspector do LED
```
┌─────────────────────────────┐
│ ⚡ Condições: Temperatura   │
│   [> Maior que] [35]        │
│                             │
│ ⚡ Condições: Estado Direto │ ← Sobrescreve tudo
│   (Sem parâmetros, usa      │
│    valor boolean direto)    │
└─────────────────────────────┘
```

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
