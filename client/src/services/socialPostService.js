// client/src/services/socialPostService.js
import { socialPostAPI, handleApiError } from './api';

export const socialPostService = {
  // Crear nueva publicación
  createPost: async (postData) => {
    try {
      console.log('📝 Creando publicación social:', postData);
      const response = await socialPostAPI.create(postData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando publicación:', error);
      throw new Error(handleApiError(error, 'Error al crear la publicación'));
    }
  },

  // Obtener publicaciones de un proyecto
  getProjectPosts: async (projectId, filters = {}) => {
    try {
      console.log('📋 Cargando publicaciones del proyecto:', projectId, 'con filtros:', filters);
      const response = await socialPostAPI.getByProject(projectId, filters);
      return response.data;
    } catch (error) {
      console.error('❌ Error cargando publicaciones:', error);
      throw new Error(handleApiError(error, 'Error al cargar las publicaciones'));
    }
  },

  // Obtener una publicación específica
  getPost: async (postId) => {
    try {
      console.log('🔍 Obteniendo publicación:', postId);
      const response = await socialPostAPI.getById(postId);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo publicación:', error);
      throw new Error(handleApiError(error, 'Error al obtener la publicación'));
    }
  },

  // Actualizar publicación
  updatePost: async (postId, updateData) => {
    try {
      console.log('✏️ Actualizando publicación:', postId, updateData);
      const response = await socialPostAPI.update(postId, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando publicación:', error);
      throw new Error(handleApiError(error, 'Error al actualizar la publicación'));
    }
  },

  // Eliminar publicación
  deletePost: async (postId) => {
    try {
      console.log('🗑️ Eliminando publicación:', postId);
      const response = await socialPostAPI.delete(postId);
      return response.data;
    } catch (error) {
      console.error('❌ Error eliminando publicación:', error);
      throw new Error(handleApiError(error, 'Error al eliminar la publicación'));
    }
  },

  // Cambiar estado de publicación
  updatePostStatus: async (postId, status) => {
    try {
      console.log('🔄 Cambiando estado de publicación:', postId, 'a', status);
      const response = await socialPostAPI.updateStatus(postId, status);
      return response.data;
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      throw new Error(handleApiError(error, 'Error al cambiar el estado'));
    }
  },

  // Obtener estadísticas de publicaciones
  getProjectStats: async (projectId) => {
    try {
      console.log('📊 Obteniendo estadísticas del proyecto:', projectId);
      const response = await socialPostAPI.getStats(projectId);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(handleApiError(error, 'Error al obtener las estadísticas'));
    }
  },

  // Duplicar publicación
  duplicatePost: async (postId, newScheduledDate) => {
    try {
      console.log('📋 Duplicando publicación:', postId, 'para fecha:', newScheduledDate);
      const response = await socialPostAPI.duplicate(postId, newScheduledDate);
      return response.data;
    } catch (error) {
      console.error('❌ Error duplicando publicación:', error);
      throw new Error(handleApiError(error, 'Error al duplicar la publicación'));
    }
  },

  // Obtener publicaciones por rango de fechas
  getPostsByDateRange: async (projectId, startDate, endDate) => {
    try {
      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      return await socialPostService.getProjectPosts(projectId, filters);
    } catch (error) {
      console.error('❌ Error obteniendo publicaciones por fecha:', error);
      throw new Error(handleApiError(error, 'Error al obtener publicaciones por fecha'));
    }
  },

  // Obtener publicaciones por plataforma
  getPostsByPlatform: async (projectId, platform) => {
    try {
      const filters = { platform };
      return await socialPostService.getProjectPosts(projectId, filters);
    } catch (error) {
      console.error('❌ Error obteniendo publicaciones por plataforma:', error);
      throw new Error(handleApiError(error, 'Error al obtener publicaciones por plataforma'));
    }
  },

  // Obtener publicaciones por estado
  getPostsByStatus: async (projectId, status) => {
    try {
      const filters = { status };
      return await socialPostService.getProjectPosts(projectId, filters);
    } catch (error) {
      console.error('❌ Error obteniendo publicaciones por estado:', error);
      throw new Error(handleApiError(error, 'Error al obtener publicaciones por estado'));
    }
  },

  // Programar publicación para hoy
  scheduleForToday: async (postId, time = '12:00') => {
    try {
      const today = new Date();
      const [hours, minutes] = time.split(':');
      today.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return await socialPostService.updatePost(postId, {
        scheduledDate: today.toISOString(),
        status: 'scheduled'
      });
    } catch (error) {
      console.error('❌ Error programando para hoy:', error);
      throw new Error(handleApiError(error, 'Error al programar para hoy'));
    }
  }
};

// Utilidades para el manejo de fechas y formatos
export const socialPostUtils = {
  // Formatear fecha para mostrar
  formatScheduledDate: (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `Hoy a las ${date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (diffDays === 1) {
        return `Mañana a las ${date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (diffDays === -1) {
        return `Ayer a las ${date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (diffDays > 0 && diffDays <= 7) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return `${dayNames[date.getDay()]} a las ${date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else {
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  },

  // Obtener icono y color por plataforma
  getPlatformConfig: (platform) => {
    const platforms = {
      instagram: {
        name: 'Instagram',
        icon: 'bi-instagram',
        color: 'danger',
        bgColor: '#E4405F',
        maxLength: 2200
      },
      facebook: {
        name: 'Facebook',
        icon: 'bi-facebook',
        color: 'primary',
        bgColor: '#1877F2',
        maxLength: 63206
      },
      twitter: {
        name: 'Twitter/X',
        icon: 'bi-twitter-x',
        color: 'dark',
        bgColor: '#000000',
        maxLength: 280
      },
      linkedin: {
        name: 'LinkedIn',
        icon: 'bi-linkedin',
        color: 'info',
        bgColor: '#0A66C2',
        maxLength: 3000
      },
      tiktok: {
        name: 'TikTok',
        icon: 'bi-tiktok',
        color: 'dark',
        bgColor: '#000000',
        maxLength: 150
      }
    };

    return platforms[platform] || {
      name: platform,
      icon: 'bi-share',
      color: 'secondary',
      bgColor: '#6c757d',
      maxLength: 1000
    };
  },

  // Obtener badge de estado
  getStatusBadge: (status) => {
    const badges = {
      draft: { class: 'bg-secondary', text: 'Borrador' },
      scheduled: { class: 'bg-warning text-dark', text: 'Programado' },
      published: { class: 'bg-success', text: 'Publicado' },
      failed: { class: 'bg-danger', text: 'Falló' },
      cancelled: { class: 'bg-secondary', text: 'Cancelado' }
    };

    return badges[status] || { class: 'bg-secondary', text: 'Desconocido' };
  },

  // Validar contenido según plataforma
  validateContent: (content, platform) => {
    const config = socialPostUtils.getPlatformConfig(platform);
    
    if (!content || content.trim().length === 0) {
      return {
        valid: false,
        error: 'El contenido no puede estar vacío'
      };
    }
    
    if (content.length > config.maxLength) {
      return {
        valid: false,
        error: `El contenido excede el límite de ${config.maxLength} caracteres para ${config.name}`
      };
    }

    return { valid: true };
  },

  // Extraer hashtags del contenido
  extractHashtags: (content) => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    return content.match(hashtagRegex) || [];
  },

  // Contar caracteres restantes
  getRemainingChars: (content, platform) => {
    const config = socialPostUtils.getPlatformConfig(platform);
    return config.maxLength - content.length;
  },

  // Generar hashtags sugeridos basados en el contenido
  suggestHashtags: (content, project) => {
    const words = content.toLowerCase().split(/\s+/);
    const suggestions = [];
    
    // Agregar hashtag del proyecto si existe
    if (project?.name) {
      const projectTag = project.name.replace(/\s+/g, '').toLowerCase();
      suggestions.push(`#${projectTag}`);
    }
    
    // Sugerir hashtags basados en palabras clave
    const keywords = words.filter(word => 
      word.length >= 4 && 
      !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(word) &&
      /^[a-zA-Z]+$/.test(word)
    );
    
    keywords.slice(0, 3).forEach(keyword => {
      suggestions.push(`#${keyword}`);
    });
    
    return [...new Set(suggestions)]; // Remover duplicados
  }
};

export default socialPostService;