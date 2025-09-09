import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CryptoJS from 'crypto-js';
import ModalUpdatePassword from "../modals/ModalUpdatePassword";
import "../styles/Header.css";
import AlertScreen from "../screen/AlertScreen";
import NotificationScreen from "../screen/NotificationScreen";
import ProfileScreen from "../modals/ProfileScreen"; 
import { DevisService } from "../services/DevisService";
import { TacheService } from "../services/TacheService";

// Fonction pour générer l'URL Gravatar avec MD5 réel et gestion du cache
const generateGravatarUrl = (email, size = 40, forceRefresh = false) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  // Normaliser l'email : trim et lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Générer le hash MD5 réel
  const emailHash = CryptoJS.MD5(normalizedEmail).toString();
  
  // Paramètres Gravatar
  const params = new URLSearchParams({
    s: size.toString(),           // Taille de l'image
    d: 'identicon',              // Type d'image par défaut
    r: 'g',                      // Rating (g, pg, r, x)
  });
  
  // Ajouter un timestamp pour forcer le rafraîchissement du cache si nécessaire
  if (forceRefresh) {
    params.set('t', Date.now().toString());
  }
  
  return `https://www.gravatar.com/avatar/${emailHash}?${params.toString()}`;
};

const Header = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0); // Clé pour forcer le refresh

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

        // Debug : Vérifiez l'email et l'URL Gravatar générée
        const email = decoded.email;
        if (email) {
          const gravatarUrl = generateGravatarUrl(email, 40);
          // console.log("Email utilisateur:", email);
          // console.log("Hash MD5:", CryptoJS.MD5(email.trim().toLowerCase()).toString());
          // console.log("URL Gravatar générée:", gravatarUrl);
        }
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

  // Fonction pour forcer le rafraîchissement de l'avatar
  const refreshAvatar = () => {
    setAvatarRefreshKey(prev => prev + 1);
    // Optionnel: aussi vider le cache des images du navigateur
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('gravatar')) {
            caches.delete(name);
          }
        });
      });
    }
  };

  // Fonction améliorée pour obtenir l'URL de l'avatar
  const getAvatarUrl = (userInfo, forceRefresh = false) => {
    if (!userInfo) return null;
    
    // 1. Priorité à la photo de profil personnalisée si elle existe
    if (userInfo.profilePicture) {
      return userInfo.profilePicture;
    }
    
    // 2. Sinon, utiliser Gravatar basé sur l'email
    if (userInfo.email) {
      return generateGravatarUrl(userInfo.email, 35, forceRefresh || avatarRefreshKey > 0);
    }
    
    // 3. Pas d'avatar disponible
    return null;
  };

  // Composant pour l'affichage de l'avatar
  const AvatarDisplay = ({ userInfo, size = 33, className = "" }) => {
    const [imageError, setImageError] = useState(false);
    const [imageKey, setImageKey] = useState(0);
    
    // Reset l'erreur quand avatarRefreshKey change
    useEffect(() => {
      setImageError(false);
      setImageKey(prev => prev + 1);
    }, [avatarRefreshKey]);
    
    const avatarUrl = getAvatarUrl(userInfo, avatarRefreshKey > 0);
    const shouldShowImage = avatarUrl && !imageError;
    
    const handleImageError = () => {
      console.error("Erreur de chargement de l'avatar:", avatarUrl);
      setImageError(true);
    };
    
    const handleImageLoad = () => {
      // console.log("Avatar chargé avec succès:", avatarUrl);
      setImageError(false);
    };
    
    if (shouldShowImage) {
      return (
        <img
          key={`avatar-${imageKey}-${avatarRefreshKey}`} // Clé unique pour forcer le rechargement
          src={avatarUrl}
          alt="Avatar"
          className={`header-avatar-image-preview ${className}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          style={{ 
            width: `${size}px`, 
            height: `${size}px`, 
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      );
    }
    
    // Fallback vers avatar avec initiales
    return (
      <div 
        className={`header-default-avatar-preview ${className}`}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.4}px`,
          fontWeight: 'bold'
        }}
      >
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
        getAvatarUrl={(userInfo) => getAvatarUrl(userInfo, avatarRefreshKey > 0)} // Passer la fonction avec refresh
        onRefreshAvatar={refreshAvatar} // Nouvelle fonction pour forcer le refresh
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