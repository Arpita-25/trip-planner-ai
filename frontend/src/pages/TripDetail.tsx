import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BudgetCalculator from "@/components/BudgetCalculator";
import TripHeader from "@/components/TripHeader";
import AssistantPanel from "@/components/panels/AssistantPanel";
import ExplorePanel from "@/components/panels/ExplorePanel";
import FlightsPanel from "@/components/panels/FlightsPanel";
import ItineraryPanel from "@/components/panels/ItineraryPanel";
import MapPanel from "@/components/panels/MapPanel";
import OverviewPanel from "@/components/panels/OverviewPanel";
import StaysPanel from "@/components/panels/StaysPanel";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrip, useTripBudget, useTrips } from "@/hooks/useTrip";
import { Link } from "react-router-dom";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHx0aGFpbGFuZCUyMGJlYWNoJTIwdHJvcGljYWx8ZW58MHx8fHwxNzg2MTIyMjQ4fDA&ixlib=rb-4.1.0&q=85";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "itinerary", label: "Itinerary" },
  { value: "flights", label: "Flights" },
  { value: "stays", label: "Stays" },
  { value: "explore", label: "Explore" },
  { value: "map", label: "Map" },
  { value: "budget", label: "Budget" },
  { value: "copilot", label: "AI Copilot" },
];

export default function TripDetail() {
  const { tripId, tab } = useParams<{ tripId: string; tab?: string }>();
  const navigate = useNavigate();
  const activeTab = TABS.some((item) => item.value === tab) ? (tab as string) : "overview";

  const { data: trip, isLoading, isError } = useTrip(tripId);
  const { data: budget } = useTripBudget(tripId);
  const { data: summaries } = useTrips();

  useEffect(() => {
    if (tab && !TABS.some((item) => item.value === tab)) {
      navigate(`/trips/${tripId}`, { replace: true });
    }
  }, [tab, tripId, navigate]);

  const cover =
    summaries?.find((summary) => summary.id === tripId)?.cover_image ?? FALLBACK_COVER;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center" data-testid="trip-detail-error">
        <h1 className="font-display text-3xl font-semibold">We couldn't open this trip</h1>
        <p className="mt-2 text-stone-600">
          It may have been deleted, or it belongs to another account.
        </p>
        <Link to="/trips" className={`${buttonVariants()} mt-6`} data-testid="trip-detail-back-link">
          Back to my trips
        </Link>
      </div>
    );
  }

  if (isLoading || !trip) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-10" data-testid="trip-detail-loading">
        <div className="h-64 animate-pulse rounded-3xl bg-sand" />
        <div className="h-10 w-96 animate-pulse rounded-xl bg-sand" />
        <div className="h-72 animate-pulse rounded-3xl bg-sand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-10" data-testid="trip-detail-page">
      <TripHeader trip={trip} budget={budget} coverImage={cover} />

      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          navigate(value === "overview" ? `/trips/${trip.id}` : `/trips/${trip.id}/${value}`)
        }
      >
        <TabsList variant="line" className="w-full flex-wrap justify-start">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value} data-testid={`trip-tab-${item.value}`}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 animate-in fade-in-50 duration-300">
          <TabsContent value="overview">
            <OverviewPanel
              trip={trip}
              budget={budget}
              onNavigate={(next) =>
                navigate(next === "overview" ? `/trips/${trip.id}` : `/trips/${trip.id}/${next}`)
              }
            />
          </TabsContent>
          <TabsContent value="itinerary">
            <ItineraryPanel trip={trip} />
          </TabsContent>
          <TabsContent value="flights">
            <FlightsPanel trip={trip} />
          </TabsContent>
          <TabsContent value="stays">
            <StaysPanel trip={trip} />
          </TabsContent>
          <TabsContent value="explore">
            <ExplorePanel trip={trip} />
          </TabsContent>
          <TabsContent value="map">
            <MapPanel trip={trip} />
          </TabsContent>
          <TabsContent value="budget">
            <div className="grid gap-6 lg:grid-cols-2" data-testid="budget-panel">
              <BudgetCalculator budget={budget} travelers={trip.travelers} />
              <div className="space-y-4 rounded-2xl border border-sand-line bg-white p-6 shadow-sm">
                <h3 className="font-display text-2xl font-semibold">How this is calculated</h3>
                <ul className="space-y-2 text-sm text-stone-600">
                  <li>
                    <strong className="text-stone-800">Flights & stays</strong> — the totals of the
                    options you saved to this trip.
                  </li>
                  <li>
                    <strong className="text-stone-800">Food, nightlife, activities</strong> — the
                    per-person cost of every itinerary item, multiplied by {trip.travelers}{" "}
                    traveller{trip.travelers > 1 ? "s" : ""}.
                  </li>
                  <li>
                    <strong className="text-stone-800">Transport</strong> — a daily local allowance
                    plus one intercity hop between each pair of cities.
                  </li>
                  <li>
                    All arithmetic runs in backend Python. The AI can suggest how to cut costs, but
                    never produces the numbers.
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="copilot">
            <AssistantPanel trip={trip} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
