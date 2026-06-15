"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../lib/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useTranslation } from "../../../hooks/useTranslation";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [role, setRole] = useState<string>("user");
  
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Format number to E.164 (Assuming India +91 for now)
    const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;

    try {
      const res = await fetch("/api/auth/verify-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formattedNumber })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || t("unauthorized"));
      }
      
      // Setup fresh recaptcha instance right before sending
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      setConfirmationResult(result);
      setRole(data.role);
      setStep("otp");
      
    } catch (err: any) {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e){}
        window.recaptchaVerifier = null;
      }
      setError(err.message || "Failed to verify number");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await confirmationResult.confirm(otp);
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(t("invalidOtp"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-6 text-center">{t("login")}</h2>
          
          {error && (
            <div className="p-3 mb-4 text-sm text-destructive-foreground bg-destructive rounded-md">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("mobileNumber")}</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    className="flex h-10 w-full rounded-none rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phoneNumber.length !== 10}
                className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "..." : t("sendOtp")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("enterOtp")}</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "..." : t("verifyOtp")}
              </button>
            </form>
          )}
          
          <div id="recaptcha-container"></div>
        </div>
      </main>
    </div>
  );
}

// Add to global window object
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
