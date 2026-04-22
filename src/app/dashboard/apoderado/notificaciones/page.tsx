'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getAccessToken } from '@/lib/api';

interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  materia?: string;
}

const TIPO_ICONS: Record<string, any> = {
  'ACTIVIDAD': FileText,
  'AVISO': Bell,
  'ENTREGA': Clock,
  'CORRECCION': CheckCircle,
  'ALERTA': AlertCircle,
};

const TIPO_COLORS: Record<string, string> = {
  'ACTIVIDAD': 'bg-blue-100 text-blue-700 border-blue-200',
  'AVISO': 'bg-purple-100 text-purple-700 border-purple-200',
  'ENTREGA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'CORRECCION': 'bg-green-100 text-green-700 border-green-200',
  'ALERTA': 'bg-red-100 text-red-700 border-red-200',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function ApoderadoNotificacionesPage() {
  const { userSchool } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getAccessToken();
    try {
      // Fetch hijos
      const hijosRes = await fetch(`${API_URL}/api/v1/mis-hijos/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      const notifs: Notificacion[] = [];
      
      if (hijosRes.ok) {
        const hijos = await hijosRes.json();
        
        // Para cada hijo, buscar sus actividades y avisos
        for (const hijo of hijos) {
          // Fetch avisos de la escuela
          try {
            const avisosRes = await fetch(`${API_URL}/api/v1/avisos/`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (avisosRes.ok) {
              const avisosData = await avisosRes.json();
              const avisos = Array.isArray(avisosData) ? avisosData : (avisosData.results || []);
              avisos.forEach((av: any) => {
                notifs.push({
                  id: av.id,
                  tipo: 'AVISO',
                  titulo: av.titulo,
                  mensaje: av.mensaje,
                  fecha: av.fecha_creacion,
                  leida: false,
                });
              });
            }
          } catch (e) {
            console.error('Error fetching avisos:', e);
          }
          
          // Fetch actividades del hijo
          try {
            const actsRes = await fetch(`${API_URL}/api/v1/mis-notas-alumno/${hijo.id}/`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (actsRes.ok) {
              const acts = await actsRes.json();
              acts.forEach((act: any) => {
                if (act.nota !== undefined && act.nota !== null) {
                  notifs.push({
                    id: act.id,
                    tipo: 'CORRECCION',
                    titulo: `${act.materia}: ${act.actividad}`,
                    mensaje: `Nota: ${act.nota}`,
                    fecha: act.fecha_nota || act.fecha_entrega,
                    leida: false,
                    materia: act.materia
                  });
                }
              });
            }
          } catch (e) {
            console.error('Error fetching notas:', e);
          }
        }
      }
      
      // Agregar ejemplo si no hay nada
      if (notifs.length === 0) {
        notifs.push({
          id: 1,
          tipo: 'AVISO',
          titulo: 'Bienvenido al Campus Virtual',
          mensaje: 'Aqui veras las notificaciones de tus hijos.',
          fecha: new Date().toISOString(),
          leida: false,
        });
      }
      
      // Ordenar por fecha
      notifs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setNotificaciones(notifs);
    } catch (error) {
      console.error('Error fetching notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (tipo: string) => {
    return TIPO_ICONS[tipo] || Bell;
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
        <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
        <p className="text-gray-500">Actualizaciones de tus hijos</p>
      </div>

      {notificaciones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500">No hay notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notificaciones.map(notif => {
            const IconComponent = getIcon(notif.tipo);
            const colorClass = TIPO_COLORS[notif.tipo] || 'bg-gray-100';
            
            return (
              <Card key={notif.id} className={notif.leida ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={'h-10 w-10 rounded-full flex items-center justify-center ' + colorClass}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{notif.titulo}</h3>
                        {!notif.leida && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{notif.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(notif.fecha)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}