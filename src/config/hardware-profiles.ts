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
    allowCustomPins: true
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
        // LEDs
        {
            driverId: 'led_output',
            pin: 2,
            label: 'LED Status (D2)',
            locked: true
        },
        {
            driverId: 'led_output',
            pin: 15,
            label: 'LED Indicador (D15)',
            locked: true
        },
        
        // Sensores
        {
            driverId: 'temperature_sensor',
            pin: 4,
            label: 'DHT Sensor (D4)',
            locked: true
        },
        
        // Outros componentes podem usar pinos genéricos
        {
            driverId: 'data_generator',
            pin: 0,
            label: 'Virtual (Sem Pino)',
            locked: false
        },
        {
            driverId: 'print_log',
            pin: 0,
            label: 'Virtual (Sem Pino)',
            locked: false
        },
        {
            driverId: 'comparator',
            pin: 0,
            label: 'Virtual (Sem Pino)',
            locked: false
        },
        {
            driverId: 'threshold',
            pin: 0,
            label: 'Virtual (Sem Pino)',
            locked: false
        }
    ],
    allowCustomPins: false
};

/**
 * Registro de todos os perfis disponíveis
 */
export const HARDWARE_PROFILES: Record<HardwareProfileType, HardwareProfile> = {
    [HardwareProfileType.GENERIC_ESP32]: GENERIC_ESP32,
    [HardwareProfileType.PION_CANSAT_V1]: PION_CANSAT_V1
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
