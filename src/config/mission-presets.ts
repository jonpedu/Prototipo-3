import { OrbitaNode, OrbitaEdge } from '../core/types';
import { getDriver } from '../core/drivers';

export interface MissionPreset {
    id: string;
    name: string;
    description: string;
    nodes: OrbitaNode[];
    edges: OrbitaEdge[];
}

function buildNode(
    id: string,
    driverId: string,
    position: { x: number; y: number },
    options?: { label?: string; parameters?: Record<string, any> }
): OrbitaNode {
    const driver = getDriver(driverId);
    if (!driver) {
        throw new Error(`Driver não encontrado para preset: ${driverId}`);
    }

    const parameters = driver.parameters.reduce<Record<string, any>>((acc, param) => {
        const override = options?.parameters?.[param.id];
        acc[param.id] = override !== undefined ? override : param.default;
        return acc;
    }, {});

    return {
        id,
        type: 'orbitaNode',
        position,
        data: {
            driverId,
            label: options?.label || driver.name,
            icon: driver.icon,
            category: driver.category,
            parameters
        }
    };
}

function buildEdge(
    id: string,
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle: string
): OrbitaEdge {
    return {
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: true
    } as OrbitaEdge;
}

export const missionPresets: MissionPreset[] = [
    {
        id: 'preset-blink-led',
        name: 'Pisca-pisca LED',
        description: 'Sequenciador aciona o LED onboard em ciclo infinito.',
        nodes: [
            buildNode('seq1', 'sequence_timer', { x: 0, y: 80 }, {
                label: 'Sequência LED',
                parameters: {
                    step1_state: true,
                    step1_duration: 600,
                    step2_state: false,
                    step2_duration: 600,
                    step3_state: true,
                    step3_duration: 600,
                    repeat_cycle: true
                }
            }),
            buildNode('led1', 'led_output', { x: 260, y: 80 }, {
                label: 'LED Onboard',
                parameters: {
                    blink_enabled: false
                }
            })
        ],
        edges: [
            buildEdge('e-seq-led', 'seq1', 'state', 'led1', 'input')
        ]
    },
    {
        id: 'preset-beep',
        name: 'Sinal sonoro',
        description: 'Sequência curta envia pulsos para o buzzer.',
        nodes: [
            buildNode('seq2', 'sequence_timer', { x: 0, y: 80 }, {
                label: 'Sequência Buzzer',
                parameters: {
                    step1_state: true,
                    step1_duration: 250,
                    step2_state: false,
                    step2_duration: 450,
                    step3_state: true,
                    step3_duration: 250,
                    repeat_cycle: true
                }
            }),
            buildNode('buzz1', 'buzzer', { x: 260, y: 80 }, {
                label: 'Buzzer',
                parameters: {
                    repeat_enabled: false,
                    tone: 'normal',
                    duration: 200
                }
            })
        ],
        edges: [
            buildEdge('e-seq-buzz', 'seq2', 'state', 'buzz1', 'input')
        ]
    },
    {
        id: 'preset-blink-beep',
        name: 'Pisca + Beep',
        description: 'LED e buzzer alternados para alerta simples.',
        nodes: [
            buildNode('seq3', 'sequence_timer', { x: 0, y: 120 }, {
                label: 'Sequência Alerta',
                parameters: {
                    step1_state: true,
                    step1_duration: 500,
                    step2_state: false,
                    step2_duration: 500,
                    step3_state: true,
                    step3_duration: 500,
                    repeat_cycle: true
                }
            }),
            buildNode('led2', 'led_output', { x: 260, y: 60 }, {
                label: 'LED Alerta'
            }),
            buildNode('buzz2', 'buzzer', { x: 260, y: 180 }, {
                label: 'Buzzer Alerta',
                parameters: {
                    repeat_enabled: false,
                    tone: 'high',
                    duration: 200
                }
            })
        ],
        edges: [
            buildEdge('e-seq-led2', 'seq3', 'state', 'led2', 'input'),
            buildEdge('e-seq-buzz2', 'seq3', 'state', 'buzz2', 'input')
        ]
    }
];
