/**
 * ORBITA - Transpilador Topológico
 * Converte o grafo visual em código MicroPython executável
 * Implementa algoritmo de Topological Sort (Kahn's Algorithm)
 */

import { OrbitaNode, OrbitaEdge, ITranspiler, TranspileResult } from './types';
import { getDriver } from './drivers';

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

        // Valida conexões
        for (const edge of edges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) {
                errors.push(`Conexão inválida: ${edge.source} -> ${edge.target}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Transpila o grafo para código MicroPython
     */
    transpile(nodes: OrbitaNode[], edges: OrbitaEdge[]): TranspileResult {
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

            // 3. Construção do código MicroPython
            const code = this.buildMicroPythonCode(sortedNodes, edges, variableMap);

            return {
                success: true,
                code,
                nodeCount: nodes.length,
                variableMap,
                warnings: []
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
            const condition = `${inputVarName} ${rule.condition} ${rule.value}`;
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
        variableMap: Record<string, string>
    ): string {
        const imports = new Set<string>();
        const setupLines: string[] = [];
        const loopLines: string[] = [];

        sortedNodes.forEach(node => {
            const driver = getDriver(node.data.driverId);
            if (!driver) return;

            const varName = variableMap[node.id];
            const params = node.data.parameters;

            // Coleta imports
            driver.code.imports.forEach(imp => imports.add(imp));

            // Substitui placeholders no código de setup
            let setupCode = driver.code.setupCode
                .replace(/\{\{var_name\}\}/g, varName);

            // Substitui parâmetros
            Object.keys(params).forEach(key => {
                const value = params[key];
                const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                setupCode = setupCode.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), valueStr);
            });

            if (setupCode.trim()) setupLines.push(setupCode);

            // Substitui placeholders no código de loop
            let loopCode = driver.code.loopCode
                .replace(/\{\{var_name\}\}/g, varName);

            // Substitui parâmetros (incluindo dinâmicos)
            Object.keys(params).forEach(key => {
                const value = params[key];
                const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                loopCode = loopCode.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), valueStr);
            });

            // Resolve entradas (conexões de outros nós)
            const connectedInputs = new Set<string>();

            driver.inputs.forEach(input => {
                const incomingEdge = edges.find(e => e.target === node.id && e.targetHandle === input.id);
                if (incomingEdge) {
                    connectedInputs.add(input.id);
                    const sourceNode = sortedNodes.find(n => n.id === incomingEdge.source);
                    if (sourceNode) {
                        const sourceVarName = variableMap[incomingEdge.source];
                        const sourceDriver = getDriver(sourceNode.data.driverId);

                        // Encontra a porta de saída correspondente
                        const sourceOutput = sourceDriver?.outputs.find(o => o.id === incomingEdge.sourceHandle);
                        const inputVarName = sourceOutput
                            ? `${sourceVarName}_${sourceOutput.id}`
                            : sourceVarName;

                        loopCode = loopCode.replace(
                            new RegExp(`\\{\\{input_${input.id}\\}\\}`, 'g'),
                            inputVarName
                        );
                    }
                }
            });

            // Processa blocos condicionais {{#if input_xxx}}...{{/if}}
            // Remove blocos onde a entrada não está conectada
            loopCode = loopCode.replace(/\{\{#if input_(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, inputId, content) => {
                return connectedInputs.has(inputId) ? content.trim() : '';
            });

            // Remove linhas vazias múltiplas
            loopCode = loopCode.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

            // Processa Logic Rules (apenas para atuadores)
            if (node.data.logicRules && node.data.logicRules.length > 0) {
                loopCode = this.applyLogicRules(node, loopCode, sortedNodes, variableMap);
            }

            if (loopCode.trim()) loopLines.push(loopCode);
        });

        // Monta o código final
        const header = `# ================================================
# ORBITA - Código gerado automaticamente
# ${new Date().toISOString()}
# Total de nós: ${sortedNodes.length}
# ================================================
`;

        const importsSection = Array.from(imports).join('\n');
        const setupSection = setupLines.length > 0
            ? `\n# ===== INICIALIZAÇÃO =====\n${setupLines.join('\n')}\n`
            : '';

        const loopSection = `
# ===== LOOP PRINCIPAL =====
while True:
${loopLines.map(line => '    ' + line.split('\n').join('\n    ')).join('\n')}
    time.sleep_ms(50)  # Pequeno delay para evitar sobrecarga
`;

        return header + importsSection + setupSection + loopSection;
    }
}

// Instância singleton para uso global
export const transpiler = new OrbitaTranspiler();
