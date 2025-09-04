import React, { useState, useEffect } from "react";
import { ProjetService } from "../services/ProjetService";
import { TacheService } from "../services/TacheService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CreateProjectModal from "../modals/CreateProjectModal";
import {
  faBuilding,
  faCheckCircle,
  faPlayCircle,
  faCalendarAlt,
  faExclamationTriangle,
  faEye,
  faList,
  faTable,
  faHome,
  faCalendarWeek,
  faChartPie,
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
  const [activeTab, setActiveTab] = useState("apercu");

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
            const projectPhases = phasesProjetResponse.data || [];

            // Calculer les vraies dates de début et fin basées sur les phases
            let dateDebut = null;
            let dateFin = null;

            if (projectPhases.length > 0) {
              const dates = projectPhases
                .map((phase) => ({
                  debut: phase.date_debut ? new Date(phase.date_debut) : null,
                  fin: phase.date_fin ? new Date(phase.date_fin) : null,
                }))
                .filter((d) => d.debut && d.fin);

              if (dates.length > 0) {
                dateDebut = new Date(
                  Math.min(...dates.map((d) => d.debut.getTime()))
                );
                dateFin = new Date(
                  Math.max(...dates.map((d) => d.fin.getTime()))
                );
              }
            }

            // Dates de fallback si pas de phases avec dates
            if (!dateDebut || !dateFin) {
              dateDebut = new Date(
                2024,
                Math.floor(Math.random() * 6),
                Math.floor(Math.random() * 28) + 1
              );
              dateFin = new Date(
                2024 + Math.floor(Math.random() * 2),
                Math.floor(Math.random() * 6) + 6,
                Math.floor(Math.random() * 28) + 1
              );
            }

            projetPhasesData.push({
              ref_projet: projet.ref_projet,
              nom_projet: projet.nom_projet,
              client: projet.id_client,
              phases: projectPhases,
              date_debut: dateDebut,
              date_fin: dateFin,
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

  // Calculer les statistiques des projets
  const stats = {
    totalProjets: projets.length,
    projetsEnCours: avancementProjetData.filter((p) => {
      const avancement = parseFloat(p.avancement_global_pourcent);
      return avancement > 0 && avancement < 100;
    }).length,
    projetsTermines: avancementProjetData.filter((p) => {
      const avancement = parseFloat(p.avancement_global_pourcent);
      return avancement === 100;
    }).length,
    projetsEnRetard: avancementProjetData.filter((p) => {
      const avancement = parseFloat(p.avancement_global_pourcent);
      return avancement > 0 && avancement < 30;
    }).length,
  };

  // Calculer l'avancement global de tous les projets
  const avancementGlobalMoyen =
    avancementProjetData.length > 0
      ? avancementProjetData.reduce(
          (sum, p) => sum + parseFloat(p.avancement_global_pourcent || 0),
          0
        ) / avancementProjetData.length
      : 0;

  // Obtenir la couleur selon l'avancement
  const getAvancementColor = (avancement) => {
    if (avancement >= 80) return "#7cc48b";
    if (avancement >= 50) return "#f7e395";
    if (avancement >= 30) return "#f7e395";
    return "#ff6b6b";
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

  // Obtenir la date de fin max pour un projet
  const getDateFinProjet = (refProjet) => {
    const projet = projetPhases.find((p) => p.ref_projet === refProjet);
    return projet ? projet.date_fin : null;
  };

  // Obtenir le nombre de phases pour un projet
  const getNombrePhasesProjet = (refProjet) => {
    const projet = projetPhases.find((p) => p.ref_projet === refProjet);
    return projet ? projet.phases.length : 0;
  };

  // Rendu du contenu selon l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case "apercu":
        return (
          <div className="apercu-dashboard-new">
            {/* Colonne de gauche: Liste des projets */}
            <div className="projets-liste-section">
              <div className="section-card">
                <div className="section-card-header">
                  <h3 className="section-card-title">
                    <FontAwesomeIcon icon={faBuilding} />
                    Projets en cours
                  </h3>
                  <button
                    className="voir-plus-btn-compact"
                    onClick={() => setActiveTab("liste")}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                </div>
                <div className="projets-liste-scroll">
                  {avancementProjetData.slice(0, 6).map((item, index) => {
                    const avancement = parseFloat(
                      item.avancement_global_pourcent || 0
                    );
                    const nom = getProjetNom(item.ref_projet);
                    const dateFin = getDateFinProjet(item.ref_projet);
                    const nombrePhases = getNombrePhasesProjet(item.ref_projet);

                    return (
                      <div
                        key={item.ref_projet || index}
                        className="projet-card-mini"
                        onClick={() =>
                          handleProjectClick({ ref_projet: item.ref_projet })
                        }
                      >
  
                        <div className="projet-card-body">
                          <h4 className="projet-card-nom">{nom}</h4>
                          <div className="projet-card-meta">
                            <div className="projet-date-fin">
                              <FontAwesomeIcon icon={faCalendarAlt} />
                              {dateFin
                                ? dateFin.toLocaleDateString("fr-FR")
                                : "Non défini"}
                            </div>
                          </div>
                        </div>
                        <div className="projet-card-header">
                          <div className="projet-phases-count">
                            <p>Total phase(s): </p>
                            {nombrePhases}
                          </div>
                        </div>
                        <div className="projet-card-progress">
                          <div className="projet-card-progress-bar">
                            <div
                              className="projet-card-progress-fill"
                              style={{
                                width: `${avancement}%`,
                                background: `linear-gradient(90deg, ${getAvancementColor(
                                  avancement
                                )}, ${getAvancementColor(avancement)}dd)`,
                              }}
                            ></div>
                          </div>
                          <span
                            className="projet-card-percentage"
                            style={{ color: getAvancementColor(avancement) }}
                          >
                            {avancement.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colonne centrale: Avancement global 3D */}
            <div className="avancement-global-section">
              <div className="section-card avancement-3d-card">
                <div className="section-card-header">
                  <h3 className="section-card-title">
                    <FontAwesomeIcon icon={faChartPie} />
                    Avancement Global
                  </h3>
                </div>
                <div className="avancement-3d-container">
                  <div className="avancement-3d-display">
                    <div className="avancement-sphere-3d">
                      <div className="sphere-outer">
                        <div className="sphere-inner">
                          <div className="percentage-3d">
                            <span className="percentage-number">
                              {avancementGlobalMoyen.toFixed(0)}
                            </span>
                            <span className="percentage-symbol">%</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="sphere-glow"
                        style={{
                          background: `radial-gradient(circle, ${getAvancementColor(
                            avancementGlobalMoyen
                          )}33, transparent 70%)`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="stats-mini-grid">
                    <div className="stat-mini-item">
                      <div
                        className="stat-mini-icon"
                        style={{ color: "#7cc48b" }}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </div>
                      <div className="stat-mini-info">
                        <span className="stat-mini-number">
                          {stats.projetsTermines}
                        </span>
                        <span className="stat-mini-label">Terminés</span>
                      </div>
                    </div>
                    <div className="stat-mini-item">
                      <div
                        className="stat-mini-icon"
                        style={{ color: "#f7e395" }}
                      >
                        <FontAwesomeIcon icon={faPlayCircle} />
                      </div>
                      <div className="stat-mini-info">
                        <span className="stat-mini-number">
                          {stats.projetsEnCours}
                        </span>
                        <span className="stat-mini-label">En cours</span>
                      </div>
                    </div>
                    <div className="stat-mini-item">
                      <div
                        className="stat-mini-icon"
                        style={{ color: "#ff6b6b" }}
                      >
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                      </div>
                      <div className="stat-mini-info">
                        <span className="stat-mini-number">
                          {stats.projetsEnRetard}
                        </span>
                        <span className="stat-mini-label">En retard</span>
                      </div>
                    </div>
                    <div className="stat-mini-item">
                      <div
                        className="stat-mini-icon"
                        style={{ color: "#afaecf" }}
                      >
                        <FontAwesomeIcon icon={faBuilding} />
                      </div>
                      <div className="stat-mini-info">
                        <span className="stat-mini-number">
                          {stats.totalProjets}
                        </span>
                        <span className="stat-mini-label">Total</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne de droite: Calendrier compact */}
            <div className="calendrier-compact-section">
              <div className="section-card">
                <div className="section-card-header">
                  <h3 className="section-card-title">
                    <FontAwesomeIcon icon={faCalendarWeek} />
                    Projets
                  </h3>
                  <button
                    className="voir-plus-btn-compact"
                    onClick={() => setActiveTab("calendrier")}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} />
                  </button>
                </div>
                <div className="calendrier-compact-container">
                  <div className="calendrier-timeline">
                    {projetPhases
                      .sort(
                        (a, b) => new Date(a.date_fin) - new Date(b.date_fin)
                      )
                      .slice(0, 5)
                      .map((projet, index) => {
                        const avancement = avancementProjetData.find(
                          (p) => p.ref_projet === projet.ref_projet
                        );
                        const pourcentage = avancement
                          ? parseFloat(
                              avancement.avancement_global_pourcent || 0
                            )
                          : 0;
                        const joursRestants = Math.ceil(
                          (projet.date_fin - new Date()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <div
                            key={projet.ref_projet}
                            className="calendrier-timeline-item"
                          >
                            <div className="timeline-date-marker">
                              <div
                                className="date-circle"
                                style={{
                                  background: `linear-gradient(135deg, ${getAvancementColor(
                                    pourcentage
                                  )}, ${getAvancementColor(pourcentage)}aa)`,
                                }}
                              >
                                <span className="date-day">
                                  {projet.date_fin.getDate()}
                                </span>
                              </div>
                              <div className="date-month">
                                {projet.date_fin.toLocaleDateString("fr-FR", {
                                  month: "short",
                                })}
                              </div>
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-projet-nom">
                                {projet.nom_projet}
                              </div>
                              <div className="timeline-meta">
                                <span className="timeline-ref">
                                  {projet.ref_projet}
                                </span>
                                <span className="timeline-jours">
                                  {joursRestants > 0
                                    ? `${joursRestants}j restants`
                                    : "Aucune phase entrée"}
                                </span>
                              </div>
                              <div className="timeline-progress-mini">
                                <div className="timeline-progress-bar">
                                  <div
                                    className="timeline-progress-fill"
                                    style={{
                                      width: `${pourcentage}%`,
                                      background:
                                        getAvancementColor(pourcentage),
                                    }}
                                  ></div>
                                </div>
                                <span className="timeline-percentage">
                                  {pourcentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "liste":
        return (
          <div className="liste-view-compact">
            <div className="section-compact">
              <div className="section-header-compact">
                <h3 className="section-title-compact">Liste des Projets</h3>
              </div>
              {avancementProjetData.length === 0 ? (
                <div className="no-data-message">
                  Aucune donnée d'avancement disponible
                </div>
              ) : (
                <div className="avancement-list-compact">
                  {avancementProjetData.map((item, index) => {
                    const avancement = parseFloat(
                      item.avancement_global_pourcent || 0
                    );
                    const totalTaches = parseInt(item.total_taches_projet || 0);
                    const tachesTerminees = parseInt(
                      item.taches_terminees_projet || 0
                    );
                    const nom = getProjetNom(item.ref_projet);
                    const dateFin = getDateFinProjet(item.ref_projet);
                    const nombrePhases = getNombrePhasesProjet(item.ref_projet);

                    return (
                      <div
                        key={item.ref_projet || index}
                        className="avancement-item-compact"
                      >
                        <div className="avancement-header-compact">
                          <div className="projet-info-compact">
                            <div className="projet-ref-compact">
                              {item.ref_projet}
                            </div>
                            <div className="projet-nom-compact">{nom}</div>
                          </div>
                          <div className="projet-meta-compact">
                            <div className="phases-badge-compact">
                              <i class="fa-solid fa-layer-group"></i>{" "}
                              {nombrePhases} phases
                            </div>
                            <div className="date-fin-compact">
                              <FontAwesomeIcon icon={faCalendarAlt} />
                              {dateFin
                                ? dateFin.toLocaleDateString("fr-FR")
                                : "Non défini"}
                            </div>
                          </div>
                          <div
                            className="avancement-percentage-compact"
                            style={{ color: getAvancementColor(avancement) }}
                          >
                            {avancement.toFixed(1)}%
                          </div>
                        </div>
                        <div className="avancement-progress-compact">
                          <div className="progress-bar-compact">
                            <div
                              className="progress-fill-compact"
                              style={{
                                width: `${avancement}%`,
                                backgroundColor: getAvancementColor(avancement),
                              }}
                            ></div>
                          </div>
                          <div className="tasks-info-compact">
                            {tachesTerminees}/{totalTaches} tâches
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case "calendrier":
        return (
          <div className="calendrier-view-compact">
            <div className="section-compact">
              <div className="section-header-compact">
                <h3 className="section-title-compact">
                  Calendrier des projets
                </h3>
              </div>
              <div className="calendar-grid-compact">
                {projetPhases.map((projet) => {
                  const avancement = avancementProjetData.find(
                    (p) => p.ref_projet === projet.ref_projet
                  );
                  const pourcentage = avancement
                    ? parseFloat(avancement.avancement_global_pourcent || 0)
                    : 0;

                  return (
                    <div
                      key={projet.ref_projet}
                      className="calendar-item-compact"
                    >
                      <div className="calendar-project-header">
                        <div className="calendar-ref-compact">
                          {projet.ref_projet}
                        </div>
                        <div
                          className="calendar-progress-badge"
                          style={{ color: getAvancementColor(pourcentage) }}
                        >
                          {pourcentage.toFixed(0)}%
                        </div>
                      </div>
                      <div className="calendar-project-nom-compact">
                        {projet.nom_projet}
                      </div>
                      <div className="calendar-dates-compact">
                        <div className="date-item-compact">
                          <FontAwesomeIcon
                            icon={faPlayCircle}
                            className="date-icon"
                          />
                          <span className="date-value-compact">
                            {projet.date_debut?.toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <div className="date-item-compact">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="date-icon"
                          />
                          <span className="date-value-compact">
                            {projet.date_fin?.toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "tableau":
        return (
          <div className="tableau-view-compact">
            <div className="section-compact">
              <div className="section-header-compact">
                <h3 className="section-title-compact">Tableau des phases</h3>
              </div>
              <div className="phases-table-container-compact">
                <table className="phases-table-compact">
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>Phases</th>
                      <th>Avancement</th>
                      <th>Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetPhases.map((projet) => {
                      const avancement = avancementProjetData.find(
                        (p) => p.ref_projet === projet.ref_projet
                      );
                      const pourcentage = avancement
                        ? parseFloat(avancement.avancement_global_pourcent || 0)
                        : 0;

                      return (
                        <tr
                          key={projet.ref_projet}
                          onClick={() =>
                            handleProjectClick({
                              ref_projet: projet.ref_projet,
                            })
                          }
                        >
                          <td>
                            <div className="tableau-projet-info">
                              <div className="tableau-ref">
                                {projet.ref_projet}
                              </div>
                              <div className="tableau-nom">
                                {projet.nom_projet}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="tableau-phases-info">
                              <i class="fa-solid fa-layer-group"></i>{" "}
                              {projet.phases.length} phases
                            </div>
                          </td>
                          <td>
                            <div
                              className="tableau-avancement"
                              style={{ color: getAvancementColor(pourcentage) }}
                            >
                              {pourcentage.toFixed(1)}%
                            </div>
                          </td>
                          <td>
                            <div className="tableau-date">
                              {projet.date_fin?.toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Contenu non trouvé</div>;
    }
  };

  if (selectedProject) {
    return (
      <ProjectPhasesScreen
        refProjet={selectedProject}
        onBack={handleBackToProjects}
      />
    );
  }

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-content">
          <i className="loading-spinner bi bi-arrow-repeat"></i>
          <div>Chargement des projets...</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="error-icon bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      </div>
    );

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

      {/* Navigation Bar */}
      <div className="nav-bar">
        <button
          className={`nav-item ${activeTab === "apercu" ? "active" : ""}`}
          onClick={() => setActiveTab("apercu")}
        >
          <FontAwesomeIcon icon={faHome} />
          <span>Aperçu</span>
        </button>
        <button
          className={`nav-item ${activeTab === "liste" ? "active" : ""}`}
          onClick={() => setActiveTab("liste")}
        >
          <FontAwesomeIcon icon={faList} />
          <span>Liste</span>
        </button>
        <button
          className={`nav-item ${activeTab === "calendrier" ? "active" : ""}`}
          onClick={() => setActiveTab("calendrier")}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Calendrier</span>
        </button>
        <button
          className={`nav-item ${activeTab === "tableau" ? "active" : ""}`}
          onClick={() => setActiveTab("tableau")}
        >
          <FontAwesomeIcon icon={faTable} />
          <span>Tableau</span>
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {renderContent()}

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
