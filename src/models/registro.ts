export interface RegistroEditable {
  Title: string;
  Estado: string;
  NombreVisitante: string;
  DocumentoVisitante: string;
  EmpresaVisitante: string;
  Telefono: string;
  CorreoVisitante: string;
  Motivo: string;
  Anfitrion: string;
  CorreoAnfitrion: string;
  RegistradoPor: string;
  FechaHoraEsperada?: string | null;
  HoraLlegada?: string | null;
  FirmaURL?: string;
  FirmaId: string;
}

export type flow = {
  anfitrion: string;
  visitante: string;
  correoVisitante: string;
}

export interface RegistroLectura extends RegistroEditable {
  Id: string;
  Created: string;
}

export type RegistroErrors = Partial<Record<keyof RegistroEditable, string>>;