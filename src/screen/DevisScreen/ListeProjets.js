import React, { useState, useEffect } from "react";
import { DevisService } from "../../services/DevisService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../../styles/DevisCSS/ListeProjets.css";
import {
  faSearch,
  faBuilding,
  faMoneyBillWave,
  faCalendarAlt,
  faLocationDot,
  faUser,
  faFileInvoice,
  faClock,
  faCheckCircle,
  faFilter,
  faArrowLeft,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ProjectDetailsModal from "../../modals/ProjectDetailsModal";

const ListeProjetsPage = () => {
  const [projets, setProjets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_debut");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const projetsParPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const data = await DevisService.getAllDevis();
        setProjets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjets();
  }, []);

  const handleBackClick = () => navigate("/devis");

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleViewDetails = async (project) => {
    try {
      setSelectedProject(project);
      // Récupérer les détails du projet
      const details = await DevisService.getDetailsProjet(project.id_projet); // Ajustez selon votre API
      setProjectDetails(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
      // Vous pouvez afficher un message d'erreur à l'utilisateur
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setProjectDetails(null);
  };

  const applyFilter = (list) => {
    switch (activeFilter) {
      case "active":
        return list.filter((p) => !p.date_fin_reel);
      case "completed":
        return list.filter((p) => p.date_fin_reel);
      case "high_value":
        return list.filter((p) => parseFloat(p.total_ttc) > 1000000000);
      default:
        return list;
    }
  };

  const applySort = (list) => {
    return [...list].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "total_ttc") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy.includes("date")) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filtered = projets.filter(
    (p) =>
      p.nom_projet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nom_client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nom_type_construction.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAndSorted = applySort(applyFilter(filtered));
  const indexLast = currentPage * projetsParPage;
  const indexFirst = indexLast - projetsParPage;
  const currentProjects = filteredAndSorted.slice(indexFirst, indexLast);
  const totalPages = Math.ceil(filteredAndSorted.length / projetsParPage);

  const paginate = (num) => setCurrentPage(num);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="liste-projets-container">
      <button className="back-button1" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Retour
      </button>
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Liste des Projets Référents</h1>
          <p className="page-subtitle">
            Gestion et consultation de tous les projets référents
          </p>
        </div>
      </div>

      <div className="search-and-stats">
        <div className="search-section">
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom de projet, client ou type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="results-count">
            {filteredAndSorted.length} projet(s) trouvé(s)
          </div>
        </div>
      </div>


      <div className="projects-grid">
        {currentProjects.length > 0 ? (
          currentProjects.map((projet) => {
            return (
              <div key={projet.id_projet} className="project-card">
                <div className="project-card-header">
                  <div className="project-main-info">
                    <FontAwesomeIcon
                      icon={faFileInvoice}
                      className="project-icon"
                    />
                    <div>
                      <h3 className="project-name">{projet.nom_projet}</h3>
                      <p className="project-description">
                        {projet.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="project-details-grid">
                  <div className="detail-item1">
                    <FontAwesomeIcon icon={faUser} className="detail-icon" />
                    <div>
                      <span className="detail-label">Maître d'ouvrage</span>
                      <span className="detail-value">{projet.nom_client}</span>
                    </div>
                  </div>

                  <div className="detail-item1">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="detail-icon"
                    />
                    <div>
                      <span className="detail-label">Type</span>
                      <span className="detail-value">
                        {projet.nom_type_construction}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item1">
                    <FontAwesomeIcon
                      icon={faCalendarAlt}
                      className="detail-icon"
                    />
                    <div>
                      <span className="detail-label">Date du devis</span>
                      <span className="detail-value">
                        {new Date(projet.date_devis).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item1">
                    <FontAwesomeIcon
                      icon={faMoneyBillWave}
                      className="detail-icon"
                    />
                    <div>
                      <span className="detail-label">Montant TTC</span>
                      <span className="detail-value amount">
                        {parseFloat(projet.total_ttc).toLocaleString("fr-FR")}{" "}
                        Ar
                      </span>
                    </div>
                  </div>

                  <div className="detail-item1">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="detail-icon"
                    />
                    <div>
                      <span className="detail-label">Localisation</span>
                      <span className="detail-value amount">
                       {projet.localisation}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="project-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(projet)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Voir détails
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-projects">
            <FontAwesomeIcon
              icon={faFileInvoice}
              className="no-projects-icon"
            />
            <h3>Aucun projet trouvé</h3>
            <p>Essayez de modifier vos critères de recherche ou de filtrage.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`pagination-btn ${
                currentPage === index + 1 ? "active" : ""
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal des détails du projet */}
      {isModalOpen && selectedProject && projectDetails && (
        <ProjectDetailsModal
          project={selectedProject}
          details={projectDetails}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ListeProjetsPage;
