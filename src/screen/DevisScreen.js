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
  faChartLine,
  faClipboardList,
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
          ValidationDevisService.getAllEstimations(),
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

  // Obtenir les 3 derniers projets et estimations
  const recentProjects = projets.slice(0, 3);
  const recentEstimations = estimations.slice(0, 3);

  // Statistiques
  const totalValue = projets.reduce(
    (sum, p) => sum + parseFloat(p.total_ttc || 0),
    0
  );
  const activeProjects = projets.filter((p) => !p.date_fin_reel).length;
  const completedProjects = projets.filter((p) => p.date_fin_reel).length;

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container1">
      {/* Header */}
      <div className="module-header">
        <div className="header-content">
          <div className="text-content">
            <h1 className="module-title">Devis</h1>
            <p className="module-subtitle">
              Estimation de devis basée sur des projets référents et création de
              nouveaux projets référents
            </p>
          </div>
          <button className="btn-ajouter-tache" onClick={handleNewDevisClick}>
            <i className="bi bi-plus-circle-fill"></i>
            Estimer un nouveau devis
          </button>
        </div>
      </div>

      <div className="main-content">
        {/* Section des boutons d'actions */}
        <div className="actions-section">
          <div className="action-card1" onClick={handleNewDevisClick}>
            <FontAwesomeIcon icon={faPlusSquare} className="action-icon1" />
            <div className="action-content">
              <h3>Estimer un nouveau devis</h3>
              <p>Lancez un nouveau projet et débutez son estimation</p>
            </div>
          </div>

          <div className="action-card1" onClick={handleNewProject}>
            <FontAwesomeIcon icon={faBuilding} className="action-icon1" />
            <div className="action-content">
              <h3>Ajouter un projet référent</h3>
              <p>Enregistrez un nouveau projet de référence</p>
            </div>
          </div>
        </div>

        {/* Section stats + illustration */}
        <div className="stats-illustration-section">
          {/* Récapitulatif */}
          <div className="recap-section">
            <h3 className="recap-title">Récapitulatif</h3>
            <div className="recap-grid">
              <div className="recap-item">
                <span className="recap-number">{projets.length}</span>
                <p className="recap-label">Projets Référents</p>
              </div>
              <div className="recap-item">
                <span className="recap-number">{estimations.length}</span>
                <p className="recap-label">Estimations</p>
              </div>
            </div>
          </div>

          {/* Illustration 3D - Titre supprimé et fichiers plus grands */}
          <div className="illustration-section">
            <div className="papers-3d-container">
              {recentProjects.slice(0, 3).map((projet, index) => (
                <div key={projet.id_projet} className="paper-3d">
                  <div className="paper-content">
                    <div className="paper-title">
                      {projet.nom_projet.length > 25
                        ? `${projet.nom_projet.substring(0, 25)}...`
                        : projet.nom_projet}
                    </div>
                    <div className="paper-info">
                      {projet.nom_type_construction}
                      <br />
                      <strong>
                        <small style={{ fontSize: "10px", opacity: 0.7 }}>
                          {new Date(projet.date_devis).toLocaleDateString()}
                        </small>
                      </strong>
                    </div>
                  </div>
                </div>
              ))}

              {/* Si moins de 3 projets, ajouter des papiers vides */}
              {Array.from(
                { length: Math.max(0, 3 - recentProjects.length) },
                (_, index) => (
                  <div key={`empty-${index}`} className="paper-3d">
                    <div className="paper-content">
                      <div className="paper-title">Nouveau Projet</div>
                      <div className="paper-info">
                        À venir
                        <br />
                        <small style={{ fontSize: "10px", opacity: 0.7 }}>
                          En attente
                        </small>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Section des listes récentes */}
        <div className="recent-sections">
          {/* Projets référents récents */}
          <div className="recent-section">
            <div className="section-header1">
              <h3 className="section-title">Projets référents récents</h3>
              <button
                className="view-all-button"
                onClick={handleViewAllProjects}
              >
                <FontAwesomeIcon icon={faEye} />
                Voir tous
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>

            <div className="projects-list">
              {recentProjects.length > 0 ? (
                recentProjects.map((projet) => (
                  <div key={projet.id_projet} className="project-card">
                    <div className="card-header">
                      <FontAwesomeIcon
                        icon={faFileInvoice}
                        className="card-icon"
                      />
                      <h4 className="card-title">{projet.nom_projet}</h4>
                    </div>
                    <div className="card-details">
                      <div className="card-info">
                        <FontAwesomeIcon icon={faUser} className="info-icon" />
                        <span>Maître d'ouvrage : {projet.nom_client}</span>
                      </div>
                      <div className="card-info">
                        <FontAwesomeIcon
                          icon={faBuilding}
                          className="info-icon"
                        />
                        <span>Type : {projet.nom_type_construction}</span>
                      </div>
                      <div className="card-info">
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="info-icon"
                        />
                        <span>
                          Date du devis :{" "}
                          {new Date(projet.date_devis).toLocaleDateString()}
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

          {/* Estimations récentes */}
          <div className="recent-section">
            <div className="section-header1">
              <h3 className="section-title">Estimations récentes</h3>
              <button
                className="view-all-button"
                onClick={handleViewAllEstimations}
              >
                <FontAwesomeIcon icon={faEye} />
                Voir toutes
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>

            <div className="estimations-list">
              {recentEstimations.length > 0 ? (
                recentEstimations.map((estimation) => (
                  <div
                    key={estimation.id_fiche_estimation}
                    className="estimation-card"
                  >
                    <div className="card-header">
                      <FontAwesomeIcon icon={faFileAlt} className="card-icon" />
                      <h4 className="card-title">{estimation.nom_devis}</h4>
                      <span className="version-badge">
                        v{estimation.version}
                      </span>
                    </div>
                    <div className="card-details">
                      <div className="card-info">
                        <FontAwesomeIcon icon={faUser} className="info-icon" />
                        <span>
                          Maître d'ouvrage : {estimation.nom_maitre_ouvrage}
                        </span>
                      </div>
                      <div className="card-info">
                        <FontAwesomeIcon
                          icon={faFileInvoice}
                          className="info-icon"
                        />
                        <span>Code : {estimation.code_fiche}</span>
                      </div>
                      <div className="card-info">
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="info-icon"
                        />
                        <span>
                          Créé le :{" "}
                          {new Date(
                            estimation.date_creation
                          ).toLocaleDateString()}
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
      </div>
    </div>
  );
};

export default DevisScreen;
