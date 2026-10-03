import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center" data-testid="not-found-page">
      <p className="label-mono text-terracotta">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">This page went off-route</h1>
      <p className="mt-3 text-stone-600">
        The page you're looking for doesn't exist. Your trips are all still here.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonVariants()} data-testid="not-found-home-link">
          Plan a trip
        </Link>
        <Link to="/trips" className={buttonVariants({ variant: "outline" })}>
          My trips
        </Link>
      </div>
    </div>
  );
}
