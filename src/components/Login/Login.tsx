import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom, User } from "../../store/UserAtom";
import { Login as LoginUser } from "../../db/users";
import { Input } from "../design/Input";
import { Icon } from "../design/Icon";
import styles from "./Login.module.css";

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
    <div className={styles.root}>
      <main className={styles.loginCard}>
        <div className={styles.card}>
          {/* Logo y título */}
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <Icon name="wallet" size={28} color="#fff" />
            </div>
            <h1 className={styles.title}>MegaInventario</h1>
            <p className={styles.subtitle}>
              Inicie sesión para acceder
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className={styles.errorBox}>
              <Icon name="error" size={18} color="var(--color-error)" />
              <span className={styles.errorText}>
                Credenciales inválidas. Verifique usuario y contraseña
              </span>
            </div>
          )}

          {/* Formulario */}
          <div className={styles.form}>
            <Input
              label="Usuario"
              placeholder="ej. admin_ventas"
              value={username}
              onChange={setUsername}
              icon="person"
              onKeyDown={handleKeyDown}
            />
            
            <div>
              <div className={styles.passwordLabelRow}>
                <label className={styles.passwordLabel}>
                  Contraseña
                </label>
              </div>
              
              <div className={styles.passwordField}>
                <span className={styles.passwordIcon}>
                  <Icon name="lock" size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.passwordInput}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
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
            className={styles.submitBtn}
          >
            {loading ? (
              <svg className={styles.spinIcon} style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
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
