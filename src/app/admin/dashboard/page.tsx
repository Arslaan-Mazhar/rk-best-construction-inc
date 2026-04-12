"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardList,
  LogOut,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const fetchSecureData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) return;

        const token = await user.getIdToken();

        const res = await axios.get("/api/secure", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(res.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("API Error:", error.response?.data || error.message);
        } else {
          console.error("Unexpected Error:", error);
        }
      }
    };

    fetchSecureData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const cards = [
    {
      title: "Labours",
      desc: "Manage all workers",
      icon: Users,
      href: "/admin/labours",
      color: "bg-blue-500",
    },
    {
      title: "Jobs",
      desc: "Active job listings",
      icon: Briefcase,
      href: "/admin/jobs",
      color: "bg-green-500",
    },
    {
      title: "Work Entries",
      desc: "Daily attendance & logs",
      icon: ClipboardList,
      href: "/admin/entries",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
          <LayoutDashboard /> Admin Panel
        </h2>

        <nav className="space-y-4">
          {cards.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <item.icon size={18} />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-10 flex items-center gap-2 text-red-500 hover:text-red-600"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back, Admin 👋</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>

                <div className={`${item.color} p-3 rounded-xl text-white`}>
                  <item.icon size={22} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Optional info section */}
        <div className="mt-10 bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold mb-2">
            System Status
          </h3>
          <p className="text-gray-500 text-sm">
            Secure API connection is active. Firebase authentication is running normally.
          </p>
        </div>
      </main>
    </div>
  );
}