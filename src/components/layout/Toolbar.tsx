/**
 * ORBITA - Toolbar
 * Barra superior com controles principais
 */

import React, { useRef } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useOrbitaStore } from '../../store/useStore';
import { SerialStatus, HardwareProfileType } from '../../core/types';
import { getAllHardwareProfiles } from '../../config/hardware-profiles';
import {
    Wifi,
    WifiOff,
    Upload,
    Play,
    Trash2,
    Satellite,
    Save,
    FolderOpen,
    FileText,
    Cpu,
    ListChecks
} from 'lucide-react';
import { missionPresets } from '../../config/mission-presets';

export const Toolbar: React.FC = () => {
    const {
        serialStatus,
        nodes,
        isMockMode,
        hardwareProfile,
        connectSerial,
        disconnectSerial,
        uploadCode,
        clearTelemetry,
        saveMission,
        loadMission,
        clearCanvas,
        setHardwareProfile,
        setNodes,
        setEdges,
        selectNode
    } = useOrbitaStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isConnected = serialStatus !== SerialStatus.DISCONNECTED && serialStatus !== SerialStatus.ERROR;
    const isRunning = serialStatus === SerialStatus.RUNNING;

    const handleLoadMission = () => {
        fileInputRef.current?.click();
    };

    const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = event.target.value;
        if (!presetId) return;

        const preset = missionPresets.find(p => p.id === presetId);
        if (!preset) return;

        // Clona nodes/edges para evitar mutações externas
        const clonedNodes = preset.nodes.map(node => ({ ...node, data: { ...node.data } }));
        const clonedEdges = preset.edges.map(edge => ({ ...edge }));

        setNodes(clonedNodes);
        setEdges(clonedEdges);
        selectNode(null);

        event.target.value = '';
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            loadMission(content);
        };
        reader.readAsText(file);

        // Reset input para permitir carregar o mesmo arquivo novamente
        event.target.value = '';
    };

    const handleClearCanvas = () => {
        if (nodes.length === 0) return;
        
        if (confirm('Tem certeza que deseja limpar o canvas? Todas as alterações não salvas serão perdidas.')) {
            clearCanvas();
        }
    };

    const statusBadge = () => {
        switch (serialStatus) {
            case SerialStatus.CONNECTED:
                return <Badge variant="success">Conectado</Badge>;
            case SerialStatus.CONNECTING:
                return <Badge variant="info">Conectando...</Badge>;
            case SerialStatus.UPLOADING:
                return <Badge variant="warning">Enviando...</Badge>;
            case SerialStatus.RUNNING:
                return <Badge variant="success">Executando</Badge>;
            case SerialStatus.ERROR:
                return <Badge variant="error">Erro</Badge>;
            default:
                return <Badge variant="default">Desconectado</Badge>;
        }
    };

    return (
        <div className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6 shadow-xl">
            {/* Logo e Status */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Satellite className="w-8 h-8 text-blue-500" />
                    <h1 className="text-xl font-bold text-gray-100">ORBITA</h1>
                </div>

                <div className="h-8 w-px bg-gray-700" />

                {/* Presets de missão */}
                <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-gray-400" />
                    <select
                        defaultValue=""
                        onChange={handlePresetChange}
                        className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>Missões rápidas</option>
                        {missionPresets.map(preset => (
                            <option key={preset.id} value={preset.id}>
                                {preset.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="h-8 w-px bg-gray-700" />

                {statusBadge()}

                {isMockMode && (
                    <Badge variant="warning">MODO MOCK</Badge>
                )}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
                {/* Hardware Profile Selector */}
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-gray-400" />
                    <select
                        value={hardwareProfile}
                        onChange={(e) => setHardwareProfile(e.target.value as HardwareProfileType)}
                        className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {getAllHardwareProfiles().map(profile => (
                            <option key={profile.id} value={profile.id}>
                                {profile.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="h-8 w-px bg-gray-700" />

                {/* File Operations */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCanvas}
                    disabled={nodes.length === 0}
                    title="Nova Missão"
                >
                    <FileText className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveMission}
                    disabled={nodes.length === 0}
                    title="Salvar Missão"
                >
                    <Save className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMission}
                    title="Carregar Missão"
                >
                    <FolderOpen className="w-4 h-4" />
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".orbita,.json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                <div className="h-8 w-px bg-gray-700" />

                <span className="text-sm text-gray-400">
                    {nodes.length} componente{nodes.length !== 1 ? 's' : ''}
                </span>

                <div className="h-8 w-px bg-gray-700" />

                {!isConnected ? (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={connectSerial}
                        disabled={false}
                    >
                        <Wifi className="w-4 h-4" />
                        Conectar
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={disconnectSerial}
                    >
                        <WifiOff className="w-4 h-4" />
                        Desconectar
                    </Button>
                )}

                <Button
                    variant="primary"
                    size="sm"
                    onClick={uploadCode}
                    disabled={!isConnected || nodes.length === 0 || serialStatus === SerialStatus.UPLOADING}
                >
                    {isRunning ? <Play className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {isRunning ? 'Reiniciar' : 'Upload'}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTelemetry}
                >
                    <Trash2 className="w-4 h-4" />
                    Limpar Console
                </Button>
            </div>
        </div>
    );
};
