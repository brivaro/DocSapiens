import React from 'react';
import Select from 'react-select';
import { useDocuments } from '../../hooks/useDocuments';
import { Funnel, Tag, Stack, Bookmarks } from 'phosphor-react';

type SelectOption = { value: string; label: string };

interface Filters {
    documentIds: string[];
    tags: string[];
    k: number;
}

interface Props {
    filters: Filters;
    onFiltersChange: (newFilters: Partial<Filters>) => void;
}

// Estilos personalizados para que React-Select se vea bien en Dark Mode
const selectStyles = {
    control: (base: any) => ({
        ...base,
        backgroundColor: '#374151', // gray-700
        borderColor: '#4b5563', // gray-600
        color: 'white',
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: '#1f2937', // gray-800
        border: '1px solid #374151',
    }),
    option: (base: any, state: { isFocused: boolean; isSelected: boolean }) => ({
        ...base,
        backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent',
        color: 'white',
        cursor: 'pointer',
    }),
    singleValue: (base: any) => ({
        ...base,
        color: 'white',
    }),
    multiValue: (base: any) => ({
        ...base,
        backgroundColor: '#4b5563', // gray-600
    }),
    multiValueLabel: (base: any) => ({
        ...base,
        color: 'white',
    }),
    multiValueRemove: (base: any) => ({
        ...base,
        color: '#d1d5db',
        ':hover': {
            backgroundColor: '#ef4444',
            color: 'white',
        },
    }),
    input: (base: any) => ({
        ...base,
        color: 'white',
    }),
};

const ChatFiltersPanel: React.FC<Props> = ({ filters, onFiltersChange }) => {
    const { documents: apiDocuments = [] } = useDocuments();

    const documentOptions: SelectOption[] = apiDocuments.map(doc => ({
        value: doc.id,
        label: doc.filename,
    }));
    
    const tagOptions: SelectOption[] = React.useMemo(() => {
        const tagsSet = new Set<string>();
        apiDocuments.forEach(doc => doc.tags?.forEach(tag => tagsSet.add(tag)));
        return Array.from(tagsSet).map(tag => ({ value: tag, label: tag }));
    }, [apiDocuments]);
    
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-full flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white flex border-b border-gray-700 pb-3 items-center gap-2">
                <Funnel size={20} weight="fill" className="text-blue-400" /> Filtros de Contexto
            </h2>

            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <Bookmarks size={16} className="text-purple-400"/> Documentos
                    </label>
                    <Select<SelectOption, true>
                        isMulti
                        options={documentOptions}
                        placeholder="Buscar en todos..."
                        onChange={(selected) => onFiltersChange({ documentIds: selected.map(s => s.value) })}
                        styles={selectStyles}
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <Tag size={16} className="text-yellow-400"/> Etiquetas
                    </label>
                    <Select<SelectOption, true>
                        isMulti
                        options={tagOptions}
                        placeholder="Filtrar por etiquetas..."
                        onChange={(selected) => onFiltersChange({ tags: selected.map(s => s.value) })}
                        styles={selectStyles}
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label htmlFor="k-slider" className="flex items-center justify-between text-sm font-semibold text-gray-300 mb-2">
                       <span className="flex items-center gap-2"><Stack size={16} className="text-green-400"/> Chunks Relevantes</span>
                       <span className="font-bold text-blue-400">{filters.k}</span>
                    </label>
                    <input
                        id="k-slider"
                        type="range"
                        min="1"
                        max="30"
                        value={filters.k}
                        onChange={e => onFiltersChange({ k: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Define cuántos fragmentos de texto se envían a la IA como contexto.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatFiltersPanel;