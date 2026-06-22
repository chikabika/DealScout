export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  author?: string
}

export const posts: BlogPost[] = [
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
