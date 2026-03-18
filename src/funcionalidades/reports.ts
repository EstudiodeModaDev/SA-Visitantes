import * as XLSX from "xlsx";
import type { RegistroLectura } from "../models/registro";
import { toISODateFlex } from "../utils/date";

export type UseReportsArgs = {
  rows: RegistroLectura[];

  fileName?: string; // base name, ej "Visitas"
  sheetName?: string; // ej "Reporte"
};


export function useReports({rows}: UseReportsArgs) {

  async function exportRegistrosToXLSX(opts?: { fileName?: string }) {

    const data = rows.map((row) => {
      return {
        "Codigo": row.Title ?? "N/A",
        "Documento del visitante": row.DocumentoVisitante ?? "N/A",
        "Nombre del visitante": row.NombreVisitante ?? "N/A",
        "Correo del visitante": row.CorreoVisitante ?? "N/A",
        "Empresa del visitante": row.EmpresaVisitante ?? "N/A",
        "Telefono del visitante": row.Telefono ?? "N/A",
        "Fecha y hora esperada": toISODateFlex(row.FechaHoraEsperada) ?? "N/A",
        "Fecha y hora de llegada": toISODateFlex(row.HoraLlegada) ?? "N/A",
        "Motivo de la visita": row.Motivo ?? "N/A",
        "Estado": row.Estado ?? "N/A",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitas");

    XLSX.writeFile(wb, opts?.fileName ?? "Reporte Visitas.xlsx");
}

  return {
    exportRegistrosToXLSX
  };
}
