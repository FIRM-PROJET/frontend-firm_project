import React, { useState, useEffect } from 'react';
import '../../styles/AdminCSS/AdminTaskVerification.css';
import { UtilisateurService } from "../../services/UtilisateurService";
import { TacheService } from "../../services/TacheService";
import TacheModal from '../../modals/TacheModal';

const AdminTaskVerification = () => {
  const [activeTab, setActiveTab] = useState('verification');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taskStates, setTaskStates] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [userTaskCounts, setUserTaskCounts] = useState({});
  
  const [statPeriod, setStatPeriod] = useState('week');
  const [statsData, setStatsData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    loadUtilisateurs();
  }, []);

  useEffect(() => {
    if (activeTab === 'statistics') {
      loadStatistics();
    }
  }, [activeTab, statPeriod]);

  const loadUtilisateurs = async () => {
    try {
      setLoading(true);
      const data = await UtilisateurService.getAllUtilisateurs();
      setUtilisateurs(data);
      await loadAllUserTaskCounts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      showMessage('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUserTaskCounts = async (users) => {
    const counts = {};
    await Promise.all(
      users.map(async (user) => {
        try {
          const data = await TacheService.get_auto_verified_task_user(user.matricule);
          counts[user.matricule] = data.length;
        } catch (error) {
          console.error(`Erreur pour ${user.matricule}:`, error);
          counts[user.matricule] = 0;
        }
      })
    );
    setUserTaskCounts(counts);
  };

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      let data;
      if (statPeriod === 'week') {
        data = await TacheService.get_stat_per_week();
      } else {
        data = await TacheService.get_stat_per_month();
      }
      
      const groupedData = data.reduce((acc, stat) => {
        const existing = acc.find(item => item.matricule === stat.matricule);
        if (existing) {
          existing.periods.push(stat);
        } else {
          acc.push({
            matricule: stat.matricule,
            periods: [stat]
          });
        }
        return acc;
      }, []);
      
      setStatsData(groupedData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      showMessage('Erreur lors du chargement des statistiques', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTachesUtilisateur = async (matricule) => {
    try {
      setLoading(true);
      const data = await TacheService.get_auto_verified_task_user(matricule);
      setTaches(data);
      
      const initialStates = {};
      data.forEach(tache => {
        initialStates[tache.ref_tache] = {
          checked: false,
          is_okay: true,
          raison: ''
        };
      });
      setTaskStates(initialStates);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      showMessage('Erreur lors du chargement des tâches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setTaches([]);
    setTaskStates({});
    setMessage(null);
    loadTachesUtilisateur(user.matricule);
  };

  const handleStatusChange = (ref_tache, is_okay) => {
    setTaskStates(prev => ({
      ...prev,
      [ref_tache]: {
        checked: true,
        is_okay,
        raison: is_okay ? '' : prev[ref_tache]?.raison || ''
      }
    }));
  };

  const handleRaisonChange = (ref_tache, raison) => {
    setTaskStates(prev => ({
      ...prev,
      [ref_tache]: {
        ...prev[ref_tache],
        raison
      }
    }));
  };

  const handleTaskClick = (tache) => {
    const tacheWithStatus = {
      ...tache,
      statut: "Terminé"
    };
    setSelectedTask(tacheWithStatus);
    setIsTaskModalOpen(true);
  };

  const handleSubmit = async () => {
    const checkedTasks = Object.entries(taskStates)
      .filter(([_, state]) => state.checked)
      .map(([ref_tache, state]) => ({
        ref_tache,
        is_okay: state.is_okay,
        raison: state.is_okay ? undefined : state.raison
      }));

    if (checkedTasks.length === 0) {
      showMessage('Veuillez sélectionner au moins une tâche', 'error');
      return;
    }

    const rejectedWithoutReason = checkedTasks.find(
      task => !task.is_okay && !task.raison.trim()
    );

    if (rejectedWithoutReason) {
      showMessage('Veuillez fournir une raison pour toutes les tâches rejetées', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        matricule: selectedUser.matricule,
        listeTaches: checkedTasks
      };

      await TacheService.post_admin_tache_verified(payload);
      showMessage(`${checkedTasks.length} tâche(s) vérifiée(s) avec succès`, 'success');
      
      await loadTachesUtilisateur(selectedUser.matricule);
      await loadAllUserTaskCounts(utilisateurs);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      showMessage('Erreur lors de la vérification des tâches', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (statPeriod === 'week') {
      return `Semaine du ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  };

  const getUserName = (matricule) => {
    const user = utilisateurs.find(u => u.matricule === matricule);
    return user ? `${user.nom} ${user.prenom}` : matricule;
  };

  return (
    <div className="task-verification-container">
      {/* Header */}
      <div className="module-header">
        <div className="header-content">
          <div className="text-content">
            <h1 className="module-title">Gestion des Tâches</h1>
            <h5 className="module-subtitle">
              Vérifier les tâches auto-validées et consulter les statistiques de performance
            </h5>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <button
          className={`nav-item ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('verification')}
        >
          <i className="bi bi-clipboard-check"></i>
          <span>Vérification</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <i className="bi bi-bar-chart-fill"></i>
          <span>Statistiques</span>
        </button>
      </div>

      {message && (
        <div className={`notification-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'verification' ? (
        <div className="verification-content-wrapper">
          <aside className="verification-users-sidebar">
            <h2>Utilisateurs</h2>
            {loading && !selectedUser ? (
              <div className="verification-loading">Chargement...</div>
            ) : (
              <div className="verification-users-list">
                {utilisateurs.map(user => (
                  <div
                    key={user.matricule}
                    className={`verification-user-card ${selectedUser?.matricule === user.matricule ? 'active' : ''}`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="verification-user-info">
                      <div className="verification-user-name">{user.nom} {user.prenom}</div>
                      <div className="verification-user-matricule">{user.matricule}</div>
                    </div>
                    {userTaskCounts[user.matricule] > 0 && (
                      <div className="verification-user-task-badge">
                        {userTaskCounts[user.matricule]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>

          <main className="verification-tasks-main">
            {!selectedUser ? (
              <div className="verification-empty-state">
                <i className="bi bi-person-check"></i>
                <p>Sélectionnez un utilisateur pour voir ses tâches</p>
              </div>
            ) : loading ? (
              <div className="verification-loading">
                <i className="bi bi-arrow-clockwise spin"></i>
                <span>Chargement des tâches...</span>
              </div>
            ) : taches.length === 0 ? (
              <div className="verification-empty-state">
                <i className="bi bi-check-circle"></i>
                <p>Aucune tâche à vérifier pour cet utilisateur</p>
              </div>
            ) : (
              <>
                <div className="verification-tasks-header">
                  <h2>{selectedUser.nom} {selectedUser.prenom}</h2>
                  <span className="verification-task-count">
                    <i className="bi bi-list-check"></i>
                    {taches.length} tâche{taches.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="verification-tasks-list">
                  {taches.map(tache => (
                    <div key={tache.ref_tache} className="verification-task-card">
                      <div className="verification-task-content">
                        <div 
                          className="verification-task-header-info"
                          onClick={() => handleTaskClick(tache)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="verification-task-title-row">
                            <h3>{tache.nom_tache}</h3>
                          </div>
                        </div>

                        <div className="verification-task-verification">
                          <div className="verification-status-buttons">
                            <button
                              className={`verification-status-btn validate ${taskStates[tache.ref_tache]?.is_okay ? 'active' : ''}`}
                              onClick={() => handleStatusChange(tache.ref_tache, true)}
                            >
                              <i className="bi bi-check-circle-fill"></i>
                              Valider
                            </button>
                            <button
                              className={`verification-status-btn reject ${taskStates[tache.ref_tache]?.checked && !taskStates[tache.ref_tache]?.is_okay ? 'active' : ''}`}
                              onClick={() => handleStatusChange(tache.ref_tache, false)}
                            >
                              <i className="bi bi-x-circle-fill"></i>
                              Rejeter
                            </button>
                          </div>

                          {taskStates[tache.ref_tache]?.checked && !taskStates[tache.ref_tache]?.is_okay && (
                            <div className="verification-reason-input">
                              <label htmlFor={`reason-${tache.ref_tache}`}>
                                Raison du rejet *
                              </label>
                              <textarea
                                id={`reason-${tache.ref_tache}`}
                                value={taskStates[tache.ref_tache].raison}
                                onChange={(e) => handleRaisonChange(tache.ref_tache, e.target.value)}
                                placeholder="Expliquez pourquoi cette tâche est rejetée..."
                                rows="2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="verification-submit-section">
                  <button
                    className="verification-submit-btn"
                    onClick={handleSubmit}
                    disabled={submitting || Object.values(taskStates).every(state => !state.checked)}
                  >
                    {submitting ? (
                      <>
                        <i className="bi bi-arrow-clockwise spin"></i>
                        Vérification en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        Valider la vérification
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      ) : (
        <div className="statistics-content">
          <div className="statistics-header">
            <h2>Statistiques de Vérification</h2>
            <div className="period-selector">
              <button 
                className={`period-btn ${statPeriod === 'week' ? 'active' : ''}`}
                onClick={() => setStatPeriod('week')}
              >
                <i className="bi bi-calendar-week"></i>
                Par Semaine
              </button>
              <button 
                className={`period-btn ${statPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setStatPeriod('month')}
              >
                <i className="bi bi-calendar-month"></i>
                Par Mois
              </button>
            </div>
          </div>

          {loadingStats ? (
            <div className="verification-loading">
              <i className="bi bi-arrow-clockwise spin"></i>
              <span>Chargement des statistiques...</span>
            </div>
          ) : statsData.length === 0 ? (
            <div className="verification-empty-state">
              <i className="bi bi-graph-up"></i>
              <p>Aucune statistique disponible</p>
            </div>
          ) : (
            <div className="statistics-grid">
              {statsData.map((userStat) => (
                <div key={userStat.matricule} className="stat-user-card">
                  <div className="stat-user-header">
                    <div className="stat-user-info">
                      <i className="bi bi-person-circle"></i>
                      <div>
                        <h3>{getUserName(userStat.matricule)}</h3>
                        <span className="stat-matricule">{userStat.matricule}</span>
                      </div>
                    </div>
                  </div>

                  <div className="stat-periods">
                    {userStat.periods.map((period, index) => {
                      const totalOk = parseInt(period.total_ok) || 0;
                      const totalNonOk = parseInt(period.total_non_ok) || 0;
                      const total = totalOk + totalNonOk;
                      const okPercentage = total > 0 ? (totalOk / total) * 100 : 0;
                      
                      return (
                        <div key={index} className="stat-period-item">
                          <div className="stat-period-header">
                            <span className="stat-period-date">
                              <i className="bi bi-calendar3"></i>
                              {formatDate(period.semaine || period.mois)}
                            </span>
                            <span className="stat-period-total">
                              {total} tâche{total > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="stat-progress-bar">
                            <div 
                              className="stat-progress-ok" 
                              style={{ width: `${okPercentage}%` }}
                            ></div>
                          </div>

                          <div className="stat-details">
                            <div className="stat-detail-item ok">
                              <i className="bi bi-check-circle-fill"></i>
                              <span>{totalOk} validée{totalOk > 1 ? 's' : ''}</span>
                            </div>
                            <div className="stat-detail-item not-ok">
                              <i className="bi bi-x-circle-fill"></i>
                              <span>{totalNonOk} rejetée{totalNonOk > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isTaskModalOpen && selectedTask && (
        <TacheModal
          tache={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onStatusUpdate={() => {}}
        />
      )}
    </div>
  );
};

export default AdminTaskVerification;