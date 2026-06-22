import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogNav, BlogFooter } from '@/app/_blog/components'
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts'

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { default: PostBody } = await import(`@/app/blog/_posts/${slug}`)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BlogNav />

      <main className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Blog</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white leading-tight">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {post.author ? ` · ${post.author}` : ''}
          </p>
        </div>

        <PostBody />
      </main>

      <BlogFooter />
    </div>
  )
}
