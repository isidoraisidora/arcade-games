export type SessionScore = { game: string; points: number; username?: string };
export type SessionScoresSnapshot = { scores: SessionScore[]; error: string };

const storageKey = "pixel-palace-session-scores";
const changeEvent = "pixel-palace-session-scores-change";
const emptySnapshot: SessionScoresSnapshot = { scores: [], error: "" };
let snapshot: SessionScoresSnapshot | undefined;

export function getSessionScoresSnapshot(): SessionScoresSnapshot {
  if (typeof window === "undefined") return emptySnapshot;
  if (snapshot) return snapshot;

  try {
    const saved = window.sessionStorage.getItem(storageKey);
    if (!saved) {
      snapshot = emptySnapshot;
    } else {
      const parsed: unknown = JSON.parse(saved);
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (score) =>
            typeof score === "object" &&
            score !== null &&
            "game" in score &&
            typeof score.game === "string" &&
            "points" in score &&
            typeof score.points === "number" &&
            Number.isSafeInteger(score.points),
        )
      ) {
        throw new Error("Guest scores in this browser session have an invalid format.");
      }
      snapshot = { scores: parsed as SessionScore[], error: "" };
    }
  } catch (error) {
    console.error("Unable to restore Pixel Palace guest scores.", error);
    snapshot = {
      scores: [],
      error: "Some guest scores could not be restored from this browser session.",
    };
  }

  return snapshot;
}

export function subscribeToSessionScores(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  return () => window.removeEventListener(changeEvent, callback);
}

export function recordSessionScore(score: SessionScore): SessionScoresSnapshot {
  const scores = [score, ...getSessionScoresSnapshot().scores]
    .sort((left, right) => right.points - left.points)
    .slice(0, 10);
  let error = "";

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(scores));
  } catch (storageError) {
    console.error("Unable to save Pixel Palace guest scores.", storageError);
    error = "Your score couldn't be saved in this browser session.";
  }

  snapshot = { scores, error };
  window.dispatchEvent(new Event(changeEvent));
  return snapshot;
}
