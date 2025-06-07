import React from 'react';
import { AIChat } from '@/components/AIChat';
import { Info } from 'lucide-react';

export default function AIInsights() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
      <p className="text-muted-foreground max-w-2xl">
        Engage with your intelligent business assistant. Ask questions about your sales, products, and customer trends to get real-time, data-driven answers.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Info className="h-5 w-5 text-primary" />
        <p className="text-sm text-primary/80">
          The insights provided by the AI are based on your business data and are intended for informational purposes. They are not financial or legal advice.
        </p>
      </div>
      <AIChat />
    </div>
  );
}
