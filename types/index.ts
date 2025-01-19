// types/index.ts
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  conversation_id: string;
  name: string;
  created_at: string;
  is_main: boolean;
  parent_branch_id?: string;
  forked_from_message_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  branch_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  position: number;
  version_number: number;
  parent_message_id?: string;
  original_message_id?: string;
}
