'use client';

import { useEffect, useState, useCallback } from 'react';
import { schoolsApi, usersApi } from '@/lib/api';
import { School, UserSchool } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, X, Check, Users, Trash2, Search, Loader2 } from 'lucide-react';

interface SchoolWithDirectivos extends School {
  directivos?: UserSchool[];
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolWithDirectivos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);
  const [showDirectivoForm, setShowDirectivoForm] = useState<string | null>(null);
  const [directivoEmail, setDirectivoEmail] = useState('');
  const [directivosSearch, setDirectivosSearch] = useState<any[]>([]);
  const [directivosLoading, setDirectivosLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'nombre' | 'cue' | 'provincia' | 'localidad'>('todos');

  const [formData, setFormData] = useState({
    nombre: '',
    cue: '',
    provincia: 'Buenos Aires',
    localidad: '',
    direccion: '',
    telefono: '',
    email: '',
    activa: true,
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  // Debounced search
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

  const fetchSchools = async () => {
    try {
      const data = await schoolsApi.list();
      setSchools(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearching(true);
    try {
      const params: any = { q: query, limit: 50 };
      
      // Apply filter type
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
    // When selecting a school from search, expand it
    setExpandedSchoolId(school.id);
    // Make sure it's in the schools list
    if (!schools.find(s => s.id === school.id)) {
      setSchools(prev => [...prev, school as SchoolWithDirectivos]);
    }
    setShowSearchResults(false);
    setSearchQuery('');
    fetchDirectivos(school.id);
  };

  const fetchDirectivos = async (schoolId: string) => {
    try {
      const directivos = await schoolsApi.getDirectivos(schoolId);
      setSchools(prev => prev.map(s => 
        s.id === schoolId ? { ...s, directivos } : s
      ));
    } catch (error) {
      console.error('Error fetching directivos:', error);
    }
  };

  const toggleExpandSchool = async (schoolId: string) => {
    if (expandedSchoolId === schoolId) {
      setExpandedSchoolId(null);
    } else {
      setExpandedSchoolId(schoolId);
      const school = schools.find(s => s.id === schoolId);
      if (school && !school.directivos) {
        await fetchDirectivos(schoolId);
      }
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setDirectivosSearch([]);
      return;
    }
    setDirectivosLoading(true);
    try {
      const result = await usersApi.list({ search: query });
      setDirectivosSearch(Array.isArray(result) ? result : result.results || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setDirectivosLoading(false);
    }
  };

  const addDirectivo = async (schoolId: string, usuarioId: string) => {
    try {
      await schoolsApi.setDirectivo(schoolId, usuarioId);
      setShowDirectivoForm(null);
      setDirectivoEmail('');
      setDirectivosSearch([]);
      await fetchDirectivos(schoolId);
      alert('Directivo agregado correctamente');
    } catch (error: any) {
      console.error('Error adding directivo:', error);
      alert('Error al agregar directivo: ' + (error.response?.data?.error || error.message));
    }
  };

  const removeDirectivo = async (schoolId: string, usuarioId: string) => {
    if (!confirm('¿Estás seguro de que quieres quitar este directivo?')) return;
    try {
      await schoolsApi.removeDirectivo(schoolId, usuarioId);
      await fetchDirectivos(schoolId);
      alert('Directivo quitado correctamente');
    } catch (error: any) {
      console.error('Error removing directivo:', error);
      alert('Error al quitar directivo: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await schoolsApi.create(formData);
      setShowForm(false);
      resetForm();
      fetchSchools();
    } catch (error: any) {
      console.error('Error creating school:', error);
      alert('Error al crear escuela: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
    }
  };

  const handleEdit = (school: School) => {
    setEditingId(school.id);
    setFormData({
      nombre: school.nombre,
      cue: school.cue || '',
      provincia: school.provincia || '',
      localidad: school.localidad || '',
      direccion: school.direccion || '',
      telefono: school.telefono || '',
      email: school.email || '',
      activa: school.activa,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await schoolsApi.update(editingId, formData);
      setEditingId(null);
      resetForm();
      fetchSchools();
      alert('Escuela guardada correctamente');
    } catch (error: any) {
      console.error('Error updating school:', error);
      alert('Error al guardar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      cue: '',
      provincia: 'Buenos Aires',
      localidad: '',
      direccion: '',
      telefono: '',
      email: '',
      activa: true,
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Escuelas</h2>
          <p className="text-gray-500">Gestiona las escuelas del sistema</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Escuela
        </Button>
      </div>

      {/* Search Box */}
      <Card>
        <CardContent className="pt-4">
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
            
            {/* Filter buttons */}
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
                  {searchResults.length} resultado(s)
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
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Escuela</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cue">CUE</Label>
                  <Input
                    id="cue"
                    value={formData.cue}
                    onChange={(e) => setFormData({ ...formData, cue: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="localidad">Localidad</Label>
                  <Input
                    id="localidad"
                    value={formData.localidad}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Crear Escuela</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {showSearchResults ? 'Resultado de Búsqueda' : 'Lista de Escuelas'} 
            {!showSearchResults && `(${schools.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (showSearchResults ? searchResults : schools).length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {showSearchResults ? 'No se encontraron escuelas' : 'No hay escuelas registradas'}
            </p>
          ) : (
            <div className="space-y-4">
              {(showSearchResults ? searchResults : schools).map((school) => (
                <div key={school.id} className="p-4 border rounded-lg">
                  {editingId === school.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>CUE</Label>
                          <Input
                            value={formData.cue}
                            onChange={(e) => setFormData({ ...formData, cue: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Provincia</Label>
                          <Input
                            value={formData.provincia}
                            onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Localidad</Label>
                          <Input
                            value={formData.localidad}
                            onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Dirección</Label>
                          <Input
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Teléfono</Label>
                          <Input
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit}>
                          <Check className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{school.nombre}</h3>
                          <p className="text-sm text-gray-500">
                            {school.localidad}, {school.provincia}
                          </p>
                          {school.direccion && (
                            <p className="text-xs text-gray-400">{school.direccion}</p>
                          )}
                          {school.cue && <p className="text-xs text-gray-400">CUE: {school.cue}</p>}
                          {school.telefono && <p className="text-xs text-gray-400">Tel: {school.telefono}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleExpandSchool(school.id)}>
                            <Users className="h-4 w-4 mr-1" />
                            Directivos
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(school)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <span className={`px-2 py-1 text-xs rounded ${school.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {school.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                      {expandedSchoolId === school.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm text-gray-700">Directivos de la escuela</h4>
                            <Button size="sm" onClick={() => setShowDirectivoForm(school.id)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar
                            </Button>
                          </div>
                          {showDirectivoForm === school.id && (
                            <div className="mb-3 p-3 bg-gray-50 rounded">
                              <Input
                                placeholder="Buscar usuario por email o nombre..."
                                value={directivoEmail}
                                onChange={(e) => {
                                  setDirectivoEmail(e.target.value);
                                  searchUsers(e.target.value);
                                }}
                                className="mb-2"
                              />
                              {directivosSearch.length > 0 && (
                                <div className="max-h-32 overflow-y-auto border rounded">
                                  {directivosSearch.map((user) => (
                                    <div
                                      key={user.id}
                                      className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                                      onClick={() => addDirectivo(school.id, user.id)}
                                    >
                                      <span className="text-sm">{user.first_name} {user.last_name}</span>
                                      <span className="text-xs text-gray-500">{user.email}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {directivosLoading && <p className="text-xs text-gray-500">Buscando...</p>}
                              <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowDirectivoForm(null)}>
                                Cancelar
                              </Button>
                            </div>
                          )}
                          {(school as any).directivos && (school as any).directivos.length > 0 ? (
                            <div className="space-y-2">
                              {(school as any).directivos.map((d: any) => (
                                <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="text-sm font-medium">{d.usuario?.first_name} {d.usuario?.last_name}</span>
                                    <span className="text-xs text-gray-500 ml-2">{d.usuario?.email}</span>
                                  </div>
                                  <Button size="sm" variant="ghost" onClick={() => removeDirectivo(school.id, d.usuario.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No hay directivos asignados</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}