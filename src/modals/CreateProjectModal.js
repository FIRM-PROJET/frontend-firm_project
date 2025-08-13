import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck, faBuilding, faPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import { DevisService } from "../services/DevisService";
import { ProjetService } from "../services/ProjetService";
import "../styles/ProjetCSS/CreateProjectModal.css";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nom_projet: "",
    description: "",
    id_client: ""
  });
  
  // États pour la gestion des clients
  const [clients, setClients] = useState([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        nom_projet: "",
        description: "",
        id_client: ""
      });
      setNewClientData({
        nom: "",
        email: "",
        telephone: "",
        adresse: ""
      });
      setError("");
      setShowCreateClient(false);
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

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setNewClientData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const validateClientForm = () => {
    if (!newClientData.nom.trim()) {
      setError("Le nom du client est requis");
      return false;
    }
    if (!newClientData.email.trim()) {
      setError("L'email du client est requis");
      return false;
    }
    if (!newClientData.telephone.trim()) {
      setError("Le téléphone du client est requis");
      return false;
    }
    return true;
  };

  const handleCreateClient = async () => {
    if (!validateClientForm()) return;

    setCreatingClient(true);
    setError("");

    try {
      const response = await DevisService.createClient(newClientData);
      
      if (response && response.success !== false) {
        // Client créé avec succès
        await fetchClients(); // Recharger la liste des clients
        
        // Sélectionner automatiquement le nouveau client
        const newClientId = response.data?.id_client || response.id_client;
        if (newClientId) {
          setFormData(prev => ({
            ...prev,
            id_client: newClientId
          }));
        }
        
        // Masquer le formulaire de création
        setShowCreateClient(false);
        
        // Reset du formulaire client
        setNewClientData({
          nom: "",
          email: "",
          telephone: "",
          adresse: ""
        });
        
      } else {
        setError(response?.message || "Erreur lors de la création du client");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la création du client");
    } finally {
      setCreatingClient(false);
    }
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
    if (!loading && !creatingClient) {
      onClose();
    }
  };

  const toggleCreateClient = () => {
    setShowCreateClient(!showCreateClient);
    setError("");
  };

  if (!isOpen) return null;

  return (
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
              disabled={loading || creatingClient}
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
                disabled={loading || creatingClient}
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
                disabled={loading || creatingClient}
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
                  onClick={toggleCreateClient}
                  disabled={loading || creatingClient}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Nouveau client
                </button>
              </div>
              
              {!showCreateClient ? (
                <select
                  name="id_client"
                  value={formData.id_client}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={loading || creatingClient || loadingClients}
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
              ) : (
                <div className="create-client-form">
                  <div className="create-client-header">
                    <FontAwesomeIcon icon={faUser} className="client-icon" />
                    <span>Créer un nouveau client</span>
                  </div>
                  
                  <div className="client-form-grid">
                    <div className="client-form-group">
                      <label className="client-form-label">
                        Nom du client <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={newClientData.nom}
                        onChange={handleClientInputChange}
                        className="client-form-input"
                        placeholder="Ex: HERMES International"
                        disabled={creatingClient}
                      />
                    </div>

                    <div className="client-form-group">
                      <label className="client-form-label">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newClientData.email}
                        onChange={handleClientInputChange}
                        className="client-form-input"
                        placeholder="contact@hermes.com"
                        disabled={creatingClient}
                      />
                    </div>

                    <div className="client-form-group">
                      <label className="client-form-label">
                        Téléphone <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        name="telephone"
                        value={newClientData.telephone}
                        onChange={handleClientInputChange}
                        className="client-form-input"
                        placeholder="+33 1 23 45 67 89"
                        disabled={creatingClient}
                      />
                    </div>

                    <div className="client-form-group client-form-group-full">
                      <label className="client-form-label">Adresse</label>
                      <input
                        type="text"
                        name="adresse"
                        value={newClientData.adresse}
                        onChange={handleClientInputChange}
                        className="client-form-input"
                        placeholder="24 rue du Faubourg Saint-Honoré, 75008 Paris"
                        disabled={creatingClient}
                      />
                    </div>
                  </div>

                  <div className="client-form-actions">
                    <button
                      type="button"
                      className="btn-cancel-client"
                      onClick={toggleCreateClient}
                      disabled={creatingClient}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn-create-client"
                      onClick={handleCreateClient}
                      disabled={creatingClient || !newClientData.nom.trim() || !newClientData.email.trim() || !newClientData.telephone.trim()}
                    >
                      {creatingClient ? (
                        <>
                          <div className="spinner"></div>
                          Création...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheck} />
                          Créer client
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="create-project-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={loading || creatingClient}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={loading || creatingClient || !formData.nom_projet.trim() || !formData.description.trim() || !formData.id_client.trim()}
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
  );
};

export default CreateProjectModal;