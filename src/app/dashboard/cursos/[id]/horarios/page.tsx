'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { academicsApi } from '@/lib/api';
import { BloqueHorario, Horario, Materia } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, BookOpen, User, X } from 'lucide-react';

const DIAS = [
  { id: 0, nombre: 'Lunes', abrev: 'Lun' },
  { id: 1, nombre: 'Martes', abrev: 'Mar' },
  { id: 2, nombre: 'Miércoles', abrev: 'Mié' },
  { id: 3, nombre: 'Jueves', abrev: 'Jue' },
  { id: 4, nombre: 'Viernes', abrev: 'Vie' },
];

interface Curso {
  id: string | number;
  nombre_completo: string;
  anio_numero: number;
  division: string;
  materias?: Materia[];
}

interface HorarioConInfo extends Horario {
  materia_nombre?: string;
  docente_nombre?: string;
}

export default function HorariosPage() {
  const router = useRouter();
  const params = useParams();
  const cursoId = String(params?.id);

  const [curso, setCurso] = useState<Curso | null>(null);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [horarios, setHorarios] = useState<HorarioConInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{dia: number, bloque: string | number} | null>(null);

  useEffect(() => {
    if (cursoId) {
      fetchData();
    }
  }, [cursoId]);

  const fetchData = async () => {
    try {
      const [cursoData, bloquesData, horariosData] = await Promise.all([
        academicsApi.cursos.get(cursoId),
        academicsApi.bloquesHorario.list(),
        academicsApi.horarios.byCurso(cursoId),
      ]);
      setCurso(cursoData);
      setBloques(Array.isArray(bloquesData) ? bloquesData : bloquesData.results || []);
      
      const horariosArray = Array.isArray(horariosData) ? horariosData : horariosData.results || [];
      const formattedHorarios: HorarioConInfo[] = horariosArray.map((h: any) => ({
        ...h,
        materia_nombre: h.materia_info?.nombre,
        docente_nombre: h.materia_info?.docente_info?.nombre_completo,
      }));
      setHorarios(formattedHorarios);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHorario = (dia: number, bloqueId: string | number): HorarioConInfo | undefined => {
    return horarios.find(h => 
      h.dia_semana === dia && String(h.bloque) === String(bloqueId)
    );
  };

  const handleCellClick = (dia: number, bloqueId: string | number) => {
    setSelectedCell({ dia, bloque: bloqueId });
  };

  const handleAssignMateria = async (materiaId: string | null) => {
    if (!selectedCell || !curso) return;

    const existingHorario = getHorario(selectedCell.dia, selectedCell.bloque);
    
    setSaving(true);
    try {
      if (existingHorario) {
        if (materiaId === null) {
          await academicsApi.horarios.update(String(existingHorario.id), { materia: null });
        } else {
          await academicsApi.horarios.update(String(existingHorario.id), { materia: materiaId });
        }
      } else if (materiaId !== null) {
        await academicsApi.horarios.create({
          curso: String(curso.id),
          dia_semana: selectedCell.dia,
          bloque: String(selectedCell.bloque),
          materia: materiaId,
        });
      }
      setSelectedCell(null);
      fetchData();
    } catch (error) {
      console.error('Error saving horario:', error);
      alert('Error al guardar horario');
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

  if (!curso) {
    return (
      <div className="p-6">
        <p>Curso no encontrado</p>
        <Button onClick={() => router.push('/dashboard/cursos')}>Volver</Button>
      </div>
    );
  }

  const materiasDisponibles = curso.materias || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/cursos/${cursoId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Horarios - {curso.nombre_completo}</h2>
          <p className="text-gray-500">Asignación de materias por horario</p>
        </div>
      </div>

      {bloques.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No hay bloques de horario configurados</p>
              <p className="text-sm text-gray-400 mb-4">
                Los bloques de horario se configuran desde Portal Directivo
              </p>
              <Button onClick={() => router.push('/dashboard/portal/bloques')}>
                <Clock className="h-4 w-4 mr-2" />
                Configurar Bloques de Horario
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Grilla Horaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-left w-24">Hora</th>
                    {DIAS.map(dia => (
                      <th key={dia.id} className="border p-2 bg-gray-50 text-center">
                        {dia.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloques.sort((a, b) => a.orden - b.orden).map(bloque => (
                    <tr key={bloque.id}>
                      <td className="border p-2 text-sm font-medium">
                        {bloque.hora_inicio}-{bloque.hora_fin}
                      </td>
                      {DIAS.map(dia => {
                        const horario = getHorario(dia.id, bloque.id);
                        const isSelected = selectedCell?.dia === dia.id && 
                          String(selectedCell?.bloque) === String(bloque.id);
                        
                        return (
                          <td 
                            key={dia.id} 
                            className={`border p-1 text-center cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-100 border-blue-500 border-2' 
                                : horario?.materia
                                  ? 'bg-green-50 hover:bg-green-100' 
                                  : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleCellClick(dia.id, bloque.id)}
                          >
                            {horario?.materia_nombre ? (
                              <div className="text-xs">
                                <div className="font-medium text-green-700">
                                  {horario.materia_nombre}
                                </div>
                                {horario.docente_nombre && (
                                  <div className="text-green-600">
                                    {horario.docente_nombre}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCell && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">
                    {DIAS.find(d => d.id === selectedCell.dia)?.nombre} - {bloques.find(b => String(b.id) === String(selectedCell.bloque))?.hora_inicio}-{bloques.find(b => String(b.id) === String(selectedCell.bloque))?.hora_fin}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-3">Seleccionar materia:</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant={getHorario(selectedCell.dia, selectedCell.bloque)?.materia === null ? "default" : "outline"}
                    onClick={() => handleAssignMateria(null)}
                    disabled={saving}
                  >
                    Sin materia
                  </Button>
                  {materiasDisponibles.map(materia => (
                    <Button
                      key={materia.id}
                      size="sm"
                      variant={getHorario(selectedCell.dia, selectedCell.bloque)?.materia === materia.id ? "default" : "outline"}
                      onClick={() => handleAssignMateria(String(materia.id))}
                      disabled={saving}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      {materia.nombre}
                      {materia.docente_info && (
                        <span className="ml-1 text-xs opacity-75">
                          ({materia.docente_info.nombre_completo})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
                {materiasDisponibles.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No hay materias en este curso. 
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/cursos/${cursoId}/materias`)}
                    >
                      Agregar materias
                    </Button>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}