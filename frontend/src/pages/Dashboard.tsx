import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    FileText, ChatCircleDots, HardDrives, Database,
    Lightning, Clock, CaretRight, CloudArrowUp 
} from 'phosphor-react';
import { useDocuments } from '../hooks/useDocuments';
import { useChatHistory } from '../hooks/useChatHistory';
import { useVectorStores } from '../hooks/useVectorStores';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { clsx } from 'clsx';

export default function Dashboard() {
    const { documents, isLoading: isLoadingDocs } = useDocuments();
    const { data: chatHistory, isLoading: isLoadingChat } = useChatHistory();
    const { vectorStores, isLoading: isLoadingStores } = useVectorStores();

    const stats = useMemo(() => {
        if (!documents) return null;
        const totalDocs = documents.length;
        const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0); 
        const processing = documents.filter(d => d.status === 'processing' || d.status === 'pending').length;
        return { totalDocs, totalChunks, processing };
    }, [documents]);

    const recentActivity = useMemo(() => {
        const activity: any[] = [];
        if (documents) {
            documents.slice(0, 3).forEach(doc => {
                activity.push({
                    id: doc.id,
                    type: 'document',
                    title: doc.filename,
                    date: doc.uploaded_at,
                    status: doc.status
                });
            });
        }
        if (chatHistory?.history) {
            chatHistory.history.slice(0, 3).forEach(chat => {
                activity.push({
                    id: chat.id,
                    type: 'chat',
                    title: chat.questions[0],
                    date: null,
                });
            });
        }
        return activity;
    }, [documents, chatHistory]);

    const isLoading = isLoadingDocs || isLoadingChat || isLoadingStores;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Hola, Admin
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                        Tu base de conocimiento está {(stats?.processing || 0) > 0 ? 'procesando información...' : 'lista para consultas.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/documents" className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 border border-gray-700">
                        <CloudArrowUp size={20} /> Subir
                    </Link>
                    <Link to="/chat" className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <ChatCircleDots size={20} weight="fill" /> Nuevo Chat
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Documentos" value={stats?.totalDocs} icon={FileText} color="text-blue-400" bg="bg-blue-500/10" loading={isLoading} />
                <StatCard title="Fragmentos" value={stats?.totalChunks} icon={Database} color="text-purple-400" bg="bg-purple-500/10" loading={isLoading} />
                
                {/* CAMBIO: Ahora mostramos número de Colecciones */}
                <StatCard 
                    title="Colecciones" 
                    value={vectorStores?.length || 0} 
                    icon={HardDrives} 
                    color="text-green-400" 
                    bg="bg-green-500/10" 
                    loading={isLoading}
                />
                
                <StatCard title="Cola de Proceso" value={stats?.processing} icon={Lightning} color="text-yellow-400" bg="bg-yellow-500/10" loading={isLoading} urgent={(stats?.processing || 0) > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock size={24} className="text-gray-400" /> Actividad Reciente
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {isLoading ? (
                            [1, 2, 3].map(i => <SkeletonLoader key={i} className="h-16 w-full rounded-xl" />)
                        ) : recentActivity.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No hay actividad reciente.</div>
                        ) : (
                            recentActivity.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors group">
                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shadow-lg", item.type === 'document' ? 'bg-blue-900/50 text-blue-400' : 'bg-purple-900/50 text-purple-400')}>
                                        {item.type === 'document' ? <FileText size={20} weight="fill"/> : <ChatCircleDots size={20} weight="fill"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">{item.title || "Sin título"}</h4>
                                        <p className="text-xs text-gray-500">{item.type === 'document' ? 'Documento subido' : 'Conversación iniciada'} {item.date && ` • ${new Date(item.date).toLocaleDateString()}`}</p>
                                    </div>
                                    {item.status && (
                                        <span className={clsx("text-xs px-2 py-1 rounded-full font-bold uppercase", item.status === 'processed' ? "bg-green-900/30 text-green-400" : item.status === 'processing' ? "bg-yellow-900/30 text-yellow-400 animate-pulse" : "bg-gray-700 text-gray-400")}>
                                            {item.status}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">💡 DocSapiens Tips</h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                            Organiza tus documentos en <strong>Colecciones</strong> separadas por temática para mejorar la precisión de las respuestas.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Link to="/collections" className="block w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 text-sm text-gray-300 flex justify-between items-center transition-all hover:translate-x-1">
                            Gestionar Colecciones <CaretRight />
                        </Link>
                        <Link to="/documents" className="block w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 text-sm text-gray-300 flex justify-between items-center transition-all hover:translate-x-1">
                            Subir Documentos <CaretRight />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, loading, suffix, urgent }: any) {
    return (
        <div className={clsx("bg-gray-800 p-6 rounded-2xl border transition-all duration-300 shadow-lg group", urgent ? "border-yellow-500/50 shadow-yellow-500/10" : "border-gray-700 hover:border-gray-600")}>
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-xl", bg)}><Icon size={24} weight="duotone" className={color} /></div>
                {urgent && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                {loading ? <SkeletonLoader className="h-8 w-24 mt-1" /> : <h3 className="text-3xl font-bold text-white mt-1">{value} <span className="text-lg text-gray-500 font-normal">{suffix}</span></h3>}
            </div>
        </div>
    );
}