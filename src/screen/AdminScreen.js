import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtilisateurService } from "../services/UtilisateurService";
import { ModuleService } from "../services/ModuleService";
import "../styles/AdminScreen.css";

const AdminScreen = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersData, modulesData] = await Promise.all([
          UtilisateurService.getAllUtilisateurs(),
          ModuleService.getAllModules()
        ]);
        setStats({
          totalUsers: usersData.length,
          totalModules: modulesData.length
        });
      } catch (err) {
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div className="admin-loading">Chargement...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Panneau d'Administration</h1>
        <p>Gestion des utilisateurs et de leurs droits d’accès aux modules</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-people-fill" style={{ fontSize: "24px" }}></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Utilisateurs Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <i className="bi bi-person-check-fill" style={{ fontSize: "24px" }}></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Utilisateurs Actifs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon modules">
            <i className="bi bi-sliders2-vertical" style={{ fontSize: "24px" }}></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalModules}</h3>
            <p>Modules Disponibles</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <div
          className="action-button primary"
          onClick={() => navigate("/admin/access")}
        >
          <i className="bi bi-shield-lock-fill" style={{ fontSize: "32px" }}></i>
          <h3>Gestion des Accès</h3>
          <p>Gérer les permissions d'accès aux modules pour chaque utilisateur</p>
        </div>

        <div
          className="action-button secondary"
          onClick={() => navigate("/admin/modify")}
        >
          <i className="bi bi-person-fill-gear" style={{ fontSize: "32px" }}></i>
          <h3>Modifier Utilisateurs</h3>
          <p>Modifier les informations des utilisateurs existants</p>
        </div>

        <div
          className="action-button tertiary"
          onClick={() => navigate("/admin/add")}
        >
          <i className="bi bi-person-plus-fill" style={{ fontSize: "32px" }}></i>
          <h3>Ajouter Utilisateur</h3>
          <p>Créer un nouveau compte utilisateur dans le système</p>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
