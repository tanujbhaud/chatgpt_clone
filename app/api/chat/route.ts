// app/api/chat/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const { message, conversationId, branchId, isEdit } = await req.json();

    if (!conversationId || !branchId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the last message position in this branch
    const { data: lastMessage } = await supabase
      .from("messages")
      .select("position")
      .eq("conversation_id", conversationId)
      .eq("branch_id", branchId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const newPosition = lastMessage ? lastMessage.position + 1 : 0;

    // Conditionally save user message based on isEdit flag
    let userMessage;
    if (!isEdit) {
      if (!message) {
        return NextResponse.json(
          { error: "Missing message content" },
          { status: 400 }
        );
      }

      const { data: userMessageData, error: userMessageError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId,
            branch_id: branchId,
            role: "user",
            content: message,
            position: newPosition,
          },
        ])
        .select()
        .single();

      if (userMessageError) throw userMessageError;
      userMessage = userMessageData;
    }

    try {
      // Get response from Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `As a helpful AI assistant, please respond to: ${message}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Save AI response
      const { data: aiMessage, error: aiMessageError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId,
            branch_id: branchId,
            role: "assistant",
            content: aiResponse,
            position: newPosition + 1,
            parent_message_id: userMessage?.id,
          },
        ])
        .select()
        .single();

      if (aiMessageError) throw aiMessageError;

      // Update conversation title if it's the first message
      if (newPosition === 0) {
        await supabase
          .from("conversations")
          .update({
            title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }

      return NextResponse.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("AI error:", error);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
