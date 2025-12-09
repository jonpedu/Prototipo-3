import React from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainWorkspace } from './components/layout/MainWorkspace';
import { BottomBar } from './components/layout/BottomBar';
import { NotificationContainer } from './components/ui/NotificationContainer';

// ============================================================================
// APP - Componente raiz da aplicação ORBITA
// ============================================================================

function App() {
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-950">
            {/* Notificações Toast */}
            <NotificationContainer />

            {/* Header */}
            <Header />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Workspace (Blockly) */}
                <MainWorkspace />
            </div>

            {/* Bottom Bar */}
            <BottomBar />
        </div>
    );
}

export default App;
