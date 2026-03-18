import * as React from "react";

import type { FeatureKey } from "../models/security";
import { createEngine, normalizeFeatureKey, type PermissionsEngine } from "../utils/security";
// Ajusta estas interfaces a tus servicios reales
type Deps = {
  getMyGroupIds: () => Promise<string[]>; // Graph: /me/transitiveMemberOf
  getAppPermissionsRows: () => Promise<Array<{ GrupoId: string; FeatureKey: string; Enabled: boolean }>>; // SP list
};

type State = {
  loading: boolean;
  error: string | null;
  engine: PermissionsEngine;
  groupIds: string[];
  reload: () => Promise<void>;
};

const emptyEngine = createEngine(new Set<FeatureKey>());

const PermissionsContext = React.createContext<State | null>(null);

export function PermissionsProvider({ deps, children }: { deps: Deps; children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [engine, setEngine] = React.useState(emptyEngine);
  const [groupIds, setGroupIds] = React.useState<string[]>([]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = await deps.getMyGroupIds();
      setGroupIds(ids);

      const rows = await deps.getAppPermissionsRows();

      // Filtra por grupos del usuario + Enabled
      
      const idSet = new Set(ids.map(s => s.toLowerCase()));
      console.log(idSet)
      
      const keys: FeatureKey[] = [];

      for (const r of rows) {
        
        if (!r.Enabled) continue;
        
        if (!r.GrupoId) continue;
        
        if (!idSet.has(String(r.GrupoId.trim().toLocaleLowerCase()).toLowerCase().trim())) {console.error(r.GrupoId + "No coincide con ningunno del " + idSet); console.table(idSet); continue};
        const k = normalizeFeatureKey(r.FeatureKey);
        if (k) keys.push(k);
      }
      setEngine(createEngine(new Set(keys)));
    } catch (e: any) {
      setError(e?.message ?? "Error cargando permisos");
      setEngine(emptyEngine);
    } finally {
      setLoading(false);
    }
  }, [deps]);

  React.useEffect(() => { void reload(); }, [reload]);

  const value: State = { loading, error, engine, groupIds, reload };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = React.useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions debe usarse dentro de PermissionsProvider");
  return ctx;
}
