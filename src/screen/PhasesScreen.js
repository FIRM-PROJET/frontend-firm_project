import React, { useState, useEffect } from "react";
import "../styles/PhasesScreen.css";
import { ProjetService } from "../services/ProjetService";
import { TacheService } from "../services/TacheService";
import { DevisService } from "../services/DevisService";
import { useNavigate } from "react-router-dom";
import ProjectPhasesScreen from "./ProjetsScreen/ProjectPhasesScreen"; 

const PhasesScreen = () => {
  const [phases, setPhases] = useState([]);
  const [projets, setProjets] = useState([]);
  const [avancement, setAvancement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Aperçu");
  const [showAllRetards, setShowAllRetards] = useState(false);
  const navigate = useNavigate();
  const [allAvailablePhases, setAllAvailablePhases] = useState([]);
  
  // États pour la navigation vers ProjectPhasesScreen
  const [showProjectPhases, setShowProjectPhases] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Nouvel état pour masquer/afficher les phases dans la liste
  const [collapsedProjects, setCollapsedProjects] = useState({});

  useEffect(() => {
    loadAllData();
    fetchAllPhases(); 
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      const allPhases = await DevisService.getAllProjetsPhase();
      const phasesData = allPhases.data || allPhases || [];
      setPhases(phasesData);

      const allProjets = await ProjetService.getAllProjects();
      const projetsData = allProjets.data || allProjets || [];
      setProjets(projetsData);

      const avancementData = await TacheService.AvancementParPhases();
      const avancementArray = avancementData.data || avancementData || [];
      setAvancement(avancementArray);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPhases = async () => {
    try {
      const response = await ProjetService.getAllPhases();
      if (response.success) {
        setAllAvailablePhases(response.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de toutes les phases:', error);
    }
  };

  const getAvancementPhase = (refProjet, idPhase) => {
    if (!avancement || avancement.length === 0) {
      return {
        total_taches: "0",
        taches_terminees: "0",
        avancement_pourcent: "0.00",
      };
    }
    
    const avancementPhase = avancement.find((av) => {
      const refMatch = String(av.ref_projet).trim() === String(refProjet).trim();
      const phaseMatch = String(av.id_phase).trim() === String(idPhase).trim();
      return refMatch && phaseMatch;
    });

    return (
      avancementPhase || {
        total_taches: "0",
        taches_terminees: "0",
        avancement_pourcent: "0.00",
      }
    );
  };

  const isPhaseEnCours = (phase) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateDebut = new Date(phase.date_debut);
    const dateFin = new Date(phase.date_fin || phase.date_fin_prevu);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin.setHours(0, 0, 0, 0);
    
    return dateDebut <= today && today <= dateFin && !phase.date_fin_reelle;
  };

  const isPhaseEnRetard = (phase) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateFin = new Date(phase.date_fin || phase.date_fin_prevu);
    dateFin.setHours(0, 0, 0, 0);
    
    return dateFin < today && !phase.date_fin_reelle;
  };

  const isPhaseTerminee = (phase) => {
    return !!phase.date_fin_reelle;
  };

  const handleProjectClick = (refProjet) => {
    navigate(`/project-phases/${refProjet}`);
  };

  const handlePhaseClick = (refProjet, idPhase) => {
    navigate(`/project-phases/${refProjet}`, { state: { selectedPhase: idPhase } });
  };

  // Nouvelle fonction pour naviguer vers ProjectPhasesScreen
  const handleProjectCellClick = (refProjet) => {
    setSelectedProject(refProjet);
    setShowProjectPhases(true);
  };

  const handleBackFromProjectPhases = () => {
    setShowProjectPhases(false);
    setSelectedProject(null);
  };

  // Fonction pour basculer l'état collapsed d'un projet
  const toggleProjectCollapse = (refProjet) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [refProjet]: !prev[refProjet]
    }));
  };

  // Composant barre de progression
  const ProgressBar = ({ percentage, showLabel = true, size = "normal" }) => {
    const getProgressColor = (percent) => {
      if (percent === 0) return "#ccc";
      if (percent < 25) return "#d24643";
      if (percent < 50) return "#f7e395";
      if (percent < 75) return "#514f84";
      return "#7cc48b";
    };

    const barHeight = size === "small" ? "4px" : size === "large" ? "8px" : "6px";
    const color = getProgressColor(percentage);

    return (
      <div className={`progress-bar-container ${size}`}>
        <div className="progress-bar-bg" style={{ height: barHeight }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color,
              height: "100%",
              borderRadius: "2px",
              transition: "all 0.3s ease",
            }}
          />
        </div>
        {showLabel && (
          <span className="progress-percentage">{percentage.toFixed(1)}%</span>
        )}
      </div>
    );
  };

  // Composant des phases en cours
  const PhasesEnCoursCard = () => {
    const phasesEnCours = phases
      .filter(isPhaseEnCours)
      .map((phase) => ({
        ...phase,
        avancement: getAvancementPhase(phase.ref_projet, phase.id_phase),
      }));

    return (
      <div className="phases-card">
        <div className="card-header">
          <h3>
            <i className="bi bi-play-circle-fill"></i>
            Phases en cours ({phasesEnCours.length})
          </h3>
        </div>
        <div className="phases-list">
          {phasesEnCours.length > 0 ? (
            phasesEnCours.slice(0, 3).map((phase, index) => (
              <div key={`${phase.ref_projet}-${phase.id_phase}-${index}`} className="phase-item">
                <div className="phase-info">
                  <div className="project-name">{phase.nom_projet}</div>
                  <div className="phase-name">{phase.libelle_phase}</div>
                </div>
                <div className="phase-progress">
                  <ProgressBar
                    percentage={parseFloat(phase.avancement?.avancement_pourcent || 0)}
                    showLabel={true}
                    size="small"
                  />
                  <span className="tasks-count">
                    {phase.avancement?.taches_terminees || 0}/{phase.avancement?.total_taches || 0}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-phases">
              <i className="bi bi-info-circle"></i>
              <span>Aucune phase en cours</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant récapitulatif sans pourcentage global
  const RecapitulatifCard = () => {
    const totalPhases = phases.length;
    const phasesEnCours = phases.filter(isPhaseEnCours).length;
    const phasesTerminees = phases.filter(isPhaseTerminee).length;
    const phasesEnRetard = phases.filter(isPhaseEnRetard).length;
    const phasesAVenir = totalPhases - phasesEnCours - phasesTerminees - phasesEnRetard;

    return (
      <div className="recap-card">
        <div className="card-header">
          <h3>
            <i className="bi bi-pie-chart-fill"></i>
            Récapitulatif
          </h3>
        </div>
        <div className="recap-content">
          <div className="stats-grid">
            <div className="stat-item total">
              <div className="stat-icon">
                <i className="bi bi-collection"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{totalPhases}</span>
                <span className="stat-label">Total phases</span>
              </div>
            </div>
            <div className="stat-item en-cours">
              <div className="stat-icon">
                <i className="bi bi-play-circle-fill"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{phasesEnCours}</span>
                <span className="stat-label">En cours</span>
              </div>
            </div>
            <div className="stat-item terminees">
              <div className="stat-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{phasesTerminees}</span>
                <span className="stat-label">Terminées</span>
              </div>
            </div>
            <div className="stat-item retard">
              <div className="stat-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <div className="stat-data">
                <span className="stat-value">{phasesEnRetard}</span>
                <span className="stat-label">En retard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Composant phases en retard avec "Voir plus"
  const PhasesEnRetardCard = () => {
    const phasesEnRetard = phases
      .filter(isPhaseEnRetard)
      .map((phase) => ({
        ...phase,
        avancement: getAvancementPhase(phase.ref_projet, phase.id_phase),
      }));

    const displayedPhases = showAllRetards ? phasesEnRetard : phasesEnRetard.slice(0, 3);

    return (
      <div className="phases-retard-card">
        <div className="card-header">
          <h3>
            <i className="bi bi-exclamation-triangle-fill"></i>
            Phases en retard ({phasesEnRetard.length})
          </h3>
        </div>
        <div className="phases-list">
          {displayedPhases.length > 0 ? (
            <>
              {displayedPhases.map((phase, index) => (
                <div key={`${phase.ref_projet}-${phase.id_phase}-${index}`} className="phase-item retard">
                  <div className="phase-info">
                    <div className="project-name">{phase.nom_projet}</div>
                    <div className="phase-name">{phase.libelle_phase}</div>
                    <div className="retard-info">
                      Échéance: {new Date(phase.date_fin || phase.date_fin_prevu).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="phase-progress">
                    <ProgressBar
                      percentage={parseFloat(phase.avancement?.avancement_pourcent || 0)}
                      showLabel={true}
                      size="small"
                    />
                  </div>
                </div>
              ))}
              {phasesEnRetard.length > 3 && (
                <button 
                  className="voir-plus-btn"
                  onClick={() => setShowAllRetards(!showAllRetards)}
                >
                  {showAllRetards ? "Voir moins" : `Voir ${phasesEnRetard.length - 3} phases de plus`}
                </button>
              )}
            </>
          ) : (
            <div className="no-phases">
              <i className="bi bi-check-circle"></i>
              <span>Aucune phase en retard</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant Liste des phases avec bouton masquer/afficher
  const PhasesListe = () => {
    // Grouper les phases par projet
    const phasesParProjet = phases.reduce((acc, phase) => {
      const key = phase.ref_projet;
      if (!acc[key]) {
        acc[key] = {
          projet: {
            ref_projet: phase.ref_projet,
            nom_projet: phase.nom_projet
          },
          phases: []
        };
      }
      
      acc[key].phases.push({
        ...phase,
        avancement: getAvancementPhase(phase.ref_projet, phase.id_phase),
        terminee: isPhaseTerminee(phase),
        enRetard: isPhaseEnRetard(phase),
      });
      
      return acc;
    }, {});

    return (
      <div className="phases-liste-container">
        <div className="liste-header">
          <h3>Liste complète des phases par projet</h3>
        </div>
        <div className="phases-liste">
          {Object.values(phasesParProjet).map((groupe, projetIndex) => (
            <div key={groupe.projet.ref_projet} className="projet-groupe">
              <div className="projet-groupe-header">
                <h4 className="projet-groupe-nom">
                  <span 
                    className="projet-nom-text"
                    onClick={() => handleProjectCellClick(groupe.projet.ref_projet)}
                  >
                    {groupe.projet.nom_projet}
                    <i className="bi bi-arrow-right-circle"></i>
                  </span>
                  <button 
                    className="toggle-phases-btn"
                    onClick={() => toggleProjectCollapse(groupe.projet.ref_projet)}
                  >
                    <i className={`bi ${collapsedProjects[groupe.projet.ref_projet] ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    <span>{collapsedProjects[groupe.projet.ref_projet] ? 'Afficher' : 'Masquer'}</span>
                  </button>
                </h4>
              </div>
              {!collapsedProjects[groupe.projet.ref_projet] && (
                <div className="phases-groupe-liste">
                  {groupe.phases.map((phase, index) => (
                    <div 
                      key={`${phase.ref_projet}-${phase.id_phase}-${index}`} 
                      className={`phase-liste-item ${phase.terminee ? 'terminee' : ''} ${phase.enRetard ? 'retard' : ''}`}
                      onClick={() => handlePhaseClick(phase.ref_projet, phase.id_phase)}
                    >
                      <div className="phase-liste-info">
                        <div className="phase-liste-header">
                          <span className="phase-nom">{phase.libelle_phase}</span>
                        </div>
                        <div className="phase-liste-dates">
                          <span>Du {new Date(phase.date_debut).toLocaleDateString("fr-FR")}</span>
                          <span>au {new Date(phase.date_fin || phase.date_fin_prevu).toLocaleDateString("fr-FR")}</span>
                          {phase.date_fin_reelle && (
                            <span className="date-reelle">
                              (Terminé le {new Date(phase.date_fin_reelle).toLocaleDateString("fr-FR")})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="phase-liste-progress">
                        <ProgressBar
                          percentage={parseFloat(phase.avancement?.avancement_pourcent || 0)}
                          showLabel={true}
                        />
                        <span className="taches-info">
                          {phase.avancement?.taches_terminees || 0}/{phase.avancement?.total_taches || 0} tâches
                        </span>
                      </div>
                      <div className="phase-liste-status">
                        {phase.terminee && <span className="status-badge terminee">Terminée</span>}
                        {phase.enRetard && <span className="status-badge retard">En retard</span>}
                        {!phase.terminee && !phase.enRetard && isPhaseEnCours(phase) && (
                          <span className="status-badge en-cours">En cours</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Composant Planning modifié pour utiliser toutes les phases disponibles
  const PhasesPlanning = () => {
    const projetsUniques = [...new Map(phases.map(phase => [
      phase.ref_projet, 
      {
        ref_projet: phase.ref_projet,
        nom_projet: phase.nom_projet
      }
    ])).values()];

    return (
      <div className="planning-container">
        <div className="planning-header">
          <h3>Tableau des projets par phase</h3>
        </div>
        <div className="planning-table-container">
          <table className="planning-table">
            <thead>
              <tr>
                <th>Projet</th>
                {allAvailablePhases.map((phase) => (
                  <th key={phase.id_phase}>{phase.libelle_phase}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projetsUniques.map((projet) => (
                <tr key={projet.ref_projet} className="planning-row">
                  <td className="projet-cell-header">{projet.nom_projet}</td>
                  {allAvailablePhases.map((phase) => {
                    const projetPhase = phases.find(
                      (p) =>
                        String(p.ref_projet).trim() === String(projet.ref_projet).trim() &&
                        String(p.id_phase).trim() === String(phase.id_phase).trim()
                    );

                    if (projetPhase) {
                      const avancementPhase = getAvancementPhase(projetPhase.ref_projet, projetPhase.id_phase);
                      const terminee = isPhaseTerminee(projetPhase);
                      const enRetard = isPhaseEnRetard(projetPhase);
                      const enCours = isPhaseEnCours(projetPhase);

                      return (
                        <td
                          key={phase.id_phase}
                          className="phase-cell"
                          onClick={() => handleProjectCellClick(projetPhase.ref_projet)}
                        >
                          <div
                            className={`phase-status ${
                              terminee
                                ? "terminee"
                                : enRetard
                                ? "retard"
                                : enCours
                                ? "en-cours"
                                : "planifiee"
                            }`}
                          >
                            <div className="phase-indicator">
                              {enRetard && <i className="bi bi-exclamation-triangle-fill alert-icon"></i>}
                              <div
                                className={`status-dot ${
                                  enRetard
                                    ? "retard"
                                    : terminee
                                    ? "terminee"
                                    : enCours
                                    ? "en-cours"
                                    : "planifiee"
                                }`}
                              ></div>
                            </div>
                            <span className="progress-text">
                              {parseFloat(avancementPhase.avancement_pourcent).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      );
                    } else {
                      return (
                        <td key={phase.id_phase} className="phase-cell">
                          <span className="phase-absent">-</span>
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div>Chargement des phases...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="bi bi-exclamation-circle-fill error-icon"></i>
          <div>Erreur: {error}</div>
        </div>
      </div>
    );
  }

  // Si on affiche ProjectPhasesScreen
  if (showProjectPhases && selectedProject) {
    return (
      <ProjectPhasesScreen 
        refProjet={selectedProject} 
        onBack={handleBackFromProjectPhases}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "Aperçu":
        return (
          <div className="apercu-content">
            <div className="top-section">
              <PhasesEnCoursCard />
              <RecapitulatifCard />
            </div>
            <PhasesEnRetardCard />
          </div>
        );
      case "Liste":
        return <PhasesListe />;
      case "Planning":
        return <PhasesPlanning />;
      default:
        return null;
    }
  };

  return (
    <div className="phases-screen-container">
      <div className="module-header">
        <div className="header-content">
          <div className="text-content">
            <h1 className="module-title">Phases</h1>
            <h5 className="module-subtitle">
              Suivre l'avancement des phases de projet, visualiser les étapes
              clés, et surveiller la progression en temps réel
            </h5>
          </div>
        </div>
      </div>

      <div className="nav-bar">
        <button
          className={`nav-item ${activeTab === "Aperçu" ? "active" : ""}`}
          onClick={() => setActiveTab("Aperçu")}
        >
          <i className="bi bi-grid-fill"></i>
          <span>Aperçu</span>
        </button>
        <button
          className={`nav-item ${activeTab === "Liste" ? "active" : ""}`}
          onClick={() => setActiveTab("Liste")}
        >
          <i className="bi bi-list-ul"></i>
          <span>Liste</span>
        </button>
        <button
          className={`nav-item ${activeTab === "Planning" ? "active" : ""}`}
          onClick={() => setActiveTab("Planning")}
        >
          <i className="bi bi-calendar-range-fill"></i>
          <span>Tableau</span>
        </button>
      </div>

      <div className="content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

export default PhasesScreen;