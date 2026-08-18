import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EventHeader } from "@/components/EventHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Organizer Login — Malay Language Race 2026" },
      {
        name: "description",
        content:
          "Organizer sign-in for Malay Language Race 2026: manage the shared question bank, pronunciation audio, quiz settings, and team results.",
      },
      { property: "og:title", content: "Organizer Login — Malay Language Race 2026" },
      {
        property: "og:description",
        content: "Sign in to manage the Malay Language Race 2026 event.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Please check your email to confirm.");
          return;
        }
        toast.success("Account created.");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <EventHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl font-extrabold">
          {mode === "login" ? "Organizer Login" : "Organizer Sign Up"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only organizers need an account. Players can join without signing in.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {mode === "login" ? "Log In" : "Daftar"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-muted-foreground underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "No account yet? Sign up" : "Already have an account? Log in"}
        </button>

        <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground">
          Back to home
        </Link>
      </main>
    </div>
  );
}
