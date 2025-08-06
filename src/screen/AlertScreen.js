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
    <div className="alerts-modal" onClick={handleClose}>
      <div className="alerts-content" onClick={(e) => e.stopPropagation()}>
        <div className="alerts-header">
          <i className="bi bi-exclamation-diamond-fill alerts-icon"></i>
          <h2 className="alerts-title">Alertes de Projets</h2>
          <button className="alerts-close-btn" onClick={handleClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {loading ? (
          <div className="alerts-loading">
            <i className="bi bi-arrow-clockwise loading-spinner"></i>
            <p>Chargement des alertes...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="alerts-empty">
            <i className="bi bi-check-circle alerts-success-icon"></i>
            <h3>Aucune alerte</h3>
            <p>Tous vos projets sont à jour !</p>
          </div>
        ) : (
          <div className="alerts-list">
            <div className="alerts-summary">
              <span className="alerts-count">{alerts.length}</span>
              <span className="alerts-text">
                {alerts.length === 1 ? "phase en retard" : "phases en retard"}
              </span>
            </div>

            {alerts.map((alert, index) => (
              <div key={index} className="alert-item">
                <div className="alert-icon">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div className="alert-content">
                  <div className="alert-title">
                    Phase "<strong>{alert.libelle_phase}</strong>" du projet "
                    <strong>{alert.nom_projet}</strong>" est en retard
                  </div>
                  <div className="alert-details">
                    <div className="alert-deadline">
                      <i className="bi bi-calendar-x"></i>
                      Deadline prévue : {formatDate(alert.date_fin)}
                    </div>
                    <div className="alert-status">
                      <i className="bi bi-clock-history"></i>
                      {alert.daysLate === 0
                        ? "Échue aujourd'hui"
                        : `${alert.daysLate} jour${
                            alert.daysLate > 1 ? "s" : ""
                          } de retard`}
                    </div>
                    <div className="alert-missing">
                      <i className="bi bi-question-circle"></i>
                      Toujours pas de date de fin réelle
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="alerts-footer">
          <button
            className="btn-refresh"
            onClick={loadAlerts}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Actualiser
          </button>
          <button className="btn-close" onClick={handleClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertScreen;
