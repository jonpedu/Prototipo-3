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
        saveMission,
        loadMission,
        clearCanvas,
        setHardwareProfile,
        setNodes,
        setEdges,
        selectNode,
        runSelfTest
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
        <div className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 shadow-xl gap-4">
            {/* Logo + Perfil + Missões */}
            <div className="flex items-center gap-3 lg:gap-4">
                <div className="flex items-center gap-2 pr-3 border-r border-gray-800">
                    <Satellite className="w-7 h-7 text-blue-500" />
                    <h1 className="text-xl font-bold text-gray-100">ORBITA</h1>
                </div>

                <div className="hidden md:flex items-center gap-2">
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

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-xs text-gray-200">
                    <span
                        className={`h-2 w-2 rounded-full ${isMockMode ? 'bg-amber-400 animate-pulse' : isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
                    />
                    <span className="uppercase tracking-wide font-semibold">
                        {isMockMode ? 'Simulação' : isConnected ? 'Dispositivo' : 'Offline'}
                    </span>
                </div>

                {statusBadge()}
                {isMockMode && <Badge variant="warning">MODO MOCK</Badge>}
            </div>

            {/* Controles principais */}
            <div className="flex items-center gap-2 lg:gap-3">
                {/* Profile */}
                <div className="flex items-center gap-2 pr-3 border-r border-gray-800">
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

                {/* File ops */}
                <div className="flex items-center gap-1 pr-3 border-r border-gray-800">
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
                </div>

                <span className="hidden md:block text-sm text-gray-400 pr-3 border-r border-gray-800">
                    {nodes.length} componente{nodes.length !== 1 ? 's' : ''}
                </span>

                {/* Conexão */}
                <div className="flex items-center gap-2 pr-3 border-r border-gray-800">
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
                        {isRunning ? 'Reiniciar' : 'Enviar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
