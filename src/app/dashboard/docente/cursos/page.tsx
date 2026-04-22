'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Users, ArrowRight } from 'lucide-react';

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
  docente_info: any;
}

export default function MisCursosDocentePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cursosData = await academicsApi.misCursos();
      setCursos(Array.isArray(cursosData) ? cursosData : cursosData.results || []);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Cursos</h2>
        <p className="text-gray-500">Cursos donde dictas clases</p>
      </div>

      {cursos.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No tenés cursos asignados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cursos.map((curso: any) => (
            <Card key={curso.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{curso.nombre_completo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getTurnoLabel(curso.turno)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{curso.materias?.length || 0} materias</span>
                  </div>
                </div>
                
                {curso.materias && curso.materias.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Materias:</p>
                    <div className="flex flex-wrap gap-1">
                      {curso.materias.map((m: any) => (
                        <span key={m.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {m.nombre_corto || m.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/dashboard/docente/cursos/${curso.id}`)}
                  >
                    Ver Curso
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}