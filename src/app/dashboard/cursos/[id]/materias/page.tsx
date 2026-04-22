'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi, userSchoolApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowLeft, User } from 'lucide-react';

interface Materia {
  id: string;
  nombre: string;
  nombre_corto: string;
  curso: string;
  docente: any;
  docente_info: any;
  activa: boolean;
}

interface UserSchool {
  id: string;
  nombre_completo: string;
  rol: string;
}

export default function MateriasPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id as string;
  
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [docentes, setDocentes] = useState<UserSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_corto: '',
    docente: '',
  });

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const [materiasRes, docentesRes] = await Promise.all([
        academicsApi.materias.list({ curso: cursoId }),
        userSchoolApi.list({ rol: 'DOCENTE', activo: true })
      ]);
      setMaterias(Array.isArray(materiasRes) ? materiasRes : materiasRes.results || []);
      setDocentes(Array.isArray(docentesRes) ? docentesRes : docentesRes.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      alert('El nombre de la materia es requerido');
      return;
    }
    
    setSaving(true);
    try {
      await academicsApi.materias.create({
        nombre: formData.nombre,
        nombre_corto: formData.nombre_corto || formData.nombre.substring(0, 10),
        curso: cursoId,
        docente: formData.docente || null,
        activa: true,
      });
      setShowForm(false);
      setFormData({ nombre: '', nombre_corto: '', docente: '' });
      fetchData();
      alert('Materia creada correctamente');
    } catch (error: any) {
      console.error('Error creating materia:', error);
      alert('Error al crear materia');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMateria = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta materia?')) return;
    
    try {
      await academicsApi.materias.delete(id);
      fetchData();
      alert('Materia eliminada');
    } catch (error) {
      console.error('Error deleting materia:', error);
      alert('Error al eliminar materia');
    }
  };

  const handleUpdateDocente = async (materiaId: string, docenteId: string) => {
    try {
      await academicsApi.materias.update(materiaId, {
        docente: docenteId || null
      });
      fetchData();
    } catch (error) {
      console.error('Error updating docente:', error);
      alert('Error al actualizar docente');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Materias del Curso</h2>
            <p className="text-gray-500">Gestiona las materias y docentes</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Materia
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Materia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMateria} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de la Materia *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Matemática"
                    required
                  />
                </div>
                <div>
                  <Label>Nombre Corto (opcional)</Label>
                  <Input
                    value={formData.nombre_corto}
                    onChange={(e) => setFormData({ ...formData, nombre_corto: e.target.value })}
                    placeholder="Ej: Mate"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Materia'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Materias ({materias.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : materias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay materias creadas</p>
              <Button onClick={() => setShowForm(true)}>Crear primera materia</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {materias.map((materia) => (
                <div key={materia.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{materia.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        {materia.nombre_corto && `(${materia.nombre_corto}) `}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${materia.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {materia.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <Label className="text-sm">Docente asignado:</Label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={materia.docente || ''}
                      onChange={(e) => handleUpdateDocente(materia.id, e.target.value)}
                    >
                      <option value="">Seleccionar docente...</option>
                      {docentes.map((docente) => (
                        <option key={docente.id} value={docente.id}>
                          {docente.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteMateria(materia.id)}>
                      <Trash2 className="h-4 w-4 text-red-500 mr-1" />
                      Eliminar
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