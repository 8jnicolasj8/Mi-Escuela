'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getAccessToken } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Trash2, AlertCircle, Check, Image as ImageIcon } from 'lucide-react';

interface Aviso {
  id: number;
  titulo: string;
  mensaje: string;
  imagen: string | null;
  imagen_url: string | null;
  autor: number;
  autor_nombre: string;
  escuela: string;
  importante: boolean;
  fecha_creacion: string;
  actualizado: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function PortalAvisosPage() {
  const router = useRouter();
  const { userSchool } = useAuthStore();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    importante: false,
  });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    fetchAvisos();
  }, []);

  const fetchAvisos = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/api/v1/avisos/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        // Handle paginated response
        if (Array.isArray(data)) {
          setAvisos(data);
        } else if (data.results) {
          setAvisos(data.results);
        } else {
          setAvisos([]);
        }
      }
    } catch (error) {
      console.error('Error fetching avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      setError('Titulo y mensaje son requeridos');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    const token = getAccessToken();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('mensaje', formData.mensaje);
      formDataToSend.append('importante', formData.importante ? 'true' : 'false');
      
      if (imagenFile) {
        formDataToSend.append('imagen', imagenFile);
      }
      
      const res = await fetch(`${API_URL}/api/v1/avisos/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });
      
      if (res.ok) {
        setSuccess('Aviso creado correctamente');
        setFormData({ titulo: '', mensaje: '', importante: false });
        setImagenFile(null);
        setShowForm(false);
        fetchAvisos();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al crear aviso');
      }
    } catch (error) {
      setError('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Estas seguro de eliminar este aviso?')) return;
    
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/api/v1/avisos/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok || res.status === 204) {
        setAvisos(avisos.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting aviso:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avisos Escolares</h2>
          <p className="text-gray-500">Gestiona los avisos y anuncios de tu escuela</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Aviso
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Aviso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titulo:</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="Titulo del aviso"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Mensaje:</label>
                <textarea
                  className="w-full p-3 border rounded-lg mt-1 min-h-[150px]"
                  placeholder="Contenido del aviso..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.importante}
                    onChange={(e) => setFormData({...formData, importante: e.target.checked})}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">Marcar como importante</span>
                </label>
              </div>
              
              <div>
                <label className="text-sm font-medium">Imagen (opcional):</label>
                <div className="flex items-center gap-4 mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImagenFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="imagen-aviso"
                  />
                  <label
                    htmlFor="imagen-aviso"
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {imagenFile ? imagenFile.name : 'Seleccionar imagen'}
                  </label>
                  {imagenFile && (
                    <span className="text-sm text-gray-500">{imagenFile.name}</span>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Check className="h-4 w-4" />
                  {success}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Aviso'}
                </Button>
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de avisos */}
      {avisos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500">No hay avisos creados</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
              Crear el primer aviso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {avisos.map(aviso => (
            <Card key={aviso.id} className={aviso.importante ? 'border-red-300 bg-red-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {aviso.importante && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded">IMPORTANTE</span>
                      )}
                      <h3 className="font-semibold text-lg">{aviso.titulo}</h3>
                    </div>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{aviso.mensaje}</p>
                    
                    {aviso.imagen_url && (
                      <img
                        src={aviso.imagen_url}
                        alt={aviso.titulo}
                        className="mt-4 max-w-md rounded-lg"
                      />
                    )}
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                      <span>Por: {aviso.autor_nombre}</span>
                      <span>{formatDate(aviso.fecha_creacion)}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(aviso.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}