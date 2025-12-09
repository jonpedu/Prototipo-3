import React from 'react';
import { Rocket, Save, Download, Upload as UploadIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { useWebSerial } from '../../hooks/useWebSerial';
import { useBlocklyStore } from '../../stores/blocklyStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { generateMicroPythonCode } from '../../utils/code-generator';

// ============================================================================
// BOTTOM BAR - Barra inferior com ações principais
// ============================================================================

export const BottomBar: React.FC = () => {
    const { upload, isUploading, uploadProgress } = useWebSerial();
    const { generatedCode } = useBlocklyStore();
    const { modules } = useHardwareStore();

    const handleLaunch = async () => {
        // Gerar código MicroPython completo
        const result = generateMicroPythonCode(generatedCode || '# Código vazio', modules);

        if (result.errors.length > 0) {
            alert(`Erros encontrados:\n${result.errors.join('\n')}`);
            return;
        }

        // Fazer upload
        await upload(result.code);
    };

    return (
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
            {/* Info */}
            <div className="flex items-center gap-4">
                <div className="text-sm">
                    <span className="text-gray-400">Módulos configurados:</span>
                    <span className="ml-2 font-semibold text-gray-100">{modules.length}</span>
                </div>
                <div className="w-px h-8 bg-gray-700" />
                <div className="text-sm">
                    <span className="text-gray-400">Código gerado:</span>
                    <span className="ml-2 font-semibold text-gray-100">
                        {generatedCode ? `${generatedCode.split('\n').length} linhas` : '0 linhas'}
                    </span>
                </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="flex-1 max-w-md mx-8">
                    <ProgressBar value={uploadProgress} label="Enviando código..." variant="success" />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" icon={<Save size={18} />}>
                    Salvar
                </Button>

                <Button variant="ghost" size="sm" icon={<Download size={18} />}>
                    Exportar
                </Button>

                <Button variant="ghost" size="sm" icon={<UploadIcon size={18} />}>
                    Importar
                </Button>

                <div className="w-px h-8 bg-gray-700" />

                {/* Launch Button */}
                <Button
                    variant="success"
                    size="lg"
                    icon={<Rocket size={20} />}
                    onClick={handleLaunch}
                    isLoading={isUploading}
                    className="font-bold animate-pulse-glow"
                >
                    🚀 LANÇAR
                </Button>
            </div>
        </div>
    );
};
