import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { Notification as NotificationType } from '../../types';

// ============================================================================
// NOTIFICATION SYSTEM - Sistema de notificações toast
// ============================================================================

const NotificationIcon: React.FC<{ type: NotificationType['type'] }> = ({ type }) => {
    const iconProps = { size: 20, className: 'flex-shrink-0' };

    switch (type) {
        case 'success':
            return <CheckCircle {...iconProps} className="text-green-400" />;
        case 'error':
            return <XCircle {...iconProps} className="text-red-400" />;
        case 'warning':
            return <AlertCircle {...iconProps} className="text-yellow-400" />;
        case 'info':
            return <Info {...iconProps} className="text-blue-400" />;
        default:
            return null;
    }
};

const NotificationItem: React.FC<{ notification: NotificationType }> = ({ notification }) => {
    const { removeNotification } = useUIStore();

    const typeStyles = {
        success: 'bg-green-900/20 border-green-500/50 text-green-100',
        error: 'bg-red-900/20 border-red-500/50 text-red-100',
        warning: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-100',
        info: 'bg-blue-900/20 border-blue-500/50 text-blue-100',
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-lg animate-slide-in-right ${typeStyles[notification.type]
                }`}
        >
            <NotificationIcon type={notification.type} />
            <p className="flex-1 text-sm font-medium">{notification.message}</p>
            <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
                aria-label="Fechar"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export const NotificationContainer: React.FC = () => {
    const { notifications } = useUIStore();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    <NotificationItem notification={notification} />
                </div>
            ))}
        </div>
    );
};
