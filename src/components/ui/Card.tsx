/**
 * @file Card Component
 */

import React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border border-gray-200 shadow-sm",
  elevated: "bg-white border border-gray-100 shadow-md",
  outlined: "bg-white border-2 border-gray-200",
};

export function Card({
  children,
  variant = "default",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("rounded-lg", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-b border-gray-100 p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-t border-gray-100 p-5", className)} {...props}>
      {children}
    </div>
  );
}