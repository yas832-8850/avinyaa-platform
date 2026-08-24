"use client"; // This runs in the browser, not the server - needed because it uses useState

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh(); // makes sure the server picks up the new logged-in session
  }

  return (
    <div className="flex min-h-screen w-full bg-[#15181D]">
      <style>{`
        @keyframes drawRoute {
          0% { stroke-dashoffset: 1000; opacity: 0; }
          8% { opacity: 1; }
          45% { stroke-dashoffset: 0; opacity: 1; }
          70% { stroke-dashoffset: 0; opacity: 1; }
          92% { opacity: 0; }
          100% { stroke-dashoffset: -1000; opacity: 0; }
        }
        @keyframes pulseDot {
          0%, 40% { r: 0; opacity: 0; }
          48% { r: 10; opacity: 0.6; }
          58% { r: 4; opacity: 1; }
          70% { r: 4; opacity: 1; }
          78% { r: 10; opacity: 0; }
          100% { r: 0; opacity: 0; }
        }
        @keyframes underlineDraw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .route-line {
          stroke-dasharray: 1000;
          animation: drawRoute 7s ease-in-out infinite;
        }
        .route-line-delay {
          stroke-dasharray: 700;
          animation: drawRoute 7s ease-in-out infinite;
          animation-delay: 2.3s;
        }
        .route-dot {
          animation: pulseDot 7s ease-in-out infinite;
        }
        .route-dot-delay {
          animation: pulseDot 7s ease-in-out infinite;
          animation-delay: 2.3s;
        }
        .wordmark-underline {
          transform-origin: left;
          animation: underlineDraw 1.1s cubic-bezier(0.65, 0, 0.35, 1) 0.3s both;
        }
        .fade-up {
          animation: fadeUp 0.6s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .route-line, .route-line-delay { animation: none; stroke-dashoffset: 0; opacity: 0.5; }
          .route-dot, .route-dot-delay { animation: none; r: 4; opacity: 0.8; }
          .wordmark-underline { animation: none; transform: scaleX(1); }
          .fade-up { animation: none; }
        }
      `}</style>

      {/* Left hero panel — animated route map, hidden on small screens */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#2C313A 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#15181D] via-transparent to-[#15181D] opacity-80" />

        <div className="relative z-10">
          <div className="inline-block">
            <span className="text-2xl font-semibold tracking-[0.2em] text-[#EDEEF0]">AVINYAA</span>
            <div className="wordmark-underline mt-2 h-[2px] w-full bg-[#F0A83A]" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-[#8B92A0]">
            Retail merchandising, installation, and freight brokerage — coordinated in one place.
          </p>
        </div>

        <svg viewBox="0 0 500 420" className="relative z-10 w-full max-w-lg" fill="none">
          <circle cx="90" cy="330" r="4" fill="#4FA8D8" opacity="0.7" />
          <circle cx="420" cy="90" r="4" fill="#4FA8D8" opacity="0.7" />
          <path
            d="M90,330 C160,300 150,200 230,190 C300,182 260,110 420,90"
            stroke="#F0A83A"
            strokeWidth="2"
            strokeLinecap="round"
            className="route-line"
          />
          <circle cx="420" cy="90" r="0" fill="#F0A83A" className="route-dot" />

          <circle cx="140" cy="120" r="4" fill="#4FA8D8" opacity="0.7" />
          <circle cx="380" cy="300" r="4" fill="#4FA8D8" opacity="0.7" />
          <path
            d="M140,120 C200,160 260,150 300,210 C330,255 350,260 380,300"
            stroke="#F0A83A"
            strokeWidth="2"
            strokeLinecap="round"
            className="route-line-delay"
          />
          <circle cx="380" cy="300" r="0" fill="#F0A83A" className="route-dot-delay" />
        </svg>

        <p className="relative z-10 text-xs uppercase tracking-[0.15em] text-[#8B92A0]">
          Operations · Sydney, Australia
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="fade-up w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-xl font-semibold tracking-[0.2em] text-[#EDEEF0]">AVINYAA</span>
            <div className="mt-2 h-[2px] w-16 bg-[#F0A83A]" />
          </div>

          <div className="border border-[#2C313A] bg-[#1E2229] p-8">
            <div className="mb-6 flex items-center justify-between border-b border-[#2C313A] pb-4">
              <div>
                <h1 className="text-lg font-semibold text-[#EDEEF0]">Sign in</h1>
                <p className="mt-1 text-sm text-[#8B92A0]">Access your Avinyaa dashboard</p>
              </div>
              <span className="border border-[#2C313A] px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-[#8B92A0]">
                Secure
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0]">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="border border-[#3A2222] bg-[#221818] px-3 py-2 text-sm text-[#E08080]">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F0A83A] px-4 py-2.5 text-sm font-medium text-[#15181D] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#8B92A0]">
            Avinyaa Australia · ABN 57 184 217 792
          </p>
        </div>
      </div>
    </div>
  );
}
