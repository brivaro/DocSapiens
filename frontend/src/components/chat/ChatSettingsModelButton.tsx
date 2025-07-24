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
                className="p-3 rounded-full bg-white border text-blue-600 shadow-sm hover:bg-gray-100 animate-subtle-pulse"
                aria-label="Open model settings"
            >
                <Robot size={24} weight="fill" />
            </button>
        );
    }
    // Panel de settings (copiado del panel original, pero autocontenible)
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 h-full flex flex-col gap-6 w-80 transition-all">
            <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Robot size={20} weight="fill" /> Model Settings
                </h2>
                <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 flex flex-col gap-6 overflow-visible pr-2">
                {settings && onSettingsChange && <>
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Model</label>
                    <select
                        value={settings.model}
                        onChange={e => onSettingsChange({ model: e.target.value })}
                        className="form-select w-full"
                    >
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="temp-slider" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        Temperature <Tooltip text="Controls randomness. Lower is more predictable, higher is more creative." />
                        <span className="ml-auto font-bold text-blue-600">{settings.temperature}</span>
                    </label>
                    <input id="temp-slider" type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={e => onSettingsChange({ temperature: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label htmlFor="top-k-slider" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        Top K <Tooltip text="The model considers the top K most likely tokens at each step." />
                        <span className="ml-auto font-bold text-blue-600">{settings.top_k}</span>
                    </label>
                    <input id="top-k-slider" type="range" min="1" max="50" step="1" value={settings.top_k} onChange={e => onSettingsChange({ top_k: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label htmlFor="max-tokens-slider" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        Max Tokens <Tooltip text="Maximum number of tokens to generate in the response." />
                        <span className="ml-auto font-bold text-blue-600">{settings.max_output_tokens}</span>
                    </label>
                    <input id="max-tokens-slider" type="range" min="64" max="2048" step="64" value={settings.max_output_tokens} onChange={e => onSettingsChange({ max_output_tokens: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label htmlFor="thinking-budget-input" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        Thinking Budget <Tooltip text="Tokens for reasoning (Gemini 2.5+). 0 disables it, -1 makes it dynamic." />
                    </label>
                    <input id="thinking-budget-input" type="number" step="128" value={settings.thinking_budget} onChange={e => onSettingsChange({ thinking_budget: parseInt(e.target.value) })} className="form-input w-full" placeholder="e.g., 1024" />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        System Instruction
                        <Tooltip text="Guides the model's personality and response style. E.g., 'You are a helpful pirate.'" />
                    </label>
                    <textarea
                        value={settings.system_instruction}
                        onChange={e => onSettingsChange({ system_instruction: e.target.value })}
                        placeholder="e.g., You are a helpful assistant..."
                        className="form-textarea w-full h-16 resize-none p-2 bg-slate-50 border-dashed border-slate-300 rounded-md focus:border-solid focus:border-blue-500 focus:bg-white"
                        rows={5}
                    />
                </div>
                </>}
            </div>
        </div>
    );
};

export default ChatSettingsButton;
