import { useState } from 'react';
import { useVectorStores } from '../hooks/useVectorStores';
import { Plus, Trash, Database, Books, Cube } from 'phosphor-react';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useAppToast } from '../hooks/useAppToast';

const DIMENSIONS = [128, 256, 512, 768, 1536, 2048, 3072];

export default function Collections() {
    const { vectorStores, isLoading, createVectorStore, deleteVectorStore } = useVectorStores();
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [dim, setDim] = useState(768);
    const toast = useAppToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        try {
            await createVectorStore({ name, description: desc, embedding_dimension: dim });
            setIsCreating(false);
            setName(''); setDesc(''); setDim(768);
        } catch (error) { /* Toast handled in hook */ }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Books size={32} className="text-purple-400" /> Mis Colecciones
                    </h1>
                    <p className="text-gray-400 mt-2">Gestiona tus bases de conocimiento vectoriales independientes.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                >
                    <Plus size={20} weight="bold"/> Nueva Colección
                </button>
            </div>

            {/* Create Modal/Card Inline */}
            {isCreating && (
                <div className="bg-gray-800 border border-blue-500/50 rounded-2xl p-6 shadow-2xl animate-zoomIn">
                    <h3 className="text-lg font-bold text-white mb-4">Crear Nueva Colección</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    placeholder="ej: manuales_tecnicos_2024"
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Dimensión Embeddings</label>
                                <select 
                                    value={dim} 
                                    onChange={e => setDim(Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {DIMENSIONS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                            <input 
                                type="text" 
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="¿Qué contiene esta colección?"
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Crear</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1,2,3].map(i => <SkeletonLoader key={i} className="h-40 rounded-2xl" />)
                ) : vectorStores?.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl">
                        <Cube size={64} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-lg">No tienes colecciones activas.</p>
                        <p className="text-sm text-gray-500">Crea una para empezar a subir documentos.</p>
                    </div>
                ) : (
                    vectorStores?.map(store => (
                        <div key={store.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button 
                                    onClick={() => { toast.success("Colección eliminada"); deleteVectorStore(store.id) }}
                                    className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/20">
                                    <Database size={32} weight="duotone" className="text-blue-400" />
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white truncate mb-1" title={store.name}>
                                {store.name}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 h-10">
                                {store.description || "Sin descripción"}
                            </p>
                            
                            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500 font-mono">
                                <span>Creado: {new Date(store.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="absolute bottom-6 right-6">
                                <span className="text-xs font-mono text-gray-500 bg-gray-900/80 px-2 py-1 rounded border border-gray-700 backdrop-blur-sm">
                                    DIM: {store.embedding_dimension}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}