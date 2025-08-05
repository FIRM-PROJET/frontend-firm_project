import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/DevisCSS/DevisResultScreen.css";
import { DevisService } from "../../services/DevisService";

const DevisResultScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    devisResults,
    allTravaux,
    selectedProjects = [],
  } = location.state || {};

  const [surfaceData, setSurfaceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurfaceType, setSelectedSurfaceType] = useState(null);
  const [customSurface, setCustomSurface] = useState("");
  const [newSurface, setNewSurface] = useState("");

  useEffect(() => {
    const fetchSurfaces = async () => {
      try {
        const allSurfaces = [];
        for (const project of selectedProjects) {
          const data = await DevisService.get_projects_surface(
            project.id_projet
          );
          allSurfaces.push(...data);
        }
        setSurfaceData(allSurfaces);
      } catch (error) {
        console.error("Erreur chargement surfaces:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurfaces();
  }, [selectedProjects]);

  const surfaceParType = {};
  surfaceData.forEach(({ nom_surface, surface }) => {
    const s = Number(surface || 0);
    if (!surfaceParType[nom_surface]) {
      surfaceParType[nom_surface] = { total: 0, count: 0 };
    }
    surfaceParType[nom_surface].total += s;
    surfaceParType[nom_surface].count += 1;
  });

  const moyennesParSurface = Object.entries(surfaceParType).map(
    ([nom_surface, { total, count }]) => ({
      nom_surface,
      moyenne: total / count,
    })
  );

  const standardTravaux =
    allTravaux?.filter((t) => t.type === "standard") || [];
  const customTravaux = allTravaux?.filter((t) => t.type === "custom") || [];

  const totalStandard = standardTravaux.reduce((sum, travaux) => {
    const devis = devisResults.find((d) => d.id_travaux === travaux.id);
    return sum + (devis?.montant || 0);
  }, 0);

  const totalCustom = customTravaux.reduce(
    (sum, travaux) => sum + Number(travaux.montant || 0),
    0
  );

  const surfaceMoyenneChoisie = Number(customSurface || 0);
  const prixParM2 =
    surfaceMoyenneChoisie > 0 ? totalStandard / surfaceMoyenneChoisie : 0;
  const estimationFinale = newSurface
    ? prixParM2 * Number(newSurface) + totalCustom
    : 0;

  const handleValidation = () => {
    navigate("/devis/validation", {
      state: {
        surfaceType: selectedSurfaceType,
        surfaceMoyenne: surfaceMoyenneChoisie,
        estimationFinale,
        prixParM2,
        allTravaux,
        selectedProjects,
        newSurface: Number(newSurface),
        devisResults,
      },
    });
  };

  if (loading) return <div className="loading">Chargement des données...</div>;

  return (
    <div className="result-container">
      <button className="back-button3" onClick={() => navigate(-1)}>
          <i className="bi bi-caret-left-fill"></i> Retour
        </button>
      <h2 className="title1">Etape 4 : Choix de la type de surface</h2>
      <p className="subtitle1">
        {" "}
        Veuillez choisir le type de surface pour effectuer le calcul de votre
        estimation
      </p>

      <section className="types-surfaces-list">
        {moyennesParSurface.map((item, index) => {
          const isSelected = selectedSurfaceType === item.nom_surface;
          return (
            <div
              key={index}
              className={`type-surface-card ${isSelected ? "selected" : ""}`}
              onClick={() => {
                setSelectedSurfaceType(item.nom_surface);
                setCustomSurface(item.moyenne.toFixed(2));
                setNewSurface("");
              }}
            >
              <div className="type-name">{item.nom_surface}</div>
              <div className="type-description">
                Moyenne : <strong>{item.moyenne.toFixed(2)} m²</strong>
              </div>
            </div>
          );
        })}
      </section>

      {selectedSurfaceType && (
        <section className="custom-surface-form">
          <h4>Estimation sur {selectedSurfaceType}</h4>

          <table className="estimation-table">
            <tbody>
              <tr>
                <td>Type sélectionné :</td>
                <td>{selectedSurfaceType}</td>
              </tr>
              <tr>
                <td>Surface moyenne :</td>
                <td>{customSurface} m²</td>
              </tr>
              <tr>
                <td>Prix standard / m² :</td>
                <td>
                  {prixParM2.toFixed(2)}{" "}
                  <i className="fa-solid fa-euro-sign"></i>
                </td>
              </tr>
              <tr>
                <td>Total personnalisés :</td>
                <td>
                  {totalCustom.toFixed(2)}{" "}
                  <i className="fa-solid fa-euro-sign"></i>
                </td>
              </tr>
            </tbody>
          </table>

          <label htmlFor="new-surface">Nouvelle surface à estimer :  </label>
          <input
            id="new-surface"
            type="number"
            value={newSurface}
            onChange={(e) => setNewSurface(e.target.value)}
          /> m²

          {newSurface && (
            <div className="estimation-total">
              Total :{" "}
              {estimationFinale.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </div>
          )}

          {selectedSurfaceType && newSurface && (
            <button className="btn-validate" onClick={handleValidation}>
              <i className="fa-solid fa-check-circle"></i> Valider cette
              estimation
            </button>
          )}
        </section>
      )}
    </div>
  );
};

export default DevisResultScreen;
