export type desplegablesOption = {
    value: string;      
    label: string;      
}

export type GetAllOpts = {
  filter?: string;
  orderby?: string;
  top?: number;
};

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
};

export type SortDir = 'asc' | 'desc';
export type SortField = string;

export type PageResult<T> = {
  items: T[];
  nextLink: string | null;
};

export type Archivo = {
  id: string;
  name: string;
  webUrl: string;
  isFolder: boolean;
  size?: number;
  lastModified?: string;
  childCount?: number
  created?: string;
};