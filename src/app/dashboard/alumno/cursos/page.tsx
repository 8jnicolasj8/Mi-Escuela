'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Folder, Users, X } from 'lucide-react';
import { getAccessToken } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Curso {
  id: number;
  materia_nombre: string;
  materia_id: number;
  curso_nombre: string;
  curso_id: number;
  docente_nombre: string;
}

interface Alumno {
  id: string;
  nombre: string;
  email: string;
  foto_perfil_url?: string;
}

export default function AlumnoCursosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [cursoId, setCursoId] = useState<number | null>(null);
  const [cursoNombre, setCursoNombre] = useState<string>('');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/api/v1/mis-cursos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCursos(Array.isArray(data) ? data : []);
        
        if (data.length > 0) {
          setCursoId(data[0].curso_id);
          setCursoNombre(data[0].curso_nombre);
        }
      }
    } catch (error) {
      console.error('Error fetching cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerAlumnos = async () => {
    if (!cursoId) return;
    
    setPanelOpen(true);
    setLoadingAlumnos(true);
    
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/api/v1/cursos/${cursoId}/alumnos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAlumnos(Array.isArray(data) ? data : []);
      } else {
        setAlumnos([]);
      }
    } catch (error) {
      console.error('Error fetching alumnos:', error);
      setAlumnos([]);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const handleVerActividades = (materiaId: number) => {
    router.push(`/dashboard/alumno/actividades?materia=${materiaId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex-1 space-y-6 pb-24 lg:pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mis Cursos</h2>
            <p className="text-gray-500">Materias en las que estás inscripto</p>
          </div>
          {cursoId && (
            <Button onClick={handleVerAlumnos} className="flex items-center gap-2 w-full sm:w-auto">
              <Users className="h-4 w-4" />
              Ver Alumnos
            </Button>
          )}
        </div>

        {cursos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No tienes cursos asignados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map(curso => (
              <Card key={curso.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {curso.materia_nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-2">{curso.curso_nombre}</p>
                  <p className="text-sm text-gray-500 mb-4">Docente: {curso.docente_nombre}</p>
                  <Button size="sm" onClick={() => handleVerActividades(curso.materia_id)} className="w-full">
                    Ver Actividades
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Side Panel / Bottom Sheet */}
      <div 
        className={cn(
          'fixed inset-0 z-50 transition-all duration-300 lg:relative',
          panelOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full',
          'lg:translate-x-0'
        )}
        style={{ 
          marginTop: panelOpen ? '0' : undefined,
        }}
      >
        {/* Overlay for mobile */}
        <div 
          className={cn(
            'fixed inset-0 bg-black/50 lg:hidden',
            panelOpen ? 'block' : 'hidden'
          )}
          onClick={() => setPanelOpen(false)}
        />
        
        {/* Panel content */}
        <div 
          className={cn(
            'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl lg:relative lg:rounded-none lg:shadow-none',
            'max-h-[70vh] lg:max-h-screen lg:h-auto lg:w-80',
            'flex flex-col'
          )}
          style={{ 
            width: panelOpen ? '100%' : '0%',
            minWidth: panelOpen ? '100%' : '0px',
            maxWidth: '100vw',
          }}
        >
          {/* Drag handle for mobile */}
          <div className="lg:hidden flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-semibold text-lg">
                Alumnos del Curso
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setPanelOpen(false)} className="lg:hidden">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 flex-shrink-0">{cursoNombre}</p>

            {loadingAlumnos ? (
              <div className="flex items-center justify-center py-8 flex-1">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : alumnos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">No hay alumnos en este curso</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                {alumnos.map(alumno => (
                  <div key={alumno.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    {alumno.foto_perfil_url ? (
                      <img 
                        src={alumno.foto_perfil_url} 
                        alt={alumno.nombre}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium flex-shrink-0">
                        {alumno.nombre?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{alumno.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{alumno.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}