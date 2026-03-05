"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn, getPlatformColor } from "@/lib/utils";
import { Platform } from "@/types/product";
import { Check } from "lucide-react";

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onPlatformsChange: (platforms: Platform[]) => void;
}

const platforms: { id: Platform; name: string; logo: string; bgColor: string; disabled?: boolean }[] = [
  { id: "taobao", name: "Taobao", logo: "/logos/taobao.png", bgColor: "bg-orange-50" },
  { id: "1688", name: "1688", logo: "/logos/1688.png", bgColor: "bg-blue-50", disabled: true },
  { id: "temu", name: "Temu", logo: "/logos/temu.png", bgColor: "bg-orange-50", disabled: true },
  { id: "amazon", name: "Amazon", logo: "/logos/amazon.png", bgColor: "bg-yellow-50", disabled: true },
];

export function PlatformSelector({
  selectedPlatforms,
  onPlatformsChange,
}: PlatformSelectorProps) {
  const togglePlatform = (platformId: Platform, isDisabled: boolean) => {
    if (isDisabled) return; // Don't allow toggling disabled platforms
    
    if (selectedPlatforms.includes(platformId)) {
      onPlatformsChange(selectedPlatforms.filter((p) => p !== platformId));
    } else {
      onPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-3">
        {platforms.map((platform, index) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const isDisabled = platform.disabled || false;
          return (
            <motion.button
              key={platform.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => togglePlatform(platform.id, isDisabled)}
              disabled={isDisabled}
              className={cn(
                "relative flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all duration-200",
                isDisabled
                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "border-sky-400 bg-sky-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-sky-300 hover:shadow-sm"
              )}
            >
              {isDisabled && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gray-400 text-white text-[10px] font-medium">
                  Soon
                </div>
              )}
              {isSelected && !isDisabled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-sky-500 flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}
              <div className="w-16 h-6 flex items-center justify-center">
                <img 
                  src={platform.logo} 
                  alt={platform.name}
                  className={cn(
                    "max-w-full max-h-full object-contain",
                    isDisabled && "grayscale"
                  )}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <span className="hidden font-semibold text-gray-900 text-sm">
                  {platform.name}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
