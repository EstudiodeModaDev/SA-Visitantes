export const FEATURES = {
  Visitante: ["visitante.edit", "visitante.registrar", "visitante.reports", "visitante.view", "app.access"],
} as const;

// ✅ FeatureKey sale automáticamente de FEATURES
export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES][number];

export type ModuleKey = keyof typeof FEATURES;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  "visitante.view": "Ver todas las visitas",
  "visitante.edit": "Editar visitas",
  "visitante.reports": "Generar reportes",
  "visitante.registrar": "Registrar nuevas visitas",
  "app.access": "Administrar accesos"
};

export type AppPermissionRow = {
  Id: string;
  Title: string;
  GrupoId: string;
  GroupKey?: string;
  Enabled: boolean;
  FeatureKey: string;
  Module?: string;
};