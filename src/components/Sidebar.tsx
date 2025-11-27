// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Database["public"]["Tables"]["conversations"]["Row"][]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // fetch conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchConversations() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, is_active, tokens_used, created_at, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setConversations(data);
    } else if (error) {
      console.error("fetchConversations error", error);
    }
    setLoading(false);
  }

  // create a new conversation and navigate to it
  async function onNewChat() {
    if (!user) return;
    setLoading(true);

    // insert new conversation and return full row
    const { data, error } = await supabase
      .from("conversations")
      .insert([
        { user_id: user.id, title: "New Conversation", is_active: true, tokens_used: 0 },
      ])
      .select()
      .single();

    if (error) {
      console.error("onNewChat error", error);
      setLoading(false);
      return;
    }

    if (data) {
      // add to local list (keep type shape)
      setConversations(prev => [data, ...prev.map(c => ({ ...c, is_active: false }))]);
      navigate(`/aitalk?convo=${data.id}`);
    }
    setLoading(false);
  }

  // open conversation
  function openConvo(convoId: string) {
    navigate(`/aitalk?convo=${convoId}`);
  }

  // filter
  const filtered = conversations.filter((c) =>
    (c.title ?? "Chat").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside className="w-80 bg-white border-r min-h-screen p-4 flex flex-col">
      <div className="mb-4">
        <Button onClick={onNewChat} className="w-full flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search chats…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="text-xs font-semibold text-gray-500 mb-2">Chats</div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {loading && <div className="text-sm text-gray-500">Loading…</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-gray-400 text-sm">No chats found</div>
        )}

        {!loading &&
          filtered.map((c) => (
            <ChatListItem key={c.id} convo={c} onOpen={() => openConvo(c.id)} />
          ))}
      </div>
    </aside>
  );
}

/* Chat list item */
function ChatListItem({
  convo,
  onOpen,
}: {
  convo: Database["public"]["Tables"]["conversations"]["Row"];
  onOpen: () => void;
}) {
  const title = smartTitle(convo.title, convo.id);
  const date = convo.created_at ? convo.created_at.slice(0, 10) : "";

  return (
    <div
      onClick={onOpen}
      className="cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
    >
      <div className="font-medium text-sm text-gray-900">{title}</div>
      <div className="text-xs text-gray-500">{date}</div>
    </div>
  );
}

/* Smart title generator - Chat A / Chat B fallback */
function smartTitle(title: string | null, id: string) {
  if (title && title.trim().length > 0 && title !== "New Conversation") return title.trim();

  // deterministic short letter based on id
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) | 0;
  const letter = String.fromCharCode(65 + (Math.abs(n) % 26));
  return `Chat ${letter}`;
}
