// import React from 'react';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">HealthifyMe AI</span>
            </div>
            <p className="text-background/70 leading-relaxed">
              Transform your health journey with AI-powered nutrition tracking and personalized wellness solutions.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="border-background/20 text-background hover:bg-background/10">
                Get Started
              </Button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
              <li><a href="#scanner" className="hover:text-background transition-colors">Food Scanner</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Diet Plans</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Health Calculator</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Progress Tracking</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#blog" className="hover:text-background transition-colors">Health Blog</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Nutrition Guide</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Recipe Database</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Help Center</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-background/70">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@healthifymeai.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-background/70 text-sm">
            © 2024 HealthifyMe AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-background/70 hover:text-background text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/70 hover:text-background text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-background/70 hover:text-background text-sm transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;