"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebase/config";
import { authFetch } from "../../../lib/clientApi";
import { useTranslation } from "../../../hooks/useTranslation";
import { useAppStore } from "../../../store/useAppStore";
import { EnablePushButton } from "../../../components/EnablePushButton";
import { Loader2, User as UserIcon, Phone, MapPin, CalendarDays, Languages, LogOut } from "lucide-react";

interface Me {
  name: string;
  mobileNumber: string;
  address: string;
  registrationDate: string | null;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { t, language } = useTranslation();
  const { setLanguage } = useAppStore();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/me");
        if (res.ok) setMe(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
        <UserIcon className="h-6 w-6" /> {t("profile")}
      </h1>

      {/* Identity card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
          {me?.name ? initials(me.name) : <UserIcon className="h-8 w-8" />}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold truncate">{me?.name || "—"}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="h-3.5 w-3.5" /> {me?.mobileNumber}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
        {me?.address && (
          <Row icon={MapPin} label={t("address")} value={me.address} />
        )}
        {me?.registrationDate && (
          <Row icon={CalendarDays} label={t("memberSince")} value={new Date(me.registrationDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
        )}
      </div>

      {/* Settings */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">{t("accountSettings")}</h2>
        <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
          <div className="flex items-center justify-between gap-3 p-4">
            <span className="flex items-center gap-2 font-medium"><Languages className="h-4 w-4 text-muted-foreground" /> {t("language")}</span>
            <div className="inline-flex rounded-xl border border-border overflow-hidden">
              <button onClick={() => setLanguage("hi")} className={`px-3 h-9 text-sm font-medium ${language === "hi" ? "bg-primary text-primary-foreground" : "bg-background"}`}>हिंदी</button>
              <button onClick={() => setLanguage("en")} className={`px-3 h-9 text-sm font-medium ${language === "en" ? "bg-primary text-primary-foreground" : "bg-background"}`}>English</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <span className="font-medium">{t("updates")}</span>
            <EnablePushButton />
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full h-12 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive font-medium flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
      >
        <LogOut className="h-5 w-5" /> {t("logout")}
      </button>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
