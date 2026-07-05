/**
 * @file Avatar Component
 */

import React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";
type AvatarStatus = "online" | "away" | "offline";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const statusClasses: Record<AvatarStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  offline: "bg-gray-400",
};

function getInitials(name?: string) {
  if (!name) return "U";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({
  name = "Usuário",
  src,
  size = "md",
  status,
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-blue-600 font-bold text-white",
          sizeClasses[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
            statusClasses[status]
          )}
        />
      ) : null}
    </div>
  );
}