import type { DriverTemplate, ModuleType } from '../types';

// ============================================================================
// DRIVERS MICROPYTHON - Código minificado para cada módulo de hardware
// ============================================================================

export const MICROPYTHON_DRIVERS: Record<ModuleType, DriverTemplate> = {
    BMP280: {
        moduleType: 'BMP280',
        className: 'BMP280',
        code: `# BMP280 Driver
from machine import I2C
import time
class BMP280:
 def __init__(self,i2c,addr=0x76):
  self.i2c=i2c;self.addr=addr;self._init_sensor()
 def _init_sensor(self):
  self.i2c.writeto_mem(self.addr,0xF4,bytes([0x3F]))
 def _read_raw(self,reg,n):
  return self.i2c.readfrom_mem(self.addr,reg,n)
 def read_temperature(self):
  d=self._read_raw(0xFA,3);raw=(d[0]<<12)|(d[1]<<4)|(d[2]>>4);return raw/5120.0-50
 def read_pressure(self):
  d=self._read_raw(0xF7,3);raw=(d[0]<<12)|(d[1]<<4)|(d[2]>>4);return raw/256.0
 def read_altitude(self):
  p=self.read_pressure();return 44330*(1-(p/101325)**0.1903)
`,
        dependencies: [],
    },

    BME280: {
        moduleType: 'BME280',
        className: 'BME280',
        code: `# BME280 Driver
from machine import I2C
import time
class BME280:
 def __init__(self,i2c,addr=0x76):
  self.i2c=i2c;self.addr=addr;self._init_sensor()
 def _init_sensor(self):
  self.i2c.writeto_mem(self.addr,0xF2,bytes([0x01]));self.i2c.writeto_mem(self.addr,0xF4,bytes([0x3F]))
 def _read_raw(self,reg,n):
  return self.i2c.readfrom_mem(self.addr,reg,n)
 def read_temperature(self):
  d=self._read_raw(0xFA,3);raw=(d[0]<<12)|(d[1]<<4)|(d[2]>>4);return raw/5120.0-50
 def read_pressure(self):
  d=self._read_raw(0xF7,3);raw=(d[0]<<12)|(d[1]<<4)|(d[2]>>4);return raw/256.0
 def read_humidity(self):
  d=self._read_raw(0xFD,2);raw=(d[0]<<8)|d[1];return raw/1024.0
 def read_altitude(self):
  p=self.read_pressure();return 44330*(1-(p/101325)**0.1903)
`,
        dependencies: [],
    },

    DHT11: {
        moduleType: 'DHT11',
        className: 'DHT',
        code: `# DHT11 Driver
from machine import Pin
import dht
import time
class DHT11Sensor:
 def __init__(self,pin):
  self.sensor=dht.DHT11(Pin(pin))
 def read_temperature(self):
  try:
   self.sensor.measure();return self.sensor.temperature()
  except:
   return None
 def read_humidity(self):
  try:
   self.sensor.measure();return self.sensor.humidity()
  except:
   return None
`,
        dependencies: [],
    },

    DHT22: {
        moduleType: 'DHT22',
        className: 'DHT',
        code: `# DHT22 Driver
from machine import Pin
import dht
import time
class DHT22Sensor:
 def __init__(self,pin):
  self.sensor=dht.DHT22(Pin(pin))
 def read_temperature(self):
  try:
   self.sensor.measure();return self.sensor.temperature()
  except:
   return None
 def read_humidity(self):
  try:
   self.sensor.measure();return self.sensor.humidity()
  except:
   return None
`,
        dependencies: [],
    },

    MPU6050: {
        moduleType: 'MPU6050',
        className: 'MPU6050',
        code: `# MPU6050 Driver
from machine import I2C
import time
class MPU6050:
 def __init__(self,i2c,addr=0x68):
  self.i2c=i2c;self.addr=addr;self._init_sensor()
 def _init_sensor(self):
  self.i2c.writeto_mem(self.addr,0x6B,bytes([0]))
 def _read_raw(self,reg):
  d=self.i2c.readfrom_mem(self.addr,reg,2);return (d[0]<<8)|d[1]
 def _to_signed(self,val):
  return val-65536 if val>32767 else val
 def read_accel(self):
  x=self._to_signed(self._read_raw(0x3B))/16384.0;y=self._to_signed(self._read_raw(0x3D))/16384.0;z=self._to_signed(self._read_raw(0x3F))/16384.0;return(x,y,z)
 def read_gyro(self):
  x=self._to_signed(self._read_raw(0x43))/131.0;y=self._to_signed(self._read_raw(0x45))/131.0;z=self._to_signed(self._read_raw(0x47))/131.0;return(x,y,z)
 def read_temperature(self):
  raw=self._to_signed(self._read_raw(0x41));return raw/340.0+36.53
`,
        dependencies: [],
    },

    GPS_NEO6M: {
        moduleType: 'GPS_NEO6M',
        className: 'GPS',
        code: `# GPS NEO-6M Driver
from machine import UART
import time
class GPS:
 def __init__(self,tx_pin,rx_pin,baud=9600):
  self.uart=UART(2,baudrate=baud,tx=tx_pin,rx=rx_pin);self.lat=None;self.lon=None;self.alt=None
 def _parse_gga(self,s):
  try:
   p=s.split(',');self.lat=float(p[2][:2])+float(p[2][2:])/60 if p[2] else None;self.lon=float(p[4][:3])+float(p[4][3:])/60 if p[4] else None;self.alt=float(p[9]) if p[9] else None
  except:
   pass
 def update(self):
  if self.uart.any():
   try:
    line=self.uart.readline().decode('utf-8')
    if 'GGA' in line:
     self._parse_gga(line)
   except:
    pass
 def get_position(self):
  return(self.lat,self.lon,self.alt)
`,
        dependencies: [],
    },

    LORA_SX127X: {
        moduleType: 'LORA_SX127X',
        className: 'LoRa',
        code: `# LoRa SX127x Driver (Simplified)
from machine import Pin,SPI
import time
class LoRa:
 def __init__(self,sck,miso,mosi,cs,rst=None):
  self.spi=SPI(1,baudrate=10000000,polarity=0,phase=0,sck=Pin(sck),miso=Pin(miso),mosi=Pin(mosi));self.cs=Pin(cs,Pin.OUT);self.cs.value(1);self._init_module()
 def _init_module(self):
  pass
 def send(self,data):
  self.cs.value(0);self.spi.write(bytes([0x80,0x00]));self.spi.write(data.encode() if isinstance(data,str) else data);self.cs.value(1)
 def receive(self):
  return None
`,
        dependencies: [],
    },

    SD_CARD: {
        moduleType: 'SD_CARD',
        className: 'SDCard',
        code: `# SD Card Driver
from machine import Pin,SPI
import os
class SDCard:
 def __init__(self,sck,miso,mosi,cs):
  self.spi=SPI(1,baudrate=1000000,sck=Pin(sck),miso=Pin(miso),mosi=Pin(mosi));self.cs=Pin(cs,Pin.OUT);self.mounted=False
 def mount(self):
  try:
   import sdcard;sd=sdcard.SDCard(self.spi,self.cs);os.mount(sd,'/sd');self.mounted=True;return True
  except:
   return False
 def write_file(self,filename,data):
  if not self.mounted:
   return False
  try:
   with open('/sd/'+filename,'w') as f:
    f.write(data);return True
  except:
   return False
 def read_file(self,filename):
  if not self.mounted:
   return None
  try:
   with open('/sd/'+filename,'r') as f:
    return f.read()
  except:
   return None
`,
        dependencies: [],
    },

    SERVO: {
        moduleType: 'SERVO',
        className: 'Servo',
        code: `# Servo Motor Driver
from machine import Pin,PWM
import time
class Servo:
 def __init__(self,pin):
  self.pwm=PWM(Pin(pin),freq=50)
 def set_angle(self,angle):
  angle=max(0,min(180,angle));duty=int(40+(angle/180)*75);self.pwm.duty(duty)
 def detach(self):
  self.pwm.deinit()
`,
        dependencies: [],
    },

    LED: {
        moduleType: 'LED',
        className: 'LED',
        code: `# LED Driver
from machine import Pin
class LED:
 def __init__(self,pin):
  self.pin=Pin(pin,Pin.OUT);self.pin.value(0)
 def on(self):
  self.pin.value(1)
 def off(self):
  self.pin.value(0)
 def toggle(self):
  self.pin.value(not self.pin.value())
`,
        dependencies: [],
    },

    BUZZER: {
        moduleType: 'BUZZER',
        className: 'Buzzer',
        code: `# Buzzer Driver
from machine import Pin,PWM
import time
class Buzzer:
 def __init__(self,pin):
  self.pwm=PWM(Pin(pin))
 def play_tone(self,freq,duration=100):
  self.pwm.freq(freq);self.pwm.duty(512);time.sleep_ms(duration);self.pwm.duty(0)
 def beep(self):
  self.play_tone(1000,100)
`,
        dependencies: [],
    },
};

/**
 * Retorna o código do driver para um tipo de módulo específico
 */
export function getDriverCode(moduleType: ModuleType): string {
    return MICROPYTHON_DRIVERS[moduleType]?.code || '';
}

/**
 * Retorna todos os drivers necessários para uma lista de tipos de módulos
 */
export function getRequiredDrivers(moduleTypes: ModuleType[]): string[] {
    const drivers: string[] = [];
    const processed = new Set<ModuleType>();

    const addDriver = (type: ModuleType) => {
        if (processed.has(type)) return;
        processed.add(type);

        const driver = MICROPYTHON_DRIVERS[type];
        if (!driver) return;

        // Adicionar dependências primeiro
        if (driver.dependencies) {
            driver.dependencies.forEach((dep) => addDriver(dep as ModuleType));
        }

        drivers.push(driver.code);
    };

    moduleTypes.forEach((type) => addDriver(type));
    return drivers;
}
