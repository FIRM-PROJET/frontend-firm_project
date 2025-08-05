import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faLayerGroup,
  faRuler,
  faBuilding,
  faMountain,
  faWindowMaximize,
  faLayerGroup as faPlancher,
  faHome,
  faFileDownload,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFileImage,
  faFile,
  faPaperclip,
  faImage,
  faInfoCircle,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { DevisService } from "../services/DevisService";
import "../styles/ProjectDetailsModal.css";

const ProjectDetailsModal = ({ project, details, onClose }) => {
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("details");

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return faFilePdf;
      case "doc":
      case "docx":
        return faFileWord;
      case "xls":
      case "xlsx":
        return faFileExcel;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return faFileImage;
      default:
        return faFile;
    }
  };

  useEffect(() => {
    const fetchFiles = async () => {
      if (project && project.id_projet) {
        try {
          console.log("Fetching files for project:", project.id_projet);
          const projectFiles = await DevisService.get_projects_devis_name(
            project.id_projet
          );
          console.log("Received files:", projectFiles);
          setFiles(projectFiles);
        } catch (error) {
          console.error("Erreur lors de la récupération des fichiers:", error);
        }
      }
    };
    fetchFiles();
  }, [project]);

  if (!details) return null;

  const handleFileDownload = async (file) => {
    try {
      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.chemin_fichier);

      if (isImage) {
        await DevisService.downloadImageFile(file.chemin_fichier);
      } else {
        await DevisService.downloadProjectFile(file.chemin_fichier);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  // Filtrer les fichiers par type
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|gif)$/i.test(file.nom_fichier)
  );

  const excelFiles = files.filter((file) =>
    /\.(xls|xlsx)$/i.test(file.nom_fichier)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "images":
        return (
          <div className="images-grid">
            {imageFiles.length > 0 ? (
              imageFiles.map((file, index) => {
                const imageUrl = DevisService.getImageUrl(file.chemin_fichier);
                return (
                  <div key={index} className="image-card">
                    <div className="image-container">
                      <img
                        src={imageUrl}
                        alt={file.nom_fichier}
                        className="image-preview"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        className="image-placeholder"
                        style={{ display: "none" }}
                      >
                        <FontAwesomeIcon
                          icon={faFileImage}
                          className="image-icon"
                        />
                      </div>
                    </div>
                    <div className="image-info">
                      <span className="image-name">{file.nom_fichier}</span>
                      <button
                        className="image-download-btn"
                        onClick={() => handleFileDownload(file)}
                      >
                        <FontAwesomeIcon icon={faFileDownload} />
                        Télécharger
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-content">
                <FontAwesomeIcon icon={faImage} className="no-content-icon" />
                <p>Aucune image disponible</p>
              </div>
            )}
          </div>
        );

      case "details":
        return (
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon icon={faLayerGroup} className="detail-icon" />
                <span className="detail-label">Nombre d'étages</span>
              </div>
              <span className="detail-value">{details.nombre_etages}</span>
            </div>
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon icon={faRuler} className="detail-icon" />
                <span className="detail-label">Surface totale</span>
              </div>
              <span className="detail-value">{details.surface_totale} m²</span>
            </div>
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon icon={faBuilding} className="detail-icon" />
                <span className="detail-label">Structure</span>
              </div>
              <span className="detail-value">{details.structure}</span>
            </div>
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon icon={faMountain} className="detail-icon" />
                <span className="detail-label">Toiture</span>
              </div>
              <span className="detail-value">{details.toiture}</span>
            </div>
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon
                  icon={faWindowMaximize}
                  className="detail-icon"
                />
                <span className="detail-label">Menuiserie</span>
              </div>
              <span className="detail-value">{details.menuiserie}</span>
            </div>
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon icon={faPlancher} className="detail-icon" />
                <span className="detail-label">Type de plancher</span>
              </div>
              <span className="detail-value">{details.type_plancher}</span>
            </div>
            <div className="detail-item">
              <div className="detail-header">
                <FontAwesomeIcon icon={faHome} className="detail-icon" />
                <span className="detail-label">Fondation</span>
              </div>
              <span className="detail-value">{details.fondation}</span>
            </div>
          </div>
        );

      case "files":
        return (
          <div className="files-section">
            {excelFiles.length > 0 ? (
              <div className="files-list">
                {excelFiles.map((file, index) => (
                  <button
                    key={index}
                    className="file-download-button"
                    onClick={() => handleFileDownload(file)}
                  >
                    <FontAwesomeIcon icon={getFileIcon(file.nom_fichier)} />
                    <span>{file.nom_fichier}</span>
                    <FontAwesomeIcon
                      icon={faFileDownload}
                      className="download-icon"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <FontAwesomeIcon
                  icon={faFileExcel}
                  className="no-content-icon"
                />
                <p>Aucun fichier Excel disponible</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="modal-overlay-project" onClick={onClose}>
      <div
        className="modal-content-project"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-project">
          <h2 className="modal-title-project">{project.nom_projet}</h2>
          <button className="modal-close1" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Menu à onglets */}
        <div className="tabs-container">
          <div className="tabs-menu">
            <button
              className={`tab-button ${activeTab === "images" ? "active" : ""}`}
              onClick={() => setActiveTab("images")}
            >
              <FontAwesomeIcon icon={faImage} />
              Images ({imageFiles.length})
            </button>
            <button
              className={`tab-button ${
                activeTab === "details" ? "active" : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              Détails
            </button>
            <button
              className={`tab-button ${activeTab === "files" ? "active" : ""}`}
              onClick={() => setActiveTab("files")}
            >
              <FontAwesomeIcon icon={faFileExcel} />
              Fichiers Excel ({excelFiles.length})
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="modal-body">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
