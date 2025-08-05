import React, { useState } from "react";
import "../../styles/TacheCSS/ListeTache.css";

const ListeTache = ({ taches, allTaches, onTacheClick, userInfo }) => {
  const [activeFilter, setActiveFilter] = useState("Mes tâches");
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());
  const [collapsedPhases, setCollapsedPhases] = useState(new Set());

  // Filtrer les tâches selon le filtre actif
  const getFilteredTaches = () => {
    let filteredTaches = [];
    
    if (activeFilter === "Mes tâches") {
      // Mes tâches : vérifier si l'utilisateur est dans la liste des utilisateurs assignés
      filteredTaches = taches.filter(tache => 
        tache.utilisateurs && tache.utilisateurs.some(user => user.matricule === userInfo.matricule)
      );
    } else {
      // Toutes les tâches
      filteredTaches = allTaches || [];
    }
    
    return filteredTaches;
  };

  // Grouper par projet puis par phase
  const getGroupedTaches = () => {
    const filteredTaches = getFilteredTaches();
    const grouped = {};

    filteredTaches.forEach(tache => {
      const projetKey = tache.nom_projet || 'Projet non défini';
      const phaseKey = tache.libelle_phase || 'Phase non définie';
      
      if (!grouped[projetKey]) {
        grouped[projetKey] = {};
      }
      if (!grouped[projetKey][phaseKey]) {
        grouped[projetKey][phaseKey] = [];
      }
      
      grouped[projetKey][phaseKey].push(tache);
    });

    // Trier les tâches dans chaque phase
    Object.keys(grouped).forEach(projet => {
      Object.keys(grouped[projet]).forEach(phase => {
        grouped[projet][phase].sort((a, b) => {
          const statusOrder = { "En cours": 0, "Non démarré": 1, "Terminé": 2 };
          if (statusOrder[a.statut] !== statusOrder[b.statut]) {
            return statusOrder[a.statut] - statusOrder[b.statut];
          }
          return new Date(a.date_debut) - new Date(b.date_debut);
        });
      });
    });

    return grouped;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusClass = (statut) => {
    switch (statut) {
      case "Non démarré":
        return "non-demarre";
      case "En cours":
        return "en-cours";
      case "Terminé":
        return "termine";
      default:
        return "non-demarre";
    }
  };

  // Fonction pour obtenir les utilisateurs assignés d'une tâche
  const getAssignedUsers = (tache) => {
    return tache.utilisateurs || [];
  };

  // Fonction pour basculer l'état d'un projet
  const toggleProject = (projectName) => {
    const newCollapsedProjects = new Set(collapsedProjects);
    if (newCollapsedProjects.has(projectName)) {
      newCollapsedProjects.delete(projectName);
    } else {
      newCollapsedProjects.add(projectName);
    }
    setCollapsedProjects(newCollapsedProjects);
  };

  // Fonction pour basculer l'état d'une phase
  const togglePhase = (phaseKey) => {
    const newCollapsedPhases = new Set(collapsedPhases);
    if (newCollapsedPhases.has(phaseKey)) {
      newCollapsedPhases.delete(phaseKey);
    } else {
      newCollapsedPhases.add(phaseKey);
    }
    setCollapsedPhases(newCollapsedPhases);
  };

  const groupedTaches = getGroupedTaches();

  return (
    <div className="tache-liste-view">
      {/* Navigation des filtres */}
      <div className="filter-nav">
        <div className="filter-buttons1">
          <button
            className={`view-button ${activeFilter === "Mes tâches" ? "active" : ""}`}
            onClick={() => setActiveFilter("Mes tâches")}
          >
            Mes tâches
          </button>
          <button
            className={`view-button ${activeFilter === "Toutes les tâches" ? "active" : ""}`}
            onClick={() => setActiveFilter("Toutes les tâches")}
          >
            Toutes les tâches
          </button>
        </div>
      </div>

      {/* Affichage groupé par projet et phase */}
      <div className="tasks-container">
        {Object.keys(groupedTaches).length > 0 ? (
          Object.entries(groupedTaches).map(([nomProjet, phases]) => {
            const isProjectCollapsed = collapsedProjects.has(nomProjet);
            const totalTasks = Object.values(phases).reduce((sum, taskList) => sum + taskList.length, 0);
            
            return (
              <div key={nomProjet} className={`project-section ${isProjectCollapsed ? 'collapsed' : ''}`}>
                <div className="project-header">
                  <h3 className="project-title">
                    <i className="bi bi-folder2-open"></i>
                    {nomProjet}
                    <span className="task-count">({totalTasks} tâches)</span>
                  </h3>
                  <button 
                    className="project-toggle-btn"
                    onClick={() => toggleProject(nomProjet)}
                  >
                    <i className={`bi ${isProjectCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                    {isProjectCollapsed ? 'Afficher' : 'Masquer'}
                  </button>
                </div>
                
                {Object.entries(phases).map(([nomPhase, tachesList]) => {
                  const phaseKey = `${nomProjet}-${nomPhase}`;
                  const isPhaseCollapsed = collapsedPhases.has(phaseKey);
                  
                  return (
                    <div key={phaseKey} className={`phase-section ${isPhaseCollapsed ? 'collapsed' : ''}`}>
                      <div className="phase-header">
                        <h4 className="phase-title">
                          <i className="bi bi-layers"></i>
                          {nomPhase}
                          <span className="task-count">({tachesList.length})</span>
                        </h4>
                        <button 
                          className="phase-toggle-btn"
                          onClick={() => togglePhase(phaseKey)}
                        >
                          <i className={`bi ${isPhaseCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                          {isPhaseCollapsed ? 'Voir' : 'Cacher'}
                        </button>
                      </div>
                      
                      <div className="tasks-list">
                        {tachesList.map((tache) => {
                          const assignedUsers = getAssignedUsers(tache);
                          const mainUser = assignedUsers.length > 0 ? assignedUsers[0] : null;
                          const statusClass = getStatusClass(tache.statut);
                          
                          return (
                            <div
                              key={tache.ref_tache}
                              className="task-item"
                              onClick={() => onTacheClick(tache)}
                            >
                              <div className="task-status-indicator">
                                <div 
                                  className={`status-dot ${statusClass}`}
                                ></div>
                              </div>

                              <div className="task-main-info">
                                <div className="task-title-section">
                                  <h4 className="task-title">{tache.nom_tache}</h4>
                                </div>
                                <p className="task-description">{tache.description}</p>
                                <div className="task-ref">Réf: {tache.ref_tache}</div>
                              </div>

                              <div className="task-meta-info">
                                <div className="task-status1">
                                  <span className={`status-text ${statusClass}`}>{tache.statut}</span>
                                </div>

                                <div className="task-dates">
                                  <div className="date-item">
                                    <i className="bi bi-calendar-event"></i>
                                    <span>Début: {formatDate(tache.date_debut)}</span>
                                  </div>
                                  <div className="date-item due-date">
                                    <i className="bi bi-calendar-x"></i>
                                    <span>Échéance: {formatDate(tache.date_fin_prevu)}</span>
                                  </div>
                                </div>

                                <div className="task-assignee">
                                  <div className="assignee-info">
                                    {assignedUsers.length > 0 ? (
                                      <>
                                        <div className="user-avatar">
                                          {mainUser.avatar ? (
                                            <img 
                                              src={mainUser.avatar} 
                                              alt={`${mainUser.prenom} ${mainUser.nom}`}
                                              className="avatar-img"
                                            />
                                          ) : (
                                            <div className="avatar-placeholder">
                                              {mainUser.prenom?.charAt(0).toUpperCase() || mainUser.nom?.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <div className="assignee-details">
                                          <span className="assignee-name">
                                            {`${mainUser.prenom || ''} ${mainUser.nom || ''}`.trim()}
                                          </span>
                                          {assignedUsers.length > 1 && (
                                            <span className="additional-users">
                                              +{assignedUsers.length - 1} autres
                                            </span>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="user-avatar">
                                          <div className="avatar-placeholder">
                                            <i className="bi bi-person"></i>
                                          </div>
                                        </div>
                                        <div className="assignee-details">
                                          <span className="assignee-name">Non assigné</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="task-actions">
                                <button className="action-btn">
                                  <i className="bi bi-three-dots-vertical"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="no-tasks-status">
            <i className="bi bi-inbox"></i>
            <p>Aucune tâche trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeTache;