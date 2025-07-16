import React, { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setInput("");
    // TODO: enviar al backend y añadir respuesta del assistant
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-xl border border-[#cedbe8] mb-4">
        {messages.length === 0 && (
          <div className="text-[#49739c] text-center">¡Haz tu primera pregunta sobre tus documentos!</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-xl px-4 py-2 max-w-[70%] ${msg.role === "user" ? "bg-[#e7edf4] text-[#0d141c]" : "bg-[#0c7ff2] text-white"}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-xl border border-[#cedbe8] p-3 text-base focus:outline-none focus:ring-2 focus:ring-[#0c7ff2]"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="h-12 px-6 rounded-xl bg-[#0c7ff2] text-white font-bold text-base"
          onClick={handleSend}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Chat; 