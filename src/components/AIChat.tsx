import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";
import { Input } from "@/components/ui/input";
import { Send, Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { askGemini } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function AIChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setIsThinking(true);

        // Add a placeholder for the model's response
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        await askGemini(currentInput, (chunk) => {
            if (isThinking) setIsThinking(false);
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, content: lastMessage.content + chunk }
                    ];
                }
                return prev;
            });
        });

        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <Card className="h-[75vh] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <span>AI Business Assistant</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground">
                        Ask me anything about your business data. <br />
                        For example: "What are my top 5 selling products?"
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.role === 'model' && <Avatar className="w-8 h-8"><AvatarFallback><Bot size={20}/></AvatarFallback></Avatar>}
                        <div className={cn("p-3 rounded-lg max-w-2xl", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            <ReactMarkdown className="prose dark:prose-invert">
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                        {msg.role === 'user' && <Avatar className="w-8 h-8"><AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>}
                    </div>
                ))}
                 {(isLoading && isThinking) && (
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="w-8 h-8"><AvatarFallback><Bot size={20}/></AvatarFallback></Avatar>
                        <div className="p-3 rounded-lg bg-muted flex items-center">
                            <span className="italic text-muted-foreground">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>
            <CardContent className="border-t pt-4">
                <div className="flex w-full items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder="e.g., &quot;What was my most profitable day this month?&quot;"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
} 