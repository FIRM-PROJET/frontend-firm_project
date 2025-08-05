import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ModalUpdatePassword from "../modals/ModalUpdatePassword";
import "../styles/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const dropdownRef = useRef(null);

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
          {/* Div regroupant les icônes */}
          <div className="navbar-item1 notification-icon">
            <i className="bi bi-bell-fill header-bell-icon"></i>
          </div>

          <div
            className="navbar-item1 header-profile-container"
            onClick={toggleProfileMenu}
            ref={dropdownRef}
          >
            <span className="header-profile-icon">
              <i className="bi bi-person-fill"></i>
            </span>

            {showProfileMenu && (
              <div className="header-profile-dropdown">
                <div className="header-profile-info">
                  <div className="header-profile-avatar">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt="Avatar" className="header-avatar-image" />
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

      <ModalUpdatePassword
        visible={showPasswordModal}
        onClose={closePasswordModal}
        matricule={userInfo.matricule}
      />
    </>
  );
};

export default Header;