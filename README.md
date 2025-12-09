# ORBITA - Ambiente de Desenvolvimento Visual para Nanossatélites

![ORBITA Logo](https://via.placeholder.com/800x200/0a0a0a/3b82f6?text=ORBITA+-+Programa%C3%A7%C3%A3o+Visual+de+Nanossat%C3%A9lites)

## 🚀 Sobre o Projeto

**ORBITA** é uma aplicação web de programação visual desenvolvida para permitir que estudantes de 8 a 16 anos programem nanossatélites (ESP32) de forma intuitiva, sem necessidade de escrever código textual. Utilizando blocos visuais baseados no Google Blockly, os usuários podem criar missões espaciais completas e fazer upload diretamente para o hardware via Web Serial API.

## ✨ Características Principais

- **🧩 Programação Visual**: Interface baseada em blocos (Google Blockly) com tema dark sci-fi
- **🛰️ Sistema ECS (Entity-Component)**: Adicione módulos de hardware que desbloqueiam blocos automaticamente
- **⚡ Zero Friction**: Geração automática de código MicroPython com injeção de drivers
- **🔌 Web Serial API**: Comunicação direta com ESP32 (modo real + simulação)
- **📊 Telemetria em Tempo Real**: Console serial e plotagem de gráficos
- **💾 Persistência Local**: Salve e carregue projetos (.orbita)
- **🧪 Modo Simulação**: Desenvolva sem hardware físico com gerador de telemetria falsa

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Tailwind CSS (tema dark sci-fi)
- **Motor Visual**: Google Blockly (customizado)
- **Estado**: Zustand
- **Comunicação**: Web Serial API
- **Build**: Vite

## 📦 Instalação

```powershell
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🎮 Como Usar

### 1. **Configurar Hardware**
   - Selecione um preset (ESP32 Genérico ou Kit Pion Labs CanSat)
   - Adicione módulos de hardware (sensores, atuadores, comunicação)
   - Configure os pinos GPIO (modo automático ou manual)

### 2. **Programar Visualmente**
   - Arraste blocos da toolbox para o workspace
   - Blocos são desbloqueados automaticamente ao adicionar módulos
   - Visualize o código MicroPython gerado em tempo real

### 3. **Conectar e Lançar**
   - Clique em "Conectar" para estabelecer comunicação serial
   - Clique no botão "🚀 LANÇAR" para fazer upload do código
   - Acompanhe a telemetria em tempo real

### 4. **Modo Simulação (Desenvolvimento sem Hardware)**
   - Por padrão, o modo simulação está ativado (`VITE_USE_MOCK=true` no `.env`)
   - Simula conexão, upload e geração de telemetria falsa
   - Perfeito para testar a UI sem ESP32 físico

## 🧩 Módulos Suportados (MVP)

### Sensores
- **BMP280/BME280**: Pressão, temperatura e altitude
- **DHT11/DHT22**: Temperatura e umidade
- **MPU6050**: Acelerômetro e giroscópio (IMU)
- **GPS NEO-6M**: Posicionamento geográfico

### Comunicação
- **LoRa SX127x**: Comunicação de longo alcance
- **UART Serial**: Comunicação genérica

### Armazenamento
- **Módulo SD Card**: Gravação de dados em cartão SD

### Atuadores
- **Servomotor**: Controle de posição angular
- **LED**: Indicadores visuais
- **Buzzer**: Alertas sonoros

## 🧪 Desenvolvimento (Mock Mode)

O Mock Mode permite desenvolvimento completo sem hardware:

```env
VITE_USE_MOCK=true
VITE_SERIAL_BAUDRATE=115200
VITE_TELEMETRY_INTERVAL=1000
```

### Recursos do Mock
- ✅ Conexão simulada (500ms de latência)
- ✅ Upload simulado com progresso (3 segundos)
- ✅ Telemetria falsa gerada a cada 1 segundo
- ✅ Logs de sucesso/erro realistas
- ✅ Soft Reset simulado

## 📂 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/             # Componentes UI reutilizáveis
│   └── layout/         # Header, Sidebar, MainWorkspace, BottomBar
├── hooks/
│   └── useWebSerial.ts # Hook para Web Serial API (com Mock Mode)
├── stores/             # Zustand stores
│   ├── hardwareStore.ts
│   ├── blocklyStore.ts
│   ├── webSerialStore.ts
│   └── uiStore.ts
├── utils/
│   ├── hardware-drivers.ts  # Drivers MicroPython minificados
│   ├── code-generator.ts    # Transpilador Blockly → MicroPython
│   └── telemetry-parser.ts  # Parser de dados seriais
├── types/              # Tipos TypeScript globais
├── App.tsx
└── main.tsx
```

## 🎨 Tema Visual

- **Estética**: Dark Mode Sci-Fi / Engenharia Espacial
- **Cores Primárias**: Azul (#3b82f6), Ciano (#06b6d4), Roxo (#a855f7)
- **Fontes**: Inter (UI), JetBrains Mono (código)
- **Efeitos**: Glow, animações sutis, sci-fi borders

## 🌐 Navegadores Suportados

A Web Serial API é suportada em:
- ✅ Google Chrome/Edge (88+)
- ✅ Opera (74+)
- ❌ Firefox (não suportado nativamente)
- ❌ Safari (não suportado)

---

**ORBITA** - Levando a programação de nanossatélites para as mãos de jovens engenheiros espaciais 🚀✨