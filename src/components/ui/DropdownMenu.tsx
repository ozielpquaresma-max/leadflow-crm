/**
 * @file DropdownMenu Component
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DropdownMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
  danger?: boolean;
};

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center"
      >
        {trigger}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 min-w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          {items.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {item.divider ? <div className="my-2 border-t border-gray-100" /> : null}

              <button
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-gray-50",
                  item.danger ? "text-red-600" : "text-gray-700"
                )}
              >
                {item.icon ? (
                  <span className="flex-shrink-0">{item.icon}</span>
                ) : null}

                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}