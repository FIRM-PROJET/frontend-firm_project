import React, { useState, useEffect } from "react";
import "../styles/HomeScreen.css";
import { jwtDecode } from "jwt-decode";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Import des services
import { TacheService } from "../services/TacheService";
import { DevisService } from "../services/DevisService";
// Import du modal
import TacheModal from "../modals/TacheModal";

const HomeScreen = () => {
  const [userInfo, setUserInfo] = useState({
    name: "Utilisateur",
    prenom: "",
    matricule: "",
  });

  const [userTasks, setUserTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [avancementProjets, setAvancementProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // États pour le modal
  const [selectedTache, setSelectedTache] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [stats, setStats] = useState({
    tachesAccomplies: 0,
    tachesNonDemarrees: 0,
    tachesEnCours: 0,
    tachesEnRetard: 0,
    tachesTotales: 0,
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
        const completed = await TacheService.get_task_finished_by_user(
          matricule
        );
        setCompletedTasks(completed.taches || []);

        // Calculer les statistiques
        const tachesAccomplies = tasks.filter(
          (t) => t.statut === "Terminé"
        ).length;
        const tachesNonDemarrees = tasks.filter(
          (t) => t.statut === "Non démarré" || t.statut === "En attente"
        ).length;
        const tachesEnCours = tasks.filter(
          (t) => t.statut === "En cours"
        ).length;

        const currentDate = new Date();
        const tachesEnRetard = tasks.filter((t) => {
          if (t.statut === "Terminé") return false;
          const dateFin = new Date(t.date_fin_prevue);
          return dateFin < currentDate;
        }).length;

        setStats({
          tachesAccomplies,
          tachesNonDemarrees,
          tachesEnCours,
          tachesEnRetard,
          tachesTotales: tasks.length,
        });
      }

      // Charger l'avancement par projets
      const avancementPhasesData = await TacheService.AvancementParPhases();
      const phases = await DevisService.getAllProjetsPhase();
      const phasesArray = phases.data || phases || [];
      const avancementArray =
        avancementPhasesData.data || avancementPhasesData || [];

      // Grouper par projets
      const projetsMap = new Map();
      avancementArray.forEach((phase) => {
        const phaseDetail = phasesArray.find(
          (p) => String(p.ref_projet).trim() === String(phase.ref_projet).trim()
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
            tachesTerminees: parseInt(phase.taches_terminees),
          });
        }
      });

      const projetsAvancement = Array.from(projetsMap.values()).map(
        (project) => ({
          ...project,
          avancement:
            project.totalTaches > 0
              ? (project.tachesTerminees / project.totalTaches) * 100
              : 0,
        })
      );

      setAvancementProjets(projetsAvancement);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  // Fonctions pour le modal
  const openModal = (tache) => {
    setSelectedTache(tache);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTache(null);
    setIsModalOpen(false);
  };

  const loadUserTaches = async (matricule) => {
    await loadDashboardData(matricule);
  };

  const loadAllTaches = async () => {
    await loadDashboardData(userInfo.matricule);
  };

  // Générer les données pour le graphique hebdomadaire
  const generateWeeklyData = () => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    const today = new Date();
    const mondayOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    mondayOfWeek.setDate(today.getDate() - daysFromMonday);

    return days.map((day, index) => {
      const targetDate = new Date(mondayOfWeek);
      targetDate.setDate(mondayOfWeek.getDate() + index);

      const tasksCompletedOnDay = completedTasks.filter((task) => {
        const taskCompletedDate = new Date(task.date_statut);
        taskCompletedDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        return taskCompletedDate.getTime() === targetDate.getTime();
      }).length;

      return {
        name: day,
        taches: tasksCompletedOnDay,
      };
    });
  }; // Fonction corrigée pour obtenir les tâches d'aujourd'hui (local date)
  const getTodayTasks = () => {
    if (!userTasks || userTasks.length === 0) {
      return [];
    }

    // Helpers: normaliser au début/fin de journée LOCALE
    const startOfDayLocal = (dLike) => {
      const d = new Date(dLike);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    };
    const endOfDayLocal = (dLike) => {
      const d = new Date(dLike);
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999
      );
    };

    const today = startOfDayLocal(new Date());

    const tachesAujourdhui = userTasks.filter((task) => {
      if (!task) return false;

      try {
        // Vérifier date_debut
        if (!task.date_debut) return false;
        const dateDebut = startOfDayLocal(task.date_debut);
        if (isNaN(dateDebut.getTime())) {
          console.warn(
            "Date de début invalide:",
            task.nom_tache,
            task.date_debut
          );
          return false;
        }

        // Prendre en compte les deux variantes: date_fin_prevue / date_fin_prevu
        const finSrc = task.date_fin_prevue ?? task.date_fin_prevu ?? null;

        // Si pas de date de fin => considérer "en cours" indéfiniment (jusqu'à très loin)
        const dateFinPrevu = finSrc
          ? endOfDayLocal(finSrc)
          : new Date(9999, 11, 31, 23, 59, 59, 999);

        if (isNaN(dateFinPrevu.getTime())) {
          return false;
        }

        const estDansPeriode =
          dateDebut.getTime() <= today.getTime() &&
          dateFinPrevu.getTime() >= today.getTime();

        // // Debug lisible en locale
        // console.log(
        //   `[${
        //     task.nom_tache
        //   }] Début=${dateDebut.toLocaleDateString()} Fin=${dateFinPrevu.toLocaleDateString()} Today=${today.toLocaleDateString()} ->`,
        //   estDansPeriode
        // );

        return estDansPeriode;
      } catch (err) {
        console.error("Erreur filtrage tâche:", task.nom_tache, err);
        return false;
      }
    });

    // console.log("Tâches prévues pour aujourd'hui:", tachesAujourdhui);
    return tachesAujourdhui;
  };

  // Données pour le diagramme donut 3D
  const getDonutData = () => {
    const total = stats.tachesTotales;
    if (total === 0) {
      return [
        {
          name: "Accomplies",
          value: 1,
          color: "url(#gradientAccomplies)",
        },
        {
          name: "En cours",
          value: 1,
          color: "url(#gradientEnCours)",
        },
        {
          name: "Non démarrées",
          value: 1,
          color: "url(#gradientNonDemarrees)",
        },
      ];
    }

    return [
      {
        name: "Accomplies",
        value: stats.tachesAccomplies,
        color: "url(#gradientAccomplies)",
        textColor: "#7cc48b",
      },
      {
        name: "En cours",
        value: stats.tachesEnCours,
        color: "url(#gradientEnCours)",
        textColor: "#f7e395",
      },
      {
        name: "Non démarrées",
        value: stats.tachesNonDemarrees,
        color: "url(#gradientNonDemarrees)",
        textColor: "#514f84",
      },
      {
        name: "En retard",
        value: stats.tachesEnRetard,
        color: "#e74c3c",
        textColor: "#e74c3c",
      },
    ].filter((item) => item.value > 0);
  };

  // Custom Tooltip pour le donut avec descriptions
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = stats.tachesTotales || 1;
      const percentage = Math.round((data.value / total) * 100);
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">
            {data.name}: {data.value}
          </p>
          <p className="tooltip-percentage">{percentage}%</p>
          <p className="tooltip-description">{data.payload.description}</p>
        </div>
      );
    }
    return null;
  };

  // Fonction pour obtenir la classe CSS selon le statut
  const getStatusClass = (statut) => {
    switch (statut) {
      case "Terminé":
        return "status-terminé";
      case "En cours":
        return "status-en-cours";
      case "Non démarré":
      case "En attente":
        return "status-non-démarré";
      default:
        return "status-normal";
    }
  };

  // Fonction pour formater la date d'échéance
  const formatEcheanceDate = (dateString) => {
    if (!dateString) return "Pas d'échéance";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";

      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Fonctions pour le calendrier
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convertir dimanche (0) en 6
  };

  const getTasksForDate = (date) => {
    if (!userTasks || userTasks.length === 0) return [];

    return userTasks.filter((task) => {
      if (!task || !task.date_debut) return false;

      try {
        const dateDebut = new Date(task.date_debut);
        const dateFinPrevu = task.date_fin_prevue
          ? new Date(task.date_fin_prevue)
          : dateDebut;

        if (isNaN(dateDebut.getTime()) || isNaN(dateFinPrevu.getTime()))
          return false;

        dateDebut.setHours(0, 0, 0, 0);
        dateFinPrevu.setHours(23, 59, 59, 999);
        date.setHours(0, 0, 0, 0);

        return (
          date.getTime() >= dateDebut.getTime() &&
          date.getTime() <= dateFinPrevu.getTime()
        );
      } catch (error) {
        return false;
      }
    });
  };

  const changeMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate); // lundi = 0, dimanche = 6
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      date.setHours(0, 0, 0, 0);

      const tasksForDay = getTasksForDate(date);
      const isToday = date.getTime() === today.getTime();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            tasksForDay.length > 0 ? "has-tasks" : ""
          }`}
          onClick={() => tasksForDay.length > 0 && openModal(tasksForDay[0])}
          style={{ cursor: tasksForDay.length > 0 ? "pointer" : "default" }}
        >
          <span className="day-number">{day}</span>
          {tasksForDay.length > 0 && (
            <div className="task-dots">
              {tasksForDay.slice(0, 3).map((task, index) => (
                <div
                  key={index}
                  className={`task-dot ${getStatusClass(task.statut)}`}
                  title={task.nom_tache}
                />
              ))}
              {tasksForDay.length > 3 && (
                <div className="task-dot-more">+{tasksForDay.length - 3}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const weeklyData = generateWeeklyData();
  const donutData = getDonutData();
  const todayTasks = getTodayTasks();

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
      {/* Header avec animation gradient */}
      <div className="dashboard-header1">
        <div className="welcome-section">
          <h1 className="animated-gradient-text1">
            Bonjour, {userInfo.prenom} {userInfo.name}
          </h1>
        </div>
        <div className="date-section"></div>
      </div>

      {/* Dashboard optimisé sans scroll */}
      <div className="clean-dashboard">
        {/* Première ligne : Activité hebdomadaire + Répartition des tâches + PETIT CALENDRIER */}
        <div className="dashboard-row-first">
          {/* Graphique d'activité avec border gradient */}
          <div className="card activity-chart">
            <h3 className="card-title1">Activité hebdomadaire</h3>
            <div className="chart-container-small">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={weeklyData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="activityGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#afaecf" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#5b4cb1"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#afaecf" />
                      <stop offset="100%" stopColor="#5b4cb1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 5"
                    stroke="#514f84"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#ccc"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#ccc"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#282850",
                      border: "1px solid #5b4cb1",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="taches"
                    stroke="url(#lineGradient)"
                    strokeWidth={2}
                    fill="url(#activityGradient)"
                    dot={{ fill: "#afaecf", strokeWidth: 6, r: 2 }}
                    activeDot={{ r: 5, fill: "#5b4cb1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-description">
              <span className="description-text">
                Tâches accomplies cette semaine
              </span>
              <span className="total-tasks-completed">
                {weeklyData.reduce((sum, day) => sum + day.taches, 0)} total
              </span>
            </div>
          </div>

          {/* Diagramme donut 3D avec description à droite */}
          <div className="card donut-chart-3d">
            <h3 className="card-title1">Répartition des tâches</h3>
            <div className="donut-3d-container-small">
              <div className="donut-chart-section-small">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <defs>
                      {/* Gradient violet pour Non démarrées */}
                      <linearGradient
                        id="gradientNonDemarrees"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#958be8" />
                        <stop offset="100%" stopColor="#4634ac" />
                      </linearGradient>

                      {/* Gradient vert pour Accomplies */}
                      <linearGradient
                        id="gradientAccomplies"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#a1d99b" />
                        <stop offset="100%" stopColor="#7cc48b" />
                      </linearGradient>

                      {/* Gradient jaune pour En cours */}
                      <linearGradient
                        id="gradientEnCours"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#fff5b1" />
                        <stop offset="100%" stopColor="#f7e395" />
                      </linearGradient>

                      {/* Ombre pour l'effet 3D */}
                      <filter id="shadow3d">
                        <feDropShadow
                          dx="0"
                          dy="4"
                          stdDeviation="6"
                          floodColor="#000"
                          floodOpacity="0.4"
                        />
                      </filter>
                    </defs>

                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={55}
                      paddingAngle={1}
                      dataKey="value"
                      filter="url(#shadow3d)"
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>

                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="donut-legend-3d-small">
                {donutData.map((entry, index) => (
                  <div key={index} className="legend-item-3d-small">
                    <div
                      className="legend-dot-3d-small"
                      style={{
                        backgroundColor: entry.textColor,
                        border: "none",
                      }}
                    />
                    <div className="legend-content-small">
                      <span className="legend-value-small">{entry.value}</span>
                      <span
                        className="legend-name-small"
                        style={{ color: entry.textColor }}
                      >
                        {entry.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PETIT CALENDRIER - remplace "Tâches aujourd'hui" */}
          <div className="card calendar-small">
            <div className="calendar-header">
              <button className="calendar-nav" onClick={() => changeMonth(-1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <h3 className="calendar-title">
                {currentDate.toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button className="calendar-nav" onClick={() => changeMonth(1)}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            <div className="calendar-weekdays">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid-small">{generateCalendar()}</div>
          </div>
        </div>

        {/* Deuxième ligne : Avancement des projets + TÂCHES AUJOURD'HUI */}
        <div className="dashboard-row-second">
          {/* Avancement des projets amélioré */}
          <div className="card project-progress-enhanced">
            <h3 className="card-title1">
              <i className="bi bi-bar-chart-fill"></i>
              Avancement des projets
            </h3>
            <div className="project-list-enhanced">
              {avancementProjets.slice(0, 5).map((projet, index) => (
                <div key={index} className="project-item-enhanced">
                  <div className="project-header1">
                    <span className="project-name">{projet.nom}</span>
                    <div className="project-stats">
                      <span className="percentage-badge">
                        {Math.round(projet.avancement)}%
                      </span>
                    </div>
                  </div>
                  <div className="project-details">
                    <span className="task-count">
                      {projet.tachesTerminees}/{projet.totalTaches} tâches
                    </span>
                    <div className="project-progress-bar-enhanced">
                      <div className="progress-track-enhanced">
                        <div
                          className="progress-fill-enhanced"
                          style={{
                            width: `${Math.min(projet.avancement, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TÂCHES AUJOURD'HUI - remplace le gros calendrier */}
          <div className="card today-tasks">
            <h3 className="card-title1">
              <i className="bi bi-calendar2-week-fill"></i> Tâches aujourd'hui
            </h3>
            <div className="today-tasks-container">
              {todayTasks.length > 0 ? (
                <div className="tasks-list-today">
                  {todayTasks.slice(0, 4).map((task, index) => (
                    <div
                      key={index}
                      className="task-item-today"
                      onClick={() => openModal(task)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="task-status-dot">
                        <div
                          className={`status-dot ${getStatusClass(
                            task.statut
                          )}`}
                        ></div>
                      </div>
                      <div className="task-content">
                        <div className="task-title">{task.nom_tache}</div>
                        <div className="task-meta">
                          <span
                            className={`task-status ${getStatusClass(
                              task.statut
                            )}`}
                          >
                            {task.statut}
                          </span>
                        </div>
                      </div>
                      <div className="task-deadline">
                        <span className="deadline-text">
                          Échéance : {formatEcheanceDate(task.date_fin_prevu)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {todayTasks.length > 4 && (
                    <div className="more-tasks">
                      +{todayTasks.length - 4} autres tâches
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-tasks-today">
                  <div className="no-tasks-icon">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <p className="no-tasks-text">
                    Aucune tâche prévue aujourd'hui
                  </p>
                </div>
              )}
            </div>
            <div className="today-summary">
              <div className="summary-item">
                <span className="summary-label">Total</span>
                <span className="summary-value">{todayTasks.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Terminées</span>
                <span className="summary-value completed">
                  {todayTasks.filter((t) => t.statut === "Terminé").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <TacheModal
        tache={selectedTache}
        isOpen={isModalOpen}
        onClose={closeModal}
        onStatusChange={() => loadUserTaches(userInfo.matricule)}
        onStatusUpdate={loadAllTaches}
      />
    </div>
  );
};

export default HomeScreen;
