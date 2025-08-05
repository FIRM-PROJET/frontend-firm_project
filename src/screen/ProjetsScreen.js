import React, { useState, useEffect } from "react";
import { ProjetService } from "../services/ProjetService";
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProjets();
  }, []);

  const handleNewProject = () => {
    setShowCreateModal(true);
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
              avancement: Math.floor(Math.random() * 100) + 1,
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

  // Calculer les statistiques
  const stats = {
    totalProjets: projets.length,
    totalPhases: phases.length,
    projetsEnCours: projetPhases.filter((p) => p.avancement < 100).length,
    projetsTermines: projetPhases.filter((p) => p.avancement === 100).length,
  };

  // Obtenir la couleur selon l'avancement
  const getAvancementColor = (avancement) => {
    if (avancement >= 80) return "#28a745";
    if (avancement >= 50) return "#ffc107";
    return "#dc3545";
  };

  // Données statiques pour les avancements
  const avancementData = [
    {
      ref_projet: "P2024-001",
      nom_projet: "Résidence Les Jardins",
      avancement: 75,
    },
    {
      ref_projet: "P2024-002",
      nom_projet: "Centre Commercial Nord",
      avancement: 45,
    },
    {
      ref_projet: "P2024-003",
      nom_projet: "Bureaux Tech Park",
      avancement: 85,
    },
    { ref_projet: "P2024-004", nom_projet: "Villa Moderne", avancement: 30 },
    { ref_projet: "P2024-005", nom_projet: "Hôtel Boutique", avancement: 90 },
  ];

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
      <div className="header">
        <h1 className="module-title1">Module Projets</h1>
        <h5 className="module-subtitle">
          Gestion et suivi des projets architecturaux
        </h5>

        {/* Bouton de création */}
        <div className="new-project-card">
          <div className="new-project-content" onClick={handleNewProject}>
            <FontAwesomeIcon icon={faPlusSquare} className="new-project-icon" />
            <div>
              <h3 className="new-project-title">Créer un nouveau projet</h3>
              <p className="new-project-description">
                Lancez un nouveau projet et configurez ses phases
              </p>
            </div>
          </div>
          <CreateProjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={() => {
              setShowCreateModal(false);
              fetchAllProjets();
            }}
          />
        </div>

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

          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faPlayCircle} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.projetsEnCours}</h3>
              <p className="stat-label">En Cours</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.projetsTermines}</h3>
              <p className="stat-label">Terminés</p>
            </div>
          </div>
        </div>
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

      {/* Avancement des projets - Données statiques */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Avancement des projets</h3>
        </div>

        <div className="avancement-grid">
          {avancementData.map((item) => (
            <div key={item.ref_projet} className="avancement-card">
              <div className="avancement-header">
                <div className="avancement-ref">{item.ref_projet}</div>
                <div
                  className="avancement-percentage"
                  style={{ color: getAvancementColor(item.avancement) }}
                >
                  <FontAwesomeIcon icon={faPercentage} />
                  {item.avancement}%
                </div>
              </div>
              <div className="avancement-nom">{item.nom_projet}</div>
              <div className="avancement-bar">
                <div
                  className="avancement-progress"
                  style={{
                    width: `${item.avancement}%`,
                    backgroundColor: getAvancementColor(item.avancement),
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjetsScreen;
