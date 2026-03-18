import "./Reports.css";
import type { useRegistroVisitantes } from "../../funcionalidades/RegistroVisitantes";
import { useReports } from "../../funcionalidades/reports";
import React from "react";

type ReportExporterProps = {
  controller: ReturnType<typeof useRegistroVisitantes>;
};

export default function ReportExporter({ controller }: ReportExporterProps) {
  const { rows, range, setRange, setEstado, empresa, setEmpresa, anfitrion, setAnfitrion, visitante, setVisitante,} = controller ;

  const { exportRegistrosToXLSX } = useReports({
    rows,
    fileName: "Reporte visitantes",
  });

  const clearFilters = () => {
    setRange({ from: "", to: "" });
    setVisitante("");
    setAnfitrion("");
    setEmpresa("");
    setEstado("all");
  };

   const empresaOptions = React.useMemo(() => {
      return [...new Set(rows.map(u => u.EmpresaVisitante))];
    }, []);

   const anfitrionOptions = React.useMemo(() => {
      return [...new Set(rows.map(u => u.Anfitrion))];
    }, []);

   const visitanteOptions = React.useMemo(() => {
      return [...new Set(rows.map(u => u.NombreVisitante))];
    }, []);


  return (
    <section className="re-card" aria-label="Generador de reportes">
      <header className="re-head">
        <div className="re-titleBlock">
          <h2 className="re-title">Generador de reportes</h2>
        </div>

        <div className="re-actions">
          <button type="button" className="re-btn" onClick={clearFilters}>
            Limpiar
          </button>

          <button type="button" className="re-btn re-btnPrimary" onClick={() => exportRegistrosToXLSX()} disabled={rows.length === 0} title={rows.length === 0 ? "No hay datos con esos filtros" : "Exportar a XLSX"}>
            Descargar reporte
          </button>
        </div>
      </header>

      <div className="re-body">
        <div className="re-filters">
          {/* 1) Rango de fechas */}
          <div className="re-filterGroup re-span2">
            <div className="re-row">
              <label className="re-inputWrap">
                <span className="re-mini">Desde</span>
                <input className="re-input" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })}/>
              </label>

              <label className="re-inputWrap">
                <span className="re-mini">Hasta</span>
                <input
                  className="re-input"
                  type="date"
                  value={range.to}
                  onChange={(e) => setRange({ ...range, to: e.target.value })}
                />
              </label>
            </div>
          </div>

          {/* 3) Empresa */}
          <div className="re-filterGroup">
            <div className="re-label">Empresa</div>
            <select className="re-select" value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
              <option value="">Todas</option>
              {(empresaOptions ?? []).map((op: any) => (
                <option key={op.value ?? op} value={op.value ?? op}>
                  {op.label ?? op}
                </option>
              ))}
            </select>
          </div>

          {/* 4) Anfitrión */}
          <div className="re-filterGroup">
            <div className="re-label">Anfitrión</div>
            <select className="re-select" value={anfitrion} onChange={(e) => setAnfitrion(e.target.value)}>
              <option value="">Todos</option>
              {(anfitrionOptions ?? []).map((op: any) => (
                <option key={op.value ?? op} value={op.value ?? op}>
                  {op.label ?? op}
                </option>
              ))}
            </select>
          </div>

          {/* 5) Visitante */}
          <div className="re-filterGroup">
            <div className="re-label">Visitante</div>
            <select className="re-select" value={visitante} onChange={(e) => setVisitante(e.target.value)}>
              <option value="">Todos</option>
              {(visitanteOptions ?? []).map((op: any) => (
                <option key={op.value ?? op} value={op.value ?? op}>
                  {op.label ?? op}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="re-meta">
          <div className="re-pill">
            <span className="re-pillLabel">Registros:</span>
            <span className="re-pillValue">{rows.length}</span>
          </div>

        </div>
      </div>
    </section>
  );
}
