import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 🟢 Complete sign-in using the URL received in email
        await supabase.auth.exchangeCodeForSession(window.location.href);

        // 🟢 Check if session created
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          navigate("/dashboard");
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error exchanging session:", error);
        navigate("/auth");
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Verifying your email…</h2>
      <p>Please wait…</p>
    </div>
  );
}
