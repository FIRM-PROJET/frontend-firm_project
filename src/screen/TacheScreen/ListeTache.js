import React, { useState, useEffect } from "react";
import "../../styles/TacheCSS/ListeTache.css";
import { TacheService } from "../../services/TacheService";

const ListeTache = ({ taches, allTaches, onTacheClick, userInfo }) => {
  const [activeFilter, setActiveFilter] = useState("Mes tâches");
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());
  const [collapsedPhases, setCollapsedPhases] = useState(new Set());
  
  // États pour la vérification des tâches
  const [nonVerifiedTasks, setNonVerifiedTasks] = useState([]);
  const [selectedTasksToVerify, setSelectedTasksToVerify] = useState(new Set());
  const [isLoadingNonVerified, setIsLoadingNonVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // États pour les résultats de vérification
  const [verificationResults, setVerificationResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Charger les tâches non vérifiées quand on passe sur l'onglet Vérification
  useEffect(() => {
    if (activeFilter === "Vérification des tâches") {
      loadNonVerifiedTasks();
    } else if (activeFilter === "Résultats de vérification") {
      loadVerificationResults();
    }
  }, [activeFilter]);

  // Fonction pour charger les résultats de vérification
  const loadVerificationResults = async () => {
    setIsLoadingResults(true);
    try {
      const results = await TacheService.get_verifie_task_by_admin(userInfo.matricule);
      setVerificationResults(results || []);
    } catch (error) {
      console.error("Erreur lors du chargement des résultats de vérification:", error);
      setVerificationResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Fonction pour charger les tâches terminées non vérifiées
  const loadNonVerifiedTasks = async () => {
    setIsLoadingNonVerified(true);
    try {
      const tasks = await TacheService.get_non_verifie_task_user(userInfo.matricule);
      const normalizedTasks = (tasks || []).map(task => ({
        ...task,
        statut: task.statut || "Terminé",
      }));
      setNonVerifiedTasks(normalizedTasks || []);
      setSelectedTasksToVerify(new Set());
    } catch (error) {
      console.error("Erreur lors du chargement des tâches non vérifiées:", error);
      setNonVerifiedTasks([]);
    } finally {
      setIsLoadingNonVerified(false);
    }
  };

  // Fonction pour gérer la sélection d'une tâche à vérifier
  const handleToggleTaskSelection = (refTache) => {
    const newSelection = new Set(selectedTasksToVerify);
    if (newSelection.has(refTache)) {
      newSelection.delete(refTache);
    } else {
      newSelection.add(refTache);
    }
    setSelectedTasksToVerify(newSelection);
  };

  // Fonction pour sélectionner/désélectionner toutes les tâches
  const handleSelectAll = () => {
    if (selectedTasksToVerify.size === nonVerifiedTasks.length) {
      setSelectedTasksToVerify(new Set());
    } else {
      const allRefs = nonVerifiedTasks.map(task => 
        task.ref_sous_tache || task.ref_tache
      );
      setSelectedTasksToVerify(new Set(allRefs));
    }
  };

  // Fonction pour confirmer la vérification des tâches sélectionnées
  const handleVerifySelectedTasks = async () => {
    if (selectedTasksToVerify.size === 0) return;

    setIsVerifying(true);
    try {
      const listeTaches = Array.from(selectedTasksToVerify);
      await TacheService.set_tache_verified({ listeTaches });
      
      await loadNonVerifiedTasks();
      
      alert(`${listeTaches.length} tâche(s) vérifiée(s) avec succès !`);
    } catch (error) {
      console.error("Erreur lors de la vérification des tâches:", error);
      alert("Erreur lors de la vérification des tâches");
    } finally {
      setIsVerifying(false);
    }
  };

  // Fonction pour trouver la tâche complète à partir de la ref
  const findTaskByRef = (refTache) => {
    // Chercher d'abord dans mes tâches
    let task = taches.find(t => t.ref_tache === refTache || t.ref_sous_tache === refTache);
    
    // Si pas trouvé, chercher dans toutes les tâches
    if (!task && allTaches) {
      task = allTaches.find(t => t.ref_tache === refTache || t.ref_sous_tache === refTache);
    }
    
    return task;
  };

  // Filtrer les tâches selon le filtre actif
  const getFilteredTaches = () => {
    let filteredTaches = [];
    
    if (activeFilter === "Mes tâches") {
      filteredTaches = taches.filter(tache => 
        tache.utilisateurs && tache.utilisateurs.some(user => user.matricule === userInfo.matricule)
      );
    } else if (activeFilter === "Toutes les tâches") {
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const getAssignedUsers = (tache) => {
    return tache.utilisateurs || [];
  };

  const toggleProject = (projectName) => {
    const newCollapsedProjects = new Set(collapsedProjects);
    if (newCollapsedProjects.has(projectName)) {
      newCollapsedProjects.delete(projectName);
    } else {
      newCollapsedProjects.add(projectName);
    }
    setCollapsedProjects(newCollapsedProjects);
  };

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
          <button
            className={`view-button ${activeFilter === "Vérification des tâches" ? "active" : ""}`}
            onClick={() => setActiveFilter("Vérification des tâches")}
          >
            Vérification des tâches
          </button>
          <button
            className={`view-button ${activeFilter === "Résultats de vérification" ? "active" : ""}`}
            onClick={() => setActiveFilter("Résultats de vérification")}
          >
            Résultats de vérification
          </button>
        </div>
      </div>

      {/* Affichage conditionnel selon le filtre actif */}
      {activeFilter === "Résultats de vérification" ? (
        <div className="results-container">
          <div className="results-header">
            <h2 className="results-title">
              <i className="bi bi-clipboard-check-fill"></i>
              Résultats de vérification de vos tâches
            </h2>
            <p className="results-description">
              Consultez les retours de l'administrateur sur vos tâches soumises
            </p>
          </div>

          {isLoadingResults ? (
            <div className="results-loading">
              <i className="bi bi-arrow-clockwise spin"></i>
              <span>Chargement des résultats...</span>
            </div>
          ) : verificationResults.length === 0 ? (
            <div className="no-results">
              <i className="bi bi-inbox"></i>
              <p>Aucun résultat de vérification disponible</p>
            </div>
          ) : (
            <div className="results-list">
              {verificationResults.map((result, index) => {
                const task = findTaskByRef(result.ref_tache);
                const isApproved = result.is_okay;
                
                return (
                  <div
                    key={`${result.ref_tache}-${index}`}
                    className={`result-item ${isApproved ? 'approved' : 'rejected'}`}
                    onClick={() => task && onTacheClick(task)}
                  >
                    <div className="result-status-indicator">
                      <div className={`result-status-icon ${isApproved ? 'approved' : 'rejected'}`}>
                        <i className={`bi ${isApproved ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                      </div>
                    </div>

                    <div className="result-content">
                      <div className="result-header">
                        <div className="result-title-section">
                          <h4 className="result-task-ref">
                            <i className="bi bi-hash"></i>
                            {result.ref_tache}
                          </h4>
                          <span className={`result-status-badge ${isApproved ? 'approved' : 'rejected'}`}>
                            {isApproved ? 'Approuvée' : 'Refusée'}
                          </span>
                        </div>
                        
                        {task && (
                          <div className="result-task-info">
                            <h5 className="result-task-name">
                              {task.nom_tache || task.nom_sous_tache}
                            </h5>
                            <div className="result-task-meta">
                              <span>
                                <i className="bi bi-folder-fill"></i>
                                {task.nom_projet}
                              </span>
                              <span>
                                <i className="bi bi-diagram-3-fill"></i>
                                {task.libelle_phase}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isApproved && result.raison && (
                        <div className="result-reason">
                          <div className="reason-label">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            Raison du refus :
                          </div>
                          <p className="reason-text">{result.raison}</p>
                        </div>
                      )}

                      <div className="result-footer">
                        <div className="result-date">
                          <i className="bi bi-clock-fill"></i>
                          <span>Vérifié le {formatDateTime(result.date_verification)}</span>
                        </div>
                        {task && (
                          <button className="result-view-btn">
                            <i className="bi bi-eye-fill"></i>
                            Voir la tâche
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeFilter === "Vérification des tâches" ? (
        <div className="verification-container">
          <div className="verification-header">
            <h2 className="verification-title">
              <i className="bi bi-clipboard-check"></i>
              Tâches terminées en attente d'auto-vérification
            </h2>
            <p className="verification-description">
              Sélectionnez les tâches que vous souhaitez valider comme vérifiées
            </p>
          </div>

          {isLoadingNonVerified ? (
            <div className="verification-loading">
              <i className="bi bi-arrow-clockwise spin"></i>
              <span>Chargement des tâches...</span>
            </div>
          ) : nonVerifiedTasks.length === 0 ? (
            <div className="no-tasks-verification">
              <i className="bi bi-check-circle-fill"></i>
              <p>Aucune tâche en attente de vérification</p>
            </div>
          ) : (
            <>
              <div className="verification-actions-header">
                <button 
                  className="btn-select-all"
                  onClick={handleSelectAll}
                >
                  <i className={`bi ${selectedTasksToVerify.size === nonVerifiedTasks.length ? 'bi-check-square-fill' : 'bi-square'}`}></i>
                  {selectedTasksToVerify.size === nonVerifiedTasks.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <span className="selected-count">
                  {selectedTasksToVerify.size} / {nonVerifiedTasks.length} sélectionnée(s)
                </span>
              </div>

              <div className="verification-tasks-list">
                {nonVerifiedTasks.map((tache) => {
                  const taskRef = tache.ref_sous_tache || tache.ref_tache;
                  const isSelected = selectedTasksToVerify.has(taskRef);
                  const assignedUsers = getAssignedUsers(tache);
                  const mainUser = assignedUsers.length > 0 ? assignedUsers[0] : null;
                  
                  return (
                    <div
                      key={taskRef}
                      className={`verification-task-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="verification-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleTaskSelection(taskRef)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div 
                        className="verification-task-content"
                        onClick={() => onTacheClick(tache)}
                      >
                        <div className="verification-task-main">
                          <div className="verification-task-header">
                            <h4 className="verification-task-title">
                              {tache.nom_tache || tache.nom_sous_tache}
                            </h4>
                            {tache.ref_sous_tache && (
                              <span className="subtask-badge">
                                <i className="bi bi-diagram-3"></i>
                                Sous-tâche
                              </span>
                            )}
                          </div>
                          
                          <p className="verification-task-description">
                            {tache.description}
                          </p>

                          <div className="verification-task-meta">
                            <div className="verification-meta-item">
                              <i className="bi bi-folder-fill"></i>
                              <span>{tache.nom_projet}</span>
                            </div>
                            <div className="verification-meta-item">
                              <i className="bi bi-diagram-3-fill"></i>
                              <span>{tache.libelle_phase}</span>
                            </div>
                            <div className="verification-meta-item">
                              <i className="bi bi-hash"></i>
                              <span>{taskRef}</span>
                            </div>
                          </div>
                        </div>

                        <div className="verification-task-sidebar">
                          <div className="verification-dates">
                            <div className="verification-date-item">
                              <i className="bi bi-calendar-event"></i>
                              <span>Début: {formatDate(tache.date_debut)}</span>
                            </div>
                            <div className="verification-date-item">
                              <i className="bi bi-calendar-check"></i>
                              <span>Fin: {formatDate(tache.date_fin_prevu)}</span>
                            </div>
                          </div>

                          {mainUser && (
                            <div className="verification-assignee">
                              <div className="user-avatar-small">
                                {mainUser.avatar ? (
                                  <img 
                                    src={mainUser.avatar} 
                                    alt={`${mainUser.prenom} ${mainUser.nom}`}
                                  />
                                ) : (
                                  <div className="avatar-placeholder-small">
                                    {mainUser.prenom?.charAt(0).toUpperCase() || mainUser.nom?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="assignee-name-small">
                                {`${mainUser.prenom || ''} ${mainUser.nom || ''}`.trim()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTasksToVerify.size > 0 && (
                <div className="verification-footer">
                  <button
                    className="btn-confirm-verification"
                    onClick={handleVerifySelectedTasks}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <i className="bi bi-arrow-clockwise spin"></i>
                        Vérification en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i>
                        Valider la vérification ({selectedTasksToVerify.size})
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Affichage normal des tâches groupées
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
                                  <div className={`status-dot ${statusClass}`}></div>
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
      )}
    </div>
  );
};

export default ListeTache;