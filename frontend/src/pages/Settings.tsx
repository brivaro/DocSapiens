import { useState, useEffect } from 'react';
import { 
    Gear, Database, Brain, FloppyDiskBack, Warning, 
    CheckCircle, Faders, Info
} from 'phosphor-react';
import { useRagSettings } from '../context/RagSettingsContext';
import { useAppToast } from '../hooks/useAppToast';
import apiClient from '../api/client';
import { TaskType } from '../interfaces/RagSettings';
import { clsx } from 'clsx';

// Opciones disponibles (alineadas con el backend)
const DIMENSIONS = [128, 256, 512, 768, 1536, 2048, 3072];

const TASK_TYPES: { value: TaskType; label: string; desc: string }[] = [
    { value: "RETRIEVAL_QUERY", label: "Búsqueda Estándar (RAG)", desc: "Optimizado para buscar respuestas a preguntas específicas en tus documentos." },
    { value: "SEMANTIC_SIMILARITY", label: "Similitud Semántica", desc: "Encuentra textos que significan lo mismo. Ideal para detección de duplicados." },
    { value: "CLASSIFICATION", label: "Clasificación", desc: "Optimizado para categorizar textos en grupos predefinidos." },
    { value: "CLUSTERING", label: "Agrupamiento (Clustering)", desc: "Organiza documentos por temas comunes sin etiquetas previas." },
    { value: "QUESTION_ANSWERING", label: "Preguntas y Respuestas", desc: "Especializado para chatbots que responden preguntas factuales." },
    { value: "FACT_VERIFICATION", label: "Verificación de Hechos", desc: "Busca evidencias para confirmar o refutar una afirmación." },
];

export default function Settings() {
    const { config, refreshConfig } = useRagSettings();
    const toast = useAppToast();
    
    // Estado local para el formulario
    const [selectedDim, setSelectedDim] = useState<number>(768);
    const [selectedTask, setSelectedTask] = useState<TaskType>("RETRIEVAL_QUERY");
    const [isSaving, setIsSaving] = useState(false);

    // Sincronizar estado local con config global al cargar
    useEffect(() => {
        if (config) {
            setSelectedDim(config.embedding_dimension);
            setSelectedTask(config.embedding_task_type);
        }
    }, [config]);

    const handleSave = async () => {
        if (!config) return;
        
        // Verificación visual de cambios
        if (selectedDim === config.embedding_dimension && selectedTask === config.embedding_task_type) {
            toast.info("No hay cambios para guardar.");
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.post('/api/v1/settings/', {
                embedding_dimension: selectedDim,
                embedding_task_type: selectedTask
            });
            
            await refreshConfig(); // Recargar contexto global
            
            toast.success("Configuración actualizada. Sincronización iniciada en segundo plano.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la configuración.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!config) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-gray-700 to-gray-600 p-3 rounded-xl shadow-lg">
                    <Gear size={32} weight="fill" className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configuración del Motor RAG</h1>
                    <p className="text-gray-400 mt-1">Ajusta los parámetros del modelo de embeddings de Google Gemini.</p>
                </div>
            </div>

            {/* Panel Principal */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database size={24} className="text-blue-400" />
                        Parámetros de Vectorización
                    </h2>
                </div>
                
                <div className="p-8 space-y-8">
                    
                    {/* 1. Selector de Dimensión */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <label className="text-lg font-semibold text-white flex items-center gap-2">
                                    Dimensión del Vector (MRL)
                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300 border border-blue-500/30 font-mono">
                                        {selectedDim} floats
                                    </span>
                                </label>
                                <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                                    Define el tamaño de los vectores. Dimensiones más bajas ahorran espacio y son más rápidas, pero pueden perder matices. 
                                    <span className="text-green-400 font-medium"> 768 es el estándar recomendado.</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                            {DIMENSIONS.map((dim) => (
                                <button
                                    key={dim}
                                    onClick={() => setSelectedDim(dim)}
                                    className={clsx(
                                        "py-3 px-2 rounded-xl text-sm font-bold transition-all border-2",
                                        selectedDim === dim
                                            ? "border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                            : "border-gray-700 bg-gray-750 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                                    )}
                                >
                                    {dim}
                                </button>
                            ))}
                        </div>
                        
                        {selectedDim !== config.embedding_dimension && (
                            <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-xl">
                                <Warning size={24} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-yellow-200 font-bold text-sm">Cambio de Dimensión Detectado</p>
                                    <p className="text-yellow-400/80 text-xs mt-1">
                                        Al guardar, el sistema iniciará una <strong>re-sincronización completa</strong> en segundo plano. 
                                        Los documentos existentes se re-procesarán automáticamente para adaptarse a la dimensión {selectedDim}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="h-px bg-gray-700" />

                    {/* 2. Selector de Tipo de Tarea */}
                    <section className="space-y-4">
                        <div>
                            <label className="text-lg font-semibold text-white flex items-center gap-2">
                                <Brain size={24} className="text-purple-400" />
                                Intención de Búsqueda (Task Type)
                            </label>
                            <p className="text-sm text-gray-400 mt-1">
                                Optimiza cómo Google genera los embeddings según el uso que le darás a los documentos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TASK_TYPES.map((task) => (
                                <button
                                    key={task.value}
                                    onClick={() => setSelectedTask(task.value)}
                                    className={clsx(
                                        "flex items-start gap-3 p-4 rounded-xl border transition-all text-left group",
                                        selectedTask === task.value
                                            ? "bg-purple-900/20 border-purple-500 shadow-inner"
                                            : "bg-gray-750 border-gray-700 hover:bg-gray-700 hover:border-gray-600"
                                    )}
                                >
                                    <div className={clsx(
                                        "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                        selectedTask === task.value ? "border-purple-400" : "border-gray-500 group-hover:border-gray-400"
                                    )}>
                                        {selectedTask === task.value && <div className="w-2.5 h-2.5 bg-purple-400 rounded-full" />}
                                    </div>
                                    <div>
                                        <p className={clsx("font-bold text-sm", selectedTask === task.value ? "text-purple-300" : "text-gray-300")}>
                                            {task.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            {task.desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer de Acciones */}
                <div className="p-6 bg-gray-900 border-t border-gray-700 flex justify-end items-center gap-4">
                    <div className="text-xs text-gray-500 flex items-center gap-2 mr-auto">
                        <Info size={16} />
                        Modelo activo: <span className="font-mono text-gray-400">{config.embedding_model}</span>
                    </div>

                    <button 
                        onClick={() => { setSelectedDim(config.embedding_dimension); setSelectedTask(config.embedding_task_type); }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all",
                            isSaving 
                                ? "bg-blue-800 cursor-not-allowed opacity-70" 
                                : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-95"
                        )}
                    >
                        {isSaving ? (
                            <>
                                <Faders size={20} className="animate-spin" />
                                Aplicando...
                            </>
                        ) : (
                            <>
                                <FloppyDiskBack size={20} weight="fill" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Tarjeta Informativa de Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex items-center gap-4">
                    <div className="bg-green-500/10 p-3 rounded-full">
                         <CheckCircle size={32} className="text-green-500" weight="fill" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Sistema Operativo</h3>
                        <p className="text-sm text-gray-400">El backend de vectorización está activo y respondiendo.</p>
                    </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-full">
                         <Database size={32} className="text-blue-500" weight="fill" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Colección Qdrant</h3>
                        <p className="text-sm text-gray-400">Conectado a la colección <code>docsapiens_{config.embedding_dimension}</code></p>
                    </div>
                </div>
            </div>
        </div>
    );
}