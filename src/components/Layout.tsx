import React from "react";
import Sidebar from "./Sidebar";
import { Logo } from "@/components/Logo";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="flex">
        <aside className="w-80 border-r bg-white min-h-screen">
          <div className="px-4 py-5 border-b flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <div>
              <div className="font-semibold text-lg">HealthifyMe AI</div>
              <div className="text-xs text-gray-500">AI Chat</div>
            </div>
          </div>
          <Sidebar />
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
