import {
  portfolioEvaluationSummary,
  runPortfolioEvaluationSuite,
} from "../src/lib/ai/portfolio-evaluation-suite";

const results = runPortfolioEvaluationSuite();
const summary = portfolioEvaluationSummary(results);

console.log("Portfolio AI Evaluation Scorecard");
console.log("=================================");

for (const result of results) {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(
    `${status} | ${result.feature} | ${result.id} | expected ${result.expectation}`,
  );
  if (!result.passed || result.issues.length > 0) {
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

console.log("");
console.log(
  `${summary.passed}/${summary.scenarios} scenarios passed; ` +
    `${summary.acceptedAsExpected} valid outputs accepted and ` +
    `${summary.rejectedAsExpected} unsafe outputs rejected.`,
);
console.log("OpenAI requests made: 0");

if (summary.failed > 0) {
  process.exitCode = 1;
}
