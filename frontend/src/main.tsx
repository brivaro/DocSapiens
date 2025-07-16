import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Importa las herramientas necesarias de React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Crea una instancia del cliente de Query
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Envuelve toda tu aplicación <App /> con el Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)