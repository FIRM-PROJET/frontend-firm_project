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
  const [allTasks, setAllTasks] = useState([]);
  const [phases, setPhases] = useState([]);
  const [projets, setProjets] = useState([]);
  const [avancementPhases, setAvancementPhases] = useState([]);
  const [avancementProjets, setAvancementProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState([]);
  const [completedTodayTasks, setCompletedTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  
  const [stats, setStats] = useState({
    tachesAccomplies: 0,
    tachesEnCours: 0,
    tachesTotales: 0,
    projetsActifs: 0,
    phasesEnCours: 0,
    tachesEnRetard: 0,
    efficacite: 0,
    tempsTotal: 0
  });

  const quickActions = [
    { label: "Nouvelle tâche", className: "primary", icon: "bi-plus-circle-fill", tooltip: "Nouvelle tâche" },
    { label: "Nouveau projet", className: "secondary", icon: "bi-folder-fill", tooltip: "Nouveau projet" },
    { label: "Planning", className: "tertiary", icon: "bi-calendar-fill", tooltip: "Planning" },
    { label: "Paramètres", className: "quaternary", icon: "bi-gear-fill", tooltip: "Paramètres" },
  ];

  const getProgressLevel = (percentage) => {
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  };

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
      // Charger les tâches utilisateur
      if (matricule) {
        const tasks = await TacheService.get_user_task(matricule);
        setUserTasks(tasks);
        
        // Analyse des tâches par date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Tâches d'aujourd'hui
        const tasksToday = tasks.filter(task => {
          const taskDate = new Date(task.date_debut);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime() && task.statut !== 'Terminé';
        });
        setTodayTasks(tasksToday.map(task => ({ ...task, completed: false })));

        // Tâches terminées aujourd'hui
        const completedToday = tasks.filter(task => {
          const taskCompletedDate = task.date_fin_reelle ? new Date(task.date_fin_reelle) : null;
          if (!taskCompletedDate) return false;
          
          const taskDate = new Date(taskCompletedDate);
          taskDate.setHours(0, 0, 0, 0);
          
          return taskDate.getTime() === today.getTime() && task.statut === 'Terminé';
        });
        setCompletedTodayTasks(completedToday.map(task => ({ ...task, completed: true })));

        // Tâches à venir
        const upcomingTasksFiltered = tasks.filter(task => {
          const taskDate = new Date(task.date_debut);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate > today && taskDate <= nextWeek && task.statut !== 'Terminé';
        });
        setUpcomingTasks(upcomingTasksFiltered);

        // Tâches en retard
        const overdueTasksFiltered = tasks.filter(task => {
          const taskEndDate = new Date(task.date_fin_prevu);
          taskEndDate.setHours(0, 0, 0, 0);
          return taskEndDate < today && task.statut !== 'Terminé';
        });
        setOverdueTasks(overdueTasksFiltered);

        // Calculer les statistiques
        const tachesAccomplies = tasks.filter(t => t.statut === 'Terminé').length;
        const tachesEnCours = tasks.filter(t => t.statut === 'En cours').length;
        const projetsActifs = [...new Set(tasks.map(t => t.ref_projet))].length;
        const efficacite = tasks.length > 0 ? (tachesAccomplies / tasks.length) * 100 : 0;
        
        setStats(prev => ({
          ...prev,
          tachesAccomplies,
          tachesEnCours,
          tachesTotales: tasks.length,
          projetsActifs,
          tachesEnRetard: overdueTasksFiltered.length,
          efficacite
        }));
      }

      // Charger toutes les tâches
      const allTasksData = await TacheService.getAllTaches();
      setAllTasks(allTasksData);

      // Charger les phases
      const phasesData = await DevisService.getAllProjetsPhase();
      const phases = phasesData.data || phasesData || [];
      setPhases(phases);

      // Charger l'avancement par phases
      const avancementPhasesData = await TacheService.AvancementParPhases();
      const avancementArray = avancementPhasesData.data || avancementPhasesData || [];
      setAvancementPhases(avancementArray);

      // Charger l'avancement par projets
      // const avancementProjetsData = await TacheService.getAvancementParProjet();
      // setAvancementProjets(avancementProjetsData);

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  // Générer le calendrier de la semaine (7 jours)
  const generateWeekCalendar = () => {
    const today = new Date();
    const days = [];
    
    // Trouver le lundi de cette semaine
    const mondayOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Dimanche = 6 jours depuis lundi
    mondayOfWeek.setDate(today.getDate() - daysFromMonday);
    
    // Générer les 7 jours de la semaine
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(mondayOfWeek);
      currentDay.setDate(mondayOfWeek.getDate() + i);
      
      days.push({
        date: currentDay,
        day: currentDay.getDate(),
        isToday: currentDay.toDateString() === today.toDateString(),
        hasTask: hasTasksOnWeekDate(currentDay),
        dayName: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]
      });
    }
    
    return days;
  };

  const hasTasksOnWeekDate = (date) => {
    return userTasks.some(task => {
      const taskDate = new Date(task.date_debut);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Données pour l'activité de la semaine avec points connectés
  const generateUserWeeklyData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date();
    
    return days.map((day, index) => {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - (6 - index));
      
      const completedTasks = userTasks.filter(task => {
        const taskCompletedDate = task.date_fin_reelle ? new Date(task.date_fin_reelle) : null;
        if (!taskCompletedDate) return false;
        
        const taskDate = new Date(taskCompletedDate);
        taskDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        return taskDate.getTime() === targetDate.getTime() && task.statut === 'Terminé';
      }).length;

      return {
        name: day,
        taches: completedTasks
      };
    });
  };

  // Grouper les projets par nom de projet
  const getProjectsProgress = () => {
    const projectsMap = new Map();
    
    avancementPhases.forEach(phase => {
      const phaseDetail = phases.find(p => 
        String(p.ref_projet).trim() === String(phase.ref_projet).trim()
      );
      
      const projectName = phaseDetail?.nom_projet || phase.ref_projet;
      
      if (projectsMap.has(projectName)) {
        const existing = projectsMap.get(projectName);
        existing.totalTaches += parseInt(phase.total_taches);
        existing.tachesTerminees += parseInt(phase.taches_terminees);
        existing.phases += 1;
      } else {
        projectsMap.set(projectName, {
          nom: projectName,
          ref_projet: phase.ref_projet,
          totalTaches: parseInt(phase.total_taches),
          tachesTerminees: parseInt(phase.taches_terminees),
          phases: 1
        });
      }
    });

    return Array.from(projectsMap.values()).map(project => ({
      ...project,
      avancement: project.totalTaches > 0 ? (project.tachesTerminees / project.totalTaches) * 100 : 0
    }));
  };

  // Calculer l'avancement global
  const getGlobalProgress = () => {
    if (!avancementPhases || avancementPhases.length === 0) return 0;
    
    const totalProgress = avancementPhases.reduce((sum, phase) => {
      return sum + parseFloat(phase.avancement_pourcent);
    }, 0);
    
    return avancementPhases.length > 0 ? totalProgress / avancementPhases.length : 0;
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      const task = todayTasks.find(t => t.id === taskId);
      if (!task) return;

      // Mettre à jour localement d'abord pour une meilleure UX
      setTodayTasks(prev => 
        prev.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );

      if (!task.completed) {
        // Marquer comme terminée
        const updateData = {
          ref_tache: taskId,
          ref_sous_tache: null,
        };
        await TacheService.UpdateTacheTermine(updateData);
        await loadDashboardData(userInfo.matricule);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      // Remettre l'état précédent en cas d'erreur
      setTodayTasks(prev => 
        prev.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    }
  };

  const weekDays = generateWeekCalendar();
  const weeklyData = generateUserWeeklyData();
  const projectsProgress = getProjectsProgress();
  const globalProgress = getGlobalProgress();
  
  const formatTodayDate = () => {
    const date = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return date.charAt(0).toUpperCase() + date.slice(1);
  };

  const allTodayTasks = [...todayTasks, ...completedTodayTasks];
  const completedTasksCount = allTodayTasks.filter(task => task.completed || task.statut === 'Terminé').length;

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
      {/* Header avec dégradé */}
      <div className="dashboard-header">
        <h1>Bonjour, {userInfo.name} {userInfo.prenom}</h1>
        <div className="today-date">{formatTodayDate()}</div>
      </div>

      {/* Actions rapides - sans défilement, icônes inclinés
      <div className="quick-actions-container">
        <div className="quick-actions-slider">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className={`action-btn2 ${action.className}`}
            >
              <i className={`bi ${action.icon}`}></i>
              {action.label}
            </button>
          ))}
        </div>
      </div> */}

      {/* Layout 3 colonnes horizontales */}
      <div className="main-content-grid">
        {/* Colonne 1: Tâches aujourd'hui */}
        <div className="today-tasks-section">
          <div className="tasks-header">
            <h3>Tâches aujourd'hui</h3>
            <div className="task-progress-indicator">
              {completedTasksCount}/{allTodayTasks.length}
            </div>
          </div>
          <div className="tasks-list">
            {allTodayTasks.slice(0, 4).map((task, index) => (
              <div key={index} className={`task-item ${task.completed || task.statut === 'Terminé' ? 'completed' : ''}`}>
                <div 
                  className={`task-checkbox ${task.completed || task.statut === 'Terminé' ? 'checked' : ''}`}
                  onClick={() => toggleTaskCompletion(task.id)}
                >
                  {(task.completed || task.statut === 'Terminé') && '✓'}
                </div>
                <div className="task-info">
                  <span className={`task-name ${task.completed || task.statut === 'Terminé' ? 'completed' : ''}`}>
                    {task.nom_tache}
                  </span>
                  <span className="task-project">{task.nom_projet}</span>
                </div>
              </div>
            ))}
            {allTodayTasks.length === 0 && (
              <div className="no-tasks">Aucune tâche aujourd'hui</div>
            )}
          </div>
        </div>

        {/* Colonne 2: Calendrier avec bouton d'ajout */}
        <div className="calendar-section">
          <div className="calendar-widget">
            <h3>Cette semaine</h3>
            <div className="week-calendar-grid">
              {weekDays.map((dayObj, index) => (
                <div key={index} className="week-day-container">
                  <div className="week-day-header">{dayObj.dayName}</div>
                  <div 
                    className={`week-day ${
                      dayObj.isToday ? 'today' : ''
                    } ${dayObj.hasTask ? 'has-task' : ''}`}
                  >
                    {dayObj.day}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="add-task-btn" title="Ajouter une tâche aujourd'hui">
            <i className="bi bi-plus" style={{ fontSize: '1.5rem' }}></i>
          </button>
        </div>

        {/* Colonne 3: Avancement global */}
        <div className="global-progress-section">
          <h3>Avancement global</h3>
          <div className="progress-circle-large">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#282850" strokeWidth="8"/>
              <circle 
                cx="60" cy="60" r="50" fill="none" stroke="#f7e395" strokeWidth="8"
                strokeDasharray={`${(globalProgress / 100) * 314.16} 314.16`}
                strokeLinecap="round"
              />
            </svg>
            <div className="progress-text">{Math.round(globalProgress)}%</div>
          </div>
          <div className="global-stats">
            <div className="stat-item">
              <div className="stat-value">{stats.projetsActifs}</div>
              <div className="stat-label">Projets actifs</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.tachesTotales}</div>
              <div className="stat-label">Total tâches</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.tachesEnRetard}</div>
              <div className="stat-label">En retard</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Math.round(stats.efficacite)}%</div>
              <div className="stat-label">Efficacité</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activité de la semaine */}
      <div className="weekly-activity-section">
        <h3>Activité de la semaine</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#282850" />
            <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} />
            <YAxis stroke="#a0a0a0" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#181835',
                border: '1px solid #514f84',
                borderRadius: '12px',
                color: '#e2e8f0'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="taches" 
              stroke="#6c5ce7" 
              strokeWidth={3}
              dot={{ fill: '#6c5ce7', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#5a4fcf' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default HomeScreen;