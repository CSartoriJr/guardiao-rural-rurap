
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FARMER_DASHBOARD: '/farmer/dashboard',
  FARMER_SUBMIT_REQUEST: '/farmer/submit',
  FARMER_VIEW_REQUEST: (id: string) => `/farmer/request/${id}`,
  TECHNICIAN_DASHBOARD: '/technician/dashboard',
  TECHNICIAN_VIEW_REQUEST: (id: string) => `/technician/request/${id}`,
  TECHNICIAN_ANALYTICS_PANEL: '/technician/analytics',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CREATE_TECHNICIAN: '/admin/create-technician',
};
