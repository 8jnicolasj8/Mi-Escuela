'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { schoolsApi, solicitudesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { School } from '@/types';
import { Search, X, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search state for schools
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'nombre' | 'cue' | 'provincia' | 'localidad'>('todos');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    dni: '',
    escuela_id: '',
  });
  
  // Debounced search for schools
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setSearching(true);
    console.log('Searching for:', query, 'filtroActivo:', filtroActivo);
    try {
      const params: any = { q: query, limit: 50 };
      
      if (filtroActivo === 'nombre') {
        delete params.q;
        params.nombre = query;
      } else if (filtroActivo === 'cue') {
        delete params.q;
        params.cue = query;
      } else if (filtroActivo === 'provincia') {
        delete params.q;
        params.provincia = query;
      } else if (filtroActivo === 'localidad') {
        delete params.q;
        params.localidad = query;
      }
      
      console.log('API params:', params);
      const result = await schoolsApi.buscar(params);
      console.log('API result:', result);
      // Filter only active schools for registration
      const activeSchools = (result.results || []).filter((s: School) => s.activa);
      setSearchResults(activeSchools);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error('Error searching:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (school: School) => {
    setSelectedSchool(school);
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedSchool(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (!selectedSchool) {
      setError('Seleccioná una escuela');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await solicitudesApi.create({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni: formData.dni,
        escuela_id: selectedSchool.id,
      });
      
      alert('Tu solicitud fue enviada. Un directivo de la escuela deberá aprobarla.');
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Registrarse en Campus Virtual</CardTitle>
          <CardDescription>
            {step === 1 && 'Buscá tu escuela'}
            {step === 2 && 'Completá tus datos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {step === 1 && (
            <div className="space-y-4">
              <Label>Buscar escuela:</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar escuelas por nombre, CUE, provincia, localidad..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <Button variant="outline" onClick={clearSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-sm text-gray-500 self-center">Filtrar por:</span>
                  {(['todos', 'nombre', 'cue', 'provincia', 'localidad'] as const).map((filtro) => (
                    <Button
                      key={filtro}
                      variant={filtroActivo === filtro ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroActivo(filtro)}
                    >
                      {filtro.charAt(0).toUpperCase() + filtro.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2 text-xs text-gray-500 border-b">
                      {searchResults.length} escuela(s) activa(s) - clicá para seleccionar
                    </div>
                    {searchResults.map((school) => (
                      <div
                        key={school.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectSearchResult(school)}
                      >
                        <div className="font-medium text-gray-900">{school.nombre}</div>
                        <div className="text-sm text-gray-500 flex gap-2 flex-wrap">
                          {school.cue && <span>CUE: {school.cue}</span>}
                          {school.provincia && <span>| {school.provincia}</span>}
                          {school.localidad && <span>| {school.localidad}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && !searching && showSearchResults && searchResults.length === 0 && (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded mt-2">
                    No hay escuelas activas que coincidan con tu búsqueda
                  </div>
                )}
              </div>

              {/* Selected school display */}
              {selectedSchool && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Escuela seleccionada:</p>
                  <p className="font-medium">{selectedSchool.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {selectedSchool.localidad}, {selectedSchool.provincia}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSchool(null)} className="mt-2 text-red-500">
                    <X className="h-4 w-4 mr-1" /> Cambiar escuela
                  </Button>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
                disabled={!selectedSchool}
              >
                Siguiente
              </Button>
              
              <div className="text-center">
                <a href="/" className="text-sm text-primary hover:underline">
                  ¿Ya tenés cuenta? Iniciar sesión
                </a>
              </div>
            </div>
          )}
          
          {step === 2 && selectedSchool && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                <strong>Escuela seleccionada:</strong>
                <p>{selectedSchool.nombre}</p>
                <p className="text-xs">{selectedSchool.localidad}, {selectedSchool.provincia}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
              
              <div className="text-center">
                <button 
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setStep(1)}
                >
                  Volver
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}