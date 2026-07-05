'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('BUYER'); // BUYER or SELLER_ADMIN
  const [register, { isLoading }] = useRegisterMutation();
  const [googleLoginMut] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const result = await googleLoginMut({ token: credentialResponse.credential, role }).unwrap();
      dispatch(setCredentials({ token: result.token, user: result.user }));
      toast.success('Login with Google successful');
      
      if (result.user.role === 'BUYER') {
        router.push('/buyer');
      } else {
        router.push('/seller');
      }
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Google login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register({ email, password, name, role }).unwrap();
      dispatch(setCredentials({ token: result.token, user: result.user }));
      toast.success('Registration successful');
      
      if (result.user.role === 'BUYER') {
        router.push('/buyer');
      } else {
        router.push('/seller');
      }
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>I want to...</Label>
              <RadioGroup value={role} onValueChange={setRole} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BUYER" id="role-buyer" />
                  <Label htmlFor="role-buyer" className="font-normal cursor-pointer">Buy from local stores</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SELLER_ADMIN" id="role-seller" />
                  <Label htmlFor="role-seller" className="font-normal cursor-pointer">Sell products (Store Owner)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Login Failed')}
              />
            </div>

            <div className="text-sm text-center text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
