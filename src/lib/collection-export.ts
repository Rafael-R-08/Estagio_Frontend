import type { Collection } from '@/types';
import { toast } from '@/lib/toast-store';

/**
 * Formats a collection into a professional Markdown summary and copies it to the clipboard.
 * @param collection The collection to export
 * @param t Translation function (optional)
 */
export async function copyCollectionToClipboard(
  collection: Collection,
  t: (key: string, options?: any) => string
): Promise<void> {
  const courses = collection.courses || [];
  
  let markdown = `# ${collection.name}\n`;
  if (collection.description) {
    markdown += `> ${collection.description}\n\n`;
  }
  
  markdown += `## ${t('search.title')} (${courses.length} ${t('search.results')})\n\n`;
  
  if (courses.length === 0) {
    markdown += `${t('collections.emptyCoursesHint')}\n`;
  } else {
    courses.forEach((course) => {
      markdown += `- **${course.title}**\n`;
      if (course.platformName) {
        markdown += `  - *${t('search.platform')}:* ${course.platformName}\n`;
      }
      markdown += `  - *Link:* ${course.url}\n\n`;
    });
  }
  
  markdown += `---\n*Gerado via Softinsa Learning Hub*`;

  try {
    await navigator.clipboard.writeText(markdown);
    toast.success(t('collections.planCopied'));
  } catch (err) {
    console.error('Failed to copy collection:', err);
    toast.error(t('collections.planCopyError'));
  }
}
