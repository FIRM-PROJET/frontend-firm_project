const API_URL = "http://localhost:5001/api";

export const UtilisateurService = {
  // Connexion utilisateur
  login: async (email, mot_de_passe) => {
    try {
      const response = await fetch(`${API_URL}/utilisateurs/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          mot_de_passe,
        }),
      });

      if (!response.ok) {
        throw new Error("Utilisateur ou mot de passe incorrect");
      }

      const data = await response.json();

      // Stocker le token et le matricule
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.matricule) {
        localStorage.setItem("matricule", data.matricule);
      } else if (data.utilisateur && data.utilisateur.matricule) {
        localStorage.setItem("matricule", data.utilisateur.matricule);
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Récupérer la liste de tous les utilisateurs
  getAllUtilisateurs: async () => {
    try {
      const response = await fetch(`${API_URL}/utilisateurs/`, {
        method: "GET",
      });   

      if (!response.ok) {
        throw new Error("Échec de la récupération des utilisateurs");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
      throw error;
    }
  },
  get_user_by_mail: async (email) => {
    try {
      const response = await fetch(`${API_URL}/utilisateurs/get_user/${email}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Aucun utilisateurs ne correspond a votre email");
      }

      return await response.json();
    } catch (error) {
      console.error("Aucun utilisateur", error);
      throw error;
    }
  },
  addUtilisateur: async (utilisateur) => {
    const response = await fetch(`${API_URL}/utilisateurs/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...utilisateur,
        mot_de_passe: "0000",
      }),
    });
    return await response.json();
  },

  updateUtilisateur: async (matricule, utilisateur) => {
    const response = await fetch(
      `${API_URL}/utilisateurs/update/${matricule}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(utilisateur),
      }
    );
    return await response.json();
  },

  checkCurrentPassword: async (matricule, mot_de_passe) => {
    const response = await fetch(
      `${API_URL}/utilisateurs/checkCurrentPassword/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, mot_de_passe }),
      }
    );
    return await response.json();
  },

  updatePassword: async (matricule, nouveauMotDePasse) => {
    const response = await fetch(`${API_URL}/utilisateurs/updatePassword/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricule, nouveauMotDePasse }),
    });
    return await response.json();
  },
  delete_user: async (matricule) => {
    try {
      const response = await fetch(
        `${API_URL}/utilisateurs/${matricule}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete module access");
      }
      return await response.json();
    } catch (error) {
      console.error("Error deleting module access:", error);
      throw error;
    }
  },
};
