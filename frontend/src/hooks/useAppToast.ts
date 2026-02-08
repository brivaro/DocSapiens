import toast from 'react-hot-toast';
import { useContext } from 'react';
import { NotificationsContext } from '../context/NotificationsContext';

export const useAppToast = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useAppToast must be used within NotificationsProvider");
  
  const { addNotification } = context;

  const success = (message: string) => {
    toast.success(message);
    addNotification(message, 'success');
  };

  const error = (message: string) => {
    toast.error(message);
    addNotification(message, 'error');
  };
  
  const info = (message: string) => {
    toast(message, { icon: 'ℹ️' });
    addNotification(message, 'info');
  };

  const loading = (message: string) => toast.loading(message);
  const dismiss = (id?: string) => toast.dismiss(id);

  return { success, error, info, loading, dismiss };
};