// ============================================================================
// TIPOS GLOBAIS - ORBITA
// ============================================================================

// ---------- Hardware & Módulos ----------

export type PinType = 'GPIO' | 'I2C_SDA' | 'I2C_SCL' | 'UART_TX' | 'UART_RX' | 'SPI_MOSI' | 'SPI_MISO' | 'SPI_SCK' | 'SPI_CS' | 'ADC' | 'PWM';

export interface PinConfiguration {
    id: string;
    label: string;
    pinNumber: number;
    type: PinType;
    isAssigned: boolean;
    assignedTo?: string; // Module ID
}

export type ModuleType =
    | 'BMP280'
    | 'BME280'
    | 'DHT11'
    | 'DHT22'
    | 'MPU6050'
    | 'GPS_NEO6M'
    | 'LORA_SX127X'
    | 'SD_CARD'
    | 'SERVO'
    | 'LED'
    | 'BUZZER';

export interface HardwareModule {
    id: string;
    type: ModuleType;
    name: string;
    description: string;
    icon: string;
    category: 'sensor' | 'actuator' | 'communication' | 'storage';
    requiredPins: {
        [key: string]: PinType;
    };
    assignedPins?: {
        [key: string]: number; // pin name -> GPIO number
    };
    isConfigured: boolean;
    parameters?: Record<string, any>;
}

export type BoardPreset = 'ESP32_GENERIC' | 'PION_LABS_CANSAT' | 'CUSTOM';

export interface BoardConfiguration {
    preset: BoardPreset;
    name: string;
    description: string;
    availablePins: PinConfiguration[];
    preConfiguredModules?: HardwareModule[];
}

// ---------- Blockly & Código ----------

export interface BlockDefinition {
    type: string;
    message0: string;
    args0?: any[];
    previousStatement?: string | null;
    nextStatement?: string | null;
    output?: string | null;
    colour: number;
    tooltip: string;
    helpUrl?: string;
}

export interface CodeGenerationResult {
    code: string;
    usedModules: ModuleType[];
    usedDrivers: string[];
    warnings: string[];
    errors: string[];
}

// ---------- Web Serial & Telemetria ----------

export interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
}

export interface SerialConnectionState {
    isConnected: boolean;
    isUploading: boolean;
    uploadProgress: number;
    portInfo?: SerialPortInfo;
    lastError?: string;
}

export interface TelemetryData {
    timestamp: number;
    raw: string;
    parsed?: {
        [key: string]: number | string;
    };
}

export interface TelemetryPlotData {
    name: string;
    data: Array<{
        timestamp: number;
        value: number;
    }>;
    color: string;
    unit?: string;
}

// ---------- Projeto ----------

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    modifiedAt: number;
    version: string;

    // Configuração de Hardware
    board: BoardConfiguration;
    modules: HardwareModule[];

    // Workspace Blockly (XML serializado)
    blocklyWorkspaceXml: string;

    // Código gerado (cache)
    generatedCode?: string;

    // Metadados
    author?: string;
    tags?: string[];
}

export interface ProjectMetadata {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    modifiedAt: number;
    thumbnail?: string;
}

// ---------- UI State ----------

export type ViewMode = 'blocks' | 'split' | 'code';
export type PanelTab = 'modules' | 'inspector' | 'console' | 'telemetry';

export interface UIState {
    viewMode: ViewMode;
    activePanel: PanelTab;
    isSidebarCollapsed: boolean;
    isCodeInspectorVisible: boolean;
    isModulePickerOpen: boolean;
    isPinSelectorOpen: boolean;
    selectedModuleId?: string;

    // Notifications/Toasts
    notifications: Notification[];
}

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    duration?: number;
}

// ---------- Mock Mode ----------

export interface MockSerialConfig {
    enabled: boolean;
    telemetryInterval: number;
    simulateErrors: boolean;
    simulateLatency: boolean;
}

// ---------- Drivers MicroPython ----------

export interface DriverTemplate {
    moduleType: ModuleType;
    className: string;
    code: string; // Código minificado do driver
    dependencies?: string[]; // Outros drivers necessários
}

// ---------- Validação ----------

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    type: 'pin_conflict' | 'missing_configuration' | 'invalid_block' | 'compilation_error';
    message: string;
    moduleId?: string;
    blockId?: string;
}

export interface ValidationWarning {
    type: 'unused_module' | 'performance' | 'best_practice';
    message: string;
    moduleId?: string;
}
