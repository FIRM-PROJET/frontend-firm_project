import React, { useState, useEffect } from 'react';
import "../styles/HomeScreen.css";
import { jwtDecode } from "jwt-decode";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Import des services
import { TacheService } from '../services/TacheService';
import { DevisService } from '../services/DevisService';

const HomeScreen = () => {
  const [userInfo, setUserInfo] = useState({
    name: "Utilisateur",
    prenom: "",
    matricule: ""
  });

  const [userTasks, setUserTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [avancementProjets, setAvancementProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [hoveredTask, setHoveredTask] = useState(null);
  
  const [stats, setStats] = useState({
    tachesAccomplies: 0,
    tachesNonDemarrees: 0,
    tachesEnCours: 0,
    tachesEnRetard: 0,
    tachesTotales: 0
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const userInfo = {
            name: decoded.nom || decoded.name || "Utilisateur",
            prenom: decoded.prenom || "",
            email: decoded.email || "",
            matricule: decoded.matricule || "",
          };
          setUserInfo(userInfo);
          await loadDashboardData(userInfo.matricule);
        } catch (err) {
          console.error("Erreur de décodage du token :", err);
        }
      }
      setLoading(false);
    };

    initializeDashboard();
  }, []);

  const loadDashboardData = async (matricule) => {
    try {
      if (matricule) {
        // Charger les tâches utilisateur
        const tasks = await TacheService.get_user_task(matricule);
        setUserTasks(tasks);
        
        // Charger les tâches terminées
        const completed = await TacheService.get_task_finished_by_user(matricule);
        setCompletedTasks(completed.taches || []);

        // Tâches d'aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tasksToday = tasks.filter(task => {
          const taskDate = new Date(task.date_debut);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime() && task.statut !== 'Terminé';
        });
        setTodayTasks(tasksToday);

        // Calculer les statistiques améliorées
        const tachesAccomplies = tasks.filter(t => t.statut === 'Terminé').length;
        const tachesNonDemarrees = tasks.filter(t => t.statut === 'Non démarré' || t.statut === 'En attente').length;
        const tachesEnCours = tasks.filter(t => t.statut === 'En cours').length;
        
        // Calculer les tâches en retard
        const currentDate = new Date();
        const tachesEnRetard = tasks.filter(t => {
          if (t.statut === 'Terminé') return false;
          const dateFin = new Date(t.date_fin_prevue);
          return dateFin < currentDate;
        }).length;
        
        setStats({
          tachesAccomplies,
          tachesNonDemarrees,
          tachesEnCours,
          tachesEnRetard,
          tachesTotales: tasks.length
        });
      }

      // Charger l'avancement par projets
      const avancementPhasesData = await TacheService.AvancementParPhases();
      const phases = await DevisService.getAllProjetsPhase();
      const phasesArray = phases.data || phases || [];
      const avancementArray = avancementPhasesData.data || avancementPhasesData || [];
      
      // Grouper par projets
      const projetsMap = new Map();
      avancementArray.forEach(phase => {
        const phaseDetail = phasesArray.find(p => 
          String(p.ref_projet).trim() === String(phase.ref_projet).trim()
        );
        
        const projectName = phaseDetail?.nom_projet || phase.ref_projet;
        
        if (projetsMap.has(projectName)) {
          const existing = projetsMap.get(projectName);
          existing.totalTaches += parseInt(phase.total_taches);
          existing.tachesTerminees += parseInt(phase.taches_terminees);
        } else {
          projetsMap.set(projectName, {
            nom: projectName,
            ref_projet: phase.ref_projet,
            totalTaches: parseInt(phase.total_taches),
            tachesTerminees: parseInt(phase.taches_terminees)
          });
        }
      });

      const projetsAvancement = Array.from(projetsMap.values()).map(project => ({
        ...project,
        avancement: project.totalTaches > 0 ? (project.tachesTerminees / project.totalTaches) * 100 : 0
      }));
      
      setAvancementProjets(projetsAvancement);

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  // Générer les données pour le graphique hebdomadaire
  const generateWeeklyData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
    const today = new Date();
    
    // Trouver le lundi de cette semaine
    const mondayOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    mondayOfWeek.setDate(today.getDate() - daysFromMonday);
    
    return days.map((day, index) => {
      const targetDate = new Date(mondayOfWeek);
      targetDate.setDate(mondayOfWeek.getDate() + index);
      
      const tasksCompletedOnDay = completedTasks.filter(task => {
        const taskCompletedDate = new Date(task.date_statut);
        taskCompletedDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        return taskCompletedDate.getTime() === targetDate.getTime();
      }).length;

      return {
        name: day,
        taches: tasksCompletedOnDay
      };
    });
  };

  // Générer le calendrier du mois
  const generateMonthlyCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDisplayDay = new Date(firstDayOfMonth);
    
    // Ajuster au lundi de la première semaine
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstDisplayDay.setDate(firstDayOfMonth.getDate() - daysToSubtract);
    
    const days = [];
    const currentDay = new Date(firstDisplayDay);
    
    // Générer 6 semaines (42 jours)
    for (let i = 0; i < 42; i++) {
      const dayTasks = getTasksForDate(currentDay);
      days.push({
        date: new Date(currentDay),
        day: currentDay.getDate(),
        isToday: currentDay.toDateString() === today.toDateString(),
        isCurrentMonth: currentDay.getMonth() === currentMonth,
        tasks: dayTasks,
        hasTask: dayTasks.length > 0
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const getTasksForDate = (date) => {
    return userTasks.filter(task => {
      const taskDate = new Date(task.date_debut);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatTodayDate = () => {
    const date = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return date.charAt(0).toUpperCase() + date.slice(1);
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      const updateData = {
        ref_tache: taskId,
        ref_sous_tache: null,
      };
      await TacheService.UpdateTacheTermine(updateData);
      await loadDashboardData(userInfo.matricule);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
    }
  };

  // Données pour le graphique donut
  const donutData = [
    { name: 'Accomplies', value: stats.tachesAccomplies, color: '#27ae60' },
    { name: 'En cours', value: stats.tachesEnCours, color: '#f39c12' },
    { name: 'Non démarrées', value: stats.tachesNonDemarrees, color: '#95a5a6' },
    { name: 'En retard', value: stats.tachesEnRetard, color: '#e74c3c' }
  ];

  // Calculer les angles pour le donut
  const total = stats.tachesTotales;
  let currentAngle = 0;
  const donutSegments = donutData.map(segment => {
    const angle = total > 0 ? (segment.value / total) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...segment, startAngle, angle };
  });

  const weeklyData = generateWeeklyData();
  const monthlyCalendar = generateMonthlyCalendar();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Bonjour, {userInfo.name} {userInfo.prenom}</h1>
        <div className="today-date">{formatTodayDate()}</div>
      </div>

      {/* Grille principale améliorée */}
      <div className="dashboard-grid">
        
        {/* Première ligne : Tâches aujourd'hui + Graphique activité */}
        <div className="grid-row row-1">
          {/* Section des tâches aujourd'hui */}
          <div className="card today-tasks-card">
            <div className="card-header">
              <div className="header-with-icon">
                <i className="bi bi-list-task"></i>
                <h3>Tâches aujourd'hui</h3>
              </div>
              <span className="task-count">{todayTasks.length}</span>
            </div>
            <div className="tasks-list">
              {todayTasks.slice(0, 8).map((task, index) => (
                <div key={index} className="task-item">
                  <div 
                    className="task-checkbox"
                    onClick={() => toggleTaskCompletion(task.id)}
                  >
                    <i className="bi bi-circle"></i>
                  </div>
                  <div className="task-info">
                    <span className="task-name">{task.nom_tache}</span>
                    <span className="task-project">{task.nom_projet}</span>
                  </div>
                </div>
              ))}
              {todayTasks.length === 0 && (
                <div className="no-tasks">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Toutes les tâches terminées !</span>
                </div>
              )}
            </div>
          </div>

          {/* Graphique activité hebdomadaire */}
          <div className="card weekly-activity-card">
            <div className="card-header">
              <div className="header-with-icon">
                <i className="bi bi-graph-up"></i>
                <h3>Activité de la semaine</h3>
              </div>
              <span className="total-completed">
                <i className="bi bi-trophy-fill"></i>
                {weeklyData.reduce((sum, day) => sum + day.taches, 0)} accomplies
              </span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#282850" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#514f84" 
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#514f84" 
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#181835',
                      border: '1px solid #f7e395',
                      borderRadius: '8px',
                      color: '#f7e395',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px rgba(247, 227, 149, 0.3)'
                    }}
                    labelStyle={{ color: '#f7e395' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="taches" 
                    stroke="#f7e395" 
                    strokeWidth={3}
                    dot={{ fill: '#f7e395', strokeWidth: 0, r: 5 }}
                    activeDot={{ r: 7, fill: '#f39c12', stroke: '#f7e395', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Deuxième ligne : Diagramme donut + Calendrier mensuel */}
        <div className="grid-row row-2">
          {/* Diagramme donut avec statistiques */}
          <div className="card donut-stats-card">
            <div className="card-header">
              <div className="header-with-icon">
                <i className="bi bi-pie-chart-fill"></i>
                <h3>Répartition des tâches</h3>
              </div>
            </div>
            <div className="donut-section">
              <div className="donut-chart-container">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <defs>
                    {donutSegments.map((segment, index) => (
                      <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={segment.color} />
                        <stop offset="100%" stopColor={segment.color} opacity="0.8" />
                      </linearGradient>
                    ))}
                  </defs>
                  <circle cx="70" cy="70" r="50" fill="none" stroke="#282850" strokeWidth="12" />
                  {donutSegments.map((segment, index) => {
                    if (segment.value === 0) return null;
                    const startAngleRad = (segment.startAngle - 90) * (Math.PI / 180);
                    const endAngleRad = (segment.startAngle + segment.angle - 90) * (Math.PI / 180);
                    const largeArcFlag = segment.angle > 180 ? 1 : 0;
                    
                    const x1 = 70 + 50 * Math.cos(startAngleRad);
                    const y1 = 70 + 50 * Math.sin(startAngleRad);
                    const x2 = 70 + 50 * Math.cos(endAngleRad);
                    const y2 = 70 + 50 * Math.sin(endAngleRad);
                    
                    return (
                      <path
                        key={index}
                        d={`M 70 70 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={`url(#gradient-${index})`}
                        opacity="0.9"
                      />
                    );
                  })}
                  <circle cx="70" cy="70" r="30" fill="#181835" />
                  <text x="70" y="65" textAnchor="middle" fill="#f7e395" fontSize="20" fontWeight="bold">
                    {total}
                  </text>
                  <text x="70" y="80" textAnchor="middle" fill="#ccc" fontSize="10">
                    Total
                  </text>
                </svg>
              </div>
              <div className="donut-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#27ae60' }}></div>
                  <span className="legend-label">Accomplies</span>
                  <span className="legend-value">{stats.tachesAccomplies}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#f39c12' }}></div>
                  <span className="legend-label">En cours</span>
                  <span className="legend-value">{stats.tachesEnCours}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#95a5a6' }}></div>
                  <span className="legend-label">Non démarrées</span>
                  <span className="legend-value">{stats.tachesNonDemarrees}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
                  <span className="legend-label">En retard</span>
                  <span className="legend-value">{stats.tachesEnRetard}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendrier mensuel */}
          <div className="card monthly-calendar-card">
            <div className="card-header">
              <div className="header-with-icon">
                <i className="bi bi-calendar-month"></i>
                <h3>Calendrier du mois</h3>
              </div>
            </div>
            <div className="calendar-wrapper">
              <div className="calendar-header">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                  <div key={index} className="calendar-header-day">{day}</div>
                ))}
              </div>
              <div className="calendar-body">
                {monthlyCalendar.map((dayObj, index) => (
                  <div 
                    key={index} 
                    className={`calendar-day ${
                      dayObj.isToday ? 'today' : ''
                    } ${dayObj.hasTask ? 'has-task' : ''} ${
                      !dayObj.isCurrentMonth ? 'other-month' : ''
                    }`}
                    onMouseEnter={() => setHoveredTask(dayObj)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    <span className="day-number">{dayObj.day}</span>
                    {dayObj.hasTask && <div className="task-indicator"></div>}
                    
                    {/* Tooltip pour les tâches */}
                    {hoveredTask === dayObj && dayObj.tasks.length > 0 && (
                      <div className="task-tooltip">
                        <div className="tooltip-arrow"></div>
                        <div className="tooltip-content">
                          {dayObj.tasks.slice(0, 3).map((task, taskIndex) => (
                            <div key={taskIndex} className="tooltip-task">
                              <span className="tooltip-task-name">{task.nom_tache}</span>
                            </div>
                          ))}
                          {dayObj.tasks.length > 3 && (
                            <div className="tooltip-more">+{dayObj.tasks.length - 3} autres</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Troisième ligne : Avancement des projets (pleine largeur) */}
        <div className="grid-row row-3">
          <div className="card projects-progress-card">
            <div className="card-header">
              <div className="header-with-icon">
                <i className="bi bi-folder-fill"></i>
                <h3>Avancement des projets</h3>
              </div>
              <button 
                className="voir-plus-btn"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                {showAllProjects ? 'Voir moins' : 'Voir plus'}
                <i className={`bi ${showAllProjects ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>
            </div>
            <div className="projects-grid">
              {(showAllProjects ? avancementProjets : avancementProjets.slice(0, 6)).map((projet, index) => (
                <div key={index} className="project-card">
                  <div className="project-header">
                    <div className="project-info">
                      <h4 className="project-name">{projet.nom}</h4>
                      <span className="project-progress-text">
                        {projet.tachesTerminees}/{projet.totalTaches} tâches
                      </span>
                    </div>
                    <div className="project-percentage">
                      <span className="percentage-value">{Math.round(projet.avancement)}%</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min(projet.avancement, 100)}%` }}
                    ></div>
                  </div>

                </div>
              ))}
              {avancementProjets.length === 0 && (
                <div className="no-projects">
                  <i className="bi bi-folder-x"></i>
                  <span>Aucun projet en cours</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeScreen;