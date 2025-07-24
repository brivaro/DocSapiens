// components/chat/ChatFiltersPanel.tsx
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 h-full flex flex-col gap-6">
            <h2 className="text-lg font-bold text-gray-800 flex border-b pb-3 items-center gap-2">
                <Funnel size={20} weight="fill" /> Context Filters
            </h2>

            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Bookmarks size={16} /> Documents</label>
                    <Select<SelectOption, true>
                        isMulti
                        options={documentOptions}
                        placeholder="Search in all documents"
                        onChange={(selected) => onFiltersChange({ documentIds: selected.map(s => s.value) })}
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Tag size={16} /> Tags</label>
                    <Select<SelectOption, true>
                        isMulti
                        options={tagOptions}
                        placeholder="Search with any tag"
                        onChange={(selected) => onFiltersChange({ tags: selected.map(s => s.value) })}
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label htmlFor="k-slider" className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
                       <span className="flex items-center gap-2"><Stack size={16} /> Relevant Chunks</span>
                       <span className="font-bold text-blue-600">{filters.k}</span>
                    </label>
                    <input
                        id="k-slider"
                        type="range"
                        min="1"
                        max="30"
                        value={filters.k}
                        onChange={e => onFiltersChange({ k: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatFiltersPanel;