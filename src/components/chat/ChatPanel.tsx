import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { Send, Leaf, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatPanel = ({ open, onOpenChange }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu Asesor Verde 🌿. Puedo ayudarte a comparar productos, optimizar tu lista o explicarte el impacto ecológico de tus compras. ¿Qué te gustaría saber hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-asesor-verde`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Límite excedido",
            description: "Demasiadas solicitudes. Espera un momento e intenta nuevamente.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Créditos insuficientes",
            description: "No hay créditos disponibles. Contacta al administrador.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Error en la respuesta del servidor");
      }

      if (!response.body) throw new Error("No hay cuerpo en la respuesta");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      // Crear mensaje del asistente vacío
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage
                };
                return newMessages;
              });
            }
          } catch {
            // JSON incompleto, continuar esperando más datos
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush final del buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage
                };
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error("Error en el chat:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener una respuesta. Intenta nuevamente.",
        variant: "destructive",
      });
      // Eliminar el mensaje de asistente vacío si hubo error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[440px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <SheetTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold">Asesor Verde</div>
              <div className="text-xs text-muted-foreground font-normal">Tu guía de compras sostenibles</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} content={msg.content} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <p className="text-sm text-muted-foreground">Pensando...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregúntame sobre productos sostenibles..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Respuestas generadas por IA • Verifica la información
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
