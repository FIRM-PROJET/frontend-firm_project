import React, { useState, useEffect } from "react";
import { ProjetService } from "../services/ProjetService";
import { TacheService } from "../services/TacheService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CreateProjectModal from "../modals/CreateProjectModal";
import {
  faBuilding,
  faFileText,
  faPlusSquare,
  faCheckCircle,
  faPlayCircle,
  faCalendarAlt,
  faPercentage,
  faExclamationTriangle,
  faChartLine,
  faClock,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/ProjetScreen.css";
import { useNavigate } from "react-router-dom";
import ProjectPhasesScreen from "./ProjetsScreen/ProjectPhasesScreen";

const ProjetsScreen = () => {
  const [projets, setProjets] = useState([]);
  const [phases, setPhases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projetPhases, setProjetPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // État pour la liste d'avancement
  const [avancementProjetData, setAvancementProjetData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProjets();
    fetchAvancementProjetData();
  }, []);

  const handleNewProject = () => {
    setShowCreateModal(true);
  };

  const fetchAvancementProjetData = async () => {
    try {
      const response = await TacheService.AvancementParProjet();

      // Vérifier différentes structures possibles
      if (response && response.data && Array.isArray(response.data)) {
        setAvancementProjetData(response.data);
      } else if (response && Array.isArray(response)) {
        setAvancementProjetData(response);
      } else if (response && response.success && response.data) {
        setAvancementProjetData(response.data);
      } else {
        setAvancementProjetData([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données d'avancement:", err);
      setAvancementProjetData([]);
    }
  };

  const fetchAllProjets = async () => {
    try {
      setLoading(true);
      const [projetsResponse, phasesResponse] = await Promise.all([
        ProjetService.getAllProjects(),
        ProjetService.getAllPhases(),
      ]);

      if (projetsResponse.success) {
        setProjets(projetsResponse.data || []);
      } else {
        setError("Erreur lors du chargement des projets");
      }

      if (phasesResponse.success) {
        setPhases(phasesResponse.data || []);
      }

      const projetPhasesData = [];
      for (const projet of projetsResponse.data || []) {
        try {
          const phasesProjetResponse = await ProjetService.getPhasesByProject(
            projet.ref_projet
          );
          if (phasesProjetResponse.success) {
            projetPhasesData.push({
              ref_projet: projet.ref_projet,
              nom_projet: projet.nom_projet,
              client: projet.id_client,
              phases: phasesProjetResponse.data || [],
              date_debut: new Date(
                2024,
                Math.floor(Math.random() * 6),
                Math.floor(Math.random() * 28) + 1
              ),
              date_fin: new Date(
                2024 + Math.floor(Math.random() * 2),
                Math.floor(Math.random() * 6) + 6,
                Math.floor(Math.random() * 28) + 1
              ),
            });
          }
        } catch (err) {
          console.error(`Erreur pour le projet ${projet.ref_projet}:`, err);
        }
      }

      setProjetPhases(projetPhasesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projet) => {
    setSelectedProject(projet.ref_projet);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Calculer les statistiques des phases
  const stats = {
    totalProjets: projets.length,
    totalPhases: phases.length,
    projetsEnCours: avancementProjetData.filter((p) => {
      const avancement = parseFloat(p.avancement_global_pourcent);
      return avancement > 0 && avancement < 100;
    }).length,
    projetsTermines: avancementProjetData.filter((p) => {
      const avancement = parseFloat(p.avancement_global_pourcent);
      return avancement === 100;
    }).length,
  };

  // Obtenir la couleur selon l'avancement
  const getAvancementColor = (avancement) => {
    if (avancement >= 80) return "#28a745";
    if (avancement >= 50) return "#ffc107";
    if (avancement >= 30) return "#fd7e14";
    return "#dc3545";
  };

  // Obtenir le statut du projet
  const getProjetStatus = (avancement) => {
    if (avancement === 100) return "Terminé";
    if (avancement >= 30) return "En cours";
    if (avancement > 0) return "En retard";
    return "Non démarré";
  };

  // Trouver le nom du projet
  const getProjetNom = (refProjet) => {
    const projet = projetPhases.find((p) => p.ref_projet === refProjet);
    return projet ? projet.nom_projet : refProjet;
  };

  if (selectedProject) {
    return (
      <ProjectPhasesScreen
        refProjet={selectedProject}
        onBack={handleBackToProjects}
      />
    );
  }

  if (loading) return <div className="loading">Chargement des projets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      {/* Header */}
      <div className="module-header">
        <div className="header-content">
          <div className="text-content">
            <h1 className="module-title">Projets</h1>
            <h5 className="module-subtitle">
              Lancez un nouveau projet et configurez ses phases
            </h5>
          </div>
          <button className="btn-ajouter-tache" onClick={handleNewProject}>
            <i className="bi bi-plus-circle-fill"></i>
            Créer un nouveau projet
          </button>
        </div>
      </div>

      <div className="header">
        {/* Statistiques alignées horizontalement */}
        <div className="stats-grid-horizontal">
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalProjets}</h3>
              <p className="stat-label">Total Projets</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faFileText} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalPhases}</h3>
              <p className="stat-label">Total Phases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste d'avancement des projets */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Avancement des Projets</h3>
        </div>

        {avancementProjetData.length === 0 ? (
          <div style={{ color: "#ccc", padding: "20px", textAlign: "center" }}>
            Aucune donnée d'avancement disponible
          </div>
        ) : (
          <div className="avancement-list">
            {avancementProjetData.map((item, index) => {
              const avancement = parseFloat(
                item.avancement_global_pourcent || 0
              );
              const totalTaches = parseInt(item.total_taches_projet || 0);
              const tachesTerminees = parseInt(
                item.taches_terminees_projet || 0
              );

              return (
                <div
                  key={item.ref_projet || index}
                  className="avancement-list-item"
                >
                  <div className="avancement-item-header">
                    <div className="avancement-item-info">
                      <h4 className="avancement-item-ref">
                        {item.ref_projet || "N/A"}
                      </h4>
                      <p className="avancement-item-nom">
                        {getProjetNom(item.ref_projet) || "Projet inconnu"}
                      </p>
                    </div>
                    <div className="avancement-item-percentage">
                      <span
                        className="percentage-text"
                        style={{ color: getAvancementColor(avancement) }}
                      >
                        {avancement.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="avancement-item-details">
                    <div className="task-count">
                      <span className="task-completed">{tachesTerminees}</span>
                      <span className="task-separator">/</span>
                      <span className="task-total">{totalTaches}</span>
                      <span className="task-label">tâches terminées</span>
                    </div>
                    <div
                      className="status-badge"
                      style={{
                        color: getAvancementColor(avancement),
                        borderColor: getAvancementColor(avancement),
                      }}
                    >
                      {getProjetStatus(avancement)}
                    </div>
                  </div>

                  <div className="avancement-item-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${avancement}%`,
                          backgroundColor: getAvancementColor(avancement),
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="avancement-item-actions">
                    <button
                      className="voir-plus-btn"
                      onClick={() =>
                        handleProjectClick({ ref_projet: item.ref_projet })
                      }
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Voir plus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tableau des phases avec tous les projets */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Tableau des phases par projet</h3>
        </div>

        <div className="phases-table-container">
          <table className="phases-table">
            <thead>
              <tr>
                <th>Projet</th>
                <th>Client</th>
                {phases.map((phase) => (
                  <th key={phase.id_phase}>{phase.libelle_phase}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projetPhases.map((projet) => (
                <tr
                  key={projet.ref_projet}
                  onClick={() =>
                    handleProjectClick({ ref_projet: projet.ref_projet })
                  }
                >
                  <td className="projet-cell">
                    <div className="projet-info">
                      <span className="projet-ref">{projet.ref_projet}</span>
                      <span className="projet-nom">{projet.nom_projet}</span>
                    </div>
                  </td>
                  <td>{projet.client}</td>
                  {phases.map((phase) => {
                    const projetPhase = projet.phases.find(
                      (p) => p.id_phase === phase.id_phase
                    );
                    return (
                      <td key={phase.id_phase} className="phase-cell">
                        {projetPhase ? (
                          <span className="phase-status-badge active">
                            <FontAwesomeIcon icon={faCheckCircle} />
                          </span>
                        ) : (
                          <span className="phase-status-badge inactive">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendrier des projets */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Calendrier des projets</h3>
          <button className="view-all-button" onClick={toggleCalendar}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            {showCalendar ? "Masquer calendrier" : "Afficher calendrier"}
          </button>
        </div>

        {showCalendar && (
          <div className="calendar-container">
            <div className="calendar-grid">
              {projetPhases.map((projet) => (
                <div key={projet.ref_projet} className="calendar-item">
                  <div className="calendar-project-info">
                    <div className="calendar-ref">{projet.ref_projet}</div>
                    <div className="calendar-nom">{projet.nom_projet}</div>
                  </div>
                  <div className="calendar-dates">
                    <div className="date-item">
                      <span className="date-label">Début:</span>
                      <span className="date-value">
                        {projet.date_debut?.toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">Fin:</span>
                      <span className="date-value">
                        {projet.date_fin?.toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  <div className="calendar-duration">
                    Durée:{" "}
                    {Math.ceil(
                      (projet.date_fin - projet.date_debut) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    jours
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default ProjetsScreen;
