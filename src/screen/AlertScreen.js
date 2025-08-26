import React, { useState, useEffect } from "react";
import "../styles/AlertScreen.css";
import { DevisService } from "../services/DevisService";

const AlertScreen = ({ visible, onClose, onRefresh }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await DevisService.getAllProjetsPhase();
      const phases = await response;

      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin de la journée actuelle

      const alertPhases = phases
        .filter((phase) => {
          if (phase.date_fin_reelle === null) {
            const dateFin = new Date(phase.date_fin);
            dateFin.setHours(23, 59, 59, 999); // Fin de la journée de deadline
            return dateFin < today; // Strictement inférieur
          }
          return false;
        })
        .map((phase) => {
          const dateFin = new Date(phase.date_fin);
          dateFin.setHours(23, 59, 59, 999);

          const todayForCalc = new Date();
          todayForCalc.setHours(0, 0, 0, 0); // Début de la journée actuelle

          const dateFinForCalc = new Date(phase.date_fin);
          dateFinForCalc.setHours(0, 0, 0, 0); // Début de la journée de deadline

          // Calcul correct des jours de retard
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

  if (!visible) return null;

  return (
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
            <i class="bi bi-chevron-bar-right"></i>
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
                <div key={index} className="alert-item">
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
  );
};

export default AlertScreen;