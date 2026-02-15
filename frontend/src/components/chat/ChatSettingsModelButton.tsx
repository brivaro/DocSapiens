import React from 'react';
import { Robot, X } from 'phosphor-react';
import Tooltip from '../ui/ToolTip';

interface Settings {
    model: string;
    system_instruction: string;
    temperature: number;
    top_k: number;
    max_output_tokens: number;
    thinking_budget: number;
}

interface Props {
    isCollapsed: boolean;
    onClick?: () => void;
    settings?: Settings;
    onSettingsChange?: (newSettings: Partial<Settings>) => void;
}

const ChatSettingsButton: React.FC<Props> = ({ isCollapsed, settings, onSettingsChange }) => {
    const [open, setOpen] = React.useState(false);
    
    if (!isCollapsed && !open) return null;
    
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="p-3 rounded-full bg-gray-800 border border-gray-700 text-blue-400 shadow-lg hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Configurar Modelo"
            >
                <Robot size={24} weight="fill" />
            </button>
        );
    }

    return (
        <div className="absolute right-20 top-4 bottom-4 w-80 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-2xl z-50 flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Robot size={20} weight="fill" className="text-blue-500"/> Model Settings
                </h2>
                <button onClick={() => setOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {settings && onSettingsChange && <>
                
                {/* Model Select */}
                <div>
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">Modelo</label>
                    <select
                        value={settings.model}
                        onChange={e => onSettingsChange({ model: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                    </select>
                </div>

                {/* Sliders */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        Temperatura <Tooltip text="Creatividad vs Precisión" />
                        <span className="ml-auto font-bold text-blue-400 text-xs bg-blue-900/30 px-2 rounded">{settings.temperature}</span>
                    </label>
                    <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={e => onSettingsChange({ temperature: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        Max Tokens <Tooltip text="Límite de respuesta" />
                        <span className="ml-auto font-bold text-green-400 text-xs bg-green-900/30 px-2 rounded">{settings.max_output_tokens}</span>
                    </label>
                    <input type="range" min="64" max="4096" step="64" value={settings.max_output_tokens} onChange={e => onSettingsChange({ max_output_tokens: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500" />
                </div>
                
                {/* Inputs */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        Thinking Budget <Tooltip text="Tokens para razonamiento (Solo modelos 2.5+)" />
                    </label>
                    <input type="number" step="128" value={settings.thinking_budget} onChange={e => onSettingsChange({ thinking_budget: parseInt(e.target.value) })} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g., 1024" />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        System Instruction <Tooltip text="Personalidad de la IA" />
                    </label>
                    <textarea
                        value={settings.system_instruction}
                        onChange={e => onSettingsChange({ system_instruction: e.target.value })}
                        placeholder="Eres un asistente útil..."
                        className="w-full h-24 resize-none p-3 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none scrollbar-thin scrollbar-thumb-gray-600"
                    />
                </div>
                </>}
            </div>
        </div>
    );
};

export default ChatSettingsButton;