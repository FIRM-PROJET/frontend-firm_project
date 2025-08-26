import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ModalUpdatePassword from "../modals/ModalUpdatePassword";
import "../styles/Header.css";
import AlertScreen from "../screen/AlertScreen";
import NotificationScreen from "../screen/NotificationScreen";
import ProfileScreen from "../modals/ProfileScreen"; // Nouveau import
import { DevisService } from "../services/DevisService";
import { TacheService } from "../services/TacheService";  

const Header = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const [showAlerts, setShowAlerts] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  // États pour les notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  // NOUVEAU: État pour le profile sidebar
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo({
          name: decoded.nom || decoded.name || "Utilisateur",
          email: decoded.email || "",
          matricule: decoded.matricule || "",
          poste: decoded.intitule_poste,
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
        setHasAlerts(false);
        return;
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const alertsExist = phases.some((phase) => {
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
      });

      setHasAlerts(alertsExist);
    } catch (error) {
      console.error("Erreur lors de la récupération des alertes:", error);
      setHasAlerts(false);
    }
  };

  // Fonction pour vérifier les notifications
  const checkNotifications = async () => {
    try {
      if (!userInfo?.matricule) return;

      const notifications = await TacheService.get_user_notification(userInfo.matricule);

      if (!notifications || !Array.isArray(notifications)) {
        console.error("Les notifications reçues ne sont pas un tableau:", notifications);
        setHasNotifications(false);
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

      setHasNotifications(validNotifications.length > 0);
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      setHasNotifications(false);
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

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("matricule");
      setShowProfile(false); // Fermer le profile sidebar
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // NOUVEAU: Fonction pour ouvrir/fermer le profile sidebar
  const toggleProfileSidebar = () => {
    setShowProfile(!showProfile);
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setShowProfile(false); // Fermer le profile sidebar
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  // Fonction pour générer l'avatar à partir de l'email
  const getAvatarUrl = (email) => {
    if (!email) return null;
    // Utiliser Gravatar comme service d'avatar basé sur l'email
    const emailHash = btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=40`;
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
            {hasAlerts && <div className="notification-dot alert-dot"></div>}
          </div>

          <div 
            className="navbar-item1 notification-icon notification-container"
            onClick={() => setShowNotifications(true)}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-bell-fill header-bell-icon"></i>
            {hasNotifications && <div className="notification-dot notification-dot-item"></div>}
          </div>

          <div
            className="navbar-item1 header-profile-container"
            onClick={toggleProfileSidebar}
            style={{ cursor: 'pointer' }}
          >
            <div className="header-profile-preview">
              <div className="header-profile-avatar-preview">
                {getAvatarUrl(userInfo.email) ? (
                  <img
                    src={getAvatarUrl(userInfo.email)}
                    alt="Avatar"
                    className="header-avatar-image-preview"
                  />
                ) : (
                  <div className="header-default-avatar-preview">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="header-profile-info-preview">
                <h4 className="header-profile-name-preview">{userInfo.name}</h4>
                <p className="header-profile-poste-preview">{userInfo.poste}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* NOUVEAU: ProfileScreen sidebar */}
      <ProfileScreen
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        userInfo={userInfo}
        onOpenPasswordModal={openPasswordModal}
        onLogout={handleLogout}
        getAvatarUrl={getAvatarUrl}
      />

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