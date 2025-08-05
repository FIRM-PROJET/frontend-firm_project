import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DevisService } from '../../services/DevisService';
import '../../styles/DevisCSS/NewDevisScreen.css';

const NewDevisScreen = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [constructionTypes, setConstructionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConstructionTypes = async () => {
      try {
        const data = await DevisService.getTypeConstruction();
        setConstructionTypes(data);
      } catch (err) {
        setError("Erreur lors du chargement des types.");
      } finally {
        setLoading(false);
      }
    };
    fetchConstructionTypes();
  }, []);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    navigate('/devis/etape1', {
      state: {
        selectedType: typeId,
        typeInfo: constructionTypes.find(t => t.id_type_construction === typeId)
      }
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container dark">
      <div className="header">
        <button className="back-button3" onClick={() => navigate(-1)}>
          <i className="bi bi-caret-left-fill"></i> Retour
        </button>
        <h2 className="title1">Étape 1 : Choix du type de construction</h2>
        <p className="subtitle">Choisissez le type de construction que vous souhaitez estimer.</p>
      </div>

      <div className="types-grid">
        {constructionTypes.map((type) => (
          <div
            key={type.id_type_construction}
            className={`type-card ${selectedType === type.id_type_construction ? 'selected' : ''}`}
            onClick={() => handleTypeSelect(type.id_type_construction)}
          >
            <div className="type-icon">
              <i className="bi bi-building-fill"></i>
            </div>
            <div className="type-content">
              <h4 className="type-title">{type.nom_type_construction}</h4>
              <p className="type-description1">{type.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewDevisScreen;
