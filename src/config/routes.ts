
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  TERMS_AND_PRIVACY: '/termos-e-privacidade', // Added new route
  FARMER_REGISTER: '/register/farmer',
  FARMER_DASHBOARD: '/farmer/dashboard',
  FARMER_SUBMIT_REQUEST: '/farmer/submit',
  FARMER_VIEW_REQUEST: (id: string) => `/farmer/request/${id}`,
  TECNICO_DASHBOARD: '/tecnico/dashboard',
  TECNICO_SUBMIT_REQUEST: '/tecnico/submit',
  TECNICO_VIEW_REQUEST: (id: string) => `/tecnico/request/${id}`,
  TECNICO_ANALYTICS_PANEL: '/tecnico/analytics',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CREATE_TECNICO: '/admin/create-tecnico',
  ADMIN_CREATE_ADMIN: '/admin/create-admin',
  ADMIN_MANAGE_USERS: '/admin/users',
};
