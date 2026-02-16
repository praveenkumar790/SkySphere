import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#050505] relative overflow-hidden pt-20">
      {/* Background Polish */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-600/50 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-[400px] px-4"
      >
        <Card className="border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col">
          <CardContent className="pt-6">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-white tracking-tight">Welcome Back</h1>
              <p className="text-xs text-gray-400 mt-1">Enter your credentials to access the terminal.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-xs text-gray-400 ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@skysphere.io"
                  {...register('email')}
                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors h-10 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <span className="text-[10px] text-red-500 ml-1 italic">{errors.email.message}</span>}
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="password" className="text-xs text-gray-400 ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={`bg-white/5 border-white/10 text-white focus:border-blue-500/50 transition-colors h-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && <span className="text-[10px] text-red-500 ml-1 italic">{errors.password.message}</span>}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full h-10 bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">
              New Operator?{' '}
              <Link to="/register" className="text-white hover:text-blue-400 transition-colors underline-offset-4 hover:underline">
                Register Fleet
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
