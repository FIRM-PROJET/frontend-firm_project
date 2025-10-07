import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/DevisCSS/TravauxSelectionScreen.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MessageModal from "../../modals/MessageModal";
import { DevisService } from "../../services/DevisService";
import AddTravauxModal from "../../modals/AddTravauxModal";

import {
  faCheckSquare,
  faSquare,
  faPlus,
  faTrash,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

const TravauxSelectionScreen = () => {
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  const navigate = useNavigate();
  const selectedProjects = location.state?.selectedProjects || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTravaux, setSelectedTravaux] = useState([]);
  const [newTravaux, setNewTravaux] = useState({
    name: "",
    montant: "",
    devise: "EUR",
  });
  const [autresTravaux, setAutresTravaux] = useState([]);
  const [travauxMontants, setTravauxMontants] = useState({});

  useEffect(() => {
    if (selectedProjects.length === 0) {
      console.error("Aucun projet sélectionné");
      navigate("/devis/etape1");
    }
  }, [selectedProjects, navigate]);

  useEffect(() => {
    // Charger les montants des travaux au chargement du composant
    const loadTravauxMontants = async () => {
      try {
        const filePromises = selectedProjects.map((project) =>
          DevisService.get_projects_devis_excel(project.id_projet)
        );

        const filesResponses = await Promise.all(filePromises);
        const fileNames = filesResponses
          .flat()
          .map((fichier) => fichier.chemin_fichier);

        // Récupérer tous les travaux pour obtenir les montants
        const allTravauxIds = travauxList.map(t => t.id);
        const devisResults = await DevisService.get_devis_contents(
          fileNames,
          allTravauxIds
        );

        // Créer un objet avec les montants par id de travaux
        const montantsMap = {};
        devisResults.forEach(travaux => {
          montantsMap[travaux.id_travaux] = travaux.montant;
        });
        
        setTravauxMontants(montantsMap);
      } catch (error) {
        console.error("Erreur lors du chargement des montants :", error);
      }
    };

    if (selectedProjects.length > 0) {
      loadTravauxMontants();
    }
  }, [selectedProjects]);

 const travauxList = [
  { id: 1, name: "Installation et repli de chantier" },
  { id: 2, name: "Travaux de dépose et démolition" },
  { id: 3, name: "Travaux de terrassement" },
  { id: 4, name: "Travaux en infrastructure" },
  { id: 5, name: "Travaux en superstructure" },
  { id: 6, name: "Maçonnerie - Ravalement" },
  { id: 7, name: "Charpente - couverture - étanchéité" },
  { id: 8, name: "Assainissement" },
  { id: 9, name: "Peinture" },
  { id: 10, name: "Revêtement - plafonnage - cloison" },
  { id: 11, name: "Ouvrage métallique" },
  { id: 12, name: "Ouvrage bois" },
  { id: 13, name: "Menuiserie métallique" },
  { id: 14, name: "Menuiserie bois" },
  { id: 15, name: "Menuiserie aluminium" },
  { id: 16, name: "Plomberie sanitaire" },
  { id: 17, name: "Électricité" },
  { id: 18, name: "Énergie solaire" },
  { id: 19, name: "Climatisation - VMC" },
  { id: 20, name: "Système de sécurité incendie" },
  { id: 21, name: "Ascenseur" },
  { id: 22, name: "Cloture" },
  { id: 23, name: "Équipement et meuble de cuisine" },
  { id: 24, name: "Peau de façade" },
  { id: 25, name: "Piscine" },
  { id: 26, name: "Accessibilité PMR" },
  { id: 27, name: "Aménagement extérieur" }
];

  const handleCheckboxChange = (travaux) => {
    setSelectedTravaux((prev) => {
      if (prev.includes(travaux.id)) {
        return prev.filter((id) => id !== travaux.id);
      } else {
        return [...prev, travaux.id];
      }
    });
  };

  // Fonction corrigée pour sélectionner seulement les travaux avec valeur
  const handleSelectAll = () => {
    // Filtrer les travaux qui ont une valeur (montant !== 0)
    const travauxWithValue = travauxList.filter(t => !hasZeroAmount(t.id));
    const travauxWithValueIds = travauxWithValue.map(t => t.id);
    
    // Vérifier si tous les travaux avec valeur sont déjà sélectionnés
    const allWithValueSelected = travauxWithValueIds.every(id => selectedTravaux.includes(id));
    
    if (allWithValueSelected) {
      // Désélectionner seulement les travaux avec valeur, garder ceux sélectionnés manuellement avec montant 0
      setSelectedTravaux(prev => prev.filter(id => !travauxWithValueIds.includes(id)));
    } else {
      // Ajouter tous les travaux avec valeur à la sélection actuelle
      setSelectedTravaux(prev => {
        const newSelection = [...prev];
        travauxWithValueIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Fonction corrigée pour vérifier si une plage est sélectionnée (ignorer les montants 0)
  const isRangeSelected = (start, end) => {
    const rangeTravauxWithValue = travauxList
      .filter((t) => t.id >= start && t.id <= end && !hasZeroAmount(t.id))
      .map((t) => t.id);
    return rangeTravauxWithValue.every((id) => selectedTravaux.includes(id));
  };

  // Fonction corrigée pour sélectionner une plage (ignorer les montants 0)
  const handleSelectRange = (start, end) => {
    // Filtrer les travaux dans la plage qui ont une valeur (montant !== 0)
    const rangeTravauxWithValue = travauxList
      .filter((t) => t.id >= start && t.id <= end && !hasZeroAmount(t.id));
    const rangeIds = rangeTravauxWithValue.map((t) => t.id);

    // Vérifier si tous les travaux avec valeur dans la plage sont sélectionnés
    const allRangeWithValueSelected = rangeIds.every(id => selectedTravaux.includes(id));

    if (allRangeWithValueSelected) {
      // Désélectionner seulement les travaux avec valeur dans la plage
      setSelectedTravaux((prev) => prev.filter((id) => !rangeIds.includes(id)));
    } else {
      // Ajouter tous les travaux avec valeur de la plage à la sélection actuelle
      setSelectedTravaux((prev) => {
        const newSelection = [...prev];
        rangeIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTravaux((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewTravauxSubmit = (newTravauxData) => {
    setAutresTravaux((prev) => [...prev, newTravauxData]);
  };

  const handleDeleteAutresTravaux = (id) => {
    setAutresTravaux((prev) => prev.filter((travaux) => travaux.id !== id));
  };

  // Fonction pour vérifier si un travaux a un montant de 0
  const hasZeroAmount = (travauxId) => {
    return travauxMontants[travauxId] === 0;
  };

  const handleValidate = async () => {
    if (selectedTravaux.length === 0) {
      setModalMessage(
        "Veuillez sélectionner au moins un travaux standard"
      );
      setModalType("error");
      setShowModal(true);
      return;
    }

    const selectedTravauxData = travauxList
      .filter((travaux) => selectedTravaux.includes(travaux.id))
      .map((travaux) => ({
        id: travaux.id,
        name: travaux.name,
        type: "standard",
      }));

    const allTravaux = [
      ...selectedTravauxData,
      ...autresTravaux.map((travaux) => ({
        ...travaux,
        type: "custom",
      })),
    ];

    try {
      const selectedIds = selectedTravaux;
      const filePromises = selectedProjects.map((project) =>
        DevisService.get_projects_devis_excel(project.id_projet)
      );

      const filesResponses = await Promise.all(filePromises);
      const fileNames = filesResponses
        .flat()
        .map((fichier) => fichier.chemin_fichier);

      const devisResults = await DevisService.get_devis_contents(
        fileNames,
        selectedIds
      );
      navigate("/devis/result", {
        state: {
          devisResults,
          allTravaux,
          selectedProjects,
        },
      });
    } catch (error) {
      console.error("Erreur lors du calcul des devis :", error);
      setModalMessage("Erreur lors de la récupération des devis.");
      setModalType("error");
      setShowModal(true);
    }
  };

  return (
    <div className="travaux-container">
      <button className="back-button3" onClick={() => navigate(-1)}>
        <i className="bi bi-caret-left-fill"></i> Retour
      </button>
      
      <h2 className="title10">Etape 3 : Sélection des Travaux</h2>

      <div className="select-all-container">
        <button className="select-all-button" onClick={handleSelectAll}>
          <FontAwesomeIcon
            icon={
              (() => {
                const travauxWithValue = travauxList.filter(t => !hasZeroAmount(t.id));
                return (travauxWithValue.length > 0 && 
                        travauxWithValue.every(t => selectedTravaux.includes(t.id)))
                  ? faCheckSquare
                  : faSquare;
              })()
            }
            className="select-all-icon"
          />
          <span>
            {(() => {
              const travauxWithValue = travauxList.filter(t => !hasZeroAmount(t.id));
              return (travauxWithValue.length > 0 && 
                      travauxWithValue.every(t => selectedTravaux.includes(t.id)))
                ? "Tout désélectionner"
                : "Tout sélectionner";
            })()}
          </span>
        </button>

        <button
          className="select-all-button"
          onClick={() => handleSelectRange(1, 8)}
        >
          <FontAwesomeIcon
            icon={isRangeSelected(1, 8) ? faCheckSquare : faSquare}
            className="select-all-icon"
          />
          <span>Gros Œuvre</span>
        </button>

        <button
          className="select-all-button"
          onClick={() => handleSelectRange(9, 27)}
        >
          <FontAwesomeIcon
            icon={isRangeSelected(9, 27) ? faCheckSquare : faSquare}
            className="select-all-icon"
          />
          <span>Second Œuvre</span>
        </button>
      </div>

      <div className="travaux-section">
         <div className="section-divider">
        <span>Travaux Standards</span>
      </div>
        <div className="travaux-list">
          {travauxList.map((travaux) => (
            <div 
              key={travaux.id} 
              className={`travaux-item ${hasZeroAmount(travaux.id) ? 'travaux-item-zero' : ''}`}
            >
              <input
                type="checkbox"
                id={`travaux-${travaux.id}`}
                checked={selectedTravaux.includes(travaux.id)}
                onChange={() => handleCheckboxChange(travaux)}
              />
              <label htmlFor={`travaux-${travaux.id}`}>
                <span className="travaux-number">{travaux.id}.</span>
                {travaux.name}
                {hasZeroAmount(travaux.id) && (
                  <span className="zero-amount-indicator">(Aucune valeur)</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider">
        <span>Travaux Personnalisés</span>
      </div>

      <div className="autres-travaux-list">
        {autresTravaux.map((travaux) => (
          <div key={travaux.id} className="autres-travaux-item">
            <div className="autres-travaux-info">
              <span className="travaux-name">{travaux.name}</span>
              <span className="travaux-montant">
                {travaux.montant} {travaux.devise}
              </span>
            </div>
            <button
              className="delete-button"
              onClick={() => handleDeleteAutresTravaux(travaux.id)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      <div className="add-travaux-button-container">
        <button
          className="open-modal-button"
          onClick={() => setIsModalOpen(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="add-icon" />
          Ajouter un travail personnalisé
        </button>
      </div>

      <div className="validate-container">
        <button className="validate-button" onClick={handleValidate}>
          <FontAwesomeIcon icon={faCheck} className="validate-icon" />
          Valider la sélection
        </button>
      </div>

      <AddTravauxModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTravaux={handleNewTravauxSubmit}
      />

      {showModal && (
        <MessageModal
          message={modalMessage}
          type={modalType}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TravauxSelectionScreen;