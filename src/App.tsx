import { useEffect } from "react";
import  Login  from "./components/Login/Login";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAtom, useAtomValue } from "jotai";
import { userAtom } from "./store/UserAtom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./pages/Home";
import Pos from "./pages/Pos";
import Inventario from "./pages/Inventario";
import Proveedores from "./pages/Proveedores";
import Compras from "./pages/Compras";
import HistorialCompras from "./pages/HistorialCompras";
import HistorialVentas from "./pages/HistorialVentas";
import Reportes from "./pages/Reportes";
import Vencimientos from "./pages/Vencimientos";
import Kardex from "./pages/Kardex";
import Bajas from "./pages/Bajas";
import Configuracion from "./pages/Configuracion";
import HistorialEdiciones from "./pages/HistorialEdiciones";
import { marcarLotesVencidos } from "./db/batches";
import { checkForUpdates } from "./utils/updater";
import { themeAtom, syncThemeToDom } from "./store/ThemeAtom";
import styles from "./App.module.css";


function App() {
  const [user] = useAtom(userAtom);
  const userReady = useAtomValue(userAtom);
  const theme = useAtomValue(themeAtom);

  useEffect(() => {
    syncThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    if (userReady) {
      marcarLotesVencidos().catch(error => console.error('Error actualizando lotes vencidos:', error));
      checkForUpdates();
    }
  }, [userReady]);

  if (!user) {
    return (
      <main className={styles.loginWrap}>
        <Login />
      </main>
    );
  }

  return (
    <BrowserRouter>
      <div className={styles.appShell}>
        <Sidebar />
        <main className={styles.mainArea}>
          <div className={styles.content}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pos" element={<Pos />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/vencimientos" element={<Vencimientos />} />
              <Route path="/kardex" element={<Kardex />} />
              <Route path="/bajas" element={<ProtectedRoute allowedRoles={['admin']}><Bajas /></ProtectedRoute>} />
              <Route path="/historial-compras" element={<HistorialCompras />} />
              <Route path="/historial-ventas" element={<HistorialVentas />} />
              <Route path="/reportes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reportes />
                </ProtectedRoute>
              } />
              <Route path="/historial-ediciones" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <HistorialEdiciones />
                </ProtectedRoute>
              } />
              <Route path="/configuracion" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Configuracion />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
  
}

export default App;
