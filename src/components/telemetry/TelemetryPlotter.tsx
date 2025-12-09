import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWebSerialStore } from '../../stores/webSerialStore';
import { extractPlotData, getPlotColor } from '../../utils/telemetry-parser';

// ============================================================================
// TELEMETRY PLOTTER - Gráficos de telemetria em tempo real
// ============================================================================

export const TelemetryPlotter: React.FC = () => {
    const { telemetryData } = useWebSerialStore();

    // Extrair dados para plotagem
    const plotData = useMemo(() => {
        const data = extractPlotData(telemetryData);

        // Converter para formato do Recharts
        const timestamps = new Set<number>();
        Object.values(data).forEach((values) => {
            values.forEach((point) => timestamps.add(point.timestamp));
        });

        const chartData = Array.from(timestamps)
            .sort((a, b) => a - b)
            .slice(-50) // Últimos 50 pontos
            .map((timestamp) => {
                const dataPoint: any = {
                    timestamp,
                    time: new Date(timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                };

                Object.entries(data).forEach(([key, values]) => {
                    const point = values.find((p) => p.timestamp === timestamp);
                    if (point) {
                        dataPoint[key] = point.value;
                    }
                });

                return dataPoint;
            });

        return { chartData, keys: Object.keys(data) };
    }, [telemetryData]);

    if (plotData.chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-950 border border-gray-800 rounded-lg">
                <div className="text-center text-gray-500">
                    <p>Aguardando dados numéricos para plotagem...</p>
                    <p className="text-xs mt-2">Os dados serão exibidos automaticamente</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1">Gráficos de Telemetria</h3>
                <p className="text-xs text-gray-400">
                    Exibindo os últimos 50 pontos de dados
                </p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={plotData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="time"
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#e5e7eb' }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                            iconType="line"
                        />
                        {plotData.keys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={getPlotColor(index)}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend com valores atuais */}
            <div className="grid grid-cols-2 gap-3">
                {plotData.keys.map((key, index) => {
                    const latestValue = plotData.chartData[plotData.chartData.length - 1]?.[key];
                    return (
                        <div
                            key={key}
                            className="bg-gray-900 border border-gray-800 rounded-lg p-3"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getPlotColor(index) }}
                                />
                                <span className="text-xs font-medium text-gray-400 uppercase">{key}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-100">
                                {latestValue !== undefined ? latestValue.toFixed(2) : '--'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
