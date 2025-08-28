import React, { useState, useRef, useEffect } from "react";
import "../styles/TacheModal.css";
import { TacheService } from "../services/TacheService";
import { ProjetService } from "../services/ProjetService";
import MessageModal from "./MessageModal";
import SubTaskModal from "./SubTaskModal";
import SubTaskDetailsModal from "./SubTaskDetailsModal";
import CommentsModal from "./CommentsModal";

// TipTap imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

const TacheModal = ({ tache, isOpen, onClose, onStatusUpdate }) => {
  const [activeCommentTab, setActiveCommentTab] = useState("comments");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [realAttachments, setRealAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // États pour la création de sous-tâches
  const [showSubTaskModal, setShowSubTaskModal] = useState(false);
  const [subTasks, setSubTasks] = useState([]);
  const [isLoadingSubTasks, setIsLoadingSubTasks] = useState(false);

  const [showSubTaskDetailsModal, setShowSubTaskDetailsModal] = useState(false);
  const [selectedSubTaskRef, setSelectedSubTaskRef] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");

  // État pour le CommentsModal
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const [isSubTasksCollapsed, setIsSubTasksCollapsed] = useState(false);

  // États simplifiés pour les commentaires - uniquement pour la tâche principale
  const [taskComments, setTaskComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Configuration de l'éditeur TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
    },
    onUpdate: ({ editor }) => {
      // Optionnel : vous pouvez suivre les changements ici
    },
  });

  const loadTaskFiles = async () => {
    if (!tache) return;

    setIsLoadingAttachments(true);
    try {
      const filesData = await TacheService.getTacheFiles(tache.ref_tache);
      setRealAttachments(filesData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des fichiers:", error);
      setModalMessage("Erreur lors du chargement des fichiers");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const handleRealFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploadingFile(true);
    try {
      for (const file of files) {
        await TacheService.uploadTacheFile(tache.ref_tache, file);
      }

      setModalMessage("Fichier(s) uploadé(s) avec succès !");
      setModalType("success");
      setIsModalOpen(true);

      // Recharger les fichiers
      await loadTaskFiles();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      setModalMessage("Erreur lors de l'upload du fichier");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsUploadingFile(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Fonction pour télécharger un fichier
  const handleDownloadFile = async (filename) => {
    try {
      await TacheService.downloadTacheFile(filename);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setModalMessage("Erreur lors du téléchargement du fichier");
      setModalType("error");
      setIsModalOpen(true);
    }
  };

  // Fonction pour ajouter un lien
  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    const linkHtml = linkText.trim()
      ? `<a href="${linkUrl}" target="_blank">${linkText}</a>`
      : `<a href="${linkUrl}" target="_blank">${linkUrl}</a>`;

    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent(linkHtml + " ")
        .run();
    }

    setLinkUrl("");
    setLinkText("");
    setShowLinkModal(false);
  };

  // Fonction pour ouvrir le modal de lien
  const handleOpenLinkModal = () => {
    setShowLinkModal(true);
  };

  // Fonction pour upload de fichier via l'éditeur
  const handleEditorFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        await TacheService.uploadTacheFile(tache.ref_tache, file);
        // Ajouter le lien du fichier dans l'éditeur
        const fileLink = `<a href="#" onclick="handleDownloadFile('${file.chemin_fichier}')" class="file-link">${file.name}</a>`;
        if (editor) {
          editor
            .chain()
            .focus()
            .insertContent(fileLink + " ")
            .run();
        }
      }

      await loadTaskFiles();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    }
  };

  // Fonction pour grouper les fichiers par type
  const groupFilesByType = (files) => {
    const groups = {
      pdf: [],
      image: [],
      excel: [],
      word: [],
      other: [],
    };

    files.forEach((file) => {
      const extension = file.nom_fichier.split(".").pop().toLowerCase();

      if (extension === "pdf") {
        groups.pdf.push(file);
      } else if (
        ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension)
      ) {
        groups.image.push(file);
      } else if (["xls", "xlsx", "csv"].includes(extension)) {
        groups.excel.push(file);
      } else if (["doc", "docx"].includes(extension)) {
        groups.word.push(file);
      } else {
        groups.other.push(file);
      }
    });

    return groups;
  };

  // Fonction pour obtenir l'icône selon l'extension
  const getFileIconByExtension = (filename) => {
    const extension = filename.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return "bi-file-earmark-pdf-fill";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "svg":
        return "bi-file-earmark-image-fill";
      case "xls":
      case "xlsx":
      case "csv":
        return "bi-file-earmark-excel-fill";
      case "doc":
      case "docx":
        return "bi-file-earmark-word-fill";
      case "zip":
      case "rar":
      case "7z":
        return "bi-file-earmark-zip-fill";
      case "txt":
        return "bi-file-earmark-text-fill";
      default:
        return "bi-file-earmark-fill";
    }
  };

  // Ajouter dans useEffect pour charger les fichiers
  useEffect(() => {
  if (isOpen && tache) {
    loadSubTasks();
    loadComments(); // Toujours charger les commentaires
    loadTaskFiles(); // Toujours charger les fichiers pour avoir le count
  }
}, [isOpen, tache]);

  // Modification de la toolbar pour le bouton lien

  const getUserInitials = (nom, prenom) => {
    const firstInitial = nom ? nom.charAt(0).toUpperCase() : "";
    const lastInitial = prenom ? prenom.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  const getUserTooltipInfo = (user) => {
    return `${user.nom} ${user.prenom}${user.email ? ` - ${user.email}` : ""}`;
  };

  const [attachments, setAttachments] = useState([
    {
      id: 1,
      name: "specification.pdf",
      size: "2.3 MB",
      type: "pdf",
      uploadedBy: "John Doe",
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      name: "mockup.png",
      size: "1.8 MB",
      type: "image",
      uploadedBy: "Marie Dupont",
      uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ]);

  const fileInputRef = useRef(null);
  const handleToolbarAction = (action) => {
    if (!editor) return;

    switch (action) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "underline":
        editor.chain().focus().toggleUnderline().run();
        break;
      case "strike":
        editor.chain().focus().toggleStrike().run();
        break;
      case "bullet":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "numbered":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "blockquote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "link":
        handleOpenLinkModal(); // Utiliser le modal au lieu du prompt
        break;
      case "highlight":
        editor.chain().focus().toggleHighlight().run();
        break;
      case "undo":
        editor.chain().focus().undo().run();
        break;
      case "redo":
        editor.chain().focus().redo().run();
        break;
      case "file":
        // Créer un input file temporaire pour l'éditeur
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.multiple = true;
        fileInput.onchange = handleEditorFileUpload;
        fileInput.click();
        break;
      default:
        break;
    }
  };

  const handleViewSubTaskDetails = (subTaskRef) => {
    setSelectedSubTaskRef(subTaskRef);
    setShowSubTaskDetailsModal(true);
  };

  useEffect(() => {
    if (isOpen && tache) {
      loadSubTasks();
      if (activeCommentTab === "comments") {
        loadComments();
      }
    }
  }, [isOpen, tache, activeCommentTab]);

  // Nettoyage de l'éditeur
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Fonction pour recharger les données de la tâche
  const refreshTaskData = async () => {
    if (onStatusUpdate) {
      await onStatusUpdate();
      if (tache) {
        loadSubTasks();
        if (activeCommentTab === "comments") {
          loadComments();
        }
      }
    }
  };

  // Fonction pour charger les sous-tâches
  const loadSubTasks = async () => {
    if (!tache || tache.ref_sous_tache) return; // Ne charge que pour les tâches principales
    setIsLoadingSubTasks(true);
    try {
      const response = await TacheService.getSubTasks(tache.ref_tache);
      setSubTasks(response || []);
    } catch (error) {
      console.error("Erreur lors du chargement des sous-tâches:", error);
    } finally {
      setIsLoadingSubTasks(false);
    }
  };

  // Fonction simplifiée pour charger uniquement les commentaires de la tâche principale
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const taskCommentsResponse = await TacheService.get_task_comment(
        tache.ref_tache
      );
      setTaskComments(taskCommentsResponse);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
      setModalMessage("Erreur lors du chargement des commentaires");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Fonction pour ajouter un commentaire avec TipTap
  const handleAddComment = async () => {
    if (!editor || editor.isEmpty) return;

    setIsSubmittingComment(true);
    try {
      const commentContent = editor.getHTML(); // Récupère le contenu HTML de l'éditeur

      const commentData = {
        commentaire: commentContent,
        matricule: localStorage.getItem("matricule"),
        ref_tache: tache.ref_tache,
        ref_sous_tache: null,
      };

      await TacheService.create_comment(commentData);
      editor.commands.clearContent(); // Vide l'éditeur
      await loadComments(); // Recharger les commentaires
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      setModalMessage("Erreur lors de l'ajout du commentaire");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Fonction appelée après la création d'une sous-tâche
  const handleSubTaskCreated = async () => {
    await refreshTaskData();
    setShowSubTaskModal(false);
  };

  if (!isOpen || !tache) return null;

  const getStatusColor = (statut) => {
    switch (statut) {
      case "Non démarré":
        return "#6b7280";
      case "En cours":
        return "#fbbf24";
      case "Terminé":
        return "#10b981";
      default:
        return "#ccc";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour charger les utilisateurs de la phase
  const loadPhaseUsers = async () => {
    if (availableUsers.length > 0) return;

    setIsLoadingUsers(true);
    try {
      const utilisateursData = await ProjetService.getUsersByPhase({
        ref_projet: tache.ref_projet,
        id_phase: tache.id_phase,
      });
      setAvailableUsers(utilisateursData.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      setModalMessage("Erreur lors du chargement des utilisateurs");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fonction pour confirmer l'assignation
  const handleAssignUser = (user) => {
    setSelectedUser(user);
    setShowConfirmation(true);
    setShowAssignDropdown(false);
  };

  // Fonction pour assigner un utilisateur après confirmation
  const confirmAssignUser = async () => {
    if (!selectedUser) return;

    setIsAssigning(true);
    setShowConfirmation(false);

    try {
      const ref_tache = tache.ref_sous_tache || tache.ref_tache;

      await TacheService.assign_user_tache({
        ref_tache,
        matricule: selectedUser.matricule,
      });
      setModalMessage("Utilisateur assigné avec succès !");
      setModalType("success");
      setIsModalOpen(true);

      // Recharger les données
      await refreshTaskData();
    } catch (error) {
      setModalMessage(`Assignation refusée : Utilisateur déjà assigné à une tâche à ces dates.
         Veuillez changez la date ou l'utilisateur`);
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsAssigning(false);
      setSelectedUser(null);
    }
  };

  // Gestionnaire pour ouvrir le dropdown d'assignation
  const handleAssignDropdownToggle = () => {
    if (!showAssignDropdown) {
      loadPhaseUsers();
    }
    setShowAssignDropdown(!showAssignDropdown);
  };

  // Fonction pour mettre à jour le statut
  const updateTaskStatus = async (newStatus) => {
    setIsUpdatingStatus(true);
    setShowStatusDropdown(false);

    try {
      let updateData;

      if (tache.ref_sous_tache) {
        updateData = {
          ref_tache: null,
          ref_sous_tache: tache.ref_sous_tache,
        };
      } else {
        updateData = {
          ref_tache: tache.ref_tache,
          ref_sous_tache: null,
        };
      }

      let response;

      if (newStatus === "Terminé") {
        if (tache.ref_sous_tache) {
          console.log(updateData);
          response = await TacheService.UpdateSousTacheTermine(updateData);
        } else {
          console.log(updateData);
          response = await TacheService.UpdateTacheTermine(updateData);
        }
      } else if (newStatus === "En cours") {
        if (tache.ref_sous_tache) {
          await TacheService.UpdateSousTacheEnCours(updateData);
        } else {
          await TacheService.UpdateTacheEnCours(updateData);
        }
      }

      setModalMessage("Statut mis à jour avec succès !");
      setModalType("success");
      setIsModalOpen(true);

      // Recharger les données
      await refreshTaskData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setModalMessage("Erreur lors de la mise à jour du statut");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      type: file.type.split("/")[0],
      uploadedBy: "Utilisateur actuel",
      uploadedAt: new Date(),
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleDeleteAttachment = (attachmentId) => {
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "image":
        return "bi-image-fill";
      case "pdf":
        return "bi-file-earmark-pdf-fill";
      case "application":
        return "bi-file-earmark-zip-fill";
      default:
        return "bi-file-earmark-fill";
    }
  };

  const getAvailableStatuses = () => {
    const currentStatus = tache.statut;
    const allStatuses = ["Non démarré", "En cours", "Terminé"];
    if (
      currentStatus === "En cours" ||
      currentStatus === "Terminé" ||
      currentStatus === "Non démarré"
    ) {
      return allStatuses.filter(
        (status) => status !== currentStatus && status !== "Non démarré"
      );
    }
    return allStatuses.filter((status) => status !== currentStatus);
  };

  // Fonction pour obtenir les utilisateurs assignés
  const getAssignedUsers = () => {
    return tache.utilisateurs || [];
  };

  // Fonction simplifiée pour afficher les commentaires avec limite de 5
  const renderCommentsPreview = (comments) => {
    if (!comments || comments.length === 0) {
      return (
        <div className="no-comments-preview">
          <i className="bi bi-chat-dots"></i>
          <span>Aucun commentaire</span>
        </div>
      );
    }
    const displayComments = comments;

    return (
      <div className="comments-preview">
        {displayComments.map((comment) => (
          <div key={comment.id_commentaires} className="comment-preview-item">
            <div className="comment-preview-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <div className="comment-preview-body">
              <div className="comment-preview-header">
                <span className="comment-preview-author">
                  {comment.nom} {comment.prenom}
                </span>
                <span className="comment-preview-time">
                  {formatDateTime(comment.date_commentaire)}
                </span>
              </div>
              <div
                className="comment-preview-content"
                dangerouslySetInnerHTML={{
                  __html: comment.commentaire || "Aucun commentaire fourni.",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="task-details-overlay" onClick={onClose}>
      <div
        className="task-details-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec statut et assignation */}
        <header className="task-details-header">
          <div className="header-actions-group">
            {/* Bouton de changement de statut */}
            <div className="status-update-container">
              <button
                className="btn-status-update"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isUpdatingStatus}
              >
                <span
                  className="status-dot1"
                  style={{ backgroundColor: getStatusColor(tache.statut) }}
                ></span>
                <span className="status-text1">{tache.statut}</span>
                <i className="bi bi-chevron-down"></i>
              </button>

              {showStatusDropdown && (
                <div className="status-dropdown">
                  {getAvailableStatuses().map((status) => (
                    <button
                      key={status}
                      className="status-dropdown-item"
                      onClick={() => updateTaskStatus(status)}
                    >
                      <span
                        className="status-dot1"
                        style={{ backgroundColor: getStatusColor(status) }}
                      ></span>
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton d'assignation */}
            <div className="assign-update-container">
              <button
                className="btn-assign-update"
                onClick={handleAssignDropdownToggle}
                disabled={isAssigning || isLoadingUsers}
                title="Assigner à un utilisateur"
              >
                <i className="bi bi-person-fill-add"></i>
                <span>Assigner</span>
                <i className="bi bi-chevron-down"></i>
              </button>

              {showAssignDropdown && (
                <div className="assign-dropdown">
                  {isLoadingUsers ? (
                    <div className="assign-dropdown-loading">
                      <i className="bi bi-arrow-clockwise spin"></i>
                      Chargement...
                    </div>
                  ) : availableUsers.length > 0 ? (
                    availableUsers.map((user) => (
                      <button
                        key={user.matricule}
                        className="assign-dropdown-item"
                        onClick={() => handleAssignUser(user)}
                        disabled={isAssigning}
                      >
                        <div className="user-avatar">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div className="user-info">
                          <span className="user-name">
                            {user.nom} {user.prenom}
                          </span>
                          <span className="user-role">
                            {user.intitule_poste || "Membre"}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="assign-dropdown-empty">
                      <i className="bi bi-exclamation-circle"></i>
                      Aucun utilisateur disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button className="task-details-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </header>

        <div className="task-details-body">
          {/* Section principale avec les informations de la tâche */}
          <div className="task-hero-section">
            <h1 className="task-hero-title">{tache.nom_tache}</h1>

            {/* Méta-informations en haut */}
            <div className="task-hero-meta">
              <div className="task-meta-item">
                <label>
                  <i className="bi bi-folder-fill"></i> Projet
                </label>
                <span>{tache.nom_projet}</span>
              </div>
              <div className="task-meta-item">
                <label>
                  <i className="bi bi-diagram-3-fill"></i> Phase
                </label>
                <span>{tache.libelle_phase}</span>
              </div>
              <div className="task-meta-item">
                <label>
                  <i className="bi bi-calendar-event-fill"></i> Écheance
                </label>
                <div className="due-date-container">
                  <span>{formatDate(tache.date_fin_prevu)}</span>
                </div>
              </div>
            </div>

            <div className="task-description-section">
              <h3 className="task-description-title">
                <i className="bi bi-card-text"></i> Description
              </h3>
              <div className="task-hero-description">
                {tache.description ||
                  "Aucune description fournie pour cette tâche."}
              </div>
            </div>
            {/* Section utilisateurs assignés */}
            <div className="assigned-users-section1">
              <h3 className="assigned-users-title1">
                <i className="bi bi-people-fill"></i> Utilisateurs assignés
              </h3>
              <div className="assigned-users-list1">
                {getAssignedUsers().length > 0 ? (
                  getAssignedUsers().map((user, index) => (
                    <div
                      key={index}
                      className="assigned-user-item"
                      data-user-info={getUserTooltipInfo(user)}
                    >
                      <div className="assigned-user-avatar">
                        {getUserInitials(user.nom, user.prenom)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-assigned-users">
                    <i className="bi bi-person-x"></i>
                    <span>Aucun utilisateur assigné</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section sous-tâches (seulement pour les tâches principales) */}
            {!tache.ref_sous_tache && (
              <div className="subtasks-section">
                <div
                  className="subtasks-header"
                  onClick={() => setIsSubTasksCollapsed(!isSubTasksCollapsed)}
                >
                  <h3 className="subtasks-title">
                    <i className="bi bi-list-task"></i> Sous-tâches
                    {subTasks.length > 0 && (
                      <span className="subtasks-count">
                        ({subTasks.length})
                      </span>
                    )}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      className="btn-add-subtask"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSubTaskModal(true);
                      }}
                    >
                      <i className="bi bi-plus-circle"></i>
                      Ajouter
                    </button>
                    <button
                      className={`subtasks-toggle ${
                        isSubTasksCollapsed ? "collapsed" : ""
                      }`}
                    >
                      <i className="bi bi-chevron-down"></i>
                    </button>
                  </div>
                </div>

                {/* Liste des sous-tâches */}
                <div
                  className={`subtasks-list ${
                    isSubTasksCollapsed ? "collapsed" : ""
                  }`}
                >
                  {isLoadingSubTasks ? (
                    <div className="subtasks-loading">
                      <i className="bi bi-arrow-clockwise spin"></i>
                      Chargement des sous-tâches...
                    </div>
                  ) : subTasks.length > 0 ? (
                    subTasks.map((subTask) => (
                      <div
                        key={subTask.ref_sous_tache}
                        className="subtask-item"
                      >
                        <div className="subtask-status">
                          <span
                            className="status-dot"
                            style={{
                              backgroundColor: getStatusColor(subTask.statut),
                            }}
                          ></span>
                        </div>
                        <div className="subtask-content">
                          <div className="subtask-name">
                            {subTask.nom_sous_tache}
                          </div>
                          <div className="subtask-meta">
                            <span className="subtask-status-text">
                              {subTask.statut}
                            </span>
                            {subTask.date_fin_prevu && (
                              <>
                                <span className="subtask-separator">•</span>
                                <span className="subtask-date">
                                  <i className="bi bi-calendar"></i>
                                  {formatDate(subTask.date_fin_prevu)}
                                </span>
                              </>
                            )}
                            {subTask.utilisateurs &&
                              subTask.utilisateurs.length > 0 && (
                                <>
                                  <span className="subtask-separator">•</span>
                                  <span className="subtask-assignees">
                                    <i className="bi bi-person"></i>
                                    {subTask.utilisateurs.length} assigné(s)
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                        <div className="subtask-actions">
                          <button
                            className="subtask-action-btn"
                            title="Voir les détails"
                            onClick={() =>
                              handleViewSubTaskDetails(subTask.ref_sous_tache)
                            }
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-subtasks">
                      <i className="bi bi-list-task"></i>
                      <span>Aucune sous-tâche créée</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description de la tâche */}
          </div>

          {/* Section commentaires et fichiers avec boutons d'action */}
          <div className="task-comment-section">
            <div className="task-comment-tabs">
              <button
                className={`task-comment-tab ${
                  activeCommentTab === "comments" ? "active" : ""
                }`}
                onClick={() => setActiveCommentTab("comments")}
              >
                <i className="bi bi-chat-dots-fill"></i>
                Commentaires ({taskComments.length})
              </button>
              <button
                className={`task-comment-tab ${
                  activeCommentTab === "files" ? "active" : ""
                }`}
                onClick={() => setActiveCommentTab("files")}
              >
                <i className="bi bi-paperclip"></i>
                Fichiers ({realAttachments.length})
              </button>
            </div>

            <div className="task-comment-content">
              {activeCommentTab === "comments" && (
                <div className="task-comments-section">
                  {/* Aperçu des commentaires avec limite de 5 */}
                  <div className="comments-preview-container">
                    {isLoadingComments ? (
                      <div className="comments-loading">
                        <i className="bi bi-arrow-clockwise spin"></i>
                        Chargement des commentaires...
                      </div>
                    ) : (
                      renderCommentsPreview(taskComments)
                    )}
                  </div>

                  {/* Éditeur TipTap avec toolbar */}
                  <div className="quick-comment-section">
                    <div className="tiptap-toolbar">
                      {/* Groupe formatage de base */}
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("bold") ? "active" : ""
                          }`}
                          title="Gras (Ctrl+B)"
                          onClick={() => handleToolbarAction("bold")}
                          disabled={!editor}
                        >
                          <i className="bi bi-type-bold"></i>
                        </button>
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("italic") ? "active" : ""
                          }`}
                          title="Italique (Ctrl+I)"
                          onClick={() => handleToolbarAction("italic")}
                          disabled={!editor}
                        >
                          <i className="bi bi-type-italic"></i>
                        </button>
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("underline") ? "active" : ""
                          }`}
                          title="Souligné (Ctrl+U)"
                          onClick={() => handleToolbarAction("underline")}
                          disabled={!editor}
                        >
                          <i className="bi bi-type-underline"></i>
                        </button>
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("strike") ? "active" : ""
                          }`}
                          title="Barré"
                          onClick={() => handleToolbarAction("strike")}
                          disabled={!editor}
                        >
                          <i className="bi bi-type-strikethrough"></i>
                        </button>
                      </div>

                      <div className="toolbar-separator"></div>

                      {/* Groupe listes */}
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("bulletList") ? "active" : ""
                          }`}
                          title="Liste à puces"
                          onClick={() => handleToolbarAction("bullet")}
                          disabled={!editor}
                        >
                          <i className="bi bi-list-ul"></i>
                        </button>
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("orderedList") ? "active" : ""
                          }`}
                          title="Liste numérotée"
                          onClick={() => handleToolbarAction("numbered")}
                          disabled={!editor}
                        >
                          <i className="bi bi-list-ol"></i>
                        </button>
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("blockquote") ? "active" : ""
                          }`}
                          title="Citation"
                          onClick={() => handleToolbarAction("blockquote")}
                          disabled={!editor}
                        >
                          <i className="bi bi-quote"></i>
                        </button>
                      </div>

                      <div className="toolbar-separator"></div>

                      {/* Groupe code et liens */}
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("link") ? "active" : ""
                          }`}
                          title="Lien"
                          onClick={() => handleToolbarAction("link")}
                          disabled={!editor}
                        >
                          <i className="bi bi-link-45deg"></i>
                        </button>
                        <button
                          type="button"
                          className={`toolbar-btn ${
                            editor?.isActive("highlight") ? "active" : ""
                          }`}
                          title="Surligneur"
                          onClick={() => handleToolbarAction("highlight")}
                          disabled={!editor}
                        >
                          <i className="bi bi-highlighter"></i>
                        </button>
                      </div>

                      <div className="toolbar-separator"></div>

                      {/* Groupe fichiers et actions */}
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className="toolbar-btn"
                          title="Joindre un fichier"
                          onClick={() => handleToolbarAction("file")}
                        >
                          <i className="bi bi-paperclip"></i>
                        </button>
                      </div>

                      <div className="toolbar-separator"></div>

                      {/* Groupe annuler/refaire */}
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className="toolbar-btn"
                          title="Annuler (Ctrl+Z)"
                          onClick={() => handleToolbarAction("undo")}
                          disabled={!editor || !editor.can().undo()}
                        >
                          <i className="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          title="Refaire (Ctrl+Y)"
                          onClick={() => handleToolbarAction("redo")}
                          disabled={!editor || !editor.can().redo()}
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </button>
                      </div>
                    </div>

                    {/* Éditeur TipTap */}
                    <div className="tiptap-editor-container">
                      <EditorContent
                        editor={editor}
                        className="tiptap-editor"
                      />
                    </div>

                    <div className="quick-comment-actions">
                      <div className="comment-meta-info">
                        <span className="editor-info">
                          <i className="bi bi-info-circle"></i>
                          Utilisez la toolbar pour formater votre texte
                        </span>
                      </div>

                      <button
                        className="btn-send-quick-comment"
                        onClick={handleAddComment}
                      >
                        {isSubmittingComment ? (
                          <>
                            <i className="bi bi-arrow-clockwise spin"></i>{" "}
                            Envoi...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-fill"></i> Envoyer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeCommentTab === "files" && (
                <div className="task-files-section">
                  <div className="task-file-upload-zone">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleRealFileUpload}
                    />
                    <div
                      className={`task-upload-area ${
                        isUploadingFile ? "uploading" : ""
                      }`}
                      onClick={() =>
                        !isUploadingFile && fileInputRef.current?.click()
                      }
                    >
                      {isUploadingFile ? (
                        <>
                          <i className="bi bi-arrow-clockwise spin"></i>
                          <span>Upload en cours...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-upload-fill"></i>
                          <span>Cliquez pour ajouter des fichiers</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="task-attachments-container">
                    {isLoadingAttachments ? (
                      <div className="files-loading">
                        <i className="bi bi-arrow-clockwise spin"></i>
                        Chargement des fichiers...
                      </div>
                    ) : (
                      (() => {
                        const groupedFiles = groupFilesByType(realAttachments);
                        const hasFiles = Object.values(groupedFiles).some(
                          (group) => group.length > 0
                        );

                        if (!hasFiles) {
                          return (
                            <div className="no-files">
                              <i className="bi bi-file-earmark"></i>
                              <span>Aucun fichier attaché</span>
                            </div>
                          );
                        }

                        return (
                          <div className="files-by-type">
                            {/* Fichiers PDF */}
                            {groupedFiles.pdf.length > 0 && (
                              <div className="file-type-group">
                                <h4 className="file-type-title">
                                  <i className="bi bi-file-earmark-pdf-fill"></i>
                                  PDF ({groupedFiles.pdf.length})
                                </h4>
                                <div className="file-type-list">
                                  {groupedFiles.pdf.map((file) => (
                                    <div
                                      key={file.id_fichier_tache}
                                      className="task-attachment-item"
                                    >
                                      <div className="task-attachment-icon">
                                        <i className="bi bi-file-earmark-pdf-fill text-red"></i>
                                      </div>
                                      <div className="task-attachment-info">
                                        <div className="task-attachment-name">
                                          {file.nom_fichier}
                                        </div>
                                        <div className="task-attachment-meta">
                                          {file.taille_fichier &&
                                            `${(
                                              file.taille_fichier /
                                              1024 /
                                              1024
                                            ).toFixed(2)} MB`}{" "}
                                          •{formatDateTime(file.date_upload)}
                                        </div>
                                      </div>
                                      <div className="task-attachment-actions">
                                        <button
                                          className="task-attachment-action-btn"
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
                            )}

                            {/* Images */}
                            {groupedFiles.image.length > 0 && (
                              <div className="file-type-group">
                                <h4 className="file-type-title">
                                  <i className="bi bi-file-earmark-image-fill"></i>
                                  Images ({groupedFiles.image.length})
                                </h4>
                                <div className="file-type-list">
                                  {groupedFiles.image.map((file) => (
                                    <div
                                      key={file.id_fichier_tache}
                                      className="task-attachment-item"
                                    >
                                      <div className="task-attachment-icon">
                                        <i className="bi bi-file-earmark-image-fill text-blue"></i>
                                      </div>
                                      <div className="task-attachment-info">
                                        <div className="task-attachment-name">
                                          {file.nom_fichier}
                                        </div>
                                        <div className="task-attachment-meta">
                                          {file.taille_fichier &&
                                            `${(
                                              file.taille_fichier /
                                              1024 /
                                              1024
                                            ).toFixed(2)} MB`}{" "}
                                          •{formatDateTime(file.date_upload)}
                                        </div>
                                      </div>
                                      <div className="task-attachment-actions">
                                        <button
                                          className="task-attachment-action-btn"
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
                            )}

                            {/* Excel */}
                            {groupedFiles.excel.length > 0 && (
                              <div className="file-type-group">
                                <h4 className="file-type-title">
                                  <i className="bi bi-file-earmark-excel-fill"></i>
                                  Excel ({groupedFiles.excel.length})
                                </h4>
                                <div className="file-type-list">
                                  {groupedFiles.excel.map((file) => (
                                    <div
                                      key={file.id_fichier_tache}
                                      className="task-attachment-item"
                                    >
                                      <div className="task-attachment-icon">
                                        <i className="bi bi-file-earmark-excel-fill text-green"></i>
                                      </div>
                                      <div className="task-attachment-info">
                                        <div className="task-attachment-name">
                                          {file.nom_fichier}
                                        </div>
                                        <div className="task-attachment-meta">
                                          {file.taille_fichier &&
                                            `${(
                                              file.taille_fichier /
                                              1024 /
                                              1024
                                            ).toFixed(2)} MB`}{" "}
                                          •{formatDateTime(file.date_upload)}
                                        </div>
                                      </div>
                                      <div className="task-attachment-actions">
                                        <button
                                          className="task-attachment-action-btn"
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
                            )}

                            {/* Word */}
                            {groupedFiles.word.length > 0 && (
                              <div className="file-type-group">
                                <h4 className="file-type-title">
                                  <i className="bi bi-file-earmark-word-fill"></i>
                                  Word ({groupedFiles.word.length})
                                </h4>
                                <div className="file-type-list">
                                  {groupedFiles.word.map((file) => (
                                    <div
                                      key={file.id_fichier_tache}
                                      className="task-attachment-item"
                                    >
                                      <div className="task-attachment-icon">
                                        <i className="bi bi-file-earmark-word-fill text-blue-dark"></i>
                                      </div>
                                      <div className="task-attachment-info">
                                        <div className="task-attachment-name">
                                          {file.nom_fichier}
                                        </div>
                                        <div className="task-attachment-meta">
                                          {file.taille_fichier &&
                                            `${(
                                              file.taille_fichier /
                                              1024 /
                                              1024
                                            ).toFixed(2)} MB`}{" "}
                                          •{formatDateTime(file.date_upload)}
                                        </div>
                                      </div>
                                      <div className="task-attachment-actions">
                                        <button
                                          className="task-attachment-action-btn"
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
                            )}

                            {/* Autres fichiers */}
                            {groupedFiles.other.length > 0 && (
                              <div className="file-type-group">
                                <h4 className="file-type-title">
                                  <i className="bi bi-file-earmark-fill"></i>
                                  Autres ({groupedFiles.other.length})
                                </h4>
                                <div className="file-type-list">
                                  {groupedFiles.other.map((file) => (
                                    <div
                                      key={file.id_fichier_tache}
                                      className="task-attachment-item"
                                    >
                                      <div className="task-attachment-icon">
                                        <i
                                          className={`bi ${getFileIconByExtension(
                                            file.nom_fichier
                                          )}`}
                                        ></i>
                                      </div>
                                      <div className="task-attachment-info">
                                        <div className="task-attachment-name">
                                          {file.nom_fichier}
                                        </div>
                                        <div className="task-attachment-meta">
                                          {file.taille_fichier &&
                                            `${(
                                              file.taille_fichier /
                                              1024 /
                                              1024
                                            ).toFixed(2)} MB`}{" "}
                                          •{formatDateTime(file.date_upload)}
                                        </div>
                                      </div>
                                      <div className="task-attachment-actions">
                                        <button
                                          className="task-attachment-action-btn"
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
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Modal pour ajouter un lien */}
        {showLinkModal && (
          <div
            className="link-modal-overlay"
            onClick={() => setShowLinkModal(false)}
          >
            <div className="link-modal" onClick={(e) => e.stopPropagation()}>
              <div className="link-modal-header">
                <h3>
                  <i className="bi bi-link-45deg"></i> Ajouter un lien
                </h3>
                <button
                  className="link-modal-close"
                  onClick={() => setShowLinkModal(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="link-modal-body">
                <div className="link-input-group">
                  <label htmlFor="link-url">URL du lien *</label>
                  <input
                    id="link-url"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://exemple.com"
                    className="link-input"
                  />
                </div>
                <div className="link-input-group">
                  <label htmlFor="link-text">
                    Texte à afficher (optionnel)
                  </label>
                  <input
                    id="link-text"
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Texte du lien"
                    className="link-input"
                  />
                </div>
              </div>
              <div className="link-modal-actions">
                <button
                  className="btn-cancel-link"
                  onClick={() => setShowLinkModal(false)}
                >
                  <i className="bi bi-x-lg"></i> Annuler
                </button>
                <button
                  className="btn-add-link"
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                >
                  <i className="bi bi-check-lg"></i> Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de confirmation d'assignation */}
        {showConfirmation && selectedUser && (
          <div
            className="confirmation-overlay"
            onClick={() => setShowConfirmation(false)}
          >
            <div
              className="confirmation-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirmation-header">
                <h3>
                  <i className="bi bi-question-circle-fill"></i>Confirmer l'assignation
                </h3>
              </div>
              <div className="confirmation-body">
                <p>Voulez-vous assigner cette tâche à :</p>
                <div className="user-confirmation-card">
                  <div className="user-avatar">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div className="user-details">
                    <span className="user-name">
                      {selectedUser.nom} {selectedUser.prenom}
                    </span>
                    <span className="user-matricule">
                      #{selectedUser.matricule}
                    </span>
                    <span className="user-role">
                      {selectedUser.intitule_poste || "Membre"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="confirmation-actions">
                <button
                  className="btn-cancel-confirmation"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isAssigning}
                >
                  <i className="bi bi-x-lg"></i> Annuler
                </button>
                <button
                  className="btn-confirm-assignment"
                  onClick={confirmAssignUser}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <i className="bi bi-arrow-clockwise spin"></i>{" "}
                      Assignment...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i> Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour créer une sous-tâche */}
        {showSubTaskModal && (
          <SubTaskModal
            isOpen={showSubTaskModal}
            onClose={() => setShowSubTaskModal(false)}
            parentTask={tache}
            onSubTaskCreated={handleSubTaskCreated}
          />
        )}

        {/* Modal pour afficher les détails d'une sous-tâche */}
        {showSubTaskDetailsModal && (
          <SubTaskDetailsModal
            subTaskRef={selectedSubTaskRef}
            isOpen={showSubTaskDetailsModal}
            onClose={() => {
              setShowSubTaskDetailsModal(false);
              setSelectedSubTaskRef(null);
            }}
            onStatusUpdate={refreshTaskData}
          />
        )}

        {/* Modal des commentaires */}
        {showCommentsModal && (
          <CommentsModal
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            tache={tache}
            subTasks={subTasks}
          />
        )}
      </div>

      {/* Modal pour afficher les messages */}
      {isModalOpen && (
        <MessageModal
          message={modalMessage}
          type={modalType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TacheModal;
