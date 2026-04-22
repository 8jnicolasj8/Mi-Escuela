'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Folder, Upload, CheckCircle, Clock } from 'lucide-react';

interface Actividad {
  id: number;
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha_entrega: string;
  classroom_id: number;
  entrega?: {
    id: number;
    estado: string;
    nota: number | null;
  };
}

const TIPO_LABELS: Record<string, string> = {
  'EXAMEN': 'Examen',
  'TRABAJO': 'Trabajo Práctico',
  'TAREA': 'Tarea'
};

const TIPO_COLORS: Record<string, string> = {
  'EXAMEN': 'bg-red-100 text-red-700',
  'TRABAJO': 'bg-blue-100 text-blue-700',
  'TAREA': 'bg-green-100 text-green-700'
};

export default function AlumnoActividadesPage() {
  const searchParams = useSearchParams();
  const materiaId = searchParams.get('materia');
  const [loading, setLoading] = useState(true);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [entregaTexto, setEntregaTexto] = useState('');
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, [materiaId]);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const url = materiaId 
        ? `${API_URL}/api/v1/actividades-alumno/?materia=${materiaId}`
        : `${API_URL}/api/v1/actividades-alumno/`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActividades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching actividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async () => {
    if (!selectedActividad || !entregaTexto.trim()) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/entregas-alumno/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actividad_id: selectedActividad.id,
          texto: entregaTexto
        })
      });
      if (res.ok) {
        alert('Entrega enviada correctamente');
        setShowForm(false);
        setEntregaTexto('');
        fetchData();
      } else {
        const err = await res.json();
        alert('Error: ' + JSON.stringify(err));
      }
    } catch (error) {
      console.error('Error delivering:', error);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Actividades</h2>
        <p className="text-gray-500">Tus tareas y examsnes</p>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Entregar: {selectedActividad?.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full p-2 border rounded h-32"
              placeholder="Escribe tu respuesta o entrega..."
              value={entregaTexto}
              onChange={(e) => setEntregaTexto(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleEntregar}>Enviar Entrega</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {actividades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500">No hay actividades disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actividades.map(act => (
            <Card key={act.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {act.titulo}
                  </CardTitle>
                  <span className={`px-2 py-1 text-xs rounded ${TIPO_COLORS[act.tipo] || 'bg-gray-100'}`}>
                    {TIPO_LABELS[act.tipo] || act.tipo}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">{act.descripcion}</p>
                {act.fecha_entrega && (
                  <p className="text-sm text-gray-500 mb-4">
                    Fecha de entrega: {new Date(act.fecha_entrega).toLocaleString('es-AR')}
                  </p>
                )}
                {act.entrega ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Entregado</span>
                    {act.entrega.nota && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        Nota: {act.entrega.nota}
                      </span>
                    )}
                  </div>
                ) : (
                  <Button size="sm" onClick={() => {
                    setSelectedActividad(act);
                    setShowForm(true);
                  }}>
                    <Upload className="h-4 w-4 mr-1" />
                    Entregar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}