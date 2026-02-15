import React from 'react';
import { Robot } from 'phosphor-react';
import Tooltip from '../ui/ToolTip';

export interface Settings {
    model: string;
    system_instruction: string;
    temperature: number;
    top_k: number;
    max_output_tokens: number;
    thinking_budget: number;
}

interface Props {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const ChatSettingsPanel: React.FC<Props> = ({ settings, onSettingsChange }) => {
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
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
            </div>

            {/* Sliders */}
            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    Temperatura <Tooltip text="Creatividad vs Precisión" />
                    <span className="ml-auto font-bold text-blue-400 text-[10px] bg-blue-900/30 px-1.5 rounded">{settings.temperature}</span>
                </label>
                <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={e => onSettingsChange({ temperature: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>

            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    Max Tokens <Tooltip text="Límite de respuesta" />
                    <span className="ml-auto font-bold text-green-400 text-[10px] bg-green-900/30 px-1.5 rounded">{settings.max_output_tokens}</span>
                </label>
                <input type="range" min="64" max="65536" step="10" value={settings.max_output_tokens} onChange={e => onSettingsChange({ max_output_tokens: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500" />
            </div>
            
            {/* Inputs */}
            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    Thinking Budget <Tooltip text="Tokens para razonamiento (Solo modelos 2.5+)" />
                </label>
                <input type="number" step="128" value={settings.thinking_budget} onChange={e => onSettingsChange({ thinking_budget: parseInt(e.target.value) })} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g., 1024" />
            </div>

            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1.5">
                    System Instruction <Tooltip text="Personalidad de la IA" />
                </label>
                <textarea
                    value={settings.system_instruction}
                    onChange={e => onSettingsChange({ system_instruction: e.target.value })}
                    placeholder="Eres un asistente útil..."
                    className="w-full h-24 resize-none p-3 bg-gray-900 border border-gray-600 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none scrollbar-thin scrollbar-thumb-gray-600 leading-relaxed"
                />
            </div>
        </div>
    );
};

export default ChatSettingsPanel;