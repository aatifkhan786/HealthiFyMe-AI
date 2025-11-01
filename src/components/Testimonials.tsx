// import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      content: "HealthifyMe AI completely transformed my approach to nutrition. The food scanner is incredibly accurate and the personalized meal plans helped me lose 15 pounds!",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Dr. Michael Chen",
      role: "Nutritionist",
      content: "As a professional, I'm impressed by the AI's accuracy in nutritional analysis. I recommend this app to all my patients for tracking their dietary habits.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Diabetes Patient",
      content: "Managing my diabetes became so much easier with the health condition-specific recommendations. The app understands my dietary restrictions perfectly.",
      rating: 5,
      avatar: "ER"
    },
    {
      name: "James Wilson",
      role: "Busy Professional",
      content: "The convenience of scanning food and getting instant nutrition info is a game-changer. Perfect for my hectic lifestyle and health goals.",
      rating: 5,
      avatar: "JW"
    },
    {
      name: "Lisa Thompson",
      role: "Yoga Instructor",
      content: "The holistic approach to health tracking aligns perfectly with my wellness philosophy. My students love the personalized diet recommendations!",
      rating: 5,
      avatar: "LT"
    },
    {
      name: "Robert Kim",
      role: "Heart Patient",
      content: "After my heart surgery, this app helped me maintain a heart-healthy diet effortlessly. The AI considerations for my condition are spot-on.",
      rating: 5,
      avatar: "RK"
    }
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their health journey with HealthifyMe AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-primary/30" />
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <Star className="w-5 h-5 mr-2 fill-current" />
            <span className="font-semibold">4.9/5 Average Rating</span>
            <span className="mx-2">•</span>
            <span>50,000+ Happy Users</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;