// src/components/DashboardLayout.js
import React, { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // po remountu/route change vždy nahoře
    el.scrollTop = 0;
    el.scrollLeft = 0;

    // pojistka: některé prohlížeče to ještě "přetlačí" po paintu
    const raf = requestAnimationFrame(() => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });

    return () => cancelAnimationFrame(raf);
  }, [location.key]);

  return (
    // overflow-hidden zabrání tomu, aby scrolloval body/root
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      {/* KEY = remount hlavního scroll kontejneru při každé navigaci */}
      <main
        key={location.key}
        ref={mainRef}
        id="app-scroll"
        className="flex-1 overflow-y-auto p-6 lg:p-8"
      >
        <Outlet />
      </main>
    </div>
  );
}