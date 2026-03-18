export interface LogEditable {
  Title: string;
  TipoEvento: string;
  Actor: string;
  Detalle: string;
}

export interface LogLectura extends LogEditable {
  Id: string;
  Created: string;
}

export type RegistroErrors = Partial<Record<keyof LogEditable, string>>;