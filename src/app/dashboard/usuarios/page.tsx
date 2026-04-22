'use client';

import { useEffect, useState, useCallback } from 'react';
import { userSchoolApi, schoolsApi } from '@/lib/api';
import { UserSchool, School } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Users, X, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'DIRECTIVO', label: 'Directivo' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'ALUMNO', label: 'Alumno' },
  { value: 'APODERADO', label: 'Apoderado' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('DIRECTIVO');

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
    first_name: '',
    last_name: '',
    dni: '',
    rol: 'ALUMNO',
  });

  useEffect(() => {
    fetchData();
  }, [filterRol]);

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

  const fetchData = async () => {
    try {
      const usersData = await userSchoolApi.list({ rol: filterRol, activo: true });
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearching(true);
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
      
      const result = await schoolsApi.buscar(params);
      setSearchResults(result.results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching:', error);
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
    
    if (!selectedSchool) {
      alert('Seleccioná una escuela');
      return;
    }
    
    console.log('Creating user with:', { ...formData, escuela: selectedSchool.id });
    
    try {
      const result = await userSchoolApi.create({
        ...formData,
        escuela: selectedSchool.id,
      });
      console.log('User created:', result);
      alert('Usuario creado correctamente');
      setShowForm(false);
      setFormStep(1);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        dni: '',
        rol: 'ALUMNO',
      });
      setSelectedSchool(null);
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario: ' + (error.response?.data?.error || JSON.stringify(error.response?.data) || error.message));
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-gray-500">Gestiona los usuarios de la escuela</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filtrar por:</span>
        </div>
        <select
          className="px-3 py-2 border rounded-md"
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
        >
          {ROLES.map((rol) => (
            <option key={rol.value} value={rol.value}>{rol.label}</option>
          ))}
        </select>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {formStep === 1 && 'Paso 1: Buscar y seleccionar escuela'}
              {formStep === 2 && 'Paso 2: Datos del usuario'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formStep === 1 && (
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
                        {searchResults.length} resultado(s) - clicá para seleccionar
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
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setFormStep(2)}
                    disabled={!selectedSchool}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rol">Rol</Label>
                    <select
                      id="rol"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    >
                      {ROLES.map((rol) => (
                        <option key={rol.value} value={rol.value}>{rol.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Crear Usuario</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormStep(1); setSelectedSchool(null); }}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setFormStep(1)}>
                    Volver
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de {ROLES.find(r => r.value === filterRol)?.label || 'Usuarios'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay usuarios con ese rol</p>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                      {user.nombre_completo?.[0] || user.usuario?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.nombre_completo}</h3>
                      <p className="text-sm text-gray-500">{user.usuario?.email}</p>
                      {user.usuario?.dni && (
                        <p className="text-xs text-gray-400">DNI: {user.usuario.dni}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {user.nombre_escuela || 'Sin escuela asignada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded ${getRolBadge(user.rol)}`}>
                      {user.rol}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
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