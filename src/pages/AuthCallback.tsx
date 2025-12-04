import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      const hash = window.location.hash;

      // If URL contains error params → show message & redirect
      if (hash.includes("error")) {
        alert("Verification link expired or invalid. Please request a new email verification.");
        navigate("/auth");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard");   // success
      } else {
        navigate("/auth");        // failed
      }
    };

    verify();
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Verifying your email…</h2>
      <p>Please wait…</p>
    </div>
  );
}
