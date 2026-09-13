// Mermaid needs resolved colours: its base theme calculates derived hex colours.
export default function mermaidTheme({ surface, text, muted, border, group, font }) {
  const semantic = {
    github: ["#f3f4f6", "#737b87"],
    entra: ["#eef3ff", "#7c94c7"],
    azure: ["#edf6ff", "#6d9fc5"],
    terraform: ["#f5f0fc", "#a08abd"],
    security: ["#fff7e8", "#b49559"],
    storage: ["#edf8f9", "#77a4ab"],
    external: ["#f5f5f5", "#95999e"],
  };

  return {
    startOnLoad: false,
    theme: "base",
    fontFamily: font,
    themeVariables: {
      fontFamily: font,
      fontSize: "16px",
      primaryColor: surface,
      primaryTextColor: text,
      primaryBorderColor: border,
      secondaryColor: group,
      secondaryTextColor: text,
      secondaryBorderColor: border,
      tertiaryColor: group,
      tertiaryTextColor: text,
      tertiaryBorderColor: border,
      lineColor: muted,
      textColor: text,
      mainBkg: surface,
      nodeBorder: border,
      clusterBkg: group,
      clusterBorder: border,
      edgeLabelBackground: surface,
      actorBkg: surface,
      actorBorder: border,
      actorTextColor: text,
      actorLineColor: muted,
      signalColor: muted,
      signalTextColor: text,
      labelBoxBkgColor: group,
      labelBoxBorderColor: border,
      labelTextColor: text,
      loopTextColor: text,
      noteBkgColor: group,
      noteBorderColor: border,
      noteTextColor: text,
      activationBkgColor: group,
      activationBorderColor: border,
    },
    flowchart: { nodeSpacing: 45, rankSpacing: 65, padding: 18, curve: "basis", useMaxWidth: false },
    sequence: { useMaxWidth: false, actorFontFamily: font, noteFontFamily: font, messageFontFamily: font },
    themeCSS: `
      .node rect, rect.actor { rx: 9px; ry: 9px; }
      .node .label-container, rect.actor {
        stroke-width: 1px;
        filter: drop-shadow(0 2px 2px rgb(24 39 34 / 7%));
      }
      .nodeLabel, .actor { font-weight: 500; }
      .flowchart-link { stroke-width: 1.5px; }
      .cluster rect { rx: 10px; ry: 10px; stroke-width: 1px; }
      .cluster-label { font-weight: 500; }
      .edgeLabel { font-size: 13px; }
      .edgeLabel .label { padding: 2px 5px; border-radius: 4px; }
      ${Object.entries(semantic).map(([name, [fill, stroke]]) =>
        `.node.${name} > rect, .node.${name} > circle, .node.${name} > ellipse,
         .node.${name} > polygon, .node.${name} > path { fill: ${fill}; stroke: ${stroke}; }`,
      ).join("\n")}
    `,
  };
}
