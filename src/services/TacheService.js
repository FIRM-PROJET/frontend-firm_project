const API_URL = "http://localhost:5001/api";

export const TacheService = {
  // Récupère les détails d'une tâche par sa référence
  getTacheDetails: async (ref_tache) => {
    try {
      const response = await fetch(
        `${API_URL}/tache/details_taches/${ref_tache}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tache details");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching tache details:", error);
      throw error;
    }
  },
  AvancementParPhases: async () => {
    const response = await fetch(`${API_URL}/tache/avancementParPhase`);
    return await response.json();
  },
  AvancementParProjet: async () => {
    const response = await fetch(`${API_URL}/tache/avancementParProjet`);
    return await response.json();
  },

  // Récupère les détails d'une sous-tâche par sa référence
  getSousTacheDetails: async (ref_sous_taches) => {
    try {
      const response = await fetch(
        `${API_URL}/tache/details_sous-taches/${ref_sous_taches}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sous-tache details");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching sous-tache details:", error);
      throw error;
    }
  },
  get_unite_duree: async () => {
    const response = await fetch(`${API_URL}/tache/unite_duree/`);
    return await response.json();
  },

  // Supprime une tâche
  deleteTache: async (ref_tache) => {
    try {
      const response = await fetch(
        `${API_URL}/tache/delete_taches/${ref_tache}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete tache");
      }
      return await response.json();
    } catch (error) {
      console.error("Error deleting tache:", error);
      throw error;
    }
  },

  // Supprime une sous-tâche
  deleteSousTache: async (ref_sous_tache) => {
    try {
      const response = await fetch(
        `${API_URL}/tache/delete_sous-taches/${ref_sous_tache}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete sous-tache");
      }
      return await response.json();
    } catch (error) {
      console.error("Error deleting sous-tache:", error);
      throw error;
    }
  },

  // Récupère toutes les tâches pour le dashboard
  getAllTaches: async () => {
    try {
      const response = await fetch(`${API_URL}/tache/`);
      if (!response.ok) {
        throw new Error("Failed to fetch all taches");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all taches:", error);
      throw error;
    }
  },

  getSubTasks: async (ref_projet) => {
    try {
      const response = await fetch(`${API_URL}/tache/sous_tache/${ref_projet}`);
      if (!response.ok) {
        throw new Error("Failed to fetch all taches");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all taches:", error);
      throw error;
    }
  },

  // Récupère toutes les tâches pour une perso
  get_user_task: async (matricule) => {
    try {
      const response = await fetch(`${API_URL}/tache/user_task/${matricule}`);
      if (!response.ok) {
        throw new Error("Failed to fetch all taches");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all taches:", error);
      throw error;
    }
  },

  createTache: async (tacheData) => {
    try {
      const response = await fetch(`${API_URL}/tache/create_tache`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // très important
        },
        body: JSON.stringify(tacheData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // essaye de lire les détails de l’erreur
        console.error("Backend error:", errorData); // log plus complet
        throw new Error("Failed to create tache");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating tache:", error);
      throw error;
    }
  },
  async createSousTache(data) {
    try {
      const response = await fetch(
        "http://localhost:5001/api/tache/create_sous_tache",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const backendError1 = await response.text();
        console.error("Backend error1:", backendError1);
        const backendError = await response.json().catch(() => ({}));
        console.error("Backend error:", backendError);
        throw new Error("Failed to create tache");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating tache:", error);
      throw error;
    }
  },

  // Ajouter un utilisateurs à une tache
  assign_user_tache: async (tacheData) => {
    try {
      const response = await fetch(`${API_URL}/tache/assign_user_tache`, {
        method: "POST",
        body: JSON.stringify(tacheData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to create tache");
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating tache:", error);
      throw error;
    }
  },
  // Ajouter un utilisateurs à une tache
  assign_user_sous_tache: async (tacheData) => {
    try {
      const response = await fetch(`${API_URL}/tache/assign_user_sous_tache`, {
        method: "POST",
        body: JSON.stringify(tacheData),
      });
      if (!response.ok) {
        throw new Error("Failed to create tache");
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating tache:", error);
      throw error;
    }
  },
  // Modifier le statut de la tache
  UpdateTacheTermine: async (tacheData) => {
    const response = await fetch(`${API_URL}/tache/statut_termine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tacheData),
    });
    if (!response.ok) throw new Error();
    return await response.json();
  },

  UpdateTacheEnCours: async (tacheData) => {
    const response = await fetch(`${API_URL}/tache/statut_en_cours`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tacheData),
    });
    if (!response.ok) throw new Error();
    return await response.json();
  },

  
  UpdateSousTacheTermine: async (tacheData) => {
    const response = await fetch(`${API_URL}/tache/statut_termine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tacheData),
    });
    if (!response.ok) throw new Error();
    return await response.json();
  },

  UpdateSousTacheEnCours: async (tacheData) => {
    const response = await fetch(`${API_URL}/tache/statut_en_cours`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tacheData),
    });
    if (!response.ok) throw new Error();
    return await response.json();
  },

  create_comment: async (comments_data) => {
    try {
      const response = await fetch(`${API_URL}/commentaires/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(comments_data),
      });
      if (!response.ok) {
        throw new Error("Failed to create tache");
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating tache:", error);
      throw error;
    }
  },
  get_task_comment: async (ref_tache) => {
    try {
      const response = await fetch(
        `${API_URL}/commentaires/get_c_tache/${ref_tache}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch all comments tasks");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all taches:", error);
      throw error;
    }
  },
  get_task_finished_by_user: async (matricule) => {
    try {
      const response = await fetch(
        `${API_URL}/accomplies/${matricule}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch all completed tasks by user");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all taches:", error);
      throw error;
    }
  },
  get_sub_task_comment: async (ref_sous_tache) => {
    try {
      const response = await fetch(
        `${API_URL}/commentaires/get_c_sous_tache/${ref_sous_tache}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch all sub-tasks comments");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all taches:", error);
      throw error;
    }
  },
  getTacheFiles: async (ref_tache) => {
    try {
      const response = await fetch(`${API_URL}/tache/task_files/${ref_tache}`);
      if (!response.ok) {
        throw new Error("Échec de la récupération des fichiers de la tâche");
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur récupération fichiers tâche:", error);
      throw error;
    }
  },
  getAllTacheFiles: async () => {
    try {
      const response = await fetch(`${API_URL}/tache/all_files`);
      if (!response.ok) {
        throw new Error("Échec de la récupération de tous les fichiers");
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur récupération tous les fichiers:", error);
      throw error;
    }
  },
  uploadTacheFile: async (ref_tache, file) => {
    try {
      const formData = new FormData();
      formData.append("ref_tache", ref_tache);
      formData.append("file", file);

      const response = await fetch(`${API_URL}/tache/task_files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Échec de l'upload du fichier");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur upload fichier tâche:", error);
      throw error;
    }
  },
  downloadTacheFile: async (filename) => {
    try {
      const response = await fetch(
        `${API_URL}/tache/download_files/${filename}`
      );
      if (!response.ok) {
        throw new Error("Échec du téléchargement");
      }

      const blob = await response.blob();

      // Crée un lien pour forcer le téléchargement dans le navigateur
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement fichier:", error);
      throw error;
    }
  },
};
