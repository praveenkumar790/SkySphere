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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  organizationName: z.string().optional(),
  joinCode: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.organizationName || data.joinCode, {
  message: "Either organization name or join code is required",
  path: ["organizationName"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, clearErrors } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  const toggleJoin = (joining: boolean) => {
    setIsJoining(joining);
    // Clear the other field
    if (joining) {
      setValue('organizationName', '');
    } else {
      setValue('joinCode', '');
    }
    clearErrors();
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
        className="relative z-10 w-full max-w-[450px] px-4 -mt-16"
      >
        <Card className="border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col w-[500px]">
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col items-center">
              <h1 className="text-xl font-bold text-white tracking-tight">Register Fleet</h1>
              <p className="text-xs text-gray-400 mt-1">Join the decentralized operation network.</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-white/5 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => toggleJoin(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!isJoining ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Create Org
              </button>
              <button
                type="button"
                onClick={() => toggleJoin(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${isJoining ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Join Org
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="name" className="text-xs text-gray-400 ml-1">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register('name')}
                    className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors h-10 ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <span className="text-[10px] text-red-500 ml-1 italic absolute">{errors.name.message}</span>}
                </div>

                {!isJoining ? (
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="organizationName" className="text-xs text-gray-400 ml-1">Company Name</Label>
                    <Input
                      id="organizationName"
                      placeholder="Global Logistics"
                      {...register('organizationName')}
                      className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors h-10 ${errors.organizationName ? 'border-red-500' : ''}`}
                    />
                    {errors.organizationName && <span className="text-[10px] text-red-500 ml-1 italic absolute">{errors.organizationName.message}</span>}
                  </div>
                ) : (
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="joinCode" className="text-xs text-gray-400 ml-1">Join Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="SKY-XXXX"
                      {...register('joinCode')}
                      autoComplete="off"
                      className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors h-10 text-center tracking-[0.2em] font-mono ${errors.joinCode ? 'border-red-500' : ''}`}
                    />
                    {errors.joinCode && <span className="text-[10px] text-red-500 ml-1 italic absolute">{errors.joinCode.message}</span>}
                  </div>
                )}
              </div>

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
                {isSubmitting ? 'Processing...' : (isJoining ? 'Join Organization' : 'Create Organization')}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-blue-400 transition-colors underline-offset-4 hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

