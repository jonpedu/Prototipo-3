/**
 * ORBITA - Toolbar
 * Barra superior com controles principais
 */

import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useOrbitaStore } from '../../store/useStore';
import { SerialStatus } from '../../core/types';
import {
    Wifi,
    WifiOff,
    Upload,
    Play,
    Trash2,
    Satellite
} from 'lucide-react';

export const Toolbar: React.FC = () => {
    const {
        serialStatus,
        nodes,
        isMockMode,
        connectSerial,
        disconnectSerial,
        uploadCode,
        clearTelemetry
    } = useOrbitaStore();

    const isConnected = serialStatus !== SerialStatus.DISCONNECTED && serialStatus !== SerialStatus.ERROR;
    const isRunning = serialStatus === SerialStatus.RUNNING;

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

                {statusBadge()}

                {isMockMode && (
                    <Badge variant="warning">MODO MOCK</Badge>
                )}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 mr-2">
                    {nodes.length} componente{nodes.length !== 1 ? 's' : ''}
                </span>

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
