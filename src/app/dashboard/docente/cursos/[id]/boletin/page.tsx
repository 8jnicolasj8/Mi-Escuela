'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardCheck, Save } from 'lucide-react';

interface Periodo {
  id: number;
  nombre: string;
  activo: boolean;
}

export default function BoletinPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = String(params?.id);
  
  const [loading, setLoading] = useState(true);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [curso, setCurso] = useState<any>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const [cursoRes, periodosRes] = await Promise.all([
        academicsApi.cursos.get(cursoId),
        academicsApi.periodos.list(),
      ]);
      setCurso(cursoRes);
      const periodoList = Array.isArray(periodosRes) ? periodosRes : periodosRes.results || [];
      setPeriodos(periodoList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activePeriodos = periodos.filter((p: any) => p.activo);

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
          <h2 className="text-2xl font-bold text-gray-900">Notas de Boletín</h2>
          <p className="text-gray-500">{curso?.nombre_completo}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Seleccionar Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePeriodos.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay períodos activos</p>
              <p className="text-sm text-gray-400 mt-1">Contactá al director para abrir un período</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Seleccioná el período para cargar las notas del boletín:
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {activePeriodos.map((periodo: any) => (
                  <Card 
                    key={periodo.id} 
                    className={`cursor-pointer transition-all ${
                      selectedPeriodo === periodo.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPeriodo(periodo.id)}
                  >
                    <CardContent className="py-4">
                      <p className="font-medium text-center">{periodo.nombre}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedPeriodo && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium mb-2">
                    Período seleccionado: {periodos.find((p: any) => p.id === selectedPeriodo)?.nombre}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Aquí vas a poder cargar las notas de chaque materia del curso
                  </p>
                  <Button disabled>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar Notas
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}