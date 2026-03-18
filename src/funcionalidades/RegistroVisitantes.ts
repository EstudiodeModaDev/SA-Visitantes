import * as React from "react";
import { useGraphServices } from "../graph/graphContext";
import { useAuth } from "../auth/authProvider";
import type { flow, RegistroEditable, RegistroErrors, RegistroLectura } from "../models/registro";
import { FlowClient } from "./FlowClient";
import { isEmail, norm } from "../utils/text";
import type { LogEditable } from "../models/logRegistro";
import { toDDMMYYYY_HHmm, toGraphDateTime } from "../utils/date";
import type { DateRange, GetAllOpts, SortDir, SortField } from "../models/commons";
import { useToast } from "../components/Toast/Toast";
import { usePermissions } from "./Permisos";

export function useDebouncedValue<T>(value: T, delay = 250) {
  const [deb, setDeb] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDeb(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return deb;
}

function includesSearch(row: RegistroLectura, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Anfitrion).includes(qq) ||
    norm(row.CorreoAnfitrion).includes(qq) ||
    norm(row.DocumentoVisitante).includes(qq) ||
    norm(row.EmpresaVisitante).includes(qq) ||
    norm(row.NombreVisitante).includes(qq) ||
    norm(row.CorreoVisitante).includes(qq) ||
    norm(row.Title).includes(qq)
  );
}

function compareRows(a: RegistroLectura, b: RegistroLectura, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const toTime = (v: any) => {
    if (!v) return 0;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.getTime();

    const s = String(v).trim();
    const isoTry = new Date(`${s}T00:00:00Z`);
    if (!Number.isNaN(isoTry.getTime())) return isoTry.getTime();

    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const d2 = new Date(Date.UTC(yyyy, mm - 1, dd));
      return Number.isNaN(d2.getTime()) ? 0 : d2.getTime();
    }
    return 0;
  };

  const get = (r: RegistroLectura) => {
    switch (field) {
      case "Cedula":
        return norm(r.DocumentoVisitante);
      case "Anfitrion":
        return norm(r.Anfitrion);
      case "Visitante":
        return norm(r.CorreoVisitante);
      case "estado":
        return norm(r.Estado);
      case "fecha":
        return toTime(r.FechaHoraEsperada);
      default:
        return "";
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}

export function useRegistroVisitantes() {
  const { registroVisitantes, logRegistro } = useGraphServices();
  const { account } = useAuth();
  const { push } = useToast();
  const { engine } = usePermissions();

  // ===== form state =====
  const [state, setState] = React.useState<RegistroEditable>({
    Title: "",
    Estado: "Programada",
    NombreVisitante: "",
    Anfitrion: account?.name || "",
    CorreoAnfitrion: account?.username || "",
    DocumentoVisitante: "",
    EmpresaVisitante: "",
    Telefono: "",
    CorreoVisitante: "",
    FechaHoraEsperada: null,
    HoraLlegada: null,
    Motivo: "",
    RegistradoPor: account?.name || "",
    FirmaURL: "",
    FirmaId: "",
  });

  const [errors, setErrors] = React.useState<RegistroErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  // ===== query state =====
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [estado, setEstado] = React.useState<string>("all");
  const [search, setSearch] = React.useState<string>("");
  const [visitante, setVisitante] = React.useState<string>("");
  const [anfitrion, setAnfitrion] = React.useState<string>("");
  const [empresa, setEmpresa] = React.useState<string>("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [sorts, setSorts] = React.useState<Array<{ field: SortField; dir: SortDir }>>([
    { field: "fecha", dir: "desc" },
  ]);

  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(20);

  const [loading, setLoading] = React.useState(false);

  // ===== data =====
  const [allRows, setAllRows] = React.useState<RegistroLectura[]>([]);

  // ✅ FlowClient estable
  const notifyFlow = React.useMemo(
    () =>
      new FlowClient(
        "https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b94eb5d9e9b44c2b9259d63e669d3def/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1K_9xKhaG3Qg1Tiy3LEWKExHUFk5GFUHzIbfk2p0WiY"
      ),
    []
  );

  // ===== helpers =====
  const setField = React.useCallback(
    <K extends keyof RegistroEditable>(k: K, v: RegistroEditable[K]) => setState((s) => ({ ...s, [k]: v })),
    []
  );

  React.useEffect(() => {
    if (!account) return;
    setState((s) => ({
      ...s,
      Anfitrion: s.Anfitrion || account.name || "",
      CorreoAnfitrion: s.CorreoAnfitrion || account.username || "",
      RegistradoPor: s.RegistradoPor || account.name || "",
    }));
  }, [account]);

  const validate = React.useCallback((v: RegistroEditable): RegistroErrors => {
    const e: RegistroErrors = {};
    if (!v.NombreVisitante.trim()) e.NombreVisitante = "Indique el nombre del visitante.";
    if (!v.CorreoVisitante.trim()) e.CorreoVisitante = "Indique el correo del visitante.";
    if (!v.DocumentoVisitante.trim()) e.DocumentoVisitante = "Indique el documento del visitante.";
    if (!String(v.FechaHoraEsperada ?? "").trim()) e.FechaHoraEsperada = "Indique la fecha y hora esperada.";
    else if (!isEmail(v.CorreoVisitante)) e.CorreoVisitante = "Correo inválido.";
    if (v.Telefono.trim() && v.Telefono.replace(/[^\d]/g, "").length < 7) e.Telefono = "Teléfono muy corto.";
    if (!v.Motivo.trim()) e.Motivo = "Indique el motivo de la visita.";
    return e;
  }, []);

  const cleanForm = React.useCallback(() => {
    setState({
      Title: "",
      Estado: "Programada",
      NombreVisitante: "",
      Anfitrion: account?.name || "",
      CorreoAnfitrion: account?.username || "",
      DocumentoVisitante: "",
      EmpresaVisitante: "",
      Telefono: "",
      CorreoVisitante: "",
      FechaHoraEsperada: null,
      HoraLlegada: null,
      Motivo: "",
      RegistradoPor: account?.name || "",
      FirmaURL: "",
      FirmaId: "",
    });
    setErrors({});
  }, [account?.name, account?.username]);

  // ===== server filter =====
  const buildServerFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    const canViewAll = engine.can("visitante.view");

    if (!canViewAll) {
      const email = account?.username?.replace(/'/g, "''");
      filters.push(`fields/CorreoAnfitrion eq '${email}'`);
    }
   
    if (estado !== "all" && estado !== "Todos") {
      filters.push(`fields/Estado eq '${estado}'`);
    }
    if (visitante) {
      filters.push(`fields/NombreVisitante eq '${visitante}'`);
    }
    if (anfitrion) {
      filters.push(`fields/Anfitrion eq '${anfitrion}'`);
    }
    if (empresa) {
      filters.push(`fields/EmpresaVisitante eq '${empresa}'`);
    }
    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/FechaHoraEsperada ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/FechaHoraEsperada le '${range.to}T23:59:59Z'`);
    }

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby: "fields/Created desc",
      top: 2000, // ✅ necesario para paginación LOCAL
    };
  }, [estado, range.from, range.to, empresa, visitante, anfitrion]);

  const loadBase = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    try {
      const items = await registroVisitantes.getAll(buildServerFilter());
      setAllRows(items.items ?? []);
      setPage(1); // ✅ volver a la primera página al recargar
    } catch (e: any) {
      push({
        message: "Error cargando visitas: " + (e?.message ?? ""),
        type: "error",
        timeoutMs: 5000,
        title: "Error",
      });
      setAllRows([]);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [account?.username, registroVisitantes, buildServerFilter, push]);

  React.useEffect(() => {
    loadBase();
  }, [loadBase]);

  // ===== dataset filtrado + ordenado (memo) =====
  const filteredSortedRows = React.useMemo(() => {
    let data = allRows;

    if (debouncedSearch.trim()) {
      data = data.filter((r) => includesSearch(r, debouncedSearch));
    }

    if (sorts.length) {
      data = [...data].sort((a, b) => {
        for (const s of sorts) {
          const c = compareRows(a, b, s.field, s.dir);
          if (c !== 0) return c;
        }
        return 0;
      });
    }

    return data;
  }, [allRows, debouncedSearch, sorts]);

  // ✅ total REAL (no pageRows.length)
  const total = filteredSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ✅ si cambian filtros/tamaño y la página queda fuera, corrige
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  // ===== rows visibles =====
  const rows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSortedRows.slice(start, start + pageSize);
  }, [filteredSortedRows, page, pageSize]);

  const hasNext = page < totalPages;

  const toggleSort = React.useCallback((field: SortField, additive = false) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.field === field);

      if (!additive) {
        if (idx >= 0) {
          const dir: SortDir = prev[idx].dir === "desc" ? "asc" : "desc";
          return [{ field, dir }];
        }
        return [{ field, dir: "asc" }];
      }

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { field, dir: copy[idx].dir === "desc" ? "asc" : "desc" };
        return copy;
      }
      return [...prev, { field, dir: "asc" }];
    });

    setPage(1);
  }, []);

  // ===== create =====
  const onCreate = React.useCallback(async (): Promise<void> => {
    const e = validate(state);
    setErrors(e);
    if (Object.keys(e).length) {
      push({ title: "Revisa el formulario", message: "Faltan campos obligatorios.", type: "warning", timeoutMs: 3500 });
      return;
    }

    setSubmitting(true);
    try {
      const ultimosRegistros = await registroVisitantes.getAll({ top: 1, orderby: "fields/Created desc" });
      const lastRegistro = ultimosRegistros.items?.[0];

      const consecutivoNumber = lastRegistro ? Number(String(lastRegistro.Title).replace(/[^\d]/g, "")) + 1 : 1;
      const consecutivo = "V - " + String(consecutivoNumber).padStart(5, "0");

      const payload: RegistroEditable = {
        Anfitrion: state.Anfitrion,
        CorreoAnfitrion: state.CorreoAnfitrion,
        CorreoVisitante: state.CorreoVisitante,
        DocumentoVisitante: state.DocumentoVisitante,
        EmpresaVisitante: state.EmpresaVisitante,
        Estado: state.Estado,
        FirmaId: "",
        Motivo: state.Motivo,
        NombreVisitante: state.NombreVisitante,
        RegistradoPor: state.RegistradoPor,
        Telefono: state.Telefono,
        Title: consecutivo,
        FechaHoraEsperada: toGraphDateTime(state.FechaHoraEsperada),
        FirmaURL: "",
        HoraLlegada: null
      }
      const registro = await registroVisitantes.create(payload);

      if (registro) {
        const payloadLog: LogEditable = {
          Title: registro.Id,
          Actor: state.Anfitrion,
          TipoEvento: "Registro",
          Detalle: `Visitante ${state.NombreVisitante} registrado con fecha y hora esperada ${toDDMMYYYY_HHmm(
            state.FechaHoraEsperada
          )} y motivo: ${state.Motivo}`,
        };
        await logRegistro.create(payloadLog);

        // opcional: await notifyFlow.post(...)
        void notifyFlow;

        push({ title: "Creado", message: "Visita registrada correctamente.", type: "success", timeoutMs: 3000 });

        cleanForm();
        await loadBase();
      }
    } catch (err: any) {
      push({
        title: "Error",
        message: "No se pudo registrar la visita: " + (err?.message ?? ""),
        type: "error",
        timeoutMs: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  }, [validate, state, registroVisitantes, logRegistro, push, cleanForm, loadBase, notifyFlow]);

  // ✅ setters que resetean página
  const setEstadoSafe = React.useCallback((v: string) => {
    setEstado(v);
    setPage(1);
  }, []);
  const setSearchSafe = React.useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  const setPageSizeSafe = React.useCallback((v: number) => {
    setPageSize(v);
    setPage(1);
  }, []);
  const setRangeSafe = React.useCallback((v: DateRange) => {
    setRange(v);
    setPage(1);
  }, []);

  const onCancelVisitor = React.useCallback(async (idVisita: string): Promise<void> => {
    try {
      const ok = window.confirm("¿Seguro quiere cancelar esta visita?")
      if(ok){
        await registroVisitantes.update(idVisita, {Estado: "Cancelada"})
        const payloadLog: LogEditable = {
          Title: idVisita,
          Actor: state.Anfitrion,
          TipoEvento: "Cancelacion",
          Detalle: `Visita cancelada por el usuario ${account?.name}`,
        };
        await logRegistro.create(payloadLog);
        push({ title: "Cancelado", message: "Visita cancelada correctamente.", type: "success", timeoutMs: 3000 });
      }
        await loadBase();
      } catch (err: any) {
      push({title: "Error", message: "No se pudo cancelar la visita: " + (err?.message ?? ""), type: "error", timeoutMs: 5000,});
    } finally {
      setSubmitting(false);
    }
  }, []);

  const onArriveVisitor = React.useCallback(async (idVisita: string): Promise<void> => {
    try {
      await registroVisitantes.update(idVisita, {Estado: "Finalizada", HoraLlegada: toGraphDateTime(new Date())})
      const visita = await registroVisitantes.get(idVisita)
      const payloadLog: LogEditable = {
        Title: idVisita,
        Actor: state.Anfitrion,
        TipoEvento: "Llegada",
        Detalle: `El visitante ha llegado a la sede`,
      };
      await logRegistro.create(payloadLog);
      notifyFlow.invoke<flow, any>({anfitrion: visita.Anfitrion, correoVisitante: visita.CorreoAnfitrion, visitante: visita.NombreVisitante})
      push({ title: "Confirmacion", message: "Visita confirmada correctamente.", type: "success", timeoutMs: 3000 });
      await loadBase();
    } catch (err: any) {
      push({title: "Error", message: "No se pudo cancelar la visita: " + (err?.message ?? ""), type: "error", timeoutMs: 5000,});
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    // form
    state, errors, submitting, 
    setField, setErrors, setSubmitting, validate,  cleanForm,

    // query/table
    loading, rows, total, totalPages, hasNext, page, pageSize, search, estado, range, sorts, empresa, visitante, anfitrion,

    // actions
    onCreate, onRefresh: loadBase, toggleSort, onCancelVisitor, onArriveVisitor, 

    // setters
    setPage, setEstado: setEstadoSafe, setSearch: setSearchSafe, setPageSize: setPageSizeSafe, setRange: setRangeSafe, setEmpresa, setVisitante, setAnfitrion
  };
}
