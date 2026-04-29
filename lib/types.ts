export interface LimiteItem {
  cantidad?: number | string | null;
  medida?: string | null;
  periodo?: string | null;
  moneda?: string | null;
  [key: string]: unknown;
}

export interface Cobertura {
  id?: string;
  id_condicion?: string;
  nombre?: string | null;
  categoria?: string | null;
  tipo?: string | null;
  tipo_cobertura?: string | null;
  tipo_valor?: string | null;
  descripcion?: string | null;
  inclusion?: string | null;
  valor?: string | number | null;
  medida?: string | null;
  valor_completo?: string | number | null;
  alcance?: string | null;
  limites?: LimiteItem[] | string[] | null;
  condiciones?: string[] | null;
  exclusiones?: string[] | null;
  upgrades_ids?: string[] | null;
  fuente?: string | null;
  estado?: string | null;
  [key: string]: unknown;
}

export interface Exclusion {
  id?: string;
  id_exclusion?: string;
  nombre?: string | null;
  categoria?: string | null;
  descripcion?: string | null;
  inclusion?: string | null;
  condiciones?: string[] | null;
  excepciones?: string[] | null;
  fuente?: string | null;
  [key: string]: unknown;
}

export interface Upgrade {
  id?: string;
  id_upgrade?: string;
  nombre?: string | null;
  descripcion?: string | null;
  inclusion?: string | null;
  valor?: string | number | null;
  medida?: string | null;
  valor_completo?: string | number | null;
  tipo_valor?: string | null;
  condiciones?: string[] | null;
  exclusiones?: string[] | null;
  categorias_afectadas?: string[] | null;
  coberturas_relacionadas_ids?: string[] | null;
  fuente?: string | null;
  tipo?: string | null;
  [key: string]: unknown;
}

export interface Empresa {
  nombre_comercial?: string | null;
  nombre_legal?: string | null;
  pais_origen?: string | null;
  sitio_web?: string | null;
  email_contacto?: string | null;
  telefono?: string | null;
  telefono_contacto?: string | null;
  direccion?: string | null;
  notas?: string[] | null;
  fuente?: string | null;
  [key: string]: unknown;
}

export interface CoberturaTerritorial {
  alcance?: string | null;
  ambito?: string | null;
  regiones_incluidas?: string[] | null;
  regiones_excluidas?: string[] | null;
  paises_incluidos?: string[] | null;
  paises_excluidos?: string[] | null;
  excluye_pais_residencia?: boolean | null;
  descripcion?: string | null;
  notas?: string[] | null;
  fuente?: string | null;
  [key: string]: unknown;
}

export interface InsuranceProduct {
  version_schema?: string | null;
  compania?: string | null;
  plan?: string | null;
  plan_nombre_archivo?: string | null;
  plan_codigo?: string | null;
  idioma_base?: string | null;
  empresa?: Empresa | null;
  cobertura_territorial?: CoberturaTerritorial | null;
  coberturas?: Cobertura[] | null;
  exclusiones_generales?: Exclusion[] | null;
  upgrades?: Upgrade[] | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}
