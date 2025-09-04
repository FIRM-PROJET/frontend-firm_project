import React, { useState, useEffect } from "react";
import { ProjetService } from "../../services/ProjetService";
import { UtilisateurService } from "../../services/UtilisateurService";
import { ModuleService } from "../../services/ModuleService";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faCalendarAlt,
  faTimes,
  faCheck,
  faUserPlus,
  faUsers,
  faEdit,
  faUserMinus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from "jwt-decode";
import "../../styles/ProjetCSS/ProjetsPhases.css";

const ProjectPhasesScreen = ({ refProjet = "", onBack }) => {
  const [allPhases, setAllPhases] = useState([]);
  const [projectPhases, setProjectPhases] = useState([]);
  const [phaseUsers, setPhaseUsers] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showFinReelleModal, setShowFinReelleModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [modalType, setModalType] = useState("add");
  const [userInfo, setUserInfo] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    date_debut: "",
    date_fin: "",
  });
  const [userFormData, setUserFormData] = useState({
    matricule: "",
  });
  const [finReelleFormData, setFinReelleFormData] = useState({
    date_fin_reelle: "",
  });

  useEffect(() => {
    initializeUser();
    fetchData();
    fetchAvailableUsers();
  }, []);

  const initializeUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userInfoData = {
          name: decoded.nom || decoded.name || "Utilisateur",
          email: decoded.email || "",
          avatar: decoded.avatar || null,
          matricule: decoded.matricule || "",
        };
        setUserInfo(userInfoData);

        // Vérifier si l'utilisateur est admin
        if (userInfoData.matricule) {
          const adminResponse = await ModuleService.isUserAdmin(userInfoData.matricule);
          setIsAdmin(adminResponse.isAdmin === true);
        }
      } catch (err) {
        console.error("Erreur de décodage du token :", err);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupérer toutes les phases disponibles
      const allPhasesResponse = await ProjetService.getAllPhases();
      if (allPhasesResponse.success) {
        setAllPhases(allPhasesResponse.data || []);
      }

      // Récupérer les phases du projet
      const projectPhasesResponse = await ProjetService.getPhasesByProject(
        refProjet
      );
      if (projectPhasesResponse.success) {
        setProjectPhases(projectPhasesResponse.data || []);

        const usersData = {};
        for (const phase of projectPhasesResponse.data || []) {
          try {
            const usersResponse = await ProjetService.getUsersByPhase({
              ref_projet: refProjet,
              id_phase: phase.id_phase,
            });
            if (usersResponse.success) {
              usersData[phase.id_phase] = usersResponse.data || [];
            }
          } catch (err) {
            console.error(
              `Erreur lors du chargement des utilisateurs pour la phase ${phase.id_phase}:`,
              err
            );
            usersData[phase.id_phase] = [];
          }
        }
        setPhaseUsers(usersData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await UtilisateurService.getAllUtilisateurs();
      setAvailableUsers(response || []);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des utilisateurs disponibles:",
        err
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  const handleAddPhase = (phase) => {
    setSelectedPhase(phase);
    setFormData({ date_debut: "", date_fin: "" });
    setModalType("add");
    setShowModal(true);
  };

  const handleEditPhase = (phase) => {
    setSelectedPhase(phase);
    const projectPhaseData = getProjectPhaseData(phase);
    setFormData({
      date_debut: projectPhaseData?.date_debut || "",
      date_fin: projectPhaseData?.date_fin || "",
    });
    setModalType("edit");
    setShowModal(true);
  };

  const handleDeletePhase = async (phase) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la phase "${phase.libelle_phase}" de ce projet ?`)) {
      return;
    }

    try {
      const response = await ProjetService.deleteProjectPhase(refProjet, phase.id_phase);
      if (response.message) {
        await fetchData();
      } else {
        setError("Erreur lors de la suppression de la phase");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleManageUsers = (phase) => {
    setSelectedPhase(phase);
    setUserFormData({ matricule: "" });
    setModalType("users");
    setShowUsersModal(true);
  };

  const handleSetFinReelle = (phase) => {
    setSelectedPhase(phase);
    const projectPhaseData = getProjectPhaseData(phase);
    setFinReelleFormData({
      date_fin_reelle: projectPhaseData?.date_fin_reelle || "",
    });
    setShowFinReelleModal(true);
  };

  const handleSavePhase = async () => {
    try {
      const phaseData = {
        ref_projet: refProjet,
        id_phase: selectedPhase.id_phase,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
      };

      let response;
      if (modalType === "add") {
        response = await ProjetService.createProjectPhase(phaseData);
      } else if (modalType === "edit") {
        response = await ProjetService.updateProjectPhase(phaseData);
      }

      if (response) {
        setShowModal(false);
        await fetchData();
      } else {
        setError(`Erreur lors de la ${modalType === "add" ? "création" : "modification"} de la phase`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveFinReelle = async () => {
    try {
      const finReelleData = {
        ref_projet: refProjet,
        id_phase: selectedPhase.id_phase,
        date_fin_reelle: finReelleFormData.date_fin_reelle,
      };

      const response = await ProjetService.updateProjectFinReelle(finReelleData);
      if (response) {
        setShowFinReelleModal(false);
        await fetchData();
      } else {
        setError("Erreur lors de la mise à jour de la date fin réelle");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddUser = async () => {
    if (!isAdmin) return;

    try {
      const userData = {
        ref_projet: refProjet,
        id_phase: selectedPhase.id_phase,
        matricule: userFormData.matricule,
      };

      const response = await ProjetService.assignUserToPhase(userData);
      if (response.success) {
        setUserFormData({ matricule: "" });
        await fetchData();
      } else {
        setError("Erreur lors de l'ajout de l'utilisateur");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveUser = async (user) => {
    if (!isAdmin) return;

    try {
      const userData = {
        ref_projet: refProjet,
        id_phase: selectedPhase.id_phase,
        matricule: user.matricule,
      };

      const response = await ProjetService.removeUserFromPhase(userData);
      if (response.success) {
        await fetchData();
      } else {
        setError("Erreur lors de la suppression de l'utilisateur");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getPhaseStatus = (phase) => {
    const projectPhase = projectPhases.find(
      (pp) => pp.id_phase === phase.id_phase
    );
    return projectPhase ? "assigned" : "available";
  };

  const getProjectPhaseData = (phase) => {
    return projectPhases.find((pp) => pp.id_phase === phase.id_phase);
  };

  const isPhaseCompleted = (phase) => {
    const projectPhaseData = getProjectPhaseData(phase);
    return projectPhaseData?.date_fin_reelle !== null && projectPhaseData?.date_fin_reelle !== undefined;
  };

  if (loading) return <div className="dark-modal-loading">Chargement des phases...</div>;
  if (error) return <div className="dark-modal-error">{error}</div>;

  return (
    <div className="project-phases-container">
      {/* Header */}
      <div className="phases-header">
        <button className="back-button1" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Retour
        </button>
        <h1 className="phases-title">Phases du Projet {refProjet}</h1>
        {!isAdmin && (
          <div className="user-role-indicator">
            <span>Accès limité (Voir uniquement)</span>
          </div>
        )}
      </div>

      {/* Grille des phases */}
      <div className="phases-grid">
        {allPhases.map((phase) => {
          const status = getPhaseStatus(phase);
          const projectPhaseData = getProjectPhaseData(phase);
          const users = phaseUsers[phase.id_phase] || [];

          return (
            <div key={phase.id_phase} className={`phase-card ${status} ${isPhaseCompleted(phase) ? 'completed' : ''}`}>
              <div className="phase-card-header">
                <div className="phase-info">
                  <h3 className="phase-libelle">{phase.libelle_phase}</h3>
                  <p className="phase-description">{phase.description}</p>
                </div>

                {status === "available" ? (
                  isAdmin && (
                    <button
                      className="manage-users-btn"
                      onClick={() => handleAddPhase(phase)}
                      title="Ajouter cette phase au projet"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  )
                ) : (
                  <div className="phase-actions">
                    <button
                      className="manage-users-btn"
                      onClick={() => handleManageUsers(phase)}
                      title={isAdmin ? "Gérer l'équipe" : "Voir l'équipe"}
                    >
                      <FontAwesomeIcon icon={isAdmin ? faUserPlus : faUsers} />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          className="manage-users-btn"
                          onClick={() => handleEditPhase(phase)}
                          title="Modifier la phase"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className={`manage-users-btn ${isPhaseCompleted(phase) ? 'completed-phase' : ''}`}
                          onClick={() => handleSetFinReelle(phase)}
                          title={isPhaseCompleted(phase) ? "Modifier la date fin réelle" : "Marquer comme terminée"}
                        >
                          <FontAwesomeIcon icon={isPhaseCompleted(phase) ? faCheck : faCalendarAlt} />
                        </button>
                        <button
                          className="manage-users-btn delete-btn"
                          onClick={() => handleDeletePhase(phase)}
                          title="Supprimer la phase du projet"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {status === "assigned" && projectPhaseData && (
                <div className="phase-details">
                  <div className="phase-dates">
                    <div className="date-item">
                      <FontAwesomeIcon
                        icon={faCalendarAlt}
                        className="date-icon"
                      />
                      <span className="date-label">Début:</span>
                      <span className="date-value">
                        {formatDate(projectPhaseData.date_debut)}
                      </span>
                    </div>
                    <div className="date-item">
                      <FontAwesomeIcon
                        icon={faCalendarAlt}
                        className="date-icon"
                      />
                      <span className="date-label">Fin prévue:</span>
                      <span className="date-value">
                        {formatDate(projectPhaseData.date_fin)}
                      </span>
                    </div>
                    {projectPhaseData.date_fin_reelle && (
                      <div className="date-item date-fin-reelle">
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="date-icon completed"
                        />
                        <span className="date-label">Fin réelle:</span>
                        <span className="date-value completed">
                          {formatDate(projectPhaseData.date_fin_reelle)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="phase-users">
                    <div className="users-header">
                      <h4 className="users-title">
                        <FontAwesomeIcon icon={faUsers} />
                        Équipe ({users.length})
                      </h4>
                      <button
                        className="add-user-btn"
                        onClick={() => handleManageUsers(phase)}
                        title={isAdmin ? "Gérer l'équipe" : "Voir l'équipe"}
                      >
                        <FontAwesomeIcon icon={isAdmin ? faEdit : faUsers} />
                      </button>
                    </div>

                    {users.length > 0 ? (
                      <div className="users-list">
                        {users.slice(0, 2).map((user) => (
                          <div key={user.matricule} className="user-item">
                            <div className="user-avatar">
                              {user.prenom.charAt(0)}
                              {user.nom.charAt(0)}
                            </div>
                            <div className="user-info">
                              <span className="user-name">
                                {user.prenom} {user.nom}
                              </span>
                              <span className="user-role">
                                {user.intitule_poste}
                              </span>
                            </div>
                          </div>
                        ))}
                        {users.length > 2 && (
                          <div className="more-users">
                            <span>+{users.length - 2} autres</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-users">
                        <FontAwesomeIcon icon={faUserPlus} />
                        <span>Aucun utilisateur assigné</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal d'ajout/modification de phase */}
      {showModal && selectedPhase && (modalType === "add" || modalType === "edit") && (
        <div className="dark-modal-backdrop">
          <div className="dark-modal-wrapper">
            <div className="dark-modal-header">
              <h3 className="dark-modal-title">
                {modalType === "add" ? "Ajouter" : "Modifier"} la phase: {selectedPhase.libelle_phase}
              </h3>
              <button
                className="dark-modal-close"
                onClick={() => setShowModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="dark-modal-body">
              <p className="dark-modal-description">
                {selectedPhase.description}
              </p>

              <div className="dark-form-group">
                <label className="dark-form-label">Date de début:</label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) =>
                    setFormData({ ...formData, date_debut: e.target.value })
                  }
                  className="dark-form-input"
                />
              </div>

              <div className="dark-form-group">
                <label className="dark-form-label">Date de fin:</label>
                <input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, date_fin: e.target.value })
                  }
                  className="dark-form-input"
                />
              </div>
            </div>

            <div className="dark-modal-footer">
              <button
                className="dark-btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                className="dark-btn-save"
                onClick={handleSavePhase}
                disabled={!formData.date_debut || !formData.date_fin}
              >
                <FontAwesomeIcon icon={faCheck} />
                {modalType === "add" ? "Ajouter" : "Modifier"} la phase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des utilisateurs */}
      {showUsersModal && selectedPhase && (
        <div className="dark-modal-backdrop">
          <div className="dark-modal-wrapper users-modal">
            <div className="dark-modal-header">
              <h3 className="dark-modal-title">
                {isAdmin ? "Gestion" : "Consultation"} de l'équipe - {selectedPhase.libelle_phase}
              </h3>
              <button
                className="dark-modal-close"
                onClick={() => setShowUsersModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="dark-modal-body">
              {/* Formulaire d'ajout d'utilisateur (seulement pour admin) */}
              {isAdmin && (
                <div className="add-user-section">
                  <h4>Ajouter un utilisateur</h4>
                  <div className="dark-form-group">
                    <label className="dark-form-label">Utilisateur:</label>
                    <select
                      value={userFormData.matricule}
                      onChange={(e) =>
                        setUserFormData({
                          matricule: e.target.value,
                        })
                      }
                      className="dark-form-input"
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {availableUsers
                        .filter(
                          (user) =>
                            !(phaseUsers[selectedPhase.id_phase] || []).some(
                              (pu) => pu.matricule === user.matricule
                            )
                        )
                        .map((user) => (
                          <option key={user.matricule} value={user.matricule}>
                            {user.prenom} {user.nom} - {user.intitule_poste}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    className="dark-btn-add-user"
                    onClick={handleAddUser}
                    disabled={!userFormData.matricule}
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    Ajouter
                  </button>
                </div>
              )}

              {/* Liste des utilisateurs assignés */}
              <div className="assigned-users-section">
                <h4>
                  Utilisateurs assignés (
                  {(phaseUsers[selectedPhase.id_phase] || []).length})
                </h4>
                {(phaseUsers[selectedPhase.id_phase] || []).length > 0 ? (
                  <div className="assigned-users-list">
                    {(phaseUsers[selectedPhase.id_phase] || []).map((user) => (
                      <div key={user.matricule} className="assigned-user-item">
                        <div className="user-avatar large">
                          {user.prenom.charAt(0)}
                          {user.nom.charAt(0)}
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {user.prenom} {user.nom}
                          </div>
                          <div className="user-position">
                            {user.intitule_poste}
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            className="remove-user-btn"
                            onClick={() => handleRemoveUser(user)}
                            title="Retirer de la phase"
                          >
                            <FontAwesomeIcon icon={faUserMinus} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-assigned-users">
                    <FontAwesomeIcon icon={faUsers} />
                    <span>Aucun utilisateur assigné à cette phase</span>
                  </div>
                )}
              </div>
            </div>

            <div className="dark-modal-footer">
              <button
                className="dark-btn-cancel"
                onClick={() => setShowUsersModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de date fin réelle */}
      {showFinReelleModal && selectedPhase && (
        <div className="dark-modal-backdrop">
          <div className="dark-modal-wrapper">
            <div className="dark-modal-header">
              <h3 className="dark-modal-title">
                {isPhaseCompleted(selectedPhase) ? 'Modifier' : 'Définir'} la date fin réelle - {selectedPhase.libelle_phase}
              </h3>
              <button
                className="dark-modal-close"
                onClick={() => setShowFinReelleModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="dark-modal-body">
              <p className="dark-modal-description">
                {isPhaseCompleted(selectedPhase) 
                  ? "Modifiez la date de fin réelle de cette phase."
                  : "Définissez la date de fin réelle pour marquer cette phase comme terminée."
                }
              </p>

              <div className="dark-form-group">
                <label className="dark-form-label">Date de fin réelle:</label>
                <input
                  type="date"
                  value={finReelleFormData.date_fin_reelle}
                  onChange={(e) =>
                    setFinReelleFormData({ date_fin_reelle: e.target.value })
                  }
                  className="dark-form-input"
                />
              </div>

              {finReelleFormData.date_fin_reelle && (
                <div className="completion-info">
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Cette phase sera marquée comme terminée</span>
                </div>
              )}
            </div>

            <div className="dark-modal-footer">
              <button
                className="dark-btn-cancel"
                onClick={() => setShowFinReelleModal(false)}
              >
                Annuler
              </button>
              <button
                className="dark-btn-save"
                onClick={handleSaveFinReelle}
                disabled={!finReelleFormData.date_fin_reelle}
              >
                <FontAwesomeIcon icon={faCheck} />
                {isPhaseCompleted(selectedPhase) ? 'Modifier' : 'Terminer'} la phase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPhasesScreen;