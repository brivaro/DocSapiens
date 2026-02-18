import React, { useMemo } from 'react';
import Tooltip from '../ui/ToolTip';

export interface Settings {
    model: string;
    system_instruction: string;
    temperature: number;
    top_p: number;
    max_output_tokens: number;
    thinking_budget: number;
    thinking_level?: string; // 'low' | 'medium' | 'high'
}

interface Props {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const ChatSettingsPanel: React.FC<Props> = ({ settings, onSettingsChange }) => {
    
    // Lógica para determinar capacidades del modelo seleccionado
    const modelInfo = useMemo(() => {
        const m = settings.model;
        const isGemini3 = m.includes("gemini-3");
        const isThinking = m.includes("gemini-2.5") || isGemini3;
        
        let budgetInfo = { min: 0, max: 0, show: false, note: "" };

        if (m.includes("gemini-2.5-pro")) {
            budgetInfo = { 
                show: true, 
                min: 128, 
                max: 32768, 
                note: "Rango: 128 - 32768. -1 (Dinámico). No se puede desactivar." 
            };
        } else if (m.includes("gemini-2.5-flash-lite")) {
            budgetInfo = { 
                show: true, 
                min: 512, 
                max: 24576, 
                note: "Rango: 512 - 24576. 0 (Off). -1 (Dinámico)." 
            };
        } else if (m.includes("gemini-2.5-flash")) {
            budgetInfo = { 
                show: true, 
                min: 1, // Técnicamente > 0
                max: 24576, 
                note: "Rango: 1 - 24576. 0 (Off). -1 (Dinámico)." 
            };
        }

        return { isGemini3, isThinking, budgetInfo };
    }, [settings.model]);

    return (
        <div className="p-4 space-y-5">
            {/* Model Select */}
            <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Modelo</label>
                <select
                    value={settings.model}
                    onChange={e => onSettingsChange({ model: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                </select>
            </div>

            {/* Configuración Dinámica de Thinking */}
            {modelInfo.isThinking && (
                <div className="bg-gray-700/30 p-3 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase">Capacidad de Razonamiento</span>
                    </div>

                    {modelInfo.isGemini3 ? (
                        // UI para Gemini 3: Niveles
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Nivel de Pensamiento</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['low', 'medium', 'high'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => onSettingsChange({ thinking_level: level })}
                                        className={`text-[10px] uppercase font-bold py-1.5 rounded border ${
                                            settings.thinking_level === level 
                                            ? 'bg-blue-600 border-blue-500 text-white' 
                                            : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // UI para Gemini 2.5: Budget Input Numérico (Más preciso para rangos grandes)
                        <div>
                             <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                                Budget Tokens <Tooltip text="Cantidad de tokens dedicados a pensar" />
                            </label>
                            <input 
                                type="number" 
                                min="-1"
                                max={modelInfo.budgetInfo.max}
                                step="128" 
                                value={settings.thinking_budget} 
                                onChange={e => onSettingsChange({ thinking_budget: parseInt(e.target.value) })} 
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="-1 para dinámico"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">{modelInfo.budgetInfo.note}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Sliders Standard */}
            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    Temperatura
                    <span className="ml-auto font-bold text-gray-400 text-[10px] bg-gray-800 px-1.5 rounded">{settings.temperature}</span>
                </label>
                <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={e => onSettingsChange({ temperature: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-500" />
            </div>

            {/* Top P (Nucleus Sampling) */}
            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    Top P <Tooltip text="Nucleus Sampling (Diversidad)" />
                    <span className="ml-auto font-bold text-gray-400 text-[10px] bg-gray-800 px-1.5 rounded">{settings.top_p}</span>
                </label>
                <input type="range" min="0" max="1" step="0.05" value={settings.top_p} onChange={e => onSettingsChange({ top_p: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            </div>

            {/* Max Output Tokens - RESTAURADO */}
            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    Max Output Tokens <Tooltip text="Límite máximo de la respuesta" />
                    <span className="ml-auto font-bold text-green-400 text-[10px] bg-green-900/30 px-1.5 rounded">{settings.max_output_tokens}</span>
                </label>
                <input type="range" min="256" max="8192" step="256" value={settings.max_output_tokens} onChange={e => onSettingsChange({ max_output_tokens: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500" />
            </div>

             {/* System Instruction */}
             <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    System Instruction
                </label>
                <textarea
                    value={settings.system_instruction}
                    onChange={e => onSettingsChange({ system_instruction: e.target.value })}
                    className="w-full h-20 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none scrollbar-thin scrollbar-thumb-gray-600"
                />
            </div>
        </div>
    );
};

export default ChatSettingsPanel;