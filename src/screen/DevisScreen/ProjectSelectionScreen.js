import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomSelect from "../../components/CustomSelect";

import {
  faSearch,
  faBuilding,
  faCheck,
  faInfoCircle,
  faPercent,
  faFilter,
  faTimes,
  faLayerGroup,
  faRuler,
  faMountain,
  faWindowMaximize,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import { DevisService } from "../../services/DevisService";
import ProjectDetailsModal from "../../modals/ProjectDetailsModal";
import "../../styles/DevisCSS/ProjectSelectionScreen.css";

const ProjectSelectionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // États pour la recherche par similarité
  const [showSimilaritySearch, setShowSimilaritySearch] = useState(false);
  const [projectsWithSimilarity, setProjectsWithSimilarity] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    nombre_etages: "",
    surface_totale: "",
    structure: "",
    toiture: "",
    menuiserie: "",
    type_plancher: "",
    fondation: "",
  });
  const [similarityApplied, setSimilarityApplied] = useState(false);

  // États pour les options des select
  const [selectOptions, setSelectOptions] = useState({
    fondations: [],
    menuiseries: [],
    structures: [],
    toitures: [],
    typePlanchers: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Charger les options des select
  useEffect(() => {
    const fetchSelectOptions = async () => {
      setLoadingOptions(true);
      try {
        const [fondations, menuiseries, structures, toitures, typePlanchers] =
          await Promise.all([
            DevisService.getFondations(),
            DevisService.getMenuiserie(),
            DevisService.getStructure(),
            DevisService.getToiture(),
            DevisService.get_type_plancher(),
          ]);

        setSelectOptions({
          fondations,
          menuiseries,
          structures,
          toitures,
          typePlanchers,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des options:", error);
        setError("Erreur lors du chargement des options de sélection");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchSelectOptions();
  }, []);

  // Calculer le pourcentage de ressemblance
  const calculateSimilarity = (projectDetails, searchCriteria) => {
    const criteria = [
      "nombre_etages",
      "surface_totale",
      "structure",
      "toiture",
      "menuiserie",
      "type_plancher",
      "fondation",
    ];

    let matches = 0;
    let totalCriteria = 0;

    criteria.forEach((criterion) => {
      if (
        searchCriteria[criterion] &&
        searchCriteria[criterion].toString().trim() !== ""
      ) {
        totalCriteria++;

        if (criterion === "surface_totale" || criterion === "nombre_etages") {
          const searchValue = parseFloat(searchCriteria[criterion]);
          const projectValue = parseFloat(projectDetails[criterion]);

          if (criterion === "surface_totale") {
            // Marge de 10% pour la surface
            const margin = searchValue * 0.1;
            if (Math.abs(searchValue - projectValue) <= margin) {
              matches++;
            }
          } else {
            // Égalité exacte pour le nombre d'étages
            if (searchValue === projectValue) {
              matches++;
            }
          }
        } else {
          // Pour les valeurs textuelles, comparaison insensible à la casse
          if (
            projectDetails[criterion] &&
            projectDetails[criterion].toString().toLowerCase() ===
              searchCriteria[criterion].toString().toLowerCase()
          ) {
            matches++;
          }
        }
      }
    });

    return totalCriteria > 0 ? Math.round((matches / totalCriteria) * 100) : 0;
  };

  // Appliquer la recherche par similarité
  const applySimilaritySearch = async () => {
    try {
      setLoading(true);

      // Récupérer les détails de tous les projets
      const projectsWithDetails = await Promise.all(
        projects.map(async (project) => {
          try {
            const details = await DevisService.getDetailsProjet(
              project.id_projet
            );
            const similarity = calculateSimilarity(details, searchCriteria);
            return {
              ...project,
              details,
              similarity,
            };
          } catch (error) {
            console.error(`Erreur pour le projet ${project.id_projet}:`, error);
            return {
              ...project,
              similarity: 0,
            };
          }
        })
      );

      // Trier par similarité décroissante, puis par nom
      const sortedProjects = projectsWithDetails.sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        return a.nom_projet.localeCompare(b.nom_projet);
      });

      setProjectsWithSimilarity(sortedProjects);
      setSimilarityApplied(true);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la recherche par similarité:", error);
      setError("Erreur lors de la recherche par similarité");
      setLoading(false);
    }
  };

  // Réinitialiser la recherche par similarité
  const resetSimilaritySearch = () => {
    setProjectsWithSimilarity([]);
    setSimilarityApplied(false);
    setSearchCriteria({
      nombre_etages: "",
      surface_totale: "",
      structure: "",
      toiture: "",
      menuiserie: "",
      type_plancher: "",
      fondation: "",
    });
    setShowSimilaritySearch(false);
  };

  const handleInputChange = (field, value) => {
    setSearchCriteria((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSimilaritySearch = (e) => {
    e.preventDefault();
    applySimilaritySearch();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const typeId = location.state?.selectedType;
        if (!typeId) {
          throw new Error("Type de construction non spécifié");
        }
        const data = await DevisService.getProjects_OrderBy_typeConstruction(
          typeId
        );
        setProjects(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProjects();
  }, [location.state]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleViewDetails = async (project) => {
    try {
      let details;
      if (project.details) {
        details = project.details;
      } else {
        details = await DevisService.getDetailsProjet(project.id_projet);
      }
      setSelectedProjectDetails(details);
      setSelectedProject(project);
    } catch (err) {
      setError("Erreur lors du chargement des détails du projet");
    }
  };

  const handleCloseModal = () => {
    setSelectedProjectDetails(null);
    setSelectedProject(null);
  };

  // Utiliser les projets avec similarité si disponibles, sinon les projets normaux
  const displayProjects = similarityApplied ? projectsWithSimilarity : projects;
  const filteredProjects = displayProjects.filter((project) =>
    project.nom_projet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleValidate = () => {
    const finalData = {
      selectedProjects: displayProjects.filter((p) =>
        selectedProjects.includes(p.id_projet)
      ),
      previousData: location.state?.previousData,
    };

    console.log("Données finales:", finalData);
    navigate("/devis/etape2", { state: finalData });
  };

  if (loading) {
    return <div className="loading">Chargement des projets référents...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="container2">
      <div className="header">
        <button className="back-button3" onClick={() => navigate(-1)}>
          <i className="bi bi-caret-left-fill"></i> Retour
        </button>
        <h2 className="title1">
          Etape 2 : Choix du projets référents -{" "}
          {location.state?.typeInfo?.nom_type_construction}
        </h2>

        <div className="search-controls">
          <div className="search-container1">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="search-input1"
              placeholder="Rechercher un projet référent..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <button
            className="similarity-toggle-button"
            onClick={() => setShowSimilaritySearch(!showSimilaritySearch)}
          >
            <FontAwesomeIcon icon={faFilter} />
            Recherche par similarité
          </button>

          {similarityApplied && (
            <button
              className="reset-similarity-button"
              onClick={resetSimilaritySearch}
            >
              <FontAwesomeIcon icon={faTimes} />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Formulaire de recherche par similarité */}
      {showSimilaritySearch && (
        <div className="similarity-search-container">
          <form onSubmit={handleSimilaritySearch} className="similarity-form">
            <h3>
              <FontAwesomeIcon icon={faFilter} />
              Critères de recherche par similarité
            </h3>

            {loadingOptions && (
              <div className="loading-options">Chargement des options...</div>
            )}

            <div className="criteria-grid">
              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Nombre d'étages
                </label>
                <input
                  type="number"
                  value={searchCriteria.nombre_etages}
                  onChange={(e) =>
                    handleInputChange("nombre_etages", e.target.value)
                  }
                  placeholder="ex: 3"
                />
              </div>

              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faRuler} />
                  Surface totale (m²)
                </label>
                <input
                  type="number"
                  value={searchCriteria.surface_totale}
                  onChange={(e) =>
                    handleInputChange("surface_totale", e.target.value)
                  }
                  placeholder="ex: 686"
                />
              </div>

              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faBuilding} />
                  Structure
                </label>
                <CustomSelect
                  value={searchCriteria.structure}
                  onChange={(value) => handleInputChange("structure", value)}
                  options={selectOptions.structures}
                  placeholder="Sélectionner une structure"
                  isDisabled={loadingOptions}
                />
              </div>

              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faMountain} />
                  Toiture
                </label>
                <CustomSelect
                  value={searchCriteria.toiture}
                  onChange={(value) => handleInputChange("toiture", value)}
                  options={selectOptions.toitures}
                  placeholder="Sélectionner une toiture"
                  isDisabled={loadingOptions}
                />
              </div>

              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faWindowMaximize} />
                  Menuiserie
                </label>
                <CustomSelect
                  value={searchCriteria.menuiserie}
                  onChange={(value) => handleInputChange("menuiserie", value)}
                  options={selectOptions.menuiseries}
                  placeholder="Sélectionner une menuiserie"
                  isDisabled={loadingOptions}
                />
              </div>

              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Type de plancher
                </label>
                <CustomSelect
                  value={searchCriteria.type_plancher}
                  onChange={(value) => handleInputChange("type_plancher", value)}
                  options={selectOptions.typePlanchers}
                  placeholder="Sélectionner un type de plancher"
                  isDisabled={loadingOptions}
                />
                
              </div>

              <div className="criteria-field">
                <label>
                  <FontAwesomeIcon icon={faHome} />
                  Fondation
                </label>
                <CustomSelect
                  value={searchCriteria.fondation}
                  onChange={(value) => handleInputChange("fondation", value)}
                  options={selectOptions.fondations}
                  placeholder="Sélectionner une fondation"
                  isDisabled={loadingOptions}
                />
                
              </div>
            </div>

            <div className="similarity-form-buttons">
              <button
                type="submit"
                className="apply-similarity-button"
                disabled={loadingOptions}
              >
                <FontAwesomeIcon icon={faSearch} />
                Appliquer la recherche
              </button>
              <button
                type="button"
                onClick={() => setShowSimilaritySearch(false)}
                className="cancel-button"
              >
                <FontAwesomeIcon icon={faTimes} />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-list">
        {filteredProjects.map((project) => (
          <div key={project.id_projet} className="project-card">
            <div className="project-checkbox">
              <input
                type="checkbox"
                id={`project-${project.id_projet}`}
                checked={selectedProjects.includes(project.id_projet)}
                onChange={() => handleProjectSelect(project.id_projet)}
              />
            </div>
            <div className="project-content">
              <div className="project-header">
                <FontAwesomeIcon icon={faBuilding} className="project-icon" />
                <h3 className="project-title">{project.nom_projet}</h3>

                {/* Affichage du pourcentage de similarité */}
                {similarityApplied &&
                  typeof project.similarity !== "undefined" && (
                    <div className="similarity-badge">
                      <FontAwesomeIcon icon={faPercent} />
                      {project.similarity}%
                    </div>
                  )}

                <button
                  className="details-button"
                  onClick={() => handleViewDetails(project)}
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  Détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="no-projects">
          <p>Aucun projet trouvé pour ce type de construction</p>
        </div>
      )}

      {selectedProjectDetails && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          details={selectedProjectDetails}
          onClose={handleCloseModal}
        />
      )}

      <div className="footer">
        <div className="selection-info">
          {selectedProjects.length > 0 && (
            <span>{selectedProjects.length} projet(s) sélectionné(s)</span>
          )}
          {similarityApplied && (
            <span className="similarity-info">
              Résultats triés par similarité
            </span>
          )}
        </div>
        <button
          className="continue-button"
          onClick={handleValidate}
          disabled={selectedProjects.length === 0}
        >
          Continuer
          <FontAwesomeIcon icon={faCheck} />
        </button>
      </div>
    </div>
  );
};

export default ProjectSelectionScreen;
