import React, { useState, useEffect } from "react";
import { TacheService } from "../services/TacheService";
import "../styles/NotificationScreen.css"; // Changez le nom du fichier CSS

const NotificationScreen = ({ visible, onClose, onRefresh, matricule }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && matricule) {
      fetchNotifications();
    }
  }, [visible, matricule]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TacheService.get_user_notification(matricule);

      if (!response || !Array.isArray(response)) {
        throw new Error("Format de données invalide");
      }

      const now = new Date();

      // Filtrer les notifications non expirées et les trier par date (plus récentes en premier)
      const validNotifications = response
        .filter((notification) => {
          if (!notification || !notification.expire_at) {
            return false;
          }

          const expireDate = new Date(notification.expire_at);
          if (isNaN(expireDate.getTime())) {
            return false;
          }

          return expireDate > now;
        })
        .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));

      setNotifications(validNotifications);

      // Mettre à jour le compteur dans le header
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      setError("Erreur lors du chargement des notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return "À l'instant";
      } else if (diffMins < 60) {
        return `Il y a ${diffMins} min`;
      } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`;
      } else if (diffDays < 7) {
        return `Il y a ${diffDays}j`;
      } else {
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch (error) {
      return "Date invalide";
    }
  };

  const getExpirationInfo = (expireAt) => {
    try {
      const expireDate = new Date(expireAt);
      const now = new Date();
      const diffMs = expireDate - now;
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMs < 0) {
        return { text: "Expirée", className: "expired" };
      } else if (diffHours < 24) {
        return { text: `${diffHours}h`, className: "expiring-soon" };
      } else if (diffDays < 7) {
        return { text: `Expire dans ${diffDays}j`, className: "expiring-week" };
      } else {
        return { text: "Valide", className: "valid" };
      }
    } catch (error) {
      return { text: "Erreur", className: "error" };
    }
  };

  if (!visible) return null;

  return (
    <div className="notification-screen-overlay" onClick={onClose}>
      <div
        className="notification-screen-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-screen-header">
          <h2 className="notification-screen-title">
            <i className="bi bi-bell-fill"></i>
            Notifications
          </h2>
          {notifications.length > 0 && (
            <div className="notification-count-badge">
              {notifications.length}
            </div>
          )}
          <button
            className="notification-screen-close"
            onClick={onClose}
            type="button"
          >
            <i class="bi bi-chevron-bar-right"></i>{" "}
          </button>
        </div>

        <div className="notification-screen-content">
          {loading ? (
            <div className="notification-loading">
              <i className="bi bi-arrow-clockwise notification-loading-icon"></i>
              <span>Chargement des notifications...</span>
            </div>
          ) : error ? (
            <div className="notification-error">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
              <button
                className="notification-retry-btn"
                onClick={fetchNotifications}
                type="button"
              >
                Réessayer
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <i className="bi bi-bell-slash"></i>
              <span>Aucune notification disponible</span>
            </div>
          ) : (
            <>
              <div className="recent-notifications-section">
                <h3 className="recent-notifications-title">
                  <i className="bi bi-clock-history"></i>
                  Récentes
                </h3>
              </div>
              <div className="notification-list">
                {notifications.map((notification) => {
                  const expirationInfo = getExpirationInfo(
                    notification.expire_at
                  );
                  return (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-content">
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-footer">
                          <span className="notification-date">
                            <i className="bi bi-clock"></i>
                            {formatDate(notification.date_creation)}
                          </span>
                          <span
                            className={`notification-expiration ${expirationInfo.className}`}
                          >
                            {expirationInfo.text}
                          </span>
                        </div>
                      </div>
                      <div className="notification-indicator">
                        <i className="bi bi-circle-fill"></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="notification-screen-footer">
          <button
            className="notification-refresh-btn"
            onClick={fetchNotifications}
            disabled={loading}
            type="button"
          >
            <i className="bi bi-arrow-clockwise"></i>
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationScreen;
