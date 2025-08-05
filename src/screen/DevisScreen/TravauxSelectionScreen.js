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

  useEffect(() => {
    if (selectedProjects.length === 0) {
      console.error("Aucun projet sélectionné");
      navigate("/devis/etape1");
    }
  }, [selectedProjects, navigate]);

  const travauxList = [
    { id: 1, name: "Installation et repli de chantier" },
    { id: 2, name: "Travaux de dépose et démolition" },
    { id: 3, name: "Travaux de terrassement" },
    { id: 4, name: "Travaux en infrastructure" },
    { id: 5, name: "Travaux en superstructure" },
    { id: 6, name: "Charpente - couverture - étanchéité" },
    { id: 7, name: "Assainissement" },
    { id: 8, name: "Peinture" },
    { id: 9, name: "Revêtement - plafonnage - cloison" },
    { id: 10, name: "Ouvrage bois" },
    { id: 11, name: "Menuiserie bois" },
    { id: 12, name: "Menuiserie aluminium" },
    { id: 13, name: "Plomberie sanitaire" },
    { id: 14, name: "Électricité" },
    { id: 15, name: "Climatisation - VMC" },
    { id: 16, name: "Aménagement extérieur" },
    { id: 17, name: "Équipement et meuble de cuisine" },
    { id: 18, name: "Ascenseur" },
    { id: 19, name: "Peau de façade" },
    { id: 20, name: "Énergie solaire" },
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

  const handleSelectAll = () => {
    if (selectedTravaux.length === travauxList.length) {
      setSelectedTravaux([]);
    } else {
      setSelectedTravaux(travauxList.map((t) => t.id));
    }
  };

  const isRangeSelected = (start, end) => {
    const rangeIds = travauxList
      .filter((t) => t.id >= start && t.id <= end)
      .map((t) => t.id);
    return rangeIds.every((id) => selectedTravaux.includes(id));
  };

  const handleSelectRange = (start, end) => {
    const rangeIds = travauxList
      .filter((t) => t.id >= start && t.id <= end)
      .map((t) => t.id);

    if (isRangeSelected(start, end)) {
      setSelectedTravaux((prev) => prev.filter((id) => !rangeIds.includes(id)));
    } else {
      setSelectedTravaux((prev) => {
        const newSelection = [...prev];
        rangeIds.forEach((id) => {
          if (!newSelection.includes(id)) newSelection.push(id);
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

      console.log("Fichiers à analyser :", fileNames);
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
      
      <h2 className="title1">Etape 3 : Sélection des Travaux</h2>

      <div className="select-all-container">
        <button className="select-all-button" onClick={handleSelectAll}>
          <FontAwesomeIcon
            icon={
              selectedTravaux.length === travauxList.length
                ? faCheckSquare
                : faSquare
            }
            className="select-all-icon"
          />
          <span>
            {selectedTravaux.length === travauxList.length
              ? "Tout désélectionner"
              : "Tout sélectionner"}
          </span>
        </button>

        <button
          className="select-all-button"
          onClick={() => handleSelectRange(1, 7)}
        >
          <FontAwesomeIcon
            icon={isRangeSelected(1, 7) ? faCheckSquare : faSquare}
            className="select-all-icon"
          />
          <span>Gros Œuvre</span>
        </button>

        <button
          className="select-all-button"
          onClick={() => handleSelectRange(8, 20)}
        >
          <FontAwesomeIcon
            icon={isRangeSelected(8, 20) ? faCheckSquare : faSquare}
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
            <div key={travaux.id} className="travaux-item">
              <input
                type="checkbox"
                id={`travaux-${travaux.id}`}
                checked={selectedTravaux.includes(travaux.id)}
                onChange={() => handleCheckboxChange(travaux)}
              />
              <label htmlFor={`travaux-${travaux.id}`}>
                <span className="travaux-number">{travaux.id}.</span>
                {travaux.name}
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