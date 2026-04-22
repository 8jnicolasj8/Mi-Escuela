'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, X } from 'lucide-react';

interface Evento {
  id: number;
  titulo: string;
  fecha: string;
  tipo: string;
  materia?: string;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvento, setNewEvento] = useState({ titulo: '', fecha: '', tipo: 'EXAMEN' });
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/calendario/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEventos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: any[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getEventosForDay = (day: number) => {
    const fecha = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventos.filter(e => e.fecha === fecha);
  };

  const days = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
          <p className="text-gray-500">Fechas importantes y eventos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Fecha
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Fecha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full p-2 border rounded"
              placeholder="Título del evento..."
              value={newEvento.titulo}
              onChange={(e) => setNewEvento({...newEvento, titulo: e.target.value})}
            />
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={newEvento.fecha}
              onChange={(e) => setNewEvento({...newEvento, fecha: e.target.value})}
            />
            <select
              className="w-full p-2 border rounded"
              value={newEvento.tipo}
              onChange={(e) => setNewEvento({...newEvento, tipo: e.target.value})}
            >
              <option value="EXAMEN">Examen</option>
              <option value="ENTREGA">Entrega</option>
              <option value="REUNION">Reunión</option>
              <option value="OTRO">Otro</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={() => { setShowForm(false); setNewEvento({ titulo: '', fecha: '', tipo: 'EXAMEN' }); }}>
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handlePrevMonth}>←</Button>
            <CardTitle>{MESES[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
            <Button variant="outline" onClick={handleNextMonth}>→</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="text-center font-medium text-sm p-2 bg-gray-50">
                {dia}
              </div>
            ))}
            {days.map((day, index) => {
              const dayEvents = day ? getEventosForDay(day) : [];
              return (
                <div
                  key={index}
                  className={`min-h-[80px] border p-1 ${day ? 'bg-white' : 'bg-gray-100'}`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium">{day}</div>
                      {dayEvents.map(e => (
                        <div key={e.id} className={`text-xs p-1 mt-1 rounded ${
                          e.tipo === 'EXAMEN' ? 'bg-red-100 text-red-700' :
                          e.tipo === 'ENTREGA' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {e.titulo}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}