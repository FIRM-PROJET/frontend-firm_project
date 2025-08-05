import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../layout/Header';
import Navbar from './Navbar';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={styles.container}>
      <Navbar isCollapsed={isCollapsed} toggleNavbar={toggleNavbar} />
      <div style={styles.mainContainer}>
        <div style={styles.header}>
          <Header />
        </div>
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const headerHeight = 80; // tu peux ajuster selon ta vraie hauteur

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  mainContainer: {
    marginLeft: '200px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#181835',
  },
  header: {
    position: 'fixed',
    top: 0,
    left: '200px', 
    right: 0,
    height: `${headerHeight}px`,
    backgroundColor: '#181835',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    padding: '20px',
    paddingTop: `${headerHeight + 10}px`, 
    overflowY: 'auto',
  },
};

export default Layout;
