import React, { useState, useRef, useEffect } from "react";
import "../styles/CommentsModal.css";
import { TacheService } from "../services/TacheService";
import MessageModal from "./MessageModal";

const CommentsModal = ({ isOpen, onClose, tache, subTasks = [] }) => {
  const [activeTab, setActiveTab] = useState("main");
  const [taskComments, setTaskComments] = useState([]);
  const [subTaskComments, setSubTaskComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const commentInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && tache) {
      loadComments();
    }
  }, [isOpen, tache]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      // Charger les commentaires de la tâche principale
      const taskCommentsResponse = await TacheService.get_task_comment(
        tache.ref_tache
      );
      setTaskComments(taskCommentsResponse || []);

      // Charger les commentaires des sous-tâches
      const subTaskCommentsMap = {};
      for (const subTask of subTasks) {
        try {
          const subCommentsResponse = await TacheService.get_sub_task_comment(
            subTask.ref_sous_tache
          );
          subTaskCommentsMap[subTask.ref_sous_tache] =
            subCommentsResponse|| [];
        } catch (error) {
          console.error(
            `Erreur lors du chargement des commentaires pour la sous-tâche ${subTask.ref_sous_tache}:`,
            error
          );
          subTaskCommentsMap[subTask.ref_sous_tache] = [];
        }
      }
      setSubTaskComments(subTaskCommentsMap);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
      setModalMessage("Erreur lors du chargement des commentaires");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        commentaire: newComment.trim(),
        matricule: localStorage.getItem("matricule"),
        ref_tache: activeTab === "main" ? tache.ref_tache : null,
        ref_sous_tache: activeTab !== "main" ? activeTab : null,
      };

      await TacheService.create_comment(commentData);

      setModalMessage("Commentaire ajouté avec succès !");
      setModalType("success");
      setIsModalOpen(true);

      setNewComment("");
      await loadComments(); // Recharger les commentaires
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      setModalMessage("Erreur lors de l'ajout du commentaire");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
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

  const insertTextAtCursor = (text) => {
    const textarea = commentInputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = newComment;
    const newValue =
      currentValue.substring(0, start) + text + currentValue.substring(end);
    setNewComment(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const formatText = (type) => {
    const textarea = commentInputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newComment.substring(start, end);

    let formattedText = "";
    let cursorOffset = 0;

    switch (type) {
      case "bold":
        formattedText = selectedText
          ? `**${selectedText}**`
          : "**texte en gras**";
        cursorOffset = selectedText ? 2 : 2;
        break;
      case "italic":
        formattedText = selectedText
          ? `*${selectedText}*`
          : "*texte en italique*";
        cursorOffset = selectedText ? 1 : 1;
        break;
      case "code":
        formattedText = selectedText ? `\`${selectedText}\`` : "`code`";
        cursorOffset = selectedText ? 1 : 1;
        break;
      case "list":
        const lines = selectedText.split('\n');
        if (selectedText) {
          formattedText = lines.map(line => line.trim() ? `• ${line}` : line).join('\n');
        } else {
          formattedText = "\n• Élément de liste";
        }
        cursorOffset = 2;
        break;
      case "numbered-list":
        const numberedLines = selectedText.split('\n');
        if (selectedText) {
          formattedText = numberedLines
            .map((line, index) => line.trim() ? `${index + 1}. ${line}` : line)
            .join('\n');
        } else {
          formattedText = "\n1. Élément numéroté";
        }
        cursorOffset = 3;
        break;
      case "underline":
        formattedText = selectedText
          ? `__${selectedText}__`
          : "__texte souligné__";
        cursorOffset = selectedText ? 2 : 2;
        break;
    }

    const newValue =
      newComment.substring(0, start) +
      formattedText +
      newComment.substring(end);
    setNewComment(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + formattedText.length);
      } else {
        const cursorPos = start + cursorOffset;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  const renderComments = (comments) => {
    if (!comments || comments.length === 0) {
      return (
        <div className="no-comments">
          <i className="bi bi-chat-dots"></i>
          <span>Aucun commentaire pour le moment</span>
        </div>
      );
    }

    return comments.map((comment) => (
      <div key={comment.id_commentaires} className="comment-item">
        <div className="comment-avatar">
          <i className="bi bi-person-circle"></i>
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">
              {comment.matricule || "Utilisateur"}
            </span>
            <span className="comment-time">
              {formatDateTime(comment.date_commentaire)}
            </span>
          </div>
          <div 
            className="comment-content"
            dangerouslySetInnerHTML={{
              __html: comment.commentaire
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/^• (.+)$/gm, '<li>$1</li>')
                .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            }}
          />
        </div>
      </div>
    ));
  };

  const getCurrentComments = () => {
    if (activeTab === "main") {
      return taskComments;
    }
    return subTaskComments[activeTab] || [];
  };

  if (!isOpen || !tache) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div
        className="comments-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="comments-modal-header">
          <h2 className="comments-modal-title">
            <i className="bi bi-chat-dots-fill"></i>
            Commentaires - {tache.nom_tache}
          </h2>
          <button className="comments-modal-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </header>

        <div className="comments-modal-body">
          {/* Onglets */}
          <div className="comments-tabs">
            <button
              className={`comments-tab ${activeTab === "main" ? "active" : ""}`}
              onClick={() => setActiveTab("main")}
            >
              <i className="bi bi-list-task"></i>
              Tâche principale ({taskComments.length})
            </button>
            {subTasks.map((subTask) => (
              <button
                key={subTask.ref_sous_tache}
                className={`comments-tab ${
                  activeTab === subTask.ref_sous_tache ? "active" : ""
                }`}
                onClick={() => setActiveTab(subTask.ref_sous_tache)}
              >
                <i className="bi bi-diagram-3"></i>
                {subTask.nom_sous_tache} (
                {(subTaskComments[subTask.ref_sous_tache] || []).length})
              </button>
            ))}
          </div>

          {/* Liste des commentaires */}
          <div className="comments-list-container">
            {isLoading ? (
              <div className="comments-loading">
                <i className="bi bi-arrow-clockwise spin"></i>
                Chargement des commentaires...
              </div>
            ) : (
              <div className="comments-list">
                {renderComments(getCurrentComments())}
              </div>
            )}
          </div>

          {/* Formulaire d'ajout de commentaire */}
          <div className="add-comment-section">
            <div className="comment-toolbar">
              <div className="toolbar-group">
                <button
                  className="toolbar-btn"
                  onClick={() => formatText("bold")}
                  title="Gras (Ctrl+B)"
                >
                  <i className="bi bi-type-bold"></i>
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => formatText("italic")}
                  title="Italique (Ctrl+I)"
                >
                  <i className="bi bi-type-italic"></i>
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => formatText("underline")}
                  title="Souligné"
                >
                  <i className="bi bi-type-underline"></i>
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => formatText("code")}
                  title="Code"
                >
                  <i className="bi bi-code-slash"></i>
                </button>
              </div>
              <div className="toolbar-group">
                <button
                  className="toolbar-btn"
                  onClick={() => formatText("list")}
                  title="Liste à puces"
                >
                  <i className="bi bi-list-ul"></i>
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => formatText("numbered-list")}
                  title="Liste numérotée"
                >
                  <i className="bi bi-list-ol"></i>
                </button>
              </div>
            </div>

            <textarea
              ref={commentInputRef}
              className="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire... (Ctrl+Entrée pour envoyer)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleAddComment();
                }
                if (e.key === "b" && e.ctrlKey) {
                  e.preventDefault();
                  formatText("bold");
                }
                if (e.key === "i" && e.ctrlKey) {
                  e.preventDefault();
                  formatText("italic");
                }
              }}
            />

            <div className="comment-input-actions">
              <div className="input-help">
                <i className="bi bi-info-circle-fill"></i>
                <span>
                  Ctrl + Entrée pour envoyer • Ctrl + B pour gras • Ctrl + I
                  pour italique
                </span>
              </div>
              <button
                className="btn-send-comment"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="bi bi-arrow-clockwise spin"></i> Envoi...
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

export default CommentsModal;