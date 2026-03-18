import * as React from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./auth/authProvider";
import { GraphServicesProvider, useGraphServices } from "./graph/graphContext";
import type { FeatureKey } from "./models/security";
import type { User } from "./models/user";
import Welcome from "./components/Welcome/Welcome";
import { PermissionsProvider, usePermissions } from "./funcionalidades/Permisos";
import { SidebarSimple } from "./components/Sidebar/Sidebar";
import { getAppPermissionsRows, getUserGroupIds } from "./utils/security";
import { VisitorRegiser } from "./components/RegistroVisitantes/RegistroVisitantes";
import { VisitasTable } from "./components/TablaVisitas/TablaVisitas";
import { useRegistroVisitantes } from "./funcionalidades/RegistroVisitantes";
import ReportExporter from "./components/Reports/Reports";
import { OfficeGroupMembersManager } from "./components/Permisos/OfficeGroupMembersManager";

/* ================== Sidebar item ================== */
export type SidebarItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

/* ================== Sections infra ================== */
type SectionBase = {
  id: string;
  label: string;
  feature?: FeatureKey;
  anyOf?: FeatureKey[];
  icon?: React.ReactNode;
};

type SectionsCtx = {
  user: User;
  registro: ReturnType<typeof useRegistroVisitantes>;
};

type SectionDef<P> = SectionBase & {
  Component: React.ComponentType<P>;
  getProps: (ctx: SectionsCtx) => P;
};

export type AnySection = SectionDef<any>;

/* ================== Sections config ================== */
const SECTIONS: AnySection[] = [
  {
    id: "nuevo",
    label: "Registrar Nuevo Visitante",
    feature: "visitante.registrar",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
        <path fill="currentColor" d="M7.5 4a.5.5 0 0 1 .5.5V7h2.5a.5.5 0 0 1 0 1H8v2.5a.5.5 0 0 1-1 0V8H4.5a.5.5 0 0 1 0-1H7V4.5a.5.5 0 0 1 .5-.5"/>
      </svg>
    ),
    Component: VisitorRegiser,
    getProps: (ctx) => ({
      controller: ctx.registro,
    }),
  },
  {
    id: "registradas",
    label: "Visitas Registradas",
    Component: VisitasTable,
    icon:(
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1024">
        <path fill="#000000" d="M960 1024H64q-27 0-45.5-18.5T0 960V320q0-26 18.5-45T64 256h320v64q0 65 35.5 96.5T512 448q56 0 92-33t36-95v-64h320q26 0 45 19t19 45v640q0 27-18.5 45.5T960 1024zM352 806v-18q96-39 96-212q0-63-44.5-95.5t-115-32.5T173 480.5T128 576q0 168 96 210v20q-69 12-114 45t-46 75q0 12 21.5 19.5t63 10.5t68.5 3.5t71 .5t71-.5t68.5-3.5t63-10.5T512 926q-1-42-45.5-75T352 806zm512-230H608q-13 0-22.5 9.5T576 608t9.5 22.5T608 640h256q13 0 22.5-9.5T896 608t-9.5-22.5T864 576zM576 736q0 13 9.5 22.5T608 768h128q13 0 22.5-9.5T768 736t-9.5-22.5T736 704H608q-13 0-22.5 9.5T576 736zm288 96H608q-13 0-22.5 9.5T576 864t9.5 22.5T608 896h256q13 0 22.5-9.5T896 864t-9.5-22.5T864 832zM576 128v192q0 27-19 45.5T511.5 384t-45-18.5T448 320V128q-27 0-45.5-18.5t-18.5-45T402.5 19T448 0h128q26 0 45 19t19 45.5t-18.5 45T576 128z"/>
      </svg>
    ),
    getProps: (ctx) => ({
      controller: ctx.registro,
    }),
  },
  { 
    id: "reports",
    label: "Reportes",
    Component: ReportExporter,
    feature: "visitante.reports",
    icon:(
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
        <path fill="none" stroke="#000000" stroke-width="1.5" d="M9 21h6m-6 0v-5m0 5H3.6a.6.6 0 0 1-.6-.6v-3.8a.6.6 0 0 1 .6-.6H9m6 5V9m0 12h5.4a.6.6 0 0 0 .6-.6V3.6a.6.6 0 0 0-.6-.6h-4.8a.6.6 0 0 0-.6.6V9m0 0H9.6a.6.6 0 0 0-.6.6V16"/>
      </svg>
    ),
    getProps: (ctx) => ({
      controller: ctx.registro,
    }),
  },
  { 
    id: "accesos",
    label: "Accesos a la aplicación",
    Component: OfficeGroupMembersManager,
    feature: "app.access",
    icon:(
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048">
        <path fill="#000000" d="M2048 1573v475h-512v-256h-256v-256h-256v-207q-74 39-155 59t-165 20q-97 0-187-25t-168-71t-142-110t-111-143t-71-168T0 704q0-97 25-187t71-168t110-142T349 96t168-71T704 0q97 0 187 25t168 71t142 110t111 143t71 168t25 187q0 51-8 101t-23 98l671 670zm-128 54l-690-690q22-57 36-114t14-119q0-119-45-224t-124-183t-183-123t-224-46q-119 0-224 45T297 297T174 480t-46 224q0 119 45 224t124 183t183 123t224 46q97 0 190-33t169-95h89v256h256v256h256v256h256v-293zM512 384q27 0 50 10t40 27t28 41t10 50q0 27-10 50t-27 40t-41 28t-50 10q-27 0-50-10t-40-27t-28-41t-10-50q0-27 10-50t27-40t41-28t50-10z"/>
      </svg>
    ),
    getProps: () => ({
      usersGroupId: "a016b344-70f0-4bab-91cc-ac5cd0560559",
      adminsGroupId: "ID_DEL_GRUPO_ADMINS",
      title: "Accesos a la aplicación",
      description: "Administra quién entra como usuario normal y quién entra como administrador",
    }),
  },
];

/* ============================================================
   Shell (auth gate)
   =========================================l=================== */
function Shell() {
  const { ready, account, signIn, signOut, } = useAuth();
  const [loadingAuth, setLoadingAuth] = React.useState(false);

  const user: User | null = account
    ? {
        displayName: account.name ?? account.username ?? "Usuario",
        mail: account.username ?? "",
      }
    : null;

  const isLogged = Boolean(account);

  const handleAuthClick = async () => {
    if (!ready || loadingAuth) return;
    setLoadingAuth(true);
    try {
      if (isLogged) await signOut();
      else await signIn("redirect");
    } finally {
      setLoadingAuth(false);
    }
  };

  if (!ready || !isLogged) {
    return (
          <Welcome onLogin={handleAuthClick} />
    );
  }

  return <LoggedApp user={user as User} />;
}

/* ============================================================
   LoggedApp (NO rompe reglas de hooks)
   ============================================================ */
function LoggedApp({ user }: { user: User }) {
  const { engine, loading } = usePermissions();
  const [activeId, setActiveId] = React.useState<string>("nuevo");
  const [collapsed, setCollapsed] = React.useState(false);

  /* ================= Hooks ================= */
  const registro = useRegistroVisitantes();

  React.useEffect(() => {
    registro.onRefresh()
  }, []);

  /* ================= Context ================= */
  const ctx = React.useMemo<SectionsCtx>(() => ({
    user,
    registro
  }), [user, registro]);

  /* ================= Sections permitidas ================= */
  const allowedSections = React.useMemo(() => {
    if (loading) return [];
    return SECTIONS.filter((s) => {
      if (s.feature) {return engine.can(s.feature);}
      if (s.anyOf?.length) return engine.canAny(...s.anyOf);
      return true;
    });
  }, [engine, loading]);

  React.useEffect(() => {
    if (!allowedSections.length) return;
    if (!allowedSections.some((s) => s.id === activeId)) {
      setActiveId(allowedSections[0].id);
    }
  }, [allowedSections, activeId]);

  const menuItems: SidebarItem[] = React.useMemo(
    () => allowedSections.map(({ id, label, icon }) => ({ id, label, icon })),
    [allowedSections]
  );

  const activeSection = allowedSections.find((s) => s.id === activeId) ?? allowedSections[0];

  /* ================= Contenido dinámico ================= */
  let content: React.ReactNode = null;

  if (loading) {
    content = <div style={{ padding: 24 }}>Cargando permisos...</div>;
  } else if (!allowedSections.length) {
    content = <div style={{ padding: 24 }}>No tienes permisos para ver módulos.</div>;
  } else {
    const Comp = activeSection.Component;
    const props = activeSection.getProps(ctx);
    content = <Comp {...props} />;
  }

  return (
    <div className={`gd-layout ${collapsed ? "is-collapsed" : ""}`}>
      <SidebarSimple
        sections={menuItems as any}
        activeId={activeSection?.id ?? ""}
        onSelect={setActiveId}
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        userInfo={user}
      />

      <main className="gd-main">
        <section className="gd-content">
          {content}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   Root
   ============================================================ */
export default function App() {
  return (
    <AuthProvider>
      <GraphServicesGate>
        <ShellWithPerms />
      </GraphServicesGate>
    </AuthProvider>
  );
}

function GraphServicesGate({ children }: { children: React.ReactNode }) {
  const { ready, account } = useAuth();
  if (!ready || !account) return <>{children}</>;
  return <GraphServicesProvider>{children}</GraphServicesProvider>;
}

function ShellWithPerms() {
  const { account } = useAuth();
  if (!account) return <Shell />;
  return <AuthedPermsShell />;
}

function AuthedPermsShell() {
  const { graph, matrizPermisos } = useGraphServices();

  return (
    <PermissionsProvider
      deps={{
        getMyGroupIds: () => getUserGroupIds(graph),
        getAppPermissionsRows: () => getAppPermissionsRows(matrizPermisos),
      }}
    >
      <Shell />
    </PermissionsProvider>
  );
}
