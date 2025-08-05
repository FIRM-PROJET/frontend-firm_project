const API_URL = "http://localhost:5001/api/devis";

export const ValidationDevisService = {
  ajouterDevis: async (ficheData) => {
    const response = await fetch(`${API_URL}/new_devis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ficheData),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'ajout du devis");
    }

    return await response.json();
  },
  getAllEstimations: async () => {
    const response = await fetch(`${API_URL}/`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des estimations");
    }

    return await response.json();
  },
  getEstimationDetails: async (id_fiche) => {
    const response = await fetch(`${API_URL}/devis_details/${id_fiche}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des détails du devis");
    }

    return await response.json();
  },
  get_travaux_name: async (id_travaux) => {
    const response = await fetch(`${API_URL}/nom_travaux/${id_travaux}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des détails du devis");
    }

    return await response.json().nom_travaux;
  },
  deleteEstimation: async (id_fiche_estimation) => {
  const response = await fetch(`${API_URL}/${id_fiche_estimation}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du devis");
  }

  return await response.json();
},
 getPreviousProjetReferrent: async (codeFiche) => {
    const response = await fetch(`${API_URL}/prev_projects/${codeFiche}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des projets référents précédents");
    }

    return await response.json();
  },
};
