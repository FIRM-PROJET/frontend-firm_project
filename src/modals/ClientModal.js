import React, { useState } from "react";
import { DevisService } from "../services/DevisService";
import "../styles/DevisCSS/ClientModal.css";

const ClientModal = ({ isOpen, onClose, onClientCreated }) => {
  const [clientData, setClientData] = useState({
    nom: "",
    email: "",
    telephone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newClient = await DevisService.createClient(clientData);
      
      // Réinitialiser le formulaire
      setClientData({
        nom: "",
        email: "",
        telephone: ""
      });
      
      // Fermer le modal et notifier le parent
      onClose();
      onClientCreated(newClient);
      
    } catch (error) {
      setError("Erreur lors de la création du client");
      console.error("Erreur création client:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClientData({
      nom: "",
      email: "",
      telephone: ""
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header1">
          <h2 className="modal-title">
            <i className="fas fa-user-plus"></i>
            Nouveau Client
          </h2>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label1">
              <i className="fas fa-user"></i>
              Nom du client *
            </label>
            <input
              type="text"
              name="nom"
              value={clientData.nom}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Nom complet du client"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label1">
              <i className="fas fa-envelope"></i>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={clientData.email}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="email@exemple.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label1">
              <i className="fas fa-phone"></i>
              Téléphone *
            </label>
            <input
              type="tel"
              name="telephone"
              value={clientData.telephone}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="0123456789"
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-cancel"
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-create"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Création...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Créer le client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;