'use client';

import { useEffect, useState } from 'react';
import { academicsApi } from '@/lib/api';
import { BloqueHorario } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BloquesPage() {
  const router = useRouter();
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState({
    hora_inicio: '07:00',
    hora_fin: '08:00',
    orden: 1,
  });

  useEffect(() => {
    fetchBloques();
  }, []);

  const fetchBloques = async () => {
    try {
      const data = await academicsApi.bloquesHorario.list();
      setBloques(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching bloques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.hora_inicio || !form.hora_fin) return;
    setSaving(true);
    try {
      if (editingId) {
        await academicsApi.bloquesHorario.update(String(editingId), {
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin,
          orden: form.orden,
        });
      } else {
        await academicsApi.bloquesHorario.create(form);
      }
      resetForm();
      fetchBloques();
      alert(editingId ? 'Bloque actualizado' : 'Bloque creado');
    } catch (error: any) {
      console.error('Error saving bloque:', error);
      alert('Error al guardar: ' + (error.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('¿Eliminar este bloque de horario?')) return;
    try {
      await academicsApi.bloquesHorario.delete(String(id));
      fetchBloques();
    } catch (error: any) {
      console.error('Error deleting bloque:', error);
      alert('Error al eliminar');
    }
  };

  const handleEdit = (bloque: BloqueHorario) => {
    setForm({
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      orden: bloque.orden,
    });
    setEditingId(bloque.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ hora_inicio: '07:00', hora_fin: '08:00', orden: bloques.length + 1 });
    setEditingId(null);
    setShowForm(false);
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
        <Button variant="ghost" onClick={() => router.push('/dashboard/portal')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bloques de Horario</h2>
          <p className="text-gray-500">Configuración de horarios de la escuela</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bloques de Horario
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium mb-4">
                {editingId ? 'Editar Bloque' : 'Nuevo Bloque'}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Hora de inicio</Label>
                  <Input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hora de fin</Label>
                  <Input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSubmit} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {bloques.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay bloques de horario configurados</p>
              <p className="text-sm text-gray-400 mt-1">
                Agregá los bloqueshorario para tu escuela
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bloques
                .sort((a, b) => a.orden - b.orden)
                .map((bloque) => (
                  <div
                    key={bloque.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-lg w-20">
                        {bloque.hora_inicio}-{bloque.hora_fin}
                      </span>
                      <span className="text-sm text-gray-500">
                        Orden: {bloque.orden}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bloque)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bloque.id)}
                      >
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