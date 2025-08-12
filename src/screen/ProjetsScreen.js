import React, { useState, useEffect } from "react";
import { ProjetService } from "../services/ProjetService";
import { TacheService } from "../services/TacheService"; // Assurez-vous d'importer TacheService
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
  
  // Nouveaux états pour le dashboard d'avancement
  const [avancementData, setAvancementData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    projetsEnCours: 0,
    projetsTermines: 0,
    projetsEnRetard: 0,
    avancementGlobal: 0
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProjets();
    fetchAvancementData();
  }, []);

  const handleNewProject = () => {
    setShowCreateModal(true);
  };

  const fetchAvancementData = async () => {
    try {
      const [avancementParProjet, avancementParPhases] = await Promise.all([
        TacheService.AvancementParProjet(),
        TacheService.avancementParPhases()
      ]);

      if (avancementParProjet.success && avancementParProjet.data) {
        // Grouper les données par projet
        const projetAvancement = {};
        
        avancementParProjet.data.forEach(item => {
          if (!projetAvancement[item.ref_projet]) {
            projetAvancement[item.ref_projet] = {
              ref_projet: item.ref_projet,
              phases: [],
              totalTaches: 0,
              tachesTerminees: 0,
              avancement: 0
            };
          }
          
          projetAvancement[item.ref_projet].phases.push({
            id_phase: item.id_phase,
            total_taches: parseInt(item.total_taches),
            taches_terminees: parseInt(item.taches_terminees),
            avancement: parseFloat(item.avancement_pourcent)
          });
          
          projetAvancement[item.ref_projet].totalTaches += parseInt(item.total_taches);
          projetAvancement[item.ref_projet].tachesTerminees += parseInt(item.taches_terminees);
        });

        // Calculer l'avancement global par projet
        const avancementArray = Object.values(projetAvancement).map(projet => {
          const avancement = projet.totalTaches > 0 
            ? Math.round((projet.tachesTerminees / projet.totalTaches) * 100)
            : 0;
          
          return {
            ...projet,
            avancement
          };
        });

        setAvancementData(avancementArray);

        // Calculer les statistiques du dashboard
        const stats = {
          projetsEnCours: avancementArray.filter(p => p.avancement > 0 && p.avancement < 100).length,
          projetsTermines: avancementArray.filter(p => p.avancement === 100).length,
          projetsEnRetard: avancementArray.filter(p => p.avancement < 30 && p.avancement > 0).length, // Considérer <30% comme en retard
          avancementGlobal: avancementArray.length > 0 
            ? Math.round(avancementArray.reduce((sum, p) => sum + p.avancement, 0) / avancementArray.length)
            : 0
        };

        setDashboardStats(stats);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données d'avancement:", err);
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
    projetsEnCours: projetPhases.filter((p) => {
      const avancement = avancementData.find(a => a.ref_projet === p.ref_projet);
      return avancement && avancement.avancement > 0 && avancement.avancement < 100;
    }).length,
    projetsTermines: projetPhases.filter((p) => {
      const avancement = avancementData.find(a => a.ref_projet === p.ref_projet);
      return avancement && avancement.avancement === 100;
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
    const projet = projetPhases.find(p => p.ref_projet === refProjet);
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

          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faPlayCircle} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.projetsEnCours}</h3>
              <p className="stat-label">En Cours</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.projetsTermines}</h3>
              <p className="stat-label">Terminés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard d'avancement */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Dashboard d'Avancement</h3>
        </div>

        {/* Statistiques du dashboard */}
        <div className="stats-grid-horizontal" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#ffc107' }}>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.projetsEnCours}</h3>
              <p className="stat-label">Projets en Cours</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#28a745' }}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.projetsTermines}</h3>
              <p className="stat-label">Projets Terminés</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#dc3545' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.projetsEnRetard}</h3>
              <p className="stat-label">Projets en Retard</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#17a2b8' }}>
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.avancementGlobal}%</h3>
              <p className="stat-label">Avancement Global</p>
            </div>
          </div>
        </div>

        {/* Grille d'avancement des projets */}
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
              <div className="avancement-nom">{getProjetNom(item.ref_projet)}</div>
              <div className="avancement-details">
                <div className="avancement-tasks">
                  {item.tachesTerminees}/{item.totalTaches} tâches terminées
                </div>
                <div 
                  className="avancement-status"
                  style={{ color: getAvancementColor(item.avancement) }}
                >
                  {getProjetStatus(item.avancement)}
                </div>
              </div>
              <div className="avancement-bar">
                <div
                  className="avancement-progress"
                  style={{
                    width: `${item.avancement}%`,
                    backgroundColor: getAvancementColor(item.avancement),
                  }}
                ></div>
              </div>
              {/* Détails des phases */}
              <div className="phases-detail">
                {item.phases.map((phase, index) => (
                  <div key={phase.id_phase} className="phase-mini">
                    <div className="phase-mini-info">
                      <span>Phase {index + 1}</span>
                      <span>{phase.avancement}%</span>
                    </div>
                    <div className="phase-mini-bar">
                      <div
                        className="phase-mini-progress"
                        style={{
                          width: `${phase.avancement}%`,
                          backgroundColor: getAvancementColor(phase.avancement),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default ProjetsScreen;