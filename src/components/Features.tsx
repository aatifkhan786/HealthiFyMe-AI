// import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Scan, 
  Calculator, 
  BookOpen, 
  Target, 
  Brain, 
  TrendingUp,
  // Utensils,
  Activity
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Scan className="w-8 h-8" />,
      title: "Smart Food Scanner",
      description: "Instantly scan any food item and get detailed nutritional information with AI-powered analysis.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Health Calculator",
      description: "Calculate ideal body weight, BMI, and personalized daily nutrition targets based on your profile.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Diet Plans",
      description: "Get personalized meal plans tailored to your health conditions, preferences, and goals.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Progress Tracking",
      description: "Monitor your daily nutrition intake with beautiful charts and achieve your health goals.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Health Blog",
      description: "Access AI-generated health tips, nutrition advice, and wellness content tailored for you.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Goal Setting",
      description: "Set and track personalized health goals with intelligent recommendations and reminders.",
      gradient: "from-indigo-500 to-blue-500"
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Your Health Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover comprehensive tools designed to make health management simple, effective, and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button variant="hero" size="lg" className="group">
            Explore All Features
            <Activity className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;