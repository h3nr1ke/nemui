import { useState } from 'react';
import { useAppStore } from '../store';
import type { Project } from '@nemui/core';

export function ProjectSelector() {
  const { 
    projects, 
    activeProjectId, 
    setActiveProject, 
    addProject, 
    deleteProject,
    getFilteredCollections 
  } = useAppStore();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const filteredCollections = getFilteredCollections();

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const project: Project = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || undefined,
      createdAt: Date.now()
    };
    
    addProject(project);
    setActiveProject(project.id);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProject(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Delete this project and all its collections?')) {
      deleteProject(projectId);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="project-selector">
      <div className="project-header">
        <h3>Projects</h3>
        <button 
          className="add-btn" 
          onClick={() => setShowNewProject(!showNewProject)}
          title="New Project"
        >
          +
        </button>
      </div>

      {showNewProject && (
        <div className="new-project-form">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="project-input"
          />
          <input
            type="text"
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
            placeholder="Description (optional)"
            className="project-input"
          />
          <div className="project-form-actions">
            <button className="create-btn" onClick={handleCreateProject}>
              Create
            </button>
            <button className="cancel-btn" onClick={() => setShowNewProject(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="project-list">
        {/* All Projects option */}
        <div 
          className={`project-item ${activeProjectId === null ? 'active' : ''}`}
          onClick={() => setActiveProject(null)}
        >
          <span className="project-icon">📁</span>
          <span className="project-name">All Projects</span>
          <span className="project-count">
            {useAppStore.getState().collections.length}
          </span>
        </div>

        {projects.map(project => (
          <div 
            key={project.id}
            className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
            onClick={() => setActiveProject(project.id)}
          >
            <span className="project-icon">📂</span>
            <span className="project-name">{project.name}</span>
            <span className="project-count">
              {useAppStore.getState().collections.filter(c => c.projectId === project.id).length}
            </span>
            <button 
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProject(project.id);
              }}
              title="Delete Project"
            >
              ×
            </button>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="no-projects">
            No projects yet. Click + to create one.
          </div>
        )}
      </div>

      {activeProject && (
        <div className="active-project-info">
          <small>
            Viewing: <strong>{activeProject.name}</strong>
            <br />
            {filteredCollections.length} collection(s)
          </small>
        </div>
      )}
    </div>
  );
}
