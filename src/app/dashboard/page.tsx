'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { schoolsApi, userSchoolApi, academicsApi } from '@/lib/api';
import Link from 'next/link';
import { GraduationCap, BookOpen, Users, School, Clock, FileText } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userSchool } = useAuthStore();
const [stats, setStats] = useState({
    schools: 0,
    users: 0,
    courses: 0,
    students: 0,
    docente: 0,
    materias: 0,
    curso_nombre: '',
  });
  const [loading, setLoading] = useState(true);

  console.log('dashboard page - userSchool:', userSchool);
  console.log('dashboard page - userSchool?.rol:', userSchool?.rol);
  console.log('dashboard page - user?.is_superuser:', user?.is_superuser);
  
  const userRole = userSchool?.rol || (user?.is_superuser === true ? 'SUPERADMIN' : 'ALUMNO');

  useEffect(() => {
    const fetchStats = async () => {
      try {
if (userRole === 'ALUMNO') {
          const cursosRes = await academicsApi.misCursos();
          const cursosData = Array.isArray(cursosRes) ? cursosRes : cursosRes.results || [];
          // Get curso nombre from first curso
          const cursoNombre = cursosData.length > 0 ? (cursosData[0].curso_nombre || 'Mi Curso') : '';
          setStats({
            schools: 0,
            users: 0,
            courses: cursosData.length,
            students: 0,
            docente: 0,
            materias: cursosData.length,
            curso_nombre: cursoNombre
          });
        } else if (userRole === 'DOCENTE') {
          const cursosRes = await academicsApi.misCursos();
          const cursosData = Array.isArray(cursosRes) ? cursosRes : cursosRes.results || [];
          const totalMaterias = cursosData.reduce((acc: number, c: any) => acc + (c.materias?.length || 0), 0);
          setStats({
            schools: 0,
            users: 0,
            courses: cursosData.length,
            students: 0,
            docente: 0,
            materias: totalMaterias,
            curso_nombre: '',
          });
        } else {
          const [schoolsRes, usersRes] = await Promise.all([
            schoolsApi.list(),
            userSchoolApi.list({ activo: true }),
          ]);
          
          const usersData = Array.isArray(usersRes) ? usersRes : usersRes.results || [];
          
          setStats({
            schools: userRole === 'SUPERADMIN' ? (schoolsRes.count || schoolsRes.length || 0) : 0,
            users: usersData.length,
            courses: 0,
            students: usersData.filter((u: any) => u.rol === 'ALUMNO').length || 0,
            docente: usersData.filter((u: any) => u.rol === 'DOCENTE').length || 0,
            materias: 0,
            curso_nombre: '',
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userRole]);

if (userRole === 'ALUMNO') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {user?.first_name || user?.email}!
          </h2>
          <p className="text-gray-500">Estás en el Campus Virtual como Alumno</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/alumno/cursos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mi Curso</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                <>
                  <div className="text-lg font-bold">{stats.curso_nombre || 'Sin curso'}</div>
                  <p className="text-xs text-gray-500">{stats.materias || 0} materias</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/alumno/actividades')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actividades</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ver</div>
              <p className="text-xs text-gray-500">tareas y exámenes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/alumno/notas')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Notas</CardTitle>
              <GraduationCap className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ver</div>
              <p className="text-xs text-gray-500">calificaciones</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">Accesos Rápidos</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Puedes acceder a:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                  <li>Mis Cursos - Ver tus cursos y materias</li>
                  <li>Actividades - Ver tareas y exámenes</li>
                  <li>Mis Notas - Consultar calificaciones</li>
                  <li>Calendario - Ver fechas importantes</li>
                  <li>Horario - Tu schedule semanal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole === 'DOCENTE') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {user?.first_name || user?.email}!
          </h2>
          <p className="text-gray-500">Estás en el Campus Virtual como Docente</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/docente/cursos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.courses || 0}</p>
              <p className="text-xs text-gray-500">cursos asignados</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/docente/cursos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Materias</CardTitle>
              <GraduationCap className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.materias || 0}</p>
              <p className="text-xs text-gray-500">materias a tu cargo</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">Accesos Rápidos</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Puedes acceder a:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                  <li>Mis Cursos - Ver tus cursos y materias</li>
                  <li>Alumnos - Ver lista de alumnos</li>
                  <li>Notas - Cargar calificaciones</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = userRole === 'SUPERADMIN' 
    ? [
        { title: 'Escuelas', value: stats.schools },
        { title: 'Usuarios', value: stats.users },
      ]
    : userRole === 'DIRECTIVO'
    ? [
        { title: 'Usuarios', value: stats.users },
        { title: 'Alumnos', value: stats.students },
        { title: 'Docentes', value: stats.docente },
      ]
    : [
        { title: 'Mis Cursos', value: stats.courses },
        { title: 'Mis Materias', value: stats.materias || 0 },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.first_name || user?.email}</h2>
        <p className="text-gray-500">Este es tu panel de control - Rol: {userRole}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {userRole === 'SUPERADMIN' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Superadmin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/escuelas" className="block text-sm text-primary hover:underline">
                  → Gestionar Escuelas
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {userRole === 'DIRECTIVO' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/solicitudes" className="block text-sm text-primary hover:underline">
                  → Ver Solicitudes de Ingreso
                </Link>
                <Link href="/dashboard/usuarios" className="block text-sm text-primary hover:underline">
                  → Gestionar Usuarios
                </Link>
                <Link href="/dashboard/cursos" className="block text-sm text-primary hover:underline">
                  → Crear Cursos
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}