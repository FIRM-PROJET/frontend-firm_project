import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { UtilisateurService } from "../../services/UtilisateurService";
import "../../styles/AdminCSS/UserForm.css";

const AddUserScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    intitule_poste: "",
    mot_de_passe: "0000",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await UtilisateurService.addUtilisateur(form);
      navigate("/admin/access");
    } catch (err) {
      setError("Erreur lors de l'ajout de l'utilisateur");
    }
  };

  return (
    <div className="form-container-add">
       <button className="back-button3" onClick={() => navigate(-1)}>
          <i className="bi bi-caret-left-fill"></i> Retour
        </button>
      <div className="add-content">
       
        <h2>Ajouter un Utilisateur</h2>
        {error && <p className="add-error">{error}</p>}
        <input
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
        />
        <input
          name="prenom"
          placeholder="Prenom"
          value={form.prenom}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="intitule_poste"
          placeholder="Poste"
          value={form.intitule_poste}
          onChange={handleChange}
        />
        <button onClick={handleSubmit}>Ajouter</button>
      </div>
    </div>
  );
};

export default AddUserScreen;
