'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, Copy, RefreshCw, Check, AlertCircle, Link as LinkIcon, Camera, Lock, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getAccessToken } from '@/lib/api';

interface Hijo {
  id: string;
  nombre: string;
  email: string;
  cursos: { id: number; nombre: string }[];
  codigo: string | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const { userSchool, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [miCodigo, setMiCodigo] = useState<string | null>(null);
  const [codigoVinculacion, setCodigoVinculacion] = useState('');
  const [loadingVinculacion, setLoadingVinculacion] = useState(false);
  const [errorVinculacion, setErrorVinculacion] = useState('');
  const [successVinculacion, setSuccessVinculacion] = useState('');
  
  // Profile edit states
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  
  // Profile photo
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const API_URL = typeof window !== 'undefined' ? (localStorage.getItem('api_url') || 'http://localhost:8000') : 'http://localhost:8000';

  useEffect(() => {
    if (userSchool?.rol === 'APODERADO') {
      fetchData();
    } else if (userSchool?.rol === 'ALUMNO') {
      fetchMiCodigo();
    } else {
      setLoading(false);
    }
  }, [userSchool]);

  const fetchData = async () => {
    const token = getAccessToken();
    try {
      if (userSchool?.rol === 'APODERADO') {
        const res = await fetch(`${API_URL}/api/v1/mis-hijos/`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          let data = await res.json();
          data = Array.isArray(data) ? data : [];
          setHijos(data);
        }
      }
    } catch (error) {
      console.error('Error fetching datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarCodigo = async (hijoId: string) => {
    const token = getAccessToken();
    setGeneratingId(hijoId);
    try {
      const res = await fetch(`${API_URL}/api/v1/generar-codigo/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hijo_id: hijoId })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Codigo generado: ${data.codigo}`);
        fetchData();
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyCodigo = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchMiCodigo = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/api/v1/mi-codigo/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setMiCodigo(data.codigo);
      }
    } catch (error) {
      console.error('Error fetching mi codigo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarMiCodigo = async () => {
    const token = getAccessToken();
    setGeneratingId('miCodigo');
    try {
      const res = await fetch(`${API_URL}/api/v1/generar-codigo/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        setMiCodigo(data.codigo);
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleVincularHijo = async () => {
    const token = getAccessToken();
    setLoadingVinculacion(true);
    setErrorVinculacion('');
    setSuccessVinculacion('');
    
    try {
      const res = await fetch(`${API_URL}/api/v1/vincular-hijo/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoVinculacion.toUpperCase() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccessVinculacion(data.message || 'Hijo vinculado correctamente');
        setCodigoVinculacion('');
        fetchData();
      } else {
        const err = await res.json();
        setErrorVinculacion(err.error || 'Error al vincular');
      }
    } catch (error) {
      setErrorVinculacion('Error de conexion');
    } finally {
      setLoadingVinculacion(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    const token = getAccessToken();
    
    const formData = new FormData();
    formData.append('foto_perfil', file);
    
    try {
      const res = await fetch(`${API_URL}/api/v1/userschool/me/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setProfileMessage('Foto actualizada correctamente');
        setTimeout(() => setProfileMessage(''), 3000);
      } else {
        setProfileMessage('Error al subir la foto');
      }
    } catch (error) {
      setProfileMessage('Error de conexion');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setChangingPassword(true);
    setPasswordMessage('');
    
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_URL}/api/v1/users/change_password/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      
      if (res.ok) {
        setPasswordMessage('Contraseña cambiada correctamente');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        const err = await res.json();
        setPasswordMessage(err.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      setPasswordMessage('Error de conexion');
    } finally {
      setChangingPassword(false);
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
        <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        <p className="text-gray-500">
          {userSchool?.rol === 'APODERADO' ? 'Gestiona tus hijos' : 'Tu codigo de vinculacion'}
        </p>
      </div>

      {/* Sección: Datos del perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos del Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Foto de perfil */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden">
                {userSchool?.foto_perfil_url ? (
                  <img src={userSchool.foto_perfil_url} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90"
              >
                {uploadingPhoto ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400">{userSchool?.rol}</p>
            </div>
          </div>
          
          {profileMessage && (
            <div className={`text-sm ${profileMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {profileMessage}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              <Lock className="h-4 w-4 mr-2" />
              Cambiar Contraseña
            </Button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Contraseña Actual:</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded mt-1"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nueva Contraseña:</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded mt-1"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirmar Nueva Contraseña:</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded mt-1"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              {passwordMessage && (
                <div className={`text-sm ${passwordMessage.includes('Error') || passwordMessage.includes('no') ? 'text-red-600' : 'text-green-600'}`}>
                  {passwordMessage}
                </div>
              )}
              
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? 'Cambiando...' : 'Guardar Nueva Contraseña'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección: Vinculación */}
      {userSchool?.rol === 'APODERADO' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Vincular a un Hijo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Codigo de tu hijo:</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg mt-1 text-lg font-mono uppercase"
                  placeholder="Ej: ABC123"
                  value={codigoVinculacion}
                  onChange={(e) => setCodigoVinculacion(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>

              {errorVinculacion && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errorVinculacion}
                </div>
              )}

              {successVinculacion && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Check className="h-4 w-4" />
                  {successVinculacion}
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleVincularHijo}
                disabled={loadingVinculacion || !codigoVinculacion.trim()}
              >
                {loadingVinculacion ? 'Vinculando...' : 'Vincular Hijo'}
              </Button>
            </CardContent>
          </Card>

          {hijos.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Mis Hijos Vinculados</h3>
              {hijos.map(hijo => (
                <Card key={hijo.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {hijo.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2">{hijo.email}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No tenes hijos vinculados</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sección: Código de Vinculación para ALUMNO */}
      {userSchool?.rol === 'ALUMNO' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mi Codigo de Vinculacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">Dale este codigo a tu apoderado:</p>
              {miCodigo ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-mono font-bold tracking-wider">
                    {miCodigo}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCodigo(miCodigo, 'miCodigo')}
                  >
                    {copiedId === 'miCodigo' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400">Sin codigo generado</p>
              )}
            </div>

            <Button 
              className="w-full"
              onClick={handleGenerarMiCodigo}
              disabled={generatingId === 'miCodigo'}
            >
              {generatingId === 'miCodigo' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : miCodigo ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar Codigo
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generar Mi Codigo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
