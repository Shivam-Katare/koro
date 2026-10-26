import { cn } from "@/lib/utils";

interface KoroWordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function KoroWordmark({ size = "lg", className }: KoroWordmarkProps) {
  const sizeClasses = {
    sm: "text-xl tracking-tight font-black",
    md: "text-2xl sm:text-3xl tracking-tight font-black",
    lg: "text-3xl sm:text-4xl tracking-tight font-black",
    xl: "text-4xl sm:text-5xl tracking-tight font-black",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-heading select-none tracking-tight leading-none",
        sizeClasses,
        className
      )}
      aria-label="Koro"
    >
      <span className="text-[#0075de] dark:text-[#62aef0]">K</span>
      <span className="text-[#ffb110] dark:text-[#ffc107]">o</span>
      <span className="text-[#14a44d] dark:text-[#34d399]">r</span>
      <span className="text-[#f64932] dark:text-[#ff6b6b]">o</span>
    </span>
  );
}
