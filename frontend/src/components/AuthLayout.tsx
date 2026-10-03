import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

const QUOTE_IMAGE =
  "https://images.unsplash.com/photo-1534008897995-27a23e859048?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHx0aGFpbGFuZCUyMGJlYWNoJTIwdHJvcGljYWx8ZW58MHx8fHwxNzg2MTIyMjQ4fDA&ixlib=rb-4.1.0&q=85";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={QUOTE_IMAGE} alt="Turquoise bay" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(200,90,50,0.82)_0%,rgba(15,76,92,0.85)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5" data-testid="auth-brand-link">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Compass className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">VoyageAI</span>
          </Link>
          <div>
            <p className="font-display text-4xl leading-tight font-semibold">
              "Describe the trip you want. We'll handle the structure."
            </p>
            <p className="mt-4 max-w-md text-white/80">
              Itineraries, flights, stays, food and nightlife — organised around one trip, with a
              budget that always adds up.
            </p>
          </div>
          <p className="label-mono text-white/60">Planning, not payments. You book with providers.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-terracotta text-white">
              <Compass className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">VoyageAI</span>
          </Link>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-stone-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-stone-600">{footer}</div>
        </div>
      </div>
    </div>
  );
}
