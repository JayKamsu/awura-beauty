import { BlogNavTabs, PostList } from "@/features/blog/components/post-list";
import { BlogIndexHeader } from "@/features/blog/components/blog-index-header";
import { listBlogPosts } from "@/lib/infrastructure/supabase";

/** Page listant tous les tutoriels du blog. */
export default async function TutorialsPage() {
  const { posts } = await listBlogPosts("tutorial");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <BlogIndexHeader variant="tutorials" />
      <BlogNavTabs active="tutorials" />
      <PostList
        posts={posts}
        basePath="/tutoriels"
        emptyKey="blog.emptyTutorials"
      />
    </main>
  );
}
