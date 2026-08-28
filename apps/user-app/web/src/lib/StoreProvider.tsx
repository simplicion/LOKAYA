'use client';

import { Provider } from 'react-redux';
import { store, persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthInitializer } from './AuthInitializer';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthInitializer>
          <GoogleOAuthProvider clientId={googleClientId}>
            {children}
          </GoogleOAuthProvider>
        </AuthInitializer>
      </PersistGate>
    </Provider>
  );
}
