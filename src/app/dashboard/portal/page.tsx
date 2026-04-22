'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { userSchoolApi, schoolsApi, academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, GraduationCap, BookOpen, Settings, Building2, Plus, X, Calendar, Clock } from 'lucide-react';

interface Periodo {
  id: string;
  anio: number;
  numero: number;
  nombre: string;
  fecha_inicio_notas: string;
  fecha_fin_notas: string;
  fecha_inicio_boletin: string | null;
  fecha_fin_boletin: string | null;
  activo: boolean;
  estado: string;
  puede_cargar_notas: boolean;
  boletin_visible: boolean;
}

export default function PortalDirectivoPage() {
  const router = useRouter();
  const { user, userSchool } = useAuthStore();
  const [stats, setStats] = useState({
    total: 0,
    directivos: 0,
    docentes: 0,
    alumnos: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Periodos
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loadingPeriodos, setLoadingPeriodos] = useState(true);
  const [showPeriodoForm, setShowPeriodoForm] = useState(false);
  const [anioActual] = useState(new Date().getFullYear());
  
  // Formulario de período
  const [periodoForm, setPeriodoForm] = useState({
    numero: 1,
    nombre: '',
    fecha_inicio_notas: '',
    fecha_fin_notas: '',
    fecha_inicio_boletin: '',
    fecha_fin_boletin: '',
  });

  useEffect(() => {
    fetchStats();
    fetchPeriodos();
  }, []);

  const fetchStats = async () => {
    try {
      const usersRes = await userSchoolApi.list({ activo: true });
      const usersData = Array.isArray(usersRes) ? usersRes : usersRes.results || [];

      setStats({
        total: usersData.length,
        directivos: usersData.filter((u: any) => u.rol === 'DIRECTIVO').length,
        docentes: usersData.filter((u: any) => u.rol === 'DOCENTE').length,
        alumnos: usersData.filter((u: any) => u.rol === 'ALUMNO').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodos = async () => {
    try {
      console.log('Fetching periodos for year:', anioActual);
      // Fetch all without filter first
      const res = await academicsApi.periodos.list();
      console.log('Periodos response:', res);
      const allPeriodos = Array.isArray(res) ? res : res.results || [];
      // Filter by year in frontend
      const filtered = allPeriodos.filter((p: Periodo) => p.anio === anioActual);
      setPeriodos(filtered.length > 0 ? filtered : allPeriodos);
    } catch (error) {
      console.error('Error fetching periodos:', error);
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const handleCreatePeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicsApi.periodos.create({
        ...periodoForm,
        anio: anioActual,
        fecha_inicio_boletin: periodoForm.fecha_inicio_boletin || null,
        fecha_fin_boletin: periodoForm.fecha_fin_boletin || null,
      });
      setShowPeriodoForm(false);
      setPeriodoForm({
        numero: 1,
        nombre: '',
        fecha_inicio_notas: '',
        fecha_fin_notas: '',
        fecha_inicio_boletin: '',
        fecha_fin_boletin: '',
      });
      fetchPeriodos();
      alert('Período creado correctamente');
    } catch (error: any) {
      console.error('Error creating periodo:', error);
      alert('Error al crear período: ' + (error.response?.data?.error || error.message));
    }
  };

  const togglePeriodo = async (periodo: Periodo) => {
    try {
      const periodoId = String(periodo.id);
      await academicsApi.periodos.update(periodoId, { activo: !periodo.activo });
      fetchPeriodos();
    } catch (error: any) {
      console.error('Error toggling periodo:', error);
      alert('Error al actualizar período: ' + (error.message || ''));
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      'CARGA_NOTAS': 'bg-green-100 text-green-800',
      'BOLETIN': 'bg-blue-100 text-blue-800',
      'CERRADO': 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      'CARGA_NOTAS': 'Carga de Notas',
      'BOLETIN': 'Boletín Visible',
      'CERRADO': 'Cerrado',
    };
    return { className: badges[estado] || 'bg-gray-100 text-gray-800', label: labels[estado] || estado };
  };

  const schoolName = userSchool?.nombre_escuela || 'Mi Escuela';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Portal Directivo
        </h2>
        <p className="text-gray-500">Gestiona tu escuela</p>
      </div>

      {/* Escuela info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {schoolName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Bienvenido al panel de gestión de tu escuela. Aquí podrás administrar todos los aspectos de tu institución educativa.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Directivos</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold">{stats.directivos}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docentes</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold">{stats.docentes}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
            <GraduationCap className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold">{stats.alumnos}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Períodos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Períodos Académicos - Año {anioActual}
          </CardTitle>
          <Button size="sm" onClick={() => setShowPeriodoForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Período
          </Button>
        </CardHeader>
        <CardContent>
          {/* Formulario de nuevo período */}
          {showPeriodoForm && (
            <form onSubmit={handleCreatePeriodo} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input
                    type="number"
                    min={1}
                    value={periodoForm.numero}
                    onChange={(e) => setPeriodoForm({ ...periodoForm, numero: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Nombre (ej: 1er Trimestre)</Label>
                  <Input
                    value={periodoForm.nombre}
                    onChange={(e) => setPeriodoForm({ ...periodoForm, nombre: e.target.value })}
                    placeholder="1er Trimestre"
                    required
                  />
                </div>
                <div>
                  <Label>Fecha inicio carga de notas</Label>
                  <Input
                    type="date"
                    value={periodoForm.fecha_inicio_notas}
                    onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio_notas: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Fecha fin carga de notas</Label>
                  <Input
                    type="date"
                    value={periodoForm.fecha_fin_notas}
                    onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin_notas: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Fecha inicio boletin (opcional)</Label>
                  <Input
                    type="date"
                    value={periodoForm.fecha_inicio_boletin}
                    onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio_boletin: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fecha fin boletin (opcional)</Label>
                  <Input
                    type="date"
                    value={periodoForm.fecha_fin_boletin}
                    onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin_boletin: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Crear Período</Button>
                <Button type="button" variant="outline" onClick={() => setShowPeriodoForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Lista de períodos */}
          {loadingPeriodos ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : periodos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay períodos configurados para el año {anioActual}</p>
              <p className="text-sm">Creá el primer período académico</p>
            </div>
          ) : (
            <div className="space-y-2">
              {periodos.map((periodo) => {
                const estado = getEstadoBadge(periodo.estado);
                return (
                  <div
                    key={periodo.id}
                    className={`p-4 border rounded-lg flex items-center justify-between ${
                      periodo.activo ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{periodo.nombre}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${estado.className}`}>
                          {estado.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>Carga de notas: </span>
                        <span className="font-medium">
                          {periodo.fecha_inicio_notas} al {periodo.fecha_fin_notas}
                        </span>
                      </div>
                      {periodo.fecha_inicio_boletin && (
                        <div className="text-sm text-gray-500">
                          <span>Boletín visible: </span>
                          <span className="font-medium">
                            {periodo.fecha_inicio_boletin} al {periodo.fecha_fin_boletin}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={periodo.activo ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => togglePeriodo(periodo)}
                      >
                        {periodo.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => router.push('/dashboard/portal/bloques')}>
              <Clock className="h-6 w-6" />
              <span>Bloques de Horario</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              <span>Gestionar Usuarios</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span>Gestionar Cursos</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => router.push('/dashboard/portal/avisos')}>
              <Settings className="h-6 w-6" />
              <span>Avisos</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Settings className="h-6 w-6" />
              <span>Configuración</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle>Acerca del Portal Directivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Este es el panel de administración para directivos escolares. Desde aquí podrás:
          </p>
          <ul className="text-sm text-gray-600 mt-2 list-disc list-inside space-y-1">
            <li>Ver y gestionar los usuarios de tu escuela</li>
            <li>Administrar cursos, materias y períodos académicos</li>
            <li>Configurar los plazos para carga de notas y visualización de boletines</li>
            <li>aprobar o rechazar solicitudes de nuevos usuarios</li>
            <li>Configurar opciones de la escuela</li>
            <li>Y más funcionalidades que se irán agregando</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}