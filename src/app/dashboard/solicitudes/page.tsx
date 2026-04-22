'use client';

import { useEffect, useState } from 'react';
import { userSchoolApi } from '@/lib/api';
import { UserSchool } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, UserPlus, ChevronDown } from 'lucide-react';

const ROLES = [
  { value: 'ALUMNO', label: 'Estudiante' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'APODERADO', label: 'Apoderado' },
];

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<UserSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [showRoleSelect, setShowRoleSelect] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const data = await userSchoolApi.getSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleSelect = (id: string) => {
    setShowRoleSelect(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAprobar = async (id: string, rol?: string) => {
    try {
      const result = await userSchoolApi.aprobar(id, rol || 'ALUMNO');
      console.log('Aprobado:', result);
      fetchSolicitudes();
    } catch (error: any) {
      console.error('Error approving solicitud:', error);
      if (error.response?.data?.error) {
        alert('Error: ' + error.response.data.error + '\n\n' + error.response.data.trace);
      } else {
        alert('Error al aprobar');
      }
    }
  };

  const handleRechazar = async (id: string) => {
    try {
      await userSchoolApi.rechazar(id);
      fetchSolicitudes();
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
    }
  };

  const getRolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      SUPERADMIN: 'bg-purple-100 text-purple-800',
      DIRECTIVO: 'bg-blue-100 text-blue-800',
      DOCENTE: 'bg-green-100 text-green-800',
      ALUMNO: 'bg-orange-100 text-orange-800',
      APODERADO: 'bg-gray-100 text-gray-800',
    };
    return colors[rol] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Ingreso</h2>
        <p className="text-gray-500">Usuarios que esperando aprobación para unirse a la escuela</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Solicitudes Pendientes ({solicitudes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded" />
              ))}
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                      {solicitud.nombre_completo?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{solicitud.nombre_completo}</h3>
                      <p className="text-sm text-gray-500">{solicitud.usuario?.email}</p>
                      {solicitud.usuario?.dni && (
                        <p className="text-xs text-gray-400">DNI: {solicitud.usuario.dni}</p>
                      )}
                      {solicitud.usuario?.localidad && (
                        <p className="text-xs text-gray-400">
                          {solicitud.usuario.localidad}, {solicitud.usuario.provincia}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                    
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRoleSelect(solicitud.id)}
                        className="flex items-center gap-1"
                      >
                        {ROLES.find(r => r.value === (selectedRoles[solicitud.id] || 'ALUMNO'))?.label || 'Estudiante'}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      {showRoleSelect[solicitud.id] && (
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10">
                          {ROLES.map((rol) => (
                            <div
                              key={rol.value}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                              onClick={() => {
                                setSelectedRoles(prev => ({ ...prev, [solicitud.id]: rol.value }));
                                setShowRoleSelect(prev => ({ ...prev, [solicitud.id]: false }));
                              }}
                            >
                              {rol.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleAprobar(solicitud.id, selectedRoles[solicitud.id] || 'ALUMNO')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRechazar(solicitud.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}