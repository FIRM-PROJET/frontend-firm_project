import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ModalUpdatePassword from "../modals/ModalUpdatePassword";
import "../styles/Header.css";
import AlertScreen from "../screen/AlertScreen";
import { DevisService } from "../services/DevisService";

const Header = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const dropdownRef = useRef(null);

  const [showAlerts, setShowAlerts] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

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
      // Correction principale: ajout des parenthèses pour appeler la fonction
      const phases = await DevisService.getAllProjetsPhase();

      if (!phases || !Array.isArray(phases)) {
        console.error("Les données reçues ne sont pas un tableau:", phases);
        setAlertsCount(0);
        return;
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin de la journée actuelle

      const alertsCount = phases.filter((phase) => {
        // Vérification de la validité de l'objet phase
        if (!phase || typeof phase !== 'object') {
          return false;
        }

        // Si la phase n'est pas terminée (date_fin_reelle === null)
        if (phase.date_fin_reelle === null || phase.date_fin_reelle === undefined) {
          if (phase.date_fin) {
            const dateFin = new Date(phase.date_fin);
            
            // Vérification que la date est valide
            if (isNaN(dateFin.getTime())) {
              console.warn("Date invalide pour la phase:", phase);
              return false;
            }
            
            dateFin.setHours(23, 59, 59, 999); // Fin de la journée de deadline
            return dateFin < today; // Strictement inférieur pour compter les jours de retard
          }
        }
        return false;
      }).length;

      console.log(`Nombre d'alertes trouvées: ${alertsCount}`);
      setAlertsCount(alertsCount);
    } catch (error) {
      console.error("Erreur lors de la récupération des alertes:", error);
      setAlertsCount(0); // Réinitialiser en cas d'erreur
    }
  };

  useEffect(() => {
    checkAlerts();
    // Optionnel: actualiser toutes les 5 minutes
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

          {/* Div regroupant les icônes */}
          <div className="navbar-item1 notification-icon">
            <i className="bi bi-bell-fill header-bell-icon"></i>
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
      <ModalUpdatePassword
        visible={showPasswordModal}
        onClose={closePasswordModal}
        matricule={userInfo.matricule}
      />
    </>
  );
};

export default Header;