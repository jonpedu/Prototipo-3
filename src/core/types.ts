/**
 * ORBITA - Sistema de Tipos Core
 * Definições de interfaces e tipos para o ambiente de programação visual
 */

import { Node, Edge } from '@xyflow/react';

// ==================== HARDWARE DRIVERS ====================

/**
 * Categoria do componente de hardware
 */
export enum HardwareCategory {
    SENSOR = 'sensor',
    ACTUATOR = 'actuator',
    LOGIC = 'logic',
    COMMUNICATION = 'communication',
}

/**
 * Tipo de dado que flui entre nós
 */
export enum DataType {
    NUMBER = 'number',
    STRING = 'string',
    BOOLEAN = 'boolean',
    ANY = 'any',
}

/**
 * Definição de uma porta (handle) de entrada/saída
 */
export interface PortDefinition {
    id: string;
    label: string;
    type: DataType;
    required?: boolean;
}

/**
 * Estrutura do Driver de Hardware
 * Contém todo o código MicroPython necessário para operar o componente
 */
export interface HardwareDriver {
    id: string;
    name: string;
    category: HardwareCategory;
    description: string;
    icon: string; // Nome do ícone Lucide React

    // Portas de dados
    inputs: PortDefinition[];
    outputs: PortDefinition[];

    // Parâmetros configuráveis (aparecerão no Inspector)
    parameters: {
        id: string;
        label: string;
        type: 'number' | 'string' | 'select' | 'boolean';
        default: any;
        options?: { value: string; label: string }[]; // Para tipo 'select'
        min?: number; // Para tipo 'number'
        max?: number;
    }[];

    // Parâmetros dinâmicos que aparecem baseados em conexões de entrada
    dynamicParameters?: {
        inputId: string; // ID da porta de entrada que ativa esses parâmetros
        parameters: {
            id: string;
            label: string;
            type: 'number' | 'string' | 'select' | 'boolean';
            default: any;
            options?: { value: string; label: string }[];
            min?: number;
            max?: number;
        }[];
    }[];

    // Código MicroPython gerado
    code: {
        imports: string[];      // Ex: ["from machine import Pin", "import dht"]
        setupCode: string;      // Código executado uma vez (inicialização)
        loopCode: string;       // Código executado no loop principal
    };
}

// ==================== LOGIC RULES ====================

/**
 * Operadores condicionais para regras lógicas
 */
export enum LogicOperator {
    GREATER_THAN = '>',
    LESS_THAN = '<',
    GREATER_EQUAL = '>=',
    LESS_EQUAL = '<=',
    EQUAL = '==',
    NOT_EQUAL = '!='
}

/**
 * Ações que podem ser executadas quando uma condição é verdadeira
 */
export enum LogicAction {
    TURN_ON = 'TURN_ON',
    TURN_OFF = 'TURN_OFF',
    SET_VALUE = 'SET_VALUE'
}

/**
 * Regra lógica aplicada a um nó atuador
 * Define condições baseadas em dados de sensores conectados
 */
export interface LogicRule {
    sourceId: string;              // ID do nó de origem (sensor)
    sourceType: string;            // Tipo do driver de origem (ex: "temperature_sensor")
    sourceHandle: string;          // ID da porta de saída do sensor (ex: "temperature")
    condition: LogicOperator;      // Operador de comparação
    value: number;                 // Valor de comparação
    action: LogicAction;           // Ação a executar
}

// ==================== HARDWARE PROFILES ====================

/**
 * Tipo de perfil de hardware
 */
export enum HardwareProfileType {
    GENERIC_ESP32 = 'GENERIC_ESP32',
    PION_CANSAT_V1 = 'PION_CANSAT_V1'
}

/**
 * Mapeamento de componente para pino GPIO
 */
export interface PinMapping {
    driverId: string;              // ID do driver (ex: "led_output")
    pin: number;                   // Número do pino GPIO
    label: string;                 // Nome amigável (ex: "LED Status")
    locked: boolean;               // Se true, usuário não pode alterar
}

/**
 * Perfil de hardware pré-configurado
 */
export interface HardwareProfile {
    id: HardwareProfileType;
    name: string;
    description: string;
    pinMappings: PinMapping[];
    allowCustomPins: boolean;      // Se false, apenas pinos do perfil são permitidos
}

// ==================== ORBITA NODES ====================

/**
 * Dados customizados de cada nó no canvas
 */
export interface OrbitaNodeData extends Record<string, unknown> {
    driverId: string;        // ID do driver associado
    label: string;           // Nome exibido no nó
    icon: string;            // Ícone Lucide React
    category: HardwareCategory;
    parameters: Record<string, any>; // Valores dos parâmetros configurados

    // Variáveis geradas no transpile
    outputVariables?: Record<string, string>; // Ex: { temp: "sensor_temp_001" }
    
    // Regras lógicas (apenas para atuadores)
    logicRules?: LogicRule[];
}

/**
 * Tipo do nó customizado para React Flow
 */
export type OrbitaNode = Node<OrbitaNodeData>;

/**
 * Tipo da edge (conexão) customizada
 */
export type OrbitaEdge = Edge;

// ==================== SERIAL COMMUNICATION ====================

/**
 * Status da conexão serial
 */
export enum SerialStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    UPLOADING = 'uploading',
    RUNNING = 'running',
    ERROR = 'error',
}

/**
 * Configuração da porta serial
 */
export interface SerialConfig {
    baudRate: number;
    dataBits: 7 | 8;
    stopBits: 1 | 2;
    parity: 'none' | 'even' | 'odd';
    flowControl: 'none' | 'hardware';
}

/**
 * Mensagem de telemetria recebida do dispositivo
 */
export interface TelemetryMessage {
    timestamp: number;
    type: 'data' | 'log' | 'error';
    content: string;
    parsed?: Record<string, number | string>; // Ex: { temp: 25.3, humidity: 60 }
}

/**
 * Interface para o gerenciador de comunicação serial
 */
export interface ISerialBridge {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    upload(code: string): Promise<void>;
    getStatus(): SerialStatus;
    onTelemetry(callback: (message: TelemetryMessage) => void): void;
    onStatusChange(callback: (status: SerialStatus) => void): void;
}

// ==================== TRANSPILER ====================

/**
 * Resultado da transpilação
 */
export interface TranspileResult {
    success: boolean;
    code?: string;
    errors?: string[];
    warnings?: string[];

    // Metadados
    nodeCount: number;
    variableMap: Record<string, string>; // nodeId -> variableName
}

/**
 * Interface do Transpilador
 */
export interface ITranspiler {
    transpile(nodes: OrbitaNode[], edges: OrbitaEdge[]): TranspileResult;
    validate(nodes: OrbitaNode[], edges: OrbitaEdge[]): { valid: boolean; errors: string[] };
}

// ==================== APPLICATION STATE ====================

/**
 * Estado da aplicação
 */
export interface AppState {
    // Canvas
    nodes: OrbitaNode[];
    edges: OrbitaEdge[];
    selectedNode: OrbitaNode | null;

    // Hardware
    serialStatus: SerialStatus;
    telemetryMessages: TelemetryMessage[];
    lastCode: string | null;
    hardwareProfile: HardwareProfileType; // Perfil de hardware ativo

    // UI
    isInspectorOpen: boolean;
    isConsoleOpen: boolean;
    isMockMode: boolean;
}
