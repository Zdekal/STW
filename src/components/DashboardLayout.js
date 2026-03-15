import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Zde importujeme VÁŠ sidebar

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet /> 
      </main>
    </div>
  );
};

export default DashboardLayout;