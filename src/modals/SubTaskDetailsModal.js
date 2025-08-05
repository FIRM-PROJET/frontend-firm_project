import React, { useState, useEffect } from "react";
import { TacheService } from "../services/TacheService";
import MessageModal from "./MessageModal";
import "../styles/SubTaskDetailsModal.css";

const SubTaskDetailsModal = ({ subTaskRef, isOpen, onClose, onStatusUpdate }) => {
  const [subTaskDetails, setSubTaskDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && subTaskRef) {
      loadSubTaskDetails();
    }
  }, [isOpen, subTaskRef]);

  const loadSubTaskDetails = async () => {
    setIsLoading(true);
    try {
      const response = await TacheService.getSousTacheDetails(subTaskRef);
      if (response && response.length > 0) {
        setSubTaskDetails(response[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      setModalMessage("Erreur lors du chargement des détails de la sous-tâche");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubTaskStatus = async (newStatus) => {
    setIsUpdatingStatus(true);
    setShowStatusDropdown(false);

    try {
      const updateData = {
        ref_tache: null,
        ref_sous_tache: subTaskDetails.ref_sous_tache,
      };

      if (newStatus === "Terminé") {
        await TacheService.UpdateSousTacheTermine(updateData);
      } else if (newStatus === "En cours") {
        await TacheService.UpdateSousTacheEnCours(updateData);
      }

      setModalMessage("Statut mis à jour avec succès !");
      setModalType("success");
      setIsModalOpen(true);

      // Recharger les détails
      await loadSubTaskDetails();
      
      // Notifier le parent pour refresh
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setModalMessage("Erreur lors de la mise à jour du statut");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case "Non démarré":
        return "#6b7280";
      case "En cours":
        return "#fbbf24";
      case "Terminé":
        return "#10b981";
      default:
        return "#ccc";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getAvailableStatuses = () => {
    if (!subTaskDetails) return [];
    const currentStatus = subTaskDetails.statut;
    const allStatuses = ["Non démarré", "En cours", "Terminé"];
    return allStatuses.filter(
      (status) => status !== currentStatus && status !== "Non démarré"
    );
  };

  if (!isOpen) return null;

  return (
    <div className="subtask-details-overlay" onClick={onClose}>
      <div
        className="subtask-details-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="subtask-details-header">
          <div className="subtask-header-title">
            <h2>
              <i className="bi bi-list-task"></i>
              Détails de la sous-tâche
            </h2>
          </div>
          
          {/* Bouton de changement de statut */}
          {subTaskDetails && (
            <div className="subtask-status-container">
              <button
                className="btn-subtask-status"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isUpdatingStatus}
              >
                <span
                  className="status-dot"
                  style={{ backgroundColor: getStatusColor(subTaskDetails.statut) }}
                ></span>
                <span className="status-text">{subTaskDetails.statut}</span>
                <i className="bi bi-chevron-down"></i>
              </button>

              {showStatusDropdown && (
                <div className="subtask-status-dropdown">
                  {getAvailableStatuses().map((status) => (
                    <button
                      key={status}
                      className="subtask-status-dropdown-item"
                      onClick={() => updateSubTaskStatus(status)}
                    >
                      <span
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(status) }}
                      ></span>
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="subtask-details-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </header>

        {/* Body */}
        <div className="subtask-details-body">
          {isLoading ? (
            <div className="subtask-loading">
              <i className="bi bi-arrow-clockwise spin"></i>
              <span>Chargement des détails...</span>
            </div>
          ) : subTaskDetails ? (
            <>
              {/* Titre de la sous-tâche */}
              <div className="subtask-title-section">
                <h1 className="subtask-title">{subTaskDetails.nom_sous_tache}</h1>
                <span className="subtask-ref">#{subTaskDetails.ref_sous_tache}</span>
              </div>

              {/* Informations principales */}
              <div className="subtask-info-grid">
                <div className="subtask-info-item">
                  <label>
                    <i className="bi bi-flag-fill"></i>
                    Statut
                  </label>
                  <div className="subtask-status-display">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(subTaskDetails.statut) }}
                    ></span>
                    <span>{subTaskDetails.statut}</span>
                  </div>
                </div>

                <div className="subtask-info-item">
                  <label>
                    <i className="bi bi-calendar-event"></i>
                    Date de début
                  </label>
                  <span>{formatDate(subTaskDetails.date_debut)}</span>
                </div>

                <div className="subtask-info-item">
                  <label>
                    <i className="bi bi-calendar-check"></i>
                    Date de fin prévue
                  </label>
                  <span>{formatDate(subTaskDetails.date_fin_prevu)}</span>
                </div>

                <div className="subtask-info-item">
                  <label>
                    <i className="bi bi-clock"></i>
                    Durée
                  </label>
                  <span>{subTaskDetails.duree} {subTaskDetails.nom_unite}(s)</span>
                </div>

                <div className="subtask-info-item">
                  <label>
                    <i className="bi bi-calendar-x"></i>
                    Date de fin réelle
                  </label>
                  <span>
                    {subTaskDetails.date_fin_reelle 
                      ? formatDate(subTaskDetails.date_fin_reelle)
                      : "Non terminée"
                    }
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="subtask-description-section">
                <h3>
                  <i className="bi bi-card-text"></i>
                  Description
                </h3>
                <div className="subtask-description">
                  {subTaskDetails.description || "Aucune description fournie."}
                </div>
              </div>

              {/* Utilisateurs assignés */}
              <div className="subtask-users-section">
                <h3>
                  <i className="bi bi-people-fill"></i>
                  Utilisateurs assignés
                </h3>
                <div className="subtask-users-list">
                  {subTaskDetails.utilisateurs && subTaskDetails.utilisateurs.length > 0 ? (
                    subTaskDetails.utilisateurs.map((user, index) => (
                      <div key={index} className="subtask-user-item">
                        <div className="subtask-user-avatar">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div className="subtask-user-info">
                          <span className="subtask-user-name">
                            {user.nom} {user.prenom}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-users-assigned">
                      <i className="bi bi-person-x"></i>
                      <span>Aucun utilisateur assigné</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="subtask-error">
              <i className="bi bi-exclamation-triangle"></i>
              <span>Impossible de charger les détails de la sous-tâche</span>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {isModalOpen && (
        <MessageModal
          message={modalMessage}
          type={modalType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SubTaskDetailsModal;