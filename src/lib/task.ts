export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  /** Creation time as a Unix timestamp, in milliseconds. */
  dataCriacao: number;
};

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const TASKS_PAGE_SIZE = 10;
