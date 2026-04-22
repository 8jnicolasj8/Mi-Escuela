import { create } from 'zustand';
import { User, UserSchool, School } from '@/types';
import { authApi, userSchoolApi, clearTokens, getAccessToken, setTokens, setCurrentSchool } from '@/lib/api';

interface AuthState {
  user: User | null;
  userSchool: UserSchool | null;
  school: School | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setSchool: (school: School) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userSchool: null,
  school: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    setTokens(tokens.access, tokens.refresh);
    
    const user = await authApi.me();
    
    let userSchool: UserSchool | null = null;
    try {
      const userSchools = await userSchoolApi.list({ activo: true });
      
      let schoolList: any[] = [];
      if (userSchools.results) {
        schoolList = userSchools.results;
      } else if (Array.isArray(userSchools)) {
        schoolList = userSchools;
      }
      
      console.log('schoolList:', schoolList);
      console.log('user.is_superuser:', user.is_superuser);
      
      if (schoolList.length > 0) {
        // If user is superuser, prioritize SUPERADMIN role
        if (user.is_superuser) {
          const superAdminSchool = schoolList.find((us: any) => us.rol === 'SUPERADMIN');
          userSchool = superAdminSchool || schoolList[0];
        } else {
          // CRITICAL FIX: Find and use the correct role based on user's primary assignment
          // NOT just schoolList[0] - this could be wrong if user has multiple roles
          // Try to find DIRECTIVO first (if user has that role), otherwise use first
          const directoSchool = schoolList.find((us: any) => us.rol === 'DIRECTIVO');
          if (directoSchool) {
            userSchool = directoSchool;
          } else {
            userSchool = schoolList[0];
          }
        }
        
        console.log('userSchool selected:', userSchool);
        console.log('userSchool full:', JSON.stringify(userSchool, null, 2));
        console.log('userSchool.rol:', userSchool?.rol);
        
        if (userSchool?.escuela) {
          let schoolSlug: string | null = null;
          if (typeof userSchool.escuela === 'string') {
            schoolSlug = userSchool.escuela;
          } else if (userSchool.escuela && typeof userSchool.escuela === 'object' && 'slug' in userSchool.escuela) {
            schoolSlug = (userSchool.escuela as any).slug;
          }
          if (schoolSlug) {
            setCurrentSchool(schoolSlug);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching userSchool:', e);
    }
    
    set({ 
      user, 
      userSchool,
      isAuthenticated: true, 
      isLoading: false 
    });
  },
  
  logout: async () => {
    await authApi.logout();
    clearTokens();
    set({ 
      user: null, 
      userSchool: null, 
      school: null,
      isAuthenticated: false, 
      isLoading: false 
    });
  },
  
  checkAuth: async () => {
    const token = getAccessToken();
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    
    try {
      const user = await authApi.me();
      
      let userSchool: UserSchool | null = null;
      try {
        const userSchools = await userSchoolApi.list({ activo: true });
        
        let schoolList: any[] = [];
        if (userSchools.results) {
          schoolList = userSchools.results;
        } else if (Array.isArray(userSchools)) {
          schoolList = userSchools;
        }
        
        if (schoolList.length > 0) {
          // If user is superuser, prioritize SUPERADMIN role
          if (user.is_superuser) {
            const superAdminSchool = schoolList.find((us: any) => us.rol === 'SUPERADMIN');
            userSchool = superAdminSchool || schoolList[0];
          } else {
            // CRITICAL FIX: Same logic - prioritize DIRECTIVO if user has that role
            const directoSchool = schoolList.find((us: any) => us.rol === 'DIRECTIVO');
            if (directoSchool) {
              userSchool = directoSchool;
            } else {
              userSchool = schoolList[0];
            }
          }
          
          if (userSchool?.escuela) {
            let schoolSlug: string | null = null;
            if (typeof userSchool.escuela === 'string') {
              schoolSlug = userSchool.escuela;
            } else if (userSchool.escuela && typeof userSchool.escuela === 'object' && 'slug' in userSchool.escuela) {
              schoolSlug = (userSchool.escuela as any).slug;
            }
            if (schoolSlug) {
              setCurrentSchool(schoolSlug);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching userSchool:', e);
      }
      
      set({ user, userSchool, isAuthenticated: true, isLoading: false });
    } catch (error) {
      clearTokens();
      set({ user: null, userSchool: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  setSchool: (school: School) => {
    set({ school });
  },
}));