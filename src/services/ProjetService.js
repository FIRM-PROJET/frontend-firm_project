const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api/m_projets";

export const ProjetService = {
  // ==================== PROJETS ====================
  createProject: async (projectData) => {
    const response = await fetch(`${API_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });
    return await response.json();
  },

  getAllProjects: async () => {
    const response = await fetch(`${API_URL}/projets`);
    return await response.json();
  },

  // ==================== PHASES ====================
  getAllPhases: async () => {
    const response = await fetch(`${API_URL}/phases`);
    return await response.json();
  },

  getPhaseProgress: async (ref_projet, id_phase) => {
    const response = await fetch(
      `${API_URL}/phase-progress?ref_projet=${ref_projet}&id_phase=${id_phase}`
    );
    return await response.json();
  },

  createProjectPhase: async (phaseData) => {
    const response = await fetch(`${API_URL}/projet_phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phaseData),
    });
    return await response.json();
  },

  getPhasesByProject: async (refProjet) => {
    const response = await fetch(`${API_URL}/phase_projet/${refProjet}`);
    return await response.json();
  },

  // ==================== UTILISATEURS PAR PHASE ====================
  assignUserToPhase: async (userData) => {
    const response = await fetch(`${API_URL}/add_user_phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  removeUserFromPhase: async (userData) => {
    const response = await fetch(`${API_URL}/delete_user_phase`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  getUsersByPhase: async (userPhaseData) => {
    const response = await fetch(`${API_URL}/user_phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPhaseData),
    });
    return await response.json();
  },

  deleteProjectPhase: async (refProjet, idPhase) => {
    const response = await fetch(`${API_URL}/phase/${refProjet}/${idPhase}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  updateProjectPhase: async (phaseData) => {
    const response = await fetch(`${API_URL}/phase`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phaseData),
    });
    return await response.json();
  },

  updateProjectFinReelle: async (phaseData) => {
    const response = await fetch(`${API_URL}/phase/fin_reelle`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phaseData),
    });
    return await response.json();
  },
};
