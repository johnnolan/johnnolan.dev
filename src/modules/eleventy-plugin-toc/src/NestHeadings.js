const NestHeadings = (tags, $) => {
  const headings = [];
  const stack = [];

  $(tags.join(",")).each((_order, element) => {
    const level = tags.indexOf(element.name);
    const heading = {
      id: $(element).attr("id"),
      text: $(element).text().replace(" #", ""),
      children: [],
    };

    while (stack.length && stack.at(-1).level >= level) stack.pop();
    if (!heading.id || !heading.text) {
      stack.push({ level });
      return;
    }

    const parent = stack.at(-1)?.heading?.children ?? headings;
    parent.push(heading);
    stack.push({ level, heading });
  });

  return headings;
};

export default NestHeadings;
