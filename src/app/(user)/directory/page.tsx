"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { Loader2, Contact, Phone, MapPin } from "lucide-react";

interface Member {
  id: string;
  name: string;
  designation: string;
  ward: string;
  mobileNumber: string;
  tenure: string;
  photoUrl: string;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function DirectoryPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/directory");
        const data = await res.json();
        if (res.ok) setMembers(data.members || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Contact className="h-6 w-6" /> {t("directory")}
        </h1>
        <p className="text-muted-foreground">{t("directoryDesc")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noDirectory")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m.id} className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-4">
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.name} className="h-16 w-16 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
                  {initials(m.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold leading-tight truncate">{m.name}</div>
                <div className="text-sm text-primary font-medium">{m.designation}</div>
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                  {m.ward && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{t("ward")} {m.ward}</span>}
                  {m.tenure && <span>{m.tenure}</span>}
                </div>
                {m.mobileNumber && (
                  <div className="flex items-center gap-1 mt-1 text-xs font-medium text-foreground">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {m.mobileNumber}
                  </div>
                )}
              </div>
              {m.mobileNumber && (
                <a
                  href={`tel:+91${m.mobileNumber}`}
                  aria-label={`${t("call")} ${m.name}`}
                  className="shrink-0 flex flex-col items-center justify-center gap-1 h-16 w-16 rounded-2xl bg-green-500/10 text-green-600 active:scale-95 transition-transform"
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-[10px] font-bold">{t("call")}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
