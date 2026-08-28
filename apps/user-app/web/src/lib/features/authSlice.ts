import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
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
  user: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any }>
    ) => {
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
