i2c = I2C(0, sda=Pin(21), scl=Pin(22), freq=100000)
temp_sensor_001_temp = 0
# 🎓 Tutorial: Sistema de Lógica Visual do ORBITA

## 📝 Visão Geral

Guia rápido para usar o **Sistema de Lógica Visual** do ORBITA (programação por componentes para missões CanSat/CubeSat com MicroPython).

---

## 🎯 Conceito Central

> **Fluxo de dados visual.** Conecte sensores → nós lógicos → atuadores para criar comportamentos sem escrever código.

```
Sensor → Nó Lógico → Atuador
  ↓         ↓           ↓
 Leitura  Decisão    Ação
```

Exemplo: `SHT20/31.temperature → Comparador → LED`

---

## 📖 Tutorial 1: LED Controlado por Temperatura

**Objetivo:** LED acende quando temperatura > 30°C.

**Passos:**
1) Arraste Sensor de Temperatura, Comparador e LED da sidebar.  
2) Conecte `sensor.temperature` → `comparador.A`.  
3) Conecte `comparador.result` → `led.input`.  
4) No Inspector do Comparador, configure: Modo `Comparar com limites`; Operador A `>`; Limite A `30`; Combinar `OR`.  
5) Teste em **Modo Mock** (toolbar) e veja no Console: `📊 Temperatura: 31.2°C → LED: ON`.

**Código gerado (MicroPython):**
```python
from machine import Pin, I2C
import time

i2c = I2C(0, sda=Pin(21), scl=Pin(22), freq=100000)
temp_sensor_001_temp = 0
comparator_001_result = False
led_001_led = Pin(2, Pin.OUT)

while True:
    temp_sensor_001_temp = 26.5  # exemplo
    comparator_001_result = temp_sensor_001_temp > 30
    led_001_led.value(1 if comparator_001_result else 0)
    time.sleep_ms(50)
```

---

## 📖 Tutorial 2: LED com Múltiplas Condições (OR/AND)

**Objetivo:** LED acende se temperatura > 30°C **ou** umidade > 60% (OR). Opcionalmente, use AND.

**Passos:**
1) Arraste Sensor de Temperatura (temp + humidity), Comparador e LED.  
2) Conecte `temperature` → `A` e `humidity` → `B`; `result` → `LED.input`.  
3) Inspector do Comparador:
```
Modo: Comparar com limites
Operador A: >   Limite A: 30
Operador B: >   Limite B: 60
Combinar: OR (A ou B)   # ou AND se quiser ambas verdadeiras
```

---

## 📖 Tutorial 3: Servo por Limite (Threshold)

**Objetivo:** Servo vai para 180° se valor > 50; caso contrário, 0°.

**Passos:**
1) Arraste Gerador de Dados, Comparador e Servo Motor.  
2) Conecte `Gerador.value` → `Comparador.A`; `Comparador.result` → `Servo.input`.  
3) Comparador: Operador A `>`; Limite A `50`; Combinar `OR`.  
4) Servo: defina pino e faixa (ex.: GPIO18, min 0°, max 180°).

**Código gerado (trecho):**
```python
from machine import Pin, PWM

comparator_001_result = False
servo_pwm = PWM(Pin(18), freq=50)

if comparator_001_result:
    servo_pwm.duty_u16(65535)  # 180°
else:
    servo_pwm.duty_u16(0)      # 0°
```

---

## 📖 Tutorial 4: Alarme com Buzzer (AND)

**Objetivo:** Buzzer toca se temperatura > 35°C **e** umidade < 30%.

**Passos:**
1) Arraste Sensor (temp+humidity), Comparador e Buzzer.  
2) Conecte `temperature` → `A`, `humidity` → `B`, `result` → `buzzer.input`.  
3) Comparador: Operador A `>` Limite 35; Operador B `<` Limite 30; Combinar `AND (A e B)`.  
4) Buzzer: escolha pino (GPIO25 no PION), tom e duração.

**Comportamento (trecho):**
```python
cond_a = temp > 35
cond_b = hum < 30
if cond_a and cond_b:
    buzzer_pwm.duty(512)
    time.sleep_ms(500)
    buzzer_pwm.duty(0)
```

---

## 🎨 Dicas Rápidas de UI

- **Portas (cores):** 🟢 saída (output) → conecte **daqui**; 🔵 entrada (input) → conecte **para cá**. Regra: Verde → Azul.
- **Cores dos nós:** Azul = Sensores; Verde = Atuadores; Roxo = Lógica; Amarelo = Comunicação/armazenamento.
- **Feedback de edges:** azul = ok; dourado = selecionada; vermelha tracejada = incompatível.
- **Atalhos:** `Delete/Backspace` remove nó/edge; `Ctrl+Click` seleção múltipla; arraste fundo para mover canvas.

---

## Padrões de Ligação

```
Monitoramento simples:   Sensor → Console Log
Controle com limite:     Sensor → Comparador → Atuador
Alarme duplo:            Sensor → Comparador → Buzzer
                                └────────────→ LED
Sequência temporal:      Sensor A/B → Comparador → Sequenciador → Atuador
```

**Operadores:** `>`, `<`, `>=`, `<=`, `==`, `!=`  |  **Combinar:** `OR` (qualquer) / `AND` (todas).

---

## Simulação e Telemetria

- Use **MODO MOCK ON** para testes sem hardware (dados simulados no console).  
- **MODO MOCK OFF** usa o ESP32 real (Web Serial).  
- Console mostra `📊 temperatura: 25.3°C` etc. Útil para validar conexões e thresholds.

---

## ❓ FAQ

**Card dinâmico não aparece?**
- Confirme conexão Verde → Azul em portas compatíveis. Selecione o nó destino e aguarde 1s para re-render.

**Posso ligar múltiplas fontes na mesma entrada?**
- Não. Cada entrada aceita 1 edge. Use Comparador (entradas A/B) ou nós lógicos adicionais.

**Como remover parâmetro dinâmico?**
- Remova a edge (selecionar + `Delete`). O card some automaticamente.

**Valores são salvos?**
- Sim no Zustand; se recarregar a página sem salvar missão, volta ao estado inicial. (Use salvar missão `.orbita` na toolbar se disponível.)

**Posso criar drivers com parâmetros dinâmicos?**
- Sim. Edite `src/core/drivers.ts` e adicione `dynamicParameters` seguindo os exemplos de LED/Servo.

---

## 🎉 Conclusão

O Inspector Dinâmico reduz poluição visual e acelera a criação de lógicas condicionais: menos nós, mais contexto e código MicroPython gerado automaticamente. Experimente e itere rápido! 🚀
