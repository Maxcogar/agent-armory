import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { projectsApi } from '@/services/api';
import ProjectList from '@/components/ProjectList';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, execute: fetchProjects } = useApi(projectsApi.list);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Manage your projects and collaborate with your team.</p>
      </header>

      <section className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{data?.total || 0}</span>
          <span className="stat-label">Total Projects</span>
        </div>
      </section>

      <section className="dashboard-projects">
        <h2>Your Projects</h2>
        {loading && <div className="loading">Loading projects...</div>}
        {error && <div className="error-message">{error}</div>}
        {data && <ProjectList projects={data.projects || []} />}
      </section>
    </div>
  );
}
