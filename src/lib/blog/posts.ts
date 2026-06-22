export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  author?: string
}

export const posts: BlogPost[] = [
  {
    slug: 'is-car-flipping-profitable-2026',
    title: 'Is Car Flipping Profitable in 2026? An Honest Breakdown',
    description:
      'A realistic look at car flipping profit margins, the hidden costs nobody warns you about, and what separates flippers who make money from those who lose it in 2026.',
    date: '2026-06-22',
    author: 'CarDealAlerts',
  },
  {
    slug: 'best-tools-for-car-flipping-2026',
    title: 'Best Tools for Car Flipping in 2026: How Pros Find Underpriced Cars First',
    description:
      'A practical breakdown of the tools serious car flippers use in 2026 to find underpriced inventory faster, evaluate deals smarter, and beat the competition to the best listings.',
    date: '2026-06-22',
    author: 'CarDealAlerts',
  },
]

export function getAllPosts() {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug)
}
