'use client';

import { useEffect, useState } from 'react';
import { userSchoolApi } from '@/lib/api';
import { UserSchool } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentsPage() {
  const [students, setStudents] = useState<UserSchool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await userSchoolApi.getAlumnos();
      setStudents(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Alumnos</h2>
        <p className="text-gray-500">Lista de alumnos de la escuela</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alumnos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay alumnos registrados</p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      {student.nombre_completo?.[0] || student.usuario?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.nombre_completo}</h3>
                      <p className="text-sm text-gray-500">{student.usuario?.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${student.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {student.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}