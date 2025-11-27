// src/components/AiTalk.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

import {
  Bot,
  User,
  Send,
  Search,
  Plus,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Sidebar not used from separate file since code includes custom sidebar
// import Sidebar from "@/components/Sidebar";

// -------------------- GEMINI SETUP --------------------
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// -------------------- LIMITS --------------------
const PER_CHAT_TOKEN_LIMIT = 300000;
const DAILY_PHOTO_LIMIT = 100;
const STORAGE_BUCKET = "user-uploads";

// -------------------- SYSTEM PROMPT --------------------
const SYSTEM_PROMPT = `You are HealthifyMe AI, and you talk exactly like ChatGPT in a friendly, natural, human style.

Match the user's tone always:
• If the user writes in Hindi → reply in Hindi
• If the user writes in Hinglish → reply in Hinglish
• If the user writes in English → reply in English

Write naturally like a real conversation.
Keep responses smooth, clean, and easy to read.
Use emojis naturally.

You are allowed to use:
• Emojis
• Bullet points using the dot symbol •
• Soft headings as plain text
• Clean paragraph spacing
• Conversational, human-like tone

You must NOT use:
• The star symbol
• Markdown (#, *, **, ---, etc.)

Allowed topics:
• Fitness, gym, workouts, routines
• Muscle gain, fat loss, diet, nutrition
• Supplements (whey, creatine, multivitamins)
• Gym-related medicines (explain but never prescribe)
• SARMs, steroids (explain risks only)
• Body creams in gym context

Rules:
• NEVER prescribe
• NEVER give dosage
• NEVER guide steroid/SARM cycles
• Always end with: "Disclaimer: I am an AI assistant and not a medical professional. Please consult a doctor for personal health concerns."

Important:
Never use “*”. Use only “•”.
`;

// -------------------- Topic Keywords --------------------
const TOPIC_KEYWORDS: Record<string, string[]> = {
  diet: ["diet", "khana", "calories", "protein", "carb", "meal", "breakfast"],
  workouts: ["workout", "gym", "exercise", "squat", "deadlift", "cardio"],
  supplements: ["supplement", "whey", "creatine", "protein powder"],
  steroids: ["steroid", "testosterone", "sarm"],
  skin: ["cream", "acne", "moisturizer"],
  health: ["health", "doctor", "medical"],
};

function detectTopic(text: string) {
  const t = (text || "").toLowerCase();
  for (const k of Object.keys(TOPIC_KEYWORDS)) {
    for (const kw of TOPIC_KEYWORDS[k]) {
      if (t.includes(kw)) return k;
    }
  }
  return "general";
}

// -------------------- Context trimming helpers --------------------
function getRelevantMessages(
  allMessages: { sender: "user" | "ai"; content: string }[],
  userInput: string
) {
  const detected = detectTopic(userInput);
  const lastCount = 12;

  if (detected === "general") return allMessages.slice(-lastCount);

  const keywords = TOPIC_KEYWORDS[detected] ?? [];
  const matches: number[] = [];

  allMessages.forEach((m, i) => {
    const txt = (m.content || "").toLowerCase();
    for (const kw of keywords) {
      if (txt.includes(kw)) {
        matches.push(i);
        break;
      }
    }
  });

  if (matches.length === 0) return allMessages.slice(-lastCount);

  const includeSet = new Set<number>();
  for (const idx of matches) {
    includeSet.add(idx);
    if (idx - 1 >= 0) includeSet.add(idx - 1);
    if (idx + 1 < allMessages.length) includeSet.add(idx + 1);
  }

  const included = Array.from(includeSet)
    .sort((a, b) => a - b)
    .map((i) => allMessages[i]);

  return included.length > 20 ? included.slice(-20) : included;
}

const STAR_CHAR = String.fromCharCode(42);
function normalizeForDisplay(text: string) {
  if (!text) return "";
  return text
    .split(STAR_CHAR)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function estimateTokens(text: string) {
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.length / 4));
}

function buildPrompt(
  systemPrompt: string,
  relevantMessages: { sender: "user" | "ai"; content: string }[],
  userInput: string
) {
  let conv = "";
  for (const m of relevantMessages) {
    conv += `${m.sender === "user" ? "User" : "AI"}: ${m.content}\n`;
  }
  conv += `User: ${userInput}\nAI:`;
  return `${systemPrompt}\n\nConversation:\n${conv}`;
}

function startOfDayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
// -------------------- GEMINI TITLE GENERATOR (fixed typing) --------------------
async function generateChatTitle(firstUserMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Generate a short, clean, professional chat title based ONLY on this first user message:

"${firstUserMessage}"

Rules:
• Title must be 2–6 words
• No emojis
• No quotes
• No punctuation at end
`;

    const result: any = await model.generateContent(prompt);

    let raw = "";

    if (typeof result?.response === "string") {
      raw = result.response;
    } else if (result?.response?.text) {
      raw = result.response.text();
    } else {
      raw = String(result?.response ?? "");
    }

    return raw.toString().trim().slice(0, 60);
  } catch (err) {
    console.error("Gemini title error:", err);
    return "New Chat";
  }
}


// ---------------------------------------------------------------
// ---------------------- PAGE HEADER ----------------------------
// ---------------------------------------------------------------
const PageHeader: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="container max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="font-bold text-xl text-gray-900">HealthifyMe AI</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/scanner" className="flex items-center gap-1">
              <Search className="w-4 h-4" /> Scanner
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link to="/blog">Blog</Link>
          </Button>

          {user && (
            <Button variant="ghost" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}

          <Button variant="ghost" onClick={() => signOut()}>
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
};

// ---------------------------------------------------------------
// -------------------------- FOOTER -----------------------------
// ---------------------------------------------------------------
const Footer: React.FC = () => (
  <footer className="fixed bottom-0 left-0 right-0 bg-green-600 text-white py-4 text-center">
    <span className="text-sm">Made with ❤️ by Mohammad Aatif Khan</span>
  </footer>
);

// ---------------------------------------------------------------
// ----------------------- MAIN COMPONENT ------------------------
// ---------------------------------------------------------------
const AITalk: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<
    Database["public"]["Tables"]["conversations"]["Row"][]
  >([]);

  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const [messages, setMessages] = useState<
    Database["public"]["Tables"]["chat_messages"]["Row"][]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [todayPhotoCount, setTodayPhotoCount] = useState<number>(0);

  // which conversation's 3-dots menu is open
  const [sideOpenMenuId, setSideOpenMenuId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------------------------------------------
  // LOAD CONVERSATIONS & MESSAGES ON START
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
      setTodayPhotoCount(0);
      return;
    }

    (async () => {
      // Load all conversations
      const { data: convos } = await supabase
        .from("conversations")
        .select("id, title, is_active, tokens_used, created_at, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (convos && convos.length > 0) {
        setConversations(convos);
      }

      // URL param check
      const params = new URLSearchParams(location.search);
      const convoId = params.get("convo");

      if (convoId) {
        setCurrentConversationId(convoId);
        await loadMessages(convoId);
      } else if (convos && convos.length > 0) {
        const active = convos.find((c) => c.is_active) ?? convos[0];
        setCurrentConversationId(active.id);
        await loadMessages(active.id);
      } else {
        // Create first conversation if none exist (empty title)
        const { data: newC } = await supabase
          .from("conversations")
          .insert([
            {
              user_id: user.id,
              title: "", // empty until first user msg
              is_active: true,
              tokens_used: 0,
            },
          ])
          .select()
          .single();

        if (newC) {
          setConversations([newC]);
          setCurrentConversationId(newC.id);

          setMessages([
            {
              id: crypto.randomUUID(),
              conversation_id: newC.id,
              user_id: user.id,
              sender: "ai",
              content:
                "Hello! I'm here to help with fitness, diet, and wellness. Ask anything!",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }

      await refreshTodayPhotoCount();
    })();
  }, [user]);

  // -------------------------------------------------------------
  // LOAD MESSAGES FOR ONE CONVERSATION
  // -------------------------------------------------------------
  async function loadMessages(convoId: string) {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, conversation_id, user_id, sender, content, created_at")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
  }

  // -------------------------------------------------------------
  // DAILY PHOTO COUNT
  // -------------------------------------------------------------
  async function refreshTodayPhotoCount() {
    if (!user) return;

    const fromISO = startOfDayISO();
    const { count } = await supabase
      .from("uploads")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", fromISO);

    setTodayPhotoCount(count ?? 0);
  }

  // -------------------------------------------------------------
  // CREATE NEW CHAT (USED WHEN USER PRESSES "New Chat")
  // -------------------------------------------------------------
  async function createNewConversation() {
    if (!user) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: user.id,
          title: "", // title empty until first message
          is_active: true,
          tokens_used: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("createNewConversation error:", error);
      return null;
    }

    // Mark others inactive
    setConversations((prev) =>
      [...prev.map((c) => ({ ...c, is_active: false })), data]
    );

    setCurrentConversationId(data.id);
    setMessages([]);


    navigate(`/aitalk?convo=${data.id}`, { replace: true });

    return data;
  }
  // -------------------------------------------------------------
  // SWITCH CONVERSATION
  // -------------------------------------------------------------
  async function switchConversation(convoId: string) {
    if (convoId === currentConversationId) return;

    setCurrentConversationId(convoId);
    setMessages([
      {
        id: crypto.randomUUID(),
        conversation_id: convoId,
        user_id: user?.id ?? null,
        sender: "ai",
        content: "Loading messages...",
        created_at: new Date().toISOString(),
      },
    ]);

    await loadMessages(convoId);
    navigate(`/aitalk?convo=${convoId}`, { replace: true });
  }

  // -------------------------------------------------------------
  // SIDEBAR 3-DOTS MENU ACTIONS
  // -------------------------------------------------------------

  // SHARE CHAT → Copy link
  async function onShareConversation(convoId: string) {
    try {
      const url = `${window.location.origin}/aitalk?convo=${convoId}`;
      await navigator.clipboard.writeText(url);
      setSideOpenMenuId(null);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId,
          user_id: user?.id ?? null,
          sender: "ai",
          content: "Share link copied to clipboard ✅",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Share failed", err);
    }
  }

  // RENAME CHAT (manual rename)
  async function onRenameConversation(convoId: string) {
    const current = conversations.find((c) => c.id === convoId);
    const currentTitle = current?.title ?? "";

    const newTitle = window.prompt("Rename conversation", currentTitle);
    if (newTitle === null) {
      setSideOpenMenuId(null);
      return;
    }

    const trimmed = (newTitle || "").trim().slice(0, 200);
    if (!trimmed) {
      setSideOpenMenuId(null);
      return;
    }

    const { error } = await supabase
      .from("conversations")
      .update({ title: trimmed })
      .eq("id", convoId);

    if (error) {
      console.error("rename error", error);
    } else {
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, title: trimmed } : c))
      );
    }

    setSideOpenMenuId(null);
  }

  // ARCHIVE CHAT
  async function onArchiveConversation(convoId: string) {
    const { error } = await supabase
      .from("conversations")
      .update({ is_active: false })
      .eq("id", convoId);

    if (error) {
      console.error("archive error", error);
      return;
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convoId ? { ...c, is_active: false } : c
      )
    );

    // If archiving current chat → switch to another
    if (convoId === currentConversationId) {
      const remaining = conversations.filter((c) => c.id !== convoId);

      if (remaining.length > 0) {
        await switchConversation(remaining[0].id);
      } else {
        const newC = await createNewConversation();
        if (!newC) {
          setMessages([]);
          setCurrentConversationId(null);
        }
      }
    }

    setSideOpenMenuId(null);
  }

  // DELETE CHAT
  async function onDeleteConversation(convoId: string) {
    const ok = window.confirm(
      "Delete this conversation? This cannot be undone."
    );
    if (!ok) {
      setSideOpenMenuId(null);
      return;
    }

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", convoId);

    if (error) {
      console.error("delete conversation error:", error);
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== convoId));

    // If deleted current → switch or create new
    if (convoId === currentConversationId) {
      const remaining = conversations.filter((c) => c.id !== convoId);

      if (remaining.length > 0) {
        await switchConversation(remaining[0].id);
      } else {
        const newC = await createNewConversation();
        if (!newC) {
          setMessages([]);
          setCurrentConversationId(null);
        }
      }
    }

    setSideOpenMenuId(null);
  }

  // -------------------------------------------------------------
  // SIDEBAR UI
  // -------------------------------------------------------------
// REPLACE your existing `renderSidebar` with this function (Light theme: white/black/green)
const renderSidebar = () => (
  <aside className="hidden md:block w-80 border-r bg-white h-[calc(100vh-4rem)] sticky top-16">
    <div className="flex flex-col h-full">
      {/* Top area: logo / new chat */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <div>
              <div className="text-sm font-semibold text-gray-900">HealthifyMe AI</div>
              <div className="text-xs text-gray-500">Your fitness assistant</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={() => createNewConversation()}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600"
          >
            <Plus className="w-4 h-4" /> New chat
          </Button>
        </div>

        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search chats"
              className="pl-10"
              value={""}
              readOnly
              onChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Chat list header */}
      <div className="px-4 pt-3 pb-2 text-xs font-medium text-gray-500">Chats</div>

      {/* Chat list */}
      <nav className="px-2 pb-4 overflow-y-auto flex-1">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No chats yet.
              <div className="mt-2 text-xs text-gray-500">
                Start a conversation by sending a message in the input.
              </div>
            </div>
          ) : (
            conversations.map((c) => {
              // show title only if present; do NOT auto-generate "Untitled Chat"
              const title = c.title && c.title.trim().length > 0 ? c.title : "";
              const date = c.created_at ? c.created_at.slice(0, 10) : "";

              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    currentConversationId === c.id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => switchConversation(c.id)}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {title || <span className="text-gray-400 italic">No title</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{date}</div>
                  </div>

                  <div className="relative ml-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        setSideOpenMenuId((prev) => (prev === c.id ? null : c.id))
                      }
                      className="p-2 rounded hover:bg-gray-100"
                      aria-label="Open chat menu"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>

                    {sideOpenMenuId === c.id && (
                      <div className="absolute right-0 top-9 z-50 w-44 bg-white border rounded shadow-sm">
                        <button
                          onClick={() => onShareConversation(c.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          Share
                        </button>

                        <button
                          onClick={() => onRenameConversation(c.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          Rename
                        </button>

                        <button
                          onClick={() => onArchiveConversation(c.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          Archive
                        </button>

                        <button
                          onClick={() => onDeleteConversation(c.id)}
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* Footer inside sidebar */}
      <div className="px-4 py-3 border-t">
        <div className="text-sm text-gray-700">Aatif Khan</div>
        <div className="text-xs text-gray-500">Made with ❤️</div>
      </div>
    </div>
  </aside>
);

  // -------------------------------------------------------------
  // IMAGE UPLOAD HANDLING
  // -------------------------------------------------------------
  async function handleImageUpload(file: File) {
    if (!user || !currentConversationId) return null;

    await refreshTodayPhotoCount();
    if (todayPhotoCount >= DAILY_PHOTO_LIMIT) {
      const msg =
        "Aapka aaj ka daily photo upload limit poora ho chuka hai. Kal phir try karein.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId,
          user_id: user.id,
          sender: "ai",
          content: msg,
          created_at: new Date().toISOString(),
        },
      ]);
      return null;
    }

    setUploading(true);

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(
        /\s/g,
        "_"
      )}`;

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const urlObj = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const publicURL =
        (urlObj && (urlObj as any).publicUrl) ? (urlObj as any).publicUrl : "";

      // Insert upload record
      await supabase.from("uploads").insert([
        {
          user_id: user.id,
          bucket: STORAGE_BUCKET,
          path: filePath,
          size_bytes: file.size,
          metadata: { name: file.name },
        },
      ]);

      const content = `![image](${publicURL})`;

      await supabase.from("chat_messages").insert([
        {
          conversation_id: currentConversationId,
          user_id: user.id,
          sender: "user",
          content,
        },
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId,
          user_id: user.id,
          sender: "user",
          content,
          created_at: new Date().toISOString(),
        },
      ]);

      await refreshTodayPhotoCount();
      return publicURL;
    } catch (err) {
      console.error("Upload error:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId,
          user_id: user?.id ?? null,
          sender: "ai",
          content: "Image upload failed. Try again.",
          created_at: new Date().toISOString(),
        },
      ]);

      return null;
    } finally {
      setUploading(false);
    }
  }

  // -------------------------------------------------------------
  // SEND MESSAGE (MAIN)
  // -------------------------------------------------------------
  const sendMessage = async (
    e?: React.FormEvent<HTMLFormElement>
  ) => {
    if (e) e.preventDefault();

    const text = input.trim();
    if (!text || !user) return;

    setInput("");
    setLoading(true);

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        conversation_id: currentConversationId ?? null,
        user_id: user.id,
        sender: "user",
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      let convoId = currentConversationId;

      // ---------------------------------------------------------
      // CREATE NEW CHAT IF NONE EXISTS
      // ---------------------------------------------------------
      if (!convoId) {
        const created = await createNewConversation();
        convoId = created?.id ?? null;
        if (!convoId) throw new Error("Could not create conversation");
      }

      // Store user message
      const tokensUser = estimateTokens(text);

      await supabase.from("chat_messages").insert([
        {
          conversation_id: convoId,
          user_id: user.id,
          sender: "user",
          content: text,
        },
      ]);

      // Fetch conversation details
      const { data: convoRow } = await supabase
        .from("conversations")
        .select("tokens_used, title")
        .eq("id", convoId)
        .single();

      let currentTokens = convoRow?.tokens_used ?? 0;
      currentTokens += tokensUser;

      // ---------------------------------------------------------
      // IF FIRST USER MESSAGE → GENERATE TITLE USING GEMINI
      // ---------------------------------------------------------
      if (convoRow?.title === "" || !convoRow?.title) {
        const newTitle = await generateChatTitle(text);

        await supabase
          .from("conversations")
          .update({ title: newTitle })
          .eq("id", convoId);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convoId ? { ...c, title: newTitle } : c
          )
        );
      }

      // ---------------------------------------------------------
      // CONTEXT FETCH FOR AI MEMORY
      // ---------------------------------------------------------
      const { data: recent } = await supabase
        .from("chat_messages")
        .select("id, sender, content")
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true })
        .limit(120);

      const recentMapped =
        recent?.map((m) => ({
          sender: m.sender as "user" | "ai",
          content: m.content,
        })) ?? [];

      const relevant = getRelevantMessages(recentMapped, text);
      const prompt = buildPrompt(SYSTEM_PROMPT, relevant, text);

      // ---------------------------------------------------------
      // GEMINI REPLY GENERATION
      // ---------------------------------------------------------
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      let result: any;

      try {
        result = await model.generateContent(prompt);
      } catch (err: any) {
        if ((err?.message ?? "").includes("503")) {
          await new Promise((r) => setTimeout(r, 900));
          result = await model.generateContent(prompt);
        } else {
          throw err;
        }
      }

      const rawReply =
        typeof result.response?.text === "function"
          ? result.response.text()
          : result?.response ?? "";

      const reply = normalizeForDisplay(rawReply || "");
      const tokensAI = estimateTokens(reply);

      currentTokens += tokensAI;

      // ---------------------------------------------------------
      // INSERT AI MESSAGE
      // ---------------------------------------------------------
      await supabase.from("chat_messages").insert([
        {
          conversation_id: convoId,
          user_id: user.id,
          sender: "ai",
          content: reply,
        },
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: convoId,
          user_id: user.id,
          sender: "ai",
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);

      // ---------------------------------------------------------
      // TOKEN LIMIT HANDLING
      // ---------------------------------------------------------
      if (currentTokens >= PER_CHAT_TOKEN_LIMIT) {
        await supabase
          .from("conversations")
          .update({ is_active: false, tokens_used: currentTokens })
          .eq("id", convoId);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convoId
              ? { ...c, is_active: false, tokens_used: currentTokens }
              : c
          )
        );

        const newConv = await createNewConversation();
        if (newConv) {
          const info =
            "This conversation reached its limit, so I started a fresh chat for you. Continue from here.";

          await supabase.from("chat_messages").insert([
            {
              conversation_id: newConv.id,
              user_id: user.id,
              sender: "ai",
              content: info,
            },
          ]);

          setMessages([
            {
              id: crypto.randomUUID(),
              conversation_id: newConv.id,
              user_id: user.id,
              sender: "ai",
              content: info,
              created_at: new Date().toISOString(),
            },
          ]);

          setCurrentConversationId(newConv.id);
        }
      } else {
        await supabase
          .from("conversations")
          .update({ tokens_used: currentTokens })
          .eq("id", convoId);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convoId
              ? { ...c, tokens_used: currentTokens }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Send message error:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId,
          user_id: user?.id ?? null,
          sender: "ai",
          content: "Kuch gadbad ho gayi, please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // IMAGE BUTTON HANDLERS
  // -------------------------------------------------------------
  function onImageButtonClick() {
    fileInputRef.current?.click();
  }

  async function onFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleImageUpload(file);
    e.currentTarget.value = "";
  }
  // -------------------------------------------------------------
  // RENDER MESSAGE CONTENT
  // -------------------------------------------------------------
  function renderMessageContent(
    m: Database["public"]["Tables"]["chat_messages"]["Row"]
  ) {
    const txt = m.content ?? "";

    // Image message
    if (txt.startsWith("![image](") && txt.endsWith(")")) {
      const url = txt.replace(/^!\[image\]\(/, "").replace(/\)$/, "");
      return (
        <img
          src={url}
          alt="upload"
          className="max-w-full rounded"
        />
      );
    }

    // Normal text
    return normalizeForDisplay(txt)
      .split("\n\n")
      .map((para, idx) => (
        <p key={idx} className="m-0">
          {para.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < para.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ));
  }

  // -------------------------------------------------------------
  // MAIN RETURN UI
  // -------------------------------------------------------------
  return (
    <div className="min-height-screen bg-[#f5f5f5] pt-20 pb-20 flex">
      {/* SIDEBAR */}
      {renderSidebar()}

      {/* MAIN CHAT AREA */}
      <div className="flex-1">
        <PageHeader />

        <div
          className="w-full max-w-4xl mx-auto px-6 flex-1 overflow-y-auto mt-4 mb-4"
          style={{ paddingBottom: "120px" }}
        >


          {/* CHAT MESSAGES */}
          <div>
            {messages.map((msg, idx) => (
              <div
                key={msg.id ?? idx}
                className={`flex my-3 ${msg.sender === "user"
                  ? "justify-end"
                  : "justify-start"
                  }`}
              >
                {msg.sender === "ai" && (
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mr-3">
                    <Bot />
                  </div>
                )}

                <div
                  className={`
                    max-w-[75%] p-4 rounded-2xl shadow whitespace-pre-wrap
                    text-[15.5px] leading-[1.7] tracking-[0.1px] font-[400] space-y-2
                    ${msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-900 rounded-bl-none"
                    }
                  `}
                >
                  {renderMessageContent(msg)}
                </div>

                {msg.sender === "user" && (
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center ml-3">
                    <User />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-600">
                <Bot className="w-5 h-5" /> typing...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* INPUT BOX */}
        <form
          onSubmit={sendMessage}
          className="fixed bottom-16 left-0 right-0 flex justify-center px-4"
        >
          <div className="w-full max-w-4xl flex items-center bg-white border rounded-full shadow p-2 mx-6">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 border-none"
              disabled={loading}
            />

            <button
              type="button"
              onClick={onImageButtonClick}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-2"
              title="Upload image"
              disabled={uploading}
            >
              {uploading ? (
                <span className="text-xs">Uploading…</span>
              ) : (
                <ImageIcon />
              )}
            </button>



            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />

            <Button
              type="submit"
              className="w-12 h-12 rounded-full bg-green-600 text-white"
              disabled={loading}
            >
              <Send />
            </Button>
          </div>
        </form>

        <Footer />
      </div>
    </div>
  );
};

export default AITalk;
