/**
 * ORBITA - Driver Registry
 * Registro estático de drivers de hardware com código MicroPython embutido
 */

import { HardwareDriver, HardwareCategory, DataType } from './types';

/**
 * Registro global de drivers disponíveis
 */
export const DRIVER_REGISTRY: Record<string, HardwareDriver> = {
    // ==================== SENSORES ====================

    data_generator: {
        id: 'data_generator',
        name: 'Gerador de Dados',
        category: HardwareCategory.SENSOR,
        description: 'Gera valores numéricos simulados (útil para testes)',
        icon: 'Waveform',

        inputs: [
            { id: 'start', label: 'Iniciar', type: DataType.BOOLEAN }
        ],
        outputs: [
            { id: 'value', label: 'Valor', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'min', label: 'Valor Mínimo', type: 'number', default: 0, min: -1000, max: 1000 },
            { id: 'max', label: 'Valor Máximo', type: 'number', default: 100, min: -1000, max: 1000 },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 1000, min: 100, max: 10000 }
        ],

        code: {
            imports: ['import urandom', 'import time'],
            setupCode: '{{var_name}}_last_time = time.ticks_ms()',
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last_time) >= {{interval}}:
    {{var_name}} = urandom.uniform({{min}}, {{max}})
    {{var_name}}_last_time = time.ticks_ms()
`.trim()
        }
    },

    temperature_sensor: {
        id: 'temperature_sensor',
        name: 'Sensor de Temperatura',
        category: HardwareCategory.SENSOR,
        description: 'Lê temperatura de um sensor DHT11/DHT22',
        icon: 'Thermometer',

        inputs: [
            { id: 'enable', label: 'Habilitar', type: DataType.BOOLEAN }
        ],
        outputs: [
            { id: 'temperature', label: 'Temperatura', type: DataType.NUMBER },
            { id: 'humidity', label: 'Umidade', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'pin', label: 'Pino GPIO', type: 'number', default: 4, min: 0, max: 39 },
            {
                id: 'sensor_type',
                label: 'Tipo de Sensor',
                type: 'select',
                default: 'DHT11',
                options: [
                    { value: 'DHT11', label: 'DHT11' },
                    { value: 'DHT22', label: 'DHT22' }
                ]
            },
            { id: 'interval', label: 'Intervalo de Leitura (ms)', type: 'number', default: 2000, min: 500, max: 60000 }
        ],

        code: {
            imports: ['from machine import Pin', 'import dht', 'import time'],
            libraries: ['dht'],
            setupCode: `
{{var_name}}_sensor = dht.DHT{{sensor_type}}(Pin({{pin}}))
{{var_name}}_last_read = 0
{{var_name}}_temp = 0
{{var_name}}_hum = 0
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last_read) >= {{interval}}:
    try:
        {{var_name}}_sensor.measure()
        {{var_name}}_temp = {{var_name}}_sensor.temperature()
        {{var_name}}_hum = {{var_name}}_sensor.humidity()
        {{var_name}}_last_read = time.ticks_ms()
    except Exception as e:
        print("Erro DHT:", e)
`.trim()
        }
    },

    bme280_sensor: {
        id: 'bme280_sensor',
        name: 'BME/BMP280',
        category: HardwareCategory.SENSOR,
        description: 'Temperatura, pressão e umidade via I2C (SDA21/SCL22)',
        icon: 'Cloud',

        inputs: [],
        outputs: [
            { id: 'temperature', label: 'Temperatura', type: DataType.NUMBER },
            { id: 'humidity', label: 'Umidade', type: DataType.NUMBER },
            { id: 'pressure', label: 'Pressão', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'sda', label: 'SDA', type: 'number', default: 21, min: 0, max: 39 },
            { id: 'scl', label: 'SCL', type: 'number', default: 22, min: 0, max: 39 },
            { id: 'address', label: 'Endereço I2C', type: 'string', default: '0x76' },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 2000, min: 200, max: 60000 }
        ],

        code: {
            imports: ['from machine import Pin, I2C', 'import bme280', 'import time'],
            libraries: ['bme280'],
            setupCode: `
{{var_name}}_i2c = I2C(0, sda=Pin({{sda}}), scl=Pin({{scl}}))
{{var_name}}_sensor = bme280.BME280(i2c={{var_name}}_i2c, address=int({{address}}, 16))
{{var_name}}_last = 0
{{var_name}}_temperature = 0
{{var_name}}_humidity = 0
{{var_name}}_pressure = 0
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    try:
        t, p, h = {{var_name}}_sensor.read_compensated_data()
        {{var_name}}_temperature = t / 100
        {{var_name}}_pressure = p / 25600
        {{var_name}}_humidity = h / 1024
        {{var_name}}_last = time.ticks_ms()
    except Exception as e:
        print('Erro BME280:', e)
`.trim()
        }
    },

    sht30_sensor: {
        id: 'sht30_sensor',
        name: 'SHT20/31',
        category: HardwareCategory.SENSOR,
        description: 'Temperatura e umidade I2C (SDA21/SCL22)',
        icon: 'Droplets',

        inputs: [],
        outputs: [
            { id: 'temperature', label: 'Temperatura', type: DataType.NUMBER },
            { id: 'humidity', label: 'Umidade', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'sda', label: 'SDA', type: 'number', default: 21, min: 0, max: 39 },
            { id: 'scl', label: 'SCL', type: 'number', default: 22, min: 0, max: 39 },
            { id: 'address', label: 'Endereço I2C', type: 'string', default: '0x44' },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 2000, min: 200, max: 60000 }
        ],

        code: {
            imports: ['from machine import Pin, I2C', 'import time'],
            setupCode: `
{{var_name}}_i2c = I2C(0, sda=Pin({{sda}}), scl=Pin({{scl}}))
{{var_name}}_address = int({{address}}, 16)
{{var_name}}_last = 0
{{var_name}}_temperature = 0
{{var_name}}_humidity = 0
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    try:
        {{var_name}}_i2c.writeto({{var_name}}_address, b'\x2C\x06')
        time.sleep_ms(20)
        data = {{var_name}}_i2c.readfrom({{var_name}}_address, 6)
        raw_t = data[0] << 8 | data[1]
        raw_h = data[3] << 8 | data[4]
        {{var_name}}_temperature = -45 + 175 * (raw_t / 65535)
        {{var_name}}_humidity = 100 * (raw_h / 65535)
        {{var_name}}_last = time.ticks_ms()
    except Exception as e:
        print('Erro SHT:', e)
`.trim()
        }
    },

    ccs811_sensor: {
        id: 'ccs811_sensor',
        name: 'CCS811',
        category: HardwareCategory.SENSOR,
        description: 'eCO2/TVOC via I2C (SDA21/SCL22)',
        icon: 'Activity',

        inputs: [],
        outputs: [
            { id: 'eco2', label: 'eCO2 (ppm)', type: DataType.NUMBER },
            { id: 'tvoc', label: 'TVOC (ppb)', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'sda', label: 'SDA', type: 'number', default: 21, min: 0, max: 39 },
            { id: 'scl', label: 'SCL', type: 'number', default: 22, min: 0, max: 39 },
            { id: 'address', label: 'Endereço I2C', type: 'string', default: '0x5A' },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 5000, min: 1000, max: 60000 }
        ],

        code: {
            imports: ['from machine import Pin, I2C', 'import time'],
            setupCode: `
{{var_name}}_i2c = I2C(0, sda=Pin({{sda}}), scl=Pin({{scl}}))
{{var_name}}_addr = int({{address}}, 16)
{{var_name}}_last = 0
{{var_name}}_eco2 = 0
{{var_name}}_tvoc = 0

# Boot e modo medição (baseline simples)
{{var_name}}_i2c.writeto_mem({{var_name}}_addr, 0xF4, b'\x00')
time.sleep_ms(100)
{{var_name}}_i2c.writeto_mem({{var_name}}_addr, 0x01, b'\x10')
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    try:
        status = {{var_name}}_i2c.readfrom_mem({{var_name}}_addr, 0x00, 1)
        if status[0] & 0x08:
            data = {{var_name}}_i2c.readfrom_mem({{var_name}}_addr, 0x02, 8)
            {{var_name}}_eco2 = (data[0] << 8) | data[1]
            {{var_name}}_tvoc = (data[2] << 8) | data[3]
            {{var_name}}_last = time.ticks_ms()
    except Exception as e:
        print('Erro CCS811:', e)
`.trim()
        }
    },

    imu_mpu9250: {
        id: 'imu_mpu9250',
        name: 'IMU MPU9250/BMX055',
        category: HardwareCategory.SENSOR,
        description: 'Acelerômetro e giroscópio I2C (SDA21/SCL22)',
        icon: 'Crosshair',

        inputs: [],
        outputs: [
            { id: 'accel_x', label: 'Accel X', type: DataType.NUMBER },
            { id: 'accel_y', label: 'Accel Y', type: DataType.NUMBER },
            { id: 'accel_z', label: 'Accel Z', type: DataType.NUMBER },
            { id: 'gyro_x', label: 'Giro X', type: DataType.NUMBER },
            { id: 'gyro_y', label: 'Giro Y', type: DataType.NUMBER },
            { id: 'gyro_z', label: 'Giro Z', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'sda', label: 'SDA', type: 'number', default: 21, min: 0, max: 39 },
            { id: 'scl', label: 'SCL', type: 'number', default: 22, min: 0, max: 39 },
            { id: 'address', label: 'Endereço I2C', type: 'string', default: '0x68' },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 100, min: 20, max: 2000 }
        ],

        code: {
            imports: ['from machine import Pin, I2C', 'import time'],
            setupCode: `
{{var_name}}_i2c = I2C(0, sda=Pin({{sda}}), scl=Pin({{scl}}))
{{var_name}}_addr = int({{address}}, 16)
{{var_name}}_last = 0
{{var_name}}_accel_x = {{var_name}}_accel_y = {{var_name}}_accel_z = 0
{{var_name}}_gyro_x = {{var_name}}_gyro_y = {{var_name}}_gyro_z = 0

# Acorda o sensor
{{var_name}}_i2c.writeto_mem({{var_name}}_addr, 0x6B, b'\x00')
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    try:
        data = {{var_name}}_i2c.readfrom_mem({{var_name}}_addr, 0x3B, 14)
        ax = (data[0] << 8) | data[1]
        ay = (data[2] << 8) | data[3]
        az = (data[4] << 8) | data[5]
        gx = (data[8] << 8) | data[9]
        gy = (data[10] << 8) | data[11]
        gz = (data[12] << 8) | data[13]

        {{var_name}}_accel_x = (ax - 65536 if ax > 32767 else ax) / 16384
        {{var_name}}_accel_y = (ay - 65536 if ay > 32767 else ay) / 16384
        {{var_name}}_accel_z = (az - 65536 if az > 32767 else az) / 16384

        {{var_name}}_gyro_x = (gx - 65536 if gx > 32767 else gx) / 131
        {{var_name}}_gyro_y = (gy - 65536 if gy > 32767 else gy) / 131
        {{var_name}}_gyro_z = (gz - 65536 if gz > 32767 else gz) / 131
        {{var_name}}_last = time.ticks_ms()
    except Exception as e:
        print('Erro IMU:', e)
`.trim()
        }
    },

    ldr_sensor: {
        id: 'ldr_sensor',
        name: 'LDR',
        category: HardwareCategory.SENSOR,
        description: 'Leitura analógica do LDR (GPIO34)',
        icon: 'Sun',

        inputs: [],
        outputs: [{ id: 'luminosity', label: 'Luminosidade', type: DataType.NUMBER }],

        parameters: [
            { id: 'pin', label: 'Pino ADC', type: 'number', default: 34, min: 32, max: 39 },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 500, min: 50, max: 60000 }
        ],

        code: {
            imports: ['from machine import ADC, Pin', 'import time'],
            setupCode: `
{{var_name}}_adc = ADC(Pin({{pin}}))
{{var_name}}_adc.atten(ADC.ATTN_11DB)
{{var_name}}_last = 0
{{var_name}}_luminosity = 0
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    {{var_name}}_luminosity = {{var_name}}_adc.read()
    {{var_name}}_last = time.ticks_ms()
`.trim()
        }
    },

    vbat_sensor: {
        id: 'vbat_sensor',
        name: 'VBAT',
        category: HardwareCategory.SENSOR,
        description: 'Mede tensão da bateria (GPIO35 com divisor)',
        icon: 'Battery',

        inputs: [],
        outputs: [{ id: 'voltage', label: 'Tensão (V)', type: DataType.NUMBER }],

        parameters: [
            { id: 'pin', label: 'Pino ADC', type: 'number', default: 35, min: 32, max: 39 },
            { id: 'divider_ratio', label: 'Fator do divisor', type: 'number', default: 2.0, min: 1, max: 10 },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 1000, min: 100, max: 60000 }
        ],

        code: {
            imports: ['from machine import ADC, Pin', 'import time'],
            setupCode: `
{{var_name}}_adc = ADC(Pin({{pin}}))
{{var_name}}_adc.atten(ADC.ATTN_11DB)
{{var_name}}_last = 0
{{var_name}}_voltage = 0
`.trim(),
            loopCode: `
if time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    raw = {{var_name}}_adc.read()
    {{var_name}}_voltage = (raw / 4095) * 3.3 * {{divider_ratio}}
    {{var_name}}_last = time.ticks_ms()
`.trim()
        }
    },

    // ==================== ATUADORES ====================

    led_output: {
        id: 'led_output',
        name: 'LED',
        category: HardwareCategory.ACTUATOR,
        description: 'Controla LED branco digital ou RGB PWM',
        icon: 'Lightbulb',

        inputs: [
            { id: 'input', label: 'Entrada', type: DataType.ANY }
        ],
        outputs: [],

        parameters: [
            {
                id: 'led_type',
                label: 'Tipo de LED',
                type: 'select',
                default: 'white',
                options: [
                    { value: 'white', label: 'LED Branco' },
                    { value: 'rgb', label: 'LED RGB' }
                ]
            },
            { id: 'pin', label: 'Pino GPIO', type: 'number', default: 2, min: 0, max: 39 },
            { id: 'pin_r', label: 'Pino R (GPIO)', type: 'number', default: 12, min: 0, max: 39 },
            { id: 'pin_g', label: 'Pino G (GPIO)', type: 'number', default: 13, min: 0, max: 39 },
            { id: 'pin_b', label: 'Pino B (GPIO)', type: 'number', default: 14, min: 0, max: 39 },
            {
                id: 'preset_color',
                label: 'Cor pré-definida',
                type: 'select',
                default: '0',
                options: [
                    { value: '0', label: 'DESLIGADO' },
                    { value: '1', label: 'VERMELHO' },
                    { value: '2', label: 'VERDE' },
                    { value: '3', label: 'AZUL' },
                    { value: '4', label: 'BRANCO' },
                    { value: '5', label: 'ROXO' }
                ]
            },
            { id: 'blink_enabled', label: 'Piscar automaticamente', type: 'boolean', default: false },
            { id: 'blink_interval', label: 'Intervalo de Pisca (ms)', type: 'number', default: 1000, min: 100, max: 10000 },
            { id: 'blink_count_enabled', label: 'Limitar número de piscadas', type: 'boolean', default: false },
            { id: 'blink_count', label: 'Quantidade de piscadas', type: 'number', default: 3, min: 1, max: 100 }
        ],


        code: {
            imports: ['from machine import Pin, PWM', 'import time'],
            setupCode: `
{{var_name}}_led = Pin({{pin}}, Pin.OUT)
{{var_name}}_pwm_r = PWM(Pin({{pin_r}}))
{{var_name}}_pwm_g = PWM(Pin({{pin_g}}))
{{var_name}}_pwm_b = PWM(Pin({{pin_b}}))
{{var_name}}_pwm_r.freq(1000)
{{var_name}}_pwm_g.freq(1000)
{{var_name}}_pwm_b.freq(1000)
{{var_name}}_pwm_r.duty(0)
{{var_name}}_pwm_g.duty(0)
{{var_name}}_pwm_b.duty(0)
{{var_name}}_blink_state = False
{{var_name}}_blink_last = 0
{{var_name}}_blink_done = 0
`.trim(),
            loopCode: `
# Entrada única adaptativa: bool liga/desliga; número usa condição para ligar/desligar
has_input = False
input_on = False

{{#if input_input}}
has_input = True
try:
    _val = {{input_input}}
    if isinstance(_val, bool):
        input_on = bool(_val)
    else:
        input_on = float(_val) != 0
except Exception as _e:
    input_on = bool({{input_input}})
{{/if}}

led_should_be_on = input_on

if (not has_input) and {{action_white_mode}} == "fixed":
    led_should_be_on = {{action_white_state}}
    has_input = True

{{#if blink_enabled}}
if not has_input:
    interval_ms = {{blink_interval}}
    duty = 1.0  # brilho máximo
    on_time = int(interval_ms * duty)
    off_time = max(1, interval_ms - on_time)
    now = time.ticks_ms()
    if {{blink_count_enabled}} and {{var_name}}_blink_done >= {{blink_count}}:
        led_should_be_on = False
    else:
        if {{var_name}}_blink_state:
            if time.ticks_diff(now, {{var_name}}_blink_last) >= on_time:
                {{var_name}}_blink_state = False
                {{var_name}}_blink_last = now
        else:
            if time.ticks_diff(now, {{var_name}}_blink_last) >= off_time:
                {{var_name}}_blink_state = True
                {{var_name}}_blink_last = now
                {{var_name}}_blink_done += 1
        led_should_be_on = {{var_name}}_blink_state
{{/if}}

if {{led_type}} == "white":
    {{var_name}}_led.value(1 if led_should_be_on else 0)
    {{var_name}}_pwm_r.duty(0)
    {{var_name}}_pwm_g.duty(0)
    {{var_name}}_pwm_b.duty(0)
else:
    # LED RGB discreto (PWM)
    color = int({{preset_color}})
    r_val = 0
    g_val = 0
    b_val = 0

    if color == 1:
        r_val = 1023
    elif color == 2:
        g_val = 1023
    elif color == 3:
        b_val = 1023
    elif color == 4:
        r_val = 1023; g_val = 1023; b_val = 1023
    elif color == 5:
        r_val = 1023; b_val = 1023

    # Brilho sempre em 100%
    {{var_name}}_pwm_r.duty(r_val if led_should_be_on else 0)
    {{var_name}}_pwm_g.duty(g_val if led_should_be_on else 0)
    {{var_name}}_pwm_b.duty(b_val if led_should_be_on else 0)
    {{var_name}}_led.value(0)
`.trim()
        }
    },

    buzzer: {
        id: 'buzzer',
        name: 'Buzzer',
        category: HardwareCategory.ACTUATOR,
        description: 'Emite tons simples com acionamento direto ou por valor',
        icon: 'Bell',

        inputs: [
            { id: 'input', label: 'Entrada', type: DataType.ANY }
        ],
        outputs: [],

        parameters: [
            { id: 'pin', label: 'Pino GPIO', type: 'number', default: 25, min: 0, max: 39 },
            {
                id: 'tone',
                label: 'Tom',
                type: 'select',
                default: 'normal',
                options: [
                    { value: 'very_high', label: 'Muito agudo' },
                    { value: 'high', label: 'Agudo' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Grave' },
                    { value: 'very_low', label: 'Muito grave' }
                ]
            },
            { id: 'duration', label: 'Duração (ms)', type: 'number', default: 200, min: 50, max: 2000 },
            { id: 'repeat_enabled', label: 'Repetir automaticamente', type: 'boolean', default: false },
            { id: 'repeat_interval', label: 'Intervalo de repetição (ms)', type: 'number', default: 2000, min: 100, max: 20000 },
            { id: 'repeat_count_enabled', label: 'Limitar número de toques', type: 'boolean', default: false },
            { id: 'repeat_count', label: 'Quantidade de toques', type: 'number', default: 3, min: 1, max: 100 }
        ],

        code: {
            imports: ['from machine import Pin, PWM', 'import time'],
            setupCode: `
{{var_name}}_pwm = PWM(Pin({{pin}}))
{{var_name}}_pwm.duty(0)
{{var_name}}_repeat_last = 0
{{var_name}}_repeat_done = 0
`.trim(),
            loopCode: `
# Entrada única adaptativa: bool liga/desliga; número toca se for diferente de zero
should_beep = False
has_input = False

{{#if input_input}}
has_input = True
try:
    _val = {{input_input}}
    if isinstance(_val, bool):
        should_beep = bool(_val)
    else:
        should_beep = float(_val) != 0
except Exception as _e:
    should_beep = bool({{input_input}})
{{/if}}

tone_freq = 2000
if {{tone}} == "very_high":
    tone_freq = 4500
elif {{tone}} == "high":
    tone_freq = 3000
elif {{tone}} == "normal":
    tone_freq = 2000
elif {{tone}} == "low":
    tone_freq = 1000
elif {{tone}} == "very_low":
    tone_freq = 500

# Se não há entradas e repetição automática está habilitada, gerar beep por intervalo
{{#if repeat_enabled}}
if not has_input:
    now = time.ticks_ms()
    if (not {{repeat_count_enabled}}) or ({{var_name}}_repeat_done < {{repeat_count}}):
        if time.ticks_diff(now, {{var_name}}_repeat_last) >= {{repeat_interval}}:
            should_beep = True
            {{var_name}}_repeat_last = now
            if {{repeat_count_enabled}}:
                {{var_name}}_repeat_done += 1
    else:
        should_beep = False
        {{var_name}}_pwm.duty(0)
{{/if}}

# Reset contador se entradas assumirem controle
if has_input:
    {{var_name}}_repeat_done = 0

if should_beep:
    {{var_name}}_pwm.freq(tone_freq)
    {{var_name}}_pwm.duty(512)
    time.sleep_ms({{duration}})
    {{var_name}}_pwm.duty(0)
`.trim()
        }
    },

    sd_logger: {
        id: 'sd_logger',
        name: 'Logger SD',
        category: HardwareCategory.COMMUNICATION,
        description: 'Registra dados em cartão SD (CS15)',
        icon: 'HardDrive',

        inputs: [
            { id: 'value', label: 'Valor', type: DataType.ANY }
        ],
        outputs: [],

        parameters: [
            { id: 'cs_pin', label: 'CS (GPIO)', type: 'number', default: 15, min: 0, max: 39 },
            { id: 'filename', label: 'Arquivo', type: 'string', default: 'log.csv' },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 2000, min: 200, max: 60000 }
        ],

        code: {
            imports: ['from machine import Pin, SDCard', 'import os', 'import time'],
            setupCode: `
{{var_name}}_sd = None
{{var_name}}_mounted = False
try:
    {{var_name}}_sd = SDCard(slot=2, sck=Pin(18), mosi=Pin(23), miso=Pin(19), cs=Pin({{cs_pin}}))
    os.mount({{var_name}}_sd, '/sd')
    {{var_name}}_mounted = True
except Exception as e:
    print('Erro ao montar SD:', e)

{{var_name}}_last = 0
`.trim(),
            loopCode: `
if not {{var_name}}_mounted:
    pass
elif time.ticks_diff(time.ticks_ms(), {{var_name}}_last) >= {{interval}}:
    try:
        with open('/sd/{{filename}}', 'a') as f:
            f.write(str({{input_value}}) + '\n')
        {{var_name}}_last = time.ticks_ms()
    except Exception as e:
        print('Erro SD:', e)
`.trim()
        }
    },

    servo_motor: {
        id: 'servo_motor',
        name: 'Servo Motor',
        category: HardwareCategory.ACTUATOR,
        description: 'Controla um servo motor (0-180 graus) com condições',
        icon: 'Gauge',

        inputs: [
            { id: 'temperature', label: 'Temperatura', type: DataType.NUMBER },
            { id: 'value', label: 'Valor Genérico', type: DataType.NUMBER },
            { id: 'angle', label: 'Ângulo Direto', type: DataType.NUMBER }
        ],
        outputs: [],

        parameters: [
            { id: 'pin', label: 'Pino GPIO', type: 'number', default: 5, min: 0, max: 39 },
            { id: 'default_angle', label: 'Ângulo Inicial', type: 'number', default: 90, min: 0, max: 180 }
        ],

        dynamicParameters: [
            {
                inputId: 'temperature',
                parameters: [
                    {
                        id: 'servo_temp_operator',
                        label: 'Condição de Temperatura',
                        type: 'select',
                        default: '>',
                        options: [
                            { value: '>', label: 'Maior que (>)' },
                            { value: '<', label: 'Menor que (<)' },
                            { value: '>=', label: 'Maior ou igual (>=)' },
                            { value: '<=', label: 'Menor ou igual (<=)' }
                        ]
                    },
                    {
                        id: 'servo_temp_threshold',
                        label: 'Temperatura Limite (°C)',
                        type: 'number',
                        default: 25,
                        min: -50,
                        max: 100
                    },
                    {
                        id: 'servo_temp_angle',
                        label: 'Ângulo quando condição ativa',
                        type: 'number',
                        default: 180,
                        min: 0,
                        max: 180
                    }
                ]
            },
            {
                inputId: 'value',
                parameters: [
                    {
                        id: 'servo_value_min',
                        label: 'Valor Mínimo de Entrada',
                        type: 'number',
                        default: 0,
                        min: -1000,
                        max: 1000
                    },
                    {
                        id: 'servo_value_max',
                        label: 'Valor Máximo de Entrada',
                        type: 'number',
                        default: 100,
                        min: -1000,
                        max: 1000
                    }
                ]
            }
        ],

        code: {
            imports: ['from machine import Pin, PWM'],
            setupCode: `{{var_name}}_servo = PWM(Pin({{pin}}), freq=50)
{{var_name}}_angle = {{default_angle}}`,
            loopCode: `
# Define ângulo baseado nas condições
target_angle = {{default_angle}}

{{#if input_temperature}}
if {{input_temperature}} {{servo_temp_operator}} {{servo_temp_threshold}}:
    target_angle = {{servo_temp_angle}}
{{/if}}

{{#if input_value}}
# Mapeia valor de entrada para ângulo 0-180
mapped_value = max({{servo_value_min}}, min({{input_value}}, {{servo_value_max}}))
target_angle = int((mapped_value - {{servo_value_min}}) / ({{servo_value_max}} - {{servo_value_min}}) * 180)
{{/if}}

{{#if input_angle}}
target_angle = int(max(0, min({{input_angle}}, 180)))
{{/if}}

# Converte ângulo para duty cycle (40-115 para 0-180 graus)
{{var_name}}_duty = int(40 + (target_angle / 180) * 75)
{{var_name}}_servo.duty({{var_name}}_duty)
{{var_name}}_angle = target_angle
`.trim()
        }
    },

    print_log: {
        id: 'print_log',
        name: 'Console Log',
        category: HardwareCategory.ACTUATOR,
        description: 'Imprime valores no console serial',
        icon: 'Terminal',

        inputs: [
            { id: 'value', label: 'Valor', type: DataType.ANY }
        ],
        outputs: [],

        parameters: [
            { id: 'prefix', label: 'Prefixo', type: 'string', default: 'DATA' }
        ],

        code: {
            imports: [],
            setupCode: '',
            loopCode: 'print("{{prefix}}:", {{input_value}})'
        }
    },

    // ==================== LÓGICA ====================

    comparator: {
        id: 'comparator',
        name: 'Comparador',
        category: HardwareCategory.LOGIC,
        description: 'Compara A x B ou A/B contra limites com AND/OR',
        icon: 'GitCompare',

        inputs: [
            { id: 'a', label: 'A', type: DataType.NUMBER },
            { id: 'b', label: 'B', type: DataType.NUMBER }
        ],
        outputs: [
            { id: 'result', label: 'Resultado', type: DataType.BOOLEAN }
        ],

        parameters: [
            {
                id: 'mode',
                label: 'Modo',
                type: 'select',
                default: 'inputs',
                options: [
                    { value: 'inputs', label: 'Comparar A com B' },
                    { value: 'thresholds', label: 'Comparar com limites' }
                ]
            },
            {
                id: 'operator',
                label: 'Operador',
                type: 'select',
                default: '>',
                options: [
                    { value: '>', label: 'Maior que (>)' },
                    { value: '<', label: 'Menor que (<)' },
                    { value: '==', label: 'Igual (==)' },
                    { value: '!=', label: 'Diferente (!=)' },
                    { value: '>=', label: 'Maior ou igual (>=)' },
                    { value: '<=', label: 'Menor ou igual (<=)' }
                ]
            },
            {
                id: 'a_operator',
                label: 'Operador A',
                type: 'select',
                default: '>',
                options: [
                    { value: '>', label: 'Maior que (>)' },
                    { value: '<', label: 'Menor que (<)' },
                    { value: '==', label: 'Igual (==)' },
                    { value: '!=', label: 'Diferente (!=)' },
                    { value: '>=', label: 'Maior ou igual (>=)' },
                    { value: '<=', label: 'Menor ou igual (<=)' }
                ]
            },
            { id: 'a_threshold', label: 'Limite A', type: 'number', default: 0 },
            {
                id: 'b_operator',
                label: 'Operador B',
                type: 'select',
                default: '>',
                options: [
                    { value: '>', label: 'Maior que (>)' },
                    { value: '<', label: 'Menor que (<)' },
                    { value: '==', label: 'Igual (==)' },
                    { value: '!=', label: 'Diferente (!=)' },
                    { value: '>=', label: 'Maior ou igual (>=)' },
                    { value: '<=', label: 'Menor ou igual (<=)' }
                ]
            },
            { id: 'b_threshold', label: 'Limite B', type: 'number', default: 0 },
            {
                id: 'combine_operator',
                label: 'Combinar (limites)',
                type: 'select',
                default: 'and',
                options: [
                    { value: 'and', label: 'AND (A e B)' },
                    { value: 'or', label: 'OR (A ou B)' }
                ]
            }
        ],

        code: {
            imports: [],
            setupCode: '',
            loopCode: `
result = False

if {{mode}} == "inputs":
    {{#if input_a}}
    {{#if input_b}}
    result = {{input_a}} {{operator}} {{input_b}}
    {{/if}}
    {{/if}}
else:
    has_a = False
    has_b = False
    cond_a = False
    cond_b = False

    {{#if input_a}}
    cond_a = {{input_a}} {{a_operator}} {{a_threshold}}
    has_a = True
    {{/if}}

    {{#if input_b}}
    cond_b = {{input_b}} {{b_operator}} {{b_threshold}}
    has_b = True
    {{/if}}

    if {{combine_operator}} == "and":
        if has_a or has_b:
            result = True
            if has_a:
                result = result and cond_a
            if has_b:
                result = result and cond_b
        else:
            result = False
    else:
        result = False
        if has_a:
            result = result or cond_a
        if has_b:
            result = result or cond_b

{{var_name}} = bool(result)
`.trim()
        }
    },

    delay_trigger: {
        id: 'delay_trigger',
        name: 'Aguardar X segundos',
        category: HardwareCategory.LOGIC,
        description: 'Ativa após um atraso inicial, sem depender de sensores',
        icon: 'Clock3',

        inputs: [
            { id: 'start', label: 'Iniciar', type: DataType.BOOLEAN }
        ],
        outputs: [
            { id: 'ready', label: 'Pronto', type: DataType.BOOLEAN }
        ],

        parameters: [
            { id: 'delay_ms', label: 'Atraso inicial (ms)', type: 'number', default: 2000, min: 0, max: 600000 }
        ],

        code: {
            imports: ['import time'],
            setupCode: `
{{var_name}}_start = time.ticks_ms()
{{var_name}} = False
`.trim(),
            loopCode: `
enabled = True
{{#if input_enable}}
enabled = bool({{input_enable}})
{{/if}}

if not enabled:
    {{var_name}} = False
    {{var_name}}_start = time.ticks_ms()
else:
    if not {{var_name}}:
        if time.ticks_diff(time.ticks_ms(), {{var_name}}_start) >= {{delay_ms}}:
            {{var_name}} = True
`.trim()
        }
    },

    sequence_timer: {
        id: 'sequence_timer',
        name: 'Sequenciador',
        category: HardwareCategory.LOGIC,
        description: 'Gera uma sequência de passos temporizados para acionar atuadores',
        icon: 'Timer',

        inputs: [
            { id: 'start', label: 'Iniciar', type: DataType.BOOLEAN }
        ],
        outputs: [
            { id: 'state', label: 'Estado', type: DataType.BOOLEAN },
            { id: 'step', label: 'Passo Atual', type: DataType.NUMBER }
        ],

        parameters: [
            { id: 'start_delay', label: 'Aguardar antes de iniciar (ms)', type: 'number', default: 0, min: 0, max: 600000 },
            { id: 'step1_state', label: 'Passo 1 ligado?', type: 'boolean', default: true },
            { id: 'step1_duration', label: 'Duração passo 1 (ms)', type: 'number', default: 1000, min: 100, max: 60000 },
            { id: 'step2_state', label: 'Passo 2 ligado?', type: 'boolean', default: false },
            { id: 'step2_duration', label: 'Duração passo 2 (ms)', type: 'number', default: 1000, min: 100, max: 60000 },
            { id: 'step3_state', label: 'Passo 3 ligado?', type: 'boolean', default: true },
            { id: 'step3_duration', label: 'Duração passo 3 (ms)', type: 'number', default: 1000, min: 100, max: 60000 },
            { id: 'step4_state', label: 'Passo 4 ligado?', type: 'boolean', default: false },
            { id: 'step4_duration', label: 'Duração passo 4 (ms)', type: 'number', default: 1000, min: 100, max: 60000 },
            { id: 'repeat_cycle', label: 'Repetir sempre', type: 'boolean', default: false }
        ],

        code: {
            imports: ['import time'],
            setupCode: `
{{var_name}}_steps = [
    ({{step1_state}}, {{step1_duration}}),
    ({{step2_state}}, {{step2_duration}}),
    ({{step3_state}}, {{step3_duration}}),
    ({{step4_state}}, {{step4_duration}})
]
{{var_name}}_steps = [(s, d) for (s, d) in {{var_name}}_steps if d > 0]
{{var_name}}_index = 0
{{var_name}}_last = time.ticks_ms()
{{var_name}}_state = False
{{var_name}}_step = 0
{{var_name}}_start_delay = max(0, {{start_delay}})
{{var_name}}_started = False
`.trim(),
            loopCode: `
# Sequenciador simples de até quatro passos com gatilho opcional de início
start_active = True
{{#if input_start}}
start_active = bool({{input_start}})
{{/if}}

if len({{var_name}}_steps) == 0:
    {{var_name}}_state = False
    {{var_name}}_step = 0
elif not start_active:
    # Se gatilho desligado, reseta ciclo e aguarda religar
    {{var_name}}_index = 0
    {{var_name}}_started = False
    {{var_name}}_last = time.ticks_ms()
    {{var_name}}_state = False
    {{var_name}}_step = 0
else:
    now = time.ticks_ms()

    # Aguarda atraso inicial apenas uma vez após gatilho
    if not {{var_name}}_started:
        if {{var_name}}_start_delay == 0 or time.ticks_diff(now, {{var_name}}_last) >= {{var_name}}_start_delay:
            {{var_name}}_started = True
            {{var_name}}_last = now
        else:
            {{var_name}}_state = False
            {{var_name}}_step = 0
            {{var_name}}_state = {{var_name}}_state
            {{var_name}}_step = {{var_name}}_step
            continue

    target_state, duration_ms = {{var_name}}_steps[{{var_name}}_index]
    if time.ticks_diff(now, {{var_name}}_last) >= duration_ms:
        {{var_name}}_index += 1
        if {{var_name}}_index >= len({{var_name}}_steps):
            if {{repeat_cycle}}:
                {{var_name}}_index = 0
            else:
                {{var_name}}_index = len({{var_name}}_steps) - 1
        {{var_name}}_last = now
        target_state, duration_ms = {{var_name}}_steps[{{var_name}}_index]

    {{var_name}}_state = bool(target_state)
    {{var_name}}_step = {{var_name}}_index + 1

{{var_name}}_state = {{var_name}}_state
{{var_name}}_step = {{var_name}}_step
`.trim()
        }
    },

    threshold: {
        id: 'threshold',
        name: 'Limiar',
        category: HardwareCategory.LOGIC,
        description: 'Ativa saída quando entrada ultrapassa limiar',
        icon: 'Gauge',

        inputs: [
            { id: 'value', label: 'Valor', type: DataType.NUMBER }
        ],
        outputs: [
            { id: 'active', label: 'Ativo', type: DataType.BOOLEAN }
        ],

        parameters: [
            { id: 'threshold', label: 'Valor Limite', type: 'number', default: 50 },
            {
                id: 'mode',
                label: 'Modo',
                type: 'select',
                default: 'above',
                options: [
                    { value: 'above', label: 'Acima do limite' },
                    { value: 'below', label: 'Abaixo do limite' }
                ]
            }
        ],

        code: {
            imports: [],
            setupCode: '',
            loopCode: '{{var_name}} = {{input_value}} {{mode === "above" ? ">" : "<"}} {{threshold}}'
        }
    }
};

/**
 * Obtém um driver pelo ID
 */
export function getDriver(driverId: string): HardwareDriver | undefined {
    return DRIVER_REGISTRY[driverId];
}

/**
 * Obtém todos os drivers de uma categoria
 */
export function getDriversByCategory(category: HardwareCategory): HardwareDriver[] {
    return Object.values(DRIVER_REGISTRY).filter(d => d.category === category);
}

/**
 * Lista todos os drivers disponíveis
 */
export function getAllDrivers(): HardwareDriver[] {
    return Object.values(DRIVER_REGISTRY);
}
