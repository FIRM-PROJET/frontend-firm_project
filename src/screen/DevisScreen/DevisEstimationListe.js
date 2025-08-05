import React, { useState, useEffect } from "react";
import "../../styles/DevisCSS/DevisEstimationListe.css";
import { ValidationDevisService } from "../../services/ValidationDevisService";
import {
  FileText,
  User,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DevisEstimationListe = () => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await ValidationDevisService.getAllEstimations();
        setDevis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Grouper les devis par code_fiche
  const groupedDevis = devis.reduce((acc, item) => {
    if (!acc[item.code_fiche]) {
      acc[item.code_fiche] = [];
    }
    acc[item.code_fiche].push(item);
    return acc;
  }, {});

  // Trier les versions par ordre décroissant
  Object.keys(groupedDevis).forEach((code) => {
    groupedDevis[code].sort((a, b) => b.version - a.version);
  });

  // Fonctions utilitaires
  const toggleGroup = (codeFiche) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(codeFiche)) {
      newExpanded.delete(codeFiche);
    } else {
      newExpanded.add(codeFiche);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fonction pour transformer les données API en format attendu par ValidationScreen
  const transformDataForValidation = (details) => {
    // Créer les travaux standards avec les montants
    const standardTravaux = [];
    const standardMontants = {};

    if (details.travaux_standards) {
      details.travaux_standards.forEach((travail) => {
        // Créer l'objet travail avec le format attendu
        const standardTravail = {
          id: travail.id,
          name: travail.nom_travaux,
          type: "standard",
          montant: Number(travail.montant || 0),
        };

        // Éviter les doublons
        if (!standardTravaux.find((t) => t.id === travail.id)) {
          standardTravaux.push(standardTravail);
        }

        // Sommer les montants pour le même ID
        standardMontants[travail.id] =
          (standardMontants[travail.id] || 0) + Number(travail.montant || 0);
      });
    }

    // Créer les travaux custom avec les montants
    const customTravaux = [];
    const customMontants = {};

    if (details.travaux_custom) {
      details.travaux_custom.forEach((travail, index) => {
        const customId = `custom_${index}`;
        const customTravail = {
          id: customId,
          name: travail.nom_travaux_custom,
          type: "custom",
          montant: Number(travail.montant_travaux_custom || 0),
        };

        customTravaux.push(customTravail);
        customMontants[customId] = Number(travail.montant_travaux_custom || 0);
      });
    }

    // Combiner tous les travaux
    const allTravaux = [...standardTravaux, ...customTravaux];

    // Calculer l'estimation finale
    const totalStandard = Object.values(standardMontants).reduce(
      (sum, m) => sum + m,
      0
    );
    const totalCustom = Object.values(customMontants).reduce(
      (sum, m) => sum + m,
      0
    );
    const estimationFinale = totalStandard + totalCustom;

    // Créer les résultats de devis (format attendu)
    const devisResults = Object.entries(standardMontants).map(
      ([id, montant]) => ({
        id_travaux: parseInt(id),
        montant: montant,
      })
    );

    return {
      // Données d'identification
      ficheId: details.id_fiche_estimation,
      codeFiche: details.code_fiche,
      version: details.version,

      // Informations générales du devis
      nomDevis: details.nom_devis,
      nomMaitreOuvrage: details.nom_maitre_ouvrage,
      coursAriary: details.coursAriary || 0,

      // Informations de surface
      surfaceType: details.type_surface,
      surfaceMoyenne: details.surface_moyenne,
      surfaceTotale: details.surface_totale,
      newSurface: details.surface_totale,

      // Travaux organisés
      allTravaux: allTravaux,
      standardTravaux: standardTravaux,
      customTravaux: customTravaux,

      projetReferrent: details.projet_referrent,
      travauxStandards:
        details.travaux_standards?.map((t) => ({
          id_travaux: t.id,
          montant_travaux: t.montant,
        })) || [],
      travauxCustom:
        details.travaux_custom?.map((t) => ({
          nom_travaux_custom: t.nom_travaux_custom,
          montant_travaux_custom: t.montant_travaux_custom,
        })) || [],

      // Résultats et calculs
      devisResults: devisResults,
      estimationFinale: estimationFinale,

      // Métadonnées
      dateCreation: details.date_creation,
      isEditMode: true,
    };
  };

  const handleAction = async (action, devis) => {
    console.log(`Action ${action} sur le devis:`, devis);

    if (action === "edit") {
      try {
        const result = await ValidationDevisService.getEstimationDetails(
          devis.id_fiche_estimation
        );
        const details = result.data?.[0];

        if (!details) throw new Error("Détails du devis introuvables");

        // Transformer les données pour le ValidationScreen
        const editState = transformDataForValidation(details);

        console.log("État préparé pour ValidationScreen:", editState);

        navigate("/devis/validation", { state: editState });
      } catch (err) {
        console.error("Erreur lors de la récupération des détails :", err);
        alert("Impossible de charger les détails du devis.");
      }
    }

    if (action === "add") {
      navigate("/devis/new");
    }

    if (action === "delete") {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
        try {
          await ValidationDevisService.deleteEstimation(
            devis.id_fiche_estimation
          );
          console.log("Devis supprimé:", devis);

          // Mettre à jour localement la liste sans refetch complet
          setDevis((prevDevis) =>
            prevDevis.filter(
              (d) => d.id_fiche_estimation !== devis.id_fiche_estimation
            )
          );
        } catch (err) {
          console.error("Erreur lors de la suppression :", err);
          alert("Impossible de supprimer le devis.");
        }
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#ccc" }}>
        <div className="loading-options">Chargement des devis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#e53e3e" }}>
        Erreur: {error}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        background: "#181835",
        minHeight: "100vh",
        color: "#ccc",
      }}
    >
      <div className="devis-header">
        <h1 className="devis-title">Liste des Devis</h1>
        <button
          className="add-devis-button"
          onClick={() => handleAction("add", null)}
        >
          <Plus size={18} />
          Nouveau Devis
        </button>
      </div>

      {Object.keys(groupedDevis).length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          <p>Aucun devis trouvé</p>
        </div>
      ) : (
        <div className="devis-list">
          {Object.entries(groupedDevis).map(([codeFiche, versions]) => {
            const latestVersion = versions[0];
            const isExpanded = expandedGroups.has(codeFiche);

            return (
              <div key={codeFiche} className="devis-group">
                <div
                  className="devis-group-header"
                  onClick={() => toggleGroup(codeFiche)}
                >
                  <div className="devis-group-info">
                    <i className="bi bi-file-earmark-text-fill"></i> 
                    <div>
                      <div className="devis-group-title">
                        {latestVersion.nom_devis}
                        <span className="version-count">
                          {versions.length} version
                          {versions.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", color: "#999" }}>
                        {codeFiche} • {latestVersion.nom_maitre_ouvrage}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", color: "#999" }}>
                        {formatDate(latestVersion.date_creation)}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="devis-versions">
                    {versions.map((devis, index) => (
                      <div
                        key={devis.id_fiche_estimation}
                        className="devis-item"
                      >
                        <div className="devis-item-info">
                          <div className="devis-item-title">
                            {devis.nom_devis}
                            <span className="version-badge">
                              v{devis.version}
                            </span>
                            {index === 0 && (
                              <span className="latest-badge">Dernière</span>
                            )}
                          </div>
                          <div className="devis-item-details">
                            <div className="devis-item-detail">
                              <i className="bi bi-person-fill"></i>
                              {devis.nom_maitre_ouvrage}
                            </div>
                            <div className="devis-item-detail">
                              <i className="bi bi-calendar-event-fill"></i>
                              {formatDate(devis.date_creation)}
                            </div>
                            <div className="devis-item-detail">
                              <i className="bi bi-file-earmark-text-fill"></i>
                              {devis.id_fiche_estimation}
                            </div>
                          </div>
                        </div>
                        <div className="devis-actions">
                          <button
                            className="action-button1 edit"
                            onClick={() => handleAction("edit", devis)}
                            title="Modifier le devis"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="action-button1 delete"
                            onClick={() => handleAction("delete", devis)}
                            title="Supprimer le devis"
                          >
                           <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DevisEstimationListe;
