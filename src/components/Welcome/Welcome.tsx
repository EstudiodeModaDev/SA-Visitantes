import "./Welcome.css";

export type WelcomeProps = {
  onLogin: () => void;
  loading?: boolean;
};

export default function Welcome({ onLogin, loading = false }: WelcomeProps) {
  return (
    <div className="gd-login">
      {/* Fondo decorativo */}
      <div className="gd-loginBg" aria-hidden="true">
        <span className="gd-loginOrb gd-loginOrb--a" />
        <span className="gd-loginOrb gd-loginOrb--b" />
        <span className="gd-loginOrb gd-loginOrb--c" />
        <span className="gd-loginGrid" />
      </div>

      {/* Layout fullscreen */}
      <div className="gd-loginShell" role="region" aria-label="Inicio de sesión">
        {/* LEFT */}
        <section className="gd-loginLeft">
          <div className="gd-loginHeader">
            <div className="gd-loginBrand">
              <div className="gd-loginMark" aria-hidden="true">
                <span />
              </div>
              <div className="gd-loginBrandText">
                <strong className="gd-loginBrandName">Registro de visitantes</strong>
                <span className="gd-loginBrandSub">Estudio de Moda · Acceso interno</span>
              </div>
            </div>

            <h1 className="gd-loginTitle">Bienvenido</h1>
            <p className="gd-loginSubtitle">
              Inicia sesión para registrar y consultar visitas. Tu sesión se gestiona con las credenciales corporativas.
            </p>
          </div>

          <div className="gd-loginCallout">
            <div className="gd-loginCalloutIcon" aria-hidden="true">🔒</div>
            <div className="gd-loginCalloutText">
              <div className="gd-loginCalloutTitle">Acceso seguro</div>
              <div className="gd-loginCalloutDesc">
                Solo usuarios autorizados pueden ingresar. No compartas tu cuenta.
              </div>
            </div>
          </div>

          <div className="gd-loginLeftHint">
            <div className="gd-loginPill">Registro de sus visitantes</div>
            <div className="gd-loginPill">Notificaciones en el proceso</div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="gd-loginRight">
          <div className="gd-loginRightCard">
            <div className="gd-loginRightTop">
              <div className="gd-loginMiniTitle">Continuar</div>
              <div className="gd-loginMiniDesc">
                {loading ? "Validando sesión con Microsoft…" : "Acceso con tu cuenta corporativa."}
              </div>
            </div>

            <button type="button" className="gd-loginBtn" onClick={onLogin} disabled={loading}>
              <span className="gd-loginBtn__label">
                {loading ? "Ingresando..." : "Ingresar con Microsoft"}
              </span>
              <span className="gd-loginBtn__chev" aria-hidden="true">→</span>
            </button>

            <footer className="gd-loginFooter">
              <span className="gd-loginHint">
                {loading ? "Esperando autenticación…" : "Si tienes problemas, contacta TI."}
              </span>
              <span className="gd-loginMeta">v1 · TI</span>
            </footer>
          </div>
        </aside>
      </div>
    </div>
  );
}
