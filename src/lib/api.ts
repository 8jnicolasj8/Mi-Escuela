import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let currentSchoolSlug: string | null = null;

export const setCurrentSchool = (slug: string) => {
  currentSchoolSlug = slug;
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_school_slug', slug);
  }
};

export const getCurrentSchool = () => {
  if (currentSchoolSlug) return currentSchoolSlug;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('current_school_slug');
  }
  return null;
};

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
});

let authToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  authToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
};

export const getAccessToken = () => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const clearTokens = () => {
  authToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

api.interceptors.request.use((config: any) => {
  const token = getAccessToken();
  console.log('Axios interceptor - token:', token ? token.substring(0, 20) + '...' : null);
  if (token) {
    // Try setting header in different ways to ensure it works
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.headers.common) {
      config.headers.common['Authorization'] = `Bearer ${token}`;
    }
    console.log('Axios interceptor - Authorization header set');
    const schoolSlug = getCurrentSchool();
    if (schoolSlug) {
      config.headers['X-School-Slug'] = schoolSlug;
    }
  } else {
    console.log('Axios interceptor - NO TOKEN FOUND!');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      console.error('Network error - no response from server');
    }
    // If school not found, clear stored school
    if (error.response?.status === 404 && (error.response?.data as any)?.code === 'SCHOOL_NOT_FOUND') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_school_slug');
        currentSchoolSlug = null;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh } = response.data;
    setTokens(access, refresh);
    return response.data;
  },
  
  logout: async () => {
    try {
      const refresh = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } finally {
      clearTokens();
    }
  },
  
  me: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },
  
  changePassword: async (password: string) => {
    const response = await api.post('/users/change_password/', { password });
    return response.data;
  },
};

export const schoolsApi = {
  list: async () => {
    const response = await api.get('/schools/');
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/schools/${id}/`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/schools/', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.patch(`/schools/${id}/`, data);
    return response.data;
  },
  
  buscar: async (params: {
    q?: string;
    provincia?: string;
    localidad?: string;
    cue?: string;
    nombre?: string;
    codigo_postal?: string;
    limit?: number;
  }) => {
    const response = await api.get('/schools/buscar/', { params });
    return response.data;
  },
  
  getDirectivos: async (id: string) => {
    const response = await api.get(`/schools/${id}/directivos/`);
    return response.data;
  },
  
  setDirectivo: async (id: string, usuarioId: string) => {
    const response = await api.post(`/schools/${id}/set_directivo/`, { usuario_id: usuarioId });
    return response.data;
  },
  
  removeDirectivo: async (id: string, usuarioId: string) => {
    const response = await api.post(`/schools/${id}/remove_directivo/`, { usuario_id: usuarioId });
    return response.data;
  },
};

export const usersApi = {
  list: async (params?: any) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/users/', data);
    return response.data;
  },
  
  searchByDni: async (dni: string) => {
    const response = await api.get('/users/', { params: { dni } });
    return response.data;
  },
};

export const userSchoolApi = {
  list: async (params?: any) => {
    const response = await api.get('/userschool/', { params });
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/userschool/', data);
    return response.data;
  },
  
  getDirectivos: async () => {
    const response = await api.get('/userschool/directivos/');
    return response.data;
  },
  
  getDocentes: async () => {
    const response = await api.get('/userschool/docentes/');
    return response.data;
  },
  
  getAlumnos: async () => {
    const response = await api.get('/userschool/alumnos/');
    return response.data;
  },
  
  getSolicitudes: async () => {
    const response = await api.get('/userschool/solicitudes/');
    return response.data;
  },
  
  aprobar: async (id: string, rol?: string) => {
    const response = await api.post(`/userschool/${id}/aprobar/`, { rol });
    return response.data;
  },
  
  rechazar: async (id: string) => {
    const response = await api.post(`/userschool/${id}/rechazar/`);
    return response.data;
  },
};

export const solicitudesApi = {
  create: async (data: any) => {
    const response = await api.post('/solicitudes/', data);
    return response.data;
  },
};

export const academicsApi = {
  anios: {
    list: async () => {
      const response = await api.get('/anios/');
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/anios/', data);
      return response.data;
    },
  },
  
  cursos: {
    list: async (params?: any) => {
      const response = await api.get('/cursos/', { params });
      return response.data;
    },
    get: async (id: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/cursos/${id}/`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    create: async (data: any) => {
      const response = await api.post('/cursos/', data);
      return response.data;
    },
    crearMultiple: async (data: any) => {
      const response = await api.post('/cursos/crear_multiple/', data);
      return response.data;
    },
    delete: async (id: string) => {
      const token = getAccessToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/cursos/${id}/`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true };
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/cursos/${id}/`, data);
      return response.data;
    },
    addAlumno: async (id: string, alumnoId: string) => {
      const response = await api.post(`/cursos/${id}/agregar_alumno/`, { alumno_id: alumnoId });
      return response.data;
    },
    removeAlumno: async (id: string, alumnoId: string) => {
      const response = await api.post(`/cursos/${id}/quitar_alumno/`, { alumno_id: alumnoId });
      return response.data;
    },
  },
  
  misCursos: async () => {
    const token = getAccessToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/api/v1/mis-cursos/`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },
  
  misAlumnos: async (cursoId: string) => {
    const token = getAccessToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/api/v1/mis-alumnos/?curso=${cursoId}`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },
  
  misHorarios: async () => {
    const token = getAccessToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/api/v1/mis-horarios/`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },
  
  misClassrooms: async () => {
    const token = getAccessToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/api/v1/mis-classrooms/`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },
  
  materias: {
    list: async (params?: any) => {
      const response = await api.get('/materias/', { params });
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/materias/', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/materias/${id}/`, data);
      return response.data;
    },
    delete: async (id: string | number) => {
      // Use fetch to avoid axios Issue
      const token = getAccessToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Clean the ID - remove any trailing slashes or extra chars
      const cleanId = String(id).replace(/\/$/, '').replace(/:$/, '');
      const url = `${API_URL}/api/v1/materias/${cleanId}/`;
      console.log('DELETE materias URL:', url, 'ID:', cleanId);
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers
      });
      console.log('DELETE response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.log('DELETE error:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      return { success: true };
    },
  },
  
  classrooms: {
    list: async (params?: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const url = params && Object.keys(params).length > 0
        ? `${API_URL}/api/v1/classrooms/?${new URLSearchParams(params).toString()}`
        : `${API_URL}/api/v1/classrooms/`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    get: async (id: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/classrooms/${id}/`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    getByCurso: async (cursoId: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/classrooms/by_curso/?curso=${cursoId}`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    byCurso: async (cursoId: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/classrooms/by_curso/?curso=${cursoId}`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
  },
  
  publicaciones: {
    list: async (params?: any) => {
      const response = await api.get('/publicaciones/', { params });
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/publicaciones/', data);
      return response.data;
    },
  },
  
  periodos: {
    list: async (params?: any) => {
      console.log('Using fetch for periodos');
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const baseUrl = API_URL + '/api/v1';
      const url = params && Object.keys(params).length > 0 
        ? `${baseUrl}/periodos/?${new URLSearchParams(params).toString()}`
        : `${baseUrl}/periodos/`;
      
      console.log('Fetch URL:', url);
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    get: async (id: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/periodos/${id}/`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    create: async (data: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/periodos/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    update: async (id: string, data: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/periodos/${id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    delete: async (id: string) => {
      const token = getAccessToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/periodos/${id}/`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true };
    },
    activos: async () => {
      const response = await api.get('/periodos/activos/');
      return response.data;
    },
  },
  
  notas: {
    list: async (params?: any) => {
      const response = await api.get('/notas/', { params });
      return response.data;
    },
    get: async (id: string) => {
      const response = await api.get(`/notas/${id}/`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/notas/', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/notas/${id}/`, data);
      return response.data;
    },
    byPeriodo: async (periodoId: string) => {
      const response = await api.get('/notas/by_periodo/', { params: { periodo: periodoId } });
      return response.data;
    },
    byMateria: async (materiaId: string, periodoId: string) => {
      const response = await api.get('/notas/by_materia/', { params: { materia: materiaId, periodo: periodoId } });
      return response.data;
    },
  },
  
  escala: {
    get: async () => {
      const response = await api.get('/escala/mi_escala/');
      return response.data;
    },
    update: async (data: any) => {
      const response = await api.patch('/escala/mi_escala/', data);
      return response.data;
    },
  },
  
  bloquesHorario: {
    list: async () => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/bloques-horario/`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    create: async (data: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/bloques-horario/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    update: async (id: string, data: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/bloques-horario/${id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    delete: async (id: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/bloques-horario/${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return { success: true };
    },
  },
  
  horarios: {
    list: async () => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/horarios/`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    byCurso: async (cursoId: string) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/horarios/by_curso/?curso=${cursoId}`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    create: async (data: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/horarios/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    update: async (id: string, data: any) => {
      const token = getAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/v1/horarios/${id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
  },
};