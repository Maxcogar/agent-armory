import { Link } from 'react-router-dom';

export default function ProjectList({ projects }) {
  if (!projects.length) {
    return (
      <div className="empty-state">
        <p>No projects yet. Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <div key={project._id} className="project-card">
          <div className="project-card-header">
            <Link to={`/projects/${project._id}`} className="project-name">
              {project.name}
            </Link>
            <span className={`status-badge status-${project.status}`}>
              {project.status}
            </span>
          </div>
          <p className="project-description">
            {project.description || 'No description'}
          </p>
          <div className="project-card-footer">
            <span className="member-count">
              {project.memberCount || project.members?.length || 0} members
            </span>
            <span className="project-date">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
