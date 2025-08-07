import React, { useState, useEffect } from "react";
import "../styles/PhasesScreen.css";
import { ProjetService } from "../services/ProjetService";
import { TacheService } from "../services/TacheService";
import { DevisService } from "../services/DevisService";
import { useNavigate } from "react-router-dom";

const PhasesScreen = () => {
  const [phases, setPhases] = useState([]);
  const [projets, setProjets] = useState([]);
  const [avancement, setAvancement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Aperçu");
  const navigate = useNavigate();

  const handleVoirPhases = (refProjet) => {
    navigate(`/project-phases/${refProjet}`);
  };

  const handleProjectClick = (projet) => {
    navigate(`/project-phases/${projet.ref_projet}`);
  };

  useEffect(() => {
        loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      const allPhases = await DevisService.getAllProjetsPhase();
      
      // Vérifier la structure de la réponse
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

  // ✅ Obtenir l'avancement d'une phase
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

  // ✅ Vérifier si une phase est en retard
  const isPhaseEnRetard = (phase) => {
    const today = new Date();
    const dateFin = new Date(phase.date_fin || phase.date_fin_prevu);
    
    // Phase en retard si : date de fin dépassée ET pas de date_fin_reelle
    return dateFin < today && !phase.date_fin_reelle;
  };

  // Composant barre de progression améliorée
  const ProgressBar = ({ percentage, showLabel = true, size = "normal" }) => {
    const getProgressColor = (percent) => {
      if (percent === 0) return "#6b7280";
      if (percent < 25) return "#ef4444";
      if (percent < 50) return "#f59e0b";
      if (percent < 75) return "#3b82f6";
      return "#10b981";
    };

    const barHeight = size === "small" ? "6px" : size === "large" ? "12px" : "8px";
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
              borderRadius: "4px",
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

  // ✅ Composant des phases (toutes les phases, pas seulement les actuelles)
  const PhasesActuellesCard = () => {
    // ✅ Obtenir toutes les phases avec leur avancement
    const toutesPhases = phases.map((phase) => {
      const avancementPhase = getAvancementPhase(phase.ref_projet, phase.id_phase);
      const enRetard = isPhaseEnRetard(phase);

      return {
        ...phase,
        avancement: avancementPhase,
        enRetard: enRetard,
      };
    });

    return (
      <div className="phases-actuelles-card">
        <div className="card-header">
          <h3>
            <i className="bi bi-play-circle-fill"></i>
            Toutes les Phases
          </h3>
        </div>
        <div className="phases-list">
          {toutesPhases.length > 0 ? (
            toutesPhases.slice(0, 5).map((phase, index) => (
              <div key={`${phase.ref_projet}-${phase.id_phase}-${index}`} className="phase-item">
                <div className="project-info">
                  <div className="project-name">
                    {phase.nom_projet}
                    {phase.enRetard && (
                      <i 
                        className="bi bi-exclamation-triangle-fill icon-retard" 
                        title="La phase est en retard"
                      ></i>
                    )}
                  </div>
                </div>
                <div className="phase-details">
                  <div className="phase-name">{phase.libelle_phase}</div>
                  <div className="phase-progress">
                    <ProgressBar
                      percentage={parseFloat(phase.avancement?.avancement_pourcent || 0)}
                      showLabel={true}
                      size="small"
                    />
                  </div>
                </div>
                <div className="phase-meta">
                  <span className="tasks-count">
                    {phase.avancement?.taches_terminees || 0}/{phase.avancement?.total_taches || 0}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-active-phases">
              <i className="bi bi-info-circle"></i>
              <span>Aucune phase trouvée</span>
            </div>
          )}
        </div>
        {toutesPhases.length > 5 && (
          <div className="card-footer">
            <button 
              className="voir-plus-btn"
              onClick={() => setActiveTab("Liste")}
            >
              Voir plus ({toutesPhases.length - 5} phases)
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ✅ Composant graphique d'avancement global (corrigé)
  const GlobalProgressChart = () => {
    // Calculer l'avancement global
    let totalTaches = 0;
    let tachesTerminees = 0;
    
    avancement.forEach((av) => {
      totalTaches += parseInt(av.total_taches) || 0;
      tachesTerminees += parseInt(av.taches_terminees) || 0;
    });

    const avancementGlobal = totalTaches > 0 ? (tachesTerminees / totalTaches) * 100 : 0;

    const phasesEnCours = phases.filter((phase) => {
      const today = new Date();
      const dateDebut = new Date(phase.date_debut);
      const dateFin = new Date(phase.date_fin || phase.date_fin_prevu);
      return dateDebut <= today && today <= dateFin;
    }).length;

    // Calculer les statistiques par état
    const phasesStats = {
      total: phases.length,
      enCours: phasesEnCours,
      terminees: avancement.filter(av => parseFloat(av.avancement_pourcent) === 100).length,
      enAttente: phases.length - phasesEnCours
    };

    return (
      <div className="global-progress-chart">
        <div className="card-header">
          <h3>
            <i className="bi bi-pie-chart-fill"></i>
            Avancement Global
          </h3>
        </div>
        <div className="chart-content">
          <div className="circular-progress">
            <div className="progress-circle">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#514f84"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - avancementGlobal / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="progress-text">
                <span className="progress-value">{avancementGlobal.toFixed(1)}%</span>
                <span className="progress-label">Global</span>
              </div>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{tachesTerminees}</div>
              <div className="stat-label">Tâches terminées</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalTaches}</div>
              <div className="stat-label">Total tâches</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{phasesStats.enCours}</div>
              <div className="stat-label">Phases en cours</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{phasesStats.total}</div>
              <div className="stat-label">Total phases</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Composant tableau des phases simplifié pour l'aperçu
  const PhasesTablePreview = () => {
    // Obtenir toutes les phases avec leur avancement
    const toutesPhases = phases.map((phase) => {
      const avancementPhase = getAvancementPhase(phase.ref_projet, phase.id_phase);
      const enRetard = isPhaseEnRetard(phase);

      return {
        ...phase,
        avancement: avancementPhase,
        enRetard: enRetard,
      };
    });

    return (
      <div className="phases-preview-table">
        <div className="table-header">
          <h3>
            <i className="bi bi-table"></i>
            Phases des Projets
          </h3>
          <button 
            className="voir-plus-btn"
            onClick={() => setActiveTab("Liste")}
          >
            Voir plus
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>
        <div className="table-container">
          <table className="preview-table">
            <thead>
              <tr>
                <th>Projet</th>
                <th>Phase</th>
                <th>Avancement</th>
                <th>Tâches</th>
              </tr>
            </thead>
            <tbody>
              {toutesPhases.slice(0, 6).map((phase, index) => (
                <tr key={`${phase.ref_projet}-${phase.id_phase}-${index}`}>
                  <td>
                    <div className="projet-info">
                      <div className="projet-nom">
                        {phase.nom_projet}
                        {phase.enRetard && (
                          <i 
                            className="bi bi-exclamation-triangle-fill icon-retard" 
                            style={{color: '#dc3545', marginLeft: '8px', fontSize: '12px'}}
                            title="La phase est en retard"
                          ></i>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="phase-badge">
                      {phase.libelle_phase}
                    </div>
                  </td>
                  <td>
                    <ProgressBar
                      percentage={parseFloat(phase.avancement?.avancement_pourcent || 0)}
                      showLabel={true}
                      size="small"
                    />
                  </td>
                  <td>
                    <span className="taches-count">
                      {phase.avancement?.taches_terminees || 0}/{phase.avancement?.total_taches || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ✅ Composant tableau complet des phases
  const PhasesTable = () => {
    // Obtenir toutes les phases avec leur avancement
    const toutesPhases = phases.map((phase) => {
      const avancementPhase = getAvancementPhase(phase.ref_projet, phase.id_phase);
      const enRetard = isPhaseEnRetard(phase);

      return {
        ...phase,
        avancement: avancementPhase,
        enRetard: enRetard,
      };
    });

    return (
      <div className="phases-table-container">
        <div className="table-header">
          <h3>
            <i className="bi bi-diagram-3-fill"></i>
            Toutes les phases des projets
          </h3>
        </div>
        <div className="table-content">
          {toutesPhases.length > 0 ? (
            <table className="phases-table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Phase</th>
                  <th>Période</th>
                  <th>Avancement</th>
                  <th>Tâches</th>
                </tr>
              </thead>
              <tbody>
                {toutesPhases.map((phase, index) => (
                  <tr key={`${phase.ref_projet}-${phase.id_phase}-${index}`}>
                    <td>
                      <div className="projet-info">
                        <div className="projet-nom">
                          {phase.nom_projet}
                          {phase.enRetard && (
                            <i 
                              className="bi bi-exclamation-triangle-fill icon-retard" 
                              style={{color: '#dc3545', marginLeft: '8px', fontSize: '12px'}}
                              title="La phase est en retard"
                            ></i>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="phase-info">
                        <div className="phase-nom">
                          {phase.libelle_phase}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="phase-dates">
                        <div>
                          {new Date(phase.date_debut).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="date-separator">→</div>
                        <div>
                          {new Date(phase.date_fin || phase.date_fin_prevu).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="avancement-cell">
                        <ProgressBar
                          percentage={parseFloat(phase.avancement?.avancement_pourcent || 0)}
                          showLabel={true}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="taches-info">
                        <span className="taches-terminees">
                          {phase.avancement?.taches_terminees || 0}
                        </span>
                        <span className="taches-separator">/</span>
                        <span className="taches-total">
                          {phase.avancement?.total_taches || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-projects">
              <i className="bi bi-folder-x"></i>
              <p>Aucune phase trouvée</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TableauPhasesParProjet = () => {
    // Obtenir la liste des projets uniques depuis les phases
    const projetsUniques = [...new Map(phases.map(phase => [
      phase.ref_projet, 
      {
        ref_projet: phase.ref_projet,
        nom_projet: phase.nom_projet
      }
    ])).values()];

    // Créer un mapping des projets avec leurs phases
    const projetPhases = projetsUniques.map((projet) => {
      const phasesProjet = phases.filter(phase => 
        String(phase.ref_projet).trim() === String(projet.ref_projet).trim()
      );
      return {
        ...projet,
        phases: phasesProjet
      };
    });

    // Obtenir toutes les phases uniques pour les colonnes
    const allPhases = [...new Map(phases.map(phase => [
      phase.id_phase, 
      {
        id_phase: phase.id_phase,
        libelle_phase: phase.libelle_phase
      }
    ])).values()];

    return (
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Tableau des phases par projet</h3>
        </div>

        <div className="phases-table-container">
          <table className="phases-table">
            <thead>
              <tr>
                <th>Projet</th>

                {allPhases.map((phase) => (
                  <th key={phase.id_phase}>{phase.libelle_phase}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projetPhases.map((projet) => (
                <tr
                  key={projet.ref_projet}
                  onClick={() => handleProjectClick({ ref_projet: projet.ref_projet })}
                  className="clickable-row"
                >
                  <td className="projet-cell">
                    <div className="projet-info">
                      <span className="projet-nom">{projet.nom_projet}</span>
                    </div>
                  </td>
          
                  {allPhases.map((phase) => {
                    const projetPhase = projet.phases.find(
                      (p) => String(p.id_phase).trim() === String(phase.id_phase).trim()
                    );
                    const enRetard = projetPhase && isPhaseEnRetard(projetPhase);
                    
                    return (
                      <td key={phase.id_phase} className="phase-cell">
                        {projetPhase ? (
                          <span className="phase-status-badge active">
                            <i className="bi bi-check-circle-fill"></i>
                            {enRetard && (
                              <i 
                                className="bi bi-exclamation-triangle-fill icon-retard" 
                                style={{color: '#dc3545', marginLeft: '4px', fontSize: '10px'}}
                                title="La phase est en retard"
                              ></i>
                            )}
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

  const renderContent = () => {
    switch (activeTab) {
      case "Aperçu":
        return (
          <div className="apercu-content">
            <div className="top-cards">
              <PhasesActuellesCard />
              <GlobalProgressChart />
            </div>
            <PhasesTablePreview />
          </div>
        );
      case "Liste":
        return <PhasesTable />;
      case "Tableau":
        return <TableauPhasesParProjet />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
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

      {/* Navigation Bar */}
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
          className={`nav-item ${activeTab === "Tableau" ? "active" : ""}`}
          onClick={() => setActiveTab("Tableau")}
        >
          <i className="bi bi-calendar-range-fill"></i>
          <span>Planning</span>
        </button>
      </div>

      {/* Content */}
      <div className="content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

export default PhasesScreen;