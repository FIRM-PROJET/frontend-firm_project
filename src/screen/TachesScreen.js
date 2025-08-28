import React, { useState, useEffect } from "react";
import "../styles/TacheScreen.css";
import { TacheService } from "../services/TacheService";
import TacheModal from "../modals/TacheModal";
import { useNavigate } from "react-router-dom";
import ListeTache from "./TacheScreen/ListeTache";
import CalendarView from "./TacheScreen/CalendarView";

// Fonction pour décoder le JWT (version simplifiée)
const jwtDecode = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erreur de décodage du token:", error);
    return null;
  }
};

const TacheScreen = () => {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Aperçu");
  const [selectedTache, setSelectedTache] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allTaches, setAllTaches] = useState([]);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    avatar: null,
    matricule: "",
  });
  const [allFiles, setAllFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);
  const navigate = useNavigate();

  const handleAjouterTache = () => {
    navigate("/tache/new");
  };

  const handleNavigateToList = () => {
    setActiveTab("Liste");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userInfoData = {
          name: decoded.nom || decoded.name || "Utilisateur",
          email: decoded.email || "",
          avatar: decoded.avatar || null,
          matricule: decoded.matricule || "",
        };
        setUserInfo(userInfoData);

        // Charger les tâches avec le matricule décodé
        if (userInfoData.matricule) {
          loadUserTaches(userInfoData.matricule);
          loadAllTaches();
          loadAllFiles();
        }
      } catch (err) {
        console.error("Erreur de décodage du token :", err);
        setError("Erreur de décodage du token");
        setLoading(false);
      }
    } else {
      setError("Token non trouvé");
      setLoading(false);
    }
  }, []);

  const loadAllTaches = async () => {
    try {
      const allTachesData = await TacheService.getAllTaches();
      setAllTaches(allTachesData);
    } catch (error) {
      console.error("Erreur lors du chargement de toutes les tâches:", error);
    }
  };

  const handleDownloadFile = async (filename) => {
    try {
      await TacheService.downloadTacheFile(filename);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  const loadAllFiles = async () => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      const filesData = await TacheService.getAllTacheFiles();
      setAllFiles(filesData);
    } catch (error) {
      console.error("Erreur lors du chargement des fichiers:", error);
      setFilesError(error.message);
    } finally {
      setFilesLoading(false);
    }
  };

  const groupFilesByType = (files) => {
    const grouped = {};

    files.forEach((file) => {
      const extension =
        file.nom_fichier.split(".").pop()?.toLowerCase() || "sans-extension";
      let type = "Autres";

      // Classification par type
      if (["pdf"].includes(extension)) {
        type = "PDF";
      } else if (["doc", "docx"].includes(extension)) {
        type = "Documents Word";
      } else if (["xls", "xlsx"].includes(extension)) {
        type = "Feuilles Excel";
      } else if (["ppt", "pptx"].includes(extension)) {
        type = "Présentations";
      } else if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension)) {
        type = "Images";
      } else if (["mp4", "avi", "mov", "wmv"].includes(extension)) {
        type = "Vidéos";
      } else if (["mp3", "wav", "ogg"].includes(extension)) {
        type = "Audio";
      } else if (["txt", "rtf"].includes(extension)) {
        type = "Fichiers texte";
      } else if (["zip", "rar", "7z"].includes(extension)) {
        type = "Archives";
      }

      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(file);
    });

    return grouped;
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "bi-file-earmark-pdf";
      case "doc":
      case "docx":
        return "bi-file-earmark-word";
      case "xls":
      case "xlsx":
        return "bi-file-earmark-excel";
      case "ppt":
      case "pptx":
        return "bi-file-earmark-ppt";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return "bi-file-earmark-image";
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
        return "bi-file-earmark-play";
      case "mp3":
      case "wav":
      case "ogg":
        return "bi-file-earmark-music";
      case "txt":
      case "rtf":
        return "bi-file-earmark-text";
      case "zip":
      case "rar":
      case "7z":
        return "bi-file-earmark-zip";
      default:
        return "bi-file-earmark";
    }
  };

  const loadUserTaches = async (matricule) => {
    try {
      setLoading(true);
      const tachesData = await TacheService.get_user_task(matricule);
      setTaches(tachesData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTachesAujourdhui = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return taches.filter((tache) => {
      const dateDebut = new Date(tache.date_debut);
      const dateFinPrevu = new Date(tache.date_fin_prevu);
      const dateFinReelle = tache.date_fin_reelle;
      dateDebut.setHours(0, 0, 0, 0);
      dateFinPrevu.setHours(0, 0, 0, 0);
      return (
        dateDebut.getTime() <= today.getTime() &&
        dateFinPrevu.getTime() >= today.getTime() &&
        (!dateFinReelle || dateFinReelle.trim() === "")
      );
    });
  };

  const getKanbanTaches = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return taches.filter((tache) => {
      const dateDebut = new Date(tache.date_debut);
      const dateFinPrevu = new Date(tache.date_fin_prevu);
      const dateFinReelle = tache.date_fin_reelle;
      dateDebut.setHours(0, 0, 0, 0);
      dateFinPrevu.setHours(0, 0, 0, 0);
      return (
        dateDebut.getTime() <= today.getTime() &&
        dateFinPrevu.getTime() >= today.getTime() &&
        (!dateFinReelle || dateFinReelle.trim() === "")
      );
    });
  };

  const getOngoingTasks = () => {
    return taches.filter((tache) => tache.statut === "En cours");
  };

  const getStatusStats = () => {
    const nonDemarre = taches.filter((t) => t.statut === "Non démarré").length;
    const enCours = taches.filter((t) => t.statut === "En cours").length;
    const termine = taches.filter((t) => t.statut === "Terminé").length;

    return { nonDemarre, enCours, termine };
  };

  const handleTacheClick = (tache) => {
    setSelectedTache(tache);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTache(null);
  };

  const DonutChart = ({ data }) => {
    const total = data.nonDemarre + data.enCours + data.termine;
    if (total === 0) return <div className="no-data">Aucune donnée</div>;

    const radius = 35;
    const circumference = 2 * Math.PI * radius;

    const nonDemarrePercent = (data.nonDemarre / total) * 100;
    const enCoursPercent = (data.enCours / total) * 100;
    const terminePercent = (data.termine / total) * 100;

    const nonDemarreOffset = 0;
    const enCoursOffset = (nonDemarrePercent / 100) * circumference;
    const termineOffset =
      ((nonDemarrePercent + enCoursPercent) / 100) * circumference;

    return (
      <div className="donut-container">
        <svg width="90" height="90" className="donut-chart">
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="transparent"
            stroke="#404040"
            strokeWidth="12"
          />
          {data.nonDemarre > 0 && (
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="#514f84"
              strokeWidth="12"
              strokeDasharray={`${
                (nonDemarrePercent / 100) * circumference
              } ${circumference}`}
              strokeDashoffset={-nonDemarreOffset}
              transform="rotate(-90 45 45)"
            />
          )}
          {data.enCours > 0 && (
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="#f7e395"
              strokeWidth="12"
              strokeDasharray={`${
                (enCoursPercent / 100) * circumference
              } ${circumference}`}
              strokeDashoffset={-enCoursOffset}
              transform="rotate(-90 45 45)"
            />
          )}
          {data.termine > 0 && (
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="#7cc48b"
              strokeWidth="12"
              strokeDasharray={`${
                (terminePercent / 100) * circumference
              } ${circumference}`}
              strokeDashoffset={-termineOffset}
              transform="rotate(-90 45 45)"
            />
          )}
          <text x="45" y="50" textAnchor="middle" className="donut-center-text">
            {total}
          </text>
        </svg>
        <div className="donut-legend">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "linear-gradient(135deg, #514f84, #6b5bb8)" }}
            ></span>
            <span>Non démarré ({data.nonDemarre})</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "linear-gradient(135deg, #f7e395, #f4d03f)" }}
            ></span>
            <span>En cours ({data.enCours})</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "linear-gradient(135deg, #7cc48b, #5dbd72)" }}
            ></span>
            <span>Terminé ({data.termine})</span>
          </div>
        </div>
      </div>
    );
  };

  const KanbanBoard = ({ taches }) => {
    const groupedTaches = {
      "Non démarré": taches.filter((t) => t.statut === "Non démarré"),
      "En cours": taches.filter((t) => t.statut === "En cours"),
      "Terminé": taches.filter((t) => t.statut === "Terminé"),
    };

    const columnConfig = {
      "Non démarré": {
        color: "#514f84",
        gradient: "linear-gradient(135deg, #514f84, #6b5bb8)",
        icon: "bi-pause-circle"
      },
      "En cours": {
        color: "#f7e395",
        gradient: "linear-gradient(135deg, #dfc14aff, #efdf9eff)",
        icon: "bi-clock"
      },
      "Terminé": {
        color: "#7cc48b",
        gradient: "linear-gradient(135deg, #7cc48b, #5dbd72)",
        icon: "bi-check-circle"
      }
    };

    const isOverdue = (dateFinPrevu, statut) => {
      if (statut === "Terminé") return false;
      const today = new Date();
      const echeance = new Date(dateFinPrevu);
      return echeance < today;
    };

    return (
      <div className="kanban-board">
        {Object.entries(groupedTaches).map(([statut, tachesStatut]) => (
          <div key={statut} className="kanban-column">
            <div 
              className="kanban-header"
              style={{ background: columnConfig[statut].gradient }}
            >
              <div className="kanban-title">
                <i className={`bi ${columnConfig[statut].icon}`}></i>
                <span>{statut}</span>
                <span className="kanban-count">({tachesStatut.length})</span>
              </div>
            </div>
            <div className="kanban-content">
              {tachesStatut.length > 0 ? (
                tachesStatut.map((tache) => (
                  <div
                    key={tache.ref_tache}
                    className={`kanban-card ${isOverdue(tache.date_fin_prevu, tache.statut) ? 'overdue' : ''}`}
                    onClick={() => handleTacheClick(tache)}
                  >
                    <div className="kanban-card-title-simple">
                      {tache.nom_tache}
                      {isOverdue(tache.date_fin_prevu, tache.statut) && (
                        <i className="bi bi-exclamation-triangle-fill overdue-icon"></i>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="kanban-empty">
                  <i className={`bi ${columnConfig[statut].icon}`}></i>
                  <p>Aucune tâche</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <i className="bi bi-hourglass-split loading-spinner"></i>
          <div>Chargement de vos tâches...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="bi bi-exclamation-circle-fill error-icon"></i>
          <div>Erreur: {error}</div>
        </div>
      </div>
    );
  }

  const tachesAujourdhui = getTachesAujourdhui();
  const kanbanTaches = getKanbanTaches();
  const ongoingTasks = getOngoingTasks();
  const statusStats = getStatusStats();

  const renderContent = () => {
    switch (activeTab) {
      case "Aperçu":
        return (
          <>
            {/* Layout avec Kanban à gauche et sections à droite */}
            <div className="dashboard-grid">
              {/* Tableau Kanban à gauche */}
              <div className="kanban-section">
                <div className="section-header1">
                  <h3>
                    <i className="bi bi-kanban"></i>
                    Tâches d'aujourd'hui
                  </h3>
                </div>
                <KanbanBoard taches={kanbanTaches} />
              </div>

              {/* Colonne de droite avec statuts et tâches récentes */}
              <div className="right-column">
                {/* Section Statuts */}
                <div className="status-section">
                  <div className="section-header1">
                    <h3>
                      <i className="bi bi-pie-chart-fill"></i> Statuts
                    </h3>
                  </div>
                  <div className="status-content">
                    <DonutChart data={statusStats} />
                  </div>
                </div>

                {/* Section Tâches récentes */}
                <div className="recent-tasks-mini-section">
                  <div className="section-header1">
                    <h3>
                      <i className="bi bi-clock-history"></i>
                      Tâches récentes
                    </h3>
                    <button className="view-list-btn" onClick={handleNavigateToList}>
                      <i className="bi bi-list-ul"></i>
                      Voir la liste
                    </button>
                  </div>
                  <div className="recent-tasks-mini-list">
                    {taches.length > 0 ? (
                      taches.slice(0, 5).map((tache) => (
                        <div
                          key={tache.ref_tache}
                          className="recent-task-mini-item"
                          onClick={() => handleTacheClick(tache)}
                          data-status={tache.statut}
                        >
                          <div className="task-mini-indicator"></div>
                          <div className="task-mini-title">{tache.nom_tache}</div>
                        </div>
                      ))
                    ) : (
                      <div className="no-tasks-mini">
                        <i className="bi bi-clipboard-x"></i>
                        <span>Aucune tâche</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case "Liste":
        return (
          <ListeTache
            taches={taches}
            allTaches={allTaches}
            onTacheClick={handleTacheClick}
            userInfo={userInfo}
          />
        );
      case "Tableau":
        return (
          <CalendarView
            taches={taches}
            allTaches={allTaches}
            onTacheClick={handleTacheClick}
            userInfo={userInfo}
          />
        );
      case "Fichiers":
        return (
          <div className="files-view">
            <div className="files-header">
              <h2>
                <i class="bi bi-folder-symlink-fill"></i> Tous les fichiers
              </h2>
              <button
                className="refresh-files-btn"
                onClick={loadAllFiles}
                disabled={filesLoading}
              >
                <i
                  className={`bi ${
                    filesLoading
                      ? "bi-arrow-repeat rotating"
                      : "bi-arrow-clockwise"
                  }`}
                ></i>
                Actualiser
              </button>
            </div>

            {filesLoading && (
              <div className="files-loading">
                <i className="bi bi-hourglass-split loading-spinner"></i>
                <span>Chargement des fichiers...</span>
              </div>
            )}

            {filesError && (
              <div className="files-error">
                <i className="bi bi-exclamation-circle-fill error-icon"></i>
                <span>Erreur: {filesError}</span>
              </div>
            )}

            {!filesLoading && !filesError && (
              <div className="files-content">
                {allFiles.length > 0 ? (
                  (() => {
                    const groupedFiles = groupFilesByType(allFiles);
                    return Object.keys(groupedFiles).map((type) => (
                      <div key={type} className="file-type-section">
                        <div className="file-type-header">
                          <h3>
                            {type} ({groupedFiles[type].length})
                          </h3>
                        </div>
                        <div className="files-grid">
                          {groupedFiles[type].map((file, index) => (
                            <div key={file.id || index} className="file-item">
                              <div className="file-icon">
                                <i
                                  className={`bi ${getFileIcon(
                                    file.nom_fichier
                                  )}`}
                                ></i>
                              </div>
                              <div className="file-info">
                                <div
                                  className="file-name"
                                  title={file.nom_fichier}
                                >
                                  {file.nom_fichier}
                                </div>
                                <div className="file-details">
                                  {file.tache_nom && (
                                    <span className="file-tache">
                                      {file.tache_nom}
                                    </span>
                                  )}
                                  {file.taille && (
                                    <span className="file-size">
                                      {file.taille}
                                    </span>
                                  )}
                                </div>
                                {file.date_upload && (
                                  <div className="file-date">
                                    Ajouté le {new Date(
                                      file.date_upload
                                    ).toLocaleDateString("fr-FR")}
                                  </div>
                                )}
                              </div>
                              <div className="file-actions">
                                <button
                                  className="file-action-btn download"
                                  title="Télécharger"
                                  onClick={() =>
                                    handleDownloadFile(file.chemin_fichier)
                                  }
                                >
                                  <i className="bi bi-download"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="no-files">
                    <i className="bi bi-folder-x"></i>
                    <p>Aucun fichier trouvé</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="module-header">
        <div className="header-content">
          <div className="text-content">
            <h1 className="module-title">Tâches</h1>
            <h5 className="module-subtitle">
              Attribuer des tâches, fixer des délais, commenter les actions, et
              suivre la progression en temps réel
            </h5>
          </div>
          <button className="btn-ajouter-tache" onClick={handleAjouterTache}>
            <i className="bi bi-plus-circle-fill"></i>
            Ajouter une nouvelle tâche
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <button
          className={`nav-item ${activeTab === "Aperçu" ? "active" : ""}`}
          onClick={() => setActiveTab("Aperçu")}
        >
          <i className="bi bi-grid-fill"></i>
          <span>Aperçu</span>
        </button>
        <button
          className={`nav-item ${activeTab === "Liste" ? "active" : ""}`}
          onClick={() => setActiveTab("Liste")}
        >
          <i className="bi bi-list-ul"></i>
          <span>Liste</span>
        </button>
        <button
          className={`nav-item ${activeTab === "Tableau" ? "active" : ""}`}
          onClick={() => setActiveTab("Tableau")}
        >
          <i className="bi bi-calendar-range-fill"></i>
          <span>Calendrier</span>
        </button>
        <button
          className={`nav-item ${activeTab === "Fichiers" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("Fichiers");
            if (allFiles.length === 0) {
              loadAllFiles();
            }
          }}
        >
          <i className="bi bi-files"></i>
          <span>Fichiers</span>
        </button>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Modal */}
      <TacheModal
        tache={selectedTache}
        isOpen={isModalOpen}
        onClose={closeModal}
        onStatusChange={() => loadUserTaches(userInfo.matricule)}
        onStatusUpdate={loadAllTaches}
      />
    </div>
  );
};

export default TacheScreen;