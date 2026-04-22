'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Folder } from 'lucide-react';

interface Nota {
  id: number;
  materia: string;
  periodo: string;
  nota: number | null;
  observaciones: string;
}

export default function AlumnoNotasPage() {
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<Nota[]>([]);
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/mis-notas/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching notas:', error);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Notas</h2>
        <p className="text-gray-500">Tu historial de calificaciones</p>
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