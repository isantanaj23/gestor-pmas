// client/src/components/project-tabs/ProjectCommunication.js - VERSIÓN COMPLETA

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import API from '../../services/api';

const ProjectCommunication = ({ projectId, project }) => {
  const { user, token } = useAuth();
  const { 
    socket, 
    connected: socketConnected, 
    joinProject, 
    leaveProject, 
    emit, 
    on, 
    off,
    getProjectOnlineUsers,
    requestProjectOnlineUsers
  } = useSocket();
  
  // =================================================================
  // 🏠 ESTADOS PRINCIPALES
  // =================================================================
  
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 👥 Estados para gestión de miembros
  const [projectMembers, setProjectMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [channelMembers, setChannelMembers] = useState(new Map()); // channelId -> Array de miembros
  
  // 🔔 Estados para notificaciones
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  
  // 🎭 Estados para modales
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showChannelMembersModal, setShowChannelMembersModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [selectedChannelForMembers, setSelectedChannelForMembers] = useState(null);
  
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  
  // 📚 Referencias
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeChannelRef = useRef(null);

  // =================================================================
  // 🎨 SISTEMA DE NOTIFICACIONES ELEGANTES
  // =================================================================

  const showNotification = (type, title, message, color = 'primary') => {
    const event = new CustomEvent('show-notification', {
      detail: { 
        type, 
        title, 
        message, 
        icon: type === 'success' ? 'bi-check-circle' : 
              type === 'error' ? 'bi-x-circle-fill' : 
              type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill',
        color,
        duration: type === 'error' ? 6000 : 4000
      }
    });
    window.dispatchEvent(event);
  };

  // =================================================================
  // 📜 FUNCIÓN DE SCROLL INTELIGENTE
  // =================================================================

  const scrollToBottom = (force = false) => {
    setTimeout(() => {
      if (messagesEndRef.current && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        
        if (force || isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  // =================================================================
  // 🔌 CONFIGURACIÓN DE SOCKET.IO
  // =================================================================

  useEffect(() => {
    if (!projectId || !socketConnected || !socket) return;

    console.log('🏠 PROJECT COMMUNICATION: Configurando Socket.IO para proyecto:', projectId);
    
    // Unirse al proyecto
    joinProject(projectId);
    
    // Solicitar usuarios en línea
    setTimeout(() => {
      requestProjectOnlineUsers(projectId);
    }, 1000);

    // =================================================================
    // 👥 LISTENERS PARA USUARIOS EN LÍNEA
    // =================================================================

    const handleProjectOnlineUsers = (data) => {
      console.log('👥 PROJECT COMMUNICATION: Usuarios en línea actualizados:', data);
      if (data.detail.projectId === projectId) {
        setOnlineUsers(data.detail.users || []);
      }
    };

    const handleUserJoinedProject = (data) => {
      console.log('👋 PROJECT COMMUNICATION: Usuario se unió:', data);
      if (data.detail.projectId === projectId) {
        // Agregar mensaje de actividad
        const activityMessage = {
          id: Date.now(),
          _id: `activity_${Date.now()}`,
          sender: { name: 'Sistema', _id: 'system' },
          content: `${data.detail.userName} se conectó al proyecto`,
          createdAt: new Date(),
          type: 'activity'
        };
        setMessages(prev => [...prev, activityMessage]);
        
        // Actualizar usuarios en línea
        setOnlineUsers(prev => {
          const exists = prev.some(u => u.userId === data.detail.userId);
          if (!exists) {
            return [...prev, {
              userId: data.detail.userId,
              userName: data.detail.userName,
              userRole: data.detail.userRole,
              isOnline: true,
              connectedAt: new Date()
            }];
          }
          return prev;
        });
      }
    };

    const handleUserLeftProject = (data) => {
      console.log('👋 PROJECT COMMUNICATION: Usuario salió:', data);
      if (data.detail.projectId === projectId) {
        // Agregar mensaje de actividad
        const activityMessage = {
          id: Date.now(),
          _id: `activity_${Date.now()}`,
          sender: { name: 'Sistema', _id: 'system' },
          content: `${data.detail.userName} se desconectó del proyecto`,
          createdAt: new Date(),
          type: 'activity'
        };
        setMessages(prev => [...prev, activityMessage]);
        
        // Actualizar usuarios en línea
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.detail.userId));
      }
    };

    // =================================================================
    // 📨 LISTENERS PARA MENSAJES
    // =================================================================

    const handleNewMessageGlobal = (data) => {
      console.log('📨 PROJECT COMMUNICATION: Nuevo mensaje global:', data);
      
      if (data.detail.projectId === projectId) {
        const { channelId, message } = data.detail;
        const currentActiveChannel = activeChannelRef.current;
        
        const isFromActiveChannel = String(channelId) === String(currentActiveChannel?._id);
        const isFromSelf = String(message.sender?._id) === String(user?.id);
        
        if (isFromActiveChannel && currentActiveChannel) {
          // Agregar mensaje al canal activo
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg._id === message._id);
            if (!messageExists) {
              const newMessages = [...prevMessages, {
                ...message,
                _id: message._id || `temp_${Date.now()}`,
                createdAt: message.createdAt || new Date(),
                sender: message.sender || { name: 'Usuario', _id: 'unknown' }
              }];
              scrollToBottom(false);
              return newMessages;
            }
            return prevMessages;
          });
        } else if (!isFromSelf) {
          // Incrementar contador para otros canales
          updateUnreadCount(channelId, true, 1);
          
          // Mostrar notificación elegante
          const channelName = channels.find(ch => ch._id === channelId)?.name || 'Canal';
          showNotification(
            'info', 
            `Nuevo mensaje en #${channelName}`, 
            `${message.sender?.name}: ${message.content?.substring(0, 50)}${message.content?.length > 50 ? '...' : ''}`,
            'info'
          );
        }
      }
    };

    // =================================================================
    // 🏗️ LISTENERS PARA CANALES
    // =================================================================

    const handleChannelCreated = (data) => {
      if (data.detail.projectId === projectId) {
        console.log('📢 PROJECT COMMUNICATION: Nuevo canal:', data);
        setChannels(prev => {
          const exists = prev.some(ch => ch._id === data.detail.channel._id);
          if (!exists) {
            showNotification(
              'success', 
              'Nuevo canal creado', 
              `El canal #${data.detail.channel.name} fue creado por ${data.detail.createdBy.name}`,
              'success'
            );
            return [data.detail.channel, ...prev];
          }
          return prev;
        });
      }
    };

    // =================================================================
    // 👥 LISTENERS PARA GESTIÓN DE MIEMBROS
    // =================================================================

    const handleMemberRemovedFromProject = (data) => {
      console.log('🚫 PROJECT COMMUNICATION: Miembro removido del proyecto:', data);
      if (data.detail.projectId === projectId) {
        // Actualizar lista de miembros
        setProjectMembers(prev => prev.filter(member => member._id !== data.detail.removedMemberId));
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.detail.removedMemberId));
        
        // Mensaje de actividad
        const activityMessage = {
          id: Date.now(),
          _id: `activity_${Date.now()}`,
          sender: { name: 'Sistema', _id: 'system' },
          content: `Un miembro fue removido del proyecto por ${data.detail.removedBy.name}`,
          createdAt: new Date(),
          type: 'activity'
        };
        setMessages(prev => [...prev, activityMessage]);
        
        showNotification(
          'warning', 
          'Miembro removido', 
          `Un miembro fue eliminado del proyecto por ${data.detail.removedBy.name}`,
          'warning'
        );
      }
    };

    const handleRemovedFromProject = (data) => {
      console.log('🚫 PROJECT COMMUNICATION: Fuiste removido del proyecto:', data);
      showNotification(
        'error', 
        'Removido del proyecto', 
        `Has sido eliminado del proyecto "${data.detail.projectName}" por ${data.detail.removedBy}. Razón: ${data.detail.reason}`,
        'danger'
      );
      
      // Redirigir después de un delay
      setTimeout(() => {
        window.location.href = '/projects';
      }, 5000);
    };

    const handleMemberAddedToChannel = (data) => {
      console.log('➕ PROJECT COMMUNICATION: Miembro agregado al canal:', data);
      if (data.detail.channelId === activeChannel?._id) {
        // Actualizar miembros del canal activo
        loadChannelMembers(activeChannel._id);
      }
    };

    const handleMemberRemovedFromChannel = (data) => {
      console.log('➖ PROJECT COMMUNICATION: Miembro removido del canal:', data);
      if (data.detail.channelId === activeChannel?._id) {
        // Actualizar miembros del canal activo
        loadChannelMembers(activeChannel._id);
      }
    };

    const handleRemovedFromChannel = (data) => {
      console.log('🚫 PROJECT COMMUNICATION: Fuiste removido del canal:', data);
      showNotification(
        'warning', 
        'Removido del canal', 
        `Has sido removido del canal por ${data.detail.removedBy}. Razón: ${data.detail.reason}`,
        'warning'
      );
      
      // Si estás en ese canal, cambiar al general
      if (data.detail.channelId === activeChannel?._id) {
        const generalChannel = channels.find(ch => ch.name.toLowerCase() === 'general');
        if (generalChannel) {
          switchToChannel(generalChannel);
        }
      }
    };

    // Registrar event listeners
    window.addEventListener('projectOnlineUsers', handleProjectOnlineUsers);
    window.addEventListener('userJoinedProject', handleUserJoinedProject);
    window.addEventListener('userLeftProject', handleUserLeftProject);
    window.addEventListener('newMessageGlobal', handleNewMessageGlobal);
    window.addEventListener('channelCreated', handleChannelCreated);
    window.addEventListener('memberRemovedFromProject', handleMemberRemovedFromProject);
    window.addEventListener('removedFromProject', handleRemovedFromProject);
    window.addEventListener('memberAddedToChannel', handleMemberAddedToChannel);
    window.addEventListener('memberRemovedFromChannel', handleMemberRemovedFromChannel);
    window.addEventListener('removedFromChannel', handleRemovedFromChannel);

    return () => {
      // Limpiar event listeners
      window.removeEventListener('projectOnlineUsers', handleProjectOnlineUsers);
      window.removeEventListener('userJoinedProject', handleUserJoinedProject);
      window.removeEventListener('userLeftProject', handleUserLeftProject);
      window.removeEventListener('newMessageGlobal', handleNewMessageGlobal);
      window.removeEventListener('channelCreated', handleChannelCreated);
      window.removeEventListener('memberRemovedFromProject', handleMemberRemovedFromProject);
      window.removeEventListener('removedFromProject', handleRemovedFromProject);
      window.removeEventListener('memberAddedToChannel', handleMemberAddedToChannel);
      window.removeEventListener('memberRemovedFromChannel', handleMemberRemovedFromChannel);
      window.removeEventListener('removedFromChannel', handleRemovedFromChannel);
      
      // Salir del proyecto
      leaveProject(projectId);
    };
  }, [projectId, socketConnected, socket, user?.id, channels, activeChannel]);

  // Sincronizar activeChannel con referencia
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // =================================================================
  // 📊 CARGAR DATOS INICIALES
  // =================================================================

  // Cargar miembros del proyecto
  const loadProjectMembers = async () => {
    if (!projectId) return;

    try {
      const response = await API.get(`/projects/${projectId}`);
      
      if (response.data?.data) {
        const projectData = response.data.data;
        const members = [
          // Owner
          ...(projectData.owner ? [{
            _id: projectData.owner._id,
            name: projectData.owner.name,
            email: projectData.owner.email,
            role: 'owner',
            isOwner: true,
            canBeRemoved: false
          }] : []),
          // Team members
          ...(projectData.team || []).map(member => ({
            _id: member.user?._id || member._id,
            name: member.user?.name || member.name,
            email: member.user?.email || member.email,
            role: member.role || 'member',
            isOwner: false,
            canBeRemoved: projectData.owner?._id === user?.id
          }))
        ];
        
        setProjectMembers(members);
        console.log('👥 Miembros del proyecto cargados:', members.length);
      }
      
    } catch (error) {
      console.error('❌ Error cargando miembros:', error);
      showNotification('error', 'Error', 'No se pudieron cargar los miembros del proyecto', 'danger');
    }
  };

  // Cargar canales del proyecto
  const loadChannels = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get(`/channels/project/${projectId}`);
      
      if (response.data?.success) {
        const channelData = response.data.data || [];
        setChannels(channelData);
        
        // Seleccionar canal general o el primero disponible
        if (channelData.length > 0 && !activeChannel) {
          const generalChannel = channelData.find(ch => ch.name.toLowerCase() === 'general') || channelData[0];
          await switchToChannel(generalChannel);
        }
        
        console.log('💬 Canales cargados:', channelData.length);
      }
      
    } catch (error) {
      console.error('❌ Error cargando canales:', error);
      setError(`Error cargando canales: ${error.response?.data?.message || error.message}`);
      showNotification('error', 'Error', 'No se pudieron cargar los canales', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes de un canal
  const loadMessages = async (channelId) => {
    if (!channelId) return;

    try {
      const response = await API.get(`/messages/channel/${channelId}`);
      
      if (response.data?.success) {
        const messageData = response.data.data || [];
        setMessages(messageData);
        scrollToBottom(true);
        console.log('📨 Mensajes cargados:', messageData.length);
      }
      
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      showNotification('error', 'Error', 'No se pudieron cargar los mensajes', 'danger');
    }
  };

  // Cargar miembros de un canal específico
  const loadChannelMembers = async (channelId) => {
    if (!channelId) return;

    try {
      const response = await API.get(`/channels/${channelId}/members`);
      
      if (response.data?.success) {
        const members = response.data.data || [];
        setChannelMembers(prev => new Map(prev.set(channelId, members)));
        console.log('👥 Miembros del canal cargados:', members.length);
      }
      
    } catch (error) {
      console.error('❌ Error cargando miembros del canal:', error);
      // No mostrar notificación para este error, es menos crítico
    }
  };

  // =================================================================
  // 🔄 ACCIONES PRINCIPALES
  // =================================================================

  // Cambiar a un canal
  const switchToChannel = async (channel) => {
    console.log('🔄 PROJECT COMMUNICATION: Cambiando a canal:', channel.name);
    
    // Limpiar contador del canal anterior
    if (activeChannel) {
      clearChannelUnread(activeChannel._id);
    }
    
    setActiveChannel(channel);
    activeChannelRef.current = channel;
    await loadMessages(channel._id);
    await loadChannelMembers(channel._id);
    
    // Limpiar contador del nuevo canal
    clearChannelUnread(channel._id);
    
    // Notificar al socket
    if (socket && socketConnected) {
      emit('join_channel', channel._id);
    }
  };

  // Enviar mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await API.post('/messages', {
        content: messageContent,
        channelId: activeChannel._id
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error enviando mensaje');
      }
      
      console.log('✅ Mensaje enviado exitosamente');
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      setNewMessage(messageContent); // Restaurar mensaje
      showNotification('error', 'Error', `No se pudo enviar el mensaje: ${error.message}`, 'danger');
    }
  };

  // Crear nuevo canal
  const createChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannelData.name.trim()) {
      showNotification('warning', 'Atención', 'El nombre del canal es requerido', 'warning');
      return;
    }

    try {
      const response = await API.post('/channels', {
        name: newChannelData.name.trim(),
        description: newChannelData.description.trim() || `Canal ${newChannelData.name}`,
        projectId,
        isPrivate: newChannelData.isPrivate
      });
      
      if (response.data?.success) {
        setShowCreateChannelModal(false);
        setNewChannelData({ name: '', description: '', isPrivate: false });
        showNotification('success', 'Canal creado', `El canal #${newChannelData.name} fue creado exitosamente`, 'success');
        
        // Recargar canales después de un delay
        setTimeout(() => loadChannels(), 500);
      }
      
    } catch (error) {
      console.error('❌ Error creando canal:', error);
      showNotification('error', 'Error', `No se pudo crear el canal: ${error.response?.data?.message || error.message}`, 'danger');
    }
  };

  // =================================================================
  // 👥 GESTIÓN DE MIEMBROS
  // =================================================================

  // Verificar si el usuario actual puede gestionar miembros
  const canManageMembers = () => {
    const currentMember = projectMembers.find(member => member._id === user?.id);
    return currentMember && (currentMember.isOwner || currentMember.role === 'admin' || currentMember.role === 'manager');
  };

  // Iniciar eliminación de miembro
  const handleRemoveMember = (member) => {
    if (!canManageMembers()) {
      showNotification('warning', 'Sin permisos', 'No tienes permisos para eliminar miembros', 'warning');
      return;
    }

    if (member.isOwner) {
      showNotification('warning', 'No permitido', 'No puedes eliminar al propietario del proyecto', 'warning');
      return;
    }

    if (member._id === user?.id) {
      showNotification('warning', 'No permitido', 'No puedes eliminarte a ti mismo', 'warning');
      return;
    }

    setMemberToRemove(member);
    setShowRemoveMemberModal(true);
  };

  // Confirmar eliminación de miembro
  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      // Usar Socket.IO para eliminación en tiempo real
      if (socket && socketConnected) {
        emit('remove_project_member', {
          projectId,
          memberIdToRemove: memberToRemove._id,
          reason: removeReason
        });
      }
      
      // También hacer llamada REST API como respaldo
      const response = await API.delete(`/projects/${projectId}/members/${memberToRemove._id}`, {
        data: { reason: removeReason }
      });
      
      if (response.data?.success) {
        console.log('✅ Miembro removido exitosamente');
        showNotification('success', 'Miembro eliminado', `${memberToRemove.name} fue eliminado del proyecto`, 'success');
      }
      
      // Limpiar modal
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
      setRemoveReason('');
      
    } catch (error) {
      console.error('❌ Error eliminando miembro:', error);
      showNotification('error', 'Error', `No se pudo eliminar el miembro: ${error.response?.data?.message || error.message}`, 'danger');
    }
  };

  // Agregar miembro a canal
  const addMemberToChannel = async (channelId, memberId) => {
    if (!canManageMembers()) {
      showNotification('warning', 'Sin permisos', 'No tienes permisos para gestionar canales', 'warning');
      return;
    }

    try {
      if (socket && socketConnected) {
        emit('add_member_to_channel', {
          channelId,
          memberId,
          projectId
        });
      }
      
      const response = await API.post(`/channels/${channelId}/members`, {
        memberId
      });
      
      if (response.data?.success) {
        showNotification('success', 'Miembro agregado', 'Miembro agregado al canal exitosamente', 'success');
        await loadChannelMembers(channelId);
      }
      
    } catch (error) {
      console.error('❌ Error agregando miembro al canal:', error);
      showNotification('error', 'Error', `No se pudo agregar el miembro al canal: ${error.response?.data?.message || error.message}`, 'danger');
    }
  };

  // Remover miembro de canal
  const removeMemberFromChannel = async (channelId, memberId, reason = 'removed_from_channel') => {
    if (!canManageMembers()) {
      showNotification('warning', 'Sin permisos', 'No tienes permisos para gestionar canales', 'warning');
      return;
    }

    try {
      if (socket && socketConnected) {
        emit('remove_member_from_channel', {
          channelId,
          memberId,
          projectId,
          reason
        });
      }
      
      const response = await API.delete(`/channels/${channelId}/members/${memberId}`, {
        data: { reason }
      });
      
      if (response.data?.success) {
        showNotification('success', 'Miembro removido', 'Miembro removido del canal exitosamente', 'success');
        await loadChannelMembers(channelId);
      }
      
    } catch (error) {
      console.error('❌ Error removiendo miembro del canal:', error);
      showNotification('error', 'Error', `No se pudo remover el miembro del canal: ${error.response?.data?.message || error.message}`, 'danger');
    }
  };

  // =================================================================
  // 🔔 GESTIÓN DE NOTIFICACIONES
  // =================================================================

  const updateUnreadCount = (channelId, increment = true, count = 1) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      
      if (increment) {
        const currentCount = newCounts.get(channelId) || 0;
        newCounts.set(channelId, currentCount + count);
      } else {
        newCounts.delete(channelId);
      }
      
      return newCounts;
    });
  };

  const clearChannelUnread = async (channelId) => {
    updateUnreadCount(channelId, false);
    
    try {
      await API.post(`/messages/channel/${channelId}/mark-all-read`);
    } catch (error) {
      console.log('❌ Error marcando como leído:', error);
    }
  };

  // Calcular total no leídos
  useEffect(() => {
    const total = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
    setTotalUnread(total);
  }, [unreadCounts]);

  // =================================================================
  // 🎨 FUNCIONES DE UTILIDAD
  // =================================================================

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateAvatarUrl = (name) => {
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    const colors = ['28a745', 'dc3545', '007bff', 'ffc107', '6f42c1', '17a2b8'];
    const colorIndex = name?.length % colors.length || 0;
    return `https://placehold.co/32x32/${colors[colorIndex]}/white?text=${initial}`;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId && user.isOnline);
  };

  const getOnlineCount = () => {
    return onlineUsers.filter(user => user.isOnline).length;
  };

  const getCurrentChannelMembers = () => {
    return channelMembers.get(activeChannel?._id) || [];
  };

  // =================================================================
  // 🏁 INICIALIZACIÓN
  // =================================================================

  useEffect(() => {
    if (projectId && user && token) {
      loadChannels();
      loadProjectMembers();
    }
  }, [projectId, user?.id, token]);

  // =================================================================
  // 🎨 RENDERIZADO
  // =================================================================

  if (loading && channels.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando chat...</span>
          </div>
          <p className="text-muted">Cargando sistema de chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="communication-tab">
      {/* 📊 Header principal con estadísticas */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">
            <i className="bi bi-chat-left-dots-fill me-2 text-primary"></i>
            Chat del Proyecto
            {socketConnected ? (
              <span className="badge bg-success ms-2">
                <i className="bi bi-wifi"></i> En línea
              </span>
            ) : (
              <span className="badge bg-warning ms-2">
                <i className="bi bi-wifi-off"></i> Desconectado
              </span>
            )}
            {totalUnread > 0 && (
              <span className="badge bg-danger ms-2 pulse">
                <i className="bi bi-bell-fill"></i> {totalUnread} nuevos
              </span>
            )}
          </h5>
          <small className="text-muted">
            <i className="bi bi-building me-1"></i>
            {project?.name} • 
            <i className="bi bi-hash ms-2 me-1"></i>
            {channels.length} canales • 
            <span className="text-success ms-1">
              <i className="bi bi-circle-fill" style={{ fontSize: '8px' }}></i> 
              {getOnlineCount()} en línea
            </span>
          </small>
        </div>
        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={() => setShowMembersPanel(!showMembersPanel)}
            title="Ver miembros del proyecto"
          >
            <i className="bi bi-people-fill"></i> 
            <span className="badge bg-secondary ms-1">{projectMembers.length}</span>
          </button>
          {canManageMembers() && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowCreateChannelModal(true)}
              disabled={!projectId}
              title="Crear nuevo canal"
            >
              <i className="bi bi-plus-circle"></i> Canal
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ Error display */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row g-3">
        {/* 💬 Sidebar de Canales */}
        <div className="col-md-3">
          <div className="card h-100" style={{ minHeight: '500px' }}>
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <strong>
                <i className="bi bi-hash me-1"></i>
                Canales
              </strong>
              <span className="badge bg-primary">{channels.length}</span>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto' }}>
              {channels.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <i className="bi bi-chat-dots fs-1 d-block mb-3 opacity-50"></i>
                  <h6>No hay canales</h6>
                  <p className="small">Los canales aparecerán aquí una vez creados</p>
                  {canManageMembers() && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowCreateChannelModal(true)}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Crear canal
                    </button>
                  )}
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {channels.map((channel) => {
                    const unreadCount = unreadCounts.get(channel._id) || 0;
                    const isActive = activeChannel?._id === channel._id;
                    const channelMemberCount = channelMembers.get(channel._id)?.length || 0;
                    
                    return (
                      <button
                        key={channel._id}
                        className={`list-group-item list-group-item-action py-3 ${
                          isActive ? 'active' : ''
                        }`}
                        onClick={() => switchToChannel(channel)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1 min-width-0">
                            <div className="d-flex align-items-center mb-1">
                              <i className={`bi ${channel.isPrivate ? 'bi-lock-fill' : 'bi-hash'} me-2`}></i>
                              <strong className="text-truncate">{channel.name}</strong>
                              {unreadCount > 0 && !isActive && (
                                <span className="badge bg-danger rounded-pill ms-2 pulse">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <small className={`${isActive ? 'text-white-50' : 'text-muted'}`}>
                              <i className="bi bi-people me-1"></i>
                              {channelMemberCount} miembros
                            </small>
                          </div>
                          {isActive && canManageMembers() && (
                            <button
                              className="btn btn-sm btn-outline-light"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChannelForMembers(channel);
                                setShowChannelMembersModal(true);
                              }}
                              title="Gestionar miembros del canal"
                            >
                              <i className="bi bi-gear"></i>
                            </button>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 💻 Área Principal de Chat */}
        <div className={`col-md-${showMembersPanel ? '6' : '9'}`}>
          <div className="card h-100" style={{ minHeight: '500px' }}>
            {activeChannel ? (
              <>
                {/* 📋 Header del Chat */}
                <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
                  <div>
                    <h6 className="mb-0">
                      <i className={`bi ${activeChannel.isPrivate ? 'bi-lock-fill text-warning' : 'bi-hash text-primary'} me-2`}></i>
                      {activeChannel.name}
                    </h6>
                    <small className="text-muted">
                      <i className="bi bi-chat-text me-1"></i>
                      {messages.length} mensajes • 
                      <i className="bi bi-people me-1 ms-2"></i>
                      {getCurrentChannelMembers().length} miembros
                    </small>
                  </div>
                  <div className="d-flex align-items-center">
                    <small className={`badge ${socketConnected ? 'bg-success' : 'bg-warning'} me-2`}>
                      <i className={`bi ${socketConnected ? 'bi-wifi' : 'bi-wifi-off'}`}></i>
                      {socketConnected ? 'En vivo' : 'Desconectado'}
                    </small>
                    {canManageMembers() && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setSelectedChannelForMembers(activeChannel);
                          setShowChannelMembersModal(true);
                        }}
                        title="Gestionar miembros del canal"
                      >
                        <i className="bi bi-gear"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* 📨 Área de Mensajes */}
                <div 
                  ref={messagesContainerRef}
                  className="card-body flex-grow-1" 
                  style={{ 
                    height: '350px',
                    overflowY: 'auto',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-chat-text display-1 mb-3 opacity-25"></i>
                      <h6>Canal limpio</h6>
                      <p className="small">¡Sé el primero en enviar un mensaje en #{activeChannel.name}!</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message) => (
                        <div key={message._id} className="mb-3">
                          {message.type === 'activity' ? (
                            /* 🔔 Mensaje de actividad del sistema */
                            <div className="text-center my-3">
                              <small className="badge bg-secondary px-3 py-2">
                                <i className="bi bi-info-circle me-2"></i>
                                {message.content}
                              </small>
                            </div>
                          ) : (
                            /* 💬 Mensaje normal */
                            <div className="d-flex align-items-start">
                              <div className="position-relative me-3">
                                <img 
                                  src={generateAvatarUrl(message.sender?.name)}
                                  className="rounded-circle flex-shrink-0"
                                  style={{ width: '32px', height: '32px' }}
                                  alt={message.sender?.name}
                                />
                                {/* 🟢 Indicador de estado en línea */}
                                {isUserOnline(message.sender?._id) && (
                                  <span 
                                    className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                                    style={{ width: '10px', height: '10px' }}
                                    title="En línea"
                                  ></span>
                                )}
                              </div>
                              <div className="flex-grow-1 min-width-0">
                                <div className="d-flex align-items-baseline mb-1">
                                  <strong className="me-2 text-primary">
                                    {message.sender?.name || 'Usuario'}
                                  </strong>
                                  <small className="text-muted">
                                    {formatMessageTime(message.createdAt)}
                                  </small>
                                  {message.sender?._id === user?.id && (
                                    <small className="badge bg-light text-dark ms-2">Tú</small>
                                  )}
                                </div>
                                <div className="bg-white p-3 rounded-3 shadow-sm border">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* ✍️ Input de Mensaje */}
                <div className="card-footer bg-white border-top">
                  <form onSubmit={sendMessage}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Mensaje en #${activeChannel.name}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!socketConnected}
                        maxLength={1000}
                      />
                      <button 
                        className="btn btn-primary" 
                        type="submit"
                        disabled={!newMessage.trim() || !socketConnected}
                      >
                        <i className="bi bi-send-fill"></i>
                      </button>
                    </div>
                    {!socketConnected && (
                      <small className="text-warning mt-1 d-block">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Desconectado - Los mensajes no se enviarán
                      </small>
                    )}
                  </form>
                </div>
              </>
            ) : (
              /* 🔍 Estado sin canal seleccionado */
              <div className="d-flex align-items-center justify-content-center h-100">
                <div className="text-center text-muted">
                  <i className="bi bi-chat-square-dots display-1 mb-3 opacity-25"></i>
                  <h5>Selecciona un canal</h5>
                  <p>Elige un canal de la lista para comenzar a chatear</p>
                  {channels.length === 0 && canManageMembers() && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowCreateChannelModal(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Crear primer canal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 👥 Panel de Miembros del Proyecto */}
        {showMembersPanel && (
          <div className="col-md-3">
            <div className="card h-100" style={{ minHeight: '500px' }}>
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <strong>
                  <i className="bi bi-people-fill me-1"></i>
                  Miembros ({projectMembers.length})
                </strong>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowMembersPanel(false)}
                  title="Cerrar panel"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="card-body p-2" style={{ overflowY: 'auto' }}>
                {projectMembers.length === 0 ? (
                  <div className="text-center text-muted p-4">
                    <i className="bi bi-people fs-1 d-block mb-3 opacity-25"></i>
                    <h6>No hay miembros</h6>
                    <p className="small">Los miembros aparecerán aquí</p>
                  </div>
                ) : (
                  <div>
                    {/* 🟢 Sección de usuarios en línea */}
                    {getOnlineCount() > 0 && (
                      <div className="mb-3">
                        <h6 className="text-success small mb-2">
                          <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> 
                          En línea ({getOnlineCount()})
                        </h6>
                        {onlineUsers.filter(u => u.isOnline).map((onlineUser) => {
                          const member = projectMembers.find(m => m._id === onlineUser.userId);
                          if (!member) return null;
                          
                          const isCurrentUser = member._id === user?.id;
                          
                          return (
                            <div key={onlineUser.userId} className="d-flex align-items-center justify-content-between p-2 mb-1 bg-light rounded">
                              <div className="d-flex align-items-center flex-grow-1">
                                <div className="position-relative me-2">
                                  <img 
                                    src={generateAvatarUrl(member.name)}
                                    className="rounded-circle"
                                    style={{ width: '28px', height: '28px' }}
                                    alt={member.name}
                                  />
                                  <span 
                                    className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                                    style={{ width: '8px', height: '8px' }}
                                  ></span>
                                </div>
                                <div className="flex-grow-1 min-width-0">
                                  <div className="small fw-bold text-truncate">
                                    {member.name}
                                    {isCurrentUser && <span className="text-muted"> (Tú)</span>}
                                  </div>
                                  <div className="text-muted" style={{ fontSize: '11px' }}>
                                    {member.isOwner ? '👑 Propietario' : `📋 ${member.role || 'Miembro'}`}
                                  </div>
                                </div>
                              </div>
                              
                              {/* 🗑️ Botón para eliminar miembro */}
                              {canManageMembers() && !member.isOwner && !isCurrentUser && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveMember(member)}
                                  title="Eliminar del proyecto"
                                  style={{ fontSize: '11px', padding: '2px 6px' }}
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '11px' }}></i>
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <hr className="my-3" />
                      </div>
                    )}

                    {/* ⚫ Sección de usuarios fuera de línea */}
                    <div>
                      <h6 className="text-muted small mb-2">
                        <i className="bi bi-circle me-1" style={{ fontSize: '8px' }}></i> 
                        Fuera de línea ({projectMembers.length - getOnlineCount()})
                      </h6>
                      {projectMembers.filter(member => !isUserOnline(member._id)).map((member) => {
                        const isCurrentUser = member._id === user?.id;
                        
                        return (
                          <div key={member._id} className="d-flex align-items-center justify-content-between p-2 mb-1 rounded">
                            <div className="d-flex align-items-center flex-grow-1">
                              <div className="position-relative me-2">
                                <img 
                                  src={generateAvatarUrl(member.name)}
                                  className="rounded-circle"
                                  style={{ width: '28px', height: '28px', opacity: 0.6 }}
                                  alt={member.name}
                                />
                                <span 
                                  className="position-absolute bottom-0 end-0 bg-secondary border border-white rounded-circle"
                                  style={{ width: '8px', height: '8px' }}
                                ></span>
                              </div>
                              <div className="flex-grow-1 min-width-0">
                                <div className="small text-truncate" style={{ opacity: 0.7 }}>
                                  {member.name}
                                  {isCurrentUser && <span className="text-muted"> (Tú)</span>}
                                </div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {member.isOwner ? '👑 Propietario' : `📋 ${member.role || 'Miembro'}`}
                                </div>
                              </div>
                            </div>
                            
                            {/* 🗑️ Botón para eliminar miembro */}
                            {canManageMembers() && !member.isOwner && !isCurrentUser && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveMember(member)}
                                title="Eliminar del proyecto"
                                style={{ fontSize: '11px', padding: '2px 6px' }}
                              >
                                <i className="bi bi-trash" style={{ fontSize: '11px' }}></i>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================
          🎭 MODALES
          ================================================================= */}

      {/* 🆕 Modal para Crear Canal */}
      {showCreateChannelModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Nuevo Canal
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateChannelModal(false)}
                ></button>
              </div>
              <form onSubmit={createChannel}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-hash me-1"></i>
                      Nombre del canal
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={newChannelData.name}
                      onChange={(e) => setNewChannelData(prev => ({ 
                        ...prev, 
                        name: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                      }))}
                      placeholder="ej: general, desarrollo, diseño"
                      required
                      maxLength={50}
                    />
                    <div className="form-text">
                      Los nombres deben ser únicos y usar solo letras, números y guiones.
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-text-paragraph me-1"></i>
                      Descripción (opcional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newChannelData.description}
                      onChange={(e) => setNewChannelData(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      placeholder="Describe para qué es este canal..."
                      maxLength={200}
                    />
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isPrivateChannel"
                      checked={newChannelData.isPrivate}
                      onChange={(e) => setNewChannelData(prev => ({ 
                        ...prev, 
                        isPrivate: e.target.checked 
                      }))}
                    />
                    <label className="form-check-label" htmlFor="isPrivateChannel">
                      <i className="bi bi-lock me-1"></i>
                      Canal privado
                    </label>
                    <div className="form-text">
                      Los canales privados requieren invitación para unirse.
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateChannelModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newChannelData.name.trim()}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Crear Canal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Modal para Confirmar Eliminación de Miembro */}
      {showRemoveMemberModal && memberToRemove && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirmar Eliminación
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRemoveMemberModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>¿Estás seguro?</strong>
                  <p className="mb-0 mt-2">
                    Vas a eliminar a <strong>{memberToRemove.name}</strong> del proyecto.
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                
                <div className="alert alert-danger">
                  <h6><i className="bi bi-info-circle me-2"></i>Consecuencias:</h6>
                  <ul className="mb-0">
                    <li>Perderá acceso a todas las conversaciones</li>
                    <li>No podrá ver archivos del proyecto</li>
                    <li>Será removido de todos los canales</li>
                    <li>Sus tareas asignadas quedarán sin asignar</li>
                  </ul>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="removeReason" className="form-label">
                    <i className="bi bi-chat-text me-1"></i>
                    Razón (opcional):
                  </label>
                  <textarea
                    id="removeReason"
                    className="form-control"
                    rows="3"
                    placeholder="Explica por qué estás removiendo a este miembro..."
                    value={removeReason}
                    onChange={(e) => setRemoveReason(e.target.value)}
                    maxLength={500}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRemoveMemberModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmRemoveMember}
                >
                  <i className="bi bi-trash me-2"></i>
                  Eliminar Miembro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👥 Modal para Gestión de Miembros del Canal */}
      {showChannelMembersModal && selectedChannelForMembers && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-people me-2"></i>
                  Gestionar Miembros - #{selectedChannelForMembers.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChannelMembersModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Miembros actuales del canal */}
                  <div className="col-md-6">
                    <h6 className="text-primary">
                      <i className="bi bi-check-circle me-1"></i>
                      En el canal ({getCurrentChannelMembers().length})
                    </h6>
                    <div className="border rounded p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {getCurrentChannelMembers().length === 0 ? (
                        <div className="text-center text-muted p-3">
                          <i className="bi bi-people fs-4 d-block mb-2 opacity-50"></i>
                          <p className="small">No hay miembros en este canal</p>
                        </div>
                      ) : (
                        getCurrentChannelMembers().map((member) => (
                          <div key={member._id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                            <div className="d-flex align-items-center">
                              <img 
                                src={generateAvatarUrl(member.name)}
                                className="rounded-circle me-2"
                                style={{ width: '24px', height: '24px' }}
                                alt={member.name}
                              />
                              <div>
                                <div className="small fw-bold">{member.name}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {member.role || 'Miembro'}
                                </div>
                              </div>
                            </div>
                            {member._id !== user?.id && !member.isOwner && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeMemberFromChannel(selectedChannelForMembers._id, member._id)}
                                title="Remover del canal"
                              >
                                <i className="bi bi-x" style={{ fontSize: '12px' }}></i>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Miembros disponibles para agregar */}
                  <div className="col-md-6">
                    <h6 className="text-secondary">
                      <i className="bi bi-plus-circle me-1"></i>
                      Disponibles para agregar
                    </h6>
                    <div className="border rounded p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {projectMembers.filter(member => 
                        !getCurrentChannelMembers().some(channelMember => channelMember._id === member._id)
                      ).length === 0 ? (
                        <div className="text-center text-muted p-3">
                          <i className="bi bi-check-all fs-4 d-block mb-2 opacity-50"></i>
                          <p className="small">Todos los miembros ya están en el canal</p>
                        </div>
                      ) : (
                        projectMembers.filter(member => 
                          !getCurrentChannelMembers().some(channelMember => channelMember._id === member._id)
                        ).map((member) => (
                          <div key={member._id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                            <div className="d-flex align-items-center">
                              <img 
                                src={generateAvatarUrl(member.name)}
                                className="rounded-circle me-2"
                                style={{ width: '24px', height: '24px' }}
                                alt={member.name}
                              />
                              <div>
                                <div className="small fw-bold">{member.name}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {member.role || 'Miembro'}
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => addMemberToChannel(selectedChannelForMembers._id, member._id)}
                              title="Agregar al canal"
                            >
                              <i className="bi bi-plus" style={{ fontSize: '12px' }}></i>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowChannelMembersModal(false)}
                >
                  <i className="bi bi-check me-1"></i>
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 Estilos CSS adicionales */}
      <style jsx>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
          }
        }
        
        .hover-bg-light:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        
        .min-width-0 {
          min-width: 0;
        }
        
        .card {
          transition: all 0.2s ease-in-out;
        }
        
        .list-group-item {
          transition: all 0.2s ease-in-out;
        }
        
        .list-group-item:hover {
          transform: translateX(2px);
        }
        
        .badge {
          font-size: 0.7em;
        }
      `}</style>
    </div>
  );
};

export default ProjectCommunication;