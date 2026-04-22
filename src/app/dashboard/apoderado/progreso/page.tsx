'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Folder, ArrowLeft } from 'lucide-react';

interface Nota {
  id: number;
  materia: string;
  periodo: string;
  nota: number | null;
  observaciones: string;
}

interface Hijo {
  id: number;
  nombre: string;
}

export default function ApoderadoProgresoPage() {
  const searchParams = useSearchParams();
  const hijoId = searchParams.get('hijo');
  const [loading, setLoading] = useState(true);
  const [hijo, setHijo] = useState<Hijo | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, [hijoId]);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/notas-hijo/${hijoId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHijo(data.hijo);
        setNotas(Array.isArray(data.notas) ? data.notas : []);
      }
    } catch (error) {
      console.error('Error fetching progreso:', error);
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
        <a href="/dashboard/apoderado/hijos" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progreso de {hijo?.nombre}</h2>
          <p className="text-gray-500">Historial de calificaciones</p>
        </div>
      </div>

      {notas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500">No hay notas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notas.map(nota => (
            <Card key={nota.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {nota.materia}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-1">Período: {nota.periodo}</p>
                <p className="text-2xl font-bold text-primary">
                  {nota.nota !== null ? nota.nota : '-'}
                </p>
                {nota.observaciones && (
                  <p className="text-sm text-gray-500 mt-2">{nota.observaciones}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}