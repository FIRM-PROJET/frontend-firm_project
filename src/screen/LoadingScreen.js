import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoadingScreen.css';

const LoadingScreen = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 3) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            navigate("/login");
          }, 500); 
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  if (!isLoading) {
    return null; // Ou un spinner pendant la navigation
  }

  return (
    <div className="loading-container">
      {/* Image de fond */}
      <div 
        className="background-image"
        style={{
          backgroundImage: "url('/img/archi-pic.png')"
        }}
      ></div>
      
      {/* Logo et texte */}
      <div className="logo-container">
        <img 
          src="/img/logo-text.png" 
          alt="Logo" 
          className="logo-image"
        />
      </div>
      
      {/* Indicateurs de chargement */}
      <div className="loading-dots">
        <div className={`dot ${loadingProgress >= 1 ? 'active' : ''}`}></div>
        <div className={`dot ${loadingProgress >= 2 ? 'active' : ''}`}></div>
        <div className={`dot ${loadingProgress >= 3 ? 'active' : ''}`}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;