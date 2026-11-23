"use client";

import { useEffect, useState } from "react";

const timeZone = "Africa/Johannesburg";
const administratorName = "Mr HP Buthelezi";

function getGreeting(date: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", hourCycle: "h23",
  }).format(date));
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export function AdminGreeting() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const date = now ? new Intl.DateTimeFormat("en-ZA", {
    timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now) : null;
  const time = now ? new Intl.DateTimeFormat("en-ZA", {
    timeZone, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(now) : null;

  return (
    <>
      <p className="mk-eyebrow">MAKABONGWE / ADMINISTRATION</p>
      <h1>{now ? getGreeting(now) : "Welcome"}, <span className="mk-person-name">{administratorName}</span>.</h1>
      <p className="mk-greeting-context">
        {now ? <time dateTime={now.toISOString()}>{date} · {time} SAST</time> : "Preparing your workspace"}
        <span className="mk-greeting-divider" aria-hidden="true"> / </span>
        Training operations overview
      </p>
    </>
  );
}
