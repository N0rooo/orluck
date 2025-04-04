'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, signupSchema } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { LoginFormValues, SignupFormValues } from '@/types/types';

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Get the active form based on the current mode
  const activeForm = isSignUp ? signupForm : loginForm;

  const onSubmit = async (data: LoginFormValues | SignupFormValues) => {
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `${isSignUp ? 'Sign up' : 'Log in'} failed`);
      }

      // Get the redirected from URL or default to "/"
      const redirectTo = searchParams.get('redirectedFrom') || '/';
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Créer un compte' : 'Connexion'}</CardTitle>
        <CardDescription>
          {isSignUp
            ? 'Entrez vos informations pour créer un nouveau compte'
            : 'Entrez vos identifiants pour vous connecter à votre compte'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={activeForm.handleSubmit(onSubmit)}>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                disabled={isLoading}
                id="username"
                type="text"
                {...signupForm.register('username')}
                className={cn(signupForm.formState.errors.username && 'border-red-500')}
              />
              {signupForm.formState.errors.username && (
                <p className="text-sm text-red-500">
                  {signupForm.formState.errors.username.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              disabled={isLoading}
              id="email"
              type="email"
              {...(isSignUp ? signupForm.register('email') : loginForm.register('email'))}
              className={cn(activeForm.formState.errors.email && 'border-red-500')}
            />
            {activeForm.formState.errors.email && (
              <p className="text-sm text-red-500">{activeForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              disabled={isLoading}
              id="password"
              type="password"
              {...(isSignUp ? signupForm.register('password') : loginForm.register('password'))}
              className={cn(activeForm.formState.errors.password && 'border-red-500')}
            />
            {activeForm.formState.errors.password && (
              <p className="text-sm text-red-500">{activeForm.formState.errors.password.message}</p>
            )}
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                disabled={isLoading}
                id="confirmPassword"
                type="password"
                {...signupForm.register('confirmPassword')}
                className={cn(signupForm.formState.errors.confirmPassword && 'border-red-500')}
              />
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {signupForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? 'Création du compte...' : 'Connexion en cours...'}
              </>
            ) : isSignUp ? (
              "S'inscrire"
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {isSignUp ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}
          </span>
          <div className="flex items-center space-x-2">
            <Button className="cursor-pointer" variant="link" onClick={toggleMode}>
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
