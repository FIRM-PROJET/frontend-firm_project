import React, { useState, useEffect } from "react";
import "../styles/AlertScreen.css";
import { DevisService } from "../services/DevisService";
import { ProjetService } from "../services/ProjetService";

const AlertScreen = ({ visible, onClose, onRefresh }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await DevisService.getAllProjetsPhase();
      const phases = await response;

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const alertPhases = phases
        .filter((phase) => {
          if (phase.date_fin_reelle === null) {
            const dateFin = new Date(phase.date_fin);
            dateFin.setHours(23, 59, 59, 999);
            return dateFin < today;
          }
          return false;
        })
        .map((phase) => {
          const dateFin = new Date(phase.date_fin);
          dateFin.setHours(23, 59, 59, 999);

          const todayForCalc = new Date();
          todayForCalc.setHours(0, 0, 0, 0);

          const dateFinForCalc = new Date(phase.date_fin);
          dateFinForCalc.setHours(0, 0, 0, 0);

          const daysLate = Math.floor(
            (todayForCalc - dateFinForCalc) / (1000 * 60 * 60 * 24)
          );

          return {
            ...phase,
            daysLate: daysLate,
          };
        });

      setAlerts(alertPhases);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = async (alert) => {
    setSelectedAlert(alert);
    setLoadingModal(true);
    setModalData(null);

    try {
      const response = await ProjetService.getPhaseProgress(
        alert.ref_projet,
        alert.id_phase
      );
      
      if (response.success) {
        setModalData(response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du suivi:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setSelectedAlert(null);
    setModalData(null);
  };

  useEffect(() => {
    if (visible) {
      loadAlerts();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
    if (onRefresh) {
      onRefresh();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateProgress = (done, total) => {
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  };

  if (!visible) return null;

  return (
    <>
      <div className="alert-sidebar-overlay" onClick={handleClose}>
        <div className="alert-sidebar-container" onClick={(e) => e.stopPropagation()}>
          <div className="alert-sidebar-header">
            <div className="alert-sidebar-title">
              <i className="bi bi-exclamation-diamond-fill"></i>
              Alertes de Projets
            </div>
            {alerts.length > 0 && (
              <div className="alert-count-badge">
                {alerts.length}
              </div>
            )}
            <button className="alert-sidebar-close" onClick={handleClose}>
              <i className="bi bi-chevron-bar-right"></i>
            </button>
          </div>

          <div className="alert-sidebar-content">
            {loading ? (
              <div className="alert-loading">
                <i className="bi bi-arrow-clockwise alert-loading-icon"></i>
                <span>Chargement des alertes...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="alert-empty">
                <i className="bi bi-check-circle"></i>
                <span>Aucune alerte</span>
                <p>Tous vos projets sont à jour !</p>
              </div>
            ) : (
              <div className="alert-list">
                {alerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="alert-item"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="alert-indicator">
                      <i className="bi bi-circle-fill"></i>
                    </div>
                    <div className="alert-content">
                      <div className="alert-message">
                        Phase "<strong>{alert.libelle_phase}</strong>" du projet "
                        <strong>{alert.nom_projet}</strong>" est en retard
                      </div>
                      <div className="alert-footer">
                        <div className="alert-date">
                          <i className="bi bi-calendar-x"></i>
                          Deadline : {formatDate(alert.date_fin)}
                        </div>
                        <div className={`alert-status ${alert.daysLate === 0 ? 'today' : alert.daysLate <= 7 ? 'recent' : 'critical'}`}>
                          {alert.daysLate === 0
                            ? "Échue aujourd'hui"
                            : `${alert.daysLate}j de retard`}
                        </div>
                      </div>
                      <div className="alert-missing">
                        <i className="bi bi-question-circle"></i>
                        Aucune date de fin réelle
                      </div>
                      <div className="alert-click-hint">
                        <i className="bi bi-eye"></i>
                        Cliquer pour voir le suivi
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="alert-sidebar-footer">
            <button
              className="alert-refresh-btn"
              onClick={loadAlerts}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Modal de suivi */}
      {selectedAlert && (
        <div className="alert-modal-overlay" onClick={closeModal}>
          <div className="alert-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="alert-modal-header">
              <div className="alert-modal-title">
                <i className="bi bi-people-fill"></i>
                Suivi de la Phase
              </div>
              <button className="alert-modal-close" onClick={closeModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="alert-modal-info">
              <div className="alert-modal-info-item">
                <span className="alert-modal-label">Projet :</span>
                <span className="alert-modal-value">{selectedAlert.nom_projet}</span>
              </div>
              <div className="alert-modal-info-item">
                <span className="alert-modal-label">Phase :</span>
                <span className="alert-modal-value">{selectedAlert.libelle_phase}</span>
              </div>
              <div className="alert-modal-info-item">
                <span className="alert-modal-label">Deadline :</span>
                <span className="alert-modal-value alert-modal-deadline">
                  {formatDate(selectedAlert.date_fin)}
                </span>
              </div>
            </div>

            <div className="alert-modal-content">
              {loadingModal ? (
                <div className="alert-modal-loading">
                  <i className="bi bi-arrow-clockwise alert-loading-icon"></i>
                  <span>Chargement du suivi...</span>
                </div>
              ) : modalData ? (
                <div className="alert-modal-users">
                  <div className="alert-modal-section-title">
                    <i className="bi bi-person-badge"></i>
                    Progression par Personne
                  </div>
                  {modalData.users.map((user, index) => {
                    const progress = calculateProgress(user.done, user.total);
                    const isComplete = user.done === user.total;
                    const hasDelay = !isComplete;

                    return (
                      <div 
                        key={index} 
                        className={`alert-modal-user-card ${hasDelay ? 'has-delay' : 'complete'}`}
                      >
                        {hasDelay && (
                          <div className="alert-modal-user-badge">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                          </div>
                        )}
                        
                        <div className="alert-modal-user-header">
                          <div className="alert-modal-user-info">
                            <div className="alert-modal-user-avatar">
                              {user.prenom.charAt(0)}{user.nom.charAt(0)}
                            </div>
                            <div className="alert-modal-user-details">
                              <div className="alert-modal-user-name">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="alert-modal-user-matricule">
                                {user.matricule}
                              </div>
                            </div>
                          </div>
                          <div className={`alert-modal-user-status ${isComplete ? 'complete' : 'pending'}`}>
                            <i className={`bi ${isComplete ? 'bi-check-circle-fill' : 'bi-clock-fill'}`}></i>
                            {isComplete ? 'Terminé' : 'En retard'}
                          </div>
                        </div>

                        <div className="alert-modal-user-progress">
                          <div className="alert-modal-progress-info">
                            <span className="alert-modal-progress-label">Tâches complétées</span>
                            <span className="alert-modal-progress-value">
                              {user.done}/{user.total}
                            </span>
                          </div>
                          <div className="alert-modal-progress-bar">
                            <div 
                              className={`alert-modal-progress-fill ${isComplete ? 'complete' : ''}`}
                              style={{ width: `${progress}%` }}
                            >
                              <span className="alert-modal-progress-percent">{progress}%</span>
                            </div>
                          </div>
                          {!isComplete && (
                            <div className="alert-modal-remaining">
                              <i className="bi bi-info-circle"></i>
                              {user.total - user.done} tâche{user.total - user.done > 1 ? 's' : ''} restante{user.total - user.done > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert-modal-error">
                  <i className="bi bi-exclamation-circle"></i>
                  <span>Impossible de charger les données</span>
                </div>
              )}
            </div>

            <div className="alert-modal-footer">
              <button className="alert-modal-close-btn" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertScreen;