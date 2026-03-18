import * as React from "react";
import { useAuth } from "../auth/authProvider";
import { GraphRest } from "./graphRest";
import { MatrizPermisosService } from "../services/MatrizPermisos.service";
import { RegistroVisitantesService } from "../services/RegistroVisitantes.service";
import { LogRegistroService } from "../services/LogRegistro.service";
import { FirmasService } from "../services/Firma.service";


/* ================== Tipos de config ================== */
export type SiteConfig = {
  hostname: string;
  sitePath: string; 
};

export type UnifiedConfig = {
  test: SiteConfig;  // sitio de pruebas (Paz y salvos)
  helpDesk: SiteConfig;  
  lists: {
    matrizPermisos: string
    registroVisitantes: string
    logVisitantes: string;
    firmas: string
  };
};

/* ================== Tipos del contexto ================== */
export type GraphServices = {
  graph: GraphRest;

  matrizPermisos: MatrizPermisosService
  registroVisitantes: RegistroVisitantesService
  logRegistro: LogRegistroService
  firmas: FirmasService

};

/* ================== Contexto ================== */
const GraphServicesContext = React.createContext<GraphServices | null>(null);

/* ================== Default config (puedes cambiar paths) ================== */
const DEFAULT_CONFIG: UnifiedConfig = {
  test: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/Test",
  },
  helpDesk: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/HD",
  },
  lists: {
    matrizPermisos: "Visitantes - MatrizPermisos",
    registroVisitantes: "Visitantes - Registro",
    logVisitantes: "Visitantes - LogVisitas",
    firmas: "Firmas"
  },
};

/* ================== Provider ================== */
type ProviderProps = {
  children: React.ReactNode;
  config?: Partial<UnifiedConfig>;
};

export const GraphServicesProvider: React.FC<ProviderProps> = ({ children, config }) => {
  const { getToken } = useAuth();

  // Mergeo de config
  const cfg: UnifiedConfig = React.useMemo(() => {
    const base = DEFAULT_CONFIG;

    const normPath = (p: string) => (p.startsWith("/") ? p : `/${p}`);

    const test: SiteConfig = {
      hostname: config?.test?.hostname ?? base.test.hostname,
      sitePath: normPath(config?.test?.sitePath ?? base.test.sitePath),
    };

    const helpDesk: SiteConfig = {
      hostname: config?.helpDesk?.hostname ?? base.helpDesk.hostname,
      sitePath: normPath(config?.helpDesk?.sitePath ?? base.helpDesk.sitePath),
    };

    const lists = { ...base.lists, ...(config?.lists ?? {}) };

    return { test, helpDesk, lists };
  }, [config]);

  // Cliente Graph
  const graph = React.useMemo(() => new GraphRest(getToken), [getToken]);

  const services = React.useMemo<GraphServices>(() => {
    const { lists, test } = cfg;

    const matrizPermisos      = new MatrizPermisosService(graph, test.hostname, test.sitePath, lists.matrizPermisos,);
    const registroVisitantes  = new RegistroVisitantesService(graph, test.hostname, test.sitePath, lists.registroVisitantes);
    const logRegistro         = new LogRegistroService(graph, test.hostname, test.sitePath, lists.logVisitantes);
    const firmas              = new FirmasService(graph, test.hostname, test.sitePath, lists.firmas)

    return {
      graph,
      
      matrizPermisos, registroVisitantes, logRegistro, firmas
    };
  }, [graph, cfg]);

  return (
    <GraphServicesContext.Provider value={services}>
      {children}
    </GraphServicesContext.Provider>
  );
};

/* ================== Hook de consumo ================== */
export function useGraphServices(): GraphServices {
  const ctx = React.useContext(GraphServicesContext);
  if (!ctx) throw new Error("useGraphServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}
