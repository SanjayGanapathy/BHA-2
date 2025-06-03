import React, { useState, useEffect } from "react";
import { POSLayout } from "@/components/layout/POSLayout";
import { InsightCard } from "@/components/ai/InsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  MessageSquare,
  Send,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Eye,
  Sparkles,
} from "lucide-react";
import { AnalyticsEngine } from "@/lib/analytics";
import { AIInsight } from "@/types";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    loadInsights();
    initializeChat();
  }, []);

  const loadInsights = () => {
    setIsGenerating(true);
    try {
      const insightsData = AnalyticsEngine.generateAIInsights();
      setInsights(insightsData);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: "ai",
      content: `Hello! I'm your AI business assistant. I can help you analyze your sales data, provide recommendations, and answer questions about your business performance. 

Here are some things you can ask me:
• "How are my sales trending this month?"
• "Which products should I restock?"
• "What's my most profitable category?"
• "Give me marketing suggestions for slow-moving items"

What would you like to know?`,
      timestamp: new Date(),
    };
    setChatMessages([welcomeMessage]);
  };

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Simple rule-based responses for demo (in production, use actual AI/LLM)
    if (message.includes("sales") && message.includes("trend")) {
      return "Based on your recent sales data, I notice a positive trend with revenue increasing by 12% compared to last month. Your beverage category is performing particularly well, while pastries show some seasonal fluctuation. I recommend focusing on promoting high-margin items during peak hours.";
    }

    if (message.includes("restock") || message.includes("inventory")) {
      return "Looking at your current inventory levels, I recommend restocking these items soon: Coffee beans (7 units left), Croissants (3 units left), and Orange Juice (5 units left). These are popular items that could lead to lost sales if they run out.";
    }

    if (message.includes("profit") || message.includes("margin")) {
      return "Your overall profit margin is healthy at 32.5%. Beverages show the strongest margins (45%), while food items average 28%. Consider adjusting pricing on lower-margin items or negotiating better supplier costs to improve profitability.";
    }

    if (message.includes("marketing") || message.includes("promotion")) {
      return "For marketing suggestions: 1) Bundle slow-moving pastries with popular beverages, 2) Create a loyalty program for frequent customers, 3) Offer 'happy hour' discounts during slower periods (2-4 PM), 4) Promote seasonal items through social media. These strategies could boost overall sales by 15-20%.";
    }

    if (message.includes("forecast") || message.includes("predict")) {
      return "Based on historical patterns and current trends, I predict next month's revenue will be approximately $12,400 with 85% confidence. Key factors: seasonal demand increase, new product introductions, and improved customer retention. Monitor these metrics closely for accuracy.";
    }

    // Default response
    return `That's an interesting question about "${userMessage}". Based on your business data, I'd recommend focusing on your top-performing products and monitoring key metrics like inventory levels, profit margins, and customer patterns. Would you like me to analyze any specific aspect of your business performance?`;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiResponse: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      type: "ai",
      content: generateAIResponse(chatInput),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, aiResponse]);
    setIsChatLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "recommendation":
        return <Lightbulb className="h-4 w-4" />;
      case "forecast":
        return <TrendingUp className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "observation":
        return <Eye className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const insightCounts = insights.reduce(
    (acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              AI Insights
            </h1>
            <p className="text-muted-foreground">
              AI-powered analysis and recommendations for your business
            </p>
          </div>

          <Button
            onClick={loadInsights}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
            />
            Refresh Insights
          </Button>
        </div>

        {/* Insights Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Insights
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recommendations
              </CardTitle>
              <Lightbulb className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {insightCounts.recommendation || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {insightCounts.alert || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecasts</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {insightCounts.forecast || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Insights */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Generated Insights</h2>
              <Badge variant="secondary" className="text-xs">
                Auto-updated
              </Badge>
            </div>

            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    No insights available yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete some sales transactions to generate AI insights
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Chat Assistant */}
          <div className="flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">AI Assistant</h2>
              <Badge variant="outline" className="text-xs gap-1">
                <MessageSquare className="h-3 w-3" />
                Live Chat
              </Badge>
            </div>

            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Business Assistant
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 border rounded-md bg-muted/20">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me about your business performance..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isChatLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Demo Notice */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            This AI assistant uses simulated responses for demonstration
            purposes. In a production environment, it would integrate with
            advanced language models to provide real-time business insights and
            recommendations.
          </AlertDescription>
        </Alert>
      </div>
    </POSLayout>
  );
}
