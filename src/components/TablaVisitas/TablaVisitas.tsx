import * as React from "react";
import "./TablaVisitas.css";
import { toDDMMYYYY_HHmm } from "../../utils/date";
import { norm } from "../../utils/text";
import { renderSortIndicator } from "../../utils/sort";
import type { useRegistroVisitantes } from "../../funcionalidades/RegistroVisitantes";
import { VisitDetailModal } from "../DetalleVisitante/Detalle";
import type { RegistroLectura } from "../../models/registro";


type Props = {
  controller: ReturnType<typeof useRegistroVisitantes>;
};


function statusTone(estado: string): "ok" | "warn" | "bad" | "neutral" {
  const e = norm(estado);
  if (e.includes("final") || e.includes("complet") || e.includes("cerr")) return "ok";
  if (e.includes("sitio") || e.includes("en sitio") || e.includes("curso")) return "warn";
  if (e.includes("cancel") || e.includes("rechaz") || e.includes("error")) return "bad";
  if (e.includes("program")) return "neutral";
  return "neutral";
}

/* =========================
   Component
   ========================= */
export function VisitasTable({ controller }: Props) {
  const {setEmpresa, setAnfitrion, setVisitante, onArriveVisitor, rows, loading, onRefresh, toggleSort, sorts, total, totalPages, estado, setEstado, search, setSearch, setPageSize, range, setRange, page, setPage, onCancelVisitor} = controller;
  const [view, setView] = React.useState<boolean>(false)
  const [selectedVisitor, setSelectedVisitor] = React.useState<RegistroLectura | null>(null)
  const estados = React.useMemo(() => {
    const set = new Set(rows.map(r => r.Estado).filter(Boolean));
    return ["Todos", ...Array.from(set).sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}))];
  }, [rows]);

  React.useEffect(() => {
    setVisitante("")
    setAnfitrion("")
    setEmpresa("")
    onRefresh()
  }, []);

  const clearFilters = () => {
    setSearch("");
    setEstado("Todos");
    setRange({from: "", to: ""});
    setPageSize(10)
  };

  return (
    <section className="vt-card">
      <header className="vt-head">
        <div className="vt-titleWrap">
          <h2 className="vt-title">Registros de visitas</h2>
          <p className="vt-subtitle">
            {loading ? "Cargando…" : `${total} registro(s)`}
          </p>
        </div>

        <div className="vt-headActions">
          <button className="vt-btn" type="button" onClick={clearFilters} disabled={loading}>
            Limpiar
          </button>
          <button className="vt-btn vt-btnPrimary" type="button" onClick={onRefresh} disabled={loading || !onRefresh}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <div className="vt-filters">
        <div className="vt-field">
          <label className="vt-label">Buscar</label>
          <input className="vt-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, nombre, documento, correo, empresa, anfitrión…"/>
        </div>

        <div className="vt-field">
          <label className="vt-label">Estado</label>
          <select className="vt-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {estados.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="vt-field">
          <label className="vt-label">Desde</label>
          <input className="vt-input" type="date" value={range.from ?? ""} onChange={(e) => setRange({...range, from: e.target.value})} />
        </div>

        <div className="vt-field">
          <label className="vt-label">Hasta</label>
          <input className="vt-input" type="date" value={range.to ?? ""} onChange={(e) => setRange({...range, to: e.target.value})} />
        </div>
      </div>

      <div className="vt-tableWrap" role="region" aria-label="Tabla de visitas">
        <table className="vt-table">
          <thead>
            <tr>
              <th className="vt-th vt-sort" onClick={() => toggleSort("fecha")} role="button">
                ID <span className={`vt-sortIcon`}>{renderSortIndicator('fecha', sorts)}</span>
              </th>
              <th className="vt-th vt-sort" onClick={() => toggleSort("Visitante")} role="button">
                Visitante <span className={`vt-sortIcon`}>{renderSortIndicator('Visitante', sorts)}</span>
              </th>
              <th className="vt-th vt-sort" onClick={() => toggleSort("Cedula")} role="button">
                Documento <span className={`vt-sortIcon`}>{renderSortIndicator('Cedula', sorts)}</span>
              </th>
              <th className="vt-th vt-sort" onClick={() => toggleSort("estado")} role="button">
                Estado <span className={`vt-sortIcon`}>{renderSortIndicator('estado', sorts)}</span>
              </th>
              <th className="vt-th vt-sort" onClick={() => toggleSort("fecha")} role="button">
                Esperada <span className={`vt-sortIcon`}>{renderSortIndicator('fecha', sorts)}</span>
              </th>
              <th className="vt-th vt-sort" role="button">
                Llegada <span className={`vt-sortIcon`}></span>
              </th>
              <th className="vt-th vt-sort" role="button">
                Empresa <span className={`vt-sortIcon`}></span>
              </th>
              <th className="vt-th vt-sort" onClick={() => toggleSort("Anfitrion")} role="button">
                Anfitrión <span className={`vt-sortIcon`}>{renderSortIndicator('Anfitrion', sorts)}</span>
              </th>

            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="vt-skelRow">
                  <td>
                    <div className="vt-skel" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                {/*<td colSpan={(onEdit || onDelete) ? 9 : 8}>*/}
                <td>
                  <div className="vt-state">
                    <div className="vt-stateTitle">Sin resultados</div>
                    <div className="vt-stateText">Prueba cambiar los filtros o la búsqueda.</div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const tone = statusTone(r.Estado);
                return (
                  <tr key={r.Id} className={`vt-tr is-clickable`} onClick={() => {setSelectedVisitor(r); setView(true)}}>
                    <td className="vt-td vt-id">{r.Title}</td>
                    <td className="vt-td">
                      <div className="vt-mainCell">
                          <div className="vt-main">{r.NombreVisitante}</div>
                          <div className="vt-sub">{r.CorreoVisitante || "—"}</div>
                      </div>
                    </td>
                    <td className="vt-td">{r.DocumentoVisitante}</td>
                    <td className="vt-td">
                      <span className={`vt-badge vt-${tone}`}>{r.Estado}</span>
                    </td>
                    <td className="vt-td">{toDDMMYYYY_HHmm(r.FechaHoraEsperada)}</td>
                    <td className="vt-td">{toDDMMYYYY_HHmm(r.HoraLlegada)}</td>
                    <td className="vt-td">{r.EmpresaVisitante || "—"}</td>
                    <td className="vt-td">{r.Anfitrion || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="vt-footer">
        <div className="vt-footLeft">
          <span className="vt-footMuted">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <span className="vt-dot">•</span>
          <span className="vt-footMuted">
            Mostrando <strong>{rows.length}</strong> de <strong>{total}</strong>
          </span>
        </div>

        <div className="vt-pager">
          <button className="vt-btn" type="button" onClick={() => setPage(1)} disabled={page <= 1 || loading}>
            «
          </button>
          <button className="vt-btn" type="button" onClick={() => setPage(Math.min(totalPages, page - 1))} disabled={page <= 1 || loading}>
            Anterior
          </button>
          <button className="vt-btn" type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading}>
            Siguiente
          </button>
          <button className="vt-btn" type="button" onClick={() => setPage(totalPages)} disabled={page >= totalPages || loading}>
            »
          </button>
        </div>
      </footer>

      <VisitDetailModal open={view} onClose={() => setView(false)} visit={selectedVisitor} onCancel={onCancelVisitor} onArrive={onArriveVisitor} onAfterChange={onRefresh}/>
    </section>
  );
}
