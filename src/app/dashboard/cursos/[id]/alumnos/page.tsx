'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi, userSchoolApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowLeft, User, Users, Search } from 'lucide-react';

interface Alumno {
  id: string;
  usuario_info: {
    id: string;
    nombre_completo: string;
    usuario: {
      dni: string;
    }
  };
  activo: boolean;
  fecha_inscripcion: string;
}

interface UserSchool {
  id: string;
  nombre_completo: string;
  rol: string;
  activo: boolean;
  usuario: {
    dni: string;
  };
}

export default function AlumnosPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = String(params?.id);
  
  const [curso, setCurso] = useState<any>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<UserSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddAlumno, setShowAddAlumno] = useState(false);
  const [dniSearch, setDniSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSchool[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const cursoRes: any = await academicsApi.cursos.get(cursoId);
      console.log('Curso response:', cursoRes);
      setCurso(cursoRes);
      
      if (!cursoRes) {
        setAlumnos([]);
        return;
      }
      
      let alumList: any[] = [];
      if (cursoRes.alumnos) {
        if (Array.isArray(cursoRes.alumnos)) {
          alumList = cursoRes.alumnos;
        } else if (cursoRes.alumnos.results) {
          alumList = cursoRes.alumnos.results;
        } else if (typeof cursoRes.alumnos === 'object') {
          alumList = [cursoRes.alumnos];
        }
      }
      
      console.log('Alumnos list:', alumList);
      setAlumnos(alumList);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  const searchAlumno = async () => {
    if (!dniSearch.trim()) return;
    setSearching(true);
    try {
      const data = await userSchoolApi.getAlumnos();
      const allAlumnos = Array.isArray(data) ? data : data.results || [];
      const results = allAlumnos.filter((a: any) => 
        a.usuario?.dni?.includes(dniSearch) ||
        a.nombre_completo?.toLowerCase().includes(dniSearch.toLowerCase())
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveAlumno = async (alumnoId: string) => {
    if (!confirm('¿Quitar este alumno del curso?')) return;
    setSaving(true);
    try {
      await academicsApi.cursos.removeAlumno(cursoId, alumnoId);
      fetchData();
      alert('Alumno removido');
    } catch (error: any) {
      console.error('Error removing:', error);
      alert('Error al remover');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAlumno = async (alumnoId: string) => {
    setSaving(true);
    try {
      await academicsApi.cursos.addAlumno(cursoId, alumnoId);
      setShowAddAlumno(false);
      setDniSearch('');
      setSearchResults([]);
      fetchData();
      alert('Alumno agregado');
    } catch (error: any) {
      console.error('Error adding:', error);
      alert('Error al agregar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeCurso = async (alumnoId: string, newCursoId: string) => {
    if (!confirm('¿Cambiar este alumno de curso?')) return;
    setSaving(true);
    try {
      await academicsApi.cursos.removeAlumno(cursoId, alumnoId);
      await academicsApi.cursos.addAlumno(newCursoId, alumnoId);
      fetchData();
      alert('Alumno cambiado de curso');
    } catch (error: any) {
      console.error('Error changing:', error);
      alert('Error al cambiar');
    } finally {
      setSaving(false);
    }
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
        <Button onClick={() => router.push('/dashboard/cursos')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/cursos/${cursoId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alumnos - {curso.nombre_completo}</h2>
          <p className="text-gray-500">Gestión de alumnos del curso</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alumnos ({alumnos.length})
            </div>
            <Button size="sm" onClick={() => setShowAddAlumno(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddAlumno && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium mb-3">Agregar Alumno</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Buscar por DNI o nombre..."
                  value={dniSearch}
                  onChange={(e) => setDniSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchAlumno()}
                />
                <Button onClick={searchAlumno} disabled={searching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-2 mt-3">
                  {searchResults
                    .filter(a => !alumnos.some(al => al.id === a.id))
                    .map(alumno => (
                      <div 
                        key={alumno.id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div>
                          <span className="font-medium">{alumno.nombre_completo}</span>
                          <span className="text-sm text-gray-500 ml-2">DNI: {alumno.usuario?.dni}</span>
                        </div>
                        <Button size="sm" onClick={() => handleAddAlumno(alumno.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
              
              <Button variant="outline" size="sm" onClick={() => { setShowAddAlumno(false); setDniSearch(''); setSearchResults([]); }}>
                Cancelar
              </Button>
            </div>
          )}

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
                      <p className="font-medium">{alumno.usuario_info?.nombre_completo}</p>
                      <p className="text-sm text-gray-500">DNI: {alumno.usuario_info?.usuario?.dni}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${alumno.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {alumno.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveAlumno(alumno.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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