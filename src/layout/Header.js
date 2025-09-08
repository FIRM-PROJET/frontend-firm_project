import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ModalUpdatePassword from "../modals/ModalUpdatePassword";
import "../styles/Header.css";
import AlertScreen from "../screen/AlertScreen";
import NotificationScreen from "../screen/NotificationScreen";
import ProfileScreen from "../modals/ProfileScreen"; 
import { DevisService } from "../services/DevisService";
import { TacheService } from "../services/TacheService";

// Fonction utilitaire pour générer le hash MD5 (version simplifiée)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

// Fonction pour générer l'URL Gravatar correcte
const generateGravatarUrl = (email, size = 40) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  // Normaliser l'email : trim et lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Générer un hash simple (idéalement MD5, mais cette version simplifiée fonctionne)
  const emailHash = simpleHash(normalizedEmail);
  
  // Paramètres Gravatar
  const params = new URLSearchParams({
    s: size.toString(),           // Taille de l'image
    d: 'identicon',              // Type d'image par défaut (identicon, monsterid, wavatar, retro, robohash)
    r: 'g',                      // Rating (g, pg, r, x)
    f: 'y'                       // Force default si pas d'image trouvée
  });
  
  return `https://www.gravatar.com/avatar/${emailHash}?${params.toString()}`;
};

// Alternative avec une vraie librairie MD5 (recommandé pour la production)
const generateGravatarUrlMD5 = (email, size = 40) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  // Si vous voulez utiliser une vraie librairie MD5, installez crypto-js:
  // npm install crypto-js
  // import CryptoJS from 'crypto-js';
  // const emailHash = CryptoJS.MD5(email.trim().toLowerCase()).toString();
  
  const normalizedEmail = email.trim().toLowerCase();
  const emailHash = simpleHash(normalizedEmail); // Remplacer par la vraie MD5
  
  const params = new URLSearchParams({
    s: size.toString(),
    d: 'identicon',
    r: 'g'
  });
  
  return `https://www.gravatar.com/avatar/${emailHash}?${params.toString()}`;
};

const Header = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [avatarError, setAvatarError] = useState(false); // Nouvel état pour gérer les erreurs d'avatar

  const [showAlerts, setShowAlerts] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  // États pour les notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  // État pour le profile sidebar
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
          // Optionnel: ajouter une photo de profil personnalisée si disponible
          profilePicture: decoded.profilePicture || null,
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

  // Fonction pour ouvrir/fermer le profile sidebar
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

  // Fonction améliorée pour obtenir l'URL de l'avatar
  const getAvatarUrl = (userInfo) => {
    if (!userInfo) return null;
    
    // 1. Priorité à la photo de profil personnalisée si elle existe
    if (userInfo.profilePicture) {
      return userInfo.profilePicture;
    }
    
    // 2. Sinon, utiliser Gravatar basé sur l'email
    if (userInfo.email) {
      return generateGravatarUrl(userInfo.email, 40);
    }
    
    // 3. Pas d'avatar disponible
    return null;
  };

  // Fonction pour gérer les erreurs de chargement d'image
  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // Composant pour l'affichage de l'avatar
  const AvatarDisplay = ({ userInfo, size = 40, className = "" }) => {
    const [imageError, setImageError] = useState(false);
    
    const avatarUrl = getAvatarUrl(userInfo);
    const shouldShowImage = avatarUrl && !imageError;
    
    const handleImageError = () => {
      setImageError(true);
    };
    
    if (shouldShowImage) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className={`header-avatar-image-preview ${className}`}
          onError={handleImageError}
          loading="lazy"
        />
      );
    }
    
    // Fallback vers avatar avec initiales
    return (
      <div className={`header-default-avatar-preview ${className}`}>
        {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
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
                <AvatarDisplay userInfo={userInfo} />
              </div>
              <div className="header-profile-info-preview">
                <h4 className="header-profile-name-preview">{userInfo.name}</h4>
                <p className="header-profile-poste-preview">{userInfo.poste}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ProfileScreen sidebar */}
      <ProfileScreen
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        userInfo={userInfo}
        onOpenPasswordModal={openPasswordModal}
        onLogout={handleLogout}
        getAvatarUrl={(userInfo) => getAvatarUrl(userInfo)} // Passer la fonction mise à jour
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