import { BlogNavTabs, PostList } from "@/features/blog/components/post-list";
import { listBlogPosts } from "@/lib/infrastructure/supabase";
import { BlogIndexHeader } from "@/features/blog/components/blog-index-header";

export default async function BlogPage() {
  const { posts } = await listBlogPosts("article");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <BlogIndexHeader variant="articles" />
      <BlogNavTabs active="articles" />
      <PostList posts={posts} basePath="/blog" emptyKey="blog.emptyArticles" />
    </main>
  );
}
