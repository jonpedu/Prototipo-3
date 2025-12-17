# Guia de Transpilação MicroPython para Programação por Componentes

## 1. Fundamentos de Transpilação: O que é e por que importa

### 1.1 O que é um transpilador?
Um **transpilador** (source-to-source compiler) é uma ferramenta que converte código de uma linguagem/formato para outra linguagem de mesmo nível de abstração. No nosso caso:
- **Entrada**: Grafo visual de componentes (nós + conexões) no React/Zustand
- **Saída**: Código MicroPython executável em hardware embarcado (ESP32, CanSat, CubeSat)

### 1.2 Por que isso é crítico para missões espaciais?
- **Confiabilidade**: Código gerado incorreto pode causar falha de missão irreversível
- **Validação**: Necessário detectar erros antes do lançamento/voo
- **Segurança**: Evitar placeholders não resolvidos, sintaxe inválida, imports faltantes
- **Depuração**: Código gerado deve ser legível para diagnóstico pós-missão

---

## 2. Análise Técnica Profunda dos Repositórios de Referência

### 2.1 BIPES (Block-based Integrated Platform for Embedded Systems)

#### **Arquitetura de Transpilação**
BIPES usa uma abordagem **baseada em templates de string** com registro por convenção:

```javascript
// Convenção: Blockly.Blocks define estrutura, Blockly.Python define geração
Blockly.Blocks["gpio_set"] = {
  init: function() {
    this.appendValueInput("pin").setCheck("Number").appendField("Set pin");
    this.appendValueInput("value").setCheck("Number").appendField("to");
    this.setColour(230);
  }
};

Blockly.Python["gpio_set"] = function(block) {
  var pin = Blockly.Python.valueToCode(block, 'pin', Blockly.Python.ORDER_ATOMIC);
  var value = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC);
  
  // Sistema de definitions_ para acumular imports/init
  Blockly.Python.definitions_['import_pin'] = 'from machine import Pin';
  Blockly.Python.definitions_[`gpio_init_${pin}`] = `pOut${pin}=Pin(${pin}, Pin.OUT)`;
  
  var code = `pOut${pin}.value(${value})\n`;
  return code;
};
```

**Pontos-chave:**
- **Dicionário `definitions_`**: Chaves únicas garantem deduplicação automática de imports/init
- **String templates literais**: Simples mas sujeito a injeção/escape incorreto
- **Coleta de variáveis globais**: Necessário para callbacks/interrupções

```javascript
// Fix para variáveis globais em callbacks
var globals = [];
var workspace = block.workspace;
var variables = Blockly.Variables.allUsedVarModels(workspace) || [];
for (var i = 0, variable; (variable = variables[i]); i++) {
  var varName = variable.name;
  if (block.getVars().indexOf(varName) == -1) {
    globals.push(Blockly.Python.nameDB_.getName(varName, Blockly.VARIABLE_CATEGORY_NAME));
  }
}
globals = globals.length ? 
  Blockly.Python.INDENT + 'global ' + globals.join(', ') + '\n' : '';
```

**Gestão de Perfis de Hardware:**
BIPES possui perfis específicos por placa (ESP32, ESP8266, Raspberry Pi Pico) que:
- Determinam imports obrigatórios
- Mapeiam pinos físicos
- Incluem drivers específicos por sensor/atuador

#### **Tratamento de Erros**
- Blocos sem gerador: sistema falha silenciosamente ou gera comentário
- Não há validação forte de tipos
- Erros de sintaxe só aparecem em runtime na placa

---

### 2.2 RaspberryPi Foundation Blockly (TypeScript)

#### **Arquitetura Orientada a Objetos**

```typescript
export abstract class CodeGenerator {
  // Estado do gerador
  protected definitions_: {[key: string]: string};
  protected nameDB_: Names;
  
  // Constantes de linguagem
  abstract readonly ORDER_OVERRIDES: [string, number][];
  readonly INDENT = '  ';
  readonly PASS = 'pass\n';
  
  constructor(name: string) {
    this.definitions_ = Object.create(null);
    this.nameDB_ = new Names('');
  }
  
  // Método principal de geração
  abstract blockToCode(block: Block, opt_thisOnly?: boolean): string | [string, number];
  
  // Costura final do código
  finish(code: string): string {
    const imports = [];
    const definitions = [];
    
    for (let name in this.definitions_) {
      const def = this.definitions_[name];
      if (def.match(/^(from\s+\S+\s+)?import\s+\S+/)) {
        imports.push(def);
      } else {
        definitions.push(def);
      }
    }
    
    const allDefs = imports.join('\n') + '\n\n' + definitions.join('\n\n');
    return allDefs.replace(/\n\n+/g, '\n\n') + '\n\n' + code;
  }
}
```

**Sistema de Precedência de Operadores:**
Fundamental para gerar expressões corretas sem ambiguidade

```typescript
export enum Order {
  ATOMIC = 0,             // valores literais, variáveis
  COLLECTION = 1,         // tuplas, listas, dicionários
  STRING_CONVERSION = 1,  // `expressão`
  MEMBER = 2.1,           // x.attr, x[index]
  FUNCTION_CALL = 2.2,    // func(args)
  EXPONENTIATION = 3,     // x ** y
  UNARY_SIGN = 4,         // -x, +x
  BITWISE_NOT = 4,        // ~x
  MULTIPLICATIVE = 5,     // *, /, //, %
  ADDITIVE = 6,           // +, -
  BITWISE_SHIFT = 7,      // <<, >>
  BITWISE_AND = 8,        // &
  BITWISE_XOR = 9,        // ^
  BITWISE_OR = 10,        // |
  RELATIONAL = 11,        // <, >, <=, >=, ==, !=, in, not in
  LOGICAL_NOT = 12,       // not x
  LOGICAL_AND = 13,       // and
  LOGICAL_OR = 14,        // or
  CONDITIONAL = 15,       // x if condition else y
  LAMBDA = 16,            // lambda
  NONE = 99,              // sempre requer parênteses
}
```

**Gerador de operações matemáticas com precedência:**

```typescript
export function math_arithmetic(
  block: Block,
  generator: PythonGenerator,
): [string, Order] {
  const OPERATORS: Record<string, [string, Order]> = {
    'ADD': [' + ', Order.ADDITIVE],
    'MINUS': [' - ', Order.ADDITIVE],
    'MULTIPLY': [' * ', Order.MULTIPLICATIVE],
    'DIVIDE': [' / ', Order.MULTIPLICATIVE],
    'POWER': [' ** ', Order.EXPONENTIATION],
  };
  
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  
  const code = argument0 + operator + argument1;
  return [code, order];
}
```

**Helpers de Indentação e Formatação:**

```typescript
// Adiciona indentação a cada linha
prefixLines(text: string, prefix: string): string {
  return prefix + text.replace(/\n(.)/g, '\n' + prefix + '$1');
}

// Converte bloco de statements para código indentado
statementToCode(block: Block, name: string): string {
  const targetBlock = block.getInputTargetBlock(name);
  let code = this.blockToCode(targetBlock);
  
  if (typeof code !== 'string') {
    throw TypeError('Expecting code from statement block: ' + targetBlock?.type);
  }
  
  if (code) {
    return this.prefixLines(code, this.INDENT);
  }
  return '';
}
```

**Sistema de Hooks para Instrumentação:**

```typescript
// Injeta código antes de cada statement (útil para depuração/profiling)
STATEMENT_PREFIX?: string;
STATEMENT_SUFFIX?: string;
INFINITE_LOOP_TRAP?: string;

addLoopTrap(branch: string, block: Block): string {
  if (this.INFINITE_LOOP_TRAP) {
    branch = this.INFINITE_LOOP_TRAP.replace(/%1/g, `'${block.id}'`) + branch;
  }
  if (this.STATEMENT_SUFFIX) {
    branch += this.prefixLines(
      this.injectId(this.STATEMENT_SUFFIX, block),
      this.INDENT
    );
  }
  return branch;
}
```

**Tratamento de Erros Tipados:**

```typescript
blockToCode(block: Block, opt_thisOnly?: boolean): string | [string, Order] {
  if (!block) return '';
  
  const func = this[block.type];
  if (typeof func !== 'function') {
    throw Error(`Language "${this.name_}" does not know how to generate code for block type "${block.type}"`);
  }
  
  const code = func.call(this, block);
  
  if (Array.isArray(code)) {
    if (!block.outputConnection) {
      throw TypeError('Expecting string from statement block: ' + block.type);
    }
    return [this.scrub_(block, code[0], opt_thisOnly), code[1]];
  } else if (typeof code === 'string') {
    return this.scrub_(block, code, opt_thisOnly);
  }
  
  throw SyntaxError('Invalid code generated: ' + code);
}
```

---

### 2.3 Google Blockly Android (Java)

#### **Arquitetura Service-Based com WebView**
Android não pode executar JavaScript nativo, então usa WebView como "motor" de transpilação:

```java
public class CodeGeneratorService extends Service {
  private WebView mWebview;
  private ArrayDeque<CodeGenerationRequest> mRequestQueue;
  
  @Override
  public void onCreate() {
    super.onCreate();
    mWebview = new WebView(this);
    mWebview.getSettings().setJavaScriptEnabled(true);
    mWebview.addJavascriptInterface(
      new BlocklyJavascriptInterface(), 
      "BlocklyJavascriptInterface"
    );
    mWebview.loadUrl("file:///android_asset/background_compiler.html");
  }
  
  public void requestCodeGeneration(CodeGenerationRequest request) {
    synchronized (this) {
      mRequestQueue.add(request);
    }
    handleRequest();
  }
  
  private void handleRequest() {
    if (mWebview == null || mRequestQueue.isEmpty()) return;
    
    CodeGenerationRequest request = mRequestQueue.peek();
    String url = buildCodeGenerationUrl(request.getXml(), request.getGenerator());
    mWebview.loadUrl(url);
  }
}
```

**JavaScript Bridge para comunicação Java ↔ WebView:**

```java
private class BlocklyJavascriptInterface {
  @JavascriptInterface
  public void execute(String program) {
    CodeGeneratorCallback cb = mCallback;
    if (cb != null) {
      cb.onFinishCodeGeneration(program);
    }
    mRequestQueue.poll(); // Remove request processado
    handleRequest();      // Processa próximo
  }
  
  @JavascriptInterface
  public void error(String errorMessage) {
    CodeGeneratorCallback cb = mCallback;
    if (cb != null) {
      cb.onCodeGenerationError(errorMessage);
    }
  }
}
```

**HTML/JS no WebView:**

```html
<script>
function generate(blocklyxml, generator) {
  try {
    var dom = Blockly.Xml.textToDom(blocklyxml);
    var workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, workspace);
    
    var code = generator.workspaceToCode(workspace);
    
    workspace.clear(); // Importante: limpa estado global
    
    BlocklyJavascriptInterface.execute(code);
  } catch (error) {
    BlocklyJavascriptInterface.error(error.toString());
  }
}
</script>
```

**Tratamento de Escaping/Segurança:**

```java
static String buildCodeGenerationUrl(String xml, String generatorObject) {
  // Android <= 4.3 requer URL encoding completo
  if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.JELLY_BEAN_MR2) {
    String urlEncodedXml = URLEncoder.encode(xml, "UTF-8");
    urlEncodedXml = urlEncodedXml.replace("+", "%20");
    return "javascript:generateEscaped('" + urlEncodedXml + "');";
  } 
  // Android >= 4.4 permite JS escape mais simples
  else {
    String jsEscapedXml = xml
      .replace("\\", "\\\\")
      .replace("'", "\\'")
      .replace("\n", "\\n")
      .replace("\r", "\\r");
    return "javascript:generate('" + jsEscapedXml + "', " + generatorObject + ");";
  }
}
```

---

### 2.4 Google Blockly iOS (Swift)

#### **Arquitetura com WKWebView**
Similar ao Android mas usando Swift e WKWebView (mais moderno que UIWebView):

```swift
public final class CodeGenerator: NSObject {
  public enum State: Int {
    case initialized = 0
    case loading
    case readyForUse
    case unusable
    case generatingCode
  }
  
  public let jsCoreDependencies: [BundledFile]
  public let jsGeneratorObject: String
  public let jsBlockGeneratorFiles: [BundledFile]
  public let jsonBlockDefinitionFiles: [BundledFile]
  
  fileprivate var webView: WKWebView!
  fileprivate var state: State = .initialized
  
  public init(
    jsCoreDependencies: [BundledFile],
    jsGeneratorObject: String,
    jsBlockGeneratorFiles: [BundledFile],
    jsonBlockDefinitionFiles: [BundledFile]
  ) {
    self.jsCoreDependencies = jsCoreDependencies
    self.jsGeneratorObject = jsGeneratorObject
    self.jsBlockGeneratorFiles = jsBlockGeneratorFiles
    self.jsonBlockDefinitionFiles = jsonBlockDefinitionFiles
    super.init()
  }
}
```

**Service com Request Builder Pattern:**

```swift
open class CodeGeneratorServiceRequestBuilder: NSObject {
  open let jsGeneratorObject: String
  open private(set) var jsBlockGeneratorFiles = [BundledFile]()
  open private(set) var jsonBlockDefinitionFiles = [BundledFile]()
  
  public init(jsGeneratorObject: String) {
    self.jsGeneratorObject = jsGeneratorObject
  }
  
  public func addJSBlockGeneratorFiles(_ files: [String], bundle: Bundle = Bundle.main) -> Self {
    jsBlockGeneratorFiles.append(contentsOf: files.map { (path: $0, bundle: bundle) })
    return self
  }
  
  public func addJSONBlockDefinitionFiles(fromDefaultFiles files: [BlockJSONFile]) -> Self {
    let bundle = Bundle(for: BKYBlockJSONFile.self)
    jsonBlockDefinitionFiles.append(contentsOf: files.map { 
      (path: $0.filename, bundle: bundle) 
    })
    return self
  }
  
  public func makeRequest() throws -> CodeGeneratorServiceRequest {
    return CodeGeneratorServiceRequest(
      jsGeneratorObject: jsGeneratorObject,
      jsBlockGeneratorFiles: jsBlockGeneratorFiles,
      jsonBlockDefinitionFiles: jsonBlockDefinitionFiles
    )
  }
}
```

**JavaScript Bridge (Swift → JS):**

```javascript
// Injetado no WKWebView
CodeGeneratorBridge.generateCodeForWorkspace = function(workspaceXML, generator) {
  try {
    var dom = Blockly.Xml.textToDom(workspaceXML);
    var workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, workspace);
    
    var code = generator.workspaceToCode(workspace);
    
    workspace.clear(); // Limpa estado global
    workspace.dispose();
    
    // Envia resultado de volta para Swift
    window.webkit.messageHandlers.CodeGenerator.postMessage({
      method: "generateCodeForWorkspace",
      code: code
    });
  } catch (error) {
    window.webkit.messageHandlers.CodeGenerator.postMessage({
      method: "generateCodeForWorkspace",
      error: error.toString()
    });
  }
};
```

**Swift Message Handler:**

```swift
extension CodeGeneratorService: WKScriptMessageHandler {
  public func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    guard let body = message.body as? [String: Any],
          let method = body["method"] as? String else {
      return
    }
    
    if method == "generateCodeForWorkspace" {
      if let code = body["code"] as? String {
        currentRequest?.onCompletion?(currentRequest!.uuid, code)
      } else if let error = body["error"] as? String {
        currentRequest?.onError?(currentRequest!.uuid, error)
      }
    }
  }
}
```

---

## 3. Como deve ser um transpilador completo, funcional e seguro

### Princípios Fundamentais

Um transpilador robusto para missões críticas deve seguir estes princípios:

#### 3.1 Arquitetura em Camadas

**Camada 1: Validação e Normalização**
- Validar grafo antes de gerar código
- Detectar ciclos, conexões inválidas, tipos incompatíveis
- Normalizar valores (bool → True/False, números, strings)
- Resolver defaults de parâmetros

**Camada 2: Geração com Estado**
- `GeneratorState` acumula imports, definitions, setup, loop
- Geradores por tipo de nó retornam código + metadados
- Precedência de operadores para expressões corretas
- Helpers de indentação e formatação

**Camada 3: Montagem Final**
- Deduplicação de imports (merge de `from X import a, b, c`)
- Proteção de bibliotecas externas (`_ensure_lib`)
- Ordenação correta: imports → definitions → setup → loop
- Injeção de hooks (profiling, debug, safety checks)

#### 3.2 Geradores por Nó/Componente

Cada tipo de componente tem função geradora dedicada:

```typescript
type BlockGenerator = (
  node: ComponentNode,
  context: GeneratorContext
) => [string, Order] | string;

interface GeneratorContext {
  definitions: Map<string, string>;  // imports + init globals
  nameDB: Names;                     // variable name tracking
  indent: number;
  pass: string;                      // 'pass\n' para Python
  profile: HardwareProfile;          // perfil da placa
}
```

**Exemplo de gerador para sensor DHT:**

```typescript
registerGenerator('dht_sensor', (node, ctx) => {
  const pin = node.params.pin;
  const sensorType = node.params.sensor_type; // 'DHT11' ou 'DHT22'
  const varName = ctx.nameDB.getName(`dht_${node.id}`, 'VARIABLE');
  
  // Adiciona import
  ctx.definitions.set('import_dht', 'import dht');
  ctx.definitions.set('import_machine_pin', 'from machine import Pin');
  
  // Adiciona inicialização
  ctx.definitions.set(
    `init_${varName}`,
    `${varName} = dht.${sensorType}(Pin(${pin}))`
  );
  
  // Código de leitura
  const code = `${varName}.measure()\n` +
               `temp = ${varName}.temperature()\n` +
               `hum = ${varName}.humidity()`;
  
  return code;
});
```

#### 3.3 Sistema de Precedência de Operadores

Inspirado no Blockly, usar enum de precedência para resolver ambiguidade:

```typescript
enum Order {
  ATOMIC = 0,          // 'value', 123, variable
  MEMBER = 1,          // obj.attr, list[0]
  FUNCTION_CALL = 2,   // func()
  EXPONENTIATION = 3,  // **
  UNARY = 4,           // -x, +x, not x
  MULTIPLICATIVE = 5,  // *, /, //, %
  ADDITIVE = 6,        // +, -
  RELATIONAL = 7,      // <, >, <=, >=, ==, !=
  LOGICAL_AND = 8,     // and
  LOGICAL_OR = 9,      // or
  NONE = 99            // sempre requer parênteses
}
```

**Uso em geradores de expressões:**

```typescript
function generateComparison(node: ComparisonNode, ctx: GeneratorContext): [string, Order] {
  const left = valueToCode(node.inputs.left, Order.RELATIONAL);
  const operator = node.params.operator; // '<', '>', '==', etc.
  const right = valueToCode(node.inputs.right, Order.RELATIONAL);
  
  const code = `${left} ${operator} ${right}`;
  return [code, Order.RELATIONAL];
}

function valueToCode(input: NodeInput, parentOrder: Order): string {
  const [code, childOrder] = generateExpression(input);
  
  // Adiciona parênteses se precedência exigir
  if (childOrder > parentOrder) {
    return `(${code})`;
  }
  return code;
}
```

#### 3.4 Validação Multicamada

**Pré-transpilação:**
1. Validar grafo (sem ciclos, conexões válidas)
2. Verificar existência de geradores para todos os nós
3. Checar parâmetros obrigatórios preenchidos
4. Validar compatibilidade de tipos em conexões
5. Detectar conflitos de pinos

**Pós-geração:**
1. Verificar placeholders não resolvidos (`{{...}}`)
2. Validar sintaxe Python (parser AST se possível)
3. Checar imports de bibliotecas externas
4. Validar indentação e estrutura de blocos

**Exemplo de validador:**

```typescript
class TranspilerValidator {
  validateNode(node: ComponentNode): ValidationResult {
    const errors: string[] = [];
    
    // 1. Verifica se gerador existe
    if (!generators.has(node.type)) {
      errors.push(`No generator for node type: ${node.type}`);
    }
    
    // 2. Valida parâmetros obrigatórios
    const driver = getDriver(node.driverId);
    for (const param of driver.parameters) {
      if (param.required && !(param.id in node.params)) {
        errors.push(`Missing required parameter: ${param.id}`);
      }
    }
    
    // 3. Valida conexões
    for (const [inputName, input] of Object.entries(node.inputs)) {
      if (input.required && !input.source) {
        errors.push(`Required input '${inputName}' not connected`);
      }
      
      if (input.source) {
        const sourceType = input.source.outputType;
        const expectedType = input.expectedType;
        
        if (!this.typesCompatible(sourceType, expectedType)) {
          errors.push(
            `Type mismatch: ${inputName} expects ${expectedType}, got ${sourceType}`
          );
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  validateGeneratedCode(code: string): ValidationResult {
    const errors: string[] = [];
    
    // Verifica placeholders não resolvidos
    const unresolvedPlaceholders = code.match(/\{\{[^}]+\}\}/g);
    if (unresolvedPlaceholders) {
      errors.push(`Unresolved placeholders: ${unresolvedPlaceholders.join(', ')}`);
    }
    
    // Verifica literais JS não convertidos
    if (/\btrue\b|\bfalse\b|\bnull\b/.test(code)) {
      errors.push('Found unconverted JavaScript literals');
    }
    
    // Verifica return em nível de módulo/loop
    const lines = code.split('\n');
    let inFunction = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*def\s+/.test(lines[i])) inFunction = true;
      if (inFunction && /^\S/.test(lines[i])) inFunction = false;
      
      if (!inFunction && /\breturn\b/.test(lines[i])) {
        errors.push(`Line ${i+1}: 'return' outside function`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

#### 3.5 Gestão de Dependências e Bibliotecas

**Sistema de imports protegidos:**

```typescript
class LibraryManager {
  private libraries = new Set<string>();
  
  addLibrary(name: string) {
    this.libraries.add(name);
  }
  
  generateImportGuards(): string {
    if (this.libraries.size === 0) return '';
    
    const guards = [
      'missing_libs = []',
      '',
      'def _ensure_lib(name):',
      '    """Verifica se biblioteca está instalada"""',
      '    try:',
      '        __import__(name)',
      '        return True',
      '    except ImportError:',
      "        print(f'AVISO: Biblioteca {name} não encontrada')",
      '        missing_libs.append(name)',
      '        return False',
      ''
    ];
    
    return guards.join('\n');
  }
  
  wrapImport(importStatement: string): string {
    // import dht → if _ensure_lib('dht'): import dht
    const match = importStatement.match(/^import\s+([\w_]+)/);
    if (match && this.libraries.has(match[1])) {
      return `if _ensure_lib('${match[1]}'):\n    ${importStatement}`;
    }
    
    // from dht import DHT11 → if _ensure_lib('dht'): from dht import DHT11
    const fromMatch = importStatement.match(/^from\s+([\w_]+)\s+import/);
    if (fromMatch && this.libraries.has(fromMatch[1])) {
      return `if _ensure_lib('${fromMatch[1]}'):\n    ${importStatement}`;
    }
    
    return importStatement;
  }
}
```

#### 3.6 Perfis de Hardware

```typescript
interface HardwareProfile {
  id: string;
  name: string;
  
  // Pinos disponíveis
  pins: {
    digital: number[];
    analog: number[];
    pwm: number[];
    i2c: { sda: number; scl: number }[];
    spi: { miso: number; mosi: number; sck: number; cs: number[] }[];
  };
  
  // Drivers pré-configurados
  presets: {
    [driverId: string]: {
      params: Record<string, any>;  // parâmetros fixos
      locked: boolean;               // usuário pode modificar?
    };
  };
  
  // Imports obrigatórios para este perfil
  requiredImports: string[];
  
  // Código de inicialização do perfil
  initCode?: string;
}

const PION_CANSAT_PROFILE: HardwareProfile = {
  id: 'pion_cansat_v1',
  name: 'Pion CanSat V1',
  
  pins: {
    digital: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19],
    analog: [32, 33, 34, 35, 36, 39],
    pwm: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19],
    i2c: [{ sda: 21, scl: 22 }],
    spi: [{ miso: 19, mosi: 23, sck: 18, cs: [5, 15] }]
  },
  
  presets: {
    'bme280_sensor': {
      params: { sda: 21, scl: 22, address: '0x76' },
      locked: true
    },
    'gps_module': {
      params: { tx: 17, rx: 16, baud: 9600 },
      locked: true
    },
    'led_output': {
      params: { pin: 2 },
      locked: false
    }
  },
  
  requiredImports: [
    'from machine import Pin, I2C, SPI, UART',
    'import time'
  ],
  
  initCode: `
# Inicialização Pion CanSat V1
i2c = I2C(0, sda=Pin(21), scl=Pin(22), freq=400000)
spi = SPI(1, baudrate=1000000, polarity=0, phase=0, sck=Pin(18), mosi=Pin(23), miso=Pin(19))
  `.trim()
};
```

#### 3.7 Formatação e Indentação

```typescript
class CodeFormatter {
  private indentLevel = 0;
  private readonly INDENT = '    '; // 4 espaços (PEP 8)
  
  indent() {
    this.indentLevel++;
  }
  
  dedent() {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
  
  getCurrentIndent(): string {
    return this.INDENT.repeat(this.indentLevel);
  }
  
  prefixLines(code: string, additionalIndent = 0): string {
    const prefix = this.INDENT.repeat(this.indentLevel + additionalIndent);
    return code.split('\n')
      .map(line => line.trim() ? prefix + line.trim() : '')
      .join('\n');
  }
  
  formatBlock(header: string, body: string): string {
    if (!body || body.trim() === '') {
      return `${header}:\n${this.INDENT.repeat(this.indentLevel + 1)}pass`;
    }
    
    this.indent();
    const formattedBody = this.prefixLines(body);
    this.dedent();
    
    return `${header}:\n${formattedBody}`;
  }
  
  formatIfElse(condition: string, thenBranch: string, elseBranch?: string): string {
    let code = this.formatBlock(`if ${condition}`, thenBranch);
    
    if (elseBranch && elseBranch.trim()) {
      code += '\n' + this.getCurrentIndent() + 'else:\n';
      this.indent();
      code += this.prefixLines(elseBranch);
      this.dedent();
    }
    
    return code;
  }
}
```

#### 3.8 Tratamento de Erros e Fallback

**Estratégia para erros de geração:**

```typescript
enum ErrorSeverity {
  WARNING,  // Aviso, código pode funcionar
  ERROR,    // Erro grave, código não será executado
  FATAL     // Erro crítico, missão em risco
}

interface TranspilerError {
  severity: ErrorSeverity;
  nodeId?: string;
  message: string;
  suggestion?: string;
}

class ErrorHandler {
  private errors: TranspilerError[] = [];
  
  addError(error: TranspilerError) {
    this.errors.push(error);
    
    if (error.severity === ErrorSeverity.FATAL) {
      throw new Error(`FATAL: ${error.message}`);
    }
  }
  
  getErrors(): TranspilerError[] {
    return this.errors;
  }
  
  hasErrors(): boolean {
    return this.errors.some(e => e.severity >= ErrorSeverity.ERROR);
  }
  
  generateErrorReport(): string {
    const byNode = new Map<string, TranspilerError[]>();
    
    for (const error of this.errors) {
      const nodeId = error.nodeId || 'global';
      if (!byNode.has(nodeId)) byNode.set(nodeId, []);
      byNode.get(nodeId)!.push(error);
    }
    
    let report = '# RELATÓRIO DE TRANSPILAÇÃO\n\n';
    
    for (const [nodeId, errors] of byNode) {
      report += `## ${nodeId === 'global' ? 'Erros Globais' : `Nó: ${nodeId}`}\n`;
      for (const error of errors) {
        report += `- [${ErrorSeverity[error.severity]}] ${error.message}\n`;
        if (error.suggestion) {
          report += `  Sugestão: ${error.suggestion}\n`;
        }
      }
      report += '\n';
    }
    
    return report;
  }
}
```

#### 3.9 Pré-visualização e Debugging

```typescript
interface TranspileResult {
  success: boolean;
  code?: string;
  errors: TranspilerError[];
  warnings: TranspilerError[];
  metadata: {
    nodeCount: number;
    imports: string[];
    libraries: string[];
    variables: Map<string, string>;
    profile: string;
  };
}

class TranspilerPreview {
  generatePreview(result: TranspileResult): string {
    const sections = [];
    
    // Cabeçalho
    sections.push(this.generateHeader(result));
    
    // Erros/Warnings
    if (result.errors.length > 0 || result.warnings.length > 0) {
      sections.push(this.generateDiagnostics(result));
    }
    
    // Código gerado
    if (result.code) {
      sections.push(this.generateCodePreview(result.code));
    }
    
    // Metadata
    sections.push(this.generateMetadata(result.metadata));
    
    return sections.join('\n\n' + '='.repeat(80) + '\n\n');
  }
  
  private generateHeader(result: TranspileResult): string {
    const status = result.success ? '✓ SUCESSO' : '✗ FALHA';
    return `
╔═══════════════════════════════════════════════════════════════╗
║  ORBITA - TRANSPILADOR MICROPYTHON                            ║
║  Status: ${status.padEnd(50)}║
║  Data: ${new Date().toISOString().padEnd(52)}║
╚═══════════════════════════════════════════════════════════════╝
    `.trim();
  }
  
  private generateCodePreview(code: string): string {
    const lines = code.split('\n');
    const numbered = lines.map((line, i) => 
      `${String(i + 1).padStart(4)} | ${line}`
    ).join('\n');
    
    return `CÓDIGO GERADO:\n\n${numbered}`;
  }
}
```

#### 3.10 Testabilidade

**Geração de IR (Intermediate Representation) para testes:**

```typescript
interface IR {
  nodes: IRNode[];
  edges: IREdge[];
  variables: Map<string, IRVariable>;
}

interface IRNode {
  id: string;
  type: string;
  generator: string;
  params: Record<string, any>;
  inputs: Map<string, IRValue>;
  outputs: Map<string, IRValue>;
}

interface IRValue {
  type: DataType;
  source?: { nodeId: string; outputName: string };
  literal?: any;
}

class IRGenerator {
  generateIR(nodes: ComponentNode[], edges: ComponentEdge[]): IR {
    // Converte grafo visual para IR intermediário
    // Útil para testes unitários sem gerar código real
  }
  
  validateIR(ir: IR): ValidationResult {
    // Valida IR antes de transpilação
  }
}

// Exemplo de teste
describe('Transpiler', () => {
  it('should generate valid MicroPython for sensor → LED', () => {
    const ir: IR = {
      nodes: [
        {
          id: 'sensor1',
          type: 'dht_sensor',
          generator: 'dht_sensor',
          params: { pin: 4, sensor_type: 'DHT22' },
          inputs: new Map(),
          outputs: new Map([
            ['temperature', { type: DataType.NUMBER }],
            ['humidity', { type: DataType.NUMBER }]
          ])
        },
        {
          id: 'led1',
          type: 'led_output',
          generator: 'led_output',
          params: { pin: 2 },
          inputs: new Map([
            ['value', {
              type: DataType.NUMBER,
              source: { nodeId: 'sensor1', outputName: 'temperature' }
            }]
          ]),
          outputs: new Map()
        }
      ],
      edges: [
        { source: 'sensor1', sourceHandle: 'temperature', target: 'led1', targetHandle: 'value' }
      ],
      variables: new Map()
    };
    
    const result = transpiler.transpileIR(ir);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('import dht');
    expect(result.code).toContain('from machine import Pin');
    expect(result.code).not.toMatch(/\{\{.*\}\}/); // Sem placeholders
    expect(result.errors).toHaveLength(0);
  });
});
```


---

## 4. Planejamento para o nosso cenário (programação por componentes)

### 4.1 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   ORBITA UI (React/Zustand)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Canvas       │  │ Inspector    │  │ Mission      │      │
│  │ (React Flow) │◄─┤ (Parâmetros) │◄─┤ Manager      │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐      │
│  │          Graph Store (Zustand)                   │      │
│  │  - nodes: OrbitaNode[]                           │      │
│  │  - edges: OrbitaEdge[]                           │      │
│  │  - profile: HardwareProfileType                  │      │
│  └──────────────────┬───────────────────────────────┘      │
└────────────────────│─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  TRANSPILER PIPELINE                         │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. VALIDAÇÃO                                       │    │
│  │    - Detectar ciclos (Kahn's algorithm)           │    │
│  │    - Validar conexões e tipos                     │    │
│  │    - Verificar geradores disponíveis              │    │
│  │    - Checar parâmetros obrigatórios               │    │
│  │    - Validar pinos do perfil                      │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 2. NORMALIZAÇÃO                                    │    │
│  │    - Ordenação topológica                         │    │
│  │    - Geração de nomes de variáveis                │    │
│  │    - Merge de defaults com parâmetros             │    │
│  │    - Aplicação de ações (ajuste de params)        │    │
│  │    - Conversão para literais Python               │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 3. GERAÇÃO                                         │    │
│  │    GeneratorState:                                 │    │
│  │    ┌─────────────────────────────────────────┐    │    │
│  │    │ imports: Set<string>                    │    │    │
│  │    │ libraries: Set<string>                  │    │    │
│  │    │ definitions: string[]                   │    │    │
│  │    │ setup: string[]                         │    │    │
│  │    │ loop: string[]                          │    │    │
│  │    └─────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  │    Para cada nó (ordem topológica):                │    │
│  │      a) Obter gerador do registro                  │    │
│  │      b) Executar gerador com contexto             │    │
│  │      c) Coletar imports e libs                    │    │
│  │      d) Adicionar setup e loop                    │    │
│  │      e) Processar condicionais {{#if}}            │    │
│  │      f) Substituir placeholders                   │    │
│  │      g) Sanitizar (true→True, return→continue)    │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 4. MONTAGEM                                        │    │
│  │    a) Gerar guards de libs (_ensure_lib)          │    │
│  │    b) Deduplicate/merge imports                   │    │
│  │    c) Ordenar seções                              │    │
│  │    d) Formatar com indentação correta             │    │
│  │    e) Validar placeholders remanescentes          │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 5. RESULTADO                                       │    │
│  │    TranspileResult {                               │    │
│  │      success: boolean                              │    │
│  │      code?: string                                 │    │
│  │      errors: TranspilerError[]                     │    │
│  │      warnings: TranspilerError[]                   │    │
│  │      metadata: { ... }                             │    │
│  │    }                                                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Catálogo de Componentes

Cada componente possui metadados completos para geração:

```typescript
// core/catalog/component-catalog.ts
export interface ComponentMetadata {
  id: string;
  name: string;
  category: HardwareCategory;
  
  // Gerador responsável pela transpilação
  generator: BlockGenerator;
  
  // Templates de código
  templates: {
    imports: string[];
    libraries?: string[];    // Libs externas a checar
    setupCode: string;       // Init uma vez
    loopCode: string;        // Executado no loop
    cleanupCode?: string;    // Finalização (se necessário)
  };
  
  // Portas de entrada/saída
  ports: {
    inputs: PortDefinition[];
    outputs: PortDefinition[];
  };
  
  // Parâmetros configuráveis
  parameters: ParameterDefinition[];
  
  // Constraints de hardware
  constraints?: {
    pins?: PinConstraint[];
    profile?: HardwareProfileType[];  // Perfis compatíveis
    mutualExclusive?: string[];       // Componentes incompatíveis
  };
  
  // Ações disponíveis (para atuadores)
  actions?: ActionDefinition[];
}

// Exemplo: Sensor DHT
export const DHT_SENSOR: ComponentMetadata = {
  id: 'dht_sensor',
  name: 'Sensor DHT11/DHT22',
  category: HardwareCategory.SENSOR,
  
  generator: (node, ctx) => {
    const pin = node.params.pin;
    const type = node.params.sensor_type;
    const interval = node.params.interval || 2000;
    const varName = ctx.nameDB.getName(`dht_${node.id}`, 'VARIABLE');
    
    ctx.definitions.set(`init_${varName}`, 
      `${varName}_sensor = dht.DHT${type}(Pin(${pin}))\n` +
      `${varName}_last_read = 0\n` +
      `${varName}_temp = 0\n` +
      `${varName}_hum = 0`
    );
    
    const code = `
if time.ticks_diff(time.ticks_ms(), ${varName}_last_read) >= ${interval}:
    try:
        ${varName}_sensor.measure()
        ${varName}_temp = ${varName}_sensor.temperature()
        ${varName}_hum = ${varName}_sensor.humidity()
        ${varName}_last_read = time.ticks_ms()
    except Exception as e:
        print("Erro DHT:", e)
    `.trim();
    
    return code;
  },
  
  templates: {
    imports: ['from machine import Pin', 'import dht', 'import time'],
    libraries: ['dht']
  },
  
  ports: {
    inputs: [],
    outputs: [
      { id: 'temperature', label: 'Temperatura (°C)', type: DataType.NUMBER },
      { id: 'humidity', label: 'Umidade (%)', type: DataType.NUMBER }
    ]
  },
  
  parameters: [
    { id: 'pin', label: 'Pino GPIO', type: 'number', default: 4, min: 0, max: 39, required: true },
    { 
      id: 'sensor_type', 
      label: 'Tipo de Sensor', 
      type: 'select', 
      default: 'DHT11',
      options: [
        { value: 'DHT11', label: 'DHT11' },
        { value: 'DHT22', label: 'DHT22' }
      ],
      required: true
    },
    { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 2000, min: 500, max: 60000 }
  ]
};
```

### 4.3 Pipeline de Transpilação Detalhado

#### **Fase 1: Validação**

```typescript
class ValidationPhase {
  validate(nodes: OrbitaNode[], edges: OrbitaEdge[], profile: HardwareProfile): ValidationResult {
    const errors: TranspilerError[] = [];
    
    // 1.1 Validar grafo
    if (this.hasCycle(nodes, edges)) {
      errors.push({
        severity: ErrorSeverity.FATAL,
        message: 'Grafo contém ciclo (loop infinito detectado)'
      });
    }
    
    // 1.2 Validar nós
    for (const node of nodes) {
      const metadata = COMPONENT_CATALOG.get(node.type);
      
      if (!metadata) {
        errors.push({
          severity: ErrorSeverity.FATAL,
          nodeId: node.id,
          message: `Componente desconhecido: ${node.type}`
        });
        continue;
      }
      
      if (!metadata.generator) {
        errors.push({
          severity: ErrorSeverity.FATAL,
          nodeId: node.id,
          message: `Sem gerador para componente: ${metadata.name}`
        });
      }
      
      // Validar parâmetros
      for (const param of metadata.parameters) {
        const value = node.params[param.id];
        
        if (param.required && value === undefined) {
          errors.push({
            severity: ErrorSeverity.ERROR,
            nodeId: node.id,
            message: `Parâmetro obrigatório ausente: ${param.label}`,
            suggestion: param.default ? `Use default: ${param.default}` : undefined
          });
        }
        
        // Validar range
        if (param.type === 'number' && value !== undefined) {
          if (param.min !== undefined && value < param.min) {
            errors.push({
              severity: ErrorSeverity.ERROR,
              nodeId: node.id,
              message: `${param.label} abaixo do mínimo (${value} < ${param.min})`
            });
          }
          if (param.max !== undefined && value > param.max) {
            errors.push({
              severity: ErrorSeverity.ERROR,
              nodeId: node.id,
              message: `${param.label} acima do máximo (${value} > ${param.max})`
            });
          }
        }
      }
      
      // Validar compatibilidade com perfil
      if (metadata.constraints?.profile) {
        if (!metadata.constraints.profile.includes(profile.id)) {
          errors.push({
            severity: ErrorSeverity.WARNING,
            nodeId: node.id,
            message: `Componente ${metadata.name} pode não funcionar com perfil ${profile.name}`
          });
        }
      }
    }
    
    // 1.3 Validar conexões
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (!source || !target) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Conexão inválida: ${edge.source} → ${edge.target}`
        });
        continue;
      }
      
      const sourceMeta = COMPONENT_CATALOG.get(source.type);
      const targetMeta = COMPONENT_CATALOG.get(target.type);
      
      const sourcePort = sourceMeta?.ports.outputs.find(p => p.id === edge.sourceHandle);
      const targetPort = targetMeta?.ports.inputs.find(p => p.id === edge.targetHandle);
      
      if (!sourcePort || !targetPort) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Porta inexistente na conexão: ${edge.sourceHandle} → ${edge.targetHandle}`
        });
        continue;
      }
      
      // Validar tipos
      if (!this.typesCompatible(sourcePort.type, targetPort.type)) {
        errors.push({
          severity: ErrorSeverity.WARNING,
          message: `Tipo incompatível: ${sourcePort.label} (${sourcePort.type}) → ${targetPort.label} (${targetPort.type})`
        });
      }
    }
    
    // 1.4 Validar pinos
    const pinUsage = new Map<number, string[]>();
    for (const node of nodes) {
      const metadata = COMPONENT_CATALOG.get(node.type);
      if (!metadata) continue;
      
      for (const param of metadata.parameters) {
        if (param.id === 'pin' || param.id.endsWith('_pin')) {
          const pin = node.params[param.id];
          if (pin !== undefined) {
            if (!pinUsage.has(pin)) pinUsage.set(pin, []);
            pinUsage.get(pin)!.push(`${metadata.name} (${node.id})`);
          }
        }
      }
    }
    
    for (const [pin, users] of pinUsage) {
      if (users.length > 1) {
        errors.push({
          severity: ErrorSeverity.WARNING,
          message: `Pino ${pin} usado por múltiplos componentes: ${users.join(', ')}`,
          suggestion: 'Verifique se é intencional (ex.: barramento I2C compartilhado)'
        });
      }
    }
    
    return {
      valid: !errors.some(e => e.severity >= ErrorSeverity.ERROR),
      errors
    };
  }
}
```

#### **Fase 2: Normalização**

```typescript
class NormalizationPhase {
  normalize(nodes: OrbitaNode[], edges: OrbitaEdge[]): NormalizedGraph {
    // 2.1 Ordenação topológica (Kahn's algorithm)
    const sorted = this.topologicalSort(nodes, edges);
    
    // 2.2 Gerar nomes de variáveis
    const variableMap = this.generateVariableNames(sorted);
    
    // 2.3 Merge de defaults
    const normalizedNodes = sorted.map(node => {
      const metadata = COMPONENT_CATALOG.get(node.type)!;
      const params = this.mergeWithDefaults(node.params, metadata.parameters);
      
      return {
        ...node,
        params,
        varName: variableMap[node.id]
      };
    });
    
    // 2.4 Resolver bindings de entrada
    const inputBindings = new Map<string, Map<string, InputBinding>>();
    
    for (const edge of edges) {
      const source = normalizedNodes.find(n => n.id === edge.source)!;
      const target = normalizedNodes.find(n => n.id === edge.target)!;
      
      if (!inputBindings.has(target.id)) {
        inputBindings.set(target.id, new Map());
      }
      
      inputBindings.get(target.id)!.set(edge.targetHandle, {
        sourceVar: `${source.varName}_${edge.sourceHandle}`,
        sourceType: this.getOutputType(source, edge.sourceHandle)
      });
    }
    
    return {
      nodes: normalizedNodes,
      edges,
      inputBindings,
      variableMap
    };
  }
  
  private mergeWithDefaults(
    params: Record<string, any>,
    paramDefs: ParameterDefinition[]
  ): Record<string, any> {
    const merged = { ...params };
    
    for (const def of paramDefs) {
      if (merged[def.id] === undefined && def.default !== undefined) {
        merged[def.id] = def.default;
      }
    }
    
    return merged;
  }
}
```

#### **Fase 3: Geração**

```typescript
class GenerationPhase {
  generate(graph: NormalizedGraph, profile: HardwareProfile): GenerationResult {
    const state = new GeneratorState(graph.nodes.length);
    const formatter = new CodeFormatter();
    
    // Adiciona imports obrigatórios do perfil
    for (const imp of profile.requiredImports) {
      state.addImport(imp);
    }
    
    // Adiciona init code do perfil
    if (profile.initCode) {
      state.addSetup(profile.initCode);
    }
    
    // Gera código para cada nó
    for (const node of graph.nodes) {
      const metadata = COMPONENT_CATALOG.get(node.type)!;
      
      // Adiciona imports do componente
      state.addImport(metadata.templates.imports);
      
      // Adiciona libs externas
      if (metadata.templates.libraries) {
        state.addLibrary(metadata.templates.libraries);
      }
      
      // Prepara contexto do gerador
      const context: GeneratorContext = {
        state,
        formatter,
        profile,
        node,
        inputBindings: graph.inputBindings.get(node.id) || new Map()
      };
      
      try {
        // Executa gerador
        const code = metadata.generator(node, context);
        
        // Sanitiza código gerado
        const sanitized = this.sanitize(code);
        
        // Adiciona ao loop
        state.addLoop(sanitized);
        
      } catch (error) {
        throw new Error(
          `Erro ao gerar código para ${metadata.name} (${node.id}): ${error.message}`
        );
      }
    }
    
    return {
      state,
      formatter
    };
  }
  
  private sanitize(code: string): string {
    // Converte literais JS para Python
    code = code.replace(/\btrue\b/g, 'True');
    code = code.replace(/\bfalse\b/g, 'False');
    code = code.replace(/\bnull\b/g, 'None');
    code = code.replace(/\bundefined\b/g, 'None');
    
    // Converte return → continue em contexto de loop
    // (assume que estamos sempre em loop principal)
    code = code.replace(/\breturn\b/g, 'continue');
    
    // Remove linhas vazias múltiplas
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return code.trim();
  }
}
```

#### **Fase 4: Montagem**

```typescript
class AssemblyPhase {
  assemble(state: GeneratorState, formatter: CodeFormatter): string {
    const sections: string[] = [];
    
    // 4.1 Cabeçalho
    sections.push(this.generateHeader(state));
    
    // 4.2 Library guards
    if (state.libraries.size > 0) {
      sections.push(this.generateLibraryGuards(state));
    }
    
    // 4.3 Imports
    sections.push(this.generateImports(state));
    
    // 4.4 Setup
    if (state.setup.length > 0) {
      sections.push('\n# ===== INICIALIZAÇÃO =====');
      sections.push(state.setup.join('\n'));
    }
    
    // 4.5 Loop principal
    sections.push('\n# ===== LOOP PRINCIPAL =====');
    sections.push('while True:');
    
    formatter.indent();
    for (const loopCode of state.loop) {
      sections.push(formatter.prefixLines(loopCode));
    }
    sections.push(formatter.getCurrentIndent() + 'time.sleep_ms(50)  # Throttle');
    formatter.dedent();
    
    return sections.join('\n');
  }
  
  private generateLibraryGuards(state: GeneratorState): string {
    return `
missing_libs = []

def _ensure_lib(name):
    """Verifica se biblioteca externa está instalada"""
    try:
        __import__(name)
        return True
    except ImportError:
        print(f'AVISO: Biblioteca {name} não encontrada')
        print(f'  Instale com: mpremote mip install {name}')
        missing_libs.append(name)
        return False
    `.trim();
  }
  
  private generateImports(state: GeneratorState): string {
    const imports = Array.from(state.imports);
    
    // Separa imports simples de from imports
    const simpleImports: string[] = [];
    const fromImports = new Map<string, Set<string>>();
    
    for (const imp of imports) {
      const fromMatch = imp.match(/^from\s+([\w.]+)\s+import\s+(.+)$/);
      if (fromMatch) {
        const module = fromMatch[1];
        const names = fromMatch[2].split(',').map(n => n.trim());
        
        if (!fromImports.has(module)) {
          fromImports.set(module, new Set());
        }
        
        names.forEach(n => fromImports.get(module)!.add(n));
      } else {
        simpleImports.push(imp);
      }
    }
    
    // Merge from imports
    const mergedFromImports = Array.from(fromImports.entries())
      .map(([mod, names]) => `from ${mod} import ${Array.from(names).sort().join(', ')}`);
    
    const allImports = [...simpleImports.sort(), ...mergedFromImports.sort()];
    
    // Protege libs externas
    const protected = allImports.map(imp => {
      const match = imp.match(/^(?:from\s+)?([\w]+)/);
      if (match && state.libraries.has(match[1])) {
        return `if _ensure_lib('${match[1]}'):\n    ${imp}`;
      }
      return imp;
    });
    
    return protected.join('\n');
  }
}
```

### 4.4 Bindings de Entrada e Conexões

```typescript
class InputResolver {
  resolveInputs(
    node: NormalizedNode,
    metadata: ComponentMetadata,
    bindings: Map<string, InputBinding>
  ): Map<string, string> {
    const resolved = new Map<string, string>();
    
    for (const input of metadata.ports.inputs) {
      const binding = bindings.get(input.id);
      
      if (binding) {
        // Entrada conectada - usa variável do source
        resolved.set(`input_${input.id}`, binding.sourceVar);
      } else if (input.required) {
        // Entrada obrigatória não conectada - erro já detectado na validação
        // Usa fallback para não quebrar geração
        resolved.set(`input_${input.id}`, this.getDefaultForType(input.type));
      } else {
        // Entrada opcional não conectada - usa default
        resolved.set(`input_${input.id}`, this.getDefaultForType(input.type));
      }
    }
    
    return resolved;
  }
  
  private getDefaultForType(type: DataType): string {
    switch (type) {
      case DataType.BOOLEAN: return 'False';
      case DataType.NUMBER: return '0';
      case DataType.STRING: return '""';
      case DataType.ANY:
      default: return 'None';
    }
  }
}
```

### 4.5 Ações e Comportamentos de Atuadores

```typescript
class ActionProcessor {
  applyActions(node: NormalizedNode): void {
    const actions = node.data.actions || [];
    
    for (const action of actions) {
      const handler = ACTION_HANDLERS.get(action.type);
      if (handler) {
        handler(node, action);
      }
    }
  }
}

// Exemplo: Ação de beep do buzzer
const ACTION_HANDLERS = new Map<string, ActionHandler>([
  ['buzzer_beep', (node, action) => {
    node.params.tone = action.config.tone ?? 'normal';
    node.params.duration = action.config.duration ?? 300;
    node.params.repeat_enabled = true;
    node.params.repeat_interval = 1000;
    node.params.repeat_count_enabled = true;
    node.params.repeat_count = action.config.count ?? 1;
  }],
  
  ['buzzer_pattern', (node, action) => {
    node.params.tone = action.config.tone ?? 'high';
    node.params.duration = action.config.duration ?? 200;
    node.params.repeat_enabled = true;
    node.params.repeat_interval = action.config.interval ?? 400;
    node.params.repeat_count_enabled = true;
    node.params.repeat_count = action.config.count ?? 3;
  }],
  
  ['led_blink', (node, action) => {
    node.params.led_type = 'white';
    node.params.blink_enabled = true;
    node.params.blink_interval = action.config.interval ?? 500;
    node.params.blink_count_enabled = action.config.count_enabled ?? false;
    node.params.blink_count = action.config.count ?? 5;
  }]
]);
```

---

## 5. Estado Atual do Transpilador (branch correcaoTranpilerPorRepositorios)

**Resumo**: Estamos migrando de templates simples para arquitetura em camadas inspirada nos repositórios pesquisados. A branch `correcaoTranpilerPorRepositorios` reúne todas as melhorias implementadas e planejadas.

---

### 5.1 Estrutura de Arquivos

```
Prototipo-3/
├── src/
│   ├── core/
│   │   ├── transpiler.ts          # Pipeline principal
│   │   ├── drivers.ts              # Registro de drivers
│   │   ├── types.ts                # Interfaces TypeScript
│   │   ├── profiles.ts             # Perfis de hardware
│   │   └── validation.ts           # Validação
│   │
│   ├── components/
│   │   ├── blockly/
│   │   │   ├── OrbiterCanvas.tsx
│   │   │   └── NodeInspector.tsx
│   │   │
│   │   └── telemetry/
│   │       └── MissionManager.tsx
│   │
│   └── stores/
│       └── graphStore.ts
│
└── docs/
    └── transpilador-guia.md
```

---

### 5.2 O que Está Funcionando

✅ **GeneratorState com deduplicação**: Acumula imports/setup/loop sem duplicatas  
✅ **Validação de placeholders**: Detecta `{{...}}` não resolvidos e gera erro  
✅ **Sanitização de código**: Converte `true/false` → `True/False`, `return` → `continue`  
✅ **Library guards**: Protege imports com `_ensure_lib()` para libs externas  
✅ **Templates condicionais**: Processa `{{#if condition}}...{{/if}}`  
✅ **Perfis de hardware**: GENERIC_ESP32, PION_CANSAT_V1, CUBESAT_V1  
✅ **Drivers funcionais**: DHT, BME280, SHT30, CCS811, IMU, LDR, VBAT, LED, Buzzer, Servo, SD Card  

---

### 5.3 Trabalho em Andamento

🔄 **Refatoração do pipeline** (80% completo): Separação em fases (validação → normalização → geração → montagem)  
🔄 **Bindings de entrada** (70% completo): Resolver dependências entre nós conectados  
🔄 **Ações dinâmicas** (60% completo): Sistema de ações para atuadores com condições  

---

### 5.4 Próximas Melhorias

#### **Prioridade Alta**

🎯 **Library annotations completas**
- [ ] Marcar todos os drivers com `libraries?: string[]`
- [ ] Criar comando de instalação automática

🎯 **UI de warnings/libs ausentes**
- [ ] Painel de validação antes do upload
- [ ] Lista de bibliotecas necessárias
- [ ] Botão de instalação guiada

🎯 **Syntax validation Python**
- [ ] Integrar parser Python (pyodide ou MicroPython.js)
- [ ] Validar antes de permitir download/upload

#### **Prioridade Média**

📊 **Precedência de operadores**: Mapear `Order` enum do Blockly  
📊 **finish() pattern**: Método de merge final no pipeline  
📊 **IR para testes**: Representação intermediária antes de Python  

#### **Prioridade Baixa**

🔮 **Otimizações de código**: Dead code elimination, constant folding  
🔮 **Multi-target**: CircuitPython, Arduino C++, JavaScript  
🔮 **Debugging visual**: Breakpoints, step-by-step, variable inspector  

---

### 5.5 Exemplo Real Gerado

**Configuração**: DHT11 (pino 4) → LED (pino 2) que liga se temp > 25°C

```python
# ===== LIBRARY GUARDS =====
missing_libs = []

def _ensure_lib(name):
    try:
        __import__(name)
        return True
    except ImportError:
        print(f'AVISO: Biblioteca {name} não encontrada')
        print(f'  Instale com: mpremote mip install {name}')
        missing_libs.append(name)
        return False

# ===== IMPORTS =====
if _ensure_lib('dht'):
    from machine import Pin
    import dht
import time

# ===== INICIALIZAÇÃO =====
dht_abc123_sensor = dht.DHT11(Pin(4))
dht_abc123_last_read = 0
dht_abc123_temp = 0
dht_abc123_hum = 0

led_def456 = Pin(2, Pin.OUT)
led_def456.value(0)

# ===== LOOP PRINCIPAL =====
while True:
    # Read DHT sensor (with debounce)
    if time.ticks_diff(time.ticks_ms(), dht_abc123_last_read) >= 2000:
        try:
            dht_abc123_sensor.measure()
            dht_abc123_temp = dht_abc123_sensor.temperature()
            dht_abc123_hum = dht_abc123_sensor.humidity()
            dht_abc123_last_read = time.ticks_ms()
        except Exception as e:
            print("Erro DHT:", e)
    
    # Control LED based on temperature
    if dht_abc123_temp > 25:
        led_def456.value(1)
    else:
        led_def456.value(0)
    
    time.sleep_ms(50)
```

**Análise**: ✅ Library guard | ✅ Variáveis únicas | ✅ Debounce | ✅ Exception handling | ✅ Controle condicional | ✅ Loop throttle

---

### 5.6 Métricas de Código

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `transpiler.ts` | ~800 | ✅ Funcional |
| `drivers.ts` | ~2400 | ✅ Funcional |
| `types.ts` | ~300 | ✅ Completo |
| `profiles.ts` | ~200 | ✅ Completo |
| `validation.ts` | ~400 | 🔄 Em refatoração |
| **Total** | **~4100** | **85% completo** |

**Cobertura de testes**: 0% (próxima prioridade)

---

### 5.7 Roadmap

```
Q1 2025: ✅ GeneratorState | ✅ Validação placeholders | ✅ Sanitização | 🔄 Refatoração (80%)
Q2 2025: 📋 Library annotations | 📋 UI warnings | 📋 Syntax validation | 📋 Testes
Q3 2025: 📋 Precedência operadores | 📋 finish() | 📋 IR para testes
Q4 2025: 📋 Multi-target | 📋 Debugging visual
```

**Legenda**: ✅ Completo | 🔄 Em progresso | 📋 Planejado

---

## 6. Conclusão
