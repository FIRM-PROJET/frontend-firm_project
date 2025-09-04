import React, { useState, useEffect } from "react";
import "../../styles/TacheCSS/CalendarView.css";

const CalendarView = ({ taches, allTaches, onTacheClick, userInfo }) => {
  const [currentPeriod, setCurrentPeriod] = useState(new Date());
  const [periodData, setPeriodData] = useState([]);
  const [viewMode, setViewMode] = useState("personal"); 
  const [timeView, setTimeView] = useState("week");

  // Fonction pour obtenir le début de la semaine (lundi)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Fonction pour obtenir le début du mois
  const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Fonction pour obtenir le début du semestre
  const getStartOfSemester = (date) => {
    const month = date.getMonth();
    const semesterStart = month < 6 ? 0 : 6; // Premier semestre: Jan-Jun, Second: Jul-Dec
    return new Date(date.getFullYear(), semesterStart, 1);
  };

  // Fonction pour obtenir le début de l'année
  const getStartOfYear = (date) => {
    return new Date(date.getFullYear(), 0, 1);
  };

  // Fonction pour générer les périodes selon la vue
  const generatePeriodData = (startDate, viewType) => {
    const periods = [];

    switch (viewType) {
      case "week":
        for (let i = 0; i < 7; i++) {
          const day = new Date(startDate);
          day.setDate(startDate.getDate() + i);
          periods.push(day);
        }
        break;

      case "month":
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
          periods.push(new Date(year, month, i));
        }
        break;

      case "semester":
        const semesterStart = getStartOfSemester(startDate);
        for (let i = 0; i < 6; i++) {
          const monthDate = new Date(
            semesterStart.getFullYear(),
            semesterStart.getMonth() + i,
            1
          );
          periods.push(monthDate);
        }
        break;

      case "year":
        for (let i = 0; i < 12; i++) {
          periods.push(new Date(startDate.getFullYear(), i, 1));
        }
        break;

      default:
        return periods;
    }

    return periods;
  };

  useEffect(() => {
    let startDate;

    switch (timeView) {
      case "week":
        startDate = getStartOfWeek(currentPeriod);
        break;
      case "month":
        startDate = getStartOfMonth(currentPeriod);
        break;
      case "semester":
        startDate = getStartOfSemester(currentPeriod);
        break;
      case "year":
        startDate = getStartOfYear(currentPeriod);
        break;
      default:
        startDate = getStartOfWeek(currentPeriod);
    }

    setPeriodData(generatePeriodData(startDate, timeView));
  }, [currentPeriod, timeView]);

  // Navigation période précédente/suivante
  const navigatePeriod = (direction) => {
    const newDate = new Date(currentPeriod);

    switch (timeView) {
      case "week":
        newDate.setDate(currentPeriod.getDate() + direction * 7);
        break;
      case "month":
        newDate.setMonth(currentPeriod.getMonth() + direction);
        break;
      case "semester":
        newDate.setMonth(currentPeriod.getMonth() + direction * 6);
        break;
      case "year":
        newDate.setFullYear(currentPeriod.getFullYear() + direction);
        break;
    }

    setCurrentPeriod(newDate);
  };

  // Fonction pour obtenir les tâches selon le mode de vue
  const getTachesToDisplay = () => {
    if (viewMode === "general") {
      return allTaches || [];
    } else {
      if (!userInfo?.matricule) {
        return allTaches || [];
      }
      return taches || [];
    }
  };

  // Fonction pour obtenir les tâches qui intersectent avec la période courante
  const getPeriodTasks = () => {
    const tachesToDisplay = getTachesToDisplay();

    if (periodData.length === 0) return [];

    const periodStart = periodData[0];
    const periodEnd = periodData[periodData.length - 1];

    let periodStartTime, periodEndTime;

    if (timeView === "month") {
      periodStartTime = new Date(periodStart).setHours(0, 0, 0, 0);
      const lastDay = new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth() + 1,
        0
      );
      periodEndTime = new Date(lastDay).setHours(23, 59, 59, 999);
    } else if (timeView === "semester" || timeView === "year") {
      periodStartTime = new Date(periodStart).setHours(0, 0, 0, 0);
      const lastMonth =
        timeView === "semester"
          ? new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0)
          : new Date(periodEnd.getFullYear(), 11, 31);
      periodEndTime = new Date(lastMonth).setHours(23, 59, 59, 999);
    } else {
      periodStartTime = new Date(periodStart).setHours(0, 0, 0, 0);
      periodEndTime = new Date(periodEnd).setHours(23, 59, 59, 999);
    }

    return tachesToDisplay.filter((tache) => {
      const taskStart = new Date(tache.date_debut).setHours(0, 0, 0, 0);
      const taskEnd = new Date(tache.date_fin_prevu).setHours(23, 59, 59, 999);

      return taskStart <= periodEndTime && taskEnd >= periodStartTime;
    });
  };

  // Fonction pour calculer la position et largeur d'une tâche
  const getTaskPosition = (tache) => {
    const taskStart = new Date(tache.date_debut);
    const taskEnd = new Date(tache.date_fin_prevu);
    const periodStart = periodData[0];
    const periodLength = periodData.length;

    let startUnit, endUnit;

    if (timeView === "week") {
      startUnit = Math.max(
        0,
        Math.floor((taskStart - periodStart) / (1000 * 60 * 60 * 24))
      );
      endUnit = Math.min(
        periodLength - 1,
        Math.floor((taskEnd - periodStart) / (1000 * 60 * 60 * 24))
      );
    } else if (timeView === "month") {
      startUnit = Math.max(0, taskStart.getDate() - 1);
      endUnit = Math.min(periodLength - 1, taskEnd.getDate() - 1);
    } else if (timeView === "semester" || timeView === "year") {
      startUnit = Math.max(0, taskStart.getMonth() - periodStart.getMonth());
      endUnit = Math.min(
        periodLength - 1,
        taskEnd.getMonth() - periodStart.getMonth()
      );
    }

    const duration = Math.max(1, endUnit - startUnit + 1);
    const leftPercent = (startUnit / periodLength) * 100;
    const widthPercent = (duration / periodLength) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      duration: duration,
    };
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = (statut) => {
    switch (statut) {
      case "Non démarré":
        return "#514f84";
      case "En cours":
        return "#e3c85eff";
      case "Terminé":
        return "#569d64ff";
      default:
        return "#514f84";
    }
  };

  // Formatage des dates selon la vue
  const formatPeriodLabel = (date) => {
    switch (timeView) {
      case "week":
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
      case "month":
        return date.getDate().toString();
      case "semester":
        return date.toLocaleDateString("fr-FR", { month: "short" });
      case "year":
        return date.toLocaleDateString("fr-FR", { month: "short" });
      default:
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
    }
  };

  const formatPeriodRange = () => {
    if (periodData.length === 0) return "";

    switch (timeView) {
      case "week":
        const start = periodData[0];
        const end = periodData[periodData.length - 1];
        return `${start.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        })} - ${end.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        })}`;
      case "month":
        return periodData[0].toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });
      case "semester":
        const semester = periodData[0].getMonth() < 6 ? "1er" : "2ème";
        return `${semester} semestre ${periodData[0].getFullYear()}`;
      case "year":
        return periodData[0].getFullYear().toString();
      default:
        return "";
    }
  };

  // Fonction pour gérer le clic sur une tâche
  const handleTaskClick = (tache) => {
    if (onTacheClick) {
      onTacheClick(tache);
    }
  };

  // Labels selon la vue
  const getPeriodLabels = () => {
    switch (timeView) {
      case "week":
        return [
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
          "Dimanche",
        ];
      case "month":
        return periodData.map((date) => formatPeriodLabel(date));
      case "semester":
        return periodData.map((date) => formatPeriodLabel(date));
      case "year":
        return periodData.map((date) => formatPeriodLabel(date));
      default:
        return [];
    }
  };

  const periodTasks = getPeriodTasks();
  const periodLabels = getPeriodLabels();

  return (
    <div className="calendar-view-container">
      {/* Navbar pour changer de vue */}
      <div className="view-navbar">
        <button
          className={`view-button ${viewMode === "personal" ? "active" : ""}`}
          onClick={() => setViewMode("personal")}
        >
          <i className="bi bi-person-fill"></i>
          Mes Tâches
        </button>
        <button
          className={`view-button ${viewMode === "general" ? "active" : ""}`}
          onClick={() => setViewMode("general")}
        >
          <i className="bi bi-people-fill"></i>
          Calendrier Général
        </button>
      </div>

      {/* Header avec navigation */}
      <div className="calendar-header">
        <button
          onClick={() => navigatePeriod(-1)}
          className="nav-button1 nav-button-prev"
        >
          <i className="bi bi-chevron-left"></i> Précédent
        </button>

        <h2 className="calendar-title">
          {timeView === "week" ? "Semaine du " : ""}
          {formatPeriodRange()}
        </h2>

        <div className="time-view-controls">
          <select
            value={timeView}
            onChange={(e) => setTimeView(e.target.value)}
            className="time-view-select"
          >
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
            <option value="semester">Semestre</option>
            <option value="year">Année</option>
          </select>

          <button
            onClick={() => navigatePeriod(1)}
            className="nav-button1 nav-button-next"
          >
            Suivant <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Gantt Chart Layout */}
      <div className="gantt-container">
        {/* En-tête avec les périodes */}
        <div className={`gantt-header gantt-header-${timeView}`}>
          {timeView === "week"
            ? periodData.map((day, index) => (
                <div key={index} className="gantt-day-header">
                  <div className="day-name">{periodLabels[index]}</div>
                  <div className="day-date">{formatPeriodLabel(day)}</div>
                </div>
              ))
            : periodData.map((period, index) => (
                <div key={index} className="gantt-period-header">
                  <div className="period-label">
                    {formatPeriodLabel(period)}
                  </div>
                </div>
              ))}
        </div>

        {/* Zone des tâches en style Gantt */}
        <div className={`gantt-tasks-container gantt-tasks-${timeView}`}>
          {periodTasks.length === 0 ? (
            <div className="no-tasks-gantt">
              <i className="bi bi-calendar-x"></i>
              <span>Aucune tâche pour cette période</span>
            </div>
          ) : (
            periodTasks.map((tache, index) => {
              const position = getTaskPosition(tache);
              return (
                <div
                  key={`${tache.ref_tache}-${index}`}
                  className="gantt-task-bar"
                  style={{
                    left: position.left,
                    width: position.width,
                    backgroundColor: getStatusColor(tache.statut),
                    top: `${index * 50 + 10}px`,
                  }}
                  onClick={() => handleTaskClick(tache)}
                >
                  <div className="task-bar-content">
                    <div className="custom-tooltip">
                      {tache.nom_tache} - {tache.description}
                      <br />
                      Du{" "}
                      {new Date(tache.date_debut).toLocaleDateString(
                        "fr-FR"
                      )}{" "}
                      au{" "}
                      {new Date(tache.date_fin_prevu).toLocaleDateString(
                        "fr-FR"
                      )}
                    </div>
                    <div className="task-bar-title">{tache.nom_tache}</div>
                    <div className="task-bar-info">
                      <span className="task-status">{tache.statut}</span>
                      {tache.nom_utilisateur && (
                        <span className="task-assignee">
                          • {tache.nom_utilisateur}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="calendar-legend">
        <div className="legend-section">
          <h4>Statuts :</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "#6366f1" }}
              ></div>
              <span>Non démarré</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "#f7e395" }}
              ></div>
              <span>En cours</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "#10b981" }}
              ></div>
              <span>Terminé</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations sur le mode de vue actuel */}
      <div className="view-info">
        <small>
          <i
            className={`bi ${
              viewMode === "personal" ? "bi-person-circle" : "bi-people-fill"
            }`}
          ></i>
          {viewMode === "personal"
            ? `Vue personnelle${
                userInfo?.matricule
                  ? ` - ${userInfo.name}`
                  : ""
              }`
            : "Vue générale - Toutes les tâches"}
          <span className="separator">•</span>
          <i
            className={`bi ${
              timeView === "week"
                ? "bi-calendar-week"
                : timeView === "month"
                ? "bi-calendar-month"
                : timeView === "semester"
                ? "bi-calendar-range"
                : "bi-calendar4-range"
            }`}
          ></i>
          Vue{" "}
          {timeView === "week"
            ? "hebdomadaire"
            : timeView === "month"
            ? "mensuelle"
            : timeView === "semester"
            ? "semestrielle"
            : "annuelle"}
        </small>
      </div>
    </div>
  );
};

export default CalendarView;
