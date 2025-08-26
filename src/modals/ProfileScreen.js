import React, { useEffect } from 'react';
import '../styles/Header.css'; // Utilise le même fichier CSS

const ProfileScreen = ({ 
  visible, 
  onClose, 
  userInfo, 
  onOpenPasswordModal, 
  onLogout, 
  getAvatarUrl 
}) => {
  
  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && visible) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscapeKey);
      // Empêcher le scroll du body quand le sidebar est ouvert
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [visible, onClose]);

  // Fonction pour obtenir les jours de la semaine
  const getWeekDays = () => {
    const today = new Date();
    const days = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({
        date: day,
        isToday: day.toDateString() === today.toDateString(),
        dayName: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
        dayNumber: day.getDate()
      });
    }
    return days;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePasswordClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenPasswordModal();
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onLogout();
  };

  if (!visible) return null;

  const weekDays = getWeekDays();

  return (
    <div className="profile-screen-overlay" onClick={handleOverlayClick}>
      <div className="profile-screen-container">

        {/* Contenu du sidebar */}
        <div className="profile-screen-content">
          {/* Section informations profil */}
          <div className="profile-info-section">
            <div className="profile-avatar-large">
              {userInfo.avatar || getAvatarUrl(userInfo.email) ? (
                <img
                  src={userInfo.avatar || getAvatarUrl(userInfo.email)}
                  alt="Avatar"
                  className="profile-avatar-image-large"
                />
              ) : (
                <div className="profile-default-avatar-large">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="profile-details">
              <h3 className="profile-name">{userInfo.name}</h3>
              <p className="profile-email">{userInfo.email}</p>
              <p className="profile-poste">{userInfo.poste}</p>
            </div>
          </div>

          {/* Section calendrier */}
          <div className="profile-calendar-section">
            <h4 className="profile-calendar-title">
              <i className="bi bi-calendar-week"></i>
              Cette semaine
            </h4>
            <div className="profile-calendar-week">
              {weekDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`profile-calendar-day ${day.isToday ? 'today' : ''}`}
                  title={day.date.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                >
                  <div className="profile-day-name">{day.dayName}</div>
                  <div className="profile-day-number">{day.dayNumber}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section actions */}
          <div className="profile-actions-section">
            <button
              className="profile-action-button profile-password-button"
              onClick={handlePasswordClick}
              type="button"
            >
              <i className="bi bi-key-fill profile-button-icon"></i>
              Changer le mot de passe
            </button>

            <button
              className="profile-action-button profile-logout-button"
              onClick={handleLogoutClick}
              type="button"
            >
              <i className="bi bi-box-arrow-right profile-button-icon"></i>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;