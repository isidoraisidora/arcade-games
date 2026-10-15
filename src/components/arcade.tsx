"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AudioLines,
  CircleHelp,
  Gamepad2,
  Heart,
  LockKeyhole,
  LogOut,
  Play,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { GameCanvas } from "@/components/game-canvas";
import type { GameId } from "@/lib/game-engine";
import {
  getSessionScoresSnapshot,
  recordSessionScore,
  subscribeToSessionScores,
  type SessionScore,
} from "@/lib/session-scores";

type Game = {
  id: GameId;
  title: string;
  description: string;
  label: string;
  color: string;
  art: "snake" | "tetris" | "breakout" | "pong" | "invaders";
  controls: string;
};

type Score = { game: string; points: number; username?: string };

async function getApiError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : fallback;
}

const games: Game[] = [
  { id: "snake", title: "Snake", description: "One snack at a time. Try not to bite your tail.", label: "THE CLASSIC", color: "mint", art: "snake", controls: "Arrow keys or WASD" },
  { id: "tetris", title: "Block Party", description: "Stack it up. Clear a line. Keep the party going.", label: "PUZZLE", color: "pink", art: "tetris", controls: "← → move · ↑ rotate" },
  { id: "breakout", title: "Breakout", description: "Just you, a paddle, and a wall of tiny bricks.", label: "ARCADE", color: "blue", art: "breakout", controls: "← → move the paddle" },
  { id: "pong", title: "Pong", description: "The original living-room showdown. You vs. the machine.", label: "2-MINUTE BREAK", color: "yellow", art: "pong", controls: "← → move your paddle" },
  { id: "invaders", title: "Space Invaders", description: "The aliens are back. Good thing you are, too.", label: "SHOOTER", color: "purple", art: "invaders", controls: "← → move · Space fire" },
];

function Art({ game }: { game: Game }) {
  return (
    <div className={`game-art art-${game.color}`} aria-hidden="true">
      <div className="art-kicker"><span /> {game.label}</div>
      {game.art === "snake" && (
        <svg viewBox="0 0 220 120" className="art-illustration">
          <path d="M29 88h36V62h33V36h37v26h37" fill="none" stroke="#c6ffe9" strokeLinecap="square" strokeWidth="13" />
          <circle cx="175" cy="62" r="8" fill="#ff79ae" />
          <circle cx="135" cy="36" r="4" fill="#183c35" />
          <path d="M182 54l13-12M182 70l13 12" stroke="#8ef2ce" strokeLinecap="square" strokeWidth="5" />
          <circle cx="38" cy="34" r="5" fill="#e8ff87" opacity=".8" />
          <circle cx="195" cy="92" r="4" fill="#e8ff87" opacity=".7" />
        </svg>
      )}
      {game.art === "tetris" && (
        <svg viewBox="0 0 220 120" className="art-illustration">
          <g stroke="#fff4ed" strokeWidth="2">
            <path d="M36 30h28v28H36zM64 30h28v28H64zM92 30h28v28H92z" fill="#fa76ad" />
            <path d="M120 30h28v28h-28zM120 58h28v28h-28z" fill="#b8a0ff" />
            <path d="M64 58h28v28H64zM92 58h28v28H92zM36 86h28v28H36zM64 86h28v28H64zM92 86h28v28H92zM120 86h28v28h-28z" fill="#fbd46b" />
          </g>
          <path d="M155 35h34M155 43h25" stroke="#fff" strokeLinecap="square" strokeWidth="4" opacity=".5" />
        </svg>
      )}
      {game.art === "breakout" && (
        <svg viewBox="0 0 220 120" className="art-illustration">
          <g stroke="#233e75" strokeWidth="2">
            <path d="M34 22h42v15H34zM81 22h42v15H81zM128 22h42v15h-42z" fill="#ff77a9" />
            <path d="M34 42h42v15H34zM81 42h42v15H81zM128 42h42v15h-42z" fill="#f8d36a" />
            <path d="M34 62h42v15H34zM81 62h42v15H81zM128 62h42v15h-42z" fill="#8be7d3" />
          </g>
          <circle cx="150" cy="92" r="7" fill="#fff4d9" />
          <path d="M59 99h83" stroke="#c3d4ff" strokeLinecap="square" strokeWidth="10" />
          <path d="M147 85l-9-20" stroke="#fff4d9" strokeWidth="2" opacity=".75" />
        </svg>
      )}
      {game.art === "pong" && (
        <svg viewBox="0 0 220 120" className="art-illustration">
          <path d="M110 18v82" stroke="#c7d4ff" strokeDasharray="5 8" strokeWidth="3" opacity=".55" />
          <path d="M48 30v29M172 65v29" stroke="#c7d4ff" strokeLinecap="square" strokeWidth="11" />
          <circle cx="102" cy="54" r="8" fill="#fff4d9" />
          <path d="M102 54l-30-18M102 54l22 26" stroke="#fff4d9" strokeWidth="2" opacity=".7" />
          <circle cx="43" cy="85" r="4" fill="#fa76ad" />
        </svg>
      )}
      {game.art === "invaders" && (
        <svg viewBox="0 0 220 120" className="art-illustration">
          <g fill="#d8c7ff">
            <path d="M51 24h10v8h8v8h-8v8h-8v-8h-8v-8h8zM90 24h10v8h8v8h-8v8h-8v-8h-8v-8h8zM129 24h10v8h8v8h-8v8h-8v-8h-8v-8h8zM168 24h10v8h8v8h-8v8h-8v-8h-8v-8h8z" />
          </g>
          <path d="M33 91h13v-8h8v-8h13v8h8v8h13v12H33z" fill="#8be7d3" />
          <path d="M110 78V58M144 69v-9" stroke="#ffe382" strokeWidth="4" />
          <circle cx="110" cy="48" r="4" fill="#ffe382" />
          <circle cx="195" cy="89" r="4" fill="#ff77a9" opacity=".8" />
        </svg>
      )}
      <span className="art-sparkle">✳</span>
      <span className="art-index">0{games.indexOf(game) + 1}</span>
    </div>
  );
}

function AuthDialog({
  mode,
  onClose,
  onSignedIn,
}: {
  mode: "signin" | "register";
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const [registering, setRegistering] = useState(mode === "register");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    try {
      if (registering) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username: String(data.get("username") ?? "").trim(),
            password,
          }),
        });
        if (!response.ok) {
          throw new Error(
            await getApiError(response, "We couldn't create your account. Please try again."),
          );
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) throw new Error("That email and password don't match.");
      onSignedIn();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't reach the arcade. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-scrim" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={onClose} aria-label="Close sign-in dialog"><X size={19} /></button>
        <div className="dialog-stamp"><Gamepad2 size={20} /> YOUR OWN HIGH SCORES</div>
        <h2 id="auth-title">{registering ? "Claim your initials." : "Welcome back, player."}</h2>
        <p className="dialog-copy">
          {registering
            ? "Make a free account to keep your scores and climb the all-time leaderboard."
            : "Sign in to pick up where your best scores left off."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {registering && (
            <label>
              Arcade handle
              <input name="username" type="text" placeholder="pixelpilot" minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" required autoComplete="username" />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="8 characters or more" minLength={8} maxLength={72} required autoComplete={registering ? "new-password" : "current-password"} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" disabled={busy} type="submit">
            {busy ? "ONE SEC..." : registering ? "MAKE MY ACCOUNT" : "LET ME IN"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="auth-switch">
          {registering ? "Already one of us?" : "New around here?"}{" "}
          <button onClick={() => { setRegistering(!registering); setError(""); }}>
            {registering ? "Sign in instead" : "Create a free account"}
          </button>
        </p>
        <p className="privacy-note"><LockKeyhole size={12} /> Your password is hashed. Your games are yours.</p>
      </section>
    </div>
  );
}

export function Arcade() {
  const { data: session, status } = useSession();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "register" | null>(null);
  const [accountScores, setAccountScores] = useState<Score[]>([]);
  const [accountStatus, setAccountStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [accountError, setAccountError] = useState("");
  const [notice, setNotice] = useState("");
  const guestSnapshot = useSyncExternalStore(
    subscribeToSessionScores,
    getSessionScoresSnapshot,
    getSessionScoresSnapshot,
  );
  const scores = session?.user ? accountScores : guestSnapshot.scores;
  const leaderboardStatus =
    status === "loading"
      ? "loading"
      : session?.user
        ? accountStatus
        : "ready";

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/api/scores");
      if (!response.ok) {
        throw new Error(await getApiError(response, `Leaderboard request failed (${response.status}).`));
      }
      setAccountScores(await response.json() as Score[]);
      setAccountError("");
      setAccountStatus("ready");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "The leaderboard couldn't be loaded.");
      setAccountStatus("offline");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    void fetch("/api/scores")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await getApiError(response, `Leaderboard request failed (${response.status}).`));
        }
        return await response.json() as Score[];
      })
      .then((result) => {
        if (active) {
          setAccountScores(result);
          setAccountError("");
          setAccountStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setAccountError(error instanceof Error ? error.message : "The leaderboard couldn't be loaded.");
          setAccountStatus("offline");
        }
      });

    return () => { active = false; };
  }, [status]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveGame(null);
        setAuthMode(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function finishGame(game: GameId, points: number) {
    const currentGame = games.find((item) => item.id === game);
    if (!currentGame) return;

    if (session?.user) {
      try {
        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game, points }),
        });
        if (!response.ok) {
          throw new Error(await getApiError(response, `Score save failed (${response.status}).`));
        }
        setNotice("SCORE SAVED TO YOUR HIGH SCORES");
        await loadScores();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Your score couldn't be saved.");
      }
      return;
    }

    const saved = recordSessionScore({ game, points } satisfies SessionScore);
    setNotice(saved.error || "SCORE SAVED FOR THIS BROWSER SESSION");
  }

  const currentGame = games.find((game) => game.id === activeGame);

  return (
    <main className="arcade-shell">
      <header className="topbar">
        <a href="#" className="brand" aria-label="Pixel Palace home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>pixel<span className="brand-pink">.</span>palace<span className="brand-dot">®</span></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a className="nav-link active" href="#games">THE GAMES <span>05</span></a>
          <a className="nav-link" href="#leaderboard">HIGH SCORES</a>
        </nav>
        <div className="account-area">
          {status === "authenticated" ? (
            <>
              <span className="player-greeting"><span className="online-dot" /> {session.user?.name ?? "PLAYER"}</span>
              <button className="button button-small button-outline" onClick={() => void signOut()}>
                <LogOut size={14} /> SIGN OUT
              </button>
            </>
          ) : (
            <>
              <button className="button button-small button-outline" onClick={() => setAuthMode("signin")}>LOG IN</button>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-pulse" /> EST. BEFORE BEDTIMES &amp; DIAL-UP <span className="eyebrow-star">✳</span></div>
          <h1>A little play<br />goes a <span>long way.</span></h1>
          <p>Five tiny throwbacks. Absolutely no &ldquo;I&apos;ll just play one more.&rdquo;</p>
          <a className="button button-cream" href="#games"><Play size={15} fill="currentColor" /> PICK YOUR GAME</a>
          <div className="hero-footnote"><span>✳</span> FREE TO PLAY <i /> NO DOWNLOADS <i /> GOOD VIBES ONLY</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-spark star-a">✳</div><div className="hero-spark star-b">✳</div>
          <div className="arcade-machine">
            <div className="machine-top"><span className="machine-lamp" /><span>PIXEL PALACE</span><span className="machine-lamp" /></div>
            <div className="machine-screen">
              <span className="machine-game-title">INSERT<br />COIN<span>_</span></span>
              <div className="machine-creature"><i /><i /><i /><i /><i /></div>
              <span className="machine-player">1 UP&nbsp;&nbsp;&nbsp;&nbsp; 000000</span>
            </div>
            <div className="machine-controls"><span className="joystick"><i /></span><span className="machine-button pink" /><span className="machine-button mint" /><span className="machine-button yellow" /></div>
            <div className="machine-slot"><span>PRESS START</span></div>
          </div>
          <div className="coin coin-one">1<span>UP</span></div><div className="coin coin-two">★</div>
          <div className="hero-sticker"><span>GOOD<br />GAME!</span><Sparkles size={15} /></div>
        </div>
        <div className="hero-ticker"><span>PLAYER 1 READY</span><i /> <span>TAKE A BREAK, TAKE A TURN</span><i /> <span>PLAYER 1 READY</span></div>
      </section>

      <section className="games-section" id="games">
        <div className="section-heading">
          <div><div className="section-overline"><Gamepad2 size={15} /> THE CABINET</div><h2>Pick your <span>poison.</span></h2></div>
          <div className="section-note">Five games, zero quarters.<br /><span>Choose a cabinet and make yourself at home.</span></div>
        </div>
        <div className="game-grid">
          {games.map((game, index) => (
            <article key={game.id} className={`game-card card-${game.color} ${index === 0 ? "featured-card" : ""}`}>
              <Art game={game} />
              <div className="game-card-content">
                <div className="game-title-row"><h3>{game.title}</h3><span className="game-arrow">↗</span></div>
                <p>{game.description}</p>
                <div className="game-card-footer">
                  <span className="control-chip"><CircleHelp size={12} /> {game.controls}</span>
                  <button className="play-button" onClick={() => setActiveGame(game.id)} aria-label={`Play ${game.title}`}><Play size={14} fill="currentColor" /> PLAY</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="score-section" id="leaderboard">
        <div className="score-intro">
          <div className="section-overline"><Trophy size={15} /> THE HALL OF FAME</div>
          <h2>Big <span>energy.</span><br />Tiny screen.</h2>
          <p>{session?.user ? "Your best bragging rights, all in one place." : "Play as a guest, or make an account to keep your best runs for good."}</p>
          <div className="sticker-heart"><Heart size={18} fill="currentColor" /> GOOD<br />SPORT</div>
        </div>
        <div className="scoreboard-column">
          <div className="scoreboard">
            <div className="scoreboard-top"><div><span className="score-live-dot" /> {session?.user ? "ALL-TIME HIGH SCORES" : "YOUR SESSION SCORES"}</div><span>THE TOP 10</span></div>
            <div className="scoreboard-head"><span>RANK</span><span>PLAYER</span><span>GAME</span><span>POINTS</span></div>
            {leaderboardStatus === "loading" ? (
              <div className="score-empty">TURNING ON THE SCOREBOARD...</div>
            ) : leaderboardStatus === "offline" ? (
              <div className="score-empty">
                <span className="empty-star">✳</span>
                THE SCOREBOARD IS TAKING A NAP.
                <span className="empty-subtitle">{accountError || "Check your PostgreSQL connection and try again."}</span>
              </div>
            ) : scores.length === 0 ? (
              <div className="score-empty"><span className="empty-star">✳</span> NO SCORES YET. WANT TO FIX THAT?<span className="empty-subtitle">Every legend starts with their first go.</span></div>
            ) : (
              scores.slice(0, 10).map((score, index) => (
                <div className="score-row" key={`${score.game}-${score.username ?? "guest"}-${index}`}>
                  <span className="score-rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="score-player">{score.username ?? "YOU"}{index === 0 && <span className="player-tag">TOP PLAYER</span>}</span>
                  <span className={`score-game game-tag-${score.game}`}>{games.find((game) => game.id === score.game)?.title ?? score.game}</span>
                  <span className="score-points">{score.points.toLocaleString()}</span>
                </div>
              ))
            )}
            <div className="scoreboard-bottom"><span>{session?.user ? "SCORES SAVED TO YOUR ACCOUNT" : "GUEST SCORES DISAPPEAR WHEN THIS TAB CLOSES"}</span><span>✳&nbsp; INSERT YOUR INITIALS</span></div>
          </div>
          {!session?.user && <button className="button button-small button-dark score-save-cta" onClick={() => setAuthMode("register")}>SAVE MY SCORES <ArrowRight size={14} /></button>}
        </div>
      </section>

      <section className="guest-note">
        <div className="guest-icon"><UserRound size={18} /></div>
        <div><strong>Just browsing?</strong> That&apos;s the whole point. Play without an account — your guest scores stay on this device until this tab closes.</div>
        <span className="guest-label"><span className="online-dot" /> GUEST PLAY IS ALWAYS ON</span>
      </section>

      {notice && <div className="toast-notice" role="status"><span className="online-dot" /> {notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={13} /></button></div>}
      <footer className="site-footer"><a href="#" className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>pixel<span className="brand-pink">.</span>palace<span className="brand-dot">®</span></span></a><span>MADE FOR YOUR TEN-MINUTE BREAK. &nbsp; © 2026 PIXEL PALACE ARCADE.</span><span className="footer-love"><AudioLines size={14} /> SOUND ON, SHOULD YOU FANCY.</span></footer>

      {activeGame && currentGame && (
        <div className="modal-scrim game-scrim" onClick={(event) => event.target === event.currentTarget && setActiveGame(null)}>
          <section className="game-dialog" role="dialog" aria-modal="true" aria-labelledby="game-title">
            <div className="game-dialog-top">
              <div><span className="game-status-dot" /> NOW PLAYING <span className="game-dialog-divider">/</span> <span id="game-title">{currentGame.title.toUpperCase()}</span></div>
              <button className="modal-close game-close" onClick={() => setActiveGame(null)} aria-label="Close game"><X size={19} /></button>
            </div>
            <GameCanvas key={activeGame} gameId={activeGame} onFinish={(points) => void finishGame(activeGame, points)} />
            <div className="game-controls-note">
              <span><ArrowLeft size={13} /><ArrowRight size={13} /> MOVE</span>
              {activeGame === "tetris" && <span><ArrowUp size={13} /> ROTATE</span>}
              {activeGame === "invaders" && <span>SPACE <i>FIRE</i></span>}
              <span><kbd>P</kbd> PAUSE</span>
              <span className="game-exit-note">NO COINS REQUIRED <button onClick={() => setActiveGame(null)}>EXIT GAME <ArrowDown size={12} /></button></span>
            </div>
          </section>
        </div>
      )}

      {authMode && (
        <AuthDialog
          key={authMode}
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSignedIn={() => { setNotice("YOU'RE IN. YOUR HIGH SCORES ARE SAFE."); void loadScores(); }}
        />
      )}
    </main>
  );
}
