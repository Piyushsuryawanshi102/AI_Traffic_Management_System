import axios from 'axios';

const API_BASE_URL = 'https://industrious-victory-production-ae1a.up.railway.app'; 

const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * 🛡️ AUTH INTERCEPTOR
 * Automatically attaches the JWT 'access_token' from Login.tsx 
 * to every outgoing request for Officer/Admin verification.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // ==========================================
  // 🔐 AUTHENTICATION
  // ==========================================
  login: async (formData: FormData) => {
    // Convert FormData to URLSearchParams for FastAPI's OAuth2PasswordRequestForm compatibility
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      params.append(key, value.toString());
    }

    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  // ==========================================
  // 📹 AI SURVEILLANCE (OMEN 16 GPU ENGINE)
  // ==========================================
  getCameras: () => api.get('/cameras/list'),

  registerCamera: async (cameraData: { 
    location_name: string; 
    ip_address: string; 
    latitude?: number; 
    longitude?: number 
  }) => {
    return api.post('/cameras/register', cameraData);
  },

  deleteCamera: (id: string) => api.delete(`/cameras/${id}`),

  // ==========================================
  // 🚨 VIOLATION & CHALLAN DATABASE
  // ==========================================
  getViolations: (plate?: string) => 
   api.get('/violations/', { params: { plate_number: plate } }),

  // 🔥 NEW: Method to issue a manual challan from Officer Dashboard
  issueChallan: (data: {
    violation_type: string;
    vehicle_number: string;
    location: string;
    owner_name: string;
    status: string;
  }) => api.post('/violations/issue', data),

  // ==========================================
  // 🚦 TRAFFIC CONGESTION & AI SIGNALS (Statement 7)
  // ==========================================
  // Fetches unified road + signal telemetry from congested_roads table
  getCongestion: () => api.get('/traffic/congestion'),
  
  // 🔥 NEW: AI Logic sync - Updates density and signal state automatically
  autoAdjustSignal: (data: { camera_id: string; vehicle_count: number; is_emergency?: boolean }) =>
    api.post('/traffic/auto-adjust', data),
  
  getAccidentAnalytics: () => api.get('/traffic/analytics'),
  
  getLiveAccidents: () => api.get('/traffic/live-accidents'),
  
  reportAccident: (data: { 
    severity: string; 
    description: string;
    injuries: number;
    fatalities: number;
    latitude: number;
    longitude: number;
    location?: string;
  }) => api.post('/traffic/accident', data),

  // ==========================================
  // 🅿️ INFRASTRUCTURE (PARKING MANAGEMENT)
  // ==========================================
  getParking: () => api.get('/parking/'),
  
  createParkingLot: (lotData: { name: string, location: string, total_slots: number, occupied?: number }) => 
    api.post('/parking/', lotData),

  updateParkingLot: (id: string, lotData: any) => 
    api.put(`/parking/${id}`, lotData),

  deleteParkingLot: (id: string) => 
    api.delete(`/parking/${id}`), 

  // ==========================================
  // 💳 PAYMENTS, AUDITS & CITIZEN PORTAL
  // ==========================================
  getAllPayments: () => api.get('/payments/all'),
  
  getAuditLogs: () => api.get('/audit/logs'),

  // 🔥 UPDATED: Uses direct axios to bypass the Auth Interceptor for public searching
  getCitizenChallans: async (plateNumber: string) => {
    const response = await axios.get(`${API_BASE_URL}/citizen/my-challans/${plateNumber}`);
    return response.data;
  },

  // 🔥 UPDATED: Uses direct axios to ensure no 'Authorization' header is sent for public payment
  payChallan: async (id: string) => {
    return axios.post(`${API_BASE_URL}/citizen/pay/${id}`);
  },
};

export default apiService;