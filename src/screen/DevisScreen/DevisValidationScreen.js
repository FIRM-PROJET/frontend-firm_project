import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ValidationDevisService } from "../../services/ValidationDevisService";
import "../../styles/DevisCSS/DevisValidationScreen.css";
import { exportToExcel, exportToPDF } from "../../components/ExportUtils";
import ValidationForm from "./ValidationForm";
import MessageModal from "../../modals/MessageModal";

const ValidationScreen = () => {
  const { state } = useLocation();
  const {
    surfaceType,
    allTravaux,
    selectedProjects,
    surfaceMoyenne,
    estimationFinale,
    newSurface,
    devisResults = [],
    ficheId,
    codeFiche,
    version,
    nomDevis: editNomDevis,
    nomMaitreOuvrage: editNomMaitreOuvrage,
    typeSurface: editTypeSurface,
    surfaceMoyenne: editSurfaceMoyenne,
    surfaceTotale: editSurfaceTotale,
    travauxStandards: editTravauxStandards,
    travauxCustom: editTravauxCustom,
  } = state || {};

  const navigate = useNavigate();
  const [currentProjetReferrent, setCurrentProjetReferrent] = useState("");
  const [maitreOuvrage, setMaitreOuvrage] = useState("");
  const [nomDevis, setNomDevis] = useState("");
  const [coursAriary, setCoursAriary] = useState("");
  const [setProjetReferrent] = useState("");

  const [montantsStandard, setMontantsStandard] = useState({});
  const [montantsCustom, setMontantsCustom] = useState({});
  const [pourcentagesInitiaux, setPourcentagesInitiaux] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showAllStandard, setShowAllStandard] = useState(false);
  const [showAllCustom, setShowAllCustom] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  // États pour la détection des modifications
  const [initialData, setInitialData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // État pour le modal de message
  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const contentRef = useRef(null);

  const standardTravaux = useMemo(
    () => allTravaux?.filter((t) => t.type === "standard") || [],
    [allTravaux]
  );
  const customTravaux = useMemo(
    () => allTravaux?.filter((t) => t.type === "custom") || [],
    [allTravaux]
  );

  const formatNombre = (val) =>
    new Intl.NumberFormat("fr-FR").format(Number(val || 0));

  // Fonction pour sauvegarder les données initiales
  const saveInitialData = (
    nomDevis,
    maitreOuvrage,
    coursAriary,
    montantsStandard,
    montantsCustom
  ) => {
    setInitialData({
      nomDevis,
      maitreOuvrage,
      coursAriary,
      montantsStandard: { ...montantsStandard },
      montantsCustom: { ...montantsCustom },
    });
  };
  const fetchPreviousProjetReferrent = async (id) => {
    try {
      const response = await ValidationDevisService.getEstimationDetails(id);
      if (response.success && response.data.length > 0) {
        return response.data[0].projet_referrent || "";
      }
      return "";
    } catch (error) {
      console.error("Erreur fetch projet référent :", error);
      return "";
    }
  };
  useEffect(() => {
    const loadProjetReferrent = async () => {
      if (isEditMode && ficheId) {
        // En mode édition, fetch depuis API
        const previousProjet = await fetchPreviousProjetReferrent(ficheId);
        setCurrentProjetReferrent(previousProjet || "Non défini");
      } else {
        if (selectedProjects && selectedProjects.length > 0) {
          const noms = selectedProjects.map((p) => p.nom_projet || "Inconnu");
          setCurrentProjetReferrent(noms.join(", "));
        } else {
          setCurrentProjetReferrent("Non défini");
        }
      }
    };

    loadProjetReferrent();
  }, [isEditMode, ficheId, selectedProjects, allTravaux]);

  // Fonction pour détecter les modifications
  const checkForChanges = () => {
    if (!initialized || !initialData.nomDevis === undefined) return;

    const currentData = {
      nomDevis,
      maitreOuvrage,
      coursAriary,
      montantsStandard,
      montantsCustom,
    };

    const changes =
      currentData.nomDevis !== initialData.nomDevis ||
      currentData.maitreOuvrage !== initialData.maitreOuvrage ||
      currentData.coursAriary !== initialData.coursAriary ||
      JSON.stringify(currentData.montantsStandard) !==
        JSON.stringify(initialData.montantsStandard) ||
      JSON.stringify(currentData.montantsCustom) !==
        JSON.stringify(initialData.montantsCustom);

    setHasChanges(changes);
  };

  // Utiliser useEffect pour détecter les changements
  useEffect(() => {
    checkForChanges();
  });

  // Fonction pour fermer le modal
  const closeModal = () => {
    setModal({ show: false, message: "", type: "info" });
  };

  // Fonction pour afficher le modal
  const showModal = (message, type = "info") => {
    setModal({ show: true, message, type });
  };

  const loadExistingData = async (id) => {
    try {
      setLoading(true);
      const response = await ValidationDevisService.getEstimationDetails(id);
      if (response.success && response.data.length > 0) {
        const data = response.data[0];
        setEditData(data);
        setIsEditMode(true);

        const nomDevisValue = data.nom_devis || "";
        const maitreOuvrageValue = data.nom_maitre_ouvrage || "";
        const coursAriaryValue = data.coursAriary || "";
        const projetReferrentValue = data.projet_referrent || "";

        setNomDevis(nomDevisValue);
        setMaitreOuvrage(maitreOuvrageValue);
        setCoursAriary(coursAriaryValue);
        setProjetReferrent(projetReferrentValue);

        const standardMontants = {};
        data.travaux_standards?.forEach((t) => {
          standardMontants[t.id_travaux] = Number(t.montant_travaux || 0);
        });
        setMontantsStandard(standardMontants);

        const customMontants = {};
        data.travaux_custom?.forEach((t, index) => {
          const customTravail = customTravaux.find(
            (ct) => ct.name === t.nom_travaux_custom
          );
          if (customTravail) {
            customMontants[customTravail.id] = Number(
              t.montant_travaux_custom || 0
            );
          }
        });
        setMontantsCustom(customMontants);

        const newPourcentagesInitiaux = {};
        const totalEstimation =
          Object.values(standardMontants).reduce((sum, m) => sum + m, 0) +
          Object.values(customMontants).reduce((sum, m) => sum + m, 0);

        [...standardTravaux, ...customTravaux].forEach((t) => {
          const montant =
            t.type === "standard"
              ? standardMontants[t.id]
              : customMontants[t.id];
          const pourcentageInitial =
            totalEstimation > 0 ? (montant / totalEstimation) * 100 : 0;
          newPourcentagesInitiaux[t.id] = pourcentageInitial;
        });

        setPourcentagesInitiaux(newPourcentagesInitiaux);
        setInitialized(true);

        // Sauvegarder les données initiales
        saveInitialData(
          nomDevisValue,
          maitreOuvrageValue,
          coursAriaryValue,
          standardMontants,
          customMontants
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      initializeFromProps();
    } finally {
      setLoading(false);
    }
  };

  const initializeFromEditProps = () => {
    setIsEditMode(true);
    const nomDevisValue = editNomDevis || "";
    const maitreOuvrageValue = editNomMaitreOuvrage || "";
    const coursAriaryValue = state?.coursAriary || "";

    setNomDevis(nomDevisValue);
    setMaitreOuvrage(maitreOuvrageValue);
    setCoursAriary(coursAriaryValue);

    // Initialiser les montants standards
    const initStandard = {};
    if (editTravauxStandards) {
      editTravauxStandards.forEach((t) => {
        initStandard[t.id_travaux] = Number(t.montant_travaux || 0);
      });
    }

    // Si les travaux standards viennent du format API direct
    if (standardTravaux && standardTravaux.length > 0) {
      standardTravaux.forEach((t) => {
        if (t.type === "standard") {
          initStandard[t.id] = Number(t.montant || 0);
        }
      });
    }

    setMontantsStandard(initStandard);

    // Initialiser les montants custom
    const initCustom = {};
    if (editTravauxCustom) {
      editTravauxCustom.forEach((t, index) => {
        const customId = `custom_${index}`;
        initCustom[customId] = Number(t.montant_travaux_custom || 0);
      });
    }

    // Si les travaux custom viennent du format API direct
    if (customTravaux && customTravaux.length > 0) {
      customTravaux.forEach((t) => {
        if (t.type === "custom") {
          initCustom[t.id] = Number(t.montant || 0);
        }
      });
    }

    setMontantsCustom(initCustom);

    // Calculer les pourcentages initiaux
    const newPourcentagesInitiaux = {};
    const totalEstimation =
      Object.values(initStandard).reduce((sum, m) => sum + m, 0) +
      Object.values(initCustom).reduce((sum, m) => sum + m, 0);

    // Pourcentages pour travaux standards
    Object.keys(initStandard).forEach((id) => {
      newPourcentagesInitiaux[id] =
        totalEstimation > 0 ? (initStandard[id] / totalEstimation) * 100 : 0;
    });

    // Pourcentages pour travaux custom
    Object.keys(initCustom).forEach((id) => {
      newPourcentagesInitiaux[id] =
        totalEstimation > 0 ? (initCustom[id] / totalEstimation) * 100 : 0;
    });

    setPourcentagesInitiaux(newPourcentagesInitiaux);
    setInitialized(true);

    // Sauvegarder les données initiales
    saveInitialData(
      nomDevisValue,
      maitreOuvrageValue,
      coursAriaryValue,
      initStandard,
      initCustom
    );
  };

  const initializeFromProps = () => {
    const initStandard = {};
    const initCustom = {};
    const initPourcentagesInitiaux = {};

    // Initialiser les travaux standards
    if (standardTravaux && standardTravaux.length > 0) {
      standardTravaux.forEach((t) => {
        let montant = 0;

        // Chercher le montant dans devisResults
        const found = devisResults?.find((d) => d.id_travaux === t.id);
        if (found) {
          montant = found.montant || 0;
        } else if (t.montant) {
          montant = t.montant;
        }

        initStandard[t.id] = montant;
      });
    }

    // Initialiser les travaux custom
    if (customTravaux && customTravaux.length > 0) {
      customTravaux.forEach((t) => {
        const montant = t.montant || 0;
        initCustom[t.id] = montant;
      });
    }

    // Calculer les pourcentages initiaux
    const totalEstimation =
      estimationFinale ||
      Object.values(initStandard).reduce((sum, m) => sum + m, 0) +
        Object.values(initCustom).reduce((sum, m) => sum + m, 0);

    // Pourcentages pour tous les travaux
    if (allTravaux && allTravaux.length > 0) {
      allTravaux.forEach((t) => {
        let montant = 0;
        if (t.type === "standard") {
          montant = initStandard[t.id] || 0;
        } else if (t.type === "custom") {
          montant = initCustom[t.id] || 0;
        }

        initPourcentagesInitiaux[t.id] =
          totalEstimation > 0 ? (montant / totalEstimation) * 100 : 0;
      });
    }

    setMontantsStandard(initStandard);
    setMontantsCustom(initCustom);
    setPourcentagesInitiaux(initPourcentagesInitiaux);
    setInitialized(true);

    // Sauvegarder les données initiales
    saveInitialData("", "", "", initStandard, initCustom);
  };

  useEffect(() => {
    if (!initialized) {
      if (ficheId && editNomDevis && editNomMaitreOuvrage) {
        initializeFromEditProps();
      } else if (ficheId) {
        loadExistingData(ficheId);
      } else if (
        estimationFinale &&
        (standardTravaux.length > 0 || customTravaux.length > 0)
      ) {
        initializeFromProps();
      }
    }
  });

  const totalStandard = Object.values(montantsStandard).reduce(
    (sum, m) => sum + Number(m || 0),
    0
  );
  const totalCustom = Object.values(montantsCustom).reduce(
    (sum, m) => sum + Number(m || 0),
    0
  );

  const currentSurfaceMoyenne = isEditMode
    ? editData?.surface_moyenne || editSurfaceMoyenne
    : surfaceMoyenne;
  const currentNewSurface = isEditMode
    ? editData?.surface_totale || editSurfaceTotale
    : newSurface;
  const currentSurfaceType = isEditMode
    ? editData?.type_surface || editTypeSurface || surfaceType
    : surfaceType;

  console.log("selectedProjects:", selectedProjects);

  const totalFinale =
    currentSurfaceMoyenne && currentNewSurface
      ? (totalStandard / currentSurfaceMoyenne) * currentNewSurface +
        totalCustom
      : totalStandard + totalCustom;

  const totalAriary = coursAriary
    ? (Number(totalFinale) * Number(coursAriary)).toFixed(0)
    : null;

  const handleMontantChange = (travauxId, newMontant, isStandard = true) => {
    const montantNum = Number(newMontant || 0);
    if (isStandard) {
      setMontantsStandard((prev) => ({
        ...prev,
        [travauxId]: montantNum,
      }));
    } else {
      setMontantsCustom((prev) => ({
        ...prev,
        [travauxId]: montantNum,
      }));
    }
  };

  const handleReset = () => {
    if (ficheId) {
      if (editNomDevis && editNomMaitreOuvrage) {
        initializeFromEditProps();
      } else {
        loadExistingData(ficheId);
      }
    } else {
      initializeFromProps();
    }
  };

  const handleEnregistrer = async () => {
    try {
      setLoading(true);
      const ficheData = {
        nom_devis: nomDevis,
        nom_maitre_ouvrage: maitreOuvrage,
        date_creation: new Date().toISOString().slice(0, 10),
        type_surface: currentSurfaceType,
        surface_totale: currentNewSurface,
        surface_moyenne: currentSurfaceMoyenne,
        cours_ariary: coursAriary ? Number(coursAriary) : null,
        projet_referrent: currentProjetReferrent,
        travaux_standards: Object.entries(montantsStandard).map(
          ([id, montant]) => ({
            id_travaux: parseInt(id),
            montant_travaux: montant || 0,
          })
        ),

        // Remplacer cette partie dans la fonction handleEnregistrer :

        travaux_custom: Object.entries(montantsCustom)
          .map(([id, montant]) => {
            if (montant <= 0) return null;

            let nomTravaux = "Travaux custom";

            if (isEditMode && editTravauxCustom) {
              // Méthode 1 : Si l'id est numérique, chercher directement par id_travaux
              if (!id.startsWith("custom_")) {
                const customTravail = editTravauxCustom.find(
                  (ct) =>
                    ct.id_travaux && ct.id_travaux.toString() === id.toString()
                );
                if (customTravail) {
                  nomTravaux =
                    customTravail.nom_travaux_custom || `Travaux custom ${id}`;
                }
              } else {
                // Méthode 2 : Si l'id commence par "custom_", utiliser l'index
                const index = parseInt(id.split("_")[1]);
                const customTravail = editTravauxCustom[index];
                if (customTravail) {
                  nomTravaux =
                    customTravail.nom_travaux_custom ||
                    `Travaux custom ${index + 1}`;
                }
              }
            } else {
              // Mode création normale
              const customTravail = customTravaux.find(
                (ct) => ct.id === parseInt(id)
              );
              if (customTravail) {
                nomTravaux =
                  customTravail.name ||
                  customTravail.nom_travaux_custom ||
                  "Travaux custom";
              }
            }

            return {
              nom_travaux_custom: nomTravaux,
              montant_travaux_custom: montant || 0,
            };
          })
          .filter(Boolean), // Enlever les éléments null
      };

      if (isEditMode && ficheId) {
        ficheData.id_fiche_estimation = ficheId;
        ficheData.code_fiche = codeFiche || editData?.code_fiche;
        ficheData.version = version || editData?.version;
      }

      await ValidationDevisService.ajouterDevis(ficheData);

      // Utiliser le modal au lieu de alert
      showModal(
        isEditMode
          ? "Devis mis à jour avec succès !"
          : "Devis enregistré avec succès !",
        "success"
      );

      // Réinitialiser les données initiales après sauvegarde
      saveInitialData(
        nomDevis,
        maitreOuvrage,
        coursAriary,
        montantsStandard,
        montantsCustom
      );

      // Optionnel: naviguer après fermeture du modal
      setTimeout(() => {
        navigate("/devis/liste_estimation");
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      showModal("Une erreur est survenue lors de l'enregistrement.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <>
      <div className="control-buttons">
        <button
          onClick={handleEnregistrer}
          className="btn-export"
          style={{
            backgroundColor:
              isEditMode && !hasChanges ? "#6c757d" : "#51a878ff",
            cursor: isEditMode && !hasChanges ? "not-allowed" : "pointer",
          }}
          disabled={loading || (isEditMode && !hasChanges)}
          title={
            isEditMode && !hasChanges ? "Aucune modification à sauvegarder" : ""
          }
        >
          <i className="fa-solid fa-save"></i>
          {loading
            ? "Enregistrement..."
            : isEditMode
            ? "Mettre à jour"
            : "Enregistrer"}
        </button>

        <button
          className="btn-export"
          onClick={() =>
            exportToPDF({
              nomDevis,
              maitreOuvrage,
              coursAriary,
              total: totalFinale,
              travaux: [...standardTravaux, ...customTravaux].map((t) => ({
                name: t.name,
                type: t.type || "standard", // Ajout du type
                montant:
                  t.type === "standard"
                    ? montantsStandard[t.id]
                    : montantsCustom[t.id],
              })),
              codeFiche: codeFiche || editData?.code_fiche,
              version: version || editData?.version || "1.0",
              typeSurface: currentSurfaceType,
              surfaceTotale: currentNewSurface,
              projetReferrent: currentProjetReferrent,
            })
          }
        >
          Export PDF
        </button>

        <button
          className="btn-export"
          onClick={() =>
            exportToExcel(
              nomDevis,
              [...standardTravaux, ...customTravaux].map((t) => ({
                name: t.name,
                type: t.type || "standard", // Ajout du type
                montant:
                  t.type === "standard"
                    ? montantsStandard[t.id]
                    : montantsCustom[t.id],
              })),
              totalFinale,
              maitreOuvrage,
              codeFiche || editData?.code_fiche,
              version || editData?.version || "1.0",
              currentSurfaceType,
              currentNewSurface,
              coursAriary
            )
          }
        >
          Export Excel
        </button>

        <button
          onClick={handleReset}
          className="btn-reset"
          title="Réinitialiser aux valeurs initiales"
          disabled={loading}
        >
          <i className="fa-solid fa-refresh"></i> Reset
        </button>
      </div>
      <ValidationForm
        ref={contentRef}
        maitreOuvrage={maitreOuvrage}
        setMaitreOuvrage={setMaitreOuvrage}
        nomDevis={nomDevis}
        setNomDevis={setNomDevis}
        coursAriary={coursAriary}
        setCoursAriary={setCoursAriary}
        surfaceType={currentSurfaceType}
        newSurface={currentNewSurface}
        selectedProjects={selectedProjects}
        standardTravaux={standardTravaux}
        customTravaux={customTravaux}
        montantsStandard={montantsStandard}
        montantsCustom={montantsCustom}
        pourcentagesInitiaux={pourcentagesInitiaux}
        devisResults={devisResults}
        showAllStandard={showAllStandard}
        setShowAllStandard={setShowAllStandard}
        showAllCustom={showAllCustom}
        setShowAllCustom={setShowAllCustom}
        handleMontantChange={handleMontantChange}
        formatNombre={formatNombre}
        totalStandard={totalStandard}
        totalCustom={totalCustom}
        totalFinale={totalFinale}
        totalAriary={totalAriary}
        surfaceMoyenne={currentSurfaceMoyenne}
        isEditMode={isEditMode}
        codeFiche={codeFiche || editData?.code_fiche}
        version={version || editData?.version}
        projetReferrent={currentProjetReferrent}
      />
      {modal.show && (
        <MessageModal
          message={modal.message}
          type={modal.type}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default ValidationScreen;
