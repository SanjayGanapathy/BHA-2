// src/pages/Landing.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, BarChart3, Brain, Package, ShoppingCart, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: 'Point of Sale',
    description: 'A fast, intuitive POS system to manage transactions with ease.',
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: 'Inventory Management',
    description: 'Keep track of your stock levels in real-time to prevent shortages.',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: 'Sales Analytics',
    description: 'Visualize your sales data with beautiful charts and powerful filters.',
  },
  {
    icon: <Brain className="h-8 w-8 text-primary" />,
    title: "Bull's Eye AI",
    description: 'Get actionable, AI-powered insights to grow your business faster.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-blue-900">Bull Horn Analytics</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-gradient-to-br from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-blue-900">
              Turn Your Data Into Your Advantage
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Bull Horn Analytics combines a powerful Point-of-Sale system with
              AI-driven business intelligence to help you make smarter decisions.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/dashboard">Launch App</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-900">
                Everything You Need to Succeed
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                All the tools you need, integrated in one seamless platform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-100">
        <div className="container mx-auto flex items-center justify-between p-4 px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Bull Horn Analytics. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-primary">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}