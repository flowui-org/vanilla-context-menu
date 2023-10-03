import chalk from "chalk";

function calculateExecutionTime(startTime) {
  const time = performance.now() - startTime;
  return time >= 1000 ? `${(time / 1000).toFixed(1)}s` : `${time.toFixed(1)}ms`;
}

export function step(name, fn) {
  return async () => {
    try {
      console.log(chalk.cyan(name), chalk.gray("..."));
      const startTime = performance.now();
      await fn();
      console.log(
        chalk.green(name),
        chalk.gray(`done in ${calculateExecutionTime(startTime)}`),
      );
    } catch (err) {
      console.error(chalk.red("Error:"), `(${chalk.white(name)})`, err);
      process.exit(1);
    }
  };
}
