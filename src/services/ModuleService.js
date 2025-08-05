const API_URL = "http://localhost:5001/api";

export const ModuleService = {
  // Récupère les modules accessibles pour un utilisateur (par matricule)
  getUserModules: async (matricule) => {
    try {
      const response = await fetch(
        `${API_URL}/utilisateurs/modelAccess/${matricule}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching modules:", error);
      throw error;
    }
  },

  // Ajoute un nouveau module à un utilisateur
  addNewModuleAccess: async (ref_module, matricule) => {
    try {
      const response = await fetch(`${API_URL}/modules/add_new_module_access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref_module, matricule }),
      });

      if (!response.ok) {
        throw new Error("Failed to add module access");
      }
      return await response.json();
    } catch (error) {
      console.error("Error adding module access:", error);
      throw error;
    }
  },

  // Récupère la liste de tous les modules existants
  getAllModules: async () => {
    try {
      const response = await fetch(`${API_URL}/modules/`, {});
      if (!response.ok) {
        throw new Error("Failed to fetch all modules");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all modules:", error);
      throw error;
    }
  },
  // Supprime l'accès à un module pour un utilisateur
  removeModuleAccess: async (ref_module, matricule) => {
    try {
      const response = await fetch(
        `${API_URL}/modules/delete_module_access/${ref_module}/${matricule}`,
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
  isUserAdmin: async (matricule) => {
    const response = await fetch(`${API_URL}/modules/is_admin/${matricule}`);
    return await response.json();
  }
};
