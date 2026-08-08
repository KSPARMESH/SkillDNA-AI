export interface StringFilter {
  contains?: string;
  equals?: string;
  in?: string[];
  mode?: 'default' | 'insensitive';
}

export function buildStringFilter(value?: string, mode: 'default' | 'insensitive' = 'insensitive') {
  if (!value) return undefined;
  return { contains: value, mode };
}
