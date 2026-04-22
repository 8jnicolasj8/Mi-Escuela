'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

interface Horario {
  id: number;
  curso: { id: number; nombre: string };
  dia_semana: number;
  dia_nombre: string;
  bloque: { id: number; hora_inicio: string; hora_fin: string };
  materia: { id: number; nombre: string; nombre_corto: string };
}

const DIAS = [
  { id: 0, nombre: 'Lunes' },
  { id: 1, nombre: 'Martes' },
  { id: 2, nombre: 'Miércoles' },
  { id: 3, nombre: 'Jueves' },
  { id: 4, nombre: 'Viernes' },
];

export default function HorariosDocentePage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = String(params?.id);
  
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [curso, setCurso] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const [cursoRes, horariosRes] = await Promise.all([
        academicsApi.cursos.get(cursoId),
        academicsApi.misHorarios(),
      ]);
      setCurso(cursoRes);
      
      // Filter horarios for this curso only
      const misHorarios = Array.isArray(horariosRes) 
        ? horariosRes.filter((h: any) => h.curso?.id === parseInt(cursoId))
        : [];
      setHorarios(misHorarios);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/docente/cursos/${cursoId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Horario</h2>
          <p className="text-gray-500">{curso?.nombre_completo}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mi Schedule Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {horarios.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No tenés horarios asignados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-left w-24">Hora</th>
                    {DIAS.map(dia => (
                      <th key={dia.id} className="border p-2 bg-gray-50 text-center">{dia.nombre}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIAS.map(dia => {
                    const horariosDia = horarios.filter(h => h.dia_semana === dia.id);
                    return (
                      <tr key={dia.id}>
                        <td className="border p-2 font-medium">{dia.nombre}</td>
                        {DIAS.map(dia2 => {
                          const h = horarios.find(x => x.dia_semana === dia2.id);
                          return (
                            <td key={dia2.id} className="border p-2 text-center">
                              {h ? (
                                <div className="bg-blue-100 text-blue-700 p-2 rounded">
                                  <p className="font-medium text-sm">{h.materia.nombre_corto || h.materia.nombre}</p>
                                  <p className="text-xs">{h.bloque.hora_inicio}-{h.bloque.hora_fin}</p>
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}