import React, { useState, useEffect } from "react";
import { DevisService } from "../services/DevisService";
import { ValidationDevisService } from "../services/ValidationDevisService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faMoneyBillWave,
  faCalendarAlt,
  faUser,
  faFileInvoice,
  faPlusSquare,
  faCheckCircle,
  faEye,
  faFileAlt,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/DevisScreen.css";
import { useNavigate } from "react-router-dom";

const DevisScreen = () => {
  const [projets, setProjets] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projetsData, estimationsData] = await Promise.all([
          DevisService.getAllDevis(),
          ValidationDevisService.getAllEstimations()
        ]);
        setProjets(projetsData);
        setEstimations(estimationsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNewDevisClick = () => navigate("/devis/new");
  const handleNewProject = () => navigate("/devis/new_project");
  const handleViewAllProjects = () => navigate("/devis/liste_projets");
  const handleViewAllEstimations = () => navigate("/devis/liste_estimation");

  // Obtenir les 3 derniers projets
  const recentProjects = projets.slice(0, 3);
  
  // Obtenir les 3 dernières estimations
  const recentEstimations = estimations.slice(0, 3);

  const totalValue = projets.reduce(
    (sum, p) => sum + parseFloat(p.total_ttc || 0),
    0
  );
  const activeProjects = projets.filter((p) => !p.date_fin_reel).length;
  const completedProjects = projets.filter((p) => p.date_fin_reel).length;

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h1 className="module-title1">Module Devis</h1>
      <h5 className="module-subtitle">
        Estimation de devis basée sur des projets référents et création de
        nouveaux projets
      </h5>

      <div className="new-devis-card">
        <div className="new-devis-content" onClick={handleNewDevisClick}>
          <FontAwesomeIcon icon={faPlusSquare} className="new-devis-icon" />
          <div>
            <h3 className="new-devis-title">Estimer un nouveau devis</h3>
            <p className="new-devis-description">
              Lancez un nouveau projet et débutez son estimation
            </p>
          </div>
        </div>
        <div className="new-devis-content" onClick={handleNewProject}>
          <FontAwesomeIcon icon={faPlusSquare} className="new-devis-icon" />
          <div>
            <h3 className="new-devis-title">
              Ajouter un nouveau projet référent
            </h3>
            <p className="new-devis-description">
              Enregistrez un projet de référence
            </p>
          </div>
        </div>
      </div>

      <div className="stats-grid1">
        <div className="stat-card1">
          <div className="stat-icon1">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div>
            <h3 className="stat-title">Valeur Totale</h3>
            <p className="stat-value">
              {totalValue.toLocaleString("fr-FR")} Ar
            </p>
          </div>
        </div>

        <div className="stat-card1">
          <div className="stat-icon1">
            <FontAwesomeIcon icon={faBuilding} />
          </div>
          <div>
            <h3 className="stat-title">Projets Actifs</h3>
            <p className="stat-value">{activeProjects}</p>
          </div>
        </div>

        <div className="stat-card1">
          <div className="stat-icon1">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div>
            <h3 className="stat-title">Projets Terminés</h3>
            <p className="stat-value">{completedProjects}</p>
          </div>
        </div>
      </div>

      <div className="performance-card">
        <h3 className="performance-title">Performances du Mois</h3>
        <div className="performance-grid">
          <div className="performance-item">
            <span className="performance-value">{projets.length}</span>
            <span className="performance-label">Total Projets</span>
          </div>
          <div className="performance-item">
            <span className="performance-value">
              {Math.round(totalValue / 1_000_000)}M
            </span>
            <span className="performance-label">CA (Ar)</span>
          </div>
          <div className="performance-item">
            <span className="performance-value">{activeProjects}</span>
            <span className="performance-label">En Cours</span>
          </div>
        </div>
      </div>

      {/* Section Projets Référents */}
      <div className="filter-section">
        <div className="section-header">
          <h3 className="filter-title">Projets référents récents</h3>
          <button 
            className="view-all-button"
            onClick={handleViewAllProjects}
          >
            <FontAwesomeIcon icon={faEye} style={{ marginRight: "5px" }} />
            Voir tous les projets
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: "5px" }} />
          </button>
        </div>
        
        <div className="projects-list1">
          {recentProjects.length > 0 ? (
            recentProjects.map((projet) => (
              <div key={projet.id_projet} className="project-card1">
                <div className="project-header">
                  <FontAwesomeIcon
                    icon={faFileInvoice}
                    className="project-icon1"
                  />
                  <h4 className="project-title">{projet.nom_projet}</h4>
                </div>
                <div className="project-details1">
                  <div className="project-info1">
                    <FontAwesomeIcon icon={faUser} className="info-icon1" />
                    <span>Maitre d'ouvrage : {projet.nom_client}</span>
                  </div>
                  <div className="project-info1">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="info-icon1"
                    />
                    <span>Type : {projet.nom_type_construction}</span>
                  </div>
                  <div className="project-info1">
                    <FontAwesomeIcon
                      icon={faCalendarAlt}
                      className="info-icon1"
                    />
                    <span>
                      Du {new Date(projet.date_debut).toLocaleDateString()}{" "}
                      au{" "}
                      {new Date(projet.date_fin_prevu).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="project-info1">
                    <FontAwesomeIcon
                      icon={faMoneyBillWave}
                      className="info-icon1"
                    />
                    <span>
                      Montant :{" "}
                      {parseFloat(projet.total_ttc).toLocaleString("fr-FR")}{" "}
                      Ar
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">Aucun projet référent trouvé.</div>
          )}
        </div>
      </div>

      {/* Section Estimations */}
      <div className="filter-section">
        <div className="section-header">
          <h3 className="filter-title">Estimations récentes</h3>
          <button 
            className="view-all-button"
            onClick={handleViewAllEstimations}
          >
            <FontAwesomeIcon icon={faEye} style={{ marginRight: "5px" }} />
            Voir toutes les estimations
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: "5px" }} />
          </button>
        </div>
        
        <div className="estimations-list">
          {recentEstimations.length > 0 ? (
            recentEstimations.map((estimation) => (
              <div key={estimation.id_fiche_estimation} className="estimation-card">
                <div className="estimation-header">
                  <FontAwesomeIcon
                    icon={faFileAlt}
                    className="estimation-icon"
                  />
                  <h4 className="estimation-title">{estimation.nom_devis}</h4>
                  <span className="estimation-version">v{estimation.version}</span>
                </div>
                <div className="estimation-details">
                  <div className="estimation-info">
                    <FontAwesomeIcon icon={faUser} className="info-icon1" />
                    <span>Maitre d'ouvrage : {estimation.nom_maitre_ouvrage}</span>
                  </div>
                  <div className="estimation-info">
                    <FontAwesomeIcon icon={faFileInvoice} className="info-icon1" />
                    <span>Code : {estimation.code_fiche}</span>
                  </div>
                  <div className="estimation-info">
                    <FontAwesomeIcon
                      icon={faCalendarAlt}
                      className="info-icon1"
                    />
                    <span>
                      Créé le : {new Date(estimation.date_creation).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">Aucune estimation trouvée.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevisScreen;