document.querySelectorAll("pre:not(.mermaid) > code").forEach((code) => {
  const pre = code.parentElement;
  if (pre.closest(".code-block")) return;

  // Keep the original text intact for copying, including indentation and newlines.
  const source = code.textContent;
  const lineCount = source.replace(/\n$/, "").split("\n").length;
  const block = document.createElement("div");
  block.className = "code-block";
  const toolbar = document.createElement("div");
  toolbar.className = "code-block__toolbar";
  const label = document.createElement("span");
  const language = [...code.classList].find((name) => name.startsWith("language-"));
  label.textContent = language ? language.slice("language-".length) : "Code";
  toolbar.append(label);

  if (navigator.clipboard?.writeText) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-block__copy";
    button.textContent = "Copy code";
    const status = document.createElement("span");
    status.setAttribute("role", "status");
    label.append(status);
    let reset;
    button.addEventListener("click", async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(source);
        button.textContent = "Copied!";
        status.textContent = " — Copied to clipboard";
      } catch {
        button.textContent = "Try again";
        status.textContent = " — Copy failed. Select the code to copy manually.";
      }
      reset = setTimeout(() => {
        button.textContent = "Copy code";
        status.textContent = "";
      }, 4000);
    });
    toolbar.append(button);
  }

  const numbers = document.createElement("span");
  numbers.className = "code-block__numbers";
  numbers.setAttribute("aria-hidden", "true");
  numbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
  pre.tabIndex = 0;
  pre.setAttribute("role", "region");
  pre.setAttribute("aria-label", "Code sample (scroll horizontally to explore)");
  pre.before(block);
  block.append(toolbar, pre);
  pre.prepend(numbers);
});
