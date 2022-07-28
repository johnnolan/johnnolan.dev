import { globby } from "globby";
import pa11y from "pa11y";

// Every pa11y call create a remote socket connection and in node this limit is 10.
// Setting this to 50 will silence a memory leak false positive warning when running
// and enable the script to run correctly.
process.setMaxListeners(50);

const runPa11y = async (page) => {
  return pa11y(`./${page}`, {
    ignore: [
      "WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchID",
      "WCAG2AA.Principle2.Guideline2_4.2_4_2.H25.1.NoTitleEl",
      "WCAG2AA.Principle1.Guideline1_3.1_3_1.H42.2",
    ],
  });
};

async function pa11yCheck() {
  const pages = await globby(["_site/**/*.html"]);

  const fullResults = await Promise.all(
    pages.map((page) => {
      if (page.indexOf("react-testing-library-hoc") === -1) {
        return runPa11y(`./${page}`);
      }
    })
  );

  const issuesList = fullResults.filter((result) => {
    return result?.issues?.length > 0;
  });

  if (issuesList.length > 0) {
    for (const element of issuesList) {
      const issue = element;
      console.log("---");
      console.log(issue.pageUrl);
      console.log(issue.issues);
    }
    console.log(issue.issues);
    console.error("pa11y Errors Found");
    process.exit(2);
  } else {
    console.log("No pa11y Errors Found");
    process.exit(0);
  }
}

pa11yCheck();