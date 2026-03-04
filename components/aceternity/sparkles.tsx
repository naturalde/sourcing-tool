"use client";
import React, { useId } from "react";
import { motion } from "framer-motion";

export const SparklesCore = (props: {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
}) => {
  const {
    id,
    background = "transparent",
    minSize = 0.4,
    maxSize = 1,
    particleDensity = 100,
    className,
    particleColor = "#FFF",
  } = props;
  const generatedId = useId();
  const sparklesId = id || generatedId;

  return (
    <div className={className}>
      <svg className="h-full w-full" viewBox="0 0 400 400">
        <defs>
          <radialGradient id={`gradient-${sparklesId}`}>
            <stop offset="0%" stopColor={particleColor} stopOpacity="1" />
            <stop offset="100%" stopColor={particleColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill={background} />
        {[...Array(particleDensity)].map((_, i) => (
          <motion.circle
            key={`particle-${i}`}
            cx={Math.random() * 400}
            cy={Math.random() * 400}
            r={Math.random() * (maxSize - minSize) + minSize}
            fill={`url(#gradient-${sparklesId})`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </svg>
    </div>
  );
};
