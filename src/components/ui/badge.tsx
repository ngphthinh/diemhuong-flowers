import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      rose: "bg-rose-soft text-rose-dark",
      sage: "bg-sage/15 text-sage-dark",
      muted: "bg-muted text-muted-foreground",
      solid: "bg-rose text-white",
    },
  },
  defaultVariants: { variant: "rose" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
