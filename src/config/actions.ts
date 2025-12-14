/**
 * ORBITA - Actions Catalog
 * Definicao de acoes prontas para atuadores (LED, buzzer)
 */

import { ActionDefinition } from '../core/types';

export const ACTION_DEFINITIONS: ActionDefinition[] = [
    {
        id: 'led_blink',
        label: 'Piscar Periodico',
        description: 'Pisca o LED em intervalo controlado com duty cycle e quantidade opcional.',
        driverIds: ['led_output'],
        fields: [
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 500, min: 50, max: 5000 },
            { id: 'duty', label: 'Duty (%)', type: 'number', default: 50, min: 1, max: 99 },
            { id: 'count_enabled', label: 'Limitar quantidade', type: 'boolean', default: false },
            { id: 'count', label: 'Piscadas', type: 'number', default: 5, min: 1, max: 200 }
        ]
    },
    {
        id: 'led_fixed_white',
        label: 'LED Branco Fixo',
        description: 'Mantém o LED branco ligado em brilho máximo.',
        driverIds: ['led_output'],
        fields: [
            {
                id: 'state', label: 'Estado', type: 'select', default: 'on', options: [
                    { value: 'on', label: 'Ligado' },
                    { value: 'off', label: 'Desligado' }
                ]
            }
        ]
    },
    {
        id: 'led_fixed_rgb',
        label: 'Cor Fixa (RGB)',
        description: 'Define uma cor fixa (brilho máximo) para LEDs RGB.',
        driverIds: ['led_output'],
        fields: [
            {
                id: 'preset', label: 'Cor', type: 'select', default: 'cyan', options: [
                    { value: 'red', label: 'Vermelho' },
                    { value: 'green', label: 'Verde' },
                    { value: 'blue', label: 'Azul' },
                    { value: 'cyan', label: 'Ciano' },
                    { value: 'magenta', label: 'Magenta' },
                    { value: 'yellow', label: 'Amarelo' },
                    { value: 'white', label: 'Branco' }
                ]
            }
        ]
    },
    {
        id: 'led_alert',
        label: 'Alerta Condicionado',
        description: 'Alerta quando uma condicao de sensor for atingida.',
        driverIds: ['led_output'],
        fields: [
            {
                id: 'operator', label: 'Operador', type: 'select', default: '>', options: [
                    { value: '>', label: 'Maior que' },
                    { value: '<', label: 'Menor que' },
                    { value: '>=', label: 'Maior ou igual' },
                    { value: '<=', label: 'Menor ou igual' }
                ]
            },
            { id: 'threshold', label: 'Limite', type: 'number', default: 30, min: -100, max: 200 },
            {
                id: 'color', label: 'Cor do alerta', type: 'select', default: 'red', options: [
                    { value: 'red', label: 'Vermelho' },
                    { value: 'orange', label: 'Laranja' },
                    { value: 'white', label: 'Branco' }
                ]
            }
        ]
    },
    {
        id: 'buzzer_beep',
        label: 'Beep Simples',
        description: 'Emite um beep unico com tom e duracao configuraveis.',
        driverIds: ['buzzer'],
        fields: [
            {
                id: 'tone',
                label: 'Tom',
                type: 'select',
                default: 'normal',
                options: [
                    { value: 'very_high', label: 'Muito agudo' },
                    { value: 'high', label: 'Agudo' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Grave' },
                    { value: 'very_low', label: 'Muito grave' }
                ]
            },
            { id: 'duration', label: 'Duracao (ms)', type: 'number', default: 300, min: 50, max: 2000 }
        ]
    },
    {
        id: 'buzzer_pattern',
        label: 'Beep Repetitivo',
        description: 'Sequencia de beeps com intervalo e quantidade.',
        driverIds: ['buzzer'],
        fields: [
            {
                id: 'tone',
                label: 'Tom',
                type: 'select',
                default: 'high',
                options: [
                    { value: 'very_high', label: 'Muito agudo' },
                    { value: 'high', label: 'Agudo' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Grave' },
                    { value: 'very_low', label: 'Muito grave' }
                ]
            },
            { id: 'duration', label: 'Duracao (ms)', type: 'number', default: 200, min: 50, max: 2000 },
            { id: 'interval', label: 'Intervalo (ms)', type: 'number', default: 400, min: 50, max: 5000 },
            { id: 'count', label: 'Repeticoes', type: 'number', default: 3, min: 1, max: 50 }
        ]
    },
    {
        id: 'buzzer_alert',
        label: 'Alerta Condicionado',
        description: 'Dispara alerta sonoro quando a condicao configurada acontecer.',
        driverIds: ['buzzer'],
        fields: [
            {
                id: 'operator', label: 'Operador', type: 'select', default: '>', options: [
                    { value: '>', label: 'Maior que' },
                    { value: '<', label: 'Menor que' },
                    { value: '>=', label: 'Maior ou igual' },
                    { value: '<=', label: 'Menor ou igual' }
                ]
            },
            { id: 'threshold', label: 'Limite', type: 'number', default: 50, min: -100, max: 200 },
            { id: 'cooldown', label: 'Intervalo entre alertas (ms)', type: 'number', default: 1000, min: 200, max: 10000 }
        ]
    }
];

export const getActionDefinition = (actionId: string) =>
    ACTION_DEFINITIONS.find(action => action.id === actionId);

export const getActionsForDriver = (driverId: string) =>
    ACTION_DEFINITIONS.filter(action => action.driverIds.includes(driverId));
