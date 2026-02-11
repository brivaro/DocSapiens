import { useState, useEffect } from 'react';
import { 
    Gear, Database, Brain, FloppyDiskBack, Warning, 
    CheckCircle, Faders, Info, ArrowClockwise
} from 'phosphor-react';
import { useRagSettings } from '../context/RagSettingsContext';
import { useAppToast } from '../hooks/useAppToast';
import apiClient from '../api/client';
import { TaskType } from '../interfaces/RagSettings';
import { clsx } from 'clsx';

const DIMENSIONS = [128, 256, 512, 768, 1536, 2048, 3072];

// Lista completa de opciones
const TASK_TYPES: { value: TaskType; label: string; desc: string }[] = [
    { value: "RETRIEVAL_QUERY", label: "Búsqueda Estándar (RAG)", desc: "El modo por defecto. Ideal para responder preguntas sobre tus documentos." },
    { value: "QUESTION_ANSWERING", label: "Preguntas y Respuestas", desc: "Optimizado específicamente para sistemas de Q&A." },
    { value: "FACT_VERIFICATION", label: "Verificación de Hechos", desc: "Ideal para comprobar la veracidad de afirmaciones contra tus documentos." },
    { value: "CODE_RETRIEVAL_QUERY", label: "Búsqueda de Código", desc: "Si tus documentos contienen código de programación." },
    { value: "SEMANTIC_SIMILARITY", label: "Similitud Semántica", desc: "Para encontrar documentos que 'significan lo mismo' (Simétrico)." },
    { value: "CLASSIFICATION", label: "Clasificación", desc: "Para sistemas que categorizan texto." },
    { value: "CLUSTERING", label: "Agrupamiento (Clustering)", desc: "Para organizar documentos por temas." },
    // RETRIEVAL_DOCUMENT no se muestra porque es el tipo 'pasivo' para la ingesta en modos asimétricos
];

export default function Settings() {
    const { config, refreshConfig, isLoading } = useRagSettings();
    const toast = useAppToast();
    
    const [selectedDim, setSelectedDim] = useState<number>(768);
    const [selectedTask, setSelectedTask] = useState<TaskType>("RETRIEVAL_QUERY");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (config) {
            setSelectedDim(config.embedding_dimension);
            // Si la config viene como RETRIEVAL_DOCUMENT (porque es nueva o por error), la mostramos como QUERY para que tenga sentido en la UI
            setSelectedTask(config.embedding_task_type === "RETRIEVAL_DOCUMENT" ? "RETRIEVAL_QUERY" : config.embedding_task_type);
        }
    }, [config]);

    const handleSave = async () => {
        if (!config) return;
        
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
            await refreshConfig();
            toast.success("Configuración actualizada. Sincronización iniciada.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la configuración.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <p>Cargando configuración...</p>
            </div>
        );
    }

    if (!config && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-full text-red-500">
                    <Warning size={48} />
                </div>
                <h2 className="text-xl font-bold text-white">Error de conexión</h2>
                <button onClick={refreshConfig} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2">
                    <ArrowClockwise size={20} weight="bold"/> Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-gray-700 to-gray-600 p-3 rounded-xl shadow-lg">
                    <Gear size={32} weight="fill" className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configuración del Motor RAG</h1>
                    <p className="text-gray-400 mt-1">Ajusta los parámetros del modelo de embeddings de Google Gemini.</p>
                </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database size={24} className="text-blue-400" />
                        Parámetros de Vectorización
                    </h2>
                </div>
                
                <div className="p-8 space-y-8">
                    {/* DIMENSIÓN */}
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
                                    Define el tamaño de los vectores. <span className="text-green-400 font-medium"> 768 es el estándar recomendado.</span>
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
                    </section>

                    <div className="h-px bg-gray-700" />

                    {/* TASK TYPE */}
                    <section className="space-y-4">
                        <div>
                            <label className="text-lg font-semibold text-white flex items-center gap-2">
                                <Brain size={24} className="text-purple-400" />
                                Intención de Búsqueda (Task Type)
                            </label>
                            <p className="text-sm text-gray-400 mt-1">
                                Selecciona cómo vas a <strong>usar</strong> el sistema. El backend ajustará automáticamente la ingesta de documentos.
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
                        
                        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-600 text-xs text-gray-400">
                            <p>
                                <Info className="inline mr-1" /> Nota: Al seleccionar <strong>{selectedTask}</strong>, los documentos nuevos se indexarán automáticamente como 
                                <span className="font-mono text-purple-300 ml-1">
                                    {["SEMANTIC_SIMILARITY", "CLASSIFICATION", "CLUSTERING"].includes(selectedTask) ? selectedTask : "RETRIEVAL_DOCUMENT"}
                                </span>.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="p-6 bg-gray-900 border-t border-gray-700 flex justify-end items-center gap-4">
                    <button 
                        onClick={() => { setSelectedDim(config!.embedding_dimension); setSelectedTask(config!.embedding_task_type === "RETRIEVAL_DOCUMENT" ? "RETRIEVAL_QUERY" : config!.embedding_task_type); }}
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
        </div>
    );
}