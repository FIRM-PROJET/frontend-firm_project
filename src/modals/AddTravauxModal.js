import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import "../styles/DevisCSS/AddTravauxModal.css";

const AddTravauxModal = ({ isOpen, onClose, onAddTravaux }) => {
  const [newTravaux, setNewTravaux] = useState({
    name: "",
    montant: "",
    devise: "EUR",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTravaux((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTravaux.name.trim() && newTravaux.montant) {
      onAddTravaux({
        ...newTravaux,
        id: Date.now(),
        montant: parseFloat(newTravaux.montant),
      });
      setNewTravaux({ name: "", montant: "", devise: "EUR" });
      onClose();
    }
  };

  const handleClose = () => {
    setNewTravaux({ name: "", montant: "", devise: "EUR" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay1" onClick={handleClose}>
      <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header1">
          <h3>Ajouter un nouveau travaux</h3>
          <button className="modal-close-button" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-group1">
            <label htmlFor="travaux-name">Nom du travaux</label>
            <input
              type="text"
              id="travaux-name"
              name="name"
              placeholder="Ex: Isolation thermique"
              value={newTravaux.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="modal-form-group1">
            <label htmlFor="travaux-montant">Montant en euro</label>
            <div className="montant-input-group">
              <input
                type="number"
                id="travaux-montant"
                name="montant"
                placeholder="0.00"
                value={newTravaux.montant}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="modal-form-actions">
            <button type="button" className="cancel-button" onClick={handleClose}>
              Annuler
            </button>
            <button type="submit" className="add-button">
              <FontAwesomeIcon icon={faPlus} className="add-icon" />
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTravauxModal;