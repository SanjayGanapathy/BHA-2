import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  BarChart3,
  Brain,
  ShoppingCart,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Advanced Analytics",
      description:
        "Real-time insights into your business performance with comprehensive reporting and forecasting.",
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Insights",
      description:
        "Get intelligent recommendations and automated observations to optimize your business strategy.",
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Modern POS System",
      description:
        "Intuitive tile-based point of sale interface designed for speed and efficiency.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Multi-User Support",
      description:
        "Role-based access control with admin, manager, and cashier permissions.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Inventory Management",
      description:
        "Track stock levels, manage products, and get alerts for low inventory items.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Business Intelligence",
      description:
        "Transform your data into actionable insights with our comprehensive BI platform.",
    },
  ];

  const benefits = [
    "Real-time sales tracking and analytics",
    "AI-powered business recommendations",
    "Comprehensive inventory management",
    "Multi-user access with role permissions",
    "Professional reporting and forecasting",
    "Cloud-ready and scalable architecture",
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Coffee Shop Owner",
      content:
        "Bull Horn Analytics transformed how we understand our business. The AI insights helped us increase profits by 25%.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Restaurant Manager",
      content:
        "The POS system is incredibly intuitive, and the analytics dashboard gives us everything we need to make data-driven decisions.",
      rating: 5,
    },
    {
      name: "Emma Davis",
      role: "Retail Store Owner",
      content:
        "Finally, a system that combines powerful analytics with an easy-to-use POS. Our staff loves it!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-blue-900">
                Bull Horn Analytics
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered Business Intelligence
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-6">
            Smart POS System
            <br />
            <span className="text-blue-600">Built for Success</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your business with our AI-powered analytics platform. Get
            real-time insights, intelligent recommendations, and a modern POS
            system designed for today's businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">10k+</div>
              <div className="text-sm text-gray-600">Businesses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">4.9★</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform combines powerful analytics with an
              intuitive POS system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why choose Bull Horn Analytics?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of businesses that trust our platform to drive
                growth and efficiency.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-blue-50">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-blue-200" />
                  <div className="text-2xl font-bold mb-1">Enterprise</div>
                  <div className="text-blue-200">Security</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-blue-200" />
                  <div className="text-2xl font-bold mb-1">Real-time</div>
                  <div className="text-blue-200">Updates</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Trusted by businesses worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about Bull Horn Analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-blue-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Start your free trial today and see the difference Bull Horn
            Analytics can make.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8 py-3"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-blue-900">
              Bull Horn Analytics
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Smart Business Intelligence & POS System
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <span>© 2024 Bull Horn Analytics. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
