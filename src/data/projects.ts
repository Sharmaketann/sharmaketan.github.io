/**
 * Professional work. No repos and no screenshots — these are private
 * codebases — so they are described rather than linked, which is also the
 * honest shape for them. Facts here come from the resume and nowhere else;
 * where a number belongs and I do not have a verified one, it says TODO
 * rather than a plausible-looking figure.
 */
export interface WorkItem {
  title: string;
  /** Joins to POSITIONS in career.ts, which owns the dates and the title. */
  org: string;
  summary: string;
  points: readonly string[];
  stack: readonly string[];
  href?: string;
}

export const WORK: readonly WorkItem[] = [
  {
    title: "Algo trading & quant terminal",
    org: "Wizzer AdvisorTech",
    summary:
      "Market-data streaming and the backtesting engine behind an AI quant and algo trading terminal for registered investment advisors.",
    points: [
      "Real-time ingestion and WebSocket streaming into a ClickHouse time-series store that backs the analytics and charting surface.",
      "Backtesting and strategy engine, running advisor and quant-desk strategies against historical market data on an NSE/BSE-approved platform.",
      "Backend services in TypeScript and Python across the data path, with MongoDB for persistence and Redis for caching and hot-path reads.",
    ],
    stack: ["TypeScript", "Node.js", "Python", "MongoDB", "Redis", "ClickHouse", "WebSocket"],
    href: "https://wizzer.in/",
  },
  {
    title: "Insurance Point of Sale platform",
    org: "Insure Efficient",
    summary:
      "Led the team that designed and shipped a Point of Sale portal for insurance agents, turning a pile of incompatible carrier APIs into one quote-and-issue flow.",
    points: [
      "Integrated 200+ APIs across 13+ insurance carriers behind a single internal interface, so agents stopped caring whose contract was whose.",
      "Owned security and data integrity for the backend services, including policyholder data.",
      "Worked with the Risk team on a set of interconnected web applications, and with DevOps to keep deploys clean.",
      // TODO: a number here would carry this entry — agents onboarded,
      // quotes issued per day, or time-to-quote before and after.
    ],
    stack: ["TypeScript", "Node.js", "React", "MongoDB", "REST"],
  },
] as const;

/** Shape for items in the WEB_APPS array. Reference this when adding new projects. */
export interface WebApp {
  title: string;
  tags: readonly string[];
  description: string;
  thumbnail: string;
  repo: string;
  external: string;
  demo?: string;
}

/**
 * Descriptions are written from the repos, not guessed from the deployed page.
 * The previous copy hedged about work on this very account — "it likely serves
 * as", "seems optimized", "depends on JavaScript being enabled" — which reads
 * as scraped rather than written, and the tags claimed stacks the repos do not
 * contain. Tags here match what is actually in each repository.
 */
export const WEB_APPS = [
  {
    title: "Ginger Fresh°",
    tags: ["React", "Redux Toolkit", "Node.js", "Express", "MongoDB", "PayPal"],
    description:
      "A full MERN e-commerce build — product catalogue, cart, checkout and order history. Payments run through PayPal, with JWT sessions and bcrypt-hashed credentials behind an Express API.",
    thumbnail: "/_static/projects/gingerfresh.webp",
    repo: "https://github.com/Sharmaketann/Ginger",
    external: "https://gingerfreshens.web.app/",
  },
  {
    title: "Times of College°",
    repo: "https://github.com/Sharmaketann/Timesofcollege",
    external: "https://master.d15fgioem7z8jk.amplifyapp.com/",
    thumbnail: "/_static/projects/college.webp",
    description:
      "A responsive landing page for college content, built in React with GSAP driving the scroll and entrance animations. Contact form posts through EmailJS, so there is no backend to run. Deployed on AWS Amplify.",
    tags: ["React", "JavaScript", "GSAP", "EmailJS", "AWS Amplify"],
  },
  {
    title: "Netflix Clone°",
    repo: "https://github.com/Sharmaketann/NetFlix/",
    external: "https://net-flixx.web.app/",
    thumbnail: "/_static/projects/netflix.webp",
    description:
      "A streaming-service front end built against the TMDB API — browse rows by genre, pull artwork and metadata per title, and play trailers inline. Written in React with Axios handling the API layer.",
    tags: ["React", "TMDB API", "Axios", "Firebase Hosting"],
  },
  {
    title: "Christ News°",
    repo: "https://github.com/Sharmaketann/Christ-News",
    external: "https://christ-news-aa213.web.app/",
    thumbnail: "/_static/projects/christ.webp",
    description:
      "A news and information site for Christ College, Pune — activity updates, messages from the administration, alumni testimonials and a weather panel. Hand-built in HTML, SCSS and vanilla JavaScript with no framework, served from Firebase Hosting.",
    tags: ["HTML", "SCSS", "JavaScript", "Firebase Hosting"],
  },
  {
    title: "Travel Bucket List°",
    repo: "https://github.com/Sharmaketann/Travel-Bucket-List",
    external: "https://travel-bucket-list.netlify.app/",
    thumbnail: "/_static/projects/travel.webp",
    description:
      "A React app for keeping a running list of places to go — add destinations, mark the ones already visited, and keep the rest in view. Small by design; the point was the state handling, not the feature count.",
    tags: ["React", "JavaScript", "Netlify"],
  },
  {
    title: "Quotes°",
    repo: "https://github.com/Sharmaketann/Quote",
    external: "https://quotes-gist.netlify.app/",
    thumbnail: "/_static/projects/quote.webp",
    description:
      "A random quote generator that reads its collection from a GitHub Gist rather than a database, so the content can be edited without a deploy. One click shares the current quote to Twitter.",
    tags: ["React", "GitHub Gist", "Netlify"],
  },
  {
    title: "Breaking Bad°",
    repo: "https://github.com/Sharmaketann/breakingbad",
    external: "https://breakingbadly.netlify.app/breakingbad/showcase4-dark",
    thumbnail: "/_static/projects/breaking.webp",
    description:
      "A character showcase built on the Breaking Bad API, laid out as a horizontal scroll with GSAP handling the motion. Next.js, and mostly an excuse to spend time on animation timing.",
    tags: ["Next.js", "GSAP", "SCSS", "Animation"],
  },
] as const;
