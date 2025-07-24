// client/src/components/project-tabs/SocialCalendar.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import socialPostService, { socialPostUtils } from '../../services/socialPostService';
import './SocialCalendar.css';

function SocialCalendar({ projectId, project }) {
  const { user } = useAuth();
  
  // Estados principales
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [serverConnected, setServerConnected] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  
  // 🆕 NUEVOS ESTADOS PARA EL MODAL DE OPCIONES Y NOTIFICACIONES
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    platform: 'instagram',
    content: '',
    scheduledDate: '',
    scheduledTime: '12:00',
    hashtags: '',
    notes: ''
  });

  // Datos de demostración para modo offline
  const getDemoData = useCallback(() => [
    {
      _id: 'cal-demo-1',
      platform: 'instagram',
      content: 'Publicación de ejemplo desde calendario 📅 #calendario #social',
      scheduledDate: new Date().toISOString(),
      status: 'scheduled',
      author: { name: user?.name || 'Usuario' },
      hashtags: ['#calendario', '#social'],
      notes: 'Publicación de demostración'
    },
    {
      _id: 'cal-demo-2',
      platform: 'twitter',
      content: 'Tweet programado para mañana 🐦 ¡No te lo pierdas!',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      author: { name: user?.name || 'Usuario' },
      hashtags: ['#twitter', '#programado'],
      notes: 'Tweet importante'
    },
    {
      _id: 'cal-demo-3',
      platform: 'linkedin',
      content: 'Post profesional para LinkedIn 💼 Compartiendo insights del proyecto',
      scheduledDate: new Date(Date.now() + 259200000).toISOString(),
      status: 'draft',
      author: { name: user?.name || 'Usuario' },
      hashtags: ['#linkedin', '#profesional'],
      notes: 'Para audiencia profesional'
    },
    {
      _id: 'cal-demo-4',
      platform: 'facebook',
      content: '🚀 ¡Anuncio emocionante! Nuevas funcionalidades disponibles.',
      scheduledDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'published',
      author: { name: user?.name || 'Usuario' },
      hashtags: ['#facebook', '#anuncio'],
      notes: 'Post ya publicado'
    }
  ], [user]);

  // Cargar datos iniciales
  const loadPosts = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await socialPostService.getProjectPosts(projectId);
      
      if (response.success) {
        setPosts(response.data);
        setServerConnected(true);
      } else {
        throw new Error(response.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error cargando publicaciones:', error);
      setServerConnected(false);
      
      // Usar datos de ejemplo como fallback
      setPosts(getDemoData());
    } finally {
      setLoading(false);
    }
  }, [projectId, getDemoData]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Generar días del calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.scheduledDate);
        return postDate.toDateString() === current.toDateString();
      });

      days.push({
        date: new Date(current),
        day: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        posts: dayPosts
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      platform: 'instagram',
      content: '',
      scheduledDate: '',
      scheduledTime: '12:00',
      hashtags: '',
      notes: ''
    });
    setEditingPost(null);
  };

  // 🆕 SISTEMA DE NOTIFICACIONES
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 🆕 NUEVO: Manejar click en publicación - MEJORADO CON MODAL
  const handlePostClick = (post, e) => {
    e.stopPropagation();
    console.log('🔍 Click en publicación:', post);
    
    setSelectedPost(post);
    setShowOptionsModal(true);
  };

  // 🆕 CERRAR MODAL DE OPCIONES
  const closeOptionsModal = () => {
    setShowOptionsModal(false);
    setSelectedPost(null);
  };

  // Abrir modal de edición
  const handleEditPost = (post, e) => {
    if (e) e.stopPropagation();
    console.log('🔧 Editando publicación en calendario:', post);
    
    const scheduledDate = new Date(post.scheduledDate);
    
    setFormData({
      platform: post.platform,
      content: post.content,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: scheduledDate.toTimeString().slice(0, 5),
      hashtags: (post.hashtags || []).join(' '),
      notes: post.notes || ''
    });
    
    setEditingPost(post);
    setShowEditModal(true);
    setShowDayModal(false);
    
    // 🆕 Cerrar modal de opciones si está abierto
    closeOptionsModal();
  };

  // Eliminar publicación
  const handleDeletePost = (postId, e) => {
    if (e) e.stopPropagation();
    console.log('🗑️ Solicitando eliminar publicación del calendario:', postId);
    
    // Encontrar la publicación para mostrar información
    const post = posts.find(p => p._id === postId);
    setPostToDelete({ id: postId, post });
    setShowDeleteConfirm(true);
  };

  // Confirmar eliminación
  const confirmDeletePost = async () => {
    const postId = postToDelete.id;
    console.log('🗑️ Confirmando eliminación de publicación:', postId);

    try {
      if (serverConnected && !postId.startsWith('local-')) {
        const response = await socialPostService.deletePost(postId);
        
        if (response.success) {
          await loadPosts();
          showNotification('🗑️ Publicación eliminada correctamente', 'success');
          
          closeOptionsModal();
          setShowDeleteConfirm(false);
          setPostToDelete(null);
          return;
        }
      }
      
      // Eliminar localmente
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      showNotification('🗑️ Publicación eliminada localmente', 'success');
      
    } catch (error) {
      console.error('❌ Error eliminando publicación:', error);
      
      // Fallback: eliminar localmente
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      setServerConnected(false);
      showNotification('⚠️ Sin conexión - Publicación eliminada localmente', 'warning');
    }
    
    setShowDayModal(false);
    closeOptionsModal();
    setShowDeleteConfirm(false);
    setPostToDelete(null);
  };

  // Duplicar publicación
  const handleDuplicatePost = (post, e) => {
    if (e) e.stopPropagation();
    console.log('📋 Duplicando publicación del calendario:', post);
    
    const duplicatedPost = {
      _id: 'local-cal-dup-' + Date.now(),
      platform: post.platform,
      content: `[COPIA] ${post.content}`,
      scheduledDate: new Date(Date.now() + 3600000).toISOString(), // En 1 hora
      status: 'draft',
      author: { 
        name: user?.name || 'Usuario Local', 
        email: user?.email || 'local@planifica.com' 
      },
      hashtags: [...(post.hashtags || [])],
      notes: `Duplicado de: ${post.notes || 'Sin notas'}`,
      createdAt: new Date().toISOString()
    };
    
    setPosts(prevPosts => [duplicatedPost, ...prevPosts]);
    showNotification('📋 Publicación duplicada como borrador', 'success');
    setShowDayModal(false);
    
    // 🆕 Cerrar modal de opciones
    closeOptionsModal();
  };

  // Cambiar estado de publicación
  const handleChangeStatus = async (postId, newStatus, e) => {
    if (e) e.stopPropagation();
    console.log('🔄 Cambiando estado en calendario:', postId, 'a', newStatus);
    
    try {
      if (serverConnected && !postId.startsWith('local-')) {
        const response = await socialPostService.updatePostStatus(postId, newStatus);
        
        if (response.success) {
          await loadPosts();
          
          // Mensajes más claros con el nuevo sistema
          const statusMessages = {
            'draft': '📝 Marcado como borrador',
            'scheduled': '⏰ Marcado como programado', 
            'published': '✅ Marcado como publicado'
          };
          
          showNotification(statusMessages[newStatus] || `Estado cambiado a: ${socialPostUtils.getStatusBadge(newStatus).text}`, 'success');
          
          // Actualizar el selectedPost para reflejar el cambio inmediatamente
          setSelectedPost(prev => prev ? { ...prev, status: newStatus } : null);
          
          return;
        }
      }
      
      // Cambiar estado localmente
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, status: newStatus }
            : post
        )
      );
      
      // Actualizar el selectedPost para reflejar el cambio inmediatamente
      setSelectedPost(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Mensajes más claros con el nuevo sistema
      const statusMessages = {
        'draft': '📝 Marcado como borrador',
        'scheduled': '⏰ Marcado como programado', 
        'published': '✅ Marcado como publicado'
      };
      
      showNotification(statusMessages[newStatus] || `Estado cambiado localmente a: ${socialPostUtils.getStatusBadge(newStatus).text}`, 'success');
      
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      
      // Fallback: cambiar localmente
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, status: newStatus }
            : post
        )
      );
      
      // Actualizar el selectedPost para reflejar el cambio inmediatamente
      setSelectedPost(prev => prev ? { ...prev, status: newStatus } : null);
      
      setServerConnected(false);
      showNotification('⚠️ Sin conexión - Estado cambiado localmente', 'warning');
    }
    
    setShowDayModal(false);
  };

  // Manejar envío del formulario de creación
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validar contenido
      const validation = socialPostUtils.validateContent(formData.content, formData.platform);
      if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
      }

      // Combinar fecha y hora
      const scheduleDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Validar fecha futura
      if (scheduleDateTime < new Date()) {
        showNotification('No puedes programar una publicación en el pasado', 'error');
        return;
      }
      
      const postData = {
        projectId,
        platform: formData.platform,
        content: formData.content,
        scheduledDate: scheduleDateTime.toISOString(),
        hashtags: formData.hashtags ? 
          formData.hashtags.split(' ').filter(tag => tag.trim()).map(tag => 
            tag.startsWith('#') ? tag : `#${tag}`
          ) : [],
        notes: formData.notes
      };

      if (serverConnected) {
        const response = await socialPostService.createPost(postData);

        if (response.success) {
          await loadPosts();
          resetForm();
          setShowCreateModal(false);
          showNotification('✅ Publicación creada exitosamente', 'success');
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      } else {
        // Modo offline
        const localPost = {
          _id: 'local-cal-' + Date.now(),
          ...postData,
          status: 'scheduled',
          author: { name: user?.name || 'Usuario Local' },
          createdAt: new Date().toISOString()
        };
        
        setPosts(prevPosts => [localPost, ...prevPosts]);
        resetForm();
        setShowCreateModal(false);
        showNotification('📱 Publicación guardada localmente', 'success');
      }
    } catch (error) {
      console.error('Error al guardar publicación:', error);
      
      // Fallback: crear localmente
      const localPost = {
        _id: 'local-cal-' + Date.now(),
        platform: formData.platform,
        content: formData.content,
        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString(),
        status: 'scheduled',
        author: { name: user?.name || 'Usuario Local' },
        hashtags: formData.hashtags ? 
          formData.hashtags.split(' ').filter(tag => tag.trim()).map(tag => 
            tag.startsWith('#') ? tag : `#${tag}`
          ) : [],
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };
      
      setPosts(prevPosts => [localPost, ...prevPosts]);
      resetForm();
      setShowCreateModal(false);
      setServerConnected(false);
      showNotification('⚠️ Sin conexión - Publicación guardada localmente', 'warning');
    }
  };

  // Actualizar publicación existente
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    try {
      console.log('✏️ Actualizando publicación en calendario:', editingPost._id, formData);
      
      // Validar contenido
      const validation = socialPostUtils.validateContent(formData.content, formData.platform);
      if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
      }
      
      // Combinar fecha y hora
      let scheduledDateTime = null;
      if (formData.scheduledDate) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`);
        
        // Para posts no publicados, validar fecha futura
        if (editingPost.status !== 'published' && scheduledDateTime < new Date()) {
          showNotification('No puedes programar una publicación en el pasado', 'error');
          return;
        }
      }

      const updateData = {
        platform: formData.platform,
        content: formData.content,
        scheduledDate: scheduledDateTime ? scheduledDateTime.toISOString() : new Date().toISOString(),
        hashtags: formData.hashtags ? 
          formData.hashtags.split(' ').filter(tag => tag.trim()).map(tag => 
            tag.startsWith('#') ? tag : `#${tag}`
          ) : [],
        notes: formData.notes || ''
      };

      if (serverConnected && !editingPost._id.startsWith('local-')) {
        // Intentar actualizar en el servidor
        const response = await socialPostService.updatePost(editingPost._id, updateData);
        
        if (response.success) {
          console.log('✅ Publicación actualizada en servidor:', response.data);
          await loadPosts(); // Recargar desde servidor
          showNotification('✅ Publicación actualizada exitosamente', 'success');
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      } else {
        // Modo offline o post local: actualizar localmente
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === editingPost._id 
              ? {
                  ...post,
                  ...updateData,
                  status: formData.scheduledDate ? 
                    (post.status === 'published' ? 'published' : 'scheduled') : 
                    'draft',
                  updatedAt: new Date().toISOString()
                }
              : post
          )
        );
        showNotification('📱 Publicación actualizada localmente', 'success');
      }
      
      resetForm();
      setShowEditModal(false);
      
    } catch (error) {
      console.error('❌ Error actualizando publicación:', error);
      
      // Fallback: actualizar localmente
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === editingPost._id 
            ? {
                ...post,
                platform: formData.platform,
                content: formData.content,
                scheduledDate: formData.scheduledDate ? 
                  new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`).toISOString() : 
                  new Date().toISOString(),
                hashtags: formData.hashtags ? 
                  formData.hashtags.split(' ').filter(tag => tag.trim()).map(tag => 
                    tag.startsWith('#') ? tag : `#${tag}`
                  ) : [],
                notes: formData.notes || '',
                status: formData.scheduledDate ? 
                  (post.status === 'published' ? 'published' : 'scheduled') : 
                  'draft',
                updatedAt: new Date().toISOString()
              }
            : post
        )
      );
      
      setShowEditModal(false);
      setServerConnected(false);
      
      showNotification('⚠️ Sin conexión - Publicación actualizada localmente', 'warning');
    }
  };

  // Navegar meses
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Crear publicación desde día del calendario
  const handleDayClick = (date) => {
    const dateString = date.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      scheduledDate: dateString
    }));
    setShowCreateModal(true);
  };

  // Mostrar detalles del día
  const handleShowDayDetails = (dayData, e) => {
    e.stopPropagation();
    console.log('📅 Mostrando detalles del día:', dayData);
    setSelectedDay(dayData);
    setShowDayModal(true);
  };

  // Renderizar vista de calendario
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
      <div className="calendar-container">
        {/* Header del calendario */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary me-2"
              onClick={() => navigateMonth(-1)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <h4 className="mb-0 me-2">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigateMonth(1)}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
          
          <div className="d-flex align-items-center">
            <span className={`badge ${serverConnected ? 'bg-success' : 'bg-warning text-dark'} me-2`}>
              <i className={`bi bi-${serverConnected ? 'wifi' : 'wifi-off'} me-1`}></i>
              {serverConnected ? 'En línea' : 'Sin conexión'}
            </span>
            <button 
              className="btn btn-outline-secondary me-2"
              onClick={loadPosts}
              disabled={loading}
              title="Recargar publicaciones"
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setCurrentDate(new Date())}
            >
              <i className="bi bi-calendar-today me-1"></i>
              Hoy
            </button>
          </div>
        </div>

        {/* Grid del calendario */}
        <div className="calendar-grid">
          {/* Headers días de la semana */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="calendar-header">
              {day}
            </div>
          ))}

          {/* Días del calendario */}
          {calendarDays.map((dayData, index) => (
            <div
              key={index}
              className={`calendar-day ${!dayData.isCurrentMonth ? 'other-month' : ''} ${dayData.isToday ? 'today' : ''}`}
              onClick={() => handleDayClick(dayData.date)}
              title="Click para crear publicación"
            >
              <div className="day-number">{dayData.day}</div>
              
              {/* Publicaciones del día */}
              <div className="day-posts">
                {dayData.posts.slice(0, 3).map(post => {
                  const platformConfig = socialPostUtils.getPlatformConfig(post.platform);
                  const statusBadge = socialPostUtils.getStatusBadge(post.status);
                  const isLocal = post._id.startsWith('local-');
                  
                  return (
                    <div
                      key={post._id}
                      className={`post-indicator ${statusBadge.class.replace('bg-', 'border-')} clickable-post`}
                      title={`${platformConfig.name}: ${post.content.substring(0, 50)}...${isLocal ? ' (Local)' : ''}\n\nClick para opciones`}
                      onClick={(e) => handlePostClick(post, e)}
                    >
                      <div className="d-flex align-items-center">
                        <i className={`bi ${platformConfig.icon}`}></i>
                        {isLocal && <i className="bi bi-cloud-slash ms-1" style={{fontSize: '0.6rem'}}></i>}
                      </div>
                      <span className="post-time">
                        {new Date(post.scheduledDate).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  );
                })}
                
                {dayData.posts.length > 3 && (
                  <div 
                    className="more-posts clickable-more"
                    onClick={(e) => handleShowDayDetails(dayData, e)}
                    title="Click para ver todas las publicaciones"
                  >
                    +{dayData.posts.length - 3} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="social-calendar">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            <i className="bi bi-calendar-event me-2 text-primary"></i>
            Vista de Calendario
          </h5>
          <small className="text-muted">
            <strong>Click en un día</strong> para crear publicación • <strong>Click en una publicación</strong> para ver opciones
          </small>
        </div>

        {/* Botón crear publicación */}
        {/* <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nueva Publicación
        </button> */}
      </div>

      {/* Estadísticas rápidas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <i className="bi bi-pencil-square display-6 text-secondary"></i>
              <h6 className="mt-2 mb-0">Borradores</h6>
              <small className="text-muted">
                {posts.filter(p => p.status === 'draft').length}
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <i className="bi bi-clock display-6 text-warning"></i>
              <h6 className="mt-2 mb-0">Programadas</h6>
              <small className="text-muted">
                {posts.filter(p => p.status === 'scheduled').length}
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <i className="bi bi-check-circle display-6 text-success"></i>
              <h6 className="mt-2 mb-0">Publicadas</h6>
              <small className="text-muted">
                {posts.filter(p => p.status === 'published').length}
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <i className="bi bi-cloud-slash display-6 text-info"></i>
              <h6 className="mt-2 mb-0">Locales</h6>
              <small className="text-muted">
                {posts.filter(p => p._id.startsWith('local-')).length}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {renderCalendarView()}

      {/* 🆕 MODAL DE OPCIONES DE PUBLICACIÓN */}
      {showOptionsModal && selectedPost && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title d-flex align-items-center">
                  <i className={`bi ${socialPostUtils.getPlatformConfig(selectedPost.platform).icon} me-2 text-${socialPostUtils.getPlatformConfig(selectedPost.platform).color}`}></i>
                  Opciones de Publicación
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeOptionsModal}
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Plataforma y Estado */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${socialPostUtils.getPlatformConfig(selectedPost.platform).icon} text-${socialPostUtils.getPlatformConfig(selectedPost.platform).color} me-2 fs-4`}></i>
                    <div>
                      <h6 className="mb-0">{socialPostUtils.getPlatformConfig(selectedPost.platform).name}</h6>
                      {selectedPost._id.startsWith('local-') && 
                        <small className="text-muted">Guardado localmente</small>
                      }
                    </div>
                  </div>
                  <span className={`badge ${socialPostUtils.getStatusBadge(selectedPost.status).class} fs-6`}>
                    {socialPostUtils.getStatusBadge(selectedPost.status).text}
                  </span>
                </div>

                {/* Contenido de la publicación */}
                <div className="mb-4">
                  <h6 className="text-muted mb-2">Contenido</h6>
                  <div className="bg-light rounded p-3">
                    <p className="mb-0">{selectedPost.content}</p>
                  </div>
                </div>

                {/* Hashtags */}
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">Hashtags</h6>
                    <div>
                      {selectedPost.hashtags.map(tag => (
                        <span key={tag} className="badge bg-secondary me-2 mb-1">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fecha y Hora */}
                <div className="mb-4">
                  <h6 className="text-muted mb-2">Programación</h6>
                  <div className="row">
                    <div className="col-6">
                      <div className="d-flex align-items-center text-muted">
                        <i className="bi bi-calendar me-2"></i>
                        <span>{new Date(selectedPost.scheduledDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex align-items-center text-muted">
                        <i className="bi bi-clock me-2"></i>
                        <span>{new Date(selectedPost.scheduledDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {selectedPost.notes && (
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">Notas</h6>
                    <div className="bg-light rounded p-3">
                      <small className="text-muted mb-0">{selectedPost.notes}</small>
                    </div>
                  </div>
                )}

                {/* Cambiar Estado */}
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Cambiar Estado</h6>
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      type="button"
                      className={`btn ${selectedPost.status === 'draft' ? 'btn-secondary' : 'btn-outline-secondary'} flex-fill`}
                      onClick={(e) => handleChangeStatus(selectedPost._id, 'draft', e)}
                    >
                      <i className="bi bi-pencil-square d-block mb-1"></i>
                      <small>Borrador</small>
                    </button>
                    <button
                      type="button"
                      className={`btn ${selectedPost.status === 'scheduled' ? 'btn-warning' : 'btn-outline-warning'} flex-fill`}
                      onClick={(e) => handleChangeStatus(selectedPost._id, 'scheduled', e)}
                    >
                      <i className="bi bi-clock d-block mb-1"></i>
                      <small>Programado</small>
                    </button>
                    <button
                      type="button"
                      className={`btn ${selectedPost.status === 'published' ? 'btn-success' : 'btn-outline-success'} flex-fill`}
                      onClick={(e) => handleChangeStatus(selectedPost._id, 'published', e)}
                    >
                      <i className="bi bi-check-circle d-block mb-1"></i>
                      <small>Publicado</small>
                    </button>
                  </div>
                </div>

                {/* Acciones principales */}
                <div className="row g-3">
                  <div className="col-6">
                    <button
                      className="btn btn-primary w-100"
                      onClick={(e) => handleEditPost(selectedPost, e)}
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Editar
                    </button>
                  </div>
                  
                  <div className="col-6">
                    <button
                      className="btn btn-info w-100"
                      onClick={(e) => handleDuplicatePost(selectedPost, e)}
                    >
                      <i className="bi bi-files me-2"></i>
                      Duplicar
                    </button>
                  </div>
                  
                  <div className="col-12">
                    <button
                      className="btn btn-outline-danger w-100"
                      onClick={(e) => handleDeletePost(selectedPost._id, e)}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Eliminar Publicación
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeOptionsModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Publicación - SIN CAMBIOS */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-calendar-plus me-2"></i>
                    Nueva Publicación
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Plataforma</label>
                      <select
                        className="form-select"
                        value={formData.platform}
                        onChange={(e) => setFormData({...formData, platform: e.target.value})}
                        required
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter/X</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Contenido</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="¿Qué quieres compartir?"
                      required
                    ></textarea>
                    <div className={`form-text text-end ${
                      socialPostUtils.getRemainingChars(formData.content, formData.platform) < 50 
                        ? 'text-warning' 
                        : socialPostUtils.getRemainingChars(formData.content, formData.platform) < 0 
                          ? 'text-danger' 
                          : ''
                    }`}>
                      {formData.content.length} / {socialPostUtils.getPlatformConfig(formData.platform).maxLength} caracteres
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hashtags (opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hashtags}
                      onChange={(e) => setFormData({...formData, hashtags: e.target.value})}
                      placeholder="#hashtag1 #hashtag2 #hashtag3"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notas (opcional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notas internas sobre esta publicación..."
                    ></textarea>
                  </div>

                  {!serverConnected && (
                    <div className="alert alert-warning">
                      <i className="bi bi-wifi-off me-2"></i>
                      <strong>Modo sin conexión:</strong> La publicación se guardará localmente.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={socialPostUtils.getRemainingChars(formData.content, formData.platform) < 0}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    {serverConnected ? 'Crear Publicación' : 'Guardar Localmente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Publicación - SIN CAMBIOS */}
      {showEditModal && editingPost && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleUpdatePost}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-pencil-square me-2"></i>
                    Editar Publicación
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Plataforma</label>
                      <select
                        className="form-select"
                        value={formData.platform}
                        onChange={(e) => setFormData({...formData, platform: e.target.value})}
                        required
                        disabled={editingPost.status === 'published'}
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter/X</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                        min={editingPost.status === 'published' ? undefined : new Date().toISOString().split('T')[0]}
                        disabled={editingPost.status === 'published'}
                        required
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                        disabled={editingPost.status === 'published'}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Contenido</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="¿Qué quieres compartir?"
                      required
                    ></textarea>
                    <div className={`form-text text-end ${
                      socialPostUtils.getRemainingChars(formData.content, formData.platform) < 50 
                        ? 'text-warning' 
                        : socialPostUtils.getRemainingChars(formData.content, formData.platform) < 0 
                          ? 'text-danger' 
                          : ''
                    }`}>
                      {formData.content.length} / {socialPostUtils.getPlatformConfig(formData.platform).maxLength} caracteres
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hashtags (opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hashtags}
                      onChange={(e) => setFormData({...formData, hashtags: e.target.value})}
                      placeholder="#hashtag1 #hashtag2 #hashtag3"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notas (opcional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notas internas sobre esta publicación..."
                    ></textarea>
                  </div>

                  {editingPost.status === 'published' && (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Publicación ya publicada:</strong> Solo puedes editar el contenido y las notas. La fecha y plataforma no se pueden cambiar.
                    </div>
                  )}

                  {!serverConnected && (
                    <div className="alert alert-warning">
                      <i className="bi bi-wifi-off me-2"></i>
                      <strong>Modo sin conexión:</strong> Los cambios se guardarán localmente.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={socialPostUtils.getRemainingChars(formData.content, formData.platform) < 0}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    {serverConnected ? 'Actualizar Publicación' : 'Guardar Localmente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles del Día - SIN CAMBIOS */}
      {showDayModal && selectedDay && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-day me-2"></i>
                  {selectedDay.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDayModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <h6>Publicaciones programadas ({selectedDay.posts.length})</h6>
                
                {selectedDay.posts.map(post => {
                  const platformConfig = socialPostUtils.getPlatformConfig(post.platform);
                  const statusBadge = socialPostUtils.getStatusBadge(post.status);
                  const isLocal = post._id.startsWith('local-');
                  
                  return (
                    <div key={post._id} className="border rounded p-3 mb-2">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <i className={`bi ${platformConfig.icon} text-${platformConfig.color} me-2`}></i>
                          <div>
                            <strong>{platformConfig.name}</strong>
                            {isLocal && <span className="badge bg-info ms-2">Local</span>}
                          </div>
                        </div>
                        <span className={`badge ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      
                      <p className="mb-2 small">{post.content}</p>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {new Date(post.scheduledDate).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </small>
                        
                        <div>
                          <button 
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={(e) => handleEditPost(post, e)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={(e) => handleDuplicatePost(post, e)}
                          >
                            <i className="bi bi-files"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => handleDeletePost(post._id, e)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDayModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDayModal(false);
                    handleDayClick(selectedDay.date);
                  }}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Agregar Publicación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteConfirm && postToDelete && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-2">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirmar Eliminación
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPostToDelete(null);
                  }}
                ></button>
              </div>

              <div className="modal-body">
                <p className="mb-3">¿Estás seguro de que quieres eliminar esta publicación?</p>
                
                {postToDelete.post && (
                  <div className="card bg-light">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className={`bi ${socialPostUtils.getPlatformConfig(postToDelete.post.platform).icon} text-${socialPostUtils.getPlatformConfig(postToDelete.post.platform).color} me-2`}></i>
                        <strong>{socialPostUtils.getPlatformConfig(postToDelete.post.platform).name}</strong>
                      </div>
                      <p className="mb-0 small text-muted">"{postToDelete.post.content.substring(0, 100)}..."</p>
                    </div>
                  </div>
                )}
                
                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Esta acción no se puede deshacer.</strong>
                </div>
              </div>

              <div className="modal-footer border-0 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPostToDelete(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeletePost}
                >
                  <i className="bi bi-trash me-2"></i>
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 SISTEMA DE NOTIFICACIONES VISUALES */}
      {notification && (
        <div 
          className={`position-fixed top-0 end-0 m-3`} 
          style={{ zIndex: 9999 }}
        >
          <div 
            className={`alert alert-${
              notification.type === 'success' ? 'success' : 
              notification.type === 'warning' ? 'warning' : 
              notification.type === 'error' ? 'danger' : 'info'
            } alert-dismissible shadow-lg border-0`}
            style={{ 
              minWidth: '320px', 
              animation: 'slideInRight 0.3s ease-out',
              opacity: '0.95',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="d-flex align-items-center">
              <i className={`bi ${
                notification.type === 'success' ? 'bi-check-circle-fill' : 
                notification.type === 'warning' ? 'bi-exclamation-triangle-fill' : 
                notification.type === 'error' ? 'bi-x-circle-fill' : 'bi-info-circle-fill'
              } me-2 fs-5`}></i>
              <span className="fw-medium">{notification.message}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotification(null)}
            ></button>
          </div>
        </div>
      )}

      {/* Estilos adicionales */}
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .clickable-post {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clickable-post:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          z-index: 10;
        }
        .clickable-more {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clickable-more:hover {
          background-color: #e9ecef;
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}

export default SocialCalendar;