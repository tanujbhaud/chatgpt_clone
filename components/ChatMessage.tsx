"use client";
import { EditIcon, HistoryIcon } from "lucide-react";
import { useState } from "react";
import type { Branch, Message } from "@/types";
// components/chat/ChatMessage.tsx
interface ChatMessageProps {
  message: Message;
  branch: Branch;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
}

export default function ChatMessage({
  message,
  branch,
  onEdit,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = async () => {
    await onEdit(message.id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="mb-4">
      <div className="flex gap-4 items-start">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {message.role === "user" ? "👨‍🦱" : "🤖"}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 bg-white/5 rounded-lg resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-500 rounded-md text-sm"
                >
                  Save & Submit
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-500 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <div className="bg-white/5 rounded-lg p-4">{message.content}</div>
              {message.role === "user" && (
                <div className="absolute right-2 top-2 hidden group-hover:flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {!branch.is_main && (
        <div className="ml-12 mt-1 text-xs text-gray-400">
          Branch: {branch.name}
        </div>
      )}
    </div>
  );
}
