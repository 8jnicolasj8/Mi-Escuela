'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, FileText, Calendar, ClipboardCheck } from 'lucide-react';

interface Curso {
  id: number;
  nombre_completo: string;
  anio_numero: number;
  division: string;
  turno: string;
  ciclo: string;
}

interface Materia {
  id: number;
  nombre: string;
  nombre_corto: string;
}

export default function CursoDocenteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = String(params?.id);
  
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState<any>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const cursoRes = await academicsApi.cursos.get(cursoId);
      setCurso(cursoRes);
      setMaterias(cursoRes.materias || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTurnoLabel = (turno: string) => {
    const labels: Record<string, string> = {
      'MANIANA': 'Mañana',
      'TARDE': 'Tarde',
      'NOCHE': 'Noche',
      'COMPLETO': 'Mañana y Tarde',
    };
    return labels[turno] || turno;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="p-6">
        <p>Curso no encontrado</p>
        <Button onClick={() => router.push('/dashboard/docente/cursos')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/docente/cursos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{curso.nombre_completo}</h2>
          <p className="text-gray-500">{getTurnoLabel(curso.turno)} - {materias.length} materias</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}/alumnos`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Ver lista de alumnos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}/notas`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notas</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Cargar notas de examenes</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}/boletin`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Boletín</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Cargar notas de período</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}/horarios`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Horarios</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Ver mi horario</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Materias que dictás
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materias.length === 0 ? (
            <p className="text-gray-500">No hay materias asignadas</p>
          ) : (
            <div className="space-y-2">
              {materias.map((materia: any) => (
                <div key={materia.id} className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{materia.nombre}</span>
                  {materia.nombre_corto && (
                    <span className="ml-2 text-sm text-gray-500">({materia.nombre_corto})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}