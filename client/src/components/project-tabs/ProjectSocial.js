import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import socialPostService, { socialPostUtils } from '../../services/socialPostService';
import SocialCalendar from './SocialCalendar';

const ProjectSocial = ({ projectId, project }) => {
  const { user } = useAuth();
  
  // Estados principales
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'calendar'
  const [serverConnected, setServerConnected] = useState(true);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    platform: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para mostrar acciones de cada post
  const [showActionsFor, setShowActionsFor] = useState(null);
  
  // Estado del formulario (create y edit)
  const [formData, setFormData] = useState({
    platform: 'instagram',
    content: '',
    scheduledDate: '',
    scheduledTime: '12:00',
    hashtags: '',
    notes: ''
  });

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: 'bi-instagram', color: 'danger' },
    { id: 'twitter', name: 'Twitter', icon: 'bi-twitter', color: 'info' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'bi-linkedin', color: 'primary' },
    { id: 'facebook', name: 'Facebook', icon: 'bi-facebook', color: 'primary' },
    { id: 'tiktok', name: 'TikTok', icon: 'bi-tiktok', color: 'dark' }
  ];

  // Datos de demostración (fallback cuando no hay conexión)
  const getDemoData = useCallback(() => [
    {
      _id: 'demo-1',
      platform: 'instagram',
      content: '¡Estamos trabajando en algo increíble! 🚀 #proyecto #desarrollo #planifica',
      scheduledDate: new Date(Date.now() + 3600000).toISOString(),
      status: 'scheduled',
      author: { 
        name: user?.name || 'Usuario Demo', 
        email: user?.email || 'demo@planifica.com' 
      },
      hashtags: ['#proyecto', '#desarrollo', '#planifica'],
      notes: 'Publicación de demostración - primera del proyecto',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'demo-2',
      platform: 'twitter',
      content: 'Nuevo update del proyecto: Ya tenemos la autenticación funcionando perfectamente 🔐✅',
      scheduledDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'published',
      author: { 
        name: user?.name || 'Usuario Demo', 
        email: user?.email || 'demo@planifica.com' 
      },
      hashtags: ['#update', '#autenticación', '#tecnología'],
      notes: 'Update técnico sobre avances',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: 'demo-3',
      platform: 'linkedin',
      content: 'Compartiendo el progreso de nuestro proyecto de gestión empresarial. Las herramientas digitales están transformando la forma en que trabajamos. 💼',
      scheduledDate: new Date(Date.now() + 259200000).toISOString(),
      status: 'draft',
      author: { 
        name: user?.name || 'Usuario Demo', 
        email: user?.email || 'demo@planifica.com' 
      },
      hashtags: ['#gestión', '#empresarial', '#transformacióndigital'],
      notes: 'Publicación profesional para LinkedIn',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'demo-4',
      platform: 'facebook',
      content: '📢 ¡Grandes noticias! Nuestro equipo ha logrado implementar nuevas funcionalidades que harán más fácil la gestión de proyectos.',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      author: { 
        name: user?.name || 'Usuario Demo', 
        email: user?.email || 'demo@planifica.com' 
      },
      hashtags: ['#noticias', '#equipo', '#funcionalidades'],
      notes: 'Anuncio importante para Facebook',
      createdAt: new Date().toISOString()
    }
  ], [user]);

  // Cargar publicaciones del backend
  const loadPosts = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Cargando publicaciones del proyecto:', projectId);
      
      const response = await socialPostService.getProjectPosts(projectId, filters);
      
      if (response.success) {
        console.log('✅ Publicaciones cargadas:', response.data);
        setPosts(response.data);
        setServerConnected(true);
      } else {
        console.warn('⚠️ Respuesta sin éxito:', response);
        throw new Error(response.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error cargando publicaciones:', error);
      setServerConnected(false);
      
      // Usar datos de demostración como fallback
      console.log('📡 Usando datos de demostración...');
      setPosts(getDemoData());
    } finally {
      setLoading(false);
    }
  }, [projectId, getDemoData, filters]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Cerrar menu de acciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionsFor(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtrar publicaciones localmente (para modo offline)
  const getFilteredPosts = () => {
    let filtered = [...posts];

    if (filters.platform) {
      filtered = filtered.filter(post => post.platform === filters.platform);
    }

    if (filters.status) {
      filtered = filtered.filter(post => post.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(searchLower) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        post.notes?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(post => 
        new Date(post.scheduledDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(post => 
        new Date(post.scheduledDate) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    return filtered;
  };

  // Función para obtener badge de estado
  const getStatusBadge = (status) => {
    return socialPostUtils.getStatusBadge(status);
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

  // Abrir modal de edición
  const handleEditPost = (post) => {
    console.log('🔧 Editando publicación:', post);
    
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
    setShowEditPost(true);
    setShowActionsFor(null);
  };

  // Crear nueva publicación
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    try {
      console.log('📝 Creando nueva publicación:', formData);
      
      // Validar contenido
      const validation = socialPostUtils.validateContent(formData.content, formData.platform);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      // Combinar fecha y hora si se proporciona fecha
      let scheduledDateTime = null;
      if (formData.scheduledDate) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`);
        
        // Validar que la fecha no sea en el pasado
        if (scheduledDateTime < new Date()) {
          alert('No puedes programar una publicación en el pasado');
          return;
        }
      }

      const postData = {
        projectId,
        platform: formData.platform,
        content: formData.content,
        scheduledDate: scheduledDateTime ? scheduledDateTime.toISOString() : new Date().toISOString(),
        hashtags: formData.hashtags ? 
          formData.hashtags.split(' ').filter(tag => tag.trim()).map(tag => 
            tag.startsWith('#') ? tag : `#${tag}`
          ) : [],
        notes: formData.notes || ''
      };

      if (serverConnected) {
        // Intentar crear en el servidor
        const response = await socialPostService.createPost(postData);
        
        if (response.success) {
          console.log('✅ Publicación creada en servidor:', response.data);
          await loadPosts(); // Recargar desde servidor
          alert('¡Publicación creada exitosamente!');
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      } else {
        // Modo offline: crear localmente
        const localPost = {
          _id: 'local-' + Date.now(),
          ...postData,
          status: formData.scheduledDate ? 'scheduled' : 'draft',
          author: { 
            name: user?.name || 'Usuario Local', 
            email: user?.email || 'local@planifica.com' 
          },
          createdAt: new Date().toISOString()
        };
        
        setPosts(prevPosts => [localPost, ...prevPosts]);
        alert('📱 Publicación guardada localmente (sin conexión al servidor)');
      }
      
      resetForm();
      setShowCreatePost(false);
      
    } catch (error) {
      console.error('❌ Error creando publicación:', error);
      
      // Fallback: crear localmente
      const localPost = {
        _id: 'local-' + Date.now(),
        platform: formData.platform,
        content: formData.content,
        scheduledDate: formData.scheduledDate ? 
          new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`).toISOString() : 
          new Date().toISOString(),
        status: formData.scheduledDate ? 'scheduled' : 'draft',
        author: { 
          name: user?.name || 'Usuario Local', 
          email: user?.email || 'local@planifica.com' 
        },
        hashtags: formData.hashtags ? 
          formData.hashtags.split(' ').filter(tag => tag.trim()).map(tag => 
            tag.startsWith('#') ? tag : `#${tag}`
          ) : [],
        notes: formData.notes || '',
        createdAt: new Date().toISOString()
      };
      
      setPosts(prevPosts => [localPost, ...prevPosts]);
      setShowCreatePost(false);
      setServerConnected(false);
      
      alert('⚠️ Error de conexión. Publicación guardada localmente.');
    }
  };

  // Actualizar publicación existente
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    try {
      console.log('✏️ Actualizando publicación:', editingPost._id, formData);
      
      // Validar contenido
      const validation = socialPostUtils.validateContent(formData.content, formData.platform);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      // Combinar fecha y hora
      let scheduledDateTime = null;
      if (formData.scheduledDate) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`);
        
        // Para posts no publicados, validar fecha futura
        if (editingPost.status !== 'published' && scheduledDateTime < new Date()) {
          alert('No puedes programar una publicación en el pasado');
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
          alert('¡Publicación actualizada exitosamente!');
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
        alert('📱 Publicación actualizada localmente');
      }
      
      resetForm();
      setShowEditPost(false);
      
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
      
      setShowEditPost(false);
      setServerConnected(false);
      
      alert('⚠️ Error de conexión. Publicación actualizada localmente.');
    }
  };

  // Eliminar publicación
  const handleDeletePost = async (postId) => {
    console.log('🗑️ Eliminando publicación:', postId);
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return;
    }

    try {
      if (serverConnected && !postId.startsWith('local-')) {
        const response = await socialPostService.deletePost(postId);
        
        if (response.success) {
          await loadPosts(); // Recargar desde servidor
          alert('Publicación eliminada correctamente');
          return;
        }
      }
      
      // Eliminar localmente (para posts locales o modo offline)
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      alert('Publicación eliminada localmente');
      
    } catch (error) {
      console.error('❌ Error eliminando publicación:', error);
      
      // Fallback: eliminar localmente
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      setServerConnected(false);
      alert('⚠️ Error de conexión. Publicación eliminada localmente.');
    }
    
    setShowActionsFor(null);
  };

  // Duplicar publicación
  const handleDuplicatePost = (post) => {
    console.log('📋 Duplicando publicación:', post);
    
    const duplicatedPost = {
      _id: 'local-dup-' + Date.now(),
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
    alert('📋 Publicación duplicada como borrador');
    setShowActionsFor(null);
  };

  // Cambiar estado de publicación
  const handleChangeStatus = async (postId, newStatus) => {
    console.log('🔄 Cambiando estado de publicación:', postId, 'a', newStatus);
    
    try {
      if (serverConnected && !postId.startsWith('local-')) {
        const response = await socialPostService.updatePostStatus(postId, newStatus);
        
        if (response.success) {
          await loadPosts();
          alert(`Estado cambiado a: ${socialPostUtils.getStatusBadge(newStatus).text}`);
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
      alert(`Estado cambiado localmente a: ${socialPostUtils.getStatusBadge(newStatus).text}`);
      
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
      setServerConnected(false);
      alert('⚠️ Error de conexión. Estado cambiado localmente.');
    }
    
    setShowActionsFor(null);
  };

  // Sugerir hashtags automáticamente
  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
    
    // Auto-sugerir hashtags si el contenido es suficientemente largo
    if (content.length > 50 && !formData.hashtags) {
      const suggestions = socialPostUtils.suggestHashtags(content, project);
      if (suggestions.length > 0) {
        setFormData(prev => ({ ...prev, hashtags: suggestions.join(' ') }));
      }
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      platform: '',
      status: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Aplicar filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle acciones de un post
  const toggleActions = (e, postId) => {
    e.stopPropagation();
    setShowActionsFor(showActionsFor === postId ? null : postId);
  };

  // Renderizar vista según el modo seleccionado
  const renderContent = () => {
    if (viewMode === 'calendar') {
      return <SocialCalendar projectId={projectId} project={project} />;
    }

    const filteredPosts = getFilteredPosts();

    // Vista de lista (tu diseño original mejorado)
    return (
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                Publicaciones Programadas
                {filteredPosts.length !== posts.length && (
                  <span className="badge bg-primary ms-2">
                    {filteredPosts.length} de {posts.length}
                  </span>
                )}
              </h6>
              <div className="d-flex align-items-center">
                <span className={`badge ${serverConnected ? 'bg-success' : 'bg-warning text-dark'} me-2`}>
                  <i className={`bi bi-${serverConnected ? 'wifi' : 'wifi-off'} me-1`}></i>
                  {serverConnected ? 'En línea' : 'Sin conexión'}
                </span>
                <button 
                  className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filtros"
                >
                  <i className="bi bi-funnel"></i>
                </button>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={loadPosts}
                  disabled={loading}
                  title="Recargar publicaciones"
                >
                  <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                </button>
              </div>
            </div>

            {/* Panel de filtros */}
            {showFilters && (
              <div className="card-body border-bottom bg-light">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small">Buscar</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar en contenido..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Plataforma</label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.platform}
                      onChange={(e) => handleFilterChange('platform', e.target.value)}
                    >
                      <option value="">Todas</option>
                      {platforms.map(platform => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Estado</label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="draft">Borrador</option>
                      <option value="scheduled">Programado</option>
                      <option value="published">Publicado</option>
                      <option value="failed">Fallido</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Desde</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Hasta</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                  <div className="col-md-1 d-flex align-items-end">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={clearFilters}
                      title="Limpiar filtros"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando publicaciones...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x display-1 text-muted"></i>
                  <h5 className="mt-3 text-muted">
                    {posts.length === 0 ? 'No hay publicaciones' : 'No hay publicaciones que coincidan'}
                  </h5>
                  <p className="text-muted">
                    {posts.length === 0 
                      ? 'Crea tu primera publicación para comenzar'
                      : 'Intenta ajustar los filtros de búsqueda'
                    }
                  </p>
                  {posts.length === 0 && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreatePost(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      Nueva Publicación
                    </button>
                  )}
                </div>
              ) : (
                filteredPosts.map(post => {
                  const platform = platforms.find(p => p.id === post.platform);
                  const statusBadge = getStatusBadge(post.status);
                  const isLocal = post._id.startsWith('local-');
                  const showActions = showActionsFor === post._id;
                  
                  return (
                    <div key={post._id} className="border rounded p-3 mb-3 hover-card position-relative">
                      {isLocal && (
                        <div className="position-absolute top-0 end-0 mt-2 me-2">
                          <span className="badge bg-info" title="Guardado localmente">
                            <i className="bi bi-cloud-slash"></i>
                          </span>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <i className={`bi ${platform?.icon || 'bi-share'} text-${platform?.color || 'secondary'} me-2`}></i>
                          <div>
                            <strong>{platform?.name || post.platform}</strong>
                            {post.author && (
                              <div>
                                <small className="text-muted">por {post.author.name}</small>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`badge ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      
                      <p className="mb-2">{post.content}</p>
                      
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="mb-2">
                          {post.hashtags.map((tag, index) => (
                            <span key={index} className="badge bg-light text-dark me-1 border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          {socialPostUtils.formatScheduledDate(post.scheduledDate)}
                        </small>
                        
                        {/* Menú de acciones sin Bootstrap dropdown */}
                        <div className="position-relative">
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => toggleActions(e, post._id)}
                            title="Acciones"
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                          
                          {/* Menu de acciones personalizado */}
                          {showActions && (
                            <div 
                              className="position-absolute end-0 mt-1 bg-white border rounded shadow-lg p-2"
                              style={{ zIndex: 1000, minWidth: '200px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                className="btn btn-sm btn-light w-100 text-start mb-1"
                                onClick={() => handleEditPost(post)}
                              >
                                <i className="bi bi-pencil me-2"></i>Editar
                              </button>
                              
                              <button 
                                className="btn btn-sm btn-light w-100 text-start mb-1"
                                onClick={() => handleDuplicatePost(post)}
                              >
                                <i className="bi bi-files me-2"></i>Duplicar
                              </button>
                              
                              {post.status !== 'published' && (
                                <>
                                  <hr className="my-1" />
                                  <button 
                                    className="btn btn-sm btn-light w-100 text-start mb-1"
                                    onClick={() => handleChangeStatus(post._id, 'published')}
                                  >
                                    <i className="bi bi-send me-2"></i>Publicar ahora
                                  </button>
                                  
                                  {post.status !== 'scheduled' && (
                                    <button 
                                      className="btn btn-sm btn-light w-100 text-start mb-1"
                                      onClick={() => handleChangeStatus(post._id, 'scheduled')}
                                    >
                                      <i className="bi bi-clock me-2"></i>Programar
                                    </button>
                                  )}
                                </>
                              )}
                              
                              <hr className="my-1" />
                              <button 
                                className="btn btn-sm btn-light w-100 text-start text-danger"
                                onClick={() => handleDeletePost(post._id)}
                              >
                                <i className="bi bi-trash me-2"></i>Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {post.notes && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted">
                            <i className="bi bi-sticky me-1"></i>
                            {post.notes}
                          </small>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Estadísticas */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Estadísticas</h6>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <h4 className="text-primary">{posts.length}</h4>
                <small className="text-muted">Total publicaciones</small>
              </div>
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="text-success fw-bold">
                    {posts.filter(p => p.status === 'published').length}
                  </div>
                  <small className="text-muted">Publicadas</small>
                </div>
                <div className="col-6 mb-3">
                  <div className="text-warning fw-bold">
                    {posts.filter(p => p.status === 'scheduled').length}
                  </div>
                  <small className="text-muted">Programadas</small>
                </div>
                <div className="col-6">
                  <div className="text-secondary fw-bold">
                    {posts.filter(p => p.status === 'draft').length}
                  </div>
                  <small className="text-muted">Borradores</small>
                </div>
                <div className="col-6">
                  <div className="text-info fw-bold">
                    {posts.filter(p => p._id.startsWith('local-')).length}
                  </div>
                  <small className="text-muted">Locales</small>
                </div>
              </div>
            </div>
          </div>

          {/* Próximas Publicaciones */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Próximas Publicaciones</h6>
            </div>
            <div className="card-body">
              {posts
                .filter(p => p.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                .slice(0, 5)
                .map(post => {
                  const platform = platforms.find(p => p.id === post.platform);
                  return (
                    <div key={post._id} className="d-flex align-items-center mb-2">
                      <i className={`bi ${platform?.icon || 'bi-share'} text-${platform?.color || 'secondary'} me-2`}></i>
                      <div className="flex-grow-1">
                        <div className="fw-medium" style={{ fontSize: '14px' }}>
                          {platform?.name || post.platform}
                        </div>
                        <small className="text-muted">
                          {socialPostUtils.formatScheduledDate(post.scheduledDate)}
                        </small>
                      </div>
                      {post._id.startsWith('local-') && (
                        <span className="badge bg-info ms-2" title="Local">
                          <i className="bi bi-cloud-slash"></i>
                        </span>
                      )}
                    </div>
                  );
                })}
              
              {posts.filter(p => p.status === 'scheduled').length === 0 && (
                <div className="text-center text-muted py-3">
                  <i className="bi bi-calendar-check"></i>
                  <div>No hay publicaciones programadas</div>
                </div>
              )}
            </div>
          </div>

          {/* Guía rápida */}
          {!serverConnected && (
            <div className="card mt-3 border-warning">
              <div className="card-header bg-warning bg-opacity-10">
                <h6 className="mb-0 text-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Modo Sin Conexión
                </h6>
              </div>
              <div className="card-body">
                <small className="text-muted">
                  Las publicaciones se guardan localmente. Se sincronizarán cuando se restablezca la conexión.
                </small>
                <button 
                  className="btn btn-sm btn-outline-primary mt-2 w-100"
                  onClick={loadPosts}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reintentar conexión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="social-tab">
      {/* Header con controles */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            <i className="bi bi-calendar-event me-2 text-primary"></i>
            Calendario Social
          </h5>
          <small className="text-muted">
            Gestiona las publicaciones de {project?.name || 'este proyecto'}
          </small>
        </div>
        
        <div className="d-flex align-items-center">
          {/* Selector de vista */}
          <div className="btn-group me-3">
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              <i className="bi bi-list-ul"></i>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('calendar')}
              title="Vista de calendario"
            >
              <i className="bi bi-calendar-week"></i>
            </button>
          </div>

          {/* Botón nueva publicación */}
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowCreatePost(true);
            }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Nueva Publicación
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {renderContent()}

      {/* Modal Crear Publicación */}
      {showCreatePost && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Publicación
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    resetForm();
                    setShowCreatePost(false);
                  }}
                ></button>
              </div>
              
              <form onSubmit={handleCreatePost}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Plataforma</label>
                      <select 
                        className="form-select"
                        value={formData.platform}
                        onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                        required
                      >
                        {platforms.map(platform => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Contenido</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
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
                      ({socialPostUtils.getRemainingChars(formData.content, formData.platform)} restantes)
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hashtags (opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hashtags}
                      onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#hashtag1 #hashtag2 #hashtag3"
                    />
                    <div className="form-text">Separa los hashtags con espacios. Se agregarán # automáticamente si no los incluyes.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notas internas (opcional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas sobre esta publicación..."
                    ></textarea>
                  </div>

                  {!formData.scheduledDate && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Sin fecha programada, se guardará como <strong>borrador</strong>
                    </div>
                  )}

                  {!serverConnected && (
                    <div className="alert alert-warning">
                      <i className="bi bi-wifi-off me-2"></i>
                      <strong>Modo sin conexión:</strong> La publicación se guardará localmente y se sincronizará cuando se restablezca la conexión.
                    </div>
                  )}
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      resetForm();
                      setShowCreatePost(false);
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

      {/* Modal Editar Publicación */}
      {showEditPost && editingPost && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar Publicación
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    resetForm();
                    setShowEditPost(false);
                  }}
                ></button>
              </div>
              
              <form onSubmit={handleUpdatePost}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Plataforma</label>
                      <select 
                        className="form-select"
                        value={formData.platform}
                        onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                        required
                        disabled={editingPost.status === 'published'}
                      >
                        {platforms.map(platform => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        min={editingPost.status === 'published' ? undefined : new Date().toISOString().split('T')[0]}
                        disabled={editingPost.status === 'published'}
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        disabled={editingPost.status === 'published'}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Contenido</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
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
                      ({socialPostUtils.getRemainingChars(formData.content, formData.platform)} restantes)
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hashtags (opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hashtags}
                      onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#hashtag1 #hashtag2 #hashtag3"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notas internas (opcional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas sobre esta publicación..."
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
                      <strong>Modo sin conexión:</strong> Los cambios se guardarán localmente y se sincronizarán cuando se restablezca la conexión.
                    </div>
                  )}
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      resetForm();
                      setShowEditPost(false);
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

      {/* Estilos adicionales */}
      <style jsx>{`
        .hover-card {
          transition: all 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .modal.show {
          backdrop-filter: blur(2px);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProjectSocial;