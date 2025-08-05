import React, { forwardRef } from "react";

const ValidationForm = forwardRef(
  (
    {
      maitreOuvrage,
      setMaitreOuvrage,
      nomDevis,
      setNomDevis,
      coursAriary,
      setCoursAriary,
      surfaceType,
      newSurface,
      selectedProjects,
      standardTravaux,
      customTravaux,
      montantsStandard,
      montantsCustom,
      pourcentagesInitiaux,
      devisResults,
      showAllStandard,
      setShowAllStandard,
      showAllCustom,
      setShowAllCustom,
      handleMontantChange,
      formatNombre,
      totalStandard,
      totalCustom,
      totalFinale,
      totalAriary,
      surfaceMoyenne,
      isEditMode = false,
      codeFiche,
      version,
      projetReferrent,
    },
    ref
  ) => {
    const displayStandard = showAllStandard
      ? standardTravaux
      : standardTravaux.slice(0, 5);
    const displayCustom = showAllCustom
      ? customTravaux
      : customTravaux.slice(0, 5);

    return (
      <div className="validation-container" ref={ref}>
        <h1 className="title-validation">Fiche validation de l'estimation</h1>
        {isEditMode && (
          <div
            className="edit-mode-header"
            style={{
              backgroundColor: "#353548ff",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #514f84",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-edit" style={{ color: "#514f84" }}></i>
              <div>
                <strong>Mode Édition</strong>
                <div style={{ fontSize: "14px", color: "#a5a2a2ff" }}>
                  Code Fiche: <strong>{codeFiche}</strong> | Version:{" "}
                  <strong>{version}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
        <table className="validation-table">
          <thead>
            <tr>
              <th>Maître d'ouvrage</th>
              <td colSpan={2}>
                <input
                  type="text"
                  value={maitreOuvrage}
                  onChange={(e) => setMaitreOuvrage(e.target.value)}
                  placeholder="Nom du maître d'ouvrage"
                />
              </td>
            </tr>
            <tr>
              <th>Nom du devis</th>
              <td colSpan={2}>
                <input
                  type="text"
                  value={nomDevis}
                  onChange={(e) => setNomDevis(e.target.value)}
                  placeholder="Nom du devis"
                />
              </td>
            </tr>
            <tr>
              <th>Date</th>
              <td>{new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <th>Cours Euro → MGA</th>
              <td colSpan={2}>
                <input
                  type="number"
                  value={coursAriary}
                  onChange={(e) => setCoursAriary(e.target.value)}
                  placeholder="Cours MGA"
                />
              </td>
            </tr>
            <tr className="tr-spec">
              <th>Type de surface</th>
              <th>Surface totale (m²)</th>
              <th>Projets référents</th>
            </tr>
          </thead>
           <tbody>
            <tr>
              <td>{surfaceType || "Non défini"}</td>
              <td>{Number(newSurface || 0)}</td>
              <td>
                {isEditMode 
                  ? (projetReferrent || "Aucun1")
                  : (selectedProjects?.map((p) => p.nom_projet).join(", ") || "Aucun")
                  }
              </td>
            </tr>
          </tbody>
        </table>

        {/* Travaux Standards */}
        <h3>Travaux Standards</h3>
        <table className="result-table">
          <thead>
            <tr>
              <th>Nom du Travaux</th>
              <th>Montant (€)</th>
              <th>Montant (MGA)</th>
              <th>% Initial</th>
              <th>% Actuel</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayStandard.map((travaux) => {
              const montant = Number(montantsStandard[travaux.id] || 0);
              const pourcentageInitial = Number(
                pourcentagesInitiaux[travaux.id] || 0
              );
              const pourcentageActuel =
                totalFinale > 0 ? (montant / totalFinale) * 100 : 0;
              const montantAriary = coursAriary
                ? (montant * Number(coursAriary)).toFixed(0)
                : "-";

              const montantBase =
                devisResults.find((d) => d.id_travaux === travaux.id)
                  ?.montant || 0;

              return (
                <tr key={travaux.id}>
                  <td>{travaux.name}</td>
                  <td>
                    <input
                      type="text"
                      value={
                        montantsStandard[travaux.id] !== undefined &&
                        montantsStandard[travaux.id] !== ""
                          ? formatNombre(montantsStandard[travaux.id])
                          : ""
                      }
                      placeholder={formatNombre(montantBase)}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\s/g, "");
                        handleMontantChange(travaux.id, cleanValue, true);
                      }}
                    />
                  </td>
                  <td>
                    {montantAriary !== "-"
                      ? `${formatNombre(montantAriary)} Ar`
                      : "-"}
                  </td>
                  <td>{pourcentageInitial.toFixed(2)}%</td>
                  <td>
                    <div className="percentage-cell">
                      <span className="percentage-text">
                        {pourcentageActuel.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="mini-chart">
                      <div
                        className="chart-bar chart-bar-initial"
                        style={{
                          height: `${Math.min(pourcentageInitial * 1, 20)}px`,
                        }}
                        title={`Initial: ${pourcentageInitial.toFixed(2)}%`}
                      ></div>
                      <div
                        className="chart-bar chart-bar-actual"
                        style={{
                          height: `${Math.min(pourcentageActuel * 1, 20)}px`,
                        }}
                        title={`Actuel: ${pourcentageActuel.toFixed(2)}%`}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Total Standard</strong>
              </td>
              <td>
                <strong>{totalStandard.toFixed(2)} €</strong>
              </td>
              <td>
                <strong>
                  {coursAriary
                    ? `${formatNombre(
                        (totalStandard * Number(coursAriary)).toFixed(0)
                      )} Ar`
                    : "-"}
                </strong>
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Bouton Voir plus/moins pour les travaux standards */}
        {standardTravaux.length > 5 && (
          <div style={{ textAlign: "center", margin: "10px 0" }}>
            <button
              onClick={() => setShowAllStandard(!showAllStandard)}
              style={{
                backgroundColor: "#60499c",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {showAllStandard
                ? "Voir moins"
                : `Voir plus (${standardTravaux.length - 5} restants)`}
            </button>
          </div>
        )}

        {/* Travaux Personnalisés */}
        <h3 style={{ marginTop: "2em" }}>Travaux Personnalisés</h3>
        <table className="result-table">
          <thead>
            <tr>
              <th>Nom du Travaux</th>
              <th>Montant (€)</th>
              <th>Montant (MGA)</th>
              <th>% Initial</th>
              <th>% Actuel</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayCustom.map((travaux) => {
              const montant = Number(montantsCustom[travaux.id] || 0);
              const pourcentageInitial = Number(
                pourcentagesInitiaux[travaux.id] || 0
              );
              const pourcentageActuel =
                totalFinale > 0 ? (montant / totalFinale) * 100 : 0;
              const montantAriary = coursAriary
                ? (montant * Number(coursAriary)).toFixed(0)
                : "-";

              const montantBase = travaux.montant || 0;

              return (
                <tr key={travaux.id}>
                  <td>{travaux.name}</td>
                  <td>
                    <input
                      type="text"
                      value={
                        montantsCustom[travaux.id] !== undefined &&
                        montantsCustom[travaux.id] !== ""
                          ? formatNombre(montantsCustom[travaux.id])
                          : ""
                      }
                      placeholder={formatNombre(montantBase)}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\s/g, "");
                        handleMontantChange(travaux.id, cleanValue, false);
                      }}
                    />
                  </td>
                  <td>
                    {montantAriary !== "-"
                      ? `${formatNombre(montantAriary)} Ar`
                      : "-"}
                  </td>
                  <td>{pourcentageInitial.toFixed(2)}%</td>
                  <td>
                    <div className="percentage-cell">
                      <span className="percentage-text">
                        {pourcentageActuel.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="mini-chart">
                      <div
                        className="chart-bar chart-bar-initial"
                        style={{
                          height: `${Math.min(pourcentageInitial * 1, 20)}px`,
                        }}
                        title={`Initial: ${pourcentageInitial.toFixed(2)}%`}
                      ></div>
                      <div
                        className="chart-bar chart-bar-actual"
                        style={{
                          height: `${Math.min(pourcentageActuel * 1, 20)}px`,
                        }}
                        title={`Actuel: ${pourcentageActuel.toFixed(2)}%`}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Total Personnalisé</strong>
              </td>
              <td>
                <strong>{totalCustom.toFixed(2)} €</strong>
              </td>
              <td>
                <strong>
                  {coursAriary
                    ? `${formatNombre(
                        (totalCustom * Number(coursAriary)).toFixed(0)
                      )} Ar`
                    : "-"}
                </strong>
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Bouton Voir plus/moins pour les travaux personnalisés */}
        {customTravaux.length > 5 && (
          <div style={{ textAlign: "center", margin: "10px 0" }}>
            <button
              onClick={() => setShowAllCustom(!showAllCustom)}
              style={{
                backgroundColor: "#60499c",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {showAllCustom
                ? "Voir moins"
                : `Voir plus (${customTravaux.length - 5} restants)`}
            </button>
          </div>
        )}

        {/* Totaux Globaux */}
        <section
          className="total-global-container"
          style={{ marginTop: "2em" }}
        >
          <table className="total-global-table">
            <tfoot>
              <tr>
                <td>
                  <strong>Total Standard</strong>
                </td>
                <td>
                  <strong>{totalStandard.toFixed(2)} €</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Total Personnalisé</strong>
                </td>
                <td>
                  <strong>{totalCustom.toFixed(2)} €</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Prix par (m²) en euro ( €) </strong>
                </td>
                <td>
                  <strong>
                    {(totalStandard / surfaceMoyenne).toFixed(2)} €
                  </strong>
                </td>
              </tr>
              <tr
                className="total-general-row"
                style={{
                  fontWeight: "bold",
                  fontSize: "1.6em",
                  backgroundColor: "#f0f8ff",
                  borderTop: "2px solid #60499c",
                  color: "#60499c",
                }}
              >
                <td className="totale">Total Général</td>
                <td className="totale-d">{formatNombre(totalFinale)} €</td>
              </tr>
              <tr
                className="total-general-row"
                style={{
                  fontWeight: "bold",
                  fontSize: "1.6em",
                  backgroundColor: "#f0f8ff",
                  borderTop: "2px solid #60499c",
                  color: "#60499c",
                }}
              >
                <td className="totale">Total Général en Ariary</td>
                <td className="totale-d">
                  {totalAriary ? `${formatNombre(totalAriary)} Ar` : "-"}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>
    );
  }
);

ValidationForm.displayName = "ValidationForm";

export default ValidationForm;
