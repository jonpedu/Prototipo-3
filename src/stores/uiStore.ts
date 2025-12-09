import { create } from 'zustand';
import type { ViewMode, PanelTab, Notification } from '../types';

// ============================================================================
// UI STORE - Gerencia estado da interface do usuário
// ============================================================================

interface UIState {
    // View State
    viewMode: ViewMode;
    activePanel: PanelTab;
    isSidebarCollapsed: boolean;
    isCodeInspectorVisible: boolean;
    isModulePickerOpen: boolean;
    isPinSelectorOpen: boolean;
    selectedModuleId: string | null;

    // Modal/Dialog State
    isNewProjectModalOpen: boolean;
    isExportModalOpen: boolean;
    isImportModalOpen: boolean;
    isSettingsModalOpen: boolean;

    // Notifications
    notifications: Notification[];

    // Actions
    setViewMode: (mode: ViewMode) => void;
    setActivePanel: (panel: PanelTab) => void;
    toggleSidebar: () => void;
    toggleCodeInspector: () => void;
    openModulePicker: () => void;
    closeModulePicker: () => void;
    openPinSelector: (moduleId: string) => void;
    closePinSelector: () => void;

    // Modal Actions
    openModal: (modal: 'newProject' | 'export' | 'import' | 'settings') => void;
    closeModal: (modal: 'newProject' | 'export' | 'import' | 'settings') => void;

    // Notification Actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    // Estado inicial
    viewMode: 'blocks',
    activePanel: 'modules',
    isSidebarCollapsed: false,
    isCodeInspectorVisible: false,
    isModulePickerOpen: false,
    isPinSelectorOpen: false,
    selectedModuleId: null,

    isNewProjectModalOpen: false,
    isExportModalOpen: false,
    isImportModalOpen: false,
    isSettingsModalOpen: false,

    notifications: [],

    // Actions
    setViewMode: (mode) => set({ viewMode: mode }),

    setActivePanel: (panel) => set({ activePanel: panel }),

    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    toggleCodeInspector: () => set((state) => ({ isCodeInspectorVisible: !state.isCodeInspectorVisible })),

    openModulePicker: () => set({ isModulePickerOpen: true }),

    closeModulePicker: () => set({ isModulePickerOpen: false }),

    openPinSelector: (moduleId) => set({ isPinSelectorOpen: true, selectedModuleId: moduleId }),

    closePinSelector: () => set({ isPinSelectorOpen: false, selectedModuleId: null }),

    // Modal Actions
    openModal: (modal) => {
        set({
            isNewProjectModalOpen: modal === 'newProject',
            isExportModalOpen: modal === 'export',
            isImportModalOpen: modal === 'import',
            isSettingsModalOpen: modal === 'settings',
        });
    },

    closeModal: (modal) => {
        set({
            isNewProjectModalOpen: modal === 'newProject' ? false : get().isNewProjectModalOpen,
            isExportModalOpen: modal === 'export' ? false : get().isExportModalOpen,
            isImportModalOpen: modal === 'import' ? false : get().isImportModalOpen,
            isSettingsModalOpen: modal === 'settings' ? false : get().isSettingsModalOpen,
        });
    },

    // Notification Actions
    addNotification: (notification) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
        };

        set((state) => ({
            notifications: [...state.notifications, newNotification],
        }));

        // Auto-remover após duração (padrão: 5 segundos)
        const duration = notification.duration || 5000;
        setTimeout(() => {
            get().removeNotification(id);
        }, duration);
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },

    clearNotifications: () => set({ notifications: [] }),
}));
