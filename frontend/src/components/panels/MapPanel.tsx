import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  useMap,
} from "@vis.gl/react-google-maps";
import { ExternalLink, Footprints, Hotel, MapPin, Star } from "lucide-react";

import Field from "@/components/Field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { MapPoint, MapPointKind, MapsConfig, MapViewResponse, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_META: Record<MapPointKind, { label: string; pin: string; dot: string }> = {
  stay: { label: "Stays", pin: "bg-terracotta", dot: "bg-terracotta" },
  beach: { label: "Beaches", pin: "bg-sky-500", dot: "bg-sky-500" },
  nightlife: { label: "Nightlife", pin: "bg-violet-500", dot: "bg-violet-500" },
  food: { label: "Food", pin: "bg-amber-500", dot: "bg-amber-500" },
  activity: { label: "Activities", pin: "bg-emerald-600", dot: "bg-emerald-600" },
  place: { label: "Places", pin: "bg-teal", dot: "bg-teal" },
};

const KIND_ORDER: MapPointKind[] = ["stay", "beach", "nightlife", "food", "activity", "place"];

export default function MapPanel({ trip }: { trip: Trip }) {
  const cities = trip.cities.length ? trip.cities.map((city) => city.name) : [trip.destination];
  const [city, setCity] = useState(cities[0]);
  const [anchorId, setAnchorId] = useState<string>("");
  const [active, setActive] = useState<MapPointKind[]>(KIND_ORDER);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [authFailed, setAuthFailed] = useState(false);

  // Google reports key problems (bad referrer, API not enabled, billing) through this global
  // rather than a rejected request — without it the user just sees a grey rectangle.
  useEffect(() => {
    const w = window as unknown as { gm_authFailure?: () => void };
    const previous = w.gm_authFailure;
    w.gm_authFailure = () => setAuthFailed(true);
    return () => {
      w.gm_authFailure = previous;
    };
  }, []);

  const config = useQuery<MapsConfig>({
    queryKey: ["config", "maps"],
    queryFn: () => apiGet<MapsConfig>("/config/maps"),
    staleTime: 5 * 60_000,
  });

  const view = useQuery<MapViewResponse>({
    queryKey: ["trip", trip.id, "map", city, anchorId],
    queryFn: () =>
      apiGet<MapViewResponse>(
        `/trips/${trip.id}/map?city=${encodeURIComponent(city)}${
          anchorId ? `&anchor_stay_id=${encodeURIComponent(anchorId)}` : ""
        }`,
      ),
  });

  const points = useMemo(
    () => (view.data?.points ?? []).filter((point) => active.includes(point.kind)),
    [view.data, active],
  );

  const toggleKind = (kind: MapPointKind) =>
    setActive((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));

  return (
    <div className="space-y-6" data-testid="map-panel">
      <div>
        <h2 className="font-display text-3xl font-semibold">Map</h2>
        <p className="text-sm text-stone-600">
          Everything in one city at once — pick a saved stay as your anchor and see exactly how far
          the beaches, bars and restaurants are from your door.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-sand-line bg-white p-5 shadow-sm sm:grid-cols-2">
        <Field label="City">
          <Select
            value={city}
            onValueChange={(value: string) => {
              setCity(value);
              setAnchorId("");
              setSelected(null);
            }}
          >
            <SelectTrigger data-testid="map-city-select">
              <SelectValue>{(value) => String(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cities.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Measure distances from">
          <Select
            value={view.data?.anchor.id ?? ""}
            onValueChange={(value: string) => {
              setAnchorId(value);
              setSelected(null);
            }}
          >
            <SelectTrigger data-testid="map-anchor-select">
              <SelectValue>
                {(value) =>
                  view.data?.anchor_options.find((option) => option.id === String(value))?.name ??
                  "Loading…"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(view.data?.anchor_options ?? []).map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.kind === "stay" ? `${option.name} (saved stay)` : option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {KIND_ORDER.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => toggleKind(kind)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all duration-150 active:scale-95",
                active.includes(kind)
                  ? "border-stone-800 bg-stone-900 text-white"
                  : "border-sand-line bg-white text-stone-600 hover:border-stone-400",
              )}
              data-testid={`map-filter-${kind}`}
            >
              <span className={cn("size-2.5 rounded-full", KIND_META[kind].dot)} />
              {KIND_META[kind].label}
            </button>
          ))}
        </div>
      </div>

      {view.data?.anchor && (
        <p className="text-sm text-stone-600" data-testid="map-anchor-summary">
          Distances measured from{" "}
          <strong className="text-stone-900">{view.data.anchor.name}</strong>
          {view.data.anchor.kind === "city" && " — save a stay to measure from your hotel instead"}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {config.isPending && <div className="h-[32rem] animate-pulse rounded-2xl bg-sand" />}

          {!config.isPending && !config.data?.configured && (
            <MapKeyMissing pointCount={points.length} />
          )}

          {!config.isPending && config.data?.configured && authFailed && (
            <MapAuthFailed pointCount={points.length} />
          )}

          {!config.isPending && config.data?.configured && !authFailed && (
            <div
              className="h-[32rem] overflow-hidden rounded-2xl border border-sand-line shadow-sm"
              data-testid="map-canvas"
            >
              <APIProvider apiKey={config.data.maps_api_key}>
                <GoogleMap
                  mapId={config.data.map_id}
                  defaultCenter={{
                    lat: view.data?.center.lat ?? 0,
                    lng: view.data?.center.lng ?? 0,
                  }}
                  defaultZoom={12}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  mapTypeControl={false}
                  streetViewControl={false}
                  fullscreenControl={false}
                  style={{ width: "100%", height: "100%" }}
                >
                  <FitToPoints points={points} />
                  {points.map((point) => (
                    <AdvancedMarker
                      key={point.id}
                      position={{ lat: point.coordinates.lat, lng: point.coordinates.lng }}
                      onClick={() => setSelected(point)}
                      title={point.name}
                    >
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full border-2 border-white text-[0.6rem] font-semibold text-white shadow-md transition-transform duration-150 hover:scale-125",
                          KIND_META[point.kind].pin,
                          point.id === view.data?.anchor.id && "size-9 ring-4 ring-terracotta/30",
                        )}
                      >
                        {point.kind === "stay" ? <Hotel className="size-3.5" /> : point.distance_km}
                      </span>
                    </AdvancedMarker>
                  ))}

                  {selected && (
                    <InfoWindow
                      position={{
                        lat: selected.coordinates.lat,
                        lng: selected.coordinates.lng,
                      }}
                      onCloseClick={() => setSelected(null)}
                    >
                      <div className="min-w-[12rem] p-1" data-testid="map-info-window">
                        <p className="font-semibold text-stone-900">{selected.name}</p>
                        <p className="text-xs text-stone-500">
                          {selected.type_label} · {selected.location}
                        </p>
                        <p className="mt-1 text-xs text-stone-700">
                          {selected.distance_km} km from {view.data?.anchor.name} ·{" "}
                          {selected.walk_minutes} min walk
                        </p>
                        {selected.estimated_cost > 0 && (
                          <p className="mt-1 text-xs font-medium">
                            {formatMoney(selected.estimated_cost, selected.currency)}
                            {selected.kind === "stay" ? " / night" : " pp"}
                          </p>
                        )}
                        {selected.provider_url && (
                          <a
                            href={selected.provider_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
                          >
                            Open provider <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            </div>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-xl">Nearest to your anchor</CardTitle>
            <CardDescription>
              {view.isPending
                ? "Measuring distances…"
                : `${points.length} place${points.length === 1 ? "" : "s"} in ${view.data?.city ?? city}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view.isError && (
              <p className="text-sm text-stone-600" data-testid="map-error-state">
                We couldn't load the map data right now. Try again in a moment.
              </p>
            )}
            {!view.isPending && points.length === 0 && (
              <p className="text-sm text-stone-600" data-testid="map-empty-state">
                No places match those filters — switch a category back on above.
              </p>
            )}
            <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1" data-testid="map-distance-list">
              {points.slice(0, 40).map((point) => (
                <li key={point.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(point)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 hover:bg-sand"
                    data-testid={`map-distance-row-${point.id}`}
                  >
                    <span className={cn("size-2.5 shrink-0 rounded-full", KIND_META[point.kind].dot)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-stone-800">
                        {point.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-stone-500">
                        {point.type_label}
                        {point.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {point.rating}
                          </span>
                        )}
                        {point.saved && (
                          <Badge variant="secondary" className="label-mono px-1 py-0">
                            Saved
                          </Badge>
                        )}
                        {point.in_itinerary && (
                          <Badge variant="outline" className="label-mono px-1 py-0">
                            In plan
                          </Badge>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-sm font-semibold tabular-nums">
                        {point.id === view.data?.anchor.id ? "—" : `${point.distance_km} km`}
                      </span>
                      {point.id !== view.data?.anchor.id && (
                        <span className="flex items-center justify-end gap-1 text-xs text-stone-400">
                          <Footprints className="size-3" /> {point.walk_minutes}m
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Frames every visible pin; must live inside <Map> for useMap() to resolve. */
function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;
    const lats = points.map((point) => point.coordinates.lat);
    const lngs = points.map((point) => point.coordinates.lng);
    // LatLngBoundsLiteral keeps us off the `google.maps` global namespace.
    map.fitBounds(
      {
        north: Math.max(...lats) + 0.01,
        south: Math.min(...lats) - 0.01,
        east: Math.max(...lngs) + 0.01,
        west: Math.min(...lngs) - 0.01,
      },
      48,
    );
  }, [map, points]);

  return null;
}

function MapAuthFailed({ pointCount }: { pointCount: number }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <Card className="h-[32rem] overflow-y-auto" data-testid="map-auth-failed">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Google rejected the map key</CardTitle>
        <CardDescription>
          Your {pointCount} places and their distances are listed on the right and are unaffected —
          only the basemap is blocked.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-stone-600">
        <p>
          The most common cause is a referrer restriction that doesn't include this site. In Google
          Cloud Console open your key and, under{" "}
          <strong className="text-stone-800">Application restrictions → HTTP referrers</strong>, add:
        </p>
        <code
          className="block rounded-lg bg-sand px-3 py-2 font-mono text-xs break-all"
          data-testid="map-auth-referrer"
        >
          {origin}/*
        </code>
        <p>
          Then confirm <strong className="text-stone-800">Maps JavaScript API</strong> is enabled
          under APIs &amp; Services → Library, and that the project has a billing account linked.
          Key edits can take a few minutes to propagate — reload this page afterwards.
        </p>
      </CardContent>
    </Card>
  );
}

function MapKeyMissing({ pointCount }: { pointCount: number }) {
  return (
    <Card className="h-[32rem]" data-testid="map-key-missing">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Add a Google Maps key to see the map</CardTitle>
        <CardDescription>
          The {pointCount} places and their distances are already calculated and listed on the right
          — only the basemap needs a key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-stone-600">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            In Google Cloud Console, enable <strong>Maps JavaScript API</strong> for your project.
          </li>
          <li>
            Create an <strong>API key</strong> under APIs &amp; Services → Credentials.
          </li>
          <li>
            Restrict it to HTTP referrers for this site, then put it in{" "}
            <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">
              backend/.env
            </code>{" "}
            as{" "}
            <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">
              GOOGLE_MAPS_API_KEY
            </code>
            .
          </li>
          <li>Restart the backend — the map appears here automatically.</li>
        </ol>
        <p className="flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="size-3.5" /> The key is served to the browser at runtime, so it never
          lands in the committed frontend bundle.
        </p>
      </CardContent>
    </Card>
  );
}
