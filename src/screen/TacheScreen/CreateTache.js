import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  Clock,
  FileText,
  Folder,
  Settings,
  Users,
} from "lucide-react";
import { ProjetService } from "../../services/ProjetService";
import { TacheService } from "../../services/TacheService";
import MessageModal from "../../modals/MessageModal";
import "../../styles/TacheCSS/CreateTache.css";

const CreateTache = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState([]);
  const [phases, setPhases] = useState([]);
  const [uniteDurees, setUniteDurees] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  const [tacheData, setTacheData] = useState({
    nom_tache: "",
    description: "",
    ref_projet: "",
    id_phase: "",
    date_debut: "",
    duree: "",
    id_unite_duree: "",
    utilisateurs_assignes: [],
    utilisateurs_exceptions: [], // Nouveaux utilisateurs avec exception
  });

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [projectsData, unitesData] = await Promise.all([
          ProjetService.getAllProjects(),
          TacheService.get_unite_duree(),
        ]);
        console.log("projectsData:", projectsData);

        setProjects(projectsData.data);
        setUniteDurees(unitesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Charger les phases quand un projet est sélectionné
  const handleProjectChange = async (refProjet) => {
    setTacheData((prev) => ({
      ...prev,
      ref_projet: refProjet,
      id_phase: "",
      utilisateurs_assignes: [],
      utilisateurs_exceptions: [],
    }));

    if (refProjet) {
      try {
        setLoading(true);
        const phasesData = await ProjetService.getPhasesByProject(refProjet);
        setPhases(phasesData.data);
      } catch (error) {
        console.error("Erreur lors du chargement des phases:", error);
        setPhases([]);
      } finally {
        setLoading(false);
      }
    } else {
      setPhases([]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setSubmitting(true);
    let ref_tache = null;

    try {
      // Étape 1 : Créer la tâche
      const result = await TacheService.createTache({
        ...tacheData,
        duree: parseInt(tacheData.duree),
        id_unite_duree: parseInt(tacheData.id_unite_duree),
      });
      ref_tache = result.ref_tache;

      // Étape 2 : Assigner les utilisateurs
      for (const matricule of tacheData.utilisateurs_assignes) {
        await TacheService.assign_user_tache({ ref_tache, matricule });
      }

      for (const matricule of tacheData.utilisateurs_exceptions) {
        await TacheService.assign_user_tache_sans_condition({
          ref_tache,
          matricule,
        });
      }

      // Si tout est ok
      setModalMessage("Tâche créée et utilisateurs assignés avec succès !");
      setModalType("success");
      setIsModalOpen(true);
      resetForm();
    } catch (error) {
      // Étape 3 : rollback si assignation échoue
      if (ref_tache) {
        try {
          await TacheService.deleteTache(ref_tache);
        } catch (rollbackError) {
          console.error("Erreur rollback :", rollbackError);
        }
      }

      const message =
        error.message || "Erreur lors de la création de la tâche.";
      setModalMessage(`Erreur: ${message}`);
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTacheData({
      nom_tache: "",
      description: "",
      ref_projet: "",
      id_phase: "",
      date_debut: "",
      duree: "",
      id_unite_duree: "",
      utilisateurs_assignes: [],
      utilisateurs_exceptions: [],
    });
    setCurrentStep(1);
    setPhases([]);
    setUtilisateurs([]);
  };

  const handlePhaseChange = async (
    id_phase,
    refProjet = tacheData.ref_projet
  ) => {
    setTacheData((prev) => ({
      ...prev,
      id_phase,
      utilisateurs_assignes: [],
      utilisateurs_exceptions: [],
    }));

    if (refProjet && id_phase) {
      try {
        setLoading(true);
        const utilisateursData = await ProjetService.getUsersByPhase({
          ref_projet: refProjet,
          id_phase,
        });
        setUtilisateurs(utilisateursData.data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des utilisateurs par phase:",
          error
        );
        setUtilisateurs([]);
      } finally {
        setLoading(false);
      }
    } else {
      setUtilisateurs([]);
    }
  };

  const handleInputChange = (field, value) => {
    setTacheData((prev) => ({ ...prev, [field]: value }));
  };

  // Gestion de l'assignation des utilisateurs normaux
  const handleUserAssignment = (matricule, isAssigned) => {
    setTacheData((prev) => ({
      ...prev,
      utilisateurs_assignes: isAssigned
        ? [...prev.utilisateurs_assignes, matricule]
        : prev.utilisateurs_assignes.filter((m) => m !== matricule),
      // Retirer des exceptions si ajouté aux assignations normales
      utilisateurs_exceptions: isAssigned
        ? prev.utilisateurs_exceptions.filter((m) => m !== matricule)
        : prev.utilisateurs_exceptions,
    }));
  };

  // Gestion de l'assignation des utilisateurs avec exception
  const handleUserExceptionAssignment = (matricule, isAssigned) => {
    setTacheData((prev) => ({
      ...prev,
      utilisateurs_exceptions: isAssigned
        ? [...prev.utilisateurs_exceptions, matricule]
        : prev.utilisateurs_exceptions.filter((m) => m !== matricule),
      // Retirer des assignations normales si ajouté aux exceptions
      utilisateurs_assignes: isAssigned
        ? prev.utilisateurs_assignes.filter((m) => m !== matricule)
        : prev.utilisateurs_assignes,
    }));
  };

  const validateStep1 = () => {
    return (
      tacheData.nom_tache &&
      tacheData.description &&
      tacheData.ref_projet &&
      tacheData.id_phase
    );
  };

  const validateStep2 = () => {
    return tacheData.date_debut && tacheData.duree && tacheData.id_unite_duree;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="create-tache-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-tache-container">
      <div className="create-tache-card">
        {/* Header avec steps */}
        <div className="steps-header">
          <div className="steps-container">
            <h2>Création d'une nouvelle tâche </h2>
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="step-content">
          {currentStep === 1 && (
            <div className="step-form">
              <h2 className="step-title">
                <FileText size={24} />
                Informations générales
              </h2>

              <div className="form-group">
                <label htmlFor="nom_tache">Nom de la tâche *</label>
                <input
                  id="nom_tache"
                  type="text"
                  value={tacheData.nom_tache}
                  onChange={(e) =>
                    handleInputChange("nom_tache", e.target.value)
                  }
                  placeholder="Entrez le nom de la tâche"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={tacheData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Décrivez la tâche"
                  rows="4"
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ref_projet">Projet *</label>
                <select
                  id="ref_projet"
                  value={tacheData.ref_projet}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Sélectionnez un projet</option>
                  {projects.map((project) => (
                    <option key={project.ref_projet} value={project.ref_projet}>
                      {project.nom_projet}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="id_phase">Phase du projet *</label>
                <select
                  id="id_phase"
                  value={tacheData.id_phase}
                  onChange={(e) => handlePhaseChange(e.target.value)}
                  className="form-select"
                  disabled={!tacheData.ref_projet || loading}
                >
                  <option value="">
                    {!tacheData.ref_projet
                      ? "Sélectionnez d'abord un projet"
                      : loading
                      ? "Chargement des phases..."
                      : "Sélectionnez une phase"}
                  </option>
                  {phases.map((phase) => (
                    <option key={phase.id_phase} value={phase.id_phase}>
                      {phase.libelle_phase}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-form">
              <h2 className="step-title">
                <Calendar size={24} />
                Planification & Assignation
              </h2>

              <div className="form-group">
                <label htmlFor="date_debut">Date de début *</label>
                <input
                  id="date_debut"
                  type="date"
                  value={tacheData.date_debut}
                  onChange={(e) =>
                    handleInputChange("date_debut", e.target.value)
                  }
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duree">Durée *</label>
                  <input
                    id="duree"
                    type="number"
                    min="1"
                    value={tacheData.duree}
                    onChange={(e) => handleInputChange("duree", e.target.value)}
                    placeholder="Durée"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="id_unite_duree">Unité *</label>
                  <select
                    id="id_unite_duree"
                    value={tacheData.id_unite_duree}
                    onChange={(e) =>
                      handleInputChange("id_unite_duree", e.target.value)
                    }
                    className="form-select"
                  >
                    <option value="">Unité</option>
                    {uniteDurees.map((unite) => (
                      <option
                        key={unite.id_unite_duree}
                        value={unite.id_unite_duree}
                      >
                        {unite.nom_unite}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section assignation des utilisateurs */}
              <div className="assignation-section">
                <h3 className="assignation-title">
                  <Users size={20} />
                  Assigner des utilisateurs
                </h3>

                {utilisateurs.length > 0 ? (
                  <div className="users-grid">
                    {utilisateurs.map((utilisateur) => (
                      <div
                        key={utilisateur.matricule}
                        className="user-checkbox"
                      >
                        <div className="user-info">
                          <div className="user-name">
                            {utilisateur.nom} {utilisateur.prenom}
                          </div>
                          {utilisateur.email && (
                            <div className="user-email">
                              {utilisateur.email}
                            </div>
                          )}
                        </div>
                        <div className="checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={tacheData.utilisateurs_assignes.includes(
                                utilisateur.matricule
                              )}
                              onChange={(e) =>
                                handleUserAssignment(
                                  utilisateur.matricule,
                                  e.target.checked
                                )
                              }
                            />
                            Normal
                          </label>
                          <label className="checkbox-label exception">
                            <input
                              type="checkbox"
                              checked={tacheData.utilisateurs_exceptions.includes(
                                utilisateur.matricule
                              )}
                              onChange={(e) =>
                                handleUserExceptionAssignment(
                                  utilisateur.matricule,
                                  e.target.checked
                                )
                              }
                            />
                            Exception
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-users">Aucun utilisateur disponible</p>
                )}

                {(tacheData.utilisateurs_assignes.length > 0 ||
                  tacheData.utilisateurs_exceptions.length > 0) && (
                  <div className="assignment-summary">
                    <p>
                      {tacheData.utilisateurs_assignes.length} utilisateur(s)
                      assigné(s) normalement
                    </p>
                    <p>
                      {tacheData.utilisateurs_exceptions.length} utilisateur(s)
                      assigné(s) avec exception
                    </p>
                  </div>
                )}
              </div>

              {/* Résumé des informations */}
              <div className="summary-section">
                <h3>
                  <Check size={18} />
                  Résumé
                </h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Tâche:</span>
                    <span className="value">{tacheData.nom_tache}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Projet:</span>
                    <span className="value">
                      {
                        projects.find(
                          (p) => p.ref_projet === tacheData.ref_projet
                        )?.nom_projet
                      }
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Phase:</span>
                    <span className="value">
                      {
                        phases.find((p) => p.id_phase === tacheData.id_phase)
                          ?.libelle_phase
                      }
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Durée:</span>
                    <span className="value">
                      {tacheData.duree}{" "}
                      {
                        uniteDurees.find(
                          (u) => u.id_unite_duree === tacheData.id_unite_duree
                        )?.nom_unite
                      }
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Date de début:</span>
                    <span className="value">{tacheData.date_debut}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Utilisateurs assignés:</span>
                    <span className="value">
                      {tacheData.utilisateurs_assignes.length +
                        tacheData.utilisateurs_exceptions.length ===
                      0
                        ? "Aucun"
                        : `${
                            tacheData.utilisateurs_assignes.length +
                            tacheData.utilisateurs_exceptions.length
                          } utilisateur(s)`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Boutons de navigation */}
        <div className="form-actions">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="btn btn-secondary"
            >
              <ChevronLeft size={20} />
              Précédent
            </button>
          )}

          <div className="actions-right">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!validateStep1()}
                className="btn btn-primary"
              >
                Suivant
                <ChevronRight size={20} />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!validateStep2() || submitting}
                className="btn btn-success"
              >
                {submitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Créer la tâche
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
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

export default CreateTache;
