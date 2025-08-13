import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ModalUpdatePassword from "../modals/ModalUpdatePassword";
import "../styles/Header.css";
import AlertScreen from "../screen/AlertScreen";
import NotificationScreen from "../screen/NotificationScreen";
import { DevisService } from "../services/DevisService";
import { TacheService } from "../services/TacheService";  

const Header = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const dropdownRef = useRef(null);

  const [showAlerts, setShowAlerts] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  // États pour les notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo({
          name: decoded.nom || decoded.name || "Utilisateur",
          email: decoded.email || "",
          avatar: decoded.avatar || null,
          matricule: decoded.matricule || "",
        });
      } catch (err) {
        console.error("Erreur de décodage du token :", err);
      }
    }
  }, []);

  const checkAlerts = async () => {
    try {
      const phases = await DevisService.getAllProjetsPhase();

      if (!phases || !Array.isArray(phases)) {
        console.error("Les données reçues ne sont pas un tableau:", phases);
        setAlertsCount(0);
        return;
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const alertsCount = phases.filter((phase) => {
        if (!phase || typeof phase !== 'object') {
          return false;
        }

        if (phase.date_fin_reelle === null || phase.date_fin_reelle === undefined) {
          if (phase.date_fin) {
            const dateFin = new Date(phase.date_fin);
            
            if (isNaN(dateFin.getTime())) {
              console.warn("Date invalide pour la phase:", phase);
              return false;
            }
            
            dateFin.setHours(23, 59, 59, 999);
            return dateFin < today;
          }
        }
        return false;
      }).length;

      console.log(`Nombre d'alertes trouvées: ${alertsCount}`);
      setAlertsCount(alertsCount);
    } catch (error) {
      console.error("Erreur lors de la récupération des alertes:", error);
      setAlertsCount(0);
    }
  };

  // Fonction pour vérifier les notifications
  const checkNotifications = async () => {
    try {
      if (!userInfo?.matricule) return;

      const notifications = await TacheService.get_user_notification(userInfo.matricule);

      if (!notifications || !Array.isArray(notifications)) {
        console.error("Les notifications reçues ne sont pas un tableau:", notifications);
        setNotificationsCount(0);
        return;
      }

      const now = new Date();
      
      // Filtrer les notifications non expirées
      const validNotifications = notifications.filter((notification) => {
        if (!notification || !notification.expire_at) {
          return false;
        }
        
        const expireDate = new Date(notification.expire_at);
        if (isNaN(expireDate.getTime())) {
          console.warn("Date d'expiration invalide pour la notification:", notification);
          return false;
        }
        
        return expireDate > now; // Notifications non expirées
      });

      console.log(`Nombre de notifications valides: ${validNotifications.length}`);
      setNotificationsCount(validNotifications.length);
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      setNotificationsCount(0);
    }
  };

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect pour les notifications
  useEffect(() => {
    if (userInfo?.matricule) {
      checkNotifications();
      // Actualiser toutes les 2 minutes
      const interval = setInterval(checkNotifications, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userInfo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("matricule");
      setShowProfileMenu(false);
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setShowProfileMenu(false);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  if (!userInfo) {
    return (
      <header className="container-header">
        <div>Chargement...</div>
      </header>
    );
  }

  return (
    <>
      <header className="container-header">
        <div className="navbar-header">
          <div
            className="navbar-item1 notification-icon alert-container"
            onClick={() => setShowAlerts(true)}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-exclamation-diamond-fill header-alert-icon"></i>
            {alertsCount > 0 && (
              <span className="alert-badge">
                {alertsCount > 99 ? "99+" : alertsCount}
              </span>
            )}
          </div>

          {/* Div pour les notifications */}
          <div 
            className="navbar-item1 notification-icon notification-container"
            onClick={() => setShowNotifications(true)}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-bell-fill header-bell-icon"></i>
            {notificationsCount > 0 && (
              <span className="alert-badge">
                {notificationsCount > 99 ? "99+" : notificationsCount}
              </span>
            )}
          </div>

          <div
            className="navbar-item1 header-profile-container"
            onClick={toggleProfileMenu}
            ref={dropdownRef}
            style={{ cursor: 'pointer' }}
          >
            <span className="header-profile-icon">
              <i className="bi bi-person-fill"></i>
            </span>

            {showProfileMenu && (
              <div className="header-profile-dropdown">
                <div className="header-profile-info">
                  <div className="header-profile-avatar">
                    {userInfo.avatar ? (
                      <img
                        src={userInfo.avatar}
                        alt="Avatar"
                        className="header-avatar-image"
                      />
                    ) : (
                      <i className="bi bi-person-circle header-default-avatar"></i>
                    )}
                  </div>
                  <div className="header-profile-details">
                    <h3 className="header-profile-name">{userInfo.name}</h3>
                    <p className="header-profile-email">{userInfo.email}</p>
                  </div>
                </div>

                <div className="header-profile-menu-items">
                  <button
                    className="header-menu-button header-password-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPasswordModal();
                    }}
                    type="button"
                  >
                    <i className="bi bi-key-fill header-key-icon"></i>
                    Changer le mot de passe
                  </button>

                  <button
                    className="header-menu-button header-logout-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    type="button"
                  >
                    <i className="bi bi-box-arrow-right header-logout-icon"></i>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <AlertScreen
        visible={showAlerts}
        onClose={() => setShowAlerts(false)}
        onRefresh={checkAlerts}
      />
      <NotificationScreen
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onRefresh={checkNotifications}
        matricule={userInfo.matricule}
      />
      <ModalUpdatePassword
        visible={showPasswordModal}
        onClose={closePasswordModal}
        matricule={userInfo.matricule}
      />
    </>
  );
};

export default Header;