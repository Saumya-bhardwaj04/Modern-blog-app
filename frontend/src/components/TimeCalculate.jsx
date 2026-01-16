function calculateReadTime(content) {
  if (!content?.blocks) return 1;

  let text = "";

  content.blocks.forEach((block) => {
    if (block.type === "paragraph" || block.type === "header") {
      text += block.data.text + " ";
    }
    if (block.type === "list") {
      block.data.items.forEach((item) => {
        text += item.content + " ";
      });
    }
    if (block.type === "image" && block.data.caption) {
      text += block.data.caption + " ";
    }
  });

  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
