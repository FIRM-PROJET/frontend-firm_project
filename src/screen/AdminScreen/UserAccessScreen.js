import React, { useState, useEffect } from "react";
import { ModuleService } from "../../services/ModuleService";
import { UtilisateurService } from "../../services/UtilisateurService";
import { useNavigate } from "react-router-dom";
import Switch from "react-switch";
import "../../styles/AdminCSS/UserAccessScreen.css";

const UserAccessScreen = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [userModules, setUserModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, modulesData] = await Promise.all([
        UtilisateurService.getAllUtilisateurs(),
        ModuleService.getAllModules(),
      ]);

      setUsers(usersData);
      setModules(modulesData);
      const userModulesData = {};
      for (const user of usersData) {
        const modules = await ModuleService.getUserModules(user.matricule);
        userModulesData[user.matricule] = modules.map((m) => m.ref_module);
      }
      setUserModules(userModulesData);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      setLoading(false);
    }
  };

  const toggleModuleAccess = async (ref_module, matricule) => {
    try {
      const currentUserModules = userModules[matricule] || [];
      const hasAccess = currentUserModules.includes(ref_module);

      if (hasAccess) {
        await ModuleService.removeModuleAccess(ref_module, matricule);
        setUserModules((prev) => ({
          ...prev,
          [matricule]: prev[matricule].filter((id) => id !== ref_module),
        }));
      } else {
        await ModuleService.addNewModuleAccess(ref_module, matricule);
        setUserModules((prev) => ({
          ...prev,
          [matricule]: [...(prev[matricule] || []), ref_module],
        }));
      }
    } catch (err) {
      setError("Erreur lors de la modification des accès");
    }
  };

  if (loading) {
    return <div className="admin-loading">Chargement...</div>;
  }

  return (
    <div className="admin-content">
      <button className="back-button1" onClick={() => navigate(-1)}>
        <i className="bi bi-caret-left-fill"></i>
        Retour
      </button>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Gestion des Accès Utilisateurs</h2>
        </div>
        <div className="admin-legend">
          <div className="legend-item">
            <span className="legend-circle green"></span>
            Accès autorisé
          </div>
          <div className="legend-item">
            <span className="legend-circle red"></span>
            Accès refusé
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              {modules.map((module) => (
                <th key={module.ref_module}>
                 
                  <span className="module-setting"> <i className="bi bi-gear-fill icon-space"></i>{module.nom_module}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, userIndex) => (
              <tr key={user.matricule}>
                <td>
                  <div className="user-info">
                    <div className="user-name">
                      {user.prenom} {user.nom}
                    </div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-poste">
                      Poste : {user.intitule_poste}
                    </div>
                  </div>
                </td>
                {modules.map((module) => {
                  const hasAccess = (
                    userModules[user.matricule] || []
                  ).includes(module.ref_module);
                  return (
                    <td key={module.ref_module} className="switch-cell">
                      <Switch
                        onChange={() =>
                          toggleModuleAccess(module.ref_module, user.matricule)
                        }
                        checked={hasAccess}
                        offColor="#d4bcdd"
                        onColor="#7153b9"
                        uncheckedIcon={false}
                        checkedIcon={false}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAccessScreen;
