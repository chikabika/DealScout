import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogNav, BlogFooter } from '@/app/_blog/components'
import { getAllPosts } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Tips, guides, and insights for car flippers and deal hunters — from the CarDealAlerts team.',
  alternates: { canonical: '/blog' },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BlogNav />

      <main className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
            CarDealAlerts
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Blog</h1>
          <p className="mt-3 text-base text-zinc-400">
            Tips, guides, and insights for car flippers and deal hunters.
          </p>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-white/10 bg-zinc-900 px-6 py-6 transition hover:border-emerald-500/40 hover:bg-zinc-800/60"
            >
              <p className="text-xs text-zinc-500">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {post.author ? ` · ${post.author}` : ''}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white leading-snug">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{post.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-emerald-400">
                Read article →
              </span>
            </Link>
          ))}
        </div>
      </main>

      <BlogFooter />
    </div>
  )
}
