'use client';

import { useEffect, useState } from 'react';
import { academicsApi, schoolsApi, userSchoolApi } from '@/lib/api';
import { Curso, Anio, School } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, ExternalLink, BookOpen, Calendar, Users } from 'lucide-react';

const TURNOS = [
  { value: 'MANIANA', label: 'Mañana' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'NOCHE', label: 'Noche' },
  { value: 'COMPLETO', label: 'Mañana y Tarde' },
];

const CICLOS = [
  { value: 'PRIMARIO', label: 'Primario' },
  { value: 'SECUNDARIO', label: 'Secundario' },
  { value: 'TERCIARIO', label: 'Terciario' },
];

interface Division {
  division: string;
  turno: string;
}

export default function CoursesPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedAnio, setSelectedAnio] = useState<string>('');
  const [selectedCiclo, setSelectedCiclo] = useState('SECUNDARIO');
  const [divisiones, setDivisiones] = useState<Division[]>([
    { division: 'A', turno: 'MANIANA' }
  ]);
  const [editingCourse, setEditingCourse] = useState<Curso | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cursosRes, aniosRes] = await Promise.all([
        academicsApi.cursos.list(),
        academicsApi.anios.list(),
      ]);
      setCursos(Array.isArray(cursosRes) ? cursosRes : cursosRes.results || []);
      setAnios(Array.isArray(aniosRes) ? aniosRes : aniosRes.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

const handleCreateAnio = async (numero: number) => {
    setSaving(true);
    try {
      // Get the school from the current user's UserSchool
      const userSchoolsRes = await userSchoolApi.list({ activo: true });
      const userSchoolList = Array.isArray(userSchoolsRes) ? userSchoolsRes : userSchoolsRes.results || [];
      
      if (userSchoolList.length > 0) {
        const currentUserSchool = userSchoolList[0];
        await academicsApi.anios.create({ numero, escuela: currentUserSchool.escuela });
        alert(`Año ${numero}° creado`);
      } else {
        alert('No estás asociado a ninguna escuela');
      }
    } catch (error: any) {
      console.error('Error creating year:', error);
      alert(error.response?.data?.error || 'Error al crear año');
    } finally {
      await fetchData();
      // Select the newly created year
      const newAnio = anios.find(a => a.numero === numero);
      if (newAnio) setSelectedAnio(newAnio.id);
      setSaving(false);
    }
  };
  
  const handleSelectAnio = (anioId: string) => {
    setSelectedAnio(anioId);
  };

const handleCreateCourses = async () => {
    if (!selectedAnio || divisiones.length === 0) {
      alert('Completá todos los campos');
      return;
    }
    
    setSaving(true);
    try {
      const result = await academicsApi.cursos.crearMultiple({
        anio: selectedAnio,
        ciclo: selectedCiclo,
        divisiones: divisiones
      });
      let msg = result.message || 'Cursos creados';
      if (result.existentes > 0) {
        msg += ` (${result.existentes} ya existían)`;
      }
      alert(msg);
      setShowForm(false);
      setStep(1);
      setSelectedAnio('');
      setDivisiones([{ division: 'A', turno: 'MANIANA' }]);
      fetchData();
    } catch (error: any) {
      console.error('Error creating courses:', error);
      alert(error.response?.data?.error || 'Error al crear cursos');
    } finally {
      setSaving(false);
    }
  };

  const addDivision = () => {
    const lastDivision = divisiones.length > 0 
      ? divisiones[divisiones.length - 1].division.charCodeAt(0) 
      : 65;
    const nextLetter = String.fromCharCode(lastDivision + 1);
    setDivisiones([...divisiones, { division: nextLetter, turno: 'MANIANA' }]);
  };

  const removeDivision = (index: number) => {
    if (divisiones.length > 1) {
      setDivisiones(divisiones.filter((_, i) => i !== index));
    }
  };

  const updateDivision = (index: number, field: keyof Division, value: string) => {
    const updated = [...divisiones];
    updated[index] = { ...updated[index], [field]: value };
    setDivisiones(updated);
  };
  
  const handleDeleteCourse = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso?')) return;
    
    try {
      await academicsApi.cursos.delete(id);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      alert('Error al eliminar el curso');
    }
  };
  
  const handleEditCourse = (curso: Curso) => {
    // Navigate to edit page
    window.location.href = `/dashboard/cursos/${curso.id}`;
  };
  
  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    
    setSaving(true);
    try {
      await academicsApi.cursos.update(editingCourse.id, {
        activo: editingCourse.activo,
      });
      setEditingCourse(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating course:', error);
      alert('Error al actualizar el curso');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddAlumno = async (dni: string) => {
    if (!editingCourse || !dni) return;
    
    try {
      // First find the user by DNI
      const users = await userSchoolApi.list({ rol: 'ALUMNO', activo: true });
      const userList = Array.isArray(users) ? users : users.results || [];
      const userSchool = userList.find((u: any) => u.usuario?.dni === dni);
      
      if (!userSchool) {
        alert('No se encontró ningún alumno con ese DNI');
        return;
      }
      
      await academicsApi.cursos.addAlumno(editingCourse.id, userSchool.id);
      fetchData();
    } catch (error: any) {
      console.error('Error adding student:', error);
      alert('Error al agregar alumno');
    }
  };
  
  const handleRemoveAlumno = async (alumnoId: string) => {
    if (!editingCourse) return;
    try {
      await academicsApi.cursos.removeAlumno(editingCourse.id, alumnoId);
      fetchData();
    } catch (error: any) {
      console.error('Error removing student:', error);
      alert('Error al quitar alumno');
    }
  };

  const getCicloLabel = (ciclo: string) => {
    return CICLOS.find(c => c.value === ciclo)?.label || ciclo;
  };

  const getTurnoLabel = (turno: string) => {
    return TURNOS.find(t => t.value === turno)?.label || turno;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cursos</h2>
          <p className="text-gray-500">Gestiona los cursos de la escuela</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

{showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Paso 1: Seleccionar Año'}
              {step === 2 && 'Paso 2: Elegir Ciclo y Divisiones'}
              {step === 3 && 'Paso 3: Confirmar'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Seleccionar Año existente o crear nuevo:</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                      const exists = anios.some(a => a.numero === num);
                      return (
                        <Button
                          key={num}
                          variant={selectedAnio && anios.find(a => a.numero === num)?.id === selectedAnio ? 'default' : 'outline'}
                          size="sm"
                          disabled={saving}
                          onClick={() => {
                            if (!exists) {
                              handleCreateAnio(num);
                            } else {
                              const anio = anios.find(a => a.numero === num);
                              if (anio) handleSelectAnio(anio.id);
                            }
                          }}
                        >
                          {num}° {exists ? '(existente)' : saving ? '(creando...)' : '(crear)'}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {anios.length > 0 && (
                  <div>
                    <Label>Seleccionar el año:</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      value={selectedAnio}
                      onChange={(e) => setSelectedAnio(e.target.value)}
                    >
                      <option value="">Seleccionar año...</option>
                      {anios.map((anio) => (
                        <option key={anio.id} value={anio.id}>{anio.numero}° Año</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)} 
                    disabled={!selectedAnio || saving}
                  >
                    {saving ? 'Cargando...' : 'Siguiente'}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Ciclo</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    value={selectedCiclo}
                    onChange={(e) => setSelectedCiclo(e.target.value)}
                  >
                    {CICLOS.map((ciclo) => (
                      <option key={ciclo.value} value={ciclo.value}>{ciclo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Divisiones y Turnos:</Label>
                  <div className="space-y-2 mt-2">
                    {divisiones.map((div, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="División (A, B...)"
                          value={div.division}
                          onChange={(e) => updateDivision(index, 'division', e.target.value)}
                          className="w-24"
                        />
                        <select
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={div.turno}
                          onChange={(e) => updateDivision(index, 'turno', e.target.value)}
                        >
                          {TURNOS.map((turno) => (
                            <option key={turno.value} value={turno.value}>{turno.label}</option>
                          ))}
                        </select>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeDivision(index)}
                          disabled={divisiones.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={addDivision}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar División
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>Atrás</Button>
                  <Button onClick={() => setStep(3)} disabled={saving}>Siguiente</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold">Resumen:</h4>
                  <p className="text-sm">Año: {anios.find(a => a.id === selectedAnio)?.numero}°</p>
                  <p className="text-sm">Ciclo: {getCicloLabel(selectedCiclo)}</p>
                  <p className="text-sm">Divisiones: {divisiones.map(d => `${d.division} (${getTurnoLabel(d.turno)})`).join(', ')}</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
                  <Button onClick={handleCreateCourses}>Crear Cursos</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay cursos registrados</p>
              <Button onClick={() => setShowForm(true)}>Crear primer curso</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cursos.map((curso) => (
                <div
                  key={curso.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{curso.nombre_completo}</h3>
                    <p className="text-sm text-gray-500">
                      {getCicloLabel(curso.ciclo)} - {getTurnoLabel(curso.turno)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/cursos/${curso.id}/materias`}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Materias
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/cursos/${curso.id}/horarios`}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Horarios
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/cursos/${curso.id}/alumnos`}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Alumnos
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteCourse(curso.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <span className={`px-2 py-1 text-xs rounded ${curso.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {curso.activo ? 'Activo' : 'Inactivo'}
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