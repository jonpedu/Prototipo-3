/**
 * ORBITA - Painel de Acoes
 * Lista de acoes disponiveis para o atuador selecionado
 */

import React from 'react';
import { useOrbitaStore } from '../../store/useStore';
import { getActionsForDriver } from '../../config/actions';
import { Sparkles, GripVertical, Plus } from 'lucide-react';
import { HardwareCategory } from '../../core/types';

export const ActionPanel: React.FC = () => {
    const {
        selectedNode,
        addActionToNode,
        selectAction,
        selectedActionId
    } = useOrbitaStore();

    if (!selectedNode || selectedNode.data.category !== HardwareCategory.ACTUATOR) return null;

    const availableActions = getActionsForDriver(selectedNode.data.driverId);
    const attachedActions = selectedNode.data.actions || [];

    const handleAdd = (actionId: string) => {
        addActionToNode(selectedNode.id, actionId);
    };

    const handleDragStart = (event: React.DragEvent, actionId: string) => {
        event.dataTransfer.setData('application/orbita-action', actionId);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="h-64 bg-gray-950 border-t border-gray-800 overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-200">Acoes para {selectedNode.data.label}</h3>
                    <p className="text-xs text-gray-500">Arraste ou clique para anexar ao componente.</p>
                </div>
                {attachedActions.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span>{attachedActions.length} acoes aplicadas</span>
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-y-auto px-4 py-3">
                {availableActions.length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhuma acao predefinida para este componente.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {availableActions.map(action => {
                            const isSelected = attachedActions.some(a => a.type === action.id && a.id === selectedActionId);

                            return (
                                <div
                                    key={action.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, action.id)}
                                    onClick={() => selectAction(null)}
                                    className={`bg-gray-900/70 border border-gray-800 rounded-lg p-3 shadow-sm cursor-grab hover:border-blue-500 transition-colors ${isSelected ? 'border-blue-500' : ''}`}
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <GripVertical className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-100">{action.label}</h4>
                                            <p className="text-xs text-gray-500 leading-snug">{action.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAdd(action.id);
                                        }}
                                        className="flex items-center gap-2 text-xs text-blue-200 hover:text-white"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Anexar ao componente
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {attachedActions.length > 0 && (
                    <div className="mt-4">
                        <div className="text-xs text-gray-400 mb-2">Aplicadas:</div>
                        <div className="flex flex-wrap gap-2">
                            {attachedActions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => selectAction(action.id)}
                                    className={`px-3 py-1 rounded-full text-xs border ${selectedActionId === action.id ? 'border-blue-500 text-blue-200 bg-blue-500/10' : 'border-gray-700 text-gray-300 bg-gray-800/80'}`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
