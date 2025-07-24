// client/src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import useSocket from './useSocket';

const useNotifications = () => {
  // Estados
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Referencias para evitar llamadas duplicadas
  const loadingRef = useRef(false);
  const initialLoadRef = useRef(false);
  
  // Obtener información del usuario autenticado
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  // Hook de Socket.io
  const { socket, on, off, emit } = useSocket();

  // 🔔 Cargar notificaciones desde la API
  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (loadingRef.current || !isAuthenticated) return;
    
    try {
      loadingRef.current = true;
      
      const response = await axios.get(`/api/notifications?page=${pageNum}&limit=20`);
      
      if (response.data.success) {
        const { notifications: newNotifications, unreadCount: newUnreadCount, pagination } = response.data.data;
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setUnreadCount(newUnreadCount);
        setHasMore(pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [isAuthenticated]);

  // 📥 Cargar más notificaciones (paginación)
  const loadMoreNotifications = useCallback(() => {
    if (hasMore && !loadingRef.current) {
      loadNotifications(page + 1, true);
    }
  }, [page, hasMore, loadNotifications]);

  // ✅ Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await axios.put(`/api/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Actualizar localmente
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        
        // Reducir contador si la notificación no estaba leída
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Emitir evento de socket para actualizar en tiempo real
        if (socket) {
          emit('mark_notification_read', { notificationId });
        }
      }
    } catch (error) {
      console.error('Error marcando como leída:', error);
      toast.error('Error al marcar notificación');
    }
  }, [socket, emit]);

  // ✅ Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.put('/api/notifications/mark-all-read');
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            read: true, 
            readAt: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      toast.error('Error al marcar notificaciones');
    }
  }, []);

  // 🗑️ Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`);
      
      if (response.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        // Reducir contador si la notificación no estaba leída
        const notification = notifications.find(n => n._id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast.success('Notificación eliminada');
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      toast.error('Error al eliminar notificación');
    }
  }, [notifications]);

  // 🧹 Limpiar notificaciones leídas
  const clearReadNotifications = useCallback(async () => {
    try {
      const response = await axios.delete('/api/notifications/clear-read');
      
      if (response.data.success) {
        setNotifications(prev => prev.filter(n => !n.read));
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
      toast.error('Error al limpiar notificaciones');
    }
  }, []);

  // 🔄 Refrescar notificaciones
  const refreshNotifications = useCallback(() => {
    setPage(1);
    setHasMore(true);
    loadNotifications(1, false);
  }, [loadNotifications]);

  // 🔔 Mostrar toast para nuevas notificaciones
  const showNotificationToast = useCallback((notification) => {
    const toastConfig = {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '12px 16px'
      }
    };

    switch (notification.priority) {
      case 'urgent':
        toast.error(notification.message, { 
          ...toastConfig, 
          duration: 8000,
          style: { ...toastConfig.style, borderColor: '#dc3545' }
        });
        break;
      case 'high':
        toast(notification.message, { 
          ...toastConfig,
          icon: '⚠️',
          style: { ...toastConfig.style, borderColor: '#ffc107' }
        });
        break;
      case 'low':
        toast(notification.message, { 
          ...toastConfig,
          duration: 3000,
          icon: 'ℹ️'
        });
        break;
      default:
        toast.success(notification.message, toastConfig);
    }
  }, []);

  // 🎧 Configurar listeners de Socket.io
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Listener para nuevas notificaciones
    const handleNewNotification = (notification) => {
      console.log('🔔 Nueva notificación recibida:', notification);
      
      // Agregar a la lista local
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mostrar toast
      showNotificationToast(notification);
      
      // Actualizar el título del documento para mostrar contador
      updateDocumentTitle(unreadCount + 1);
    };

    // Listener para actualizaciones del contador
    const handleCountUpdated = ({ count }) => {
      console.log('📊 Contador actualizado:', count);
      setUnreadCount(count);
      updateDocumentTitle(count);
    };

    // Listener para notificaciones de comentarios
    const handleNewComment = (data) => {
      // Si es un comentario en una tarea que estamos viendo, mostrar toast
      toast(`💬 ${data.comment.user.name} comentó en una tarea`);
    };

    // Registrar listeners
    on('new_notification', handleNewNotification);
    on('notification_count_updated', handleCountUpdated);
    on('new_comment', handleNewComment);

    // Solicitar contador inicial
    emit('request_notification_count');

    // Cleanup
    return () => {
      off('new_notification', handleNewNotification);
      off('notification_count_updated', handleCountUpdated);
      off('new_comment', handleNewComment);
    };
  }, [socket, isAuthenticated, on, off, emit, showNotificationToast, unreadCount]);

  // 📋 Actualizar título del documento con contador
  const updateDocumentTitle = useCallback((count) => {
    const baseTitle = 'Planifica+ Gestor';
    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, []);

  // 🚀 Carga inicial
  useEffect(() => {
    if (isAuthenticated && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadNotifications(1, false);
    }
  }, [isAuthenticated, loadNotifications]);

  // 🧹 Limpiar título al desmontar
  useEffect(() => {
    return () => {
      document.title = 'Planifica+ Gestor';
    };
  }, []);

  // 🔔 Solicitar permisos de notificaciones del navegador
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // 📱 Mostrar notificación del navegador
  const showBrowserNotification = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      
      // Auto cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    }
    return null;
  }, []);

  // 🧪 Crear notificación de prueba (solo desarrollo)
  const createTestNotification = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const response = await axios.post('/api/notifications/test', {
          title: 'Notificación de prueba',
          message: 'Esta es una notificación de prueba del sistema',
          type: 'system'
        });
        
        if (response.data.success) {
          toast.success('Notificación de prueba creada');
        }
      } catch (error) {
        console.error('Error creando notificación de prueba:', error);
        toast.error('Error al crear notificación de prueba');
      }
    }
  }, []);

  return {
    // Estados
    notifications,
    unreadCount,
    loading,
    hasMore,
    
    // Acciones
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refreshNotifications,
    
    // Notificaciones del navegador
    requestNotificationPermission,
    showBrowserNotification,
    
    // Desarrollo
    createTestNotification
  };
};

export default useNotifications;