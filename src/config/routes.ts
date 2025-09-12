
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  TERMS_AND_PRIVACY: '/termos-e-privacidade', // Added new route
  FARMER_REGISTER: '/register/farmer',
  FARMER_DASHBOARD: '/farmer/dashboard',
  FARMER_SUBMIT_REQUEST: '/farmer/submit',
  FARMER_VIEW_REQUEST: (id: string) => `/farmer/request/${id}`,
  TECHNICIAN_DASHBOARD: '/technician/dashboard',
  TECHNICIAN_SUBMIT_REQUEST: '/technician/submit',
  TECHNICIAN_VIEW_REQUEST: (id: string) => `/technician/request/${id}`,
  TECHNICIAN_ANALYTICS_PANEL: '/technician/analytics',
  TECHNICIAN_REGISTER_FARMER: '/technician/register-farmer',
  TECHNICIAN_REGISTER_FARMER_SUCCESS: '/technician/register-farmer/success',
  TECHNICIAN_FARMERS_LIST: '/technician/farmers', // Added route for farmer list
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CREATE_TECHNICIAN: '/admin/create-technician',
  ADMIN_CREATE_ADMIN: '/admin/create-admin',
  ADMIN_MANAGE_USERS: '/admin/users',
};
