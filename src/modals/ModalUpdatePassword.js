import React, { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { UtilisateurService } from "../services/UtilisateurService";
import "../styles/PasswordModal.css"; 

const ModalUpdatePassword = ({ visible, onClose, matricule }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setError('');
  };

  const validatePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword) return setError("Mot de passe actuel requis");
    if (!newPassword) return setError("Nouveau mot de passe requis");
    if (currentPassword === newPassword) return setError("Le nouveau mot de passe doit être différent");
    if (newPassword !== confirmPassword) return setError("Les mots de passe ne correspondent pas");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const isValid = await UtilisateurService.checkCurrentPassword(matricule, passwordData.currentPassword);
      if (!isValid) {
        setError("Mot de passe actuel incorrect");
        return;
      }

      const result = await UtilisateurService.updatePassword(matricule, passwordData.newPassword);
      if (result) {
        setSuccess("Mot de passe modifié avec succès !");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError("Erreur lors du changement de mot de passe");
      }
    } catch (err) {
      console.error("Erreur : ", err);
      setError("Erreur de communication avec le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay" onClick={onClose}>
      <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="password-modal-header">
          <h3>Changer le mot de passe</h3>
          <button onClick={onClose} className="close-modal-btn" type="button"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {error && <div className="password-error-message">{error}</div>}
          {success && <div className="password-success-message">{success}</div>}

          {["current", "new", "confirm"].map((field, i) => (
            <div className="password-input-group" key={field}>
              <label>
                {field === "current"
                  ? "Mot de passe actuel"
                  : field === "new"
                  ? "Nouveau mot de passe"
                  : "Confirmer le nouveau mot de passe"}
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword[field] ? "text" : "password"}
                  name={
                    field === "current"
                      ? "currentPassword"
                      : field === "new"
                      ? "newPassword"
                      : "confirmPassword"
                  }
                  value={passwordData[field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmPassword"]}
                  onChange={handlePasswordChange}
                  required
                />
                <button type="button" className="password-toggle-btn" onClick={() =>
                  setShowPassword({ ...showPassword, [field]: !showPassword[field] })}>
                  {showPassword[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}

          <div className="password-modal-actions">
            <button type="button" onClick={onClose} disabled={loading} className="cancel-password-btn">Annuler</button>
            <button type="submit" disabled={loading} className="save-password-btn">
              {loading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalUpdatePassword;
