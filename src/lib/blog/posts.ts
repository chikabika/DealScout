export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  author?: string
}

export const posts: BlogPost[] = [
  {
    slug: 'how-to-find-cars-to-flip-2026',
    title: 'How to Find Cars to Flip in 2026: Where the Pros Source Deals',
    description:
      'Where and how profitable flippers source underpriced cars in 2026 — the best marketplaces, how to spot a deal, and the system that gets you to listings first.',
    date: '2026-06-22',
    author: 'Salah',
  },
  {
    slug: 'cardealalerts-vs-swoopa',
    title: 'CarDealAlerts vs Swoopa: Which Car Sourcing Tool Is Worth It in 2026?',
    description:
      'An honest, side-by-side comparison of CarDealAlerts and Swoopa — pricing, free plans, marketplace coverage, AI deal scoring, and alert speed for car flippers in 2026.',
    date: '2026-06-22',
    author: 'Salah',
  },
  {
    slug: 'is-car-flipping-profitable-2026',
    title: 'Is Car Flipping Profitable in 2026? An Honest Breakdown',
    description:
      'A realistic look at car flipping profit margins, the hidden costs nobody warns you about, and what separates flippers who make money from those who lose it in 2026.',
    date: '2026-06-22',
    author: 'Salah',
  },
  {
    slug: 'best-tools-for-car-flipping-2026',
    title: 'Best Tools for Car Flipping in 2026: How Pros Find Underpriced Cars First',
    description:
      'A practical breakdown of the tools serious car flippers use in 2026 to find underpriced inventory faster, evaluate deals smarter, and beat the competition to the best listings.',
    date: '2026-06-22',
    author: 'Salah',
  },
]

export function getAllPosts() {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug)
}
