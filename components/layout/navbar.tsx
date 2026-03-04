"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Search", icon: Search },
  { href: "/proposals", label: "Proposals", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-sky-100 rounded-full blur-sm"></div>
        <div className="relative flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-full px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "relative px-6 py-2 rounded-full transition-all duration-300 flex items-center gap-2",
                    isActive 
                      ? "text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-pill"
                      className="absolute inset-0 bg-sky-500 rounded-full shadow-md"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10 font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
