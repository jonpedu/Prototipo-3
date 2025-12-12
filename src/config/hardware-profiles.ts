/**
 * ORBITA - Hardware Profiles
 * Perfis de hardware pré-configurados para diferentes kits educacionais
 */

import { HardwareProfile, HardwareProfileType } from '../core/types';

/**
 * Perfil Genérico ESP32
 * Todos os pinos são editáveis pelo usuário
 */
export const GENERIC_ESP32: HardwareProfile = {
    id: HardwareProfileType.GENERIC_ESP32,
    name: 'ESP32 Genérico',
    description: 'Perfil padrão com pinos configuráveis manualmente',
    pinMappings: [],
    allowCustomPins: true,
    allowedDrivers: undefined // Todos os drivers disponíveis
};

/**
 * Perfil Pion CanSat V1
 * Baseado no datasheet do kit educacional Pion CanSat
 * Pinos pré-configurados e travados para evitar conflitos
 */
export const PION_CANSAT_V1: HardwareProfile = {
    id: HardwareProfileType.PION_CANSAT_V1,
    name: 'Pion CanSat V1',
    description: 'Kit educacional Pion com pinos pré-configurados',
    pinMappings: [
        // Barramento I2C compartilhado
        { driverId: 'bme280_sensor', pin: 21, label: 'I2C SDA (21/22)', locked: true },
        { driverId: 'sht30_sensor', pin: 21, label: 'I2C SDA (21/22)', locked: true },
        { driverId: 'ccs811_sensor', pin: 21, label: 'I2C SDA (21/22)', locked: true },
        { driverId: 'imu_mpu9250', pin: 21, label: 'I2C SDA (21/22)', locked: true },

        // Analógicos
        { driverId: 'ldr_sensor', pin: 34, label: 'LDR (GPIO34)', locked: true },
        { driverId: 'vbat_sensor', pin: 35, label: 'VBAT (GPIO35)', locked: true },

        // Digital
        { driverId: 'buzzer', pin: 25, label: 'Buzzer (GPIO25)', locked: true },
        { driverId: 'led_output', pin: 2, label: 'LED Onboard (GPIO2)', locked: true },

        // SD Card (CS dedicado)
        { driverId: 'sd_logger', pin: 15, label: 'SD CS (GPIO15)', locked: true },

        // Componentes virtuais
        { driverId: 'data_generator', pin: 0, label: 'Virtual (Sem Pino)', locked: false },
        { driverId: 'print_log', pin: 0, label: 'Virtual (Sem Pino)', locked: false },
        { driverId: 'comparator', pin: 0, label: 'Virtual (Sem Pino)', locked: false },
        { driverId: 'threshold', pin: 0, label: 'Virtual (Sem Pino)', locked: false }
    ],
    allowCustomPins: false,
    allowedDrivers: [
        // Sensores reais do kit
        'bme280_sensor',
        'sht30_sensor',
        'ccs811_sensor',
        'imu_mpu9250',
        'ldr_sensor',
        'vbat_sensor',

        // Atuadores do kit
        'led_output',
        'buzzer',

        // Comunicação/armazenamento
        'sd_logger',

        // Lógica simples
        'sequence_timer',
        'delay_trigger'
    ]
};

/**
 * Perfil CubeSat V1 (placeholder)
 * Pinos liberados para customização, mas lista de componentes restrita ao kit típico CubeSat
 */
export const CUBESAT_V1: HardwareProfile = {
    id: HardwareProfileType.CUBESAT_V1,
    name: 'CubeSat V1',
    description: 'Kit CubeSat com componentes selecionados',
    pinMappings: [
        // Barramento I2C
        { driverId: 'bme280_sensor', pin: 21, label: 'I2C SDA (21/22)', locked: true },
        { driverId: 'sht30_sensor', pin: 21, label: 'I2C SDA (21/22)', locked: true },
        { driverId: 'ccs811_sensor', pin: 21, label: 'I2C SDA (21/22)', locked: true },
        { driverId: 'imu_mpu9250', pin: 21, label: 'I2C SDA (21/22)', locked: true },

        // Analógicos
        { driverId: 'ldr_sensor', pin: 34, label: 'LDR (GPIO34)', locked: true },
        { driverId: 'vbat_sensor', pin: 35, label: 'VBAT (GPIO35)', locked: true },

        // Digital
        { driverId: 'buzzer', pin: 25, label: 'Buzzer (GPIO25)', locked: true },
        { driverId: 'led_output', pin: 2, label: 'LED Onboard (GPIO2)', locked: true },

        // SD Card (VSPI CS dedicado)
        { driverId: 'sd_logger', pin: 5, label: 'SD CS (GPIO5)', locked: true },

        // Componentes virtuais
        { driverId: 'data_generator', pin: 0, label: 'Virtual (Sem Pino)', locked: false },
        { driverId: 'print_log', pin: 0, label: 'Virtual (Sem Pino)', locked: false },
        { driverId: 'comparator', pin: 0, label: 'Virtual (Sem Pino)', locked: false },
        { driverId: 'threshold', pin: 0, label: 'Virtual (Sem Pino)', locked: false }
    ],
    allowCustomPins: false,
    allowedDrivers: [
        'bme280_sensor',
        'sht30_sensor',
        'ccs811_sensor',
        'imu_mpu9250',
        'ldr_sensor',
        'vbat_sensor',
        'led_output',
        'buzzer',
        'sd_logger',

        // Lógica simples
        'sequence_timer',
        'delay_trigger'
    ]
};

/**
 * Registro de todos os perfis disponíveis
 */
export const HARDWARE_PROFILES: Record<HardwareProfileType, HardwareProfile> = {
    [HardwareProfileType.GENERIC_ESP32]: GENERIC_ESP32,
    [HardwareProfileType.PION_CANSAT_V1]: PION_CANSAT_V1,
    [HardwareProfileType.CUBESAT_V1]: CUBESAT_V1
};

/**
 * Obtém um perfil de hardware pelo ID
 */
export function getHardwareProfile(profileType: HardwareProfileType): HardwareProfile {
    return HARDWARE_PROFILES[profileType];
}

/**
 * Lista todos os perfis disponíveis
 */
export function getAllHardwareProfiles(): HardwareProfile[] {
    return Object.values(HARDWARE_PROFILES);
}

/**
 * Obtém o mapeamento de pino para um driver específico em um perfil
 */
export function getPinMapping(
    profileType: HardwareProfileType,
    driverId: string
): number | null {
    const profile = getHardwareProfile(profileType);
    const mapping = profile.pinMappings.find(m => m.driverId === driverId);
    return mapping ? mapping.pin : null;
}

/**
 * Verifica se um pino está travado no perfil
 */
export function isPinLocked(
    profileType: HardwareProfileType,
    driverId: string
): boolean {
    const profile = getHardwareProfile(profileType);
    if (profile.allowCustomPins) return false;

    const mapping = profile.pinMappings.find(m => m.driverId === driverId);
    return mapping ? mapping.locked : false;
}

/**
 * Obtém o label amigável para um pino no perfil
 */
export function getPinLabel(
    profileType: HardwareProfileType,
    driverId: string
): string | null {
    const profile = getHardwareProfile(profileType);
    const mapping = profile.pinMappings.find(m => m.driverId === driverId);
    return mapping ? mapping.label : null;
}
