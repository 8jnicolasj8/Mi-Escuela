export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  short_name: string;
  dni: string;
  provincia: string;
  localidad: string;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface UserSchool {
  id: string;
  usuario: User;
  escuela: School;
  nombre_escuela: string;
  rol: 'SUPERADMIN' | 'DIRECTIVO' | 'DOCENTE' | 'ALUMNO' | 'APODERADO';
  activo: boolean;
  nombre_completo: string;
  estado_solicitud: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  foto_perfil?: string;
  foto_perfil_url?: string | null;
}

export interface School {
  id: string;
  nombre: string;
  slug: string;
  logo: string | null;
  cue: string;
  provincia: string;
  localidad: string;
  direccion: string;
  telefono: string;
  email: string;
  website: string;
  activa: boolean;
  habilita_boletin_pdf: boolean;
  nombre_completo: string;
  created_at: string;
  updated_at: string;
}

export interface Anio {
  id: string;
  numero: number;
  escuela: string;
}

export interface Curso {
  id: string;
  anio: string;
  anio_numero: number;
  division: string;
  turno: 'MANIANA' | 'TARDE' | 'NOCHE' | 'COMPLETO';
  ciclo: 'PRIMARIO' | 'SECUNDARIO' | 'TERCIARIO';
  activo: boolean;
  anio_creacion: number;
  nombre_completo: string;
}

export interface Materia {
  id: string;
  nombre: string;
  nombre_corto: string;
  nombre_corto_display: string;
  curso: string;
  docente: UserSchool | null;
  docente_info: UserSchool | null;
  orden: number;
  activa: boolean;
}

export interface Alumno {
  id: string;
  usuario_escuela: UserSchool;
  usuario_info: UserSchool;
  curso: string;
  activo: boolean;
  fecha_inscripcion: string;
}

export interface Classroom {
  id: string;
  materia: string;
  materia_nombre: string;
  curso_nombre: string;
  descripcion: string;
  codigo_acceso: string;
  permite_publicaciones: boolean;
  permite_tareas: boolean;
  permite_recursos: boolean;
  created_at: string;
  updated_at: string;
}

export interface Publicacion {
  id: string;
  classroom: string;
  autor: UserSchool;
  autor_nombre: string;
  tipo: 'AVISO' | 'TAREA' | 'RECURSO' | 'PREGUNTA';
  titulo: string;
  contenido: string;
  adjuntos: string[];
  publicado: boolean;
  fecha_publicacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface BloqueHorario {
  id: string | number;
  escuela: string;
  hora_inicio: string;
  hora_fin: string;
  orden: number;
}

export interface Horario {
  id: string | number;
  curso: string | number;
  dia_semana: number;
  dia_nombre: string;
  bloque: string | number;
  bloque_horario: string;
  materia: string | null;
  materia_info: {
    id: string | number;
    nombre: string;
    nombre_corto: string;
    docente_info: {
      nombre_completo: string;
    } | null;
  } | null;
}