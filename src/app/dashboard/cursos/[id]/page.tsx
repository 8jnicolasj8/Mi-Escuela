'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { academicsApi, userSchoolApi } from '@/lib/api';
import { Curso, Materia, UserSchool } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, ArrowLeft, User, BookOpen, Users, Save, Clock } from 'lucide-react';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cursoId = params?.id as string;
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<UserSchool[]>([]);
  const [docentesDisponibles, setDocentesDisponibles] = useState<UserSchool[]>([]);
  const [showAddAlumno, setShowAddAlumno] = useState(false);
  const [showAddMateria, setShowAddMateria] = useState(false);
  const [newMateria, setNewMateria] = useState({
    nombre: '',
    nombre_corto: '',
    orden: 1,
  });

  useEffect(() => {
    if (cursoId) {
      fetchCourse();
      fetchAvailableAlumnos();
      fetchAvailableDocentes();
    }
  }, [cursoId]);

  const fetchCourse = async () => {
    try {
      const data = await academicsApi.cursos.get(cursoId);
      setCurso(data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAlumnos = async () => {
    try {
      const data = await userSchoolApi.getAlumnos();
      const alumnos = Array.isArray(data) ? data : data.results || [];
      setAlumnosDisponibles(alumnos);
    } catch (error) {
      console.error('Error fetching alumnos:', error);
    }
  };

  const fetchAvailableDocentes = async () => {
    try {
      const data = await userSchoolApi.getDocentes();
      const docentes = Array.isArray(data) ? data : data.results || [];
      setDocentesDisponibles(docentes);
    } catch (error) {
      console.error('Error fetching docentes:', error);
    }
  };

  const handleSave = async () => {
    if (!curso) return;
    setSaving(true);
    try {
      await academicsApi.cursos.update(curso.id, { activo: curso.activo });
      alert('Curso actualizado');
    } catch (error: any) {
      console.error('Error saving course:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAlumno = async (alumnoId: string) => {
    if (!curso) return;
    if (!confirm('¿Quitar este alumno del curso?')) return;
    try {
      await academicsApi.cursos.removeAlumno(curso.id, alumnoId);
      fetchCourse();
    } catch (error: any) {
      console.error('Error removing alumno:', error);
      alert('Error al quitar alumno');
    }
  };

  const handleAddAlumno = async (alumnoId: string) => {
    if (!curso) return;
    try {
      await academicsApi.cursos.addAlumno(curso.id, alumnosDisponibles.find(a => a.id === alumnoId)?.id || '');
      setShowAddAlumno(false);
      fetchCourse();
    } catch (error: any) {
      console.error('Error adding alumno:', error);
      alert('Error al agregar alumno');
    }
  };

  const handleCreateMateria = async () => {
    if (!curso || !newMateria.nombre) return;
    setSaving(true);
    try {
      await academicsApi.materias.create({
        nombre: newMateria.nombre,
        nombre_corto: newMateria.nombre_corto || newMateria.nombre.substring(0, 10),
        orden: newMateria.orden,
        curso: curso.id,
      });
      setShowAddMateria(false);
      setNewMateria({ nombre: '', nombre_corto: '', orden: 1 });
      fetchCourse();
      alert('Materia creada');
    } catch (error: any) {
      console.error('Error creating materia:', error);
      alert('Error al crear materia');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMateria = async (materiaId: string) => {
    console.log('Deleting materia with ID:', materiaId, typeof materiaId);
    if (!confirm('¿Eliminar esta materia?')) return;
    try {
      await academicsApi.materias.delete(materiaId);
      fetchCourse();
    } catch (error: any) {
      console.error('Error deleting materia:', error);
      alert('Error al eliminar materia');
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
        <Button variant="ghost" onClick={() => router.push('/dashboard/cursos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{curso.nombre_completo}</h2>
          <p className="text-gray-500">Gestión del curso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Materias del Curso
                </div>
                <Button size="sm" onClick={() => setShowAddMateria(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddMateria && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <Label>Nombre de la Materia</Label>
                    <Input 
                      value={newMateria.nombre}
                      onChange={(e) => setNewMateria({...newMateria, nombre: e.target.value})}
                      placeholder="Ej: Matemática"
                    />
                  </div>
                  <div>
                    <Label>Nombre Corto (opcional)</Label>
                    <Input 
                      value={newMateria.nombre_corto}
                      onChange={(e) => setNewMateria({...newMateria, nombre_corto: e.target.value})}
                      placeholder="Ej: Mate"
                    />
                  </div>
                  <div>
                    <Label>Orden</Label>
                    <Input 
                      type="number"
                      value={newMateria.orden}
                      onChange={(e) => setNewMateria({...newMateria, orden: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateMateria} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      Crear
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddMateria(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              
              {(curso as any).materias && (curso as any).materias.length > 0 ? (
                <div className="space-y-2">
                  {(curso as any).materias.map((materia: any) => (
                    <div key={materia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{materia.nombre}</p>
                        <p className="text-sm text-gray-500">Docente: {materia.docente_info?.nombre_completo || 'Sin asignar'}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMateria(materia.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay materias asignadas</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alumnos ({(curso as any).alumnos?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(curso as any).alumnos && (curso as any).alumnos.length > 0 ? (
                <div className="space-y-2">
                  {(curso as any).alumnos.map((alumno: any) => (
                    <div key={alumno.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{alumno.usuario_info?.nombre_completo || 'Alumno'}</p>
                          <p className="text-sm text-gray-500">DNI: {alumno.usuario_info?.usuario?.dni || 'Sin DNI'}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveAlumno(alumno.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay alumnos en este curso</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAddAlumno(!showAddAlumno)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Alumno
              </Button>

              {showAddAlumno && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label>Seleccionar Alumno</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {alumnosDisponibles.filter(
                      a => !(curso as any).alumnos?.some((ca: any) => ca.id === a.id)
                    ).map((alumno) => (
                      <div 
                        key={alumno.id}
                        className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-100"
                        onClick={() => handleAddAlumno(alumno.id)}
                      >
                        <span>{alumno.nombre_completo}</span>
                        <Plus className="h-4 w-4" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Información del Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Año</Label>
                <p className="text-lg font-medium">{curso.anio_numero}° Año</p>
              </div>
              <div>
                <Label>División</Label>
                <p className="text-lg font-medium">{curso.division}</p>
              </div>
              <div>
                <Label>Turno</Label>
                <p className="text-lg font-medium">
                  {curso.turno === 'MANIANA' ? 'Mañana' : 
                   curso.turno === 'TARDE' ? 'Tarde' : 
                   curso.turno === 'NOCHE' ? 'Noche' : 'Completo'}
                </p>
              </div>
              <div>
                <Label>Ciclo</Label>
                <p className="text-lg font-medium">
                  {curso.ciclo === 'PRIMARIO' ? 'Primario' : 
                   curso.ciclo === 'SECUNDARIO' ? 'Secundario' : 'Terciario'}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t">
                <input
                  type="checkbox"
                  id="activo"
                  checked={curso.activo}
                  onChange={(e) => setCurso({ ...curso, activo: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="activo">Curso activo</Label>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push(`/dashboard/cursos/${String(curso.id)}/horarios/`)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Ver Horarios
              </Button>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}