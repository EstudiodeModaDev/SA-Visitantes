import * as React from "react";
import "./DetalleVisitante.css";
import type { RegistroLectura } from "../../models/registro";
import { toDDMMYYYY_HHmm } from "../../utils/date";
import { norm } from "../../utils/text";
import SignaturePad, { type SignaturePadValue } from "../SignaturePad/SignaturePad";
import { useGraphServices } from "../../graph/graphContext";
import { usePermissions } from "../../funcionalidades/Permisos";

export type VisitDetailModalProps = {
  open: boolean;
  onClose: () => void;

  onCancel: (idVisita: string) => Promise<void> | void;
  onArrive: (idVisita: string) => Promise<void> | void;

  onAfterChange: () => Promise<void> | void;

  visit: RegistroLectura | null;

  title?: string;
  subtitle?: string;
  footerExtra?: React.ReactNode;

  /** Para bloquear todo mientras guardas */
  busy?: boolean;
};

function statusTone(estado?: string): "ok" | "warn" | "bad" | "neutral" {
  const e = norm(estado ?? "");
  if (e.includes("final") || e.includes("complet") || e.includes("cerr")) return "ok";
  if (e.includes("sitio") || e.includes("en sitio") || e.includes("curso")) return "warn";
  if (e.includes("cancel") || e.includes("rechaz") || e.includes("error")) return "bad";
  if (e.includes("program")) return "neutral";
  return "neutral";
}

export function VisitDetailModal({open, onClose, visit, onCancel, onArrive, onAfterChange, title = "Detalle de visita", subtitle = "Información completa del registro", footerExtra, busy = false,}: VisitDetailModalProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // servicios (según tu GraphServicesProvider)
  const { registroVisitantes, firmas } = useGraphServices();
  const { engine } = usePermissions();

  // "detail" = ver info, "sign" = firmar
  const [mode, setMode] = React.useState<"detail" | "sign">("detail");
  const [sigValue, setSigValue] = React.useState<SignaturePadValue | null>(null);
  const [firmaURL, setFirmaURL] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [firmaImgSrc, setFirmaImgSrc] = React.useState<string>("");

  const isBusy = busy || saving;

  // reset al abrir / cambiar visita
  React.useEffect(() => {
    if (!open) return;
    setMode("detail");
    setSigValue(null);
    setSaving(false);
  }, [open, visit?.Id]);

  // ESC para cerrar
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, isBusy]);

  React.useEffect(() => {
    if (!open) return;

    if (!visit?.FirmaId) {
      setFirmaURL("");
      setFirmaImgSrc("");
      return;
    }

    let alive = true;
    let objectUrlToRevoke = "";

    (async () => {
      try {
        const firma = await firmas.getItemById(visit.FirmaId);
        if (!alive) return;

        setFirmaURL(firma?.webUrl ?? "");

        const blob = await firmas.downloadFileById(visit.FirmaId); 
        if (!alive) return;

        objectUrlToRevoke = URL.createObjectURL(blob);
        setFirmaImgSrc(objectUrlToRevoke);
      } catch {
        if (!alive) return;
        setFirmaURL("");
        setFirmaImgSrc("");
      }
    })();

    return () => {
      alive = false;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [open, visit?.FirmaId, firmas]);

  
  const tone = statusTone(visit?.Estado);
  const safe = (v: any) => (v === null || v === undefined || String(v).trim() === "" ? "—" : String(v));

  const handleDelete = async () => {
    if (!visit || isBusy) return;
    const ok = window.confirm("¿Seguro que quieres cancelar esta visita?");
    if (!ok) return;

    setSaving(true);
    try {
      await onCancel(visit.Id ?? "");
      await onAfterChange?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleArrive = async () => {
    if (!visit || isBusy) return;

    setSaving(true);
    try {
      await onArrive(visit.Id ?? "");
      await onAfterChange?.();
      setMode("sign"); // ✅ pasas a firma dentro del modal
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarFirma = async () => {
    if (!visit?.Id || isBusy) return;

    if (!sigValue) {
      alert("Primero debes firmar.");
      return;
    }

    setSaving(true);
    try {
      const fileName = `${(visit.Title || visit.Id).replace(/\s+/g, "_")}_${Date.now()}.png`;
      const file = new File([sigValue.blob], fileName, { type: "image/png" });

      // ✅ ajusta folderPath a tu biblioteca/ruta real
      const up = await firmas.uploadFile("/", file);

      // ✅ guarda en el item (usa el internal name real de tus columnas)
      await registroVisitantes.update(visit.Id, {
        FirmaId: up.id,
        FirmaURL: up.webUrl,
      });

      await onAfterChange();
      onClose();
    } catch (e: any) {
      alert("No se pudo guardar la firma: " + (e?.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="vdm-overlay" role="presentation">
      <div
        className="vdm-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de visita"
        tabIndex={-1}
        ref={panelRef}
        // ✅ importante: evita que el overlay “mate” eventos del canvas
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="vdm-glow" aria-hidden="true" />

        {/* Header */}
        <header className="vdm-head">
          <div className="vdm-headLeft">
            <div className="vdm-titleRow">
              <h3 className="vdm-title">{mode === "sign" ? "Firma del visitante" : title}</h3>
              <span className={`vdm-badge vdm-${tone}`}>{safe(visit?.Estado)}</span>
            </div>
            <p className="vdm-subtitle">{mode === "sign" ? "Firme dentro del recuadro" : subtitle}</p>
          </div>

          <button className="vdm-x" type="button" onClick={() => !isBusy && onClose()} aria-label="Cerrar" disabled={isBusy}>
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="vdm-body">
          {!visit ? (
            <div className="vdm-empty">
              <div className="vdm-emptyTitle">No hay visita seleccionada</div>
              <div className="vdm-emptyText">Selecciona un registro para ver su detalle.</div>
            </div>
          ) : mode === "sign" ? (
            <SignaturePad disabled={isBusy} onChange={setSigValue} />
          ) : (
            <>
              {/* Info grid */}
              <section className="vdm-grid">
                <div className="vdm-field">
                  <div className="vdm-kpiLabel">ID</div>
                  <div className="vdm-value">{safe(visit.Title)}</div>
                </div>
                <div className="vdm-field">
                  <div className="vdm-label">Esperada</div>
                  <div className="vdm-value">{toDDMMYYYY_HHmm(visit.FechaHoraEsperada)}</div>
                </div>
                <div className="vdm-field">
                  <div className="vdm-label">Llegada</div>
                  <div className="vdm-value">{visit.HoraLlegada ? toDDMMYYYY_HHmm(visit.HoraLlegada) : "Pendiente"}</div>
                </div>
                <div className="vdm-field">
                  <div className="vdm-label">Empresa</div>
                  <div className="vdm-value">{safe(visit.EmpresaVisitante)}</div>
                </div>
                <div className="vdm-field">
                  <div className="vdm-label">Visitante</div>
                  <div className="vdm-value">{safe(visit.NombreVisitante)}</div>
                </div>

                <div className="vdm-field">
                  <div className="vdm-label">Documento</div>
                  <div className="vdm-value">{safe(visit.DocumentoVisitante)}</div>
                </div>

                <div className="vdm-field">
                  <div className="vdm-label">Teléfono</div>
                  <div className="vdm-value">{safe(visit.Telefono)}</div>
                </div>

                <div className="vdm-field">
                  <div className="vdm-label">Anfitrión</div>
                  <div className="vdm-value">{safe(visit.Anfitrion)}</div>
                </div>

                <div className="vdm-field vdm-span2">
                  <div className="vdm-label">Motivo</div>
                  <div className="vdm-value vdm-pre">{safe(visit.Motivo)}</div>
                </div>

                <div className="vdm-field">
                  <div className="vdm-label">Registrado por</div>
                  <div className="vdm-value">{safe((visit as any).RegistradoPor)}</div>
                </div>

                <div className="vdm-field vdm-span2">
                  <div className="vdm-label">Firma</div>

                  <div className="vdm-value vdm-signWrap">
                    {firmaImgSrc ? (
                      <button type="button" className="vdm-signBtn" onClick={() => window.open(firmaURL, "_blank", "noopener,noreferrer")} aria-label="Abrir firma en nueva pestaña">
                        <img className="vdm-signImg" src={firmaImgSrc} alt="Firma del visitante" />
                      </button>
                    ) : (
                      <span className="vdm-pillMuted">No hay firma relacionada</span>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="vdm-foot">
          <div className="vdm-footLeft">{footerExtra}</div>

          <div className="vdm-footRight">
            {mode === "sign" ? (
              <>
                <button className="vdm-btn" type="button"  onClick={() => setMode("detail")} disabled={isBusy}>
                  Volver
                </button>

                <button className="vdm-btn vdm-btnPrimary" type="button" onClick={handleGuardarFirma} disabled={isBusy || !sigValue}>
                  {isBusy ? "Guardando…" : "Guardar firma"}
                </button>
              </>
            ) : (
              <>
                {engine.can("visitante.edit") && visit?.Estado !== "Finalizada" && (
                  <>
                    <button className="vdm-btn vdm-btnPrimary" type="button" onClick={handleArrive} disabled={isBusy || !visit}>
                      {isBusy ? "Procesando…" : "Llegada"}
                    </button>
 
                    <button className="vdm-btn vdm-btnDanger" type="button" onClick={handleDelete} disabled={isBusy || !visit}>
                      {isBusy ? "Procesando…" : "Cancelar"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
