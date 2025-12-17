/**
 * ORBITA - Transpilador Topológico
 * Converte o grafo visual em código MicroPython executável
 * Implementa algoritmo de Topological Sort (Kahn's Algorithm)
 */

import { OrbitaNode, OrbitaEdge, ITranspiler, TranspileResult, HardwareProfileType, DataType, HardwareDriver } from './types';
import { getDriver } from './drivers';
import { getHardwareProfile } from '../config/hardware-profiles';

class GeneratorState {
    private readonly imports = new Set<string>(['import time']);
    private readonly setup: string[] = [];
    private readonly loop: string[] = [];
    private readonly nodeCount: number;

    constructor(nodeCount: number) {
        this.nodeCount = nodeCount;
    }

    addImport(value: string | string[]) {
        const list = Array.isArray(value) ? value : [value];
        list.forEach(item => this.imports.add(item));
    }

    addSetup(line: string) {
        if (line.trim()) this.setup.push(line.trim());
    }

    addLoop(line: string) {
        if (line.trim()) this.loop.push(line.trim());
    }

    emit(): string {
        const header = `# ================================================
# ORBITA - Código gerado automaticamente
# ${new Date().toISOString()}
# Total de nós: ${this.nodeCount}
# ================================================
`;

        const fromImports = new Map<string, Set<string>>();
        const plainImports: string[] = [];

        this.imports.forEach(imp => {
            const match = imp.match(/^from\s+([^\s]+)\s+import\s+(.+)$/);
            if (match) {
                const mod = match[1];
                const names = match[2].split(',').map(s => s.trim());
                if (!fromImports.has(mod)) fromImports.set(mod, new Set());
                names.forEach(n => fromImports.get(mod)!.add(n));
            } else {
                plainImports.push(imp);
            }
        });

        const mergedFromImports = Array.from(fromImports.entries())
            .map(([mod, names]) => `from ${mod} import ${Array.from(names).sort().join(', ')}`);

        const importsSection = [...plainImports.sort(), ...mergedFromImports.sort()].join('\n');
        const setupSection = this.setup.length > 0
            ? `\n# ===== INICIALIZAÇÃO =====\n${this.setup.join('\n')}\n`
            : '';

        const loopSection = `
# ===== LOOP PRINCIPAL =====
while True:
${this.loop.map(line => '    ' + line.split('\n').join('\n    ')).join('\n')}
    time.sleep_ms(50)  # Pequeno delay para evitar sobrecarga
`;

        return header + importsSection + setupSection + loopSection;
    }
}

export class OrbitaTranspiler implements ITranspiler {

    /**
     * Valida o grafo antes da transpilação
     */
    validate(nodes: OrbitaNode[], edges: OrbitaEdge[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (nodes.length === 0) {
            errors.push('O canvas está vazio. Adicione ao menos um componente.');
            return { valid: false, errors };
        }

        // Verifica ciclos (grafos cíclicos não podem ser ordenados topologicamente)
        if (this.hasCycle(nodes, edges)) {
            errors.push('ERRO: O fluxo contém um ciclo (loop infinito). Remova conexões circulares.');
        }

        // Valida drivers
        for (const node of nodes) {
            const driver = getDriver(node.data.driverId);
            if (!driver) {
                errors.push(`Nó "${node.data.label}" usa um driver desconhecido: ${node.data.driverId}`);
            }
        }

        // Valida conexões e handles
        for (const edge of edges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) {
                errors.push(`Conexão inválida: ${edge.source} -> ${edge.target}`);
                continue;
            }

            const sourceDriver = getDriver(sourceNode.data.driverId);
            const targetDriver = getDriver(targetNode.data.driverId);

            if (sourceDriver) {
                const hasHandle = sourceDriver.outputs.some(o => o.id === edge.sourceHandle);
                if (!hasHandle) {
                    errors.push(`Saída "${edge.sourceHandle}" inexistente em "${sourceNode.data.label}" (${sourceDriver.name}).`);
                }
            }

            if (targetDriver) {
                const hasHandle = targetDriver.inputs.some(i => i.id === edge.targetHandle);
                if (!hasHandle) {
                    errors.push(`Entrada "${edge.targetHandle}" inexistente em "${targetNode.data.label}" (${targetDriver.name}).`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Transpila o grafo para código MicroPython
     */
    transpile(nodes: OrbitaNode[], edges: OrbitaEdge[], profile: HardwareProfileType): TranspileResult {
        const validation = this.validate(nodes, edges);
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors,
                nodeCount: nodes.length,
                variableMap: {}
            };
        }

        try {
            // 1. Ordenação Topológica
            const sortedNodes = this.topologicalSort(nodes, edges);

            // 2. Geração de nomes de variáveis semânticos
            const variableMap = this.generateVariableNames(sortedNodes);

            const warnings: string[] = [];

            // 3. Construção do código MicroPython
            const code = this.buildMicroPythonCode(sortedNodes, edges, variableMap, profile, warnings);

            return {
                success: true,
                code,
                nodeCount: nodes.length,
                variableMap,
                warnings
            };
        } catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Erro desconhecido na transpilação'],
                nodeCount: nodes.length,
                variableMap: {}
            };
        }
    }

    /**
     * Algoritmo de Kahn para ordenação topológica
     * Garante que nós sem dependências sejam processados primeiro
     */
    private topologicalSort(nodes: OrbitaNode[], edges: OrbitaEdge[]): OrbitaNode[] {
        // Calcula grau de entrada (in-degree) de cada nó
        const inDegree = new Map<string, number>();
        const adjacencyList = new Map<string, string[]>();

        nodes.forEach(node => {
            inDegree.set(node.id, 0);
            adjacencyList.set(node.id, []);
        });

        edges.forEach(edge => {
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
            adjacencyList.get(edge.source)?.push(edge.target);
        });

        // Fila com nós sem dependências (in-degree = 0)
        const queue: string[] = [];
        inDegree.forEach((degree, nodeId) => {
            if (degree === 0) queue.push(nodeId);
        });

        // Processa a fila
        const sorted: OrbitaNode[] = [];
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            const node = nodes.find(n => n.id === nodeId)!;
            sorted.push(node);

            // Reduz in-degree dos vizinhos
            adjacencyList.get(nodeId)?.forEach(neighborId => {
                const newDegree = (inDegree.get(neighborId) || 0) - 1;
                inDegree.set(neighborId, newDegree);
                if (newDegree === 0) queue.push(neighborId);
            });
        }

        if (sorted.length !== nodes.length) {
            throw new Error('Falha na ordenação topológica (possível ciclo não detectado)');
        }

        return sorted;
    }

    /**
     * Detecta ciclos no grafo usando DFS
     */
    private hasCycle(nodes: OrbitaNode[], edges: OrbitaEdge[]): boolean {
        const adjacencyList = new Map<string, string[]>();
        nodes.forEach(node => adjacencyList.set(node.id, []));
        edges.forEach(edge => adjacencyList.get(edge.source)?.push(edge.target));

        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            for (const neighbor of adjacencyList.get(nodeId) || []) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor)) return true;
                } else if (recursionStack.has(neighbor)) {
                    return true; // Ciclo detectado
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                if (dfs(node.id)) return true;
            }
        }

        return false;
    }

    /**
     * Gera nomes de variáveis semânticos
     * Ex: "temp_sensor_001", "led_output_002"
     */
    private generateVariableNames(nodes: OrbitaNode[]): Record<string, string> {
        const variableMap: Record<string, string> = {};
        const counter = new Map<string, number>();

        nodes.forEach(node => {
            const driver = getDriver(node.data.driverId);
            if (!driver) return;

            const baseName = driver.id.replace(/_/g, '_');
            const count = (counter.get(baseName) || 0) + 1;
            counter.set(baseName, count);

            variableMap[node.id] = `${baseName}_${String(count).padStart(3, '0')}`;
        });

        return variableMap;
    }

    private toPythonLiteral(value: any): string {
        if (value === undefined || value === null) return 'None';
        if (typeof value === 'boolean') return value ? 'True' : 'False';
        if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
        if (typeof value === 'string') return JSON.stringify(value);
        return JSON.stringify(value);
    }

    private defaultLiteralForType(type: DataType): string {
        switch (type) {
            case DataType.BOOLEAN:
                return 'False';
            case DataType.NUMBER:
                return '0';
            case DataType.STRING:
                return '""';
            case DataType.ANY:
            default:
                return 'None';
        }
    }

    /**
     * Aplica regras lógicas a um nó atuador
     * Gera código condicional baseado nas regras definidas
     */
    private applyLogicRules(
        node: OrbitaNode,
        loopCode: string,
        sortedNodes: OrbitaNode[],
        variableMap: Record<string, string>
    ): string {
        const logicRules = node.data.logicRules;
        if (!logicRules || logicRules.length === 0) return loopCode;

        // Gera código de lógica condicional
        const logicConditions: string[] = [];

        for (const rule of logicRules) {
            // Encontra o nó de origem
            const sourceNode = sortedNodes.find(n => n.id === rule.sourceId);
            if (!sourceNode) continue;

            const sourceVarName = variableMap[rule.sourceId];
            const sourceDriver = getDriver(sourceNode.data.driverId);
            if (!sourceDriver) continue;

            // Encontra a porta de saída correspondente
            const sourceOutput = sourceDriver.outputs.find(o => o.id === rule.sourceHandle);
            const inputVarName = sourceOutput
                ? `${sourceVarName}_${sourceOutput.id}`
                : sourceVarName;

            // Gera a condição
            const condition = `${inputVarName} ${rule.condition} ${this.toPythonLiteral(rule.value)}`;
            logicConditions.push(condition);
        }

        if (logicConditions.length === 0) return loopCode;

        // Substitui o código do loop com lógica condicional
        // Envolve o código original em blocos if/else baseados nas regras
        const combinedCondition = logicConditions.join(' or ');

        const wrappedCode = `
# Lógica condicional baseada em regras
if ${combinedCondition}:
    ${loopCode.split('\n').join('\n    ')}
`.trim();

        return wrappedCode;
    }

    /**
     * Constrói o código MicroPython final
     */
    private buildMicroPythonCode(
        sortedNodes: OrbitaNode[],
        edges: OrbitaEdge[],
        variableMap: Record<string, string>,
        profile: HardwareProfileType,
        warnings: string[]
    ): string {
        const profileInfo = getHardwareProfile(profile);
        const gen = new GeneratorState(sortedNodes.length);

        sortedNodes.forEach(node => {
            const driver = getDriver(node.data.driverId);
            if (!driver) return;

            const varName = variableMap[node.id];
            const params = this.mergeParamsWithDefaults(driver, node.data.parameters || {});

            this.applyActionsToParams(node, params);

            // Validação de entradas e tipos
            driver.inputs.forEach(input => {
                const incomingEdge = edges.find(e => e.target === node.id && e.targetHandle === input.id);
                if (!incomingEdge) {
                    warnings.push(`Entrada "${input.label}" do componente "${node.data.label}" não está conectada.`);
                } else {
                    const sourceNode = sortedNodes.find(n => n.id === incomingEdge.source);
                    const sourceDriver = sourceNode ? getDriver(sourceNode.data.driverId) : undefined;
                    const sourceOutput = sourceDriver?.outputs.find(o => o.id === incomingEdge.sourceHandle);
                    if (sourceOutput && input.type !== sourceOutput.type && input.type !== DataType.ANY && sourceOutput.type !== DataType.ANY) {
                        warnings.push(`Tipo incompatível: "${sourceOutput.label}" (${sourceOutput.type}) -> "${input.label}" (${input.type}) em "${node.data.label}".`);
                    }
                }
            });

            // Mapeamento de pinos do perfil
            profileInfo.pinMappings
                .filter(m => m.driverId === driver.id)
                .forEach(mapping => {
                    const targetParam = mapping.parameterId || 'pin';
                    if (targetParam in params) {
                        const currentVal = params[targetParam];
                        if (!profileInfo.allowCustomPins && currentVal !== undefined && currentVal !== mapping.pin) {
                            throw new Error(`Perfil ${profileInfo.name} trava ${targetParam}=${mapping.pin} para ${driver.name}, mas foi configurado ${currentVal}.`);
                        }
                        params[targetParam] = mapping.pin;
                    }
                });

            gen.addImport(driver.code.imports);

            const paramLiterals: Record<string, string> = {};
            Object.keys(params).forEach(key => {
                paramLiterals[key] = this.toPythonLiteral(params[key]);
            });

            // Setup
            let setupCode = this.replacePlaceholders(driver.code.setupCode, {
                var_name: varName,
                ...paramLiterals
            });
            setupCode = this.processConditionals(setupCode, key => this.isTruthyPlaceholder(key, paramLiterals, new Set(), {}));
            this.ensureNoUnresolvedPlaceholders(setupCode, driver, node);
            gen.addSetup(setupCode);

            // Loop
            const connectedInputs = new Set<string>();
            const inputLiterals: Record<string, string> = {};

            driver.inputs.forEach(input => {
                const incomingEdge = edges.find(e => e.target === node.id && e.targetHandle === input.id);
                if (incomingEdge) {
                    connectedInputs.add(input.id);
                    const sourceNode = sortedNodes.find(n => n.id === incomingEdge.source);
                    if (sourceNode) {
                        const sourceVarName = variableMap[incomingEdge.source];
                        const sourceDriver = getDriver(sourceNode.data.driverId);
                        const sourceOutput = sourceDriver?.outputs.find(o => o.id === incomingEdge.sourceHandle);
                        const inputVarName = sourceOutput ? `${sourceVarName}_${sourceOutput.id}` : sourceVarName;
                        inputLiterals[`input_${input.id}`] = inputVarName;
                    }
                } else {
                    inputLiterals[`input_${input.id}`] = this.defaultLiteralForType(input.type);
                }
            });

            let loopCode = this.replacePlaceholders(driver.code.loopCode, {
                var_name: varName,
                ...paramLiterals,
                ...inputLiterals
            });

            loopCode = this.processConditionals(
                loopCode,
                key => this.isTruthyPlaceholder(key, paramLiterals, connectedInputs, inputLiterals)
            );

            loopCode = loopCode.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

            if (node.data.logicRules && node.data.logicRules.length > 0) {
                loopCode = this.applyLogicRules(node, loopCode, sortedNodes, variableMap);
            }

            this.ensureNoUnresolvedPlaceholders(loopCode, driver, node);
            if (loopCode.trim()) gen.addLoop(loopCode);
        });

        return gen.emit();
    }

    private mergeParamsWithDefaults(driver: HardwareDriver, nodeParams: Record<string, any>): Record<string, any> {
        const merged: Record<string, any> = {};

        (driver.parameters || []).forEach(param => {
            if (param.default !== undefined) {
                merged[param.id] = param.default;
            }
        });

        Object.keys(nodeParams || {}).forEach(key => {
            merged[key] = nodeParams[key];
        });

        (driver.parameters || []).forEach(param => {
            if (merged[param.id] === undefined && param.default === undefined) {
                throw new Error(`Parâmetro obrigatório ausente para ${driver.name}: ${param.id}`);
            }
        });

        return merged;
    }

    private replacePlaceholders(template: string, values: Record<string, string>): string {
        let result = template || '';
        Object.entries(values).forEach(([key, val]) => {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
        });
        return result;
    }

    private processConditionals(template: string, isTruthy: (key: string) => boolean): string {
        return (template || '').replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, key, content) => {
            return isTruthy(key.trim()) ? content.trim() : '';
        });
    }

    private isTruthyPlaceholder(
        key: string,
        paramLiterals: Record<string, string>,
        connectedInputs: Set<string>,
        inputLiterals: Record<string, string>
    ): boolean {
        if (key.startsWith('input_')) {
            return connectedInputs.has(key.replace('input_', ''));
        }
        if (paramLiterals[key] !== undefined) {
            const val = paramLiterals[key];
            return !['False', 'None', '0', '""', "''", '[]', '{}'].includes(val);
        }
        if (inputLiterals[key] !== undefined) return true;
        return false;
    }

    private ensureNoUnresolvedPlaceholders(code: string, driver: HardwareDriver, node: OrbitaNode) {
        const leftovers = (code.match(/\{\{[^}]+\}\}/g) || []).filter(p => !p.startsWith('{{/'));
        if (leftovers.length > 0) {
            throw new Error(`Placeholders não resolvidos em ${driver.name} (${node.data.label}): ${leftovers.join(', ')}`);
        }
    }

    /**
     * Ajusta parametros de atuadores baseados nas acoes anexadas
     * para que o codigo gerado reflita os comportamentos escolhidos.
     */
    private applyActionsToParams(node: OrbitaNode, params: Record<string, any>) {
        const actions = node.data.actions || [];

        if (node.data.driverId === 'led_output') {
            // Defaults neutros
            params.blink_enabled = false;
            params.blink_count_enabled = false;
            params.action_white_mode = 'none';
            params.action_white_state = false;
            params.value_operator = params.value_operator || '>';
            params.value_threshold = params.value_threshold ?? 0;

            const colorMap: Record<string, number> = {
                red: 1,
                green: 2,
                blue: 3,
                white: 4,
                magenta: 5,
                cyan: 4,
                yellow: 4,
                off: 0
            };

            actions.forEach(action => {
                switch (action.type) {
                    case 'led_blink': {
                        params.led_type = 'white';
                        params.blink_enabled = true;
                        params.blink_interval = action.config.interval ?? 500;
                        params.blink_duty = 100;
                        params.blink_count_enabled = action.config.count_enabled ?? false;
                        params.blink_count = action.config.count ?? 5;
                        break;
                    }
                    case 'led_fixed_white': {
                        params.led_type = 'white';
                        params.action_white_mode = 'fixed';
                        params.action_white_state = action.config.state === 'on';
                        params.blink_enabled = false;
                        params.blink_count_enabled = false;
                        break;
                    }
                    case 'led_fixed_rgb': {
                        params.led_type = 'rgb';
                        const color = action.config.preset as string;
                        params.preset_color = colorMap[color] ?? 0;
                        break;
                    }
                    case 'led_alert': {
                        params.value_operator = action.config.operator ?? '>';
                        params.value_threshold = action.config.threshold ?? 30;
                        params.led_type = params.led_type || 'white';
                        break;
                    }
                    default:
                        break;
                }
            });
        }

        if (node.data.driverId === 'buzzer') {
            // Defaults neutros
            params.repeat_enabled = false;
            params.repeat_count_enabled = false;

            actions.forEach(action => {
                switch (action.type) {
                    case 'buzzer_beep': {
                        params.tone = action.config.tone ?? 'normal';
                        params.duration = action.config.duration ?? 300;
                        // Usa mecanismo de repeticao para tocar uma vez quando sem entradas
                        params.repeat_enabled = true;
                        params.repeat_interval = 1000;
                        params.repeat_count_enabled = true;
                        params.repeat_count = 1;
                        break;
                    }
                    case 'buzzer_pattern': {
                        params.tone = action.config.tone ?? 'high';
                        params.duration = action.config.duration ?? 200;
                        params.repeat_enabled = true;
                        params.repeat_interval = action.config.interval ?? 400;
                        params.repeat_count_enabled = true;
                        params.repeat_count = action.config.count ?? 3;
                        break;
                    }
                    case 'buzzer_alert': {
                        params.value_operator = action.config.operator ?? '>';
                        params.value_threshold = action.config.threshold ?? 50;
                        params.repeat_enabled = true;
                        params.repeat_interval = action.config.cooldown ?? 1000;
                        params.repeat_count_enabled = false;
                        break;
                    }
                    default:
                        break;
                }
            });
        }
    }
}

// Instância singleton para uso global
export const transpiler = new OrbitaTranspiler();
