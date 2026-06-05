export interface Pool { query<T>(sql: string): Promise<T[]>; }
export const pool: Pool = { async query() { return [] as any; } };
