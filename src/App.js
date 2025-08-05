import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./layout/Layout";
import LoginScreen from "./screen/LoginScreen";
import HomeScreen from "./screen/HomeScreen";
import ProjetsScreen from "./screen/ProjetsScreen";
import TachesScreen from "./screen/TachesScreen";
import DevisScreen from "./screen/DevisScreen";
import NewDevisScreen from "./screen/DevisScreen/NewDevisScreen";
import ProjectSelectionScreen from "./screen/DevisScreen/ProjectSelectionScreen";
import TravauxSelectionScreen from "./screen/DevisScreen/TravauxSelectionScreen";
import DevisResultScreen from "./screen/DevisScreen/DevisResultScreen";
import DevisValidationScreen from "./screen/DevisScreen/DevisValidationScreen";
import AdminScreen from "./screen/AdminScreen";
import UserAccessScreen from "./screen/AdminScreen/UserAccessScreen";
import UpdateUserScreen from "./screen/AdminScreen/UpdateUserScreen";
import AddUserScreen from "./screen/AdminScreen/AddUserScreen";
import NewProjectScreen from "./screen/DevisScreen/NewProjectScreen";
import DevisEstimationListe from "./screen/DevisScreen/DevisEstimationListe";
import ListeProjets from "./screen/DevisScreen/ListeProjets";
import LoadingScreen from "./screen/LoadingScreen";
import CreateTache from "./screen/TacheScreen/CreateTache";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection initiale */}
        <Route path="/" element={<LoadingScreen />} />
        {/* Login */}
        <Route path="/login" element={<LoginScreen />} />

        {/* Routes avec layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/mod0001" element={<HomeScreen />} />
          <Route path="/mod0002" element={<TachesScreen />} />
          <Route path="/mod0003" element={<ProjetsScreen />} />
          <Route path="/mod0004" element={<DevisScreen />} />
          <Route path="/mod0005" element={<AdminScreen />} />

          {/* Devis étapes */}
          <Route path="/devis/new" element={<NewDevisScreen />} />
          <Route path="/devis/etape1" element={<ProjectSelectionScreen />} />
          <Route path="/devis/etape2" element={<TravauxSelectionScreen />} />
          <Route path="/devis/result" element={<DevisResultScreen />} />
          <Route path="/devis/validation" element={<DevisValidationScreen />} />
          <Route path="/devis/new_project" element={<NewProjectScreen />} />
          <Route
            path="/devis/liste_estimation"
            element={<DevisEstimationListe />}
          />
          <Route path="/devis/liste_projets" element={<ListeProjets />} />

          {/* Devis étapes */}
          <Route path="/tache/new" element={<CreateTache />} />         

          {/* Admin views avec initialView */}
          <Route path="/admin/access" element={<UserAccessScreen />} />
          <Route path="/admin/modify" element={<UpdateUserScreen />} />
          <Route path="/admin/add" element={<AddUserScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
