// client/src/components/project-tabs/ProjectSocial.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import socialPostService, { socialPostUtils } from '../../services/socialPostService';
import SocialCalendar from './SocialCalendar';
import './ProjectSocial.css';

const ProjectSocial = ({ projectId, project }) => {
  const { user } = useAuth();
  
  // Estados principales
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔧 DEBUG: Log para verificar el estado de posts
  console.log('🔍 ProjectSocial - posts actual:', posts, 'es array:', Array.isArray(posts));
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'calendar'
  const [serverConnected, setServerConnected] = useState(true);
  
  // 🆕 NUEVO: Estado para notificaciones
  const [notification, setNotification] = useState(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    platform: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // 🆕 NUEVO: Estado separado para el input de búsqueda (sin causar re-renders)
  const [searchInput, setSearchInput] = useState('');
  
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

  // 🆕 NUEVO: Sistema de notificaciones (wrapped in useCallback)
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Datos de demostración (fallback cuando no hay conexión)
  const getDemoData = useCallback(() => [
    {
      _id: 'demo-1',
      platform: 'instagram',
      content: '¡Estamos trabajando en algo increíble! 🚀 Muy pronto tendremos grandes noticias que compartir con todos ustedes. #innovación #desarrollo #futuro',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      author: { 
        name: user?.name || 'Usuario Demo', 
        email: user?.email || 'demo@planifica.com' 
      },
      hashtags: ['#innovación', '#desarrollo', '#futuro'],
      notes: 'Publicación programada para mañana',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'demo-2',
      platform: 'twitter',
      content: 'Reflexionando sobre los avances del equipo esta semana. El progreso constante es clave para el éxito! 💪 #productividad #equipo',
      scheduledDate: new Date(Date.now() + 172800000).toISOString(),
      status: 'draft',
      author: { 
        name: user?.name || 'Usuario Demo', 
        email: user?.email || 'demo@planifica.com' 
      },
      hashtags: ['#productividad', '#equipo'],
      notes: 'Borrador para revisar',
      createdAt: new Date().toISOString()
    }
  ], [user]);

  // Función simplificada para recargar publicaciones (sin filtros, siempre carga todo)
  const loadPosts = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Recargando todas las publicaciones del proyecto:', projectId);
      
      // Siempre cargar todas las publicaciones sin filtros
      const response = await socialPostService.getProjectPosts(projectId);
      
      // 🔧 CORRECCIÓN: Asegurar que siempre tengamos un array
      let postsData = [];
      
      if (response && Array.isArray(response)) {
        postsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response && Array.isArray(response.posts)) {
        postsData = response.posts;
      } else {
        console.warn('⚠️ Respuesta del servicio no es un array válido:', response);
        postsData = [];
      }
      
      console.log('✅ Recarga completada, total de publicaciones:', postsData.length);
      setPosts(postsData);
      setServerConnected(true);
    } catch (error) {
      console.error('❌ Error recargando publicaciones:', error);
      setServerConnected(false);
      
      // Usar datos de demostración como fallback
      console.log('📡 Usando datos de demostración...');
      const demoData = getDemoData();
      setPosts(demoData);
      showNotification('⚠️ Error de conexión - Mostrando datos de demostración', 'warning');
    } finally {
      setLoading(false);
    }
  }, [projectId, getDemoData, showNotification]);

  // 🆕 NUEVO: Efecto separado para recargar cuando cambien los filtros
  useEffect(() => {
    if (projectId && filters) {
      const filterLoad = async () => {
        try {
          setLoading(true);
          console.log('🔄 Aplicando filtros:', filters);
          
          const response = await socialPostService.getProjectPosts(projectId, filters);
          
          // Asegurar que siempre tengamos un array
          let postsData = [];
          
          if (response && Array.isArray(response)) {
            postsData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            postsData = response.data;
          } else if (response && Array.isArray(response.posts)) {
            postsData = response.posts;
          } else {
            // Aplicar filtros localmente si el servicio no responde
            const currentPosts = Array.isArray(posts) ? posts : getDemoData();
            postsData = currentPosts; // En este caso, la función getFilteredPosts manejará el filtrado
          }
          
          console.log('✅ Filtros aplicados:', postsData);
          setPosts(postsData);
          setServerConnected(true);
        } catch (error) {
          console.error('❌ Error aplicando filtros:', error);
          // No cambiar el estado de loading ni posts si solo falló el filtrado
          console.log('📡 Aplicando filtros localmente...');
        } finally {
          setLoading(false);
        }
      };
      
      // Solo ejecutar si hay filtros activos, si no mantener los datos actuales
      if (filters.platform || filters.status || filters.search || filters.dateFrom || filters.dateTo) {
        filterLoad();
      }
    }
  }, [filters, projectId]); // Este efecto se ejecuta cuando cambian los filtros

  // Cargar datos al montar el componente (solo la primera vez)
  useEffect(() => {
    if (projectId) {
      // Llamar loadPosts directamente
      loadPosts();
    }
  }, [projectId, loadPosts]); // Cuando cambie el projectId o loadPosts

  // 🆕 NUEVO: Debounce para la búsqueda - evita que se pierda el foco
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Solo actualizar el filtro de búsqueda si el valor cambió
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput }));
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId);
  }, [searchInput, filters.search]);

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
    // 🔧 CORRECCIÓN: Asegurar que posts siempre sea un array
    if (!Array.isArray(posts)) {
      console.warn('⚠️ posts no es un array:', posts);
      return [];
    }

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
        post.content?.toLowerCase().includes(searchLower) ||
        (post.hashtags && Array.isArray(post.hashtags) && post.hashtags.some(tag => tag.toLowerCase().includes(searchLower))) ||
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
      hashtags: (post.hashtags && Array.isArray(post.hashtags) ? post.hashtags.join(' ') : ''),
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
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification(validation.error, 'error');
        return;
      }
      
      // Combinar fecha y hora si se proporciona fecha
      let scheduledDateTime = null;
      if (formData.scheduledDate) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`);
        
        // Validar que la fecha no sea en el pasado
        if (scheduledDateTime < new Date()) {
          // 🔄 CAMBIO: De alert() a showNotification()
          showNotification('No puedes programar una publicación en el pasado', 'error');
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
        await socialPostService.createPost(postData);
        
        // El servicio ya retorna los datos directamente
        console.log('✅ Publicación creada en servidor');
        await loadPosts(); // Recargar desde servidor
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification('¡Publicación creada exitosamente!', 'success');
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
        
        setPosts(prevPosts => {
          // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
          const currentPosts = Array.isArray(prevPosts) ? prevPosts : [];
          return [localPost, ...currentPosts];
        });
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification('📱 Publicación guardada localmente (sin conexión al servidor)', 'warning');
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
      
      setPosts(prevPosts => {
        // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
        const currentPosts = Array.isArray(prevPosts) ? prevPosts : [];
        return [localPost, ...currentPosts];
      });
      setShowCreatePost(false);
      setServerConnected(false);
      
      // 🔄 CAMBIO: De alert() a showNotification()
      showNotification('⚠️ Error de conexión. Publicación guardada localmente.', 'warning');
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
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification(validation.error, 'error');
        return;
      }
      
      // Combinar fecha y hora
      let scheduledDateTime = null;
      if (formData.scheduledDate) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '12:00'}`);
        
        // Para posts no publicados, validar fecha futura
        if (editingPost.status !== 'published' && scheduledDateTime < new Date()) {
          // 🔄 CAMBIO: De alert() a showNotification()
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
        await socialPostService.updatePost(editingPost._id, updateData);
        
        // El servicio ya retorna los datos directamente
        await loadPosts();
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification('✅ Publicación actualizada correctamente', 'success');
      } else {
        // Actualizar localmente
        setPosts(prevPosts => {
          // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
          if (!Array.isArray(prevPosts)) {
            console.warn('⚠️ prevPosts no es un array, reinicializando');
            return [{
              ...updateData,
              _id: editingPost._id,
              status: formData.scheduledDate ? 
                (editingPost.status === 'published' ? 'published' : 'scheduled') : 
                'draft',
              updatedAt: new Date().toISOString()
            }];
          }
          
          return prevPosts.map(post => 
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
          );
        });
        
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification('📝 Publicación actualizada localmente', 'warning');
      }
      
      setShowEditPost(false);
      
    } catch (error) {
      console.error('❌ Error actualizando publicación:', error);
      
      // Fallback: actualizar localmente
      setPosts(prevPosts => {
        // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
        if (!Array.isArray(prevPosts)) {
          console.warn('⚠️ prevPosts no es un array en catch updatePost');
          return [];
        }
        
        return prevPosts.map(post => 
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
        );
      });
      
      setShowEditPost(false);
      setServerConnected(false);
      
      // 🔄 CAMBIO: De alert() a showNotification()
      showNotification('⚠️ Error de conexión. Publicación actualizada localmente.', 'warning');
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
        await socialPostService.deletePost(postId);
        
        // El servicio ya retorna los datos directamente
        await loadPosts();
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification('🗑️ Publicación eliminada correctamente', 'success');
        return;
      }
      
      // Eliminar localmente
      setPosts(prevPosts => {
        // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
        const currentPosts = Array.isArray(prevPosts) ? prevPosts : [];
        return currentPosts.filter(post => post._id !== postId);
      });
      // 🔄 CAMBIO: De alert() a showNotification()
      showNotification('🗑️ Publicación eliminada localmente', 'warning');
      
    } catch (error) {
      console.error('❌ Error eliminando publicación:', error);
      
      // Fallback: eliminar localmente
      setPosts(prevPosts => {
        // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
        const currentPosts = Array.isArray(prevPosts) ? prevPosts : [];
        return currentPosts.filter(post => post._id !== postId);
      });
      setServerConnected(false);
      // 🔄 CAMBIO: De alert() a showNotification()
      showNotification('⚠️ Error de conexión. Publicación eliminada localmente.', 'warning');
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
      hashtags: Array.isArray(post.hashtags) ? [...post.hashtags] : [],
      notes: `Duplicado de: ${post.notes || 'Sin notas'}`,
      createdAt: new Date().toISOString()
    };
    
    setPosts(prevPosts => {
      // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
      const currentPosts = Array.isArray(prevPosts) ? prevPosts : [];
      return [duplicatedPost, ...currentPosts];
    });
    // 🔄 CAMBIO: De alert() a showNotification()
    showNotification('📋 Publicación duplicada como borrador', 'success');
    setShowActionsFor(null);
  };

  // Cambiar estado de publicación
  const handleChangeStatus = async (postId, newStatus) => {
    console.log('🔄 Cambiando estado de publicación:', postId, 'a', newStatus);
    
    try {
      if (serverConnected && !postId.startsWith('local-')) {
        await socialPostService.updatePostStatus(postId, newStatus);
        
        // El servicio ya retorna los datos directamente
        await loadPosts();
        // 🔄 CAMBIO: De alert() a showNotification()
        showNotification(`✅ Estado cambiado a: ${socialPostUtils.getStatusBadge(newStatus).text}`, 'success');
        return;
      }
      
      // Cambiar estado localmente
      setPosts(prevPosts => {
        // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
        if (!Array.isArray(prevPosts)) {
          console.warn('⚠️ prevPosts no es un array en changeStatus');
          return [];
        }
        
        return prevPosts.map(post => 
          post._id === postId 
            ? { ...post, status: newStatus }
            : post
        );
      });
      
      const statusMessages = {
        'draft': '📝 Marcado como borrador',
        'scheduled': '⏰ Marcado como programado', 
        'published': '✅ Marcado como publicado'
      };
      
      // 🔄 CAMBIO: De alert() a showNotification()
      showNotification(statusMessages[newStatus] || `Estado cambiado a: ${newStatus}`, 'success');
      
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      
      // Fallback: cambiar localmente
      setPosts(prevPosts => {
        // 🔧 CORRECCIÓN: Asegurar que prevPosts sea un array
        if (!Array.isArray(prevPosts)) {
          console.warn('⚠️ prevPosts no es un array en catch changeStatus');
          return [];
        }
        
        return prevPosts.map(post => 
          post._id === postId 
            ? { ...post, status: newStatus }
            : post
        );
      });
      
      setServerConnected(false);
      // 🔄 CAMBIO: De alert() a showNotification()
      showNotification('⚠️ Sin conexión - Estado cambiado localmente', 'warning');
    }
    
    setShowActionsFor(null);
  };

  // Toggle menú de acciones
  const toggleActions = (e, postId) => {
    e.stopPropagation();
    setShowActionsFor(showActionsFor === postId ? null : postId);
  };

  // Renderizar contenido según el modo de vista
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando publicaciones...</p>
        </div>
      );
    }

    if (viewMode === 'calendar') {
      return <SocialCalendar projectId={projectId} project={project} />;
    }

    // Vista de lista
    const filteredPosts = getFilteredPosts();

    return (
      <div className="list-view">
        {/* Panel de filtros */}
        {showFilters && (
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtros
              </h6>
              {(filters.platform || filters.status || filters.search) && (
                <span className="badge bg-primary">
                  {getFilteredPosts().length} de {Array.isArray(posts) ? posts.length : 0} publicaciones
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Plataforma</label>
                  <select 
                    className="form-select"
                    value={filters.platform}
                    onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                  >
                    <option value="">Todas</option>
                    {platforms.map(platform => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="draft">Borrador</option>
                    <option value="scheduled">Programado</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Buscar</label>
                  <div className="input-group">
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Buscar en contenido, hashtags, notas..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                      <button 
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchInput('')}
                        title="Limpiar búsqueda"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  {searchInput && searchInput !== filters.search && (
                    <small className="form-text text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Buscando: "{searchInput}"...
                    </small>
                  )}
                  {filters.search && (
                    <small className="form-text text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Filtro activo: "{filters.search}"
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de publicaciones */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar2-x text-muted" style={{ fontSize: '3rem' }}></i>
            <h6 className="mt-3 text-muted">
              {searchInput && searchInput !== filters.search ? 'Buscando...' : 'No hay publicaciones'}
            </h6>
            <p className="text-muted mb-3">
              {searchInput && searchInput !== filters.search 
                ? `Buscando "${searchInput}"...`
                : filters.platform || filters.status || filters.search 
                ? 'No se encontraron publicaciones con los filtros aplicados'
                : 'Comienza creando tu primera publicación social'
              }
            </p>
            {(filters.platform || filters.status || filters.search) && (
              <button 
                className="btn btn-outline-secondary me-2 mb-3"
                onClick={() => {
                  setFilters({
                    platform: '',
                    status: '',
                    search: '',
                    dateFrom: '',
                    dateTo: ''
                  });
                  setSearchInput(''); // 🆕 NUEVO: También resetear el input de búsqueda
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar filtros
              </button>
            )}
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowCreatePost(true);
              }}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Crear primera publicación
            </button>
          </div>
        ) : (
          <div className="row">
            {filteredPosts && Array.isArray(filteredPosts) && filteredPosts.map(post => (
              <div key={post._id} className="col-xl-4 col-lg-6 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        <i className={`bi ${socialPostUtils.getPlatformConfig(post.platform).icon} text-${socialPostUtils.getPlatformConfig(post.platform).color} me-2`}></i>
                        <span className={`badge bg-${socialPostUtils.getPlatformConfig(post.platform).color}`}>
                          {socialPostUtils.getPlatformConfig(post.platform).name}
                        </span>
                      </div>
                      
                      <div className="position-relative">
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(e) => toggleActions(e, post._id)}
                        >
                          <i className="bi bi-three-dots"></i>
                        </button>
                        
                        {showActionsFor === post._id && (
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
                            
                            <div className="dropdown-divider"></div>
                            
                            <button 
                              className="btn btn-sm btn-light w-100 text-start mb-1"
                              onClick={() => handleChangeStatus(post._id, 'draft')}
                              disabled={post.status === 'draft'}
                            >
                              <i className="bi bi-pencil-square me-2"></i>Marcar como borrador
                            </button>
                            
                            <button 
                              className="btn btn-sm btn-light w-100 text-start mb-1"
                              onClick={() => handleChangeStatus(post._id, 'scheduled')}
                              disabled={post.status === 'scheduled'}
                            >
                              <i className="bi bi-clock me-2"></i>Marcar como programado
                            </button>
                            
                            <button 
                              className="btn btn-sm btn-light w-100 text-start mb-1"
                              onClick={() => handleChangeStatus(post._id, 'published')}
                              disabled={post.status === 'published'}
                            >
                              <i className="bi bi-check-circle me-2"></i>Marcar como publicado
                            </button>
                            
                            <div className="dropdown-divider"></div>
                            
                            <button 
                              className="btn btn-sm btn-outline-danger w-100 text-start"
                              onClick={() => handleDeletePost(post._id)}
                            >
                              <i className="bi bi-trash me-2"></i>Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="card-text">{post.content}</p>
                    
                    {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                      <div className="mb-3">
                        {post.hashtags.map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark me-1 mb-1">
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
                      
                      <span className={`badge ${socialPostUtils.getStatusBadge(post.status).class}`}>
                        {socialPostUtils.getStatusBadge(post.status).text}
                      </span>
                    </div>
                    
                    {post.notes && (
                      <div className="mt-2">
                        <small className="text-muted">
                          <i className="bi bi-sticky me-1"></i>
                          {post.notes}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <div className="col-12">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Error cargando publicaciones. Intenta recargar la página.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de modo offline */}
        {!serverConnected && (
          <div className="alert alert-warning mt-4">
            <div className="d-flex align-items-center">
              <i className="bi bi-wifi-off me-3"></i>
              <div>
                <strong>Modo sin conexión</strong>
                <br />
                <small>
                  Los cambios se están guardando localmente. 
                  Se sincronizarán cuando se restablezca la conexión.
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
          </div>
        )}
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
          {/* Botón de filtros (solo en vista lista) */}
          {viewMode === 'list' && (
            <button
              className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline-primary'} me-2`}
              onClick={() => setShowFilters(!showFilters)}
              title="Filtros"
            >
              <i className="bi bi-funnel"></i>
              {(filters.platform || filters.status || filters.search) && (
                <span className="badge bg-warning text-dark ms-1">!</span>
              )}
            </button>
          )}
          
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
                  onClick={() => setShowCreatePost(false)}
                ></button>
              </div>
              
              <form onSubmit={handleCreatePost}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
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
                    
                    <div className="col-md-3">
                      <label className="form-label">Fecha</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Hora</label>
                      <input 
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label">Contenido</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      placeholder="Escribe el contenido de tu publicación..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      required
                    ></textarea>
                    <div className="form-text">
                      {socialPostUtils.getRemainingChars(formData.content, formData.platform)} caracteres restantes
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label">Hashtags</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Ej: #marketing #redes #sociales"
                      value={formData.hashtags}
                      onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label">Notas (opcional)</label>
                    <textarea 
                      className="form-control"
                      rows="2"
                      placeholder="Notas internas sobre esta publicación..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    ></textarea>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check me-1"></i>
                    Crear Publicación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Publicación */}
      {showEditPost && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Editar Publicación
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowEditPost(false)}
                ></button>
              </div>
              
              <form onSubmit={handleUpdatePost}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
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
                    
                    <div className="col-md-3">
                      <label className="form-label">Fecha</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">Hora</label>
                      <input 
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label">Contenido</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      placeholder="Escribe el contenido de tu publicación..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      required
                    ></textarea>
                    <div className="form-text">
                      {socialPostUtils.getRemainingChars(formData.content, formData.platform)} caracteres restantes
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label">Hashtags</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Ej: #marketing #redes #sociales"
                      value={formData.hashtags}
                      onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label">Notas (opcional)</label>
                    <textarea 
                      className="form-control"
                      rows="2"
                      placeholder="Notas internas sobre esta publicación..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    ></textarea>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowEditPost(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check me-1"></i>
                    Actualizar Publicación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NUEVO: Sistema de notificaciones visuales */}
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
              } me-2`}></i>
              <span>{notification.message}</span>
              <button
                type="button"
                className="btn-close ms-auto"
                onClick={() => setNotification(null)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSocial;