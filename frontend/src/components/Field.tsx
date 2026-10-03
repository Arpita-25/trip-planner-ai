import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Small labelled form field used across the discovery search panels. */
export default function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="label-mono text-stone-500">{label}</Label>
      {children}
    </div>
  );
}
