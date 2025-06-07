import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabaseClient';

// 1. Get the API key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

// 2. Add a more specific check for the API key
if (!GEMINI_API_KEY) {
  throw new Error("VITE_GOOGLE_AI_API_KEY is not defined in your .env.local file. Please add it to enable AI features.");
}

// 3. Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 4. Enhanced function to get business context from Supabase
async function getBusinessContext() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
            created_at, 
            total, 
            profit,
            sale_items (
                quantity,
                products (
                    name,
                    category,
                    price,
                    cost
                )
            )
        `)
        .order('created_at', { ascending: false })
        .gte('created_at', thirtyDaysAgo)
        .limit(100);

    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('name, category, price, cost, stock')
        .order('name')
        .limit(100);
    
    const { data: lowStockProducts, error: lowStockError } = await supabase
        .from('products')
        .select('name, stock')
        .lt('stock', 10)
        .order('stock', { ascending: true });


    if (salesError || productsError || lowStockError) {
        const errorMessage = salesError?.message || productsError?.message || lowStockError?.message;
        console.error("Database query failed:", errorMessage);
        return `Error fetching business data: ${errorMessage}`;
    }

    // 5. Create a more structured and detailed context prompt
    return `
You are an expert business analytics assistant for a company named "Bull Horn Analytics".
Your role is to provide data-driven insights based on the information provided.
Analyze the following data to answer the user's questions. Be concise and clear in your responses.

Here is a summary of the business data for the last 30 days:

Product Catalog Summary:
- Total number of products: ${products?.length}
- A snippet of products: ${JSON.stringify(products?.slice(0, 5).map(p => ({ name: p.name, category: p.category, price: p.price, cost: p.cost, stock: p.stock })), null, 2)}

Recent Sales Data (last 30 days):
- Total number of sales transactions: ${sales?.length}
- A summary of recent sales: ${JSON.stringify(sales?.slice(0, 5).map(s => ({ date: s.created_at, total: s.total, profit: s.profit, items: s.sale_items.length })), null, 2)}

Low Stock Alert:
- Products with stock less than 10: ${JSON.stringify(lowStockProducts, null, 2)}

Use the above information to formulate your response. If the user asks about something not in the data, state that clearly.
Do not make up information. Base all your answers on the data provided.
    `;
}

// 6. Modified function to handle streaming responses
export async function askGemini(
    prompt: string,
    onUpdate: (chunk: string) => void
): Promise<void> {
    try {
        const context = await getBusinessContext();
        if (context.startsWith("Error")) {
            onUpdate(context); // Stream back the error message
            return;
        }

        const fullPrompt = `${context}\n\nUser Question: "${prompt}"\n\nInsightful Answer:`;
        
        const result = await model.generateContentStream(fullPrompt);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            onUpdate(chunkText);
        }

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        let errorMessage = "An error occurred while communicating with the AI.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                errorMessage = "The Gemini API key is not valid. Please check your VITE_GOOGLE_AI_API_KEY in the .env.local file.";
            } else {
                errorMessage = `Error: ${error.message}`;
            }
        }
        onUpdate(errorMessage);
    }
}

// 7. New function to get specific dashboard insights
export async function getDashboardInsights(): Promise<AIInsight[]> {
    try {
        const context = await getBusinessContext();
        if (context.startsWith("Error")) {
            console.error("Dashboard insights failed to get context:", context);
            // Return empty array or some default state on error
            return [];
        }

        const insightPrompts = [
            "Based on the data, what is the top selling product category this month? Provide a brief summary.",
            "Identify the period of the day with the lowest sales volume and suggest a promotion.",
            "List the top 3 products that are running low on stock (less than 10 units)."
        ];

        const insightPromises = insightPrompts.map(prompt => 
            model.generateContent(
                `${context}\n\nUser Question: "${prompt}"\n\nInsightful Answer (provide a title, description, impact level (low, medium, or high), and type (recommendation, observation, or alert) in JSON format):`
            )
        );

        const results = await Promise.all(insightPromises);

        const insights: AIInsight[] = results.map((result, index) => {
            try {
                // The response is often wrapped in markdown code fences (```json ... ```)
                const jsonString = result.response.text().replace(/```json\n?|```/g, '').trim();
                const parsed = JSON.parse(jsonString);
                
                return {
                    id: (index + 1).toString(),
                    title: parsed.title || `Insight ${index + 1}`,
                    description: parsed.description || "No description available.",
                    impact: parsed.impact || 'low',
                    type: parsed.type || 'observation',
                    timestamp: new Date()
                };
            } catch (e) {
                console.error("Failed to parse insight JSON:", result.response.text(), e);
                return {
                    id: (index + 1).toString(),
                    title: "AI Response Error",
                    description: "The AI returned a response that could not be parsed.",
                    impact: 'low',
                    type: 'alert',
                    timestamp: new Date()
                }
            }
        });

        return insights;

    } catch (error) {
        console.error("Error fetching dashboard insights from Gemini:", error);
        return [];
    }
}