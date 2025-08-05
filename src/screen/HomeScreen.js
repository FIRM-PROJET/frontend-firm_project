
import React, { useState, useEffect } from 'react';
import "../styles/HomeScreen.css";
import { jwtDecode } from "jwt-decode";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const HomeScreen = () => {
  const [userInfo, setUserInfo] = useState({
    name: "Utilisateur",
  });

  const [stats] = useState({
    tachesAccomplies: 24,
    tachesEnCours: 8,
    coursTermines: 5,
    projetsActifs: 3
  });

  const [taches] = useState([
    { id: 1, titre: "Réviser le chapitre 3", statut: "a_faire", priorite: "haute", dateEcheance: "2025-07-22" },
    { id: 2, titre: "Terminer le rapport mensuel", statut: "a_faire", priorite: "moyenne", dateEcheance: "2025-07-25" },
    { id: 3, titre: "Préparer la présentation", statut: "accompli", priorite: "haute", dateEcheance: "2025-07-21" },
    { id: 4, titre: "Réunion équipe", statut: "accompli", priorite: "faible", dateEcheance: "2025-07-20" },
    { id: 5, titre: "Formation React", statut: "a_faire", priorite: "moyenne", dateEcheance: "2025-07-28" },
    { id: 6, titre: "Code review", statut: "a_faire", priorite: "haute", dateEcheance: "2025-07-23" }
  ]);

  const [cours] = useState([
    { id: 1, nom: "JavaScript Avancé", progression: 75, statut: "en_cours" },
    { id: 2, nom: "React Fundamentals", progression: 100, statut: "termine" },
    { id: 3, nom: "Node.js Backend", progression: 45, statut: "en_cours" }
  ]);

  const [projets] = useState([
    { id: 1, nom: "Application Mobile", progression: 60, deadline: "2025-08-15" },
    { id: 2, nom: "Site E-commerce", progression: 85, deadline: "2025-07-30" },
    { id: 3, nom: "Dashboard Analytics", progression: 30, deadline: "2025-09-10" }
  ]);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Données pour le graphique en ligne/points avec plus de données
  const chartData = [
    { name: 'Lun', accomplies: 4, nouvelles: 2, productivite: 85 },
    { name: 'Mar', accomplies: 6, nouvelles: 3, productivite: 92 },
    { name: 'Mer', accomplies: 3, nouvelles: 1, productivite: 78 },
    { name: 'Jeu', accomplies: 8, nouvelles: 4, productivite: 95 },
    { name: 'Ven', accomplies: 5, nouvelles: 2, productivite: 88 },
    { name: 'Sam', accomplies: 2, nouvelles: 1, productivite: 65 },
    { name: 'Dim', accomplies: 1, nouvelles: 0, productivite: 45 }
  ];

  // Données pour le graphique de productivité (aire)
  const productivityData = [
    { time: '9h', focus: 20, energy: 25 },
    { time: '10h', focus: 45, energy: 40 },
    { time: '11h', focus: 70, energy: 65 },
    { time: '12h', focus: 85, energy: 80 },
    { time: '13h', focus: 60, energy: 55 },
    { time: '14h', focus: 75, energy: 70 },
    { time: '15h', focus: 90, energy: 85 },
    { time: '16h', focus: 85, energy: 80 },
    { time: '17h', focus: 70, energy: 65 },
    { time: '18h', focus: 50, energy: 45 }
  ];

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      setUserInfo({
        name: decoded.nom || decoded.name || "Utilisateur",
        email: decoded.email || "",
        avatar: decoded.avatar || null,
        matricule: decoded.matricule || "",
      });
    } catch (err) {
      console.error("Erreur de décodage du token :", err);
    }
  }
}, []);

const rawDate = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const today = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);


  const getPrioriteColor = (priorite) => {
    switch(priorite) {
      case 'haute': return '#ff6b6b';
      case 'moyenne': return '#feca57';
      case 'faible': return '#48dbfb';
      default: return '#a0a0a0';
    }
  };

  // Fonctions pour le calendrier
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTasksForDate = (date) => {
    return taches.filter(tache => {
      const taskDate = new Date(tache.dateEcheance);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date, currentDate) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  

  return (
    <>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css" rel="stylesheet" />
      <div className="dashboard-container">
        <div className="header">
          <div className="user-info">
            <div className="avatar">
              <i className="bi bi-person-fill" style={{fontSize: '26px'}}></i>
            </div>
            <div>
              <h1 className="welcome-text">Bonjour, {userInfo.name}{userInfo.prenom}</h1>
              <p className="date-text">{today}</p>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-check-circle-fill" style={{fontSize: '26px'}}></i>
            </div>
            <div className="stat-content">
              <h3>{stats.tachesAccomplies}</h3>
              <p>Tâches accomplies</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-clock-fill" style={{fontSize: '26px'}}></i>
            </div>
            <div className="stat-content">
              <h3>{stats.tachesEnCours}</h3>
              <p>Tâches en cours</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-book-fill" style={{fontSize: '26px'}}></i>
            </div>
            <div className="stat-content">
              <h3>{stats.coursTermines}</h3>
              <p>Cours terminés</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-folder-fill" style={{fontSize: '26px'}}></i>
            </div>
            <div className="stat-content">
              <h3>{stats.projetsActifs}</h3>
              <p>Projets actifs</p>
            </div>
          </div>
        </div>

        <div className="main-grid">
          <div className="chart-section">
            <h2 className="section-title">
              <i className="bi bi-graph-up-arrow" style={{fontSize: '22px'}}></i>
              Activité hebdomadaire
            </h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#b0b0c0" 
                    fontSize={12}
                    fontWeight={500}
                  />
                  <YAxis 
                    stroke="#b0b0c0" 
                    fontSize={12}
                    fontWeight={500}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(57, 57, 79, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accomplies" 
                    stroke="#514f84" 
                    strokeWidth={3}
                    dot={{ fill: '#514f84', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#514f84', strokeWidth: 2, fill: '#8b5cf6' }}
                    name="Accomplies"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nouvelles" 
                    stroke="#48dbfb" 
                    strokeWidth={3}
                    dot={{ fill: '#48dbfb', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#48dbfb', strokeWidth: 2, fill: '#7fdbff' }}
                    name="Nouvelles"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="calendar-section">
            <h2 className="section-title">
              <i className="bi bi-calendar-fill" style={{fontSize: '22px'}}></i>
              Calendrier des tâches
            </h2>
            <div className="calendar-container">
              <div className="calendar-header">
                <button 
                  className="calendar-nav"
                  onClick={() => changeMonth(-1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span style={{fontSize: '18px', fontWeight: '600'}}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button 
                  className="calendar-nav"
                  onClick={() => changeMonth(1)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              
              <div className="calendar-grid1">
                {dayNames.map(day => (
                  <div key={day} className="calendar-day-header1">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth(currentDate).map((day, index) => {
                  const tasksForDay = getTasksForDate(day);
                  const hasTask = tasksForDay.length > 0;
                  const todayClass = isToday(day) ? 'today' : '';
                  const sameMonthClass = isSameMonth(day, currentDate) ? '' : 'other-month';
                  const hasTaskClass = hasTask ? 'has-task' : '';
                  
                  return (
                    <div 
                      key={index}
                      className={`calendar-day ${todayClass} ${sameMonthClass} ${hasTaskClass}`}
                      title={hasTask ? `${tasksForDay.length} tâche(s)` : ''}
                    >
                      {day.getDate()}
                      {hasTask && <div className="task-indicator"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="productivity-section">
          <h2 className="section-title">
            <i className="bi bi-activity" style={{fontSize: '22px'}}></i>
            Productivité journalière
          </h2>
          <div className="productivity-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#b0b0c0" 
                  fontSize={12}
                  fontWeight={500}
                />
                <YAxis 
                  stroke="#b0b0c0" 
                  fontSize={12}
                  fontWeight={500}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(57, 57, 79, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="focus"
                  stackId="1"
                  stroke="#514f84"
                  fill="url(#focusGradient)"
                  strokeWidth={2}
                  name="Focus"
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stackId="2"
                  stroke="#48dbfb"
                  fill="url(#energyGradient)"
                  strokeWidth={2}
                  name="Énergie"
                />
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#514f84" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#514f84" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#48dbfb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#48dbfb" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sections-grid">
          <div className="section">
            <h2 className="section-title">
              <i className="bi bi-clock-fill" style={{fontSize: '20px'}}></i>
              Mes Tâches à Faire
            </h2>
            {taches.filter(t => t.statut === 'a_faire').length > 0 ? (
              taches.filter(t => t.statut === 'a_faire').map(tache => (
                <div key={tache.id} className="task-item">
                  <div>
                    <span className="task-title">{tache.titre}</span>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '4px' }}>
                      <i className="bi bi-calendar3" style={{marginRight: '5px'}}></i>
                      {new Date(tache.dateEcheance).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span 
                    className="priority-badge"
                    style={{ 
                      backgroundColor: getPrioriteColor(tache.priorite),
                      color: 'white'
                    }}
                  >
                    {tache.priorite}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-items">Aucune tâche à faire</div>
            )}
          </div>

          <div className="section">
            <h2 className="section-title">
              <i className="bi bi-check-circle-fill" style={{fontSize: '20px'}}></i>
              Tâches Accomplies
            </h2>
            {taches.filter(t => t.statut === 'accompli').length > 0 ? (
              taches.filter(t => t.statut === 'accompli').map(tache => (
                <div key={tache.id} className="task-item">
                  <div>
                    <span className="task-title">{tache.titre}</span>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '4px' }}>
                      <i className="bi bi-calendar-check" style={{marginRight: '5px'}}></i>
                      {new Date(tache.dateEcheance).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span className="status-badge">
                    <i className="bi bi-check2" style={{marginRight: '5px'}}></i>
                    Terminé
                  </span>
                </div>
              ))
            ) : (
              <div className="no-items">Aucune tâche accomplie</div>
            )}
          </div>

          <div className="section">
            <h2 className="section-title">
              <i className="bi bi-book-fill" style={{fontSize: '20px'}}></i>
              Mes Cours
            </h2>
            {cours.map(course => (
              <div key={course.id} className="course-item">
                <div className="course-header">
                  <span className="course-name">
                    <i className="bi bi-play-circle-fill" style={{marginRight: '8px', color: '#514f84'}}></i>
                    {course.nom}
                  </span>
                  <span style={{ fontSize: '12px', color: '#a0a0a0' }}>
                    {course.progression}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${course.progression}%` }}
                  />
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {course.statut === 'termine' ? (
                    <>
                      <i className="bi bi-check-circle-fill" style={{color: '#4CAF50'}}></i>
                      <span style={{color: '#4CAF50'}}>Terminé</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-clock-fill" style={{color: '#feca57'}}></i>
                      <span style={{color: '#feca57'}}>En cours</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="section">
            <h2 className="section-title">
              <i className="bi bi-folder-fill" style={{fontSize: '20px'}}></i>
              Mes Projets
            </h2>
            {projets.map(projet => (
              <div key={projet.id} className="project-item">
                <div className="project-header">
                  <span className="project-name">
                    <i className="bi bi-kanban-fill" style={{marginRight: '8px', color: '#514f84'}}></i>
                    {projet.nom}
                  </span>
                  <span className="deadline">
                    <i className="bi bi-calendar-event" style={{marginRight: '5px'}}></i>
                    {new Date(projet.deadline).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${projet.progression}%` }}
                  />
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '12px', 
                  color: '#a0a0a0' 
                }}>
                  <span>
                    <i className="bi bi-bar-chart-fill" style={{marginRight: '5px'}}></i>
                    Progression: {projet.progression}%
                  </span>
                  <span>
                    {projet.progression >= 80 ? (
                      <i className="bi bi-emoji-smile-fill" style={{color: '#4CAF50'}}></i>
                    ) : projet.progression >= 50 ? (
                      <i className="bi bi-emoji-neutral-fill" style={{color: '#feca57'}}></i>
                    ) : (
                      <i className="bi bi-emoji-frown-fill" style={{color: '#ff6b6b'}}></i>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeScreen;