const API_URL = "http://localhost:5001/api";
export const DevisService = {
  getAllDevis: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Impossible de charger les devis");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching devis:", error);
      throw error;
    }
  },
  getAllProjetsPhase: async () => {
    const response = await fetch(`${API_URL}/projets/all_projet_phases`);
    return await response.json();
  },
  getTypesSurfaces: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/types_surfaces`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  getTypeConstruction: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/type_construction`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Impossible de charger les types de construction");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching devis:", error);
      throw error;
    }
  },
  getDetailsProjet: async (id_projet) => {
    try {
      const response = await fetch(
        `${API_URL}/projets/project_details/${id_projet}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de charger les devis");
      }
      const data = await response.json();
      //   console.log('Devis response:', data);
      return data[0];
    } catch (error) {
      console.error("Error fetching devis:", error);
      throw error;
    }
  },
  getProjects_OrderBy_typeConstruction: async (id_type_construction) => {
    try {
      const response = await fetch(
        `${API_URL}/projets/project_referrent/${id_type_construction}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de charger les types de construction");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching devis:", error);
      throw error;
    }
  },
  get_projects_devis_name: async (id_project) => {
    try {
      // console.log("Calling API for project files:", id_project);
      const response = await fetch(
        `${API_URL}/projets/files_project/${id_project}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error("Impossible de charger les fichiers du projet");
      }
      const data = await response.json();
      // console.log("API response for files:", data);
      return data;
    } catch (error) {
      console.error("Error fetching project files:", error);
      throw error;
    }
  },
  get_projects_devis_excel: async (id_project) => {
    try {
      const response = await fetch(
        `${API_URL}/projets/devis_files_project/${id_project}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error("Impossible de charger les fichiers du projet");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching project files:", error);
      throw error;
    }
  },
  get_projects_surface: async (id_project) => {
    try {
      // console.log("Calling API for project files:", id_project);
      const response = await fetch(
        `${API_URL}/projets/surface_projet/${id_project}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error("Impossible de charger les fichiers du projet");
      }
      const data = await response.json();
      // console.log("API response for files:", data);
      return data;
    } catch (error) {
      console.error("Error fetching project files:", error);
      throw error;
    }
  },
  async downloadProjectFile(fileName) {
    try {
      console.log("Attempting to download file:", fileName);
      const response = await fetch(
        `${API_URL}/projets/devisFiles/${fileName}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(
          `Erreur lors du téléchargement du fichier: ${response.status} ${response.statusText}`
        );
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/octet-stream")) {
        console.warn("Type de contenu inattendu:", contentType);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur détaillée lors du téléchargement:", error);
      throw new Error(
        `Erreur lors du téléchargement du fichier: ${error.message}`
      );
    }
  },
  async downloadImageFile(fileName) {
    try {
      console.log("Attempting to download file:", fileName);
      const response = await fetch(
        `${API_URL}/projets/imagesFiles/${fileName}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(
          `Erreur lors du téléchargement du fichier: ${response.status} ${response.statusText}`
        );
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/octet-stream")) {
        console.warn("Type de contenu inattendu:", contentType);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur détaillée lors du téléchargement:", error);
      throw new Error(
        `Erreur lors du téléchargement du fichier: ${error.message}`
      );
    }
  },
  async get_devis_contents(fileNames, selectedIds) {
    try {
      const allResults = {};

      const fileList = Array.isArray(fileNames) ? fileNames : [fileNames];

      for (const fileName of fileList) {
        const response = await fetch(
          `${API_URL}/projets/readExcel/${fileName}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(`Échec de chargement du fichier : ${fileName}`);
        }

        const data = await response.json();

        for (const id of selectedIds) {
          const entry = data.find((item) => item.id_travaux === id);
          if (entry) {
            if (!allResults[id]) {
              allResults[id] = {
                nom_travaux: entry.nom_travaux, // on stocke une seule fois le nom
                montants: [],
              };
            }
            allResults[id].montants.push(entry.montant);
          }
        }
      }

      // Calcul des moyennes
      const result = selectedIds.map((id) => {
        const entry = allResults[id] || { montants: [], nom_travaux: null };
        const moyenne =
          entry.montants.length > 1
            ? entry.montants.reduce((sum, m) => sum + m, 0) /
              entry.montants.length
            : entry.montants[0] ?? null;

        return {
          id_travaux: id,
          nom_travaux: entry.nom_travaux,
          montant: moyenne,
        };
      });

      console.log("Résultat des montants moyens :", result);
      return result;
    } catch (error) {
      console.error("Erreur dans get_excel_contents :", error);
      throw error;
    }
  },
  getFondations: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/fondation`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  getClients: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/client`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  getMenuiserie: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/menuiserie`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  getStructure: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/structure`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  getToiture: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/toiture`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  get_type_plancher: async () => {
    try {
      const response = await fetch(`${API_URL}/projets/type_plancher`, {
        method: "GET",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching types of surfaces:", error);
      throw error;
    }
  },
  uploadDevisFile: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/projets/upload_devis`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload du devis");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur upload devis:", error);
      throw error;
    }
  },
  uploadImageFile: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/projets/upload_image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload de l'image");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur upload image:", error);
      throw error;
    }
  },

  createProject: async (projectData) => {
    try {
      const response = await fetch(`${API_URL}/projets/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du projet");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur création projet:", error);
      throw error;
    }
  },
  createProjectDetails: async (detailsData) => {
    try {
      const response = await fetch(`${API_URL}/projets/add_project_details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(detailsData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout des détails du projet");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur création détails projet:", error);
      throw error;
    }
  },
  createClient: async (clienData) => {
    try {
      const response = await fetch(`${API_URL}/projets/create_client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout des détails du projet");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur création détails projet:", error);
      throw error;
    }
  },
  getImageUrl: (filename) => {
    return `${API_URL}/projets/view-image/${filename}`;
  },
};
