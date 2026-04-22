'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LayoutDashboard, BookOpen, GraduationCap, Bell, Users, Home, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Mis Cursos', href: '/dashboard/alumno/cursos', icon: BookOpen, roles: ['ALUMNO'] },
  { name: 'Actividades', href: '/dashboard/alumno/actividades', icon: GraduationCap, roles: ['ALUMNO'] },
  { name: 'Mis Hijos', href: '/dashboard/apoderado/hijos', icon: Users, roles: ['APODERADO'] },
  { name: 'Mis Clases', href: '/dashboard/docente/classrooms', icon: BookOpen, roles: ['DOCENTE'] },
  { name: 'Notificaciones', href: '/dashboard/alumno/notificaciones', icon: Bell, roles: ['ALUMNO'] },
  { name: 'Progreso', href: '/dashboard/apoderado/progreso', icon: GraduationCap, roles: ['APODERADO'] },
  { name: 'Portal', href: '/dashboard/portal', icon: Settings, roles: ['DIRECTIVO'] },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: Users, roles: ['DIRECTIVO', 'SUPERADMIN'] },
];

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { userSchool } = useAuthStore();

  const userRole = userSchool?.rol;

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (item.roles.includes(userRole || '')) return true;
    return false;
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
                active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}