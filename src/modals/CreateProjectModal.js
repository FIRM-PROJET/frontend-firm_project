import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck, faBuilding, faPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import { DevisService } from "../services/DevisService";
import { ProjetService } from "../services/ProjetService";
import ClientModal from "./ClientModal"; 
import "../styles/ProjetCSS/CreateProjectModal.css";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nom_projet: "",
    description: "",
    id_client: ""
  });
  
  // États pour la gestion des clients
  const [clients, setClients] = useState([]);
  const [clientModalOpen, setClientModalOpen] = useState(false); // État pour contrôler ClientModal
  
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        nom_projet: "",
        description: "",
        id_client: ""
      });
      setError("");
      setClientModalOpen(false);
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await DevisService.getClients();
      if (response && response.success !== false) {
        setClients(response.data || response || []);
      } else {
        console.error("Erreur lors du chargement des clients:", response);
        setClients([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des clients:", err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.nom_projet.trim()) {
      setError("Le nom du projet est requis");
      return false;
    }
    if (!formData.description.trim()) {
      setError("La description est requise");
      return false;
    }
    if (!formData.id_client.trim()) {
      setError("Veuillez sélectionner un client");
      return false;
    }
    return true;
  };

  // Gestionnaire pour l'ouverture du ClientModal
  const handleOpenClientModal = () => {
    setClientModalOpen(true);
  };

  // Gestionnaire pour la fermeture du ClientModal
  const handleCloseClientModal = () => {
    setClientModalOpen(false);
  };

  // Gestionnaire appelé après la création d'un client
  const handleClientCreated = async (newClient) => {
    // Recharger la liste des clients
    await fetchClients();
    
    // Sélectionner automatiquement le nouveau client
    if (newClient && (newClient.id_client || newClient.id)) {
      setFormData(prev => ({
        ...prev,
        id_client: newClient.id_client || newClient.id
      }));
    }
    
    // Fermer le modal client
    setClientModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await ProjetService.createProject(formData);
      
      if (response && response.success !== false) {
        onClose();
      } else {
        setError(response?.message || "Erreur lors de la création du projet");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="create-project-modal-backdrop">
        <div className="create-project-modal-wrapper">
          <form onSubmit={handleSubmit}>
            <div className="create-project-modal-header">
              <div className="modal-title-section">
                <FontAwesomeIcon icon={faBuilding} className="modal-icon" />
                <h3 className="create-project-modal-title">Créer un nouveau projet</h3>
              </div>
              <button
                type="button"
                className="create-project-modal-close"
                onClick={handleClose}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="create-project-modal-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Nom du projet <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="nom_projet"
                  value={formData.nom_projet}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: Construction Siège HERMES"
                  disabled={loading}
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Description détaillée du projet..."
                  disabled={loading}
                  rows={4}
                  maxLength={1000}
                />
                <div className="char-counter">
                  {formData.description.length}/1000
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-with-button">
                  <label className="form-label">
                    Client <span className="required">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-add-client"
                    onClick={handleOpenClientModal}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Nouveau client
                  </button>
                </div>
                
                <select
                  name="id_client"
                  value={formData.id_client}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={loading || loadingClients}
                >
                  <option value="">
                    {loadingClients ? "Chargement des clients..." : "Sélectionner un client"}
                  </option>
                  {clients.map(client => (
                    <option key={client.id_client} value={client.id_client}>
                      {client.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="create-project-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-create"
                disabled={loading || !formData.nom_projet.trim() || !formData.description.trim() || !formData.id_client.trim()}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    Créer le projet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ClientModal intégré */}
      <ClientModal
        isOpen={clientModalOpen}
        onClose={handleCloseClientModal}
        onClientCreated={handleClientCreated}
      />
    </>
  );
};

export default CreateProjectModal;