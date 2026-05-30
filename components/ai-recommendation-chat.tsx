"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

interface Message {
  id: string;
  role: "patient" | "assistant";
  content: string;
  createdAt: Date;
}

interface AIRecommendationChatProps {
  chatId: string;
  onRecommendationsReceived?: (specialties: string[]) => void;
}

export function AIRecommendationChat({
  chatId,
  onRecommendationsReceived,
}: AIRecommendationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial message from AI
  useEffect(() => {
    const initialMessage: Message = {
      id: "initial",
      role: "assistant",
      content:
        "Hi! I'm here to help you find the right doctor. Could you tell me about the symptoms or health concerns you've been experiencing?",
      createdAt: new Date(),
    };
    setMessages([initialMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "patient",
      content: input,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get recommendation");
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.aiResponse,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Notify parent if recommendations were made
      if (data.recommendedSpecialties?.length > 0) {
        onRecommendationsReceived?.(data.recommendedSpecialties);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "patient" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === "patient"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="flex gap-2">
        <Input
          placeholder="Type your response..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) =>
            e.key === "Enter" && !isLoading && handleSendMessage()
          }
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
