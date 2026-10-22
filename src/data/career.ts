/**
 * Career positions — the single source for every date on the site.
 *
 * Both the blotter and the homepage tearsheet derive from this. The dates
 * live once, as [year, monthIndex], and every label and duration is computed.
 * Hand-writing them in two places is exactly how "Sept 2022" on the journey
 * drifted from "Sep 2022" on the resume.
 */

export type YM = [number, number]; // [year, monthIndex 0-11]

export interface Position {
  symbol: string;
  org: string;
  role: string;
  sector: string;
  start: YM;
  /** null = still open */
  end: YM | null;
  note: string;
  marks: string[];
  tags: string[];
  /** The one number worth putting in the result column. */
  result?: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const label = ([y, m]: YM) => `${MONTHS[m]} ${y}`;
export const asIndex = ([y, m]: YM) => y * 12 + m;

export function heldMonths(start: YM, end: YM | null, now: Date | null): number | null {
  if (!end && !now) return null; // open position, clock not mounted yet
  const to = end ? asIndex(end) : now!.getFullYear() * 12 + now!.getMonth();
  return Math.max(1, to - asIndex(start) + 1);
}

export function heldLabel(months: number | null): string {
  if (months === null) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y}y ${m}m`;
}

export const POSITIONS: Position[] = [
  {
    symbol: "WIZZER",
    org: "Wizzer AdvisorTech",
    role: "Senior Backend Developer",
    sector: "WealthTech",
    start: [2026, 0],
    end: null,
    note: "Moved from insurance into capital markets. Building the backend behind an AI-driven quant and algo trading terminal.",
    marks: [
      "Building the market-data path — real-time ingestion and WebSocket streaming",
      "Working on the backtesting and strategy engine over historical market data",
      "Backing analytics and charting with a ClickHouse time-series store",
    ],
    tags: ["TypeScript", "Node.js", "Python", "MongoDB", "Redis", "ClickHouse"],
  },
  {
    symbol: "INSEFF",
    org: "Insure Efficient",
    role: "Full Stack Lead Developer",
    sector: "Insurance",
    start: [2023, 10],
    end: [2025, 11],
    result: "+20% engagement",
    note: "Led a team building insurance technology that actually works — from a scalable POS portal to deep API integrations across 13+ carriers.",
    marks: [
      "Led development of a scalable Point of Sale portal, boosting engagement by 20%",
      "Integrated 200+ APIs from 13+ insurance carriers",
      "Owned security and integrity of all backend systems",
      "Partnered with the Risk team and DevOps for smooth deployments",
      "Awarded for outstanding performance on the new POS portal",
    ],
    tags: ["Node.js", "React", "Redux", "Express", "TailwindCSS", "MySQL", "AWS EC2"],
  },
  {
    symbol: "SAPIO",
    org: "Sapio Analytics",
    role: "Full Stack Developer",
    sector: "Analytics",
    start: [2022, 8],
    end: [2023, 9],
    result: "200+ APIs",
    note: "Scaled up fast — integrating hundreds of APIs, leading small teams, and mentoring developers.",
    marks: [
      "Integrated 200+ APIs, enhancing project functionality and data integration",
      "Optimised codebases for performance, scalability and maintainability",
      "Led development teams through task delegation and code reviews",
      "Managed and mentored developers, maintaining high-quality standards",
    ],
    tags: ["React", "Node.js", "Express", "REST API", "MySQL", "Leadership"],
  },
  {
    symbol: "USHYAKU",
    org: "Ushyaku Software",
    role: ".NET Developer Intern",
    sector: "IT Services",
    start: [2021, 6],
    end: [2021, 9],
    note: "First professional role. Revamped legacy interfaces, built database components, and got deep into SQL Profiler.",
    marks: [
      "Revamped and improved existing user interfaces",
      "Developed database tables, stored procedures and functions in MS SQL",
      "Used MS SQL SSRS for reporting, with event tracking in SQL Profiler",
    ],
    tags: ["ASP.NET", "MS SQL", "SQL Profiler", "SSRS", "BI Tools"],
  },
];

/** The months with no position on. Shown, not hidden. */
export const FLAT = { start: [2021, 10] as YM, end: [2022, 7] as YM };

export const FLAT_MONTHS = asIndex(FLAT.end) - asIndex(FLAT.start) + 1;

export const EDUCATION = {
  org: "Christ College, Pune University",
  qual: "BBA (Computer Application)",
  start: [2018, 7] as YM,
  end: [2021, 5] as YM,
  detail: "7.38 CGPA · first MERN projects during coursework",
};

/** Everything the tearsheet needs, derived rather than restated. */
export function tearsheet(now: Date | null) {
  const open = POSITIONS.find((p) => p.end === null) ?? null;
  const totalMonths = POSITIONS.reduce(
    (sum, p) => sum + (heldMonths(p.start, p.end, now) ?? 0),
    0,
  );
  const longest = POSITIONS.reduce<Position>((best, p) => {
    const m = heldMonths(p.start, p.end, now) ?? 0;
    const bm = heldMonths(best.start, best.end, now) ?? 0;
    return m > bm ? p : best;
  }, POSITIONS[0]);

  return {
    inception: POSITIONS[POSITIONS.length - 1].start,
    open,
    openMonths: open ? heldMonths(open.start, open.end, now) : null,
    totalMonths,
    longest,
    longestMonths: heldMonths(longest.start, longest.end, now),
    flatMonths: FLAT_MONTHS,
    sectors: new Set(POSITIONS.map((p) => p.sector)).size,
  };
}
