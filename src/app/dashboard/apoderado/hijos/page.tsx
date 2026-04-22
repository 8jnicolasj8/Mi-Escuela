'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Folder, ChevronRight } from 'lucide-react';

interface Hijo {
  id: number;
  nombre: string;
  email: string;
}

export default function ApoderadoHijosPage() {
  const [loading, setLoading] = useState(true);
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/mis-hijos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHijos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching hijos:', error);
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
        <h2 className="text-2xl font-bold text-gray-900">Mis Hijos</h2>
        <p className="text-gray-500">Hijos/as a cargo</p>
      </div>

      {hijos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500">No tenés hijos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hijos.map(hijo => (
            <Card key={hijo.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {hijo.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{hijo.email}</p>
                <Button size="sm" onClick={() => {
                  window.location.href = `/dashboard/apoderado/progreso?hijo=${hijo.id}`;
                }}>
                  Ver Progreso
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}