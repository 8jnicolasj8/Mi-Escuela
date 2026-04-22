'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Users, Search, Save } from 'lucide-react';

interface Alumno {
  id: number;
  usuario_escuela: string;
  nombre_completo: string;
  dni: string;
  activo: boolean;
}

export default function AlumnosDocentePage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = String(params?.id);
  
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [curso, setCurso] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const [cursoRes, alumnosRes] = await Promise.all([
        academicsApi.cursos.get(cursoId),
        academicsApi.misAlumnos(cursoId),
      ]);
      setCurso(cursoRes);
      let alumList = Array.isArray(alumnosRes) ? alumnosRes : [];
      setAlumnos(alumList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alumnos - {curso?.nombre_completo}</h2>
          <p className="text-gray-500">{alumnos.length} alumnos inscriptos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Alumnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alumnos.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay alumnos en este curso</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alumnos.map((alumno) => (
                <div key={alumno.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{alumno.nombre_completo}</p>
                      <p className="text-sm text-gray-500">DNI: {alumno.dni}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${alumno.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {alumno.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}