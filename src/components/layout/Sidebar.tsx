/**
 * ORBITA - Sidebar
 * Painel lateral com componentes disponíveis
 */

import React, { useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { getAllDrivers } from '../../core/drivers';
import { HardwareCategory } from '../../core/types';
import { useOrbitaStore } from '../../store/useStore';
import { getHardwareProfile } from '../../config/hardware-profiles';
import * as LucideIcons from 'lucide-react';
import { Minus, ChevronDown, ChevronUp } from 'lucide-react';

type SidebarProps = {
    onCollapse?: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
    const { hardwareProfile } = useOrbitaStore();
    const profile = getHardwareProfile(hardwareProfile);

    const [search, setSearch] = useState('');
    const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

    const drivers = getAllDrivers().filter(driver => {
        if (!profile.allowedDrivers) return true; // Perfil genérico: todos
        return profile.allowedDrivers.includes(driver.id);
    });

    const filteredDrivers = useMemo(() => {
        if (!search.trim()) return drivers;
        const term = search.toLowerCase();
        return drivers.filter(d => d.name.toLowerCase().includes(term) || d.description.toLowerCase().includes(term));
    }, [drivers, search]);

    const categories = [
        { id: HardwareCategory.SENSOR, label: 'Sensores', icon: 'Gauge' },
        { id: HardwareCategory.ACTUATOR, label: 'Atuadores', icon: 'Lightbulb' },
        { id: HardwareCategory.LOGIC, label: 'Lógica', icon: 'GitCompare' },
        { id: HardwareCategory.COMMUNICATION, label: 'Comunicação', icon: 'Radio' }
    ];

    const onDragStart = (event: React.DragEvent, driverId: string) => {
        event.dataTransfer.setData('application/reactflow', driverId);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="h-full bg-gray-950 border-r border-gray-800 overflow-y-auto">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between pb-2">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200">Componentes</h2>
                        <p className="text-xs text-gray-500 mt-1">Arraste para o canvas</p>
                    </div>
                    {onCollapse && (
                        <button
                            onClick={onCollapse}
                            className="text-xs px-2 py-1 rounded border border-gray-700 bg-gray-900 hover:border-gray-600 flex items-center gap-1"
                            title="Minimizar painel de componentes"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {categories.map(category => {
                    const categoryDrivers = filteredDrivers.filter(d => d.category === category.id);
                    if (categoryDrivers.length === 0) return null;

                    const CategoryIcon = (LucideIcons as any)[category.icon] || LucideIcons.Box;
                    const collapsed = collapsedCats[category.id];

                    return (
                        <Card key={category.id} className="bg-gray-900/50">
                            <button
                                className="flex items-center justify-between w-full mb-2"
                                onClick={() => setCollapsedCats(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                            >
                                <div className="flex items-center gap-2">
                                    <CategoryIcon className="w-5 h-5 text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-300">{category.label}</h3>
                                    <span className="text-xs text-gray-500">{categoryDrivers.length}</span>
                                </div>
                                {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                            </button>

                            {!collapsed && (
                                <div className="space-y-2">
                                    {categoryDrivers.map(driver => {
                                        const DriverIcon = (LucideIcons as any)[driver.icon] || LucideIcons.Box;

                                        return (
                                            <div
                                                key={driver.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, driver.id)}
                                                className="flex items-center gap-2 rounded bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 cursor-grab active:cursor-grabbing transition-colors duration-150 p-3"
                                            >
                                                <DriverIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="flex-grow min-w-0">
                                                    <div className="text-sm font-medium text-gray-300 truncate">
                                                        {driver.name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 truncate">{driver.description}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
