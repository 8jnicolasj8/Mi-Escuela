'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowLeft } from 'lucide-react';

const DIAS = [
  { id: 0, nombre: 'Lunes', abrev: 'Lun' },
  { id: 1, nombre: 'Martes', abrev: 'Mar' },
  { id: 2, nombre: 'Miércoles', abrev: 'Mié' },
  { id: 3, nombre: 'Jueves', abrev: 'Jue' },
  { id: 4, nombre: 'Viernes', abrev: 'Vie' },
];

interface Bloque {
  id: number;
  hora_inicio: string;
  hora_fin: string;
  orden: number;
}

interface Horario {
  id: number;
  dia_semana: number;
  materia: string;
  materia_nombre?: string;
  bloque_horario: string;
  curso: any;
  curso_nombre?: string;
}

export default function AlumnoHorarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cursoNombre, setCursoNombre] = useState<string>('');
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      // Always fetch cursos first
      const cursosRes = await fetch(`${API_URL}/api/v1/mis-cursos/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const cursosData = await cursosRes.json();
      const cursosArray = Array.isArray(cursosData) 
        ? cursosData 
        : (cursosData.results || []);
      
      console.log('cursosData:', cursosArray);
      
      if (cursosArray.length > 0) {
        setCursoNombre(cursosArray[0].curso_nombre || 'Mi Curso');
      }
      
      // Always fetch bloques
      const bloquesRes = await fetch(`${API_URL}/api/v1/bloques-horario/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const bloquesData = await bloquesRes.json();
      const bloquesArray = Array.isArray(bloquesData) 
        ? bloquesData 
        : (bloquesData.results || []);
      console.log('bloquesData:', bloquesArray.length);
      setBloques(bloquesArray);
      
      // Always fetch horarios
      const horariosRes = await fetch(`${API_URL}/api/v1/mis-horarios/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const horariosData = await horariosRes.json();
      const horariosArray = Array.isArray(horariosData) 
        ? horariosData 
        : (horariosData.results || []);
      console.log('horariosData:', horariosArray.length);
      setHorarios(horariosArray);
      
    } catch (error) {
      console.error('Error fetching datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map horarios to flat structure for easier access
  const mappedHorarios: any[] = horarios.map((h: any) => {
    const bloqueObj = h.bloque;
    let bloqueId: number = 0;
    let horaInicio = '';
    let horaFin = '';
    
    if (bloqueObj && typeof bloqueObj === 'object') {
      bloqueId = Number(bloqueObj.id) || 0;
      horaInicio = bloqueObj.hora_inicio || '';
      horaFin = bloqueObj.hora_fin || '';
    } else {
      bloqueId = Number(bloqueObj) || 0;
    }
    
    return {
      ...h,
      materia: h.materia_info?.nombre || h.materia || h.materia_nombre || null,
      bloque_id: bloqueId,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    };
  });
  
  const getHorario = (dia: number, bloqueId: number): any | undefined => {
    if (!bloques.length || !mappedHorarios.length) return undefined;
    
    // Get the target bloque's times
    const targetBloque = bloques.find(b => Number(b.id) === Number(bloqueId));
    if (!targetBloque) return undefined;
    
    // Try matching by exact bloque id
    let found = mappedHorarios.find(h => 
      Number(h.dia_semana) === Number(dia) && Number(h.bloque_id) === Number(bloqueId)
    );
    if (found) return found;
    
    // Try matching by hour times
    found = mappedHorarios.find(h => 
      Number(h.dia_semana) === Number(dia) && 
      h.hora_inicio === targetBloque.hora_inicio
    );
    
    return found;
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Horario - {cursoNombre || 'Mi Curso'}
          </h2>
          <p className="text-gray-500">Mi schedule semanal</p>
        </div>
      </div>

      {bloques.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay bloques de horario configurados</p>
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
                        
                        return (
                          <td 
                            key={dia.id} 
                            className={`border p-1 text-center ${
                              horario?.materia
                                ? 'bg-green-50' 
                                : 'bg-gray-25'
                            }`}
                          >
                            {horario?.materia ? (
                              <div className="text-xs">
                                <div className="font-medium text-green-700">
                                  {horario.materia}
                                </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}