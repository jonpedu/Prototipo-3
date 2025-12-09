import React from 'react';
import { Satellite, Settings, Github, HelpCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useWebSerialStore } from '../../stores/webSerialStore';
import { useWebSerial } from '../../hooks/useWebSerial';

// ============================================================================
// HEADER - Cabeçalho principal da aplicação
// ============================================================================

export const Header: React.FC = () => {
    const { connection, mockConfig } = useWebSerialStore();
    const { connect, disconnect, isConnected, isMockMode } = useWebSerial();

    const handleConnectionToggle = () => {
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    return (
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
            {/* Logo e Título */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Satellite size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-100">ORBITA</h1>
                        <p className="text-xs text-gray-400">Programação Visual de Nanossatélites</p>
                    </div>
                </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3">
                {/* Mock Mode Indicator */}
                {isMockMode && (
                    <Badge variant="warning" size="sm">
                        🧪 Modo Simulação
                    </Badge>
                )}

                {/* Connection Status */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Badge variant="success" size="sm">
                            <Wifi size={14} className="mr-1" />
                            Conectado
                        </Badge>
                    ) : (
                        <Badge variant="default" size="sm">
                            <WifiOff size={14} className="mr-1" />
                            Desconectado
                        </Badge>
                    )}
                </div>

                {/* Connect/Disconnect Button */}
                <Button
                    variant={isConnected ? 'danger' : 'primary'}
                    size="sm"
                    onClick={handleConnectionToggle}
                    icon={isConnected ? <WifiOff size={18} /> : <Wifi size={18} />}
                >
                    {isConnected ? 'Desconectar' : 'Conectar'}
                </Button>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-700" />

                {/* Help */}
                <Button variant="ghost" size="sm" icon={<HelpCircle size={18} />}>
                    Ajuda
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="sm" icon={<Settings size={18} />}>
                    Configurações
                </Button>

                {/* GitHub */}
                <Button
                    variant="ghost"
                    size="sm"
                    icon={<Github size={18} />}
                    onClick={() => window.open('https://github.com/jonpedu/Prototipo-3', '_blank')}
                >
                    GitHub
                </Button>
            </div>
        </header>
    );
};
