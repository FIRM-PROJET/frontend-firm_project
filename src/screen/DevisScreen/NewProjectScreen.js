import React, { useState, useEffect } from "react";
import { DevisService } from "../../services/DevisService";
import "../../styles/DevisCSS/NewProjectScreen.css";
import ClientModal from "../../modals/ClientModal";

const NewProjectScreen = () => {
  const [projectData, setProjectData] = useState({
    nom_projet: "",
    description: "",
    id_client: "",
    id_type_construction: "",
    total_ht: "",
    total_ttc: "",
    date_devis: "",
    localisation: "",
  });

  const [projectDetails, setProjectDetails] = useState({
    nombre_etages: "",
    surface_totale: "",
    id_type_surface: "",
    id_structure: "",
    id_fondation: "",
    id_menuiserie: "",
    id_toiture: "",
    id_type_plancher: "",
    // Nouveaux champs pour les 3 types de surface
    surfaceSHAB: "",
    surfaceSHON: "",
    surfaceSHOB: "",
  });

  const [fondations, setFondations] = useState([]);
  const [menuiseries, setMenuiseries] = useState([]);
  const [structures, setStructures] = useState([]);
  const [clients, setClients] = useState([]);
  const [toitures, setToitures] = useState([]);
  const [typePlanchers, setTypePlanchers] = useState([]);
  const [typeConstructions, setTypeConstructions] = useState([]);
  const [typeSurfaces, setTypeSurfaces] = useState([]);

  const [devisFile, setDevisFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadedDevis, setUploadedDevis] = useState(null);
  const [uploadImages, setUploadedImages] = useState([]);
  const [createdProjectId, setCreatedProjectId] = useState(null);

  const [showClientModal, setShowClientModal] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Liste statique des régions de Madagascar
const regionsMadagascar = [
  "Antananarivo",
  "Toamasina",
  "Antsirabe",
  "Fianarantsoa",
  "Mahajanga",
  "Toliara",
  "Antsiranana",
  "Autres"
];


  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          fondationsData,
          menuiseriesData,
          structuresData,
          toituresData,
          typePlanchersData,
          typeConstructionData,
          clientsData,
          typeSurfacesData,
        ] = await Promise.all([
          DevisService.getFondations(),
          DevisService.getMenuiserie(),
          DevisService.getStructure(),
          DevisService.getToiture(),
          DevisService.get_type_plancher(),
          DevisService.getTypeConstruction(),
          DevisService.getClients(),
          DevisService.getTypesSurfaces(),
        ]);

        setFondations(fondationsData);
        setMenuiseries(menuiseriesData);
        setStructures(structuresData);
        setToitures(toituresData);
        setTypePlanchers(typePlanchersData);
        setTypeConstructions(typeConstructionData);
        setClients(clientsData);
        setTypeSurfaces(typeSurfacesData);
      } catch (error) {
        setError("Erreur lors du chargement des données");
        console.error("Erreur chargement données:", error);
      }
    };

    loadData();
  }, []);

  const getOptionText = (item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      return (
        item.nom ||
        item.name ||
        item.nom_type_construction ||
        item.description ||
        String(item.id) ||
        "Option sans nom"
      );
    }
    return "Option invalide";
  };

  const getOptionValue = (item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      for (let key in item) {
        if (key.startsWith("id_")) {
          return item[key];
        }
      }
    }
    return item;
  };

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setProjectDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestionnaire pour la sélection de région
  const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    setProjectData((prev) => ({
      ...prev,
      localisation: selectedRegion,
    }));
  };

  const handleDevisUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("id_projet", createdProjectId);
      formData.append("fichier", file);

      const result = await DevisService.uploadDevisFile(formData);
      setUploadedDevis(result);
      setDevisFile(file);
      setSuccess("Devis uploadé avec succès");
    } catch (error) {
      setError("Erreur lors de l'upload du devis");
      console.error("Erreur upload devis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setError("");
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("id_projet", createdProjectId);
        formData.append("fichier", file);
        return await DevisService.uploadImageFile(formData);
      });

      const results = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...results]);
      setImageFiles((prev) => [...prev, ...files]);
      setSuccess("Images uploadées avec succès");
      resetForm();
    } catch (error) {
      setError("Erreur lors de l'upload des images");
      console.error("Erreur upload images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Préparation des données projet
      const projectPayload = {
        nom_projet: projectData.nom_projet,
        description: projectData.description,
        id_client: projectData.id_client,
        id_type_construction: projectData.id_type_construction,
        total_ht: parseFloat(projectData.total_ht) || 0,
        total_ttc: parseFloat(projectData.total_ttc) || 0,
        date_devis: projectData.date_devis || null,
        localisation: projectData.localisation || "",
      };

      // Création du projet
      const projectResult = await DevisService.createProject(projectPayload);

      // Création des détails
      const detailsPayload = {
        id_projet: projectResult.id_projet,
        nombre_etages: parseInt(projectDetails.nombre_etages) || 1,
        surface_totale: parseFloat(projectDetails.surface_totale) || 0,
        id_type_surface: projectDetails.id_type_surface,
        id_structure: projectDetails.id_structure,
        id_fondation: projectDetails.id_fondation,
        id_menuiserie: projectDetails.id_menuiserie,
        id_toiture: projectDetails.id_toiture,
        id_type_plancher: projectDetails.id_type_plancher,
      };

      await DevisService.createProjectDetails(detailsPayload);

      // Ajout des 3 types de surface
      const surfacePayload = {
        id_projet: projectResult.id_projet,
        surfaceSHAB: parseFloat(projectDetails.surfaceSHAB),
        surfaceSHON: parseFloat(projectDetails.surfaceSHON),
        surfaceSHOB: parseFloat(projectDetails.surfaceSHOB),
      };

      await DevisService.add_3_surface_projet(surfacePayload);

      // Sauvegarde l'ID du projet pour les fichiers
      setCreatedProjectId(projectResult.id_projet);

      // Passe à l'étape 3 pour upload fichiers
      setCurrentStep(3);

      setSuccess(
        "Projet créé avec succès. Veuillez maintenant uploader les fichiers."
      );
    } catch (error) {
      setError("Erreur lors de la création du projet");
      console.error("Erreur création projet:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectData({
      nom_projet: "",
      description: "",
      id_client: "",
      id_type_construction: "",
      total_ht: "",
      total_ttc: "",
      date_devis: "",
      localisation: "",
    });
    setProjectDetails({
      nombre_etages: "",
      surface_totale: "",
      id_type_surface: "",
      id_structure: "",
      id_fondation: "",
      id_menuiserie: "",
      id_toiture: "",
      id_type_plancher: "",
      surfaceSHAB: "",
      surfaceSHON: "",
      surfaceSHOB: "",
    });
    setDevisFile(null);
    setImageFiles([]);
    setUploadedDevis(null);
    setUploadedImages([]);
    setCurrentStep(1);
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          projectData.nom_projet.trim() !== "" &&
          projectData.id_client !== "" &&
          projectData.id_type_construction !== "" &&
          projectData.localisation.trim() !== ""
        );
      case 2:
        return (
          projectDetails.id_structure !== "" &&
          projectDetails.id_fondation !== "" &&
          projectDetails.nombre_etages > 0 &&
          projectDetails.surface_totale > 0 &&
          projectDetails.id_type_surface !== "" &&
          projectDetails.id_toiture !== "" &&
          projectDetails.id_type_plancher !== "" &&
          projectDetails.id_menuiserie !== "" &&
          // Validation des nouveaux champs obligatoires
          projectDetails.surfaceSHAB !== "" &&
          projectDetails.surfaceSHON !== "" &&
          projectDetails.surfaceSHOB !== "" &&
          parseFloat(projectDetails.surfaceSHAB) > 0 &&
          parseFloat(projectDetails.surfaceSHON) > 0 &&
          parseFloat(projectDetails.surfaceSHOB) > 0
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="nouveau-projet-container">
      <div className="nouveau-projet-card">
        {/* Progress Steps */}
        <div className="progress-steps">
          {[
            { step: 1, icon: "fas fa-info-circle", label: "Informations" },
            { step: 2, icon: "fas fa-cog", label: "Détails techniques" },
            { step: 3, icon: "fas fa-file-upload", label: "Fichiers" },
          ].map(({ step, icon, label }) => (
            <div key={step} className="progress-step">
              <div
                className={`progress-step-circle ${
                  currentStep >= step ? "active" : "inactive"
                }`}
              >
                <i className={icon}></i>
              </div>
              <span
                className={`progress-step-label ${
                  currentStep >= step ? "active" : "inactive"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-container">
            {/* Étape 1: Informations du projet */}
            {currentStep === 1 && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-project-diagram"></i>
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    name="nom_projet"
                    value={projectData.nom_projet}
                    onChange={handleProjectChange}
                    required
                    className="form-input1"
                    placeholder="Entrez le nom du projet"
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-button">
                    <label className="form-label">
                      <i className="fas fa-user"></i>
                      Client *
                    </label>
                    <button
                      type="button"
                      className="add-icon-button"
                      onClick={() => setShowClientModal(true)}
                      title="Ajouter un client"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>

                  <select
                    name="id_client"
                    value={projectData.id_client}
                    onChange={handleProjectChange}
                    required
                    className="form-select"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client, index) => (
                      <option key={index} value={getOptionValue(client)}>
                        {getOptionText(client)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-building"></i>
                    Type de construction *
                  </label>
                  <select
                    name="id_type_construction"
                    value={projectData.id_type_construction}
                    onChange={handleProjectChange}
                    required
                    className="form-select"
                  >
                    <option value="">Sélectionner un type</option>
                    {typeConstructions.map((type, index) => (
                      <option key={index} value={getOptionValue(type)}>
                        {getOptionText(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-map-marker-alt"></i>
                    Région *
                  </label>
                  <select
                    name="region"
                    value={projectData.localisation}
                    onChange={handleRegionChange}
                    required
                    className="form-select"
                  >
                    <option value="">Sélectionner une région</option>
                    {regionsMadagascar.map((region, index) => (
                      <option key={index} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-grid-full">
                  <label className="form-label">
                    <i className="fas fa-align-left"></i>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={projectData.description}
                    onChange={handleProjectChange}
                    className="form-textarea"
                    placeholder="Description détaillée du projet"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-euro-sign"></i>
                    Total HT (€)
                  </label>
                  <input
                    type="number"
                    name="total_ht"
                    value={projectData.total_ht}
                    onChange={handleProjectChange}
                    className="form-input1"
                    placeholder="Montant HT"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-euro-sign"></i>
                    Total TTC (€)
                  </label>
                  <input
                    type="number"
                    name="total_ttc"
                    value={projectData.total_ttc}
                    onChange={handleProjectChange}
                    className="form-input1"
                    placeholder="Montant TTC"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-calendar-alt"></i>
                    Date du devis
                  </label>
                  <input
                    type="date"
                    name="date_devis"
                    value={projectData.date_devis}
                    onChange={handleProjectChange}
                    className="form-input1"
                  />
                </div>
              </div>
            )}

            {/* Étape 2: Détails techniques */}
            {currentStep === 2 && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-sort-numeric-up"></i>
                    Nombre d'étages *
                  </label>
                  <input
                    type="number"
                    name="nombre_etages"
                    value={projectDetails.nombre_etages}
                    onChange={handleDetailsChange}
                    className="form-input1"
                    placeholder="Nombre d'étages"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-expand-arrows-alt"></i>
                    Surface totale (m²) *
                  </label>
                  <input
                    type="number"
                    name="surface_totale"
                    value={projectDetails.surface_totale}
                    onChange={handleDetailsChange}
                    className="form-input1"
                    placeholder="Surface en m²"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-cube"></i>
                    Type de surface
                  </label>
                  <select
                    name="id_type_surface"
                    value={projectDetails.id_type_surface}
                    onChange={handleDetailsChange}
                    className="form-select"
                  >
                    <option value="">Sélectionner un type de surface</option>
                    {typeSurfaces.map((surface, index) => (
                      <option key={index} value={getOptionValue(surface)}>
                        {getOptionText(surface)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section des 3 types de surface obligatoires */}
                <div className="form-group form-grid-full">
                  <div className="surface-section">
                    <h4 className="surface-section-title">
                      <i className="fas fa-ruler-combined"></i>
                      Surfaces spécifiques *
                    </h4>
                    <div className="surface-grid">
                      <div className="form-group">
                        <label className="form-label surface-label">
                          <i className="fas fa-home"></i>
                          Surface SHAB (m²) *
                        </label>
                        <input
                          type="number"
                          name="surfaceSHAB"
                          value={projectDetails.surfaceSHAB}
                          onChange={handleDetailsChange}
                          className="form-input1"
                          placeholder="Surface SHAB"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label surface-label">
                          <i className="fas fa-expand"></i>
                          Surface SHON (m²) *
                        </label>
                        <input
                          type="number"
                          name="surfaceSHON"
                          value={projectDetails.surfaceSHON}
                          onChange={handleDetailsChange}
                          className="form-input1"
                          placeholder="Surface SHON"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label surface-label">
                          <i className="fas fa-vector-square"></i>
                          Surface SHOB (m²) *
                        </label>
                        <input
                          type="number"
                          name="surfaceSHOB"
                          value={projectDetails.surfaceSHOB}
                          onChange={handleDetailsChange}
                          className="form-input1"
                          placeholder="Surface SHOB"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-layer-group"></i>
                    Type de structure *
                  </label>
                  <select
                    name="id_structure"
                    value={projectDetails.id_structure}
                    onChange={handleDetailsChange}
                    className="form-select"
                    required
                  >
                    <option value="">Sélectionner une structure</option>
                    {structures.map((structure, index) => (
                      <option key={index} value={getOptionValue(structure)}>
                        {getOptionText(structure)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-building"></i>
                    Type de fondation *
                  </label>
                  <select
                    name="id_fondation"
                    value={projectDetails.id_fondation}
                    onChange={handleDetailsChange}
                    className="form-select"
                    required
                  >
                    <option value="">Sélectionner une fondation</option>
                    {fondations.map((fondation, index) => (
                      <option key={index} value={getOptionValue(fondation)}>
                        {getOptionText(fondation)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-hammer"></i>
                    Type de menuiserie
                  </label>
                  <select
                    name="id_menuiserie"
                    value={projectDetails.id_menuiserie}
                    onChange={handleDetailsChange}
                    className="form-select"
                  >
                    <option value="">Sélectionner une menuiserie</option>
                    {menuiseries.map((menuiserie, index) => (
                      <option key={index} value={getOptionValue(menuiserie)}>
                        {getOptionText(menuiserie)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-home"></i>
                    Type de toiture
                  </label>
                  <select
                    name="id_toiture"
                    value={projectDetails.id_toiture}
                    onChange={handleDetailsChange}
                    className="form-select"
                  >
                    <option value="">Sélectionner une toiture</option>
                    {toitures.map((toiture, index) => (
                      <option key={index} value={getOptionValue(toiture)}>
                        {getOptionText(toiture)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-th-large"></i>
                    Type de plancher
                  </label>
                  <select
                    name="id_type_plancher"
                    value={projectDetails.id_type_plancher}
                    onChange={handleDetailsChange}
                    className="form-select"
                  >
                    <option value="">Sélectionner un type de plancher</option>
                    {typePlanchers.map((plancher, index) => (
                      <option key={index} value={getOptionValue(plancher)}>
                        {getOptionText(plancher)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Étape 3: Upload de fichiers */}
            {currentStep === 3 && (
              <div className="upload-section">
                {/* Upload Devis */}
                <div className="upload-area">
                  <div>
                    <i className="fas fa-file-invoice upload-icon"></i>
                    <h3 className="upload-title">Devis du projet</h3>
                    <p className="upload-description">
                      Glissez-déposez ou cliquez pour sélectionner le devis
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls"
                    onChange={handleDevisUpload}
                    className="file-input"
                    id="devis-upload"
                  />
                  <label htmlFor="devis-upload" className="upload-button">
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload"></i>
                        Choisir un fichier
                      </>
                    )}
                  </label>

                  {devisFile && (
                    <div className="uploaded-files">
                      <div className="uploaded-file">
                        <i className="fas fa-check"></i>
                        <span>{devisFile.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Images */}
                <div className="upload-area">
                  <div>
                    <i className="fas fa-images upload-icon"></i>
                    <h3 className="upload-title">Images du projet</h3>
                    <p className="upload-description">
                      Ajoutez des photos du projet (JPG, PNG)
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    multiple
                    onChange={handleImageUpload}
                    className="file-input"
                    id="images-upload"
                  />
                  <label htmlFor="images-upload" className="upload-button">
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-camera"></i>
                        Choisir des images
                      </>
                    )}
                  </label>

                  {imageFiles.length > 0 && (
                    <div className="uploaded-files">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="uploaded-file">
                          <i className="fas fa-check"></i>
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="navigation-buttons">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  <i className="fas fa-arrow-left"></i>
                  Précédent
                </button>
              )}
            </div>

            <div>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                  disabled={!isStepValid() || loading}
                >
                  Suivant
                  <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={!isStepValid() || loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Création...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Créer le projet
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientCreated={(newClient) => {
          setClients((prev) => [...prev, newClient]);
          setProjectData((prev) => ({
            ...prev,
            id_client: newClient.id_client,
          }));
        }}
      />
    </div>
  );
};

export default NewProjectScreen;
