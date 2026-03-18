import React from "react";
import "./RegistroVisitantes.css";
import "react-datepicker/dist/react-datepicker.css";
import type { RegistroEditable } from "../../models/registro";
import { normalizePhone } from "../../utils/text";
import {  toDayjsSafe, } from "../../utils/date";
import { useRegistroVisitantes } from "../../funcionalidades/RegistroVisitantes";
import { useToast } from "../Toast/Toast";
import { DateTimePicker, LocalizationProvider, renderTimeViewClock } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

type FormErrors = Partial<Record<keyof RegistroEditable, string>>;


export type ModernFormProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

const MfInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder }, ref) => (
  <input
    ref={ref}
    className="mf-input"
    value={value ?? ""}
    placeholder={placeholder}
    onClick={onClick}
    readOnly
  />
));
MfInput.displayName = "MfInput";

export function VisitorRegiser({title = "Nuevo visitante", subtitle = "", className = "",}: ModernFormProps) {
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof RegistroEditable, boolean>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  const {setField, state, validate, onCreate, cleanForm, onRefresh} = useRegistroVisitantes()
  const {push} = useToast()

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setToast(null);

    const e = validate(state);
    setErrors(e);

    if (Object.values(e).some(Boolean)) {
      push({type: "error", message: "Complete todos los campos obligatorios", timeoutMs: 5000, title: "Campos faltantes"})
      return;
    }

    try {
      setSubmitting(true);
      await onCreate();
      cleanForm();
      setErrors({});
      setTouched({});
    } catch (err: any) {
      push({type: "error", message: err?.message ?? "Ocurrió un error al enviar." + err?.message, timeoutMs: 5000, title: "Error al registrar"})
    } finally {
      setSubmitting(false);
      onRefresh()
    }
  };

  return (
    <section className={`mf-card ${className}`}>
      <header className="mf-header">
        <div>
          <h2 className="mf-title">{title}</h2>
          <p className="mf-subtitle">{subtitle}</p>
        </div>
      </header>

      {toast && (
        <div className={`mf-toast ${toast.type === "ok" ? "is-ok" : "is-err"}`} role="status">
          {toast.text}
        </div>
      )}

      <form className="mf-form" onSubmit={handleSubmit} noValidate>
        <div className="mf-grid">
          {/* Nombre Visitante */}
          <div className={`mf-field ${touched.NombreVisitante && errors.NombreVisitante ? "has-error" : ""}`}>
            <label className="mf-label" htmlFor="NombreVisitante">Nombre completo del visitante</label>
            <input id="NombreVisitante" className="mf-input" type="text" value={state.NombreVisitante} placeholder="Ej: Daniel Palacios" onChange={(e) => setField("NombreVisitante", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, NombreVisitante: true }))} aria-invalid={Boolean(errors.NombreVisitante)}/>
            <div className="mf-error" role="alert">{errors.NombreVisitante}</div>
          </div>

          {/* Documento Visitante */}
          <div className={`mf-field ${touched.DocumentoVisitante && errors.DocumentoVisitante ? "has-error" : ""}`}>
            <label className="mf-label" htmlFor="DocumentoVisitante">Documento del visitante</label>
            <input id="DocumentoVisitante" className="mf-input" type="text" value={state.DocumentoVisitante} placeholder="Ej: 1234567890" onChange={(e) => setField("DocumentoVisitante", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, DocumentoVisitante: true }))} aria-invalid={Boolean(errors.DocumentoVisitante)}/>
            <div className="mf-error" role="alert">{errors.DocumentoVisitante}</div>
          </div>

          {/* Correo Visitante */}
          <div className={`mf-field ${touched.CorreoVisitante && errors.CorreoVisitante ? "has-error" : ""}`}>
            <label className="mf-label" htmlFor="email">Correo Visitante</label>
            <input id="email" className="mf-input" type="email" value={state.CorreoVisitante} placeholder="tu@correo.com" onChange={(e) => setField("CorreoVisitante", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, CorreoVisitante: true }))} aria-invalid={Boolean(errors.CorreoVisitante)}/>
            <div className="mf-error" role="alert">{errors.CorreoVisitante}</div>
          </div>

          {/* fecha y hora esperada */}
          <div className={`mf-field ${touched.FechaHoraEsperada && errors.FechaHoraEsperada ? "has-error" : ""}`}>
            <label className="mf-label" htmlFor="fecha-hora-esperada">Fecha y hora esperada</label>
            {/*<input type="datetime-local" className="mf-input" value={""} step={900} onChange={(e) => setField("FechaHoraEsperada", localInputToSpIso(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, FechaHoraEsperada: true }))} aria-invalid={Boolean(errors.FechaHoraEsperada)}/>*/}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={toDayjsSafe(state.FechaHoraEsperada)}
                onChange={(v) => {
                  setTouched(t => ({ ...t, FechaHoraEsperada: true }));
                  if (!v || !v.isValid()) {
                    setField("FechaHoraEsperada", "");
                    return;
                  }
                  // guarda en ISO (ajusta a lo que tú necesites)
                  setField("FechaHoraEsperada", v.toDate().toISOString());
                }}
                minutesStep={15}      
                ampm                  
                slotProps={{
                  textField: {
                    size: "small",

                  },
                }}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  seconds: renderTimeViewClock,
                }}
              />
            </LocalizationProvider>
            <div className="mf-error" role="alert">{errors.FechaHoraEsperada}</div>
          </div>

          {/* Teléfono Visitante*/}
          <div className={`mf-field ${touched.Telefono && errors.Telefono ? "has-error" : ""}`}>
            <label className="mf-label" htmlFor="phone">Teléfono del visitante (opcional)</label>
            <input id="phone"  className="mf-input" inputMode="tel" value={state.Telefono} placeholder="Ej: +57 3001234567" onChange={(e) => setField("Telefono", normalizePhone(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, Telefono: true }))} aria-invalid={Boolean(errors.Telefono)}/>
            <div className="mf-error" role="alert">{errors.Telefono}</div>
          </div>

          {/* Empresa del visitante*/}
          <div className="mf-field">
            <label className="mf-label" htmlFor="company">Empresa del visitante (opcional)</label>
            <input id="company" className="mf-input" type="text" value={state.EmpresaVisitante} placeholder="Ej: Estudio de Moda" onChange={(e) => setField("EmpresaVisitante", e.target.value)}/>
          </div>

          {/* Mensaje */}
          <div className={`mf-field mf-span2 ${touched.Motivo && errors.Motivo ? "has-error" : ""}`}>
            <label className="mf-label" htmlFor="message">Motivo de la visita</label>
            <textarea id="message" className="mf-textarea" value={state.Motivo} placeholder="Motivo por el que viene el visitante" onChange={(e) => setField("Motivo", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, Motivo: true }))} aria-invalid={Boolean(errors.Motivo)}/>
            <div className="mf-helpRow">
            </div>
            <div className="mf-error" role="alert">{errors.Motivo}</div>
          </div>

        </div>

        <footer className="mf-actions">
          <button
            type="button"
            className="mf-btn mf-btnGhost"
            onClick={() => {
              cleanForm();
              setErrors({});
              setTouched({});
              setToast(null);
            }}
            disabled={submitting}
          >
            Limpiar
          </button>

          <button type="submit" className="mf-btn mf-btnPrimary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="mf-spinner" aria-hidden="true" />
                Enviando…
              </>
            ) : (
              "Enviar"
            )}
          </button>
        </footer>
      </form>
    </section>
  );
}
