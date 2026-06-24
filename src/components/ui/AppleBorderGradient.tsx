"use client";

import { motion } from "framer-motion";

interface AppleBorderGradientProps {
  children: React.ReactNode;
  className?: string;
  gradientClassName?: string;
  preview?: boolean;
  intensity?: "sm" | "md" | "lg" | "xl";
}

export function AppleBorderGradient({
  children,
  className = "",
  gradientClassName = "",
  preview = true,
  intensity = "lg",
}: AppleBorderGradientProps) {
  const blurMap = {
    sm: "blur-md",
    md: "blur-lg",
    lg: "blur-xl",
    xl: "blur-2xl",
  };

  return (
    <div className={`relative p-[1.5px] rounded-3xl overflow-hidden bg-slate-900/40 ${className}`}>
      {/* Background ambient glow layer */}
      {preview && (
        <motion.div
          className={`absolute -inset-10 opacity-70 z-0 ${blurMap[intensity]} ${gradientClassName}`}
          style={{
            background: "conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #06b6d4, #6366f1)",
            transformOrigin: "center",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        />
      )}

      {/* Rotating border gradient layer */}
      {preview && (
        <motion.div
          className={`absolute inset-0 z-0 ${gradientClassName}`}
          style={{
            background: "conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #06b6d4, #6366f1)",
            transformOrigin: "center",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        />
      )}

      {/* Content wrapper with background cover */}
      <div className="relative z-10 w-full h-full bg-slate-950 rounded-[22px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
