// app/chat/chat-interface.tsx
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { EditIcon, PlusIcon, SendIcon, TrashIcon } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import type { Branch, Conversation, Message } from "@/types";
interface ChatInterfaceProps {
  user: User;
}

const ChatInput = ({
  conversationId,
  branchId,
  onMessageSent,
  setIsLoading,
}: {
  conversationId: string | null;
  branchId: string | null;
  onMessageSent: () => void;
  setIsLoading: (isLoading: boolean) => void;
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    if (!message.trim() || !conversationId || !branchId || isSending) return;

    try {
      setIsSending(true);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          conversationId,
          branchId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      onMessageSent();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  // ChatInput component render part
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  return (
    <div className="border-t border-white/10 p-4">
      <div className="max-w-3xl mx-auto relative">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            rows={1}
            placeholder="Send a message..."
            className="w-full px-4 py-3 pr-12 rounded-lg bg-[#222] border border-white/10 focus:outline-none focus:border-white/20 resize-none text-white placeholder-gray-500 max-h-[200px] overflow-y-auto"
            style={{ minHeight: "44px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            disabled={!message.trim() || !conversationId || !branchId}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const handleNewChat = async () => {
    try {
      console.log("Creating new chat...");

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: user.id,
            title: "New Chat",
          },
        ])
        .select()
        .single();

      console.log("Created conversation:", conversation);
      if (convError) throw convError;

      // Create main branch
      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .insert([
          {
            conversation_id: conversation.id,
            name: "Main",
            is_main: true,
          },
        ])
        .select()
        .single();

      console.log("Created branch:", branch);
      if (branchError) throw branchError;

      // Update UI immediately
      setActiveConversationId(conversation.id);
      setActiveBranchId(branch.id);
      setConversations((prev) => [conversation, ...prev]);
      setBranches((prev) => [branch, ...prev]);
      setMessages([]);

      console.log("States updated:", {
        activeConversationId: conversation.id,
        activeBranchId: branch.id,
        conversations: [conversation],
        branches: [branch],
      });
    } catch (error) {
      console.error("Error creating new chat:", error);
      alert("Failed to create new chat. Please try again.");
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      setIsLoading(true);
      console.log("Editing message:", { messageId, newContent });

      // Find the message to edit
      const messageToEdit = messages.find((m) => m.id === messageId);
      if (!messageToEdit || !activeConversationId) {
        console.warn("Message to edit not found or conversation not active.", {
          messageId,
          activeConversationId,
        });
        return;
      }

      console.log("Found message to edit:", messageToEdit);

      // Generate new branch name
      const timestamp = new Date().toLocaleString();
      const currentBranch = branches.find(
        (b) => b.id === messageToEdit.branch_id
      );
      const newBranchName = `${currentBranch?.name || "Main"} Edit ${timestamp}`;
      console.log("Generated new branch name:", newBranchName);

      // Create new branch
      const { data: newBranch, error: branchError } = await supabase
        .from("branches")
        .insert({
          conversation_id: activeConversationId,
          name: newBranchName,
          is_main: false,
          parent_branch_id: messageToEdit.branch_id,
          forked_from_message_id: messageId,
        })
        .select()
        .single();

      if (branchError) {
        console.error("Error creating new branch:", branchError);
        throw branchError;
      }

      console.log("Created new branch:", newBranch);

      // Duplicate previous messages in the new branch
      const previousMessages = messages.filter(
        (m) =>
          m.position < messageToEdit.position &&
          m.branch_id === messageToEdit.branch_id
      );
      console.log("Previous messages to duplicate:", previousMessages);

      for (const msg of previousMessages) {
        const { data: data, error: dupError } = await supabase
          .from("messages")
          .insert({
            ...msg,
            id: undefined, // Let Supabase generate new ID
            branch_id: newBranch.id,
          });
        if (dupError) {
          console.error("Error duplicating message:", {
            message: msg,
            dupError,
          });
          throw dupError;
        }
        console.log("New message", data);
      }

      // Insert the edited message
      const { data: newMessage, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          branch_id: newBranch.id, // Ensure it's added to the correct branch
          role: "user",
          content: newContent,
          position: messageToEdit.position,
          original_message_id: messageToEdit.original_message_id || messageId,
          version_number: (messageToEdit.version_number || 1) + 1,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error inserting edited message:", messageError);
        throw messageError;
      }

      console.log("Inserted edited message:", newMessage);

      // Fetch AI response
      console.log("Fetching AI response...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEdit: true,
          message: newContent,
          conversationId: activeConversationId,
          branchId: newBranch.id,
        }),
      });

      if (!response.ok) {
        console.error("Error fetching AI response:", response.statusText);
        throw new Error("Failed to get AI response");
      }

      console.log("Fetched AI response successfully.");

      // Update state
      setBranches((prev) => [...prev, newBranch]);
      setActiveBranchId(newBranch.id);
      console.log("State updated: activeBranchId set to", newBranch.id);

      await loadBranchMessages(activeConversationId, newBranch.id);

      console.log("this is the new branch", newBranch);
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranchMessages = async (
    conversationId: string,
    branchId: string
  ) => {
    try {
      // Get unique messages by position
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("branch_id", branchId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }); // Secondary sort for same positions

      if (error) throw error;

      // Filter out duplicate messages at the same position
      const uniqueMessages = messages?.reduce((acc: any[], current) => {
        const exists = acc.find((msg) => msg.position === current.position);
        if (!exists) {
          return [...acc, current];
        }
        return acc;
      }, []);

      setMessages(uniqueMessages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // ... Load conversations, branches, and messages on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("Loading initial data...");
        // Load conversations
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .order("updated_at", { ascending: false });

        if (convError) throw convError;
        console.log("Loaded conversations:", conversations);

        if (conversations?.length) {
          setConversations(conversations);
          // Load branches for first conversation
          const firstConv = conversations[0];
          setActiveConversationId(firstConv.id);

          const { data: branches, error: branchError } = await supabase
            .from("branches")
            .select("*")
            .eq("conversation_id", firstConv.id)
            .order("created_at", { ascending: true });

          if (branchError) throw branchError;
          console.log("Loaded branches:", branches);

          if (branches?.length) {
            setBranches(branches);
            // Set main branch as active
            const mainBranch = branches.find((b) => b.is_main);
            if (mainBranch) {
              setActiveBranchId(mainBranch.id);
            }
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [supabase]);
  // Load branches when conversation changes
  // In the branch loading useEffect
  useEffect(() => {
    const loadBranches = async () => {
      if (!activeConversationId) return;
      console.log("Loading branches for conversation:", activeConversationId);
      try {
        const { data: branches } = await supabase
          .from("branches")
          .select("*")
          .eq("conversation_id", activeConversationId)
          .order("created_at", { ascending: true });

        console.log("Loaded branches:", branches);
        setBranches(branches || []);

        // Set active branch to main branch by default
        const mainBranch = branches?.find((b) => b.is_main);
        if (mainBranch) {
          console.log("Setting active branch:", mainBranch);
          setActiveBranchId(mainBranch.id);
        }
      } catch (error) {
        console.error("Error loading branches:", error);
      }
    };

    loadBranches();
  }, [activeConversationId, supabase]);
  // Load messages when branch changes
  useEffect(() => {
    if (activeConversationId && activeBranchId) {
      loadBranchMessages(activeConversationId, activeBranchId);
    }
  }, [activeConversationId, activeBranchId]);
  // ... continuing from previous code

  console.log("messages", messages);
  return (
    <div className="flex-1 flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-[260px] h-[calc(100vh-4rem)] flex-col bg-[#111] border-r border-foreground/10">
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 rounded-lg bg-[#222] hover:bg-white/10 text-white flex items-center justify-center gap-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative flex items-center hover:bg-white/5 transition-colors ${
                activeConversationId === conversation.id ? "bg-white/10" : ""
              }`}
            >
              <button
                onClick={() => setActiveConversationId(conversation.id)}
                className="flex-1 p-4 text-left truncate"
              >
                {conversation.title}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#1a1a1a]">
        {/* Branch Selection Bar */}
        <div className="border-b border-white/10 p-2 flex gap-2 overflow-x-auto">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => {
                console.log("this is the branch", branch);
                setActiveBranchId(branch.id);
                loadBranchMessages(activeConversationId!, branch.id);
              }}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeBranchId === branch.id
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 hover:bg-white/10 text-gray-300"
              }`}
            >
              {branch.is_main ? "Main" : branch.name}
            </button>
          ))}
        </div>

        {/* Messages or Welcome Screen */}
        {!activeConversationId || !activeBranchId ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md text-center text-gray-300">
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat!</h2>
              <p className="text-gray-400 mb-4">
                Start a new conversation or select an existing one.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => {
                  const branch = branches.find(
                    (b) => b.id === message.branch_id
                  );
                  if (!branch) return null;

                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      branch={branch}
                      onEdit={handleEditMessage}
                    />
                  );
                })}
              </div>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex pt-4  justify-center">
                <div className="relative w-32 h-32 bg-white border border-gray-300 rounded-lg shadow-lg flex items-center justify-center">
                  <div className="absolute w-12 h-12 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {/* Chat Input - Always show if we have active conversation and branch */}
            <div className="p-4">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  setIsLoading={setIsLoading}
                  conversationId={activeConversationId}
                  branchId={activeBranchId}
                  onMessageSent={() => {
                    if (activeConversationId && activeBranchId) {
                      loadBranchMessages(activeConversationId, activeBranchId);
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
