import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ModuleService } from '../services/ModuleService';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const matricule = localStorage.getItem('matricule');
        if (!matricule) throw new Error('Matricule non trouvé');
        const userModules = await ModuleService.getUserModules(matricule);
        const accueilModule = { ref_module: 'home', nom_module: 'Accueil' };
        setModules([accueilModule, ...userModules]);
      } catch (err) {
        console.error('Erreur:', err);
        setError("Erreur lors du chargement des modules");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const getModuleIconClass = (moduleName) => {
    const iconClassMap = {
      'Accueil': 'bi-house-door-fill',
      'Devis': 'bi-file-earmark-bar-graph-fill',
      'Tâches': 'bi bi-ui-checks',
      'Phases': 'bi bi-diagram-3-fill',
      'Projets': 'bi bi-folder-fill',
      'Statistiques': 'bi-bar-chart-fill',
      'Entreprises': 'bi-buildings-fill',
      'Paramètres': 'bi-gear-fill',
      'Admin': 'bi-shield-shaded',
      'Utilisateurs': 'bi-people-fill',
    };
    return iconClassMap[moduleName] || 'bi-box';
  };

  if (loading) {
    return (
      <div className="navbar">
        <div className="navbar-logo">
          <img src="/img/logo_firm.jpg" alt="Firm Project Logo" className="logo-img" />
        </div>
        <div className="navbar-loading">
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="navbar">
        <div className="navbar-logo">
          <img src="/img/logo_firm.jpg" alt="Firm Project Logo" className="logo-img" />
        </div>
        <div className="navbar-error">
          Erreur
        </div>
      </div>
    );
  }

  return (
    <div className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="navbar-brand">
          <img src="/img/logo_firm.jpg" alt="Firm Project Logo" className="logo-img" />
        </Link>
      </div>

      <div className="navbar-modules">
        {modules.map((module) => {
          const iconClass = getModuleIconClass(module.nom_module);
          // const nomAffiche = module.nom_module === 'Taches' ? 'Tâches' : module.nom_module;
          const nomAffiche = module.nom_module;

          return (
            <div
              key={module.ref_module}
              className="navbar-item"
              onClick={() => navigate(`/${module.ref_module.toLowerCase()}`)}
            >
              <div className="navbar-item-content">
                <i className={`bi ${iconClass} navbar-icon`}></i>
                <span className="navbar-text">{nomAffiche}</span>
              </div>
              <div className="navbar-item-gradient"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Navbar;