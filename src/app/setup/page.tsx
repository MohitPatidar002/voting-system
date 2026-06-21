"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Registering...");

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-setup-secret": secret,
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("Success! You are now the Superadmin. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setStatus(data.error || "Failed to register.");
      }
    } catch (err) {
      setStatus("An error occurred.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg border border-border">
        <h1 className="text-2xl font-bold mb-4 text-center">Bootstrap First Admin</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          One-time bootstrap. Enter the setup secret and your 10-digit mobile
          number to register the first Superadmin. This is disabled once a
          Superadmin exists.
        </p>

        <form onSubmit={handleSetup} className="space-y-4">
          <input
            type="password"
            required
            placeholder="Setup secret"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <input
            type="text"
            required
            maxLength={10}
            placeholder="e.g. 9876543210"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium">
            Make me Admin
          </button>
        </form>
        {status && <p className="mt-4 text-center font-medium text-primary">{status}</p>}
      </div>
    </div>
  );
}
