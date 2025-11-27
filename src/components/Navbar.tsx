import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

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
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">

          {/* === LEFT SIDE: LOGO (5% FROM LEFT EDGE) === */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-all absolute left-[-5%]"
          >
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 align-middle block" />
            <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              HealthifyMe AI
            </span>
          </Link>

          {/* === CENTER LINKS === */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/scanner"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Scanner
                </Link>
                <Link
                  to="/blog"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Blog
                </Link>
                <Link
                  to="/aitalk"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  AI Talk
                </Link>

                {/* === NEW ADDED EXERCISE BUTTON === */}
                <Link
                  to="/exercise"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Exercise
                </Link>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </a>
                <a
                  href="#blog"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Blog
                </a>
                <a
                  href="#testimonials"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  What Users Say
                </a>
              </>
            )}
          </div>

          {/* === RIGHT SIDE: AUTH BUTTONS (5% FROM RIGHT EDGE) === */}
          <div className="hidden md:flex items-center space-x-3 absolute right-[-3%]">
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

          {/* === MOBILE MENU BUTTON === */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-primary absolute right-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* === MOBILE MENU === */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/scanner"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Scanner
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Blog
                  </Link>
                  <Link
                    to="/aitalk"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    AI Talk
                  </Link>

                  {/* === NEW ADDED EXERCISE (MOBILE) === */}
                  <Link
                    to="/exercise"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Exercise
                  </Link>

                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={handleAuthAction}
                    >
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="#features"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Features
                  </a>
                  <a
                    href="#blog"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Blog
                  </a>
                  <a
                    href="#testimonials"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    What Users Say
                  </a>
                  <div className="flex flex-col space-y-2 pt-4">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                    >
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
