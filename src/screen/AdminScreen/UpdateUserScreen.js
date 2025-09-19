import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UtilisateurService } from "../../services/UtilisateurService";
import "../../styles/AdminCSS/UserListWithModal.css";

const UpdateUserScreen = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await UtilisateurService.getAllUtilisateurs();
        setUsers(data);
      } catch (err) {
        setError("Erreur de chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openModal = (user) => {
    setSelectedUser({ ...user });
    setIsModalOpen(true);
    setError("");
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
    setError("");
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
    setError("");
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setIsDeleteModalOpen(false);
    setDeleteConfirmText("");
    setError("");
  };

  const handleChange = (e) => {
    setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      if (!selectedUser.nom || !selectedUser.email) {
        setError("Tous les champs obligatoires doivent être remplis");
        return;
      }
      await UtilisateurService.updateUtilisateur(
        selectedUser.matricule,
        selectedUser
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.matricule === selectedUser.matricule ? selectedUser : u
        )
      );
      closeModal();
    } catch (err) {
      setError("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER CET UTILISATEUR") {
      setError("Veuillez saisir correctement la phrase de confirmation.");
      return;
    }

    try {
      await UtilisateurService.delete_user(selectedUser.matricule);
      setUsers((prev) =>
        prev.filter((u) => u.matricule !== selectedUser.matricule)
      );
      closeDeleteModal();
    } catch (err) {
      setError("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  if (loading) {
    return (
      <div className="user-list-container">
        <div style={{ textAlign: "center", padding: "2rem", color: "#7153b9" }}>
          Chargement des utilisateurs...
        </div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <button className="back-button2" onClick={() => navigate(-1)}>
        <i className="bi bi-caret-left-fill"></i> Retour
      </button>

      <h2 className="user-title">Liste des Utilisateurs</h2>
      {error && <p className="error-message">{error}</p>}

      <table className="user-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Poste</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.matricule}>
              <td>{user.nom}</td>
              <td>{user.email}</td>
              <td>{user.intitule_poste}</td>
              <td>
                <button className="btn-edit" onClick={() => openModal(user)}>
                  Modifier
                </button>
                <button
                  className="btn-delete1"
                  onClick={() => openDeleteModal(user)}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL de mise à jour */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
            <h3>Modifier l'utilisateur</h3>
            {error && <p className="error-message">{error}</p>}

            <input
              type="text"
              name="nom"
              value={selectedUser.nom || ""}
              onChange={handleChange}
              placeholder="Nom *"
            />
            <input
              type="email"
              name="email"
              value={selectedUser.email || ""}
              onChange={handleChange}
              placeholder="Email *"
            />
            <input
              type="text"
              name="intitule_poste"
              value={selectedUser.intitule_poste || ""}
              onChange={handleChange}
              placeholder="Poste"
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button className="btn-save" onClick={handleUpdate}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL de suppression */}
      {isDeleteModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
            <h3>Supprimer l'utilisateur</h3>
            <p>
              Tapez <strong>SUPPRIMER CET UTILISATEUR</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Confirmation"
            />
            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeDeleteModal}>
                Annuler
              </button>
              <button className="btn-delete1" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateUserScreen;
