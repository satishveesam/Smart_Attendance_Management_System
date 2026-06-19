import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
const userJson = localStorage.getItem('user');
let user = null;

try {
  if (userJson) {
    user = JSON.parse(userJson);
  }
} catch (e) {
  console.error("Failed to parse user from localStorage", e);
}

const initialState = {
  token: token || null,
  user: user,
  isAuthenticated: !!token && !!user,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = {
        userId: action.payload.userId,
        username: action.payload.username,
        email: action.payload.email,
        role: action.payload.role,
        employeeId: action.payload.employeeId,
        employeeCode: action.payload.employeeCode,
      };
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
