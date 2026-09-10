export function uniqueYouTubeEmbedTitles(content, outputPath) {
  if (!outputPath?.endsWith(".html")) return content;

  let index = 0;
  return content.replaceAll('title="Embedded YouTube video"', () => {
    index += 1;
    return `title="Embedded YouTube video ${index}"`;
  });
}

export default function youtubeEmbedTitles(eleventyConfig) {
  eleventyConfig.addTransform("uniqueYouTubeEmbedTitles", uniqueYouTubeEmbedTitles);
}
