# 🚀 GUIA DE EXECUÇÃO - ORBITA

Este guia detalha todos os passos necessários para executar a aplicação ORBITA em seu ambiente local.

---

## ✅ PRÉ-REQUISITOS

Certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior): https://nodejs.org/
- **npm** (vem com Node.js) ou **yarn**
- **Git** (para clonar o repositório)
- **Editor de código** (recomendado: VS Code)
- **Navegador compatível com Web Serial API**:
  - Google Chrome 88+ ✅
  - Microsoft Edge 88+ ✅
  - Opera 74+ ✅
  - Firefox ❌ (não suportado)
  - Safari ❌ (não suportado)

---

## 📦 INSTALAÇÃO

### 1. Clone o repositório (se ainda não tiver feito)

```powershell
git clone https://github.com/jonpedu/Prototipo-3.git
cd Prototipo-3
```

### 2. Instale as dependências

```powershell
npm install
```

⏳ **Aguarde**: Este processo pode levar alguns minutos na primeira vez.

### 3. Configure as variáveis de ambiente

O arquivo `.env` já está configurado para Modo Simulação por padrão. Você pode alterá-lo conforme necessário:

```env
# Modo de simulação (true = sem hardware, false = hardware real)
VITE_USE_MOCK=true

# Configurações de comunicação serial (quando usar hardware real)
VITE_SERIAL_BAUDRATE=115200
VITE_TELEMETRY_INTERVAL=1000
```

---

## 🎮 EXECUTAR A APLICAÇÃO

### Modo Desenvolvimento (Recomendado)

```powershell
npm run dev
```

✅ **Sucesso!** A aplicação estará disponível em:
```
http://localhost:3000
```

Abra este endereço no seu navegador Chrome/Edge.

### Build de Produção

Para gerar uma versão otimizada para produção:

```powershell
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`. Para visualizá-los:

```powershell
npm run preview
```

---

## 🧪 TESTANDO NO MODO SIMULAÇÃO

**Por padrão, o Modo Simulação está ativado** (`VITE_USE_MOCK=true`), permitindo testar todas as funcionalidades sem hardware:

### Teste 1: Conectar ao Dispositivo Simulado

1. Abra a aplicação no navegador
2. Clique no botão **"Conectar"** no header
3. ✅ Você verá a notificação: *"🔌 Conectado ao dispositivo simulado"*
4. ✅ A badge de status mudará para **"Conectado"** (verde)

### Teste 2: Telemetria Simulada

Após conectar, você verá dados de telemetria sendo gerados automaticamente a cada 1 segundo:
- `temperatura`, `umidade`, `pressao`, `altitude`
- `accel_x`, `accel_y`, `accel_z`

### Teste 3: Upload Simulado

1. Clique no botão **"🚀 LANÇAR"** (botão verde na barra inferior)
2. ✅ Você verá uma barra de progresso de 0% a 100% (3 segundos)
3. ✅ Notificação de sucesso: *"✅ Upload simulado concluído!"*
4. ✅ Logs aparecerão no console simulado

---

## 🔌 USANDO COM HARDWARE REAL (ESP32)

Para usar com hardware físico:

### 1. Altere o arquivo `.env`:

```env
VITE_USE_MOCK=false
```

### 2. Reinicie o servidor de desenvolvimento:

```powershell
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### 3. Prepare o ESP32:

- Instale o **MicroPython** no ESP32 (firmware oficial)
- Conecte o ESP32 via USB ao computador
- Drivers USB-Serial devem estar instalados (CP210x ou CH340)

### 4. Conecte pela aplicação:

1. Clique em **"Conectar"**
2. Uma janela nativa do navegador aparecerá pedindo para selecionar a porta serial
3. Selecione a porta do ESP32 (ex: `COM3` no Windows, `/dev/ttyUSB0` no Linux)
4. ✅ Conexão estabelecida!

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "Web Serial API não suportada"

❌ **Problema**: Você está usando Firefox ou Safari.
✅ **Solução**: Use Google Chrome ou Microsoft Edge.

### Erro ao instalar dependências (npm install)

❌ **Problema**: Versão do Node.js desatualizada.
✅ **Solução**: Atualize para Node.js 18 ou superior.

```powershell
node --version  # Verificar versão
```

### Porta 3000 já está em uso

❌ **Problema**: Outra aplicação está usando a porta 3000.
✅ **Solução**: O Vite sugerirá automaticamente outra porta (ex: 3001).

Ou force uma porta específica:

```powershell
npm run dev -- --port 3001
```

### Telemetria não aparece no Modo Real

❌ **Problema**: O código no ESP32 não está enviando dados no formato esperado.
✅ **Solução**: Use o formato padronizado:

```python
# No seu código MicroPython:
print("DATA:temperatura=25.5;umidade=60.2")
```

### Build falhando (npm run build)

❌ **Problema**: Erros de TypeScript.
✅ **Solução**: Execute o linter primeiro:

```powershell
npm run lint
```

Corrija os erros apontados e tente novamente.

---

## 📁 ESTRUTURA DE DIRETÓRIOS

Após a instalação, você terá:

```
Prototipo-3/
├── node_modules/       # Dependências (não comitar)
├── dist/               # Build de produção (após npm run build)
├── src/                # Código fonte da aplicação
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── public/             # Arquivos estáticos
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .env                # Variáveis de ambiente
└── README.md
```

---

## 🔥 COMANDOS ÚTEIS

```powershell
# Desenvolvimento
npm run dev             # Iniciar servidor dev
npm run build           # Build de produção
npm run preview         # Preview do build
npm run lint            # Checar erros de lint

# Limpar cache (se algo estiver dando errado)
rm -r node_modules
rm package-lock.json
npm install
```

---

## ⚡ PERFORMANCE

### Primeira execução (npm run dev):
- ⏱️ Tempo de build inicial: ~5-10 segundos
- 🔥 Hot Module Replacement (HMR): instantâneo

### Build de produção (npm run build):
- ⏱️ Tempo de build: ~20-30 segundos
- 📦 Tamanho final: ~500KB (gzipped)
- ⚡ Otimizações: code splitting, tree shaking, minificação

---

## 📊 MONITORAMENTO

Durante o desenvolvimento, monitore:

1. **Console do navegador** (F12):
   - Logs de telemetria
   - Erros JavaScript
   - Avisos do React

2. **Terminal**:
   - Hot reload confirmado
   - Erros de compilação TypeScript
   - Avisos do Vite

---

## 🎯 PRÓXIMOS PASSOS

Após executar com sucesso:

1. ✅ Explore a interface
2. ✅ Teste conectar/desconectar
3. ✅ Adicione módulos de hardware (futuro)
4. ✅ Programe com blocos Blockly (futuro)
5. ✅ Teste upload e telemetria

---

## 🆘 PRECISA DE AJUDA?

- 📧 Abra uma **Issue** no GitHub
- 💬 Consulte a documentação no `README.md`
- 🔍 Verifique o console do navegador para erros específicos

---

**Boa sorte com o desenvolvimento! 🚀✨**
