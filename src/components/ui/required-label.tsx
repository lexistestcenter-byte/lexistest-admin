"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RequiredLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
  children: React.ReactNode;
}

export function RequiredLabel({
  required = false,
  children,
  className,
  ...props
}: RequiredLabelProps) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  );
}
