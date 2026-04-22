'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Plus, Save } from 'lucide-react';

interface Examen {
  id: number;
  titulo: string;
  materia: number;
  fecha: string;
  activo: boolean;
}

export default function NotasExamenPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = String(params?.id);
  
  const [loading, setLoading] = useState(true);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [curso, setCurso] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [newExamen, setNewExamen] = useState({ titulo: '', materia_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const [cursoRes] = await Promise.all([
        academicsApi.cursos.get(cursoId),
      ]);
      setCurso(cursoRes);
      setExamenes([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExamen = async () => {
    if (!newExamen.titulo || !newExamen.materia_id) return;
    setSaving(true);
    try {
      alert('Examen creado: ' + newExamen.titulo);
      setShowForm(false);
      setNewExamen({ titulo: '', materia_id: '' });
    } catch (error) {
      console.error('Error creating:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notas de Examen</h2>
          <p className="text-gray-500">{curso?.nombre_completo}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exámenes
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Examen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="text-sm font-medium">Título del Examen</label>
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Ej: Primer Parcial, Recuperatorio, etc."
                  value={newExamen.titulo}
                  onChange={(e) => setNewExamen({...newExamen, titulo: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateExamen} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  Crear
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Sistema de notas de examen</p>
            <p className="text-sm text-gray-400 mt-1">Creá un examen para comenzar a corregir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}