'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Check, AlertCircle, ArrowLeft } from 'lucide-react';

export default function VincularPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tutorNombre, setTutorNombre] = useState('');
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  const handleVincular = async () => {
    if (!codigo.trim()) {
      setError('Ingresá un código');
      return;
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/vincular/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ codigo: codigo.toUpperCase() })
      });

      if (res.ok) {
        const data = await res.json();
        setTutorNombre(data.tutor);
        setSuccess(true);
      } else {
        const err = await res.json();
        setError(err.error || 'Código inválido');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vinculación Exitosa</h2>
          <p className="text-gray-500">Te vinculaste a tu apoderado</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-600">¡Estás vinculado!</h3>
              <p className="text-gray-500 mt-2">
                Tu apoderado <strong>{tutorNombre}</strong> ahora puede ver tu progreso académico.
              </p>
              <Button 
                className="mt-6"
                onClick={() => router.push('/dashboard')}
              >
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vincular a mi Apoderado</h2>
          <p className="text-gray-500">Ingresá el código que te dio tu apoderado</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Código de Vinculación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Código:</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg mt-1 text-lg font-mono uppercase"
              placeholder="Ej: ABC123"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              El código tiene 6 caracteres (letras y números)
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={handleVincular}
            disabled={loading || !codigo.trim()}
          >
            {loading ? 'Vinculando...' : 'Vincular'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">¿Qué pasa cuando me vinculo?</h4>
              <p className="text-sm text-gray-500 mt-1">
                Tu apoderado podrá ver tus calificaciones, asistencia y progreso académico.
                Solo podés estar vinculado a un apoderado a la vez.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
