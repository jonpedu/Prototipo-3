import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HardwareModule, BoardConfiguration, BoardPreset, PinConfiguration, ValidationResult } from '../types';

// ============================================================================
// HARDWARE STORE - Gerencia módulos, placas e configuração de pinos
// ============================================================================

interface HardwareState {
    // Estado
    board: BoardConfiguration;
    modules: HardwareModule[];

    // Ações
    setBoard: (preset: BoardPreset) => void;
    addModule: (module: HardwareModule) => void;
    removeModule: (moduleId: string) => void;
    updateModulePins: (moduleId: string, pins: Record<string, number>) => void;
    validatePinConfiguration: () => ValidationResult;
    resetHardware: () => void;
}

// Presets de placas
const ESP32_GENERIC: BoardConfiguration = {
    preset: 'ESP32_GENERIC',
    name: 'ESP32 Genérico',
    description: 'Placa ESP32 padrão com configuração manual de pinos',
    availablePins: [
        // GPIO Digital
        { id: 'gpio2', label: 'GPIO 2', pinNumber: 2, type: 'GPIO', isAssigned: false },
        { id: 'gpio4', label: 'GPIO 4', pinNumber: 4, type: 'GPIO', isAssigned: false },
        { id: 'gpio5', label: 'GPIO 5', pinNumber: 5, type: 'GPIO', isAssigned: false },
        { id: 'gpio12', label: 'GPIO 12', pinNumber: 12, type: 'GPIO', isAssigned: false },
        { id: 'gpio13', label: 'GPIO 13', pinNumber: 13, type: 'GPIO', isAssigned: false },
        { id: 'gpio14', label: 'GPIO 14', pinNumber: 14, type: 'GPIO', isAssigned: false },
        { id: 'gpio15', label: 'GPIO 15', pinNumber: 15, type: 'GPIO', isAssigned: false },
        { id: 'gpio16', label: 'GPIO 16', pinNumber: 16, type: 'GPIO', isAssigned: false },
        { id: 'gpio17', label: 'GPIO 17', pinNumber: 17, type: 'GPIO', isAssigned: false },
        { id: 'gpio18', label: 'GPIO 18', pinNumber: 18, type: 'GPIO', isAssigned: false },
        { id: 'gpio19', label: 'GPIO 19', pinNumber: 19, type: 'GPIO', isAssigned: false },
        { id: 'gpio21', label: 'GPIO 21 (I2C SDA)', pinNumber: 21, type: 'I2C_SDA', isAssigned: false },
        { id: 'gpio22', label: 'GPIO 22 (I2C SCL)', pinNumber: 22, type: 'I2C_SCL', isAssigned: false },
        { id: 'gpio23', label: 'GPIO 23', pinNumber: 23, type: 'GPIO', isAssigned: false },
        { id: 'gpio25', label: 'GPIO 25', pinNumber: 25, type: 'GPIO', isAssigned: false },
        { id: 'gpio26', label: 'GPIO 26', pinNumber: 26, type: 'GPIO', isAssigned: false },
        { id: 'gpio27', label: 'GPIO 27', pinNumber: 27, type: 'GPIO', isAssigned: false },
        { id: 'gpio32', label: 'GPIO 32 (ADC)', pinNumber: 32, type: 'ADC', isAssigned: false },
        { id: 'gpio33', label: 'GPIO 33 (ADC)', pinNumber: 33, type: 'ADC', isAssigned: false },
        { id: 'gpio34', label: 'GPIO 34 (ADC)', pinNumber: 34, type: 'ADC', isAssigned: false },
        { id: 'gpio35', label: 'GPIO 35 (ADC)', pinNumber: 35, type: 'ADC', isAssigned: false },
    ],
};

const PION_LABS_CANSAT: BoardConfiguration = {
    preset: 'PION_LABS_CANSAT',
    name: 'Kit Pion Labs CanSat',
    description: 'Kit comercial com módulos pré-configurados',
    availablePins: [
        { id: 'gpio21', label: 'GPIO 21 (I2C SDA)', pinNumber: 21, type: 'I2C_SDA', isAssigned: true, assignedTo: 'bmp280_preset' },
        { id: 'gpio22', label: 'GPIO 22 (I2C SCL)', pinNumber: 22, type: 'I2C_SCL', isAssigned: true, assignedTo: 'bmp280_preset' },
        { id: 'gpio16', label: 'GPIO 16 (UART TX)', pinNumber: 16, type: 'UART_TX', isAssigned: true, assignedTo: 'gps_preset' },
        { id: 'gpio17', label: 'GPIO 17 (UART RX)', pinNumber: 17, type: 'UART_RX', isAssigned: true, assignedTo: 'gps_preset' },
        { id: 'gpio18', label: 'GPIO 18 (LoRa SCK)', pinNumber: 18, type: 'SPI_SCK', isAssigned: true, assignedTo: 'lora_preset' },
        { id: 'gpio19', label: 'GPIO 19 (LoRa MISO)', pinNumber: 19, type: 'SPI_MISO', isAssigned: true, assignedTo: 'lora_preset' },
        { id: 'gpio23', label: 'GPIO 23 (LoRa MOSI)', pinNumber: 23, type: 'SPI_MOSI', isAssigned: true, assignedTo: 'lora_preset' },
        { id: 'gpio5', label: 'GPIO 5 (LoRa CS)', pinNumber: 5, type: 'SPI_CS', isAssigned: true, assignedTo: 'lora_preset' },
        { id: 'gpio25', label: 'GPIO 25 (Servo)', pinNumber: 25, type: 'PWM', isAssigned: true, assignedTo: 'servo_preset' },
    ],
    preConfiguredModules: [
        {
            id: 'bmp280_preset',
            type: 'BMP280',
            name: 'BMP280 (Pré-configurado)',
            description: 'Sensor de pressão e temperatura',
            icon: '🌡️',
            category: 'sensor',
            requiredPins: { sda: 'I2C_SDA', scl: 'I2C_SCL' },
            assignedPins: { sda: 21, scl: 22 },
            isConfigured: true,
        },
        {
            id: 'gps_preset',
            type: 'GPS_NEO6M',
            name: 'GPS NEO-6M (Pré-configurado)',
            description: 'Módulo GPS',
            icon: '📍',
            category: 'sensor',
            requiredPins: { tx: 'UART_TX', rx: 'UART_RX' },
            assignedPins: { tx: 16, rx: 17 },
            isConfigured: true,
        },
        {
            id: 'lora_preset',
            type: 'LORA_SX127X',
            name: 'LoRa SX127x (Pré-configurado)',
            description: 'Módulo de comunicação LoRa',
            icon: '📡',
            category: 'communication',
            requiredPins: { sck: 'SPI_SCK', miso: 'SPI_MISO', mosi: 'SPI_MOSI', cs: 'SPI_CS' },
            assignedPins: { sck: 18, miso: 19, mosi: 23, cs: 5 },
            isConfigured: true,
        },
        {
            id: 'servo_preset',
            type: 'SERVO',
            name: 'Servo (Pré-configurado)',
            description: 'Servomotor',
            icon: '⚙️',
            category: 'actuator',
            requiredPins: { signal: 'PWM' },
            assignedPins: { signal: 25 },
            isConfigured: true,
        },
    ],
};

export const useHardwareStore = create<HardwareState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            board: ESP32_GENERIC,
            modules: [],

            // Ações
            setBoard: (preset) => {
                const boardConfig = preset === 'PION_LABS_CANSAT' ? PION_LABS_CANSAT : ESP32_GENERIC;
                set({
                    board: boardConfig,
                    modules: boardConfig.preConfiguredModules || [],
                });
            },

            addModule: (module) => {
                set((state) => ({
                    modules: [...state.modules, module],
                }));
            },

            removeModule: (moduleId) => {
                set((state) => {
                    // Liberar pinos atribuídos
                    const moduleToRemove = state.modules.find((m) => m.id === moduleId);
                    const updatedPins = state.board.availablePins.map((pin) =>
                        pin.assignedTo === moduleId
                            ? { ...pin, isAssigned: false, assignedTo: undefined }
                            : pin
                    );

                    return {
                        modules: state.modules.filter((m) => m.id !== moduleId),
                        board: { ...state.board, availablePins: updatedPins },
                    };
                });
            },

            updateModulePins: (moduleId, pins) => {
                set((state) => {
                    const updatedModules = state.modules.map((module) =>
                        module.id === moduleId
                            ? { ...module, assignedPins: pins, isConfigured: true }
                            : module
                    );

                    const updatedPins = state.board.availablePins.map((pin) => {
                        const isUsedByThisModule = Object.values(pins).includes(pin.pinNumber);
                        if (isUsedByThisModule) {
                            return { ...pin, isAssigned: true, assignedTo: moduleId };
                        }
                        return pin.assignedTo === moduleId
                            ? { ...pin, isAssigned: false, assignedTo: undefined }
                            : pin;
                    });

                    return {
                        modules: updatedModules,
                        board: { ...state.board, availablePins: updatedPins },
                    };
                });
            },

            validatePinConfiguration: () => {
                const state = get();
                const errors: any[] = [];
                const warnings: any[] = [];

                // Verificar conflitos de pinos
                const pinUsage = new Map<number, string[]>();
                state.modules.forEach((module) => {
                    if (module.assignedPins) {
                        Object.values(module.assignedPins).forEach((pinNum) => {
                            if (!pinUsage.has(pinNum)) {
                                pinUsage.set(pinNum, []);
                            }
                            pinUsage.get(pinNum)!.push(module.id);
                        });
                    }
                });

                pinUsage.forEach((modules, pinNum) => {
                    if (modules.length > 1) {
                        errors.push({
                            type: 'pin_conflict',
                            message: `Conflito no pino GPIO ${pinNum}: usado por ${modules.length} módulos`,
                            moduleId: modules[0],
                        });
                    }
                });

                // Verificar módulos não configurados
                state.modules.forEach((module) => {
                    if (!module.isConfigured) {
                        errors.push({
                            type: 'missing_configuration',
                            message: `Módulo ${module.name} não está configurado`,
                            moduleId: module.id,
                        });
                    }
                });

                // Avisos sobre módulos não utilizados
                // (Será implementado após integração com Blockly)

                return {
                    isValid: errors.length === 0,
                    errors,
                    warnings,
                };
            },

            resetHardware: () => {
                set({
                    board: ESP32_GENERIC,
                    modules: [],
                });
            },
        }),
        {
            name: 'orbita-hardware-storage',
        }
    )
);
