'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, FileText, Folder, Pencil, X } from 'lucide-react';

interface Entrega {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  nota: number | null;
  comentario: string;
  created_at: string;
}

export default function ClassroomActividadesPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = String(params?.id);
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';
  
  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState<any>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newActividad, setNewActividad] = useState({ titulo: '', tipo: 'TAREA', descripcion: '', fecha_entrega: '' });
  
  const [selectedActividad, setSelectedActividad] = useState<any>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [showCorreccion, setShowCorreccion] = useState(false);
  const [corriendoId, setCorriendoId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [classroomId]);

  const fetchData = async () => {
    try {
      const cr = await academicsApi.classrooms.get(classroomId);
      setClassroom(cr);
      
      const acts = await fetch(`${API_URL}/api/v1/actividades/?classroom=${classroomId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (acts.ok) {
        const actData = await acts.json();
        setActividades(Array.isArray(actData) ? actData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActividad = async () => {
    if (!newActividad.titulo) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/actividades/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          classroom: classroomId,
          titulo: newActividad.titulo,
          tipo: newActividad.tipo,
          descripcion: newActividad.descripcion,
          fecha_entrega: newActividad.fecha_entrega || null
        })
      });
      if (res.ok) {
        fetchData();
        setShowForm(false);
        setNewActividad({ titulo: '', tipo: 'TAREA', descripcion: '', fecha_entrega: '' });
        alert('Actividad creada');
      } else {
        const err = await res.json();
        alert('Error: ' + JSON.stringify(err));
      }
    } catch (error) {
      console.error('Error creating:', error);
      alert('Error al crear actividad');
    }
  };

  const handleCorregir = async (actividad: any) => {
    setSelectedActividad(actividad);
    setCorriendoId(actividad.id);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/entregas/${actividad.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEntregas(Array.isArray(data) ? data : []);
        setShowCorreccion(true);
      } else {
        const err = await res.json();
        alert('Error: ' + JSON.stringify(err));
      }
    } catch (error) {
      console.error('Error fetching entregas:', error);
    } finally {
      setCorriendoId(null);
    }
  };

  const handleSaveNota = async (entrega: Entrega) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/entregas/${selectedActividad.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entrega_id: entrega.id,
          nota: entrega.nota,
          comentario: entrega.comentario
        })
      });
      if (res.ok) {
        alert('Nota guardada');
        fetchData();
      }
    } catch (error) {
      console.error('Error saving nota:', error);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'EXAMEN': 'Examen',
      'TRABAJO': 'Trabajo Práctico',
      'TAREA': 'Tarea'
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'EXAMEN': 'bg-red-100 text-red-700',
      'TRABAJO': 'bg-blue-100 text-blue-700',
      'TAREA': 'bg-green-100 text-green-700'
    };
    return colors[tipo] || 'bg-gray-100';
  };

  const getEntregadoClass = (entregado: boolean) => {
    return entregado ? 'text-xs px-2 py-1 rounded bg-green-100 text-green-700' : 'text-xs px-2 py-1 rounded bg-red-100 text-red-700';
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
        <Button variant="ghost" onClick={() => router.push('/dashboard/docente/classrooms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{classroom?.materia_nombre}</h2>
          <p className="text-gray-500">{classroom?.curso_nombre}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva Actividad
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="w-full p-2 border rounded"
              value={newActividad.tipo}
              onChange={(e) => setNewActividad({...newActividad, tipo: e.target.value})}
            >
              <option value="EXAMEN">Examen</option>
              <option value="TRABAJO">Trabajo Práctico</option>
              <option value="TAREA">Tarea</option>
            </select>
            <input
              className="w-full p-2 border rounded"
              placeholder="Título de la actividad..."
              value={newActividad.titulo}
              onChange={(e) => setNewActividad({...newActividad, titulo: e.target.value})}
            />
            <textarea
              className="w-full p-2 border rounded"
              placeholder="Descripción (opcional)..."
              value={newActividad.descripcion}
              onChange={(e) => setNewActividad({...newActividad, descripcion: e.target.value})}
            />
            <input
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={newActividad.fecha_entrega}
              onChange={(e) => setNewActividad({...newActividad, fecha_entrega: e.target.value})}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateActividad}>Crear</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actividades.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay actividades creadas</p>
              <p className="text-sm text-gray-400 mt-1">Creá una actividad para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actividades.map(act => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className={'px-2 py-1 text-xs rounded ' + getTipoColor(act.tipo)}>
                      {getTipoLabel(act.tipo)}
                    </span>
                    <p className="font-medium mt-1">{act.titulo}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCorregir(act)} disabled={corriendoId === act.id}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Corregir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCorreccion && selectedActividad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Corregir: {selectedActividad.titulo}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCorreccion(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {entregas.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No hay entregas realizadas</p>
              ) : (
                <div className="space-y-4">
                  {entregas.map(ent => (
                    <div key={ent.id} className="p-3 border rounded">
                      <div className="mb-2">
                        <span className="font-medium">{ent.alumno_nombre}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-500">Nota (0-10)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className="w-full p-2 border rounded"
                            value={ent.nota ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || null;
                              setEntregas(entregas.map(en => en.id === ent.id ? {...en, nota: val} : en));
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button size="sm" onClick={() => handleSaveNota({...ent, nota: ent.nota ?? 0})}>
                            Guardar
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="text-sm text-gray-500">Comentario</label>
                        <textarea
                          className="w-full p-2 border rounded"
                          value={ent.comentario || ''}
                          onChange={(e) => {
                            setEntregas(entregas.map(en => en.id === ent.id ? {...en, comentario: e.target.value} : en));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}