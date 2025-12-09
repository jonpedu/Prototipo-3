import type { ModuleType, CodeGenerationResult, HardwareModule } from '../types';
import { getRequiredDrivers } from './hardware-drivers';

// ============================================================================
// CODE GENERATOR - Transpila Blockly para MicroPython com injeção de drivers
// ============================================================================

/**
 * Detecta quais módulos de hardware estão sendo usados no código gerado pelo Blockly
 */
export function detectUsedModules(blocklyCode: string, availableModules: HardwareModule[]): ModuleType[] {
    const usedModules: Set<ModuleType> = new Set();

    // Padrões para detectar uso de módulos no código
    const patterns: Record<string, RegExp[]> = {
        BMP280: [/bmp280/i, /read_temperature\(\)/i, /read_pressure\(\)/i, /read_altitude\(\)/i],
        BME280: [/bme280/i, /read_humidity\(\)/i],
        DHT11: [/dht11/i, /DHT11Sensor/i],
        DHT22: [/dht22/i, /DHT22Sensor/i],
        MPU6050: [/mpu6050/i, /read_accel\(\)/i, /read_gyro\(\)/i],
        GPS_NEO6M: [/gps/i, /get_position\(\)/i],
        LORA_SX127X: [/lora/i, /\.send\(/i],
        SD_CARD: [/sd_card/i, /write_file/i, /read_file/i],
        SERVO: [/servo/i, /set_angle\(/i],
        LED: [/led/i, /\.on\(\)/i, /\.off\(\)/i],
        BUZZER: [/buzzer/i, /play_tone/i, /beep\(\)/i],
    };

    // Verificar cada padrão
    Object.entries(patterns).forEach(([moduleType, regexes]) => {
        const isUsed = regexes.some((regex) => regex.test(blocklyCode));
        if (isUsed) {
            usedModules.add(moduleType as ModuleType);
        }
    });

    return Array.from(usedModules);
}

/**
 * Gera a seção de inicialização de hardware
 */
export function generateHardwareInit(modules: HardwareModule[]): string {
    const initLines: string[] = [];
    initLines.push('# ===== Inicialização de Hardware =====');
    initLines.push('from machine import Pin, I2C, UART, SPI, PWM');
    initLines.push('import time');
    initLines.push('');

    // Agrupar módulos por tipo de barramento
    const i2cModules = modules.filter((m) =>
        ['BMP280', 'BME280', 'MPU6050'].includes(m.type)
    );
    const uartModules = modules.filter((m) => m.type === 'GPS_NEO6M');
    const spiModules = modules.filter((m) => ['LORA_SX127X', 'SD_CARD'].includes(m.type));

    // Inicializar I2C (se necessário)
    if (i2cModules.length > 0) {
        const sdaPin = i2cModules[0].assignedPins?.sda || 21;
        const sclPin = i2cModules[0].assignedPins?.scl || 22;
        initLines.push(`i2c = I2C(0, scl=Pin(${sclPin}), sda=Pin(${sdaPin}), freq=400000)`);
        initLines.push('');
    }

    // Inicializar cada módulo
    modules.forEach((module) => {
        const varName = module.id.replace(/[^a-zA-Z0-9]/g, '_');

        switch (module.type) {
            case 'BMP280':
                initLines.push(`${varName} = BMP280(i2c)`);
                break;
            case 'BME280':
                initLines.push(`${varName} = BME280(i2c)`);
                break;
            case 'DHT11':
                initLines.push(
                    `${varName} = DHT11Sensor(${module.assignedPins?.data || 4})`
                );
                break;
            case 'DHT22':
                initLines.push(
                    `${varName} = DHT22Sensor(${module.assignedPins?.data || 4})`
                );
                break;
            case 'MPU6050':
                initLines.push(`${varName} = MPU6050(i2c)`);
                break;
            case 'GPS_NEO6M':
                initLines.push(
                    `${varName} = GPS(${module.assignedPins?.tx || 16}, ${module.assignedPins?.rx || 17})`
                );
                break;
            case 'LORA_SX127X':
                const { sck = 18, miso = 19, mosi = 23, cs = 5 } = module.assignedPins || {};
                initLines.push(`${varName} = LoRa(${sck}, ${miso}, ${mosi}, ${cs})`);
                break;
            case 'SD_CARD':
                const sdPins = module.assignedPins || { sck: 18, miso: 19, mosi: 23, cs: 5 };
                initLines.push(
                    `${varName} = SDCard(${sdPins.sck}, ${sdPins.miso}, ${sdPins.mosi}, ${sdPins.cs})`
                );
                initLines.push(`${varName}.mount()`);
                break;
            case 'SERVO':
                initLines.push(`${varName} = Servo(${module.assignedPins?.signal || 25})`);
                break;
            case 'LED':
                initLines.push(`${varName} = LED(${module.assignedPins?.pin || 2})`);
                break;
            case 'BUZZER':
                initLines.push(`${varName} = Buzzer(${module.assignedPins?.pin || 13})`);
                break;
        }
    });

    initLines.push('');
    return initLines.join('\n');
}

/**
 * Gera o código MicroPython completo (drivers + init + código do usuário)
 */
export function generateMicroPythonCode(
    blocklyGeneratedCode: string,
    modules: HardwareModule[]
): CodeGenerationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // 1. Detectar módulos usados no código
        const usedModuleTypes = detectUsedModules(blocklyGeneratedCode, modules);

        // 2. Validar se todos os módulos usados estão configurados
        const configuredModuleTypes = modules.map((m) => m.type);
        const missingModules = usedModuleTypes.filter(
            (type) => !configuredModuleTypes.includes(type)
        );

        if (missingModules.length > 0) {
            errors.push(
                `Módulos não configurados detectados no código: ${missingModules.join(', ')}`
            );
        }

        // 3. Obter drivers necessários
        const driverCodes = getRequiredDrivers(usedModuleTypes);

        // 4. Gerar seção de inicialização
        const configuredModules = modules.filter((m) =>
            usedModuleTypes.includes(m.type)
        );
        const initCode = generateHardwareInit(configuredModules);

        // 5. Montar código final
        const finalCode = [
            '# ===================================================',
            '# ORBITA - Código gerado automaticamente',
            `# Data: ${new Date().toLocaleString('pt-BR')}`,
            '# ===================================================',
            '',
            '# ===== Drivers de Hardware =====',
            ...driverCodes,
            '',
            initCode,
            '# ===== Código do Usuário =====',
            blocklyGeneratedCode,
            '',
            '# ===== Fim do Código =====',
        ].join('\n');

        // 6. Avisos
        const unusedModules = modules.filter(
            (m) => !usedModuleTypes.includes(m.type)
        );
        if (unusedModules.length > 0) {
            warnings.push(
                `Módulos configurados mas não utilizados: ${unusedModules.map((m) => m.name).join(', ')}`
            );
        }

        return {
            code: finalCode,
            usedModules: usedModuleTypes,
            usedDrivers: driverCodes,
            warnings,
            errors,
        };
    } catch (error) {
        errors.push(`Erro ao gerar código: ${error}`);
        return {
            code: '',
            usedModules: [],
            usedDrivers: [],
            warnings,
            errors,
        };
    }
}

/**
 * Valida sintaxe básica do código Python
 */
export function validatePythonSyntax(code: string): { isValid: boolean; error?: string } {
    // Validação básica - em produção, seria ideal usar um parser Python real
    const lines = code.split('\n');
    const errors: string[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Verificar indentação inconsistente (simplificado)
        if (trimmed && !trimmed.startsWith('#')) {
            const leadingSpaces = line.search(/\S/);
            if (leadingSpaces % 2 !== 0 && leadingSpaces > 0) {
                errors.push(`Linha ${index + 1}: indentação inconsistente`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        error: errors.length > 0 ? errors[0] : undefined,
    };
}
