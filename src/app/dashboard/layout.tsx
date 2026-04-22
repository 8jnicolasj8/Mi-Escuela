'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BottomBar from '@/components/BottomBar';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  X,
  UserPlus,
  Settings,
  Building2,
  Calendar,
  Clock,
  Link as LinkIcon,
  User
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portal Directivo', href: '/dashboard/portal', icon: Building2, roles: ['DIRECTIVO'] },
  { name: 'Escuelas', href: '/dashboard/escuelas', icon: School, roles: ['SUPERADMIN'] },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: Users, roles: ['SUPERADMIN', 'DIRECTIVO'] },
  { name: 'Cursos', href: '/dashboard/cursos', icon: BookOpen, roles: ['DIRECTIVO'] },
  { name: 'Alumnos', href: '/dashboard/alumnos', icon: GraduationCap, roles: ['DIRECTIVO', 'DOCENTE'] },
  { name: 'Solicitudes', href: '/dashboard/solicitudes', icon: UserPlus, roles: ['DIRECTIVO'] },
  { name: 'Mis Clases', href: '/dashboard/docente/classrooms', icon: BookOpen, roles: ['DOCENTE'] },
  { name: 'Calendario', href: '/dashboard/docente/calendario', icon: Calendar, roles: ['DOCENTE'] },
  { name: 'Horario', href: '/dashboard/docente/horario', icon: Clock, roles: ['DOCENTE'] },
  { name: 'Mis Cursos', href: '/dashboard/alumno/cursos', icon: BookOpen, roles: ['ALUMNO'] },
  { name: 'Notificaciones', href: '/dashboard/alumno/notificaciones', icon: Calendar, roles: ['ALUMNO'] },
  { name: 'Mis Notas', href: '/dashboard/alumno/notas', icon: GraduationCap, roles: ['ALUMNO'] },
  { name: 'Calendario', href: '/dashboard/alumno/calendario', icon: Calendar, roles: ['ALUMNO'] },
  { name: 'Horario', href: '/dashboard/alumno/horario', icon: Clock, roles: ['ALUMNO'] },
  { name: 'Mis Hijos', href: '/dashboard/apoderado/hijos', icon: Users, roles: ['APODERADO'] },
  { name: 'Progreso', href: '/dashboard/apoderado/progreso', icon: GraduationCap, roles: ['APODERADO'] },
  { name: 'Notificaciones', href: '/dashboard/apoderado/notificaciones', icon: Calendar, roles: ['APODERADO'] },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userSchool, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  console.log('layout - userSchool:', userSchool);
  console.log('layout - userSchool?.rol:', userSchool?.rol);
  
  const userRole = userSchool?.rol || 'ALUMNO';
  const showSchool = userRole !== 'SUPERADMIN' && userSchool?.nombre_escuela;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const visibleNavigation = navigation.filter(
    item => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute right-0 top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <span className="text-xl font-bold text-primary">Campus Virtual</span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-1">
                  {visibleNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? "bg-gray-100 text-primary"
                            : "text-gray-600 hover:bg-gray-100 hover:text-primary",
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-xl font-bold text-primary">Campus Virtual</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {visibleNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? "bg-gray-100 text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-primary",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t py-4">
            <div className="flex items-center gap-x-3 py-2">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name || user?.short_name || user?.email}
                </p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600"
              onClick={() => router.push('/dashboard/perfil')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Perfil
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-gray-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold">Panel de Control</h1>
            </div>
            {showSchool && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {userSchool?.nombre_escuela}
                </span>
              </div>
            )}
          </div>
        </div>

        <main className="py-8 pb-24 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Bottom Bar for Mobile */}
        <BottomBar />
      </div>
    </div>
  );
}