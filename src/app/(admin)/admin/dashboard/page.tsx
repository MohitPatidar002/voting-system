"use client";

import { useTranslation } from "../../../../hooks/useTranslation";
import { Users, Vote, Bell, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../../../../lib/firebase/config";

export default function AdminDashboard() {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    households: 0,
    activePolls: 0,
    closedPolls: 0,
    notices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        
        const res = await fetch("/api/admin/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats({
            households: data.households || 0,
            activePolls: data.activePolls || 0,
            closedPolls: data.closedPolls || 0,
            notices: data.notices || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("adminDashboard")}</h1>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
          <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("households")}</p>
              <p className="text-2xl font-bold">{stats.households}</p>
            </div>
          </div>

          <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <Vote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("activePolls")}</p>
              <p className="text-2xl font-bold">{stats.activePolls}</p>
            </div>
          </div>

          <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("closedPolls")}</p>
              <p className="text-2xl font-bold">{stats.closedPolls}</p>
            </div>
          </div>

          <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("notices")}</p>
              <p className="text-2xl font-bold">{stats.notices}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & Recent Activity placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="text-sm text-muted-foreground">
            No recent activity to show.
          </div>
        </div>
        
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/admin/polls" className="block w-full text-left px-4 py-3 bg-muted hover:bg-accent rounded-md transition-colors font-medium">
              + Create New Poll
            </Link>
            <Link href="/admin/households" className="block w-full text-left px-4 py-3 bg-muted hover:bg-accent rounded-md transition-colors font-medium">
              + Add Household
            </Link>
            <Link href="/admin/notices" className="block w-full text-left px-4 py-3 bg-muted hover:bg-accent rounded-md transition-colors font-medium">
              + Post Notice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
