import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary shadow-elegant">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">HealthifyMe AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/scanner" className="text-muted-foreground hover:text-primary transition-colors">
                  Scanner
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
                <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">
                  What Users Say
                </a>
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Button variant="ghost" onClick={handleAuthAction}>
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Login
                </Button>
                <Button variant="hero" onClick={() => navigate('/auth')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors py-2">
                    Dashboard
                  </Link>
                  <Link to="/scanner" className="text-muted-foreground hover:text-primary transition-colors py-2">
                    Scanner
                  </Link>
                  <div className="pt-4">
                    <Button variant="ghost" className="w-full" onClick={handleAuthAction}>
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <a href="#features" className="text-muted-foreground hover:text-primary transition-colors py-2">
                    Features
                  </a>
                  <a href="#blog" className="text-muted-foreground hover:text-primary transition-colors py-2">
                    Blog
                  </a>
                  <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors py-2">
                    What Users Say
                  </a>
                  <div className="flex flex-col space-y-2 pt-4">
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
                      Login
                    </Button>
                    <Button variant="hero" className="w-full" onClick={() => navigate('/auth')}>
                      Sign Up
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;