/**
 * Service offering shown on the homepage summary and the /services page.
 * Kept here so both stay in sync.
 */

export interface Pillar {
  title: string;
  body: string;
  icon: "code" | "cloud" | "spark" | "layers";
}

export const pillars: Pillar[] = [
  {
    title: "Software Development",
    body: "We design, build, and ship products end to end — from the first prototype to a shipped app people rely on.",
    icon: "code",
  },
  {
    title: "SaaS Products",
    body: "Subscription software with billing, auth, and multi-tenancy built in — made to grow with the people who use it.",
    icon: "cloud",
  },
  {
    title: "AI Tools",
    body: "Practical tools that put modern models to work on real, everyday problems — not demos.",
    icon: "spark",
  },
  {
    title: "Digital Services",
    body: "Hands-on help for teams that need to move fast — engineering, product, and everything around a launch.",
    icon: "layers",
  },
];

export const process = [
  {
    step: "01",
    title: "Understand the problem",
    body: "Before any code, we map what you actually need, where the risks are, and what success looks like. Scope comes from that, not from guesswork.",
  },
  {
    step: "02",
    title: "Build a solid foundation",
    body: "Architecture, data model, and tooling first. Getting these right is what keeps a product cheap to change a year from now.",
  },
  {
    step: "03",
    title: "Ship in short cycles",
    body: "Working software in front of you early and often, so priorities can shift as you learn — without derailing the build.",
  },
];

export const stack = [
  {
    title: "Laravel & PHP",
    body: "Our default for application backends — mature, fast to build in, and boring in the ways that matter.",
  },
  {
    title: "React & TypeScript",
    body: "For interfaces that need to feel immediate, typed end to end so refactors stay safe.",
  },
  {
    title: "AI where it earns its place",
    body: "Modern models and coding agents speed up the repetitive work. Every line still gets reviewed by a human.",
  },
];

export const goodFit = [
  "Products you intend to run for years, not weeks",
  "Greenfield builds that need the foundations right",
  "Existing apps that have outgrown their architecture",
  "SaaS with billing, teams, and permissions",
  "AI features grounded in real workflows",
  "Teams that want a partner, not just extra hands",
];

export const poorFit = [
  "Throwaway marketing sites and one-off landing pages",
  "Work handed over as a fixed spec with no discussion",
  "Rescue jobs that need a fix by next week",
  "Projects where the lowest bid wins",
];
