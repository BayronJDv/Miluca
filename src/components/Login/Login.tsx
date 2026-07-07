import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom, User } from "../../store/UserAtom";
import { Login as LoginUser } from "../../db/users";
import { Input } from "../design/Input";
import { Icon } from "../design/Icon";
import { colors } from "../design/colors";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setUser] = useAtom(userAtom);

  const handleSubmit = async () => {
  if (!username || !password) return;
  
  setLoading(true);
  setError(false);
  
  try {
    const userData = await LoginUser({ username, password });
    
    if (userData && userData.id !== undefined) {
      const user: User = {
        id: userData.id, 
        username: userData.username,
        rol: userData.rol as 'admin' | 'seller'
      };
      setUser(user);
    } else {
      setError(true);
    }
  } catch (err) {
    console.error("Login error:", err);
    setError(true);
  } finally {
    setLoading(false);
  }
};


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: colors.surface,
      backgroundImage: "radial-gradient(#d3e4fe 0.5px, transparent 0.5px)",
      backgroundSize: "24px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        @keyframes zoomIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        .login-card { animation: zoomIn .45s ease both; }
      `}</style>
      
      <main style={{ width: "100%", maxWidth: 420 }} className="login-card">
        <div style={{
          background: colors.surfaceLowest,
          border: `1px solid ${colors.outlineVariant}`,
          borderRadius: 12,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}>
          {/* Logo y título */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 60,
              height: 60,
              background: colors.primary,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,88,190,.35)",
              marginBottom: 12,
            }}>
              <Icon name="wallet" size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.onSurface }}>Gualcalapp</h1>
            <p style={{ fontSize: 14, color: colors.secondary, textAlign: "center" }}>
              Inicie sesión para acceder
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 14,
              background: colors.errorContainer,
              border: `1px solid rgba(186,26,26,.2)`,
              borderRadius: 8,
              color: colors.onErrorContainer,
            }}>
              <Icon name="error" size={18} color={colors.error} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                Credenciales inválidas. Verifique usuario y contraseña
              </span>
            </div>
          )}

          {/* Formulario */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Usuario"
              placeholder="ej. admin_ventas"
              value={username}
              onChange={setUsername}
              icon="person"
              onKeyDown={handleKeyDown}
            />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: colors.onSurfaceVariant }}>
                  Contraseña
                </label>
              </div>
              
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.outline, display: "flex" }}>
                  <Icon name="lock" size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: "100%",
                    height: 40,
                    paddingLeft: 34,
                    paddingRight: 44,
                    border: `1px solid ${colors.outlineVariant}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: "#fff",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: colors.outline,
                    display: "flex",
                  }}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Botón de login */}
          <button
            onClick={handleSubmit}
            disabled={!username || !password || loading}
            style={{
              width: "100%",
              height: 44,
              background: colors.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: (!username || !password || loading) ? "not-allowed" : "pointer",
              opacity: (!username || !password) ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {loading ? (
              <svg className="animate-spin" style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/>
                <path fill="rgba(255,255,255,0.8)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Icon name="login" size={16} color="#fff" />
            )}
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </div>
      </main>
    </div>
  );
}