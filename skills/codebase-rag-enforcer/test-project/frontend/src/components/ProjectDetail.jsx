import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { projectsApi } from '@/services/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, loading, error, execute: fetchProject } = useApi(projectsApi.getById);
  const { execute: deleteProject } = useApi(projectsApi.delete);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchProject(id);
  }, [fetchProject, id]);

  useEffect(() => {
    if (project?.project) {
      setEditName(project.project.name);
      setEditDesc(project.project.description || '');
    }
  }, [project]);

  const handleSave = async () => {
    await projectsApi.update(id, { name: editName, description: editDesc });
    setIsEditing(false);
    fetchProject(id);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
      navigate('/');
    }
  };

  if (loading) return <div className="loading">Loading project...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!project?.project) return null;

  const proj = project.project;

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="edit-name-input"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="edit-desc-input"
            />
            <div className="edit-actions">
              <button onClick={handleSave} className="btn-primary">Save</button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h1>{proj.name}</h1>
            <p>{proj.description || 'No description'}</p>
            <div className="project-actions">
              <button onClick={() => setIsEditing(true)} className="btn-secondary">Edit</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </>
        )}
      </div>

      <section className="project-members">
        <h2>Members ({proj.members?.length || 0})</h2>
        <ul className="member-list">
          {proj.members?.map((m) => (
            <li key={m.user._id} className="member-item">
              <span className="member-name">{m.user.name}</span>
              <span className="member-role">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="project-meta">
        <span>Status: {proj.status}</span>
        <span>Created: {new Date(proj.createdAt).toLocaleDateString()}</span>
        <span>Owner: {proj.owner?.name}</span>
      </section>
    </div>
  );
}
