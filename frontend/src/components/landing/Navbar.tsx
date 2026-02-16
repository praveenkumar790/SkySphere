import { useState, useEffect } from 'react';
import { Hexagon, Menu, X, User, LogOut, Building2, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Highlight active link
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    ...(isAuthenticated ? [
      { name: 'Fleet', path: '/dashboard' },
      { name: 'Missions', path: '/missions' },
      { name: 'Analysis', path: '/reports' },
      ...(user?.role === 'ORG_ADMIN' ? [{ name: 'Team', path: '/team' }] : [])
    ] : [])
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/60 backdrop-blur-xl py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8">
            <Hexagon className="w-8 h-8 text-blue-500 fill-blue-500/20 stroke-[1.5] transition-transform duration-700 group-hover:rotate-90" />
            <div className="absolute inset-0 bg-blue-500/40 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            SkySphere
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="relative py-1 text-sm font-medium transition-colors group"
            >
              <span className={`relative z-10 transition-colors duration-300 ${isActive(link.path) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                {link.name}
              </span>
              {isActive(link.path) && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30 shadow-[0_0_10px_rgba(37,99,235,0.2)] hover:bg-blue-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer">
                    <User className="h-5 w-5 text-blue-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-black/95 backdrop-blur-2xl border-white/10 text-white p-2" align="end" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-white tracking-wide">{user?.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <p className="text-xs leading-none text-blue-400/80 font-mono">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  
                  <div className="px-1 py-1">
                    <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-blue-500/10 cursor-pointer rounded-md transition-all duration-200 group">
                      <ShieldCheck className="w-4 h-4 mr-3 text-blue-500 group-hover:text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 group-hover:text-gray-400 font-bold">Role</span>
                        <span className="text-xs font-mono">{user?.role}</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-blue-500/10 cursor-pointer rounded-md transition-all duration-200 mt-1 group">
                      <Building2 className="w-4 h-4 mr-3 text-blue-500 group-hover:text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 group-hover:text-gray-400 font-bold">Organization</span>
                        <span className="text-xs font-mono">{user?.organization?.name}</span>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  
                  <DropdownMenuItem 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer rounded-md transition-all duration-200 p-2 mt-1"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-bold tracking-wider text-xs uppercase">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5 rounded-full h-9 px-4">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 text-white hover:bg-blue-500 rounded-full h-9 px-6 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white/70 hover:text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-medium transition-colors ${
                    isActive(link.path) 
                      ? 'text-blue-500' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="h-px bg-white/10 my-2" />

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{user?.name}</div>
                      <div className="text-xs text-blue-400 font-mono">{user?.organization?.name}</div>
                    </div>
                    <Button 
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-500">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
