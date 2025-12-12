/**
 * ORBITA - Sidebar
 * Painel lateral com componentes disponíveis
 */

import React from 'react';
import { Card } from '../ui/Card';
import { getAllDrivers } from '../../core/drivers';
import { HardwareCategory } from '../../core/types';
import { useOrbitaStore } from '../../store/useStore';
import { getHardwareProfile } from '../../config/hardware-profiles';
import * as LucideIcons from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { hardwareProfile } = useOrbitaStore();
    const profile = getHardwareProfile(hardwareProfile);

    const drivers = getAllDrivers().filter(driver => {
        if (!profile.allowedDrivers) return true; // Perfil genérico: todos
        return profile.allowedDrivers.includes(driver.id);
    });

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
        <div className="w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto">
            <div className="p-4 space-y-4">
                <div className="text-center pb-2">
                    <h2 className="text-lg font-semibold text-gray-200">Componentes</h2>
                    <p className="text-xs text-gray-500 mt-1">Arraste para o canvas</p>
                </div>

                {categories.map(category => {
                    const categoryDrivers = drivers.filter(d => d.category === category.id);
                    if (categoryDrivers.length === 0) return null;

                    const CategoryIcon = (LucideIcons as any)[category.icon] || LucideIcons.Box;

                    return (
                        <Card key={category.id} className="bg-gray-900/50">
                            <div className="flex items-center gap-2 mb-3">
                                <CategoryIcon className="w-5 h-5 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-300">{category.label}</h3>
                            </div>

                            <div className="space-y-2">
                                {categoryDrivers.map(driver => {
                                    const DriverIcon = (LucideIcons as any)[driver.icon] || LucideIcons.Box;

                                    return (
                                        <div
                                            key={driver.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, driver.id)}
                                            className="
                        flex items-center gap-2 p-2 rounded
                        bg-gray-800/50 hover:bg-gray-700/50
                        border border-gray-700 hover:border-gray-600
                        cursor-grab active:cursor-grabbing
                        transition-colors duration-150
                      "
                                        >
                                            <DriverIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <div className="flex-grow min-w-0">
                                                <div className="text-xs font-medium text-gray-300 truncate">
                                                    {driver.name}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
