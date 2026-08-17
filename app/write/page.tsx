import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { TagsService } from "@/lib/modules/tags/service";
import { LibraryService } from "@/lib/modules/library/service";
import { WritingHelper } from "@/components/write/WritingHelper";

const tagsService = new TagsService(prisma);
const libraryService = new LibraryService(prisma);

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [tags, categories] = await Promise.all([
    tagsService.listTagsWithCounts(user.id),
    libraryService.listCategories(),
  ]);

  return <WritingHelper tags={tags} categories={categories} />;
}
