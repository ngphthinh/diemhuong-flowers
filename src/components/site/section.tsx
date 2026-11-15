import Link from "next/link";
import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20", className)}
      {...props}>
      {children}
    </section>
  );
}

export function SectionHeading({
  id,
  title,
  description,
  href,
  linkLabel,
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-3xl font-semibold sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-rose-dark underline-offset-4 hover:underline">
          {linkLabel ?? "Xem tất cả"}
        </Link>
      )}
    </div>
  );
}
