/**
 * ORBITA - Aplicação Principal
 */

import React from 'react';
import { Toolbar } from './components/layout/Toolbar';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { Inspector } from './components/layout/Inspector';
import { Console } from './components/layout/Console';

const App: React.FC = () => {
    return (
        <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
            {/* Toolbar */}
            <Toolbar />

            {/* Main Content */}
            <div className="flex-grow flex overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Canvas */}
                <div className="flex-grow flex flex-col">
                    <Canvas />
                    <Console />
                </div>

                {/* Inspector */}
                <Inspector />
            </div>
        </div>
    );
};

export default App;
