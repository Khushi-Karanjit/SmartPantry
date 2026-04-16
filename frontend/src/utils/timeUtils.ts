/**
 * Standardizes time formatting across the SmartPantry application.
 * Returns both a relative string (e.g., "2 days ago") and an exact timestamp.
 */

export function formatFullTimestamp(dateIso: string | Date) {
  const date = new Date(dateIso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // Exact format: "Thursday, April 16, 2026, 8:00 PM"
  const exact = date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Relative logic
  let relative = "";
  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    if (daysAgo === 0) relative = "today";
    else if (daysAgo === 1) relative = "yesterday";
    else relative = `${daysAgo} days ago`;
  } else if (diffDays === 0) {
    relative = "today";
  } else if (diffDays === 1) {
    relative = "tomorrow";
  } else {
    relative = `in ${diffDays} days`;
  }

  // Handle "just now" for very recent events (within 1 minute)
  const absDiffSec = Math.abs(Math.floor((now.getTime() - date.getTime()) / 1000));
  if (absDiffSec < 60) {
    relative = "just now";
  } else if (absDiffSec < 3600 && absDiffSec >= 60) {
    const mins = Math.floor(absDiffSec / 60);
    relative = `${mins}m ago`;
  }

  return { relative, exact };
}
