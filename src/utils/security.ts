import type { GraphRest } from "../graph/graphRest";
import { FEATURES, type FeatureKey, type ModuleKey } from "../models/security";
import type { MatrizPermisosService } from "../services/MatrizPermisos.service";

const ALL_FEATURES = new Set<string>(
  Object.values(FEATURES).flat() as readonly string[]
);

export function normalizeFeatureKey(raw: string): FeatureKey | null {
  const k = (raw ?? "").trim().toLowerCase();
  if (!k) return null;
  if (!ALL_FEATURES.has(k)) return null;
  return k as FeatureKey;
}

export type PermissionsEngine = {
  set: ReadonlySet<FeatureKey>;
  can: (k: FeatureKey) => boolean;
  canAny: (...keys: FeatureKey[]) => boolean;
  canAll: (...keys: FeatureKey[]) => boolean;
  canModule: (module: ModuleKey) => boolean; // si tiene AL MENOS 1 permiso del módulo
};

export function createEngine(set: ReadonlySet<FeatureKey>): PermissionsEngine {
  const can = (k: FeatureKey) => set.has(k);

  const canAny = (...keys: FeatureKey[]) => keys.some(k => set.has(k));
  const canAll = (...keys: FeatureKey[]) => keys.every(k => set.has(k));

  const canModule = (module: ModuleKey) => {
    const modKeys = FEATURES[module];
    return modKeys.some(k => set.has(k));
  };

  return { set, can, canAny, canAll, canModule };
}

export async function getUserGroupIds(graph: GraphRest): Promise<string[]> {
  const res = await graph.get<{ value: Array<{ id: string }> }>(
    "/me/transitiveMemberOf?$select=id"
  );
  return (res.value ?? []).map(x => x.id).filter(Boolean);
}



export async function getAppPermissionsRows(permisosSvc: MatrizPermisosService) {
  const res = await permisosSvc.getAll({ top: 5000, });
  const rows = res.filter((r) => r.Enabled === true)
  console.log(rows)
  return rows.map(r => ({
    GrupoId: r.GrupoId,
    FeatureKey: r.FeatureKey,
    Enabled: r.Enabled,
  }));
}