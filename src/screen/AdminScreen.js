import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtilisateurService } from "../services/UtilisateurService";
import { ModuleService } from "../services/ModuleService";
import "../styles/AdminScreen.css";
import { TacheService } from "../services/TacheService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminScreen = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    totalTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentWeekTasks, setCurrentWeekTasks] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Fonction pour appeler get_task_finished
  const fetchFinishedTasks = async () => {
    try {
      const response = await TacheService.get_task_finished();
      return response.data;
    } catch (error) {
      console.error('Erreur API:', error);
      return [];
    }
  };

  // Fonction pour obtenir le début et fin de la semaine actuelle
  const getCurrentWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  // Fonction pour filtrer les tâches de la semaine actuelle par utilisateur
  const processCurrentWeekTasks = (rawData, usersData) => {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    
    // Créer un map de tous les utilisateurs avec 0 tâches par défaut
    const usersTasksMap = {};
    usersData.forEach(user => {
      usersTasksMap[user.matricule] = {
        matricule: user.matricule,
        prenom: user.prenom,
        nom: user.nom,
        tasksCount: 0,
        fullName: `${user.prenom} ${user.nom}`
      };
    });
    
    // Compter les tâches de la semaine actuelle
    rawData.forEach(task => {
      const taskDate = new Date(task.date_statut);
      if (taskDate >= weekStart && taskDate <= weekEnd && usersTasksMap[task.matricule]) {
        usersTasksMap[task.matricule].tasksCount++;
      }
    });
    
    return Object.values(usersTasksMap).sort((a, b) => b.tasksCount - a.tasksCount);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, modulesData, tasksRawData] = await Promise.all([
          UtilisateurService.getAllUtilisateurs(),
          ModuleService.getAllModules(),
          fetchFinishedTasks()
        ]);
        
        const totalTasks = tasksRawData.length;
        const currentWeekTasksData = processCurrentWeekTasks(tasksRawData, usersData);
        
        setStats({
          totalUsers: usersData.length,
          totalModules: modulesData.length,
          totalTasks: totalTasks
        });
        
        setCurrentWeekTasks(currentWeekTasksData);
        
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Fonction pour formater la date de la semaine actuelle
  const getCurrentWeekLabel = () => {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const options = { day: '2-digit', month: '2-digit' };
    const startStr = weekStart.toLocaleDateString('fr-FR', options);
    const endStr = weekEnd.toLocaleDateString('fr-FR', options);
    return `${startStr} - ${endStr}`;
  };

  // Obtenir le top 3
  const getTop3Users = () => {
    return currentWeekTasks.filter(user => user.tasksCount > 0).slice(0, 3);
  };

  if (loading) return <div className="admin-loading">Chargement...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="module-header">
        <div className="header-content">
          <div className="text-content">
            <h1 className="module-title">Panneau d'Administration</h1>
            <h5 className="module-subtitle">
              Gestion des utilisateurs et suivi des performances
            </h5>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="dashboard-content">
        {/* Première ligne : Actions rapides + Récapitulatif */}
        <div className="top-section">
          <div className="quick-actions">
            <h3 className="section-title">
              <i className="bi bi-lightning-fill"></i>
              Actions Rapides
            </h3>
            <div className="actions-grid">
              <div
                className="action-card primary"
                onClick={() => navigate("/admin/access")}
              >
                <div className="action-icon">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <div className="action-text">
                  <h4>Gestion des Accès</h4>
                  <p>Contrôler les permissions</p>
                </div>
              </div>

              <div
                className="action-card secondary"
                onClick={() => navigate("/admin/modify")}
              >
                <div className="action-icon">
                  <i className="bi bi-person-fill-gear"></i>
                </div>
                <div className="action-text">
                  <h4>Modifier Utilisateurs</h4>
                  <p>Éditer les profils</p>
                </div>
              </div>

              <div
                className="action-card tertiary"
                onClick={() => navigate("/admin/add")}
              >
                <div className="action-icon">
                  <i className="bi bi-person-plus-fill"></i>
                </div>
                <div className="action-text">
                  <h4>Ajouter Utilisateur</h4>
                  <p>Créer un nouveau compte</p>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-summary">
            <h3 className="section-title">
              <i className="bi bi-graph-up"></i>
              Récapitulatif
            </h3>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-label">Utilisateurs</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalModules}</div>
                  <div className="stat-label">Modules</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalTasks}</div>
                  <div className="stat-label">Tâches Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deuxième ligne : Graphique + Top performers */}
        <div className="bottom-section">
          <div className="chart-container">
            <h3 className="section-title">
              <i className="bi bi-bar-chart-fill"></i>
              Performance Hebdomadaire - {getCurrentWeekLabel()}
            </h3>
            
            {currentWeekTasks.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={currentWeekTasks}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 100,
                    }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#958be8" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#4634ac" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="rgba(255,255,255,0.1)" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="fullName"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 500 }}
                      interval={0}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <YAxis 
                      tick={{ fill: '#ffffff', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#2a2a4a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value) => [value, 'Tâches accomplies']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar 
                      dataKey="tasksCount" 
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      strokeWidth={2}
                      stroke="rgba(255,255,255,0.1)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="no-data">
                <i className="bi bi-info-circle"></i>
                <span>Aucune donnée disponible pour cette semaine</span>
              </div>
            )}
          </div>

          <div className="top-performers">
            <div className="performers-header">
              <h3 className="section-title">
                <i className="bi bi-trophy-fill"></i>
                Top Performers
              </h3>
              <button 
                className="toggle-btn"
                onClick={() => setShowAllUsers(!showAllUsers)}
              >
                <i className={`bi bi-${showAllUsers ? 'list' : 'eye'}-fill`}></i>
                {showAllUsers ? 'Top 3' : 'Voir Tout'}
              </button>
            </div>
            
            <div className="performers-list">
              {(showAllUsers ? currentWeekTasks : getTop3Users()).map((user, index) => (
                <div key={user.matricule} className={`performer-card ${user.tasksCount === 0 ? 'inactive' : ''}`}>
                  <div className="performer-rank">
                    {!showAllUsers && index < 3 && user.tasksCount > 0 && (
                      <div className={`rank-badge rank-${index + 1}`}>
                        <i className={`bi bi-${index === 0 ? 'trophy' : index === 1 ? 'award' : 'star'}-fill`}></i>
                      </div>
                    )}
                  </div>
                  <div className="performer-avatar">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="performer-info">
                    <h4 className="performer-name">{user.prenom} {user.nom}</h4>
                    <span className="performer-id">#{user.matricule}</span>
                  </div>
                  <div className="performer-score">
                    <div className="score-number">{user.tasksCount}</div>
                    <div className="score-label">tâche{user.tasksCount > 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
              
              {(showAllUsers ? currentWeekTasks : getTop3Users()).length === 0 && (
                <div className="no-performers">
                  <i className="bi bi-info-circle"></i>
                  <span>Aucun utilisateur actif cette semaine</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;