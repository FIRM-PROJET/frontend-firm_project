import React, { useState, useEffect } from "react";
import "../styles/SubTaskModal.css";
import { TacheService } from "../services/TacheService";
import MessageModal from "./MessageModal";

const SubTaskModal = ({ isOpen, onClose, parentTask, onSubTaskCreated }) => {
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    date_debut: "",
    duree: "",
    id_unite_duree: "",
  });

  const [uniteDurees, setUniteDurees] = useState([]);
  const [isLoadingUnites, setIsLoadingUnites] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});

  // Modal pour les messages
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  useEffect(() => {
    if (isOpen) {
      loadUniteDurees();
      // Réinitialiser le formulaire
      setFormData({
        nom: "",
        description: "",
        date_debut: "",
        duree: "",
        id_unite_duree: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const loadUniteDurees = async () => {
    if (uniteDurees.length > 0) return;

    setIsLoadingUnites(true);
    try {
      const response = await TacheService.get_unite_duree();
      setUniteDurees(response);
    } catch (error) {
      console.error("Erreur lors du chargement des unités de durée:", error);
      setModalMessage("Erreur lors du chargement des unités de durée");
      setModalType("error");
      setIsMessageModalOpen(true);
    } finally {
      setIsLoadingUnites(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom de la sous-tâche est obligatoire";
    }

    if (!formData.date_debut) {
      newErrors.date_debut = "La date de début est obligatoire";
    }

    if (!formData.duree || formData.duree <= 0) {
      newErrors.duree = "La durée doit être supérieure à 0";
    }

    if (!formData.id_unite_duree) {
      newErrors.id_unite_duree = "L'unité de durée est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const subTaskData = {
        nom_sous_tache: formData.nom.trim(),
        description: formData.description.trim() || null,
        ref_tache: parentTask.ref_tache,
        date_debut: new Date(formData.date_debut).toISOString().split("T")[0],
        duree: parseInt(formData.duree),
        id_unite_duree: parseInt(formData.id_unite_duree),
      };
      await TacheService.createSousTache(subTaskData);
      
      setModalMessage("Sous-tâche créée avec succès !");
      setModalType("success");
      setIsMessageModalOpen(true);

      // Attendre un peu avant de fermer pour que l'utilisateur voie le message
      setTimeout(() => {
        onSubTaskCreated();
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la création de la sous-tâche:", error);
      setModalMessage("Erreur lors de la création de la sous-tâche");
      setModalType("error");
      setIsMessageModalOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="subtask-modal-overlay" onClick={handleClose}>
      <div
        className="subtask-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="subtask-form">
          {/* Header */}
          <div className="subtask-modal-header">
            <div className="subtask-modal-title">
              <i className="bi bi-plus-square-fill"></i>
              <h2>Nouvelle sous-tâche</h2>
            </div>
            <button
              type="button"
              className="subtask-modal-close-btn"
              onClick={handleClose}
              disabled={isCreating}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div className="subtask-modal-body">
            {/* Informations sur la tâche parent */}
            <div className="parent-task-info">
              <div className="parent-task-label">
                <i className="bi bi-arrow-up-right"></i>
                Tâche parent
              </div>
              <div className="parent-task-name">{parentTask.nom_tache}</div>
            </div>

            {/* Formulaire */}
            <div className="subtask-form-fields">
              {/* Nom de la sous-tâche */}
              <div className="form-group">
                <label htmlFor="subtask-name" className="form-label required">
                  <i className="bi bi-tag-fill"></i>
                  Nom de la sous-tâche
                </label>
                <input
                  id="subtask-name"
                  type="text"
                  className={`form-input ${errors.nom ? "error" : ""}`}
                  value={formData.nom}
                  onChange={(e) => handleInputChange("nom", e.target.value)}
                  placeholder="Entrez le nom de la sous-tâche"
                  maxLength={255}
                  disabled={isCreating}
                />
                {errors.nom && (
                  <div className="form-error">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {errors.nom}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="subtask-description" className="form-label">
                  <i className="bi bi-card-text"></i>
                  Description
                </label>
                <textarea
                  id="subtask-description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Description optionnelle de la sous-tâche"
                  rows={4}
                  disabled={isCreating}
                />
              </div>

              {/* Date de début */}
              <div className="form-group">
                <label
                  htmlFor="subtask-date-debut"
                  className="form-label required"
                >
                  <i className="bi bi-calendar-event"></i>
                  Date de début
                </label>
                <input
                  id="subtask-date-debut"
                  type="date"
                  className={`form-input ${errors.date_debut ? "error" : ""}`}
                  value={formData.date_debut}
                  onChange={(e) =>
                    handleInputChange("date_debut", e.target.value)
                  }
                  disabled={isCreating}
                />
                {errors.date_debut && (
                  <div className="form-error">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {errors.date_debut}
                  </div>
                )}
              </div>

              {/* Durée et unité */}
              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label
                    htmlFor="subtask-duree"
                    className="form-label required"
                  >
                    <i className="bi bi-clock"></i>
                    Durée
                  </label>
                  <input
                    id="subtask-duree"
                    type="number"
                    className={`form-input ${errors.duree ? "error" : ""}`}
                    value={formData.duree}
                    onChange={(e) => handleInputChange("duree", e.target.value)}
                    placeholder="Ex: 5"
                    min="1"
                    disabled={isCreating}
                  />
                  {errors.duree && (
                    <div className="form-error">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {errors.duree}
                    </div>
                  )}
                </div>

                <div className="form-group flex-1">
                  <label
                    htmlFor="subtask-unite"
                    className="form-label required"
                  >
                    <i className="bi bi-speedometer2"></i>
                    Unité
                  </label>
                  <select
                    id="subtask-unite"
                    className={`form-select ${
                      errors.id_unite_duree ? "error" : ""
                    }`}
                    value={formData.id_unite_duree?.toString() || ""}
                    onChange={(e) =>
                      handleInputChange("id_unite_duree", e.target.value)
                    }
                    disabled={isCreating || isLoadingUnites}
                  >
                    <option value="">
                      {isLoadingUnites
                        ? "Chargement..."
                        : "Sélectionner une unité"}
                    </option>
                    {uniteDurees.map((unite) => (
                      <option
                        key={`unite-${unite.id_unite_duree}`}
                        value={unite.id_unite_duree.toString()}
                      >
                        {unite.nom_unite}
                      </option>
                    ))}
                  </select>

                  {errors.id_unite_duree && (
                    <div className="form-error">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {errors.id_unite_duree}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="subtask-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={isCreating}
            >
              <i className="bi bi-x-lg"></i>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={isCreating || isLoadingUnites}
            >
              {isCreating ? (
                <>
                  <i className="bi bi-arrow-clockwise spin"></i>
                  Création en cours...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>
                  Créer la sous-tâche
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Message Modal */}
      {isMessageModalOpen && (
        <MessageModal
          message={modalMessage}
          type={modalType}
          onClose={() => setIsMessageModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SubTaskModal;
