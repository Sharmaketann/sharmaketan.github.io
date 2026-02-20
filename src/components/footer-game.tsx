"use client";

import { useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";

// ── 12 unique symbols → 12 pairs → 24 cards (3 × 8 grid) ────────────────────

type SymId =
  | "cross" | "triangle" | "trident" | "flower"
  | "star"  | "diamond"  | "circle"  | "hexagon"
  | "arrow" | "moon"     | "plus"    | "leaf";

const SYMBOLS: SymId[] = [
  "cross", "triangle", "trident", "flower",
  "star",  "diamond",  "circle",  "hexagon",
  "arrow", "moon",     "plus",    "leaf",
];

function SymIcon({ id, color, size = 36 }: { id: SymId; color: string; size?: number }) {
  const sw = "10"; // strokeWidth for line-based symbols
  switch (id) {
    case "cross": // 8-armed asterisk
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <line x1="50" y1="8"  x2="50" y2="92" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="8"  y1="50" x2="92" y2="50" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="17" y1="17" x2="83" y2="83" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="83" y1="17" x2="17" y2="83" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <polygon points="50,8 92,88 8,88" fill={color} />
        </svg>
      );
    case "trident": // ψ — 3 prongs + crossbar + handle
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <line x1="22" y1="10" x2="22" y2="55" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="50" y1="6"  x2="50" y2="55" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="78" y1="10" x2="78" y2="55" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="22" y1="55" x2="78" y2="55" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <line x1="50" y1="55" x2="50" y2="92" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );
    case "flower": // 4 oval petals + center circle
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <ellipse cx="50" cy="24" rx="13" ry="21" fill={color} />
          <ellipse cx="50" cy="76" rx="13" ry="21" fill={color} />
          <ellipse cx="24" cy="50" rx="21" ry="13" fill={color} />
          <ellipse cx="76" cy="50" rx="21" ry="13" fill={color} />
          <circle  cx="50" cy="50" r="14"           fill={color} />
        </svg>
      );
    case "star": // 5-point star
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <polygon points="50,6 61,36 94,36 68,56 78,88 50,68 22,88 32,56 6,36 39,36" fill={color} />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <polygon points="50,8 92,50 50,92 8,50" fill={color} />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <circle cx="50" cy="50" r="40" fill={color} />
        </svg>
      );
    case "hexagon":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <polygon points="50,8 89,29 89,71 50,92 11,71 11,29" fill={color} />
        </svg>
      );
    case "arrow": // upward arrow
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <polygon points="50,8 82,46 63,46 63,92 37,92 37,46 18,46" fill={color} />
        </svg>
      );
    case "moon": // crescent
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <path d="M55,10 A42,42 0 1,0 55,90 A28,28 0 1,1 55,10 Z" fill={color} />
        </svg>
      );
    case "plus": // thick plus
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <polygon points="37,8 63,8 63,37 92,37 92,63 63,63 63,92 37,92 37,63 8,63 8,37 37,37" fill={color} />
        </svg>
      );
    case "leaf": // teardrop / leaf
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <path d="M50,8 C78,8 88,30 88,50 C88,72 70,92 50,92 C30,92 12,72 12,50 C12,30 22,8 50,8 Z" fill={color} />
        </svg>
      );
  }
}

// ── Card type ─────────────────────────────────────────────────────────────────

type Card = {
  instanceId: number;
  symbolId: SymId;
  isFlipped: boolean;
  isMatched: boolean;
};

/** Ordered deck — same on server and client (no hydration mismatch). */
function createOrderedDeck(): Card[] {
  const cards: Card[] = [];
  SYMBOLS.forEach((symbolId, i) => {
    cards.push({ instanceId: i * 2,     symbolId, isFlipped: false, isMatched: false });
    cards.push({ instanceId: i * 2 + 1, symbolId, isFlipped: false, isMatched: false });
  });
  return cards;
}

/** Shuffled deck — only called on the client after hydration. */
function createDeck(): Card[] {
  return createOrderedDeck().sort(() => Math.random() - 0.5);
}

// ── Colour tokens — one set per theme ────────────────────────────────────────

type Colors = {
  bg: string; cardBack: string; cardBorder: string;
  cardFace: string; faceBorder: string;
  symDark: string; symBack: string;
  terracotta: string; textPrimary: string; textMuted: string;
};

const DARK_C: Colors = {
  bg:          "#100f0d",
  cardBack:    "#1c1a15",
  cardBorder:  "#2c2920",
  cardFace:    "#e8ddd0",
  faceBorder:  "#cfc4b5",
  symDark:     "#1e1308",
  symBack:     "#2e2b24",
  terracotta:  "#b86440",
  textPrimary: "#e0d8cc",
  textMuted:   "#6e6458",
};

const LIGHT_C: Colors = {
  bg:          "#f0ebe4",
  cardBack:    "#d8cec2",
  cardBorder:  "#c4baae",
  cardFace:    "#fdfaf6",
  faceBorder:  "#e0d8cc",
  symDark:     "#1e1308",
  symBack:     "#9e9080",
  terracotta:  "#b86440",
  textPrimary: "#1e1308",
  textMuted:   "#7a6e60",
};

// ── Single card ───────────────────────────────────────────────────────────────

function MemoryCard({ card, onClick, C }: { card: Card; onClick: () => void; C: Colors }) {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <button
      onClick={onClick}
      disabled={card.isMatched}
      style={{ perspective: "500px", aspectRatio: "1 / 1.1" }}
      className="relative focus-visible:outline-none rounded-xl"
      aria-label={isRevealed ? card.symbolId : "Face-down card"}
    >
      {/* Flip wrapper */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.40s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ── Back face: card with asterisk pattern — identical on all cards ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundColor: C.cardBack,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 40 40" width="22" height="22" aria-hidden style={{ opacity: 0.25 }}>
            <line x1="20" y1="4"  x2="20" y2="36" stroke={C.symBack} strokeWidth="3" strokeLinecap="round" />
            <line x1="4"  y1="20" x2="36" y2="20" stroke={C.symBack} strokeWidth="3" strokeLinecap="round" />
            <line x1="7"  y1="7"  x2="33" y2="33" stroke={C.symBack} strokeWidth="3" strokeLinecap="round" />
            <line x1="33" y1="7"  x2="7"  y2="33" stroke={C.symBack} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* ── Front face: one centered symbol ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundColor: C.cardFace,
            border: `1px solid ${C.faceBorder}`,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymIcon
            id={card.symbolId}
            color={card.isMatched ? C.terracotta : C.symDark}
            size={32}
          />
        </div>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FooterGame() {
  const { resolvedTheme } = useTheme();
  const C: Colors = resolvedTheme === "light" ? LIGHT_C : DARK_C;

  const [cards, setCards]       = useState<Card[]>(() => createOrderedDeck());
  const [flipped, setFlipped]   = useState<number[]>([]);
  const [moves, setMoves]       = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Shuffle on client after hydration (avoids server/client mismatch)
  useEffect(() => {
    setCards(createDeck());
  }, []);

  const isWon = cards.every((c) => c.isMatched);

  const handleClick = useCallback(
    (instanceId: number) => {
      if (isLocked) return;
      const card = cards.find((c) => c.instanceId === instanceId);
      if (!card || card.isFlipped || card.isMatched || flipped.length === 2) return;

      const newFlipped = [...flipped, instanceId];
      setCards((prev) =>
        prev.map((c) => c.instanceId === instanceId ? { ...c, isFlipped: true } : c),
      );
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [aId, bId] = newFlipped;
        const a = cards.find((c) => c.instanceId === aId)!;
        const b = cards.find((c) => c.instanceId === bId)!;

        if (a.symbolId === b.symbolId) {
          // ✓ Match — keep face-up, mark matched
          setIsLocked(true);
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                newFlipped.includes(c.instanceId) ? { ...c, isMatched: true } : c,
              ),
            );
            setFlipped([]);
            setIsLocked(false);
          }, 500);
        } else {
          // ✗ No match — flip back after pause
          setIsLocked(true);
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                newFlipped.includes(c.instanceId) ? { ...c, isFlipped: false } : c,
              ),
            );
            setFlipped([]);
            setIsLocked(false);
          }, 900);
        }
      }
    },
    [cards, flipped, isLocked],
  );

  const reset = () => {
    setCards(createDeck());
    setFlipped([]);
    setMoves(0);
    setIsLocked(false);
  };

  return (
    <section
      style={{ backgroundColor: C.bg }}
      className="w-full py-14 px-6 mt-10"
    >
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h2
          className="text-center mb-8"
          style={{
            color: C.textPrimary,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          Welcome to the footer arcade
        </h2>

        {/* Controls row */}
        <div className="flex justify-between items-center mb-5">
          <p className="text-xs italic" style={{ color: C.textMuted }}>
            {isWon ? "You matched them all!" : "Pick a card. Match a card."}
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
            Moves
            <span
              style={{
                backgroundColor: C.cardBack,
                border: `1px solid ${C.cardBorder}`,
                color: C.textPrimary,
                padding: "2px 12px",
                borderRadius: "4px",
                fontVariantNumeric: "tabular-nums",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              {String(moves).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* 3 × 8 on desktop, 4 × 6 on mobile */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {cards.map((card) => (
            <MemoryCard
              key={card.instanceId}
              card={card}
              onClick={() => handleClick(card.instanceId)}
              C={C}
            />
          ))}
        </div>

        {/* Win state */}
        {isWon && (
          <div className="text-center mt-8">
            <p className="text-xs mb-3" style={{ color: C.textMuted }}>
              Completed in {moves} move{moves !== 1 ? "s" : ""}
            </p>
            <button
              onClick={reset}
              className="text-xs px-6 py-2 rounded-lg hover:opacity-75 transition-opacity"
              style={{
                backgroundColor: C.terracotta,
                color: "#efe7db",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
