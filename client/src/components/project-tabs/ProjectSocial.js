import React, { useState } from 'react';

const ProjectSocial = ({ projectId, project }) => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      platform: 'instagram',
      content: '¡Estamos trabajando en algo increíble! #proyecto #desarrollo',
      scheduledDate: '2024-06-28',
      status: 'scheduled',
      image: null
    },
    {
      id: 2,
      platform: 'twitter',
      content: 'Nuevo update del proyecto: Ya tenemos la autenticación funcionando 🚀',
      scheduledDate: '2024-06-27',
      status: 'published',
      image: null
    },
    {
      id: 3,
      platform: 'linkedin',
      content: 'Compartiendo el progreso de nuestro proyecto de gestión empresarial',
      scheduledDate: '2024-06-30',
      status: 'draft',
      image: null
    }
  ]);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: 'instagram',
    content: '',
    scheduledDate: '',
    image: null
  });

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: 'bi-instagram', color: 'danger' },
    { id: 'twitter', name: 'Twitter', icon: 'bi-twitter', color: 'info' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'bi-linkedin', color: 'primary' },
    { id: 'facebook', name: 'Facebook', icon: 'bi-facebook', color: 'primary' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': return { class: 'bg-success', text: 'Publicado' };
      case 'scheduled': return { class: 'bg-warning', text: 'Programado' };
      case 'draft': return { class: 'bg-secondary', text: 'Borrador' };
      default: return { class: 'bg-secondary', text: 'Desconocido' };
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    const post = {
      id: Date.now(),
      ...newPost,
      status: newPost.scheduledDate ? 'scheduled' : 'draft'
    };
    setPosts([post, ...posts]);
    setNewPost({ platform: 'instagram', content: '', scheduledDate: '', image: null });
    setShowCreatePost(false);
  };

  return (
    <div className="social-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Calendario Social</h5>
          <small className="text-muted">Gestiona las publicaciones del proyecto</small>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreatePost(true)}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nueva Publicación
        </button>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Publicaciones Programadas</h6>
            </div>
            <div className="card-body">
              {posts.map(post => {
                const platform = platforms.find(p => p.id === post.platform);
                const statusBadge = getStatusBadge(post.status);
                
                return (
                  <div key={post.id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center">
                        <i className={`bi ${platform.icon} text-${platform.color} me-2`}></i>
                        <strong>{platform.name}</strong>
                      </div>
                      <span className={`badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <p className="mb-2">{post.content}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        {post.scheduledDate}
                      </small>
                      <div>
                        <button className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-md-4">
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
                <div className="col-4">
                  <div className="text-success fw-bold">
                    {posts.filter(p => p.status === 'published').length}
                  </div>
                  <small className="text-muted">Publicadas</small>
                </div>
                <div className="col-4">
                  <div className="text-warning fw-bold">
                    {posts.filter(p => p.status === 'scheduled').length}
                  </div>
                  <small className="text-muted">Programadas</small>
                </div>
                <div className="col-4">
                  <div className="text-secondary fw-bold">
                    {posts.filter(p => p.status === 'draft').length}
                  </div>
                  <small className="text-muted">Borradores</small>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Próximas Publicaciones</h6>
            </div>
            <div className="card-body">
              {posts
                .filter(p => p.status === 'scheduled')
                .map(post => {
                  const platform = platforms.find(p => p.id === post.platform);
                  return (
                    <div key={post.id} className="d-flex align-items-center mb-2">
                      <i className={`bi ${platform.icon} text-${platform.color} me-2`}></i>
                      <div>
                        <div className="fw-medium" style={{ fontSize: '14px' }}>
                          {platform.name}
                        </div>
                        <small className="text-muted">{post.scheduledDate}</small>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
        {/* Modal Crear Publicación */}
      {showCreatePost && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva Publicación</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreatePost(false)}
                ></button>
              </div>
              <form onSubmit={handleCreatePost}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Plataforma</label>
                    <select 
                      className="form-select"
                      value={newPost.platform}
                      onChange={(e) => setNewPost(prev => ({ ...prev, platform: e.target.value }))}
                    >
                      {platforms.map(platform => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Contenido</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="¿Qué quieres compartir?"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Fecha de publicación</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={newPost.scheduledDate}
                      onChange={(e) => setNewPost(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                    <small className="text-muted">Deja vacío para guardar como borrador</small>
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
                    Crear Publicación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSocial;
