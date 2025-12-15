/**
 * ORBITA - Aplicação Principal
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Toolbar } from './components/layout/Toolbar';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { Inspector } from './components/layout/Inspector';
import { Console } from './components/layout/Console';
import { ActionPanel } from './components/layout/ActionPanel';
import { useOrbitaStore } from './store/useStore';
import { HardwareCategory } from './core/types';

const App: React.FC = () => {
    const { selectedNode } = useOrbitaStore();
    const showActions = selectedNode?.data.category === HardwareCategory.ACTUATOR;

    // Layout states with persistence
    const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem('layout.sidebarWidth')) || 280);
    const [inspectorWidth, setInspectorWidth] = useState(() => Number(localStorage.getItem('layout.inspectorWidth')) || 340);
    const [bottomHeight, setBottomHeight] = useState(() => Number(localStorage.getItem('layout.bottomHeight')) || 260);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('layout.sidebarCollapsed') === 'true');
    const [isInspectorCollapsed, setInspectorCollapsed] = useState(() => localStorage.getItem('layout.inspectorCollapsed') === 'true');
    const [isBottomCollapsed, setBottomCollapsed] = useState(() => localStorage.getItem('layout.bottomCollapsed') === 'true');
    const [activeBottomTab, setActiveBottomTab] = useState<'console' | 'actions'>('console');

    useEffect(() => {
        localStorage.setItem('layout.sidebarWidth', String(sidebarWidth));
        localStorage.setItem('layout.inspectorWidth', String(inspectorWidth));
        localStorage.setItem('layout.bottomHeight', String(bottomHeight));
        localStorage.setItem('layout.sidebarCollapsed', String(isSidebarCollapsed));
        localStorage.setItem('layout.inspectorCollapsed', String(isInspectorCollapsed));
        localStorage.setItem('layout.bottomCollapsed', String(isBottomCollapsed));
    }, [sidebarWidth, inspectorWidth, bottomHeight, isSidebarCollapsed, isInspectorCollapsed, isBottomCollapsed]);

    useEffect(() => {
        if (showActions) {
            setActiveBottomTab('actions');
            setBottomCollapsed(false);
        }
    }, [showActions]);

    const startDrag = useCallback((event: React.MouseEvent, type: 'sidebar' | 'inspector' | 'bottom') => {
        event.preventDefault();
        const startX = event.clientX;
        const startY = event.clientY;
        const startSidebar = sidebarWidth;
        const startInspector = inspectorWidth;
        const startBottom = bottomHeight;

        const onMouseMove = (e: MouseEvent) => {
            if (type === 'sidebar') {
                const next = Math.min(Math.max(220, startSidebar + (e.clientX - startX)), 420);
                setSidebarWidth(next);
                setSidebarCollapsed(false);
            }
            if (type === 'inspector') {
                const next = Math.min(Math.max(280, startInspector - (e.clientX - startX)), 420);
                setInspectorWidth(next);
                setInspectorCollapsed(false);
            }
            if (type === 'bottom') {
                const delta = startY - e.clientY;
                const next = Math.min(Math.max(180, startBottom + delta), 480);
                setBottomHeight(next);
                setBottomCollapsed(false);
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [sidebarWidth, inspectorWidth, bottomHeight]);

    const bottomTabs = useMemo(() => {
        const tabs: Array<{ id: 'console' | 'actions'; label: string; enabled: boolean }> = [
            { id: 'console', label: 'Console', enabled: true },
            { id: 'actions', label: 'Ações', enabled: showActions }
        ];
        return tabs.filter(t => t.enabled);
    }, [showActions]);

    return (
        <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
            {/* Toolbar */}
            <Toolbar />

            {/* Main Content */}
            <div className="flex-grow flex overflow-hidden">
                {/* Sidebar */}
                <div
                    className={`relative h-full ${isSidebarCollapsed ? 'w-10' : ''}`}
                    style={!isSidebarCollapsed ? { width: sidebarWidth } : undefined}
                >
                    {!isSidebarCollapsed && <Sidebar onCollapse={() => setSidebarCollapsed(true)} />}
                    {isSidebarCollapsed && (
                        <div
                            className="h-full w-full flex items-center justify-center text-gray-400 text-xs rotate-90 hover:text-gray-200 cursor-pointer"
                            onClick={() => setSidebarCollapsed(false)}
                            title="Restaurar componentes"
                        >
                            Componentes
                        </div>
                    )}
                    {/* Drag handle */}
                    <div
                        className="absolute top-0 right-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-blue-500/30"
                        onMouseDown={(e) => startDrag(e, 'sidebar')}
                    />
                </div>

                {/* Canvas */}
                <div className="flex-grow flex flex-col">
                    <Canvas />

                    {/* Bottom dock */}
                    {!isBottomCollapsed && bottomTabs.length > 0 && (
                        <div
                            className="relative bg-gray-950 border-t border-gray-800"
                            style={{ height: bottomHeight }}
                        >
                            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
                                {bottomTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveBottomTab(tab.id)}
                                        className={`px-3 py-1 rounded text-sm border ${activeBottomTab === tab.id ? 'border-blue-500 text-blue-200 bg-blue-500/10' : 'border-gray-700 text-gray-300 bg-gray-800/50 hover:border-gray-600'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                                <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                                    <button
                                        onClick={() => setBottomCollapsed(true)}
                                        className="px-2 py-1 rounded border border-gray-700 bg-gray-800/60 hover:border-gray-600"
                                        title="Minimizar"
                                    >
                                        –
                                    </button>
                                </div>
                            </div>
                            <div className="h-[calc(100%-44px)] overflow-hidden">
                                {activeBottomTab === 'actions' && showActions && (
                                    <ActionPanel onMinimize={() => setBottomCollapsed(true)} hideHeaderMinimize />
                                )}
                                {activeBottomTab === 'console' && (
                                    <Console onMinimize={() => setBottomCollapsed(true)} hideHeaderMinimize />
                                )}
                            </div>
                            <div
                                className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize bg-transparent hover:bg-blue-500/30"
                                onMouseDown={(e) => startDrag(e, 'bottom')}
                                style={{ marginTop: -4 }}
                            />
                        </div>
                    )}
                    {isBottomCollapsed && (
                        <div
                            className="h-6 bg-gray-900 border-t border-gray-800 flex items-center justify-center text-xs text-gray-400 cursor-pointer hover:text-gray-200"
                            onClick={() => setBottomCollapsed(false)}
                            title="Restaurar painel inferior"
                        >
                            {activeBottomTab === 'actions' && showActions ? 'Ações' : 'Console'} (clique para abrir)
                        </div>
                    )}
                </div>

                {/* Inspector */}
                <div
                    className={`relative h-full border-l border-gray-800 bg-gray-950 ${isInspectorCollapsed ? 'w-10' : ''}`}
                    style={!isInspectorCollapsed ? { width: inspectorWidth } : undefined}
                >
                    {!isInspectorCollapsed && <Inspector onCollapse={() => setInspectorCollapsed(true)} />}
                    {isInspectorCollapsed && (
                        <div
                            className="h-full w-full flex items-center justify-center text-gray-400 text-xs -rotate-90 hover:text-gray-200 cursor-pointer"
                            onClick={() => setInspectorCollapsed(false)}
                            title="Restaurar inspector"
                        >
                            Inspector
                        </div>
                    )}
                    <div
                        className="absolute top-0 left-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-blue-500/30"
                        onMouseDown={(e) => startDrag(e, 'inspector')}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
