import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { UtilisateurService } from "../services/UtilisateurService";
import ForgotPasswordModal from "../modals/ForgotPasswordModal";
import "../styles/LoginScreen.css";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const animateElements = () => {
      const elements = [
        ".logo-section",
        ".login-card",
        ".form-group:nth-child(1)",
        ".form-group:nth-child(2)",
        ".submit-button",
        ".forgot-password-link",
      ];
      elements.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.animationDelay = `${index * 0.2}s`;
        }
      });
    };
    animateElements();
  }, []);

  const handleInputFocus = (e) => {
    const formGroup = e.target.closest(".form-group");
    const label = formGroup.querySelector(".form-label");
    if (label) {
      label.style.color = "#6964A7";
      label.style.transform = "translateY(-2px)";
    }
  };

  const handleInputBlur = (e) => {
    const formGroup = e.target.closest(".form-group");
    const label = formGroup.querySelector(".form-label");
    if (label && !e.target.value) {
      label.style.color = "#d6d5e6";
      label.style.transform = "translateY(0)";
    }
  };

  useEffect(() => {
    const inputs = document.querySelectorAll(".form-input");
    inputs.forEach((input) => {
      input.addEventListener("focus", handleInputFocus);
      input.addEventListener("blur", handleInputBlur);
    });
    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("focus", handleInputFocus);
        input.removeEventListener("blur", handleInputBlur);
      });
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await UtilisateurService.login(email, password);
      const matricule = localStorage.getItem("matricule");
      if (!matricule) throw new Error("Matricule manquant");
      navigate("/home");
    } catch (err) {
      console.error("Erreur de connexion :", err);
      setError(err.message || "Email ou mot de passe incorrect");
    }
  };

  return (
    <>
      <ForgotPasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="login-container">
        <div className="logo-section">
          <div className="logo-container1">
            <img src="/img/logo-text.png" alt="F&A Logo" className="logo-image1" />
          </div>
        </div>

        <div className="form-section">
          <div className="login-card">
            <div className="card-header1">
              <h2 className="welcome-title">Bienvenue</h2>
              <p className="welcome-subtitle">Pour commencer , veuillez vous connecter</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <FontAwesomeIcon icon={faUser} className="form-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Entrez votre email"
                />
              </div>

              <div className="form-group">
                <FontAwesomeIcon icon={faLock} className="form-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="submit-button">Se connecter</button>

              <div className="forgot-password-container">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="forgot-password-link"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginScreen;
