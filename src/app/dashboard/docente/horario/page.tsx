'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

interface Horario {
  id: number;
  dia_semana: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  materia: string;
  curso: string;
}

const DIAS = [
  { id: 0, nombre: 'Lunes' },
  { id: 1, nombre: 'Martes' },
  { id: 2, nombre: 'Miércoles' },
  { id: 3, nombre: 'Jueves' },
  { id: 4, nombre: 'Viernes' },
];

export default function HorarioDocentePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await academicsApi.misHorarios();
      const list = Array.isArray(data) ? data : data.results || [];
      setHorarios(list);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const groupedHorarios = DIAS.map(dia => ({
    ...dia,
    bloques: horarios.filter((h: any) => h.dia_semana === dia.id)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mi Horario</h2>
        <p className="text-gray-500">Tus bloques de clase</p>
      </div>

      {horarios.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No tenés horarios asignados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedHorarios.map(dia => (
                <div key={dia.id}>
                  <h3 className="font-medium text-gray-700 mb-2">{dia.nombre}</h3>
                  {dia.bloques.length === 0 ? (
                    <p className="text-sm text-gray-400 ml-2">Sin clases</p>
                  ) : (
                    <div className="space-y-2 ml-2">
                      {dia.bloques.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-blue-700">
                              {h.bloque?.hora_inicio || h.bloque_horario}
                            </span>
                            <span className="text-gray-500">-</span>
                            <span className="text-blue-700">
                              {h.bloque?.hora_fin}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{h.materia?.nombre || h.materia}</p>
                            <p className="text-sm text-gray-500">{h.curso?.nombre || h.curso}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}