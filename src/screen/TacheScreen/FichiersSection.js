import React, { useState } from "react";
import "../../styles/TacheCSS/FichiersSection.css";
import { TacheService } from "../../services/TacheService";

const FichiersSection = ({ allFiles, filesLoading, filesError, loadAllFiles, handleDownloadFile }) => {
  const [downloadingZip, setDownloadingZip] = useState({});

  // Grouper les fichiers par projet
  const groupFilesByProject = (files) => {
    const grouped = {};

    files.forEach((file) => {
      const projectKey = file.ref_projet;
      const projectName = file.nom_projet;

      if (!grouped[projectKey]) {
        grouped[projectKey] = {
          name: projectName,
          ref_projet: file.ref_projet,
          files: []
        };
      }
      grouped[projectKey].files.push(file);
    });

    return grouped;
  };

  // Grouper les fichiers d'un projet par type
  const groupFilesByType = (files) => {
    const grouped = {};

    files.forEach((file) => {
      const extension = file.nom_fichier.split(".").pop()?.toLowerCase() || "sans-extension";
      let type = "Autres";

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

  // Télécharger le ZIP d'un projet
  const handleDownloadProjectZip = async (ref_projet, projectName) => {
    if (!ref_projet) {
      alert("Impossible de télécharger : référence du projet manquante");
      return;
    }

    try {
      setDownloadingZip(prev => ({ ...prev, [ref_projet]: true }));
      
      // Appel direct à l'API backend qui retourne un blob
      const response = await TacheService.download_zip_projet(ref_projet);
      
      // Créer un lien de téléchargement avec le blob reçu
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projet_${projectName.replace(/[^a-z0-9]/gi, '_')}_fichiers.zip`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error("Erreur lors du téléchargement du ZIP:", error);
      alert("Erreur lors du téléchargement du fichier ZIP");
    } finally {
      setDownloadingZip(prev => ({ ...prev, [ref_projet]: false }));
    }
  };

  return (
    <div className="files-view">
      <div className="files-header">
        <h2>
          <i className="bi bi-folder-symlink-fill"></i> Tous les fichiers par projet
        </h2>
        <button
          className="refresh-files-btn"
          onClick={loadAllFiles}
          disabled={filesLoading}
        >
          <i
            className={`bi ${
              filesLoading ? "bi-arrow-repeat rotating" : "bi-arrow-clockwise"
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
              const groupedByProject = groupFilesByProject(allFiles);
              return Object.keys(groupedByProject).map((projectKey) => {
                const project = groupedByProject[projectKey];
                const groupedFiles = groupFilesByType(project.files);
                
                return (
                  <div key={projectKey} className="project-files-section">
                    <div className="project-header">
                      <div className="project-info2">
                        <i className="bi bi-folder-fill"></i>
                        <h2>{project.name}</h2>
                        <span className="project-file-count">
                          ({project.files.length} fichier{project.files.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      {project.ref_projet && (
                        <button
                          className="download-zip-btn"
                          onClick={() => handleDownloadProjectZip(project.ref_projet, project.name)}
                          disabled={downloadingZip[project.ref_projet]}
                          title="Télécharger tous les fichiers du projet en ZIP"
                        >
                          <i className={`bi ${
                            downloadingZip[project.ref_projet] 
                              ? 'bi-hourglass-split rotating' 
                              : 'bi-file-earmark-zip'
                          }`}></i>
                          {downloadingZip[project.ref_projet] 
                            ? 'Téléchargement...' 
                            : 'Télécharger ZIP'}
                        </button>
                      )}
                    </div>

                    <div className="project-files-content">
                      {Object.keys(groupedFiles).map((type) => (
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
                                  <i className={`bi ${getFileIcon(file.nom_fichier)}`}></i>
                                </div>
                                <div className="file-info">
                                  <div className="file-name" title={file.nom_fichier}>
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
                                      Ajouté le{" "}
                                      {new Date(file.date_upload).toLocaleDateString("fr-FR")}
                                    </div>
                                  )}
                                </div>
                                <div className="file-actions">
                                  <button
                                    className="file-action-btn download"
                                    title="Télécharger"
                                    onClick={() => handleDownloadFile(file.chemin_fichier)}
                                  >
                                    <i className="bi bi-download"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
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
};

export default FichiersSection;