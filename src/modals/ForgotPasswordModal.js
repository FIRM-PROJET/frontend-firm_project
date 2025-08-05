import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faKey, faTimes } from '@fortawesome/free-solid-svg-icons';
import { UtilisateurService } from '../services/UtilisateurService';
import "../styles/ForgotPasswordModal.css";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userMatricule, setUserMatricule] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const checkUserByEmail = async (email) => {
    try {
      const data = await UtilisateurService.get_user_by_mail(email);
      return data.length > 0 ? data[0] : null;
      
    } catch {
      throw new Error('Aucun utilisateur ne correspond à votre email');
    }
  };

  const sendResetCode = async (email, code) => {
    console.log(`Code envoyé à ${email} : ${code}`);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const generateResetCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await checkUserByEmail(email);
      if (user) {
        const resetCode = generateResetCode();
        setGeneratedCode(resetCode);
        setUserMatricule(user.matricule);
        await sendResetCode(email, resetCode);
        setSuccess('Un code de vérification a été envoyé à votre email');
        setStep(2);
      } else {
        setError('Aucun utilisateur trouvé avec cet email');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (code === generatedCode) {
      setSuccess('Code validé');
      setStep(3);
    } else {
      setError('Code incorrect');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      await UtilisateurService.updatePassword(userMatricule, newPassword);
      setSuccess('Mot de passe mis à jour');
      setTimeout(() => {
        resetModal();
        onClose();
      }, 2000);
    } catch {
      setError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setUserMatricule('');
    setGeneratedCode('');
  };

  const resendCode = async () => {
    setLoading(true);
    try {
      const newCode = generateResetCode();
      setGeneratedCode(newCode);
      await sendResetCode(email, newCode);
      setSuccess('Code renvoyé');
    } catch {
      setError('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h2 className="modal-title">
          {step === 1 ? 'Mot de passe oublié' : step === 2 ? 'Code de vérification' : 'Nouveau mot de passe'}
        </h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                required
              />
            </div>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCodeSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="input-field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code reçu"
                required
              />
            </div>
            <button className="primary-button" type="submit">
              Vérifier
            </button>
            <button type="button" onClick={resendCode} className="secondary-button">
              Renvoyer le code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez le mot de passe"
                minLength={6}
                required
              />
            </div>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;