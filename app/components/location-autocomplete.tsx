"use client";

import { useEffect, useRef, useState } from "react";

type PlaceDetails = {
  displayName?: string;
  formattedAddress?: string;
  fetchFields(options: { fields: string[] }): Promise<void>;
};

type PlacePrediction = {
  toPlace(): PlaceDetails;
};

type PlaceSelectEvent = Event & {
  placePrediction: PlacePrediction;
};

type PlaceAutocompleteElementInstance = HTMLElement & {
  placeholder: string;
  includedRegionCodes: string[];
  value?: string;
};

type PlaceAutocompleteElementConstructor = new () => PlaceAutocompleteElementInstance;

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      importLibrary?: (name: string) => Promise<{
        PlaceAutocompleteElement: PlaceAutocompleteElementConstructor;
      }>;
    };
  };
};

let googleMapsLoader: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string) {
  const googleWindow = window as GoogleMapsWindow;

  if (googleWindow.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-makabongwe-google-maps="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Maps could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.dataset.makabongweGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Google Maps could not be loaded.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return googleMapsLoader;
}

export function LocationAutocomplete() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<PlaceAutocompleteElementInstance | null>(null);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    apiKey ? "loading" : "fallback",
  );

  useEffect(() => {
    if (!apiKey || !hostRef.current) {
      setStatus("fallback");
      return;
    }

    let cancelled = false;
    let widget: PlaceAutocompleteElementInstance | null = null;
    const host = hostRef.current;
    const form = host.closest("form");

    const handleReset = () => {
      setValue("");
      if (widgetRef.current) {
        widgetRef.current.value = "";
      }
    };

    form?.addEventListener("reset", handleReset);

    async function initialise() {
      try {
        await loadGoogleMaps(apiKey);
        const googleWindow = window as GoogleMapsWindow;
        const importLibrary = googleWindow.google?.maps?.importLibrary;

        if (!importLibrary) {
          throw new Error("Google Maps Places library is unavailable.");
        }

        const { PlaceAutocompleteElement } = await importLibrary("places");
        if (cancelled) {
          return;
        }

        widget = new PlaceAutocompleteElement();
        widgetRef.current = widget;
        widget.placeholder = "Search for a town, municipality or site";
        widget.includedRegionCodes = ["za"];
        widget.style.display = "block";
        widget.style.width = "100%";
        widget.style.minHeight = "48px";
        widget.setAttribute("aria-label", "Programme location");

        const handleInput = () => {
          setValue(widget?.value?.slice(0, 160) ?? "");
        };

        const handlePlaceSelect = async (event: Event) => {
          const selection = event as PlaceSelectEvent;
          const place = selection.placePrediction.toPlace();
          await place.fetchFields({
            fields: ["displayName", "formattedAddress"],
          });

          const selectedLocation = (
            place.formattedAddress ||
            place.displayName ||
            widget?.value ||
            ""
          ).slice(0, 160);

          setValue(selectedLocation);
          if (widget) {
            widget.value = selectedLocation;
          }
        };

        widget.addEventListener("input", handleInput);
        widget.addEventListener("gmp-select", handlePlaceSelect);
        host.replaceChildren(widget);
        setStatus("ready");
      } catch (error) {
        console.warn("Location suggestions are unavailable", error);
        if (!cancelled) {
          setStatus("fallback");
        }
      }
    }

    void initialise();

    return () => {
      cancelled = true;
      form?.removeEventListener("reset", handleReset);
      widgetRef.current = null;
      host.replaceChildren();
    };
  }, [apiKey]);

  if (status === "fallback") {
    return (
      <input
        name="programmeLocation"
        minLength={2}
        maxLength={160}
        autoComplete="address-level2"
        placeholder="Town, municipality or site"
      />
    );
  }

  return (
    <>
      <input type="hidden" name="programmeLocation" value={value} />
      <div ref={hostRef} className="location-autocomplete-host">
        {status === "loading" && (
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.slice(0, 160))}
            minLength={2}
            maxLength={160}
            autoComplete="address-level2"
            placeholder="Loading location suggestions..."
            aria-label="Programme location"
          />
        )}
      </div>
      <span className="location-helper">Start typing and choose a Google location suggestion.</span>
    </>
  );
}
