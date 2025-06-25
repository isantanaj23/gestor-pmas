import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function MainLayout({ children }) {
  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <main style={{ 
          marginLeft: '260px', 
          marginTop: '70px', 
          padding: '20px',
          width: 'calc(100% - 260px)',
          minHeight: 'calc(100vh - 70px)'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;