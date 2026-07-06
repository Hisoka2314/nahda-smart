"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Imprimer / PDF" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer size={16} />
      {label}
    </Button>
  );
}
