import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email?: string;
    phone?: string;
    name: string;
    role: string;
    avatarUrl?: string;
  } | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string; user: any }>
    ) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
