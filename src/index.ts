#!/usr/bin/env node

import chalk from "chalk";
import { input, select } from "@inquirer/prompts";

/**
 * Function that prompts the user to enter credentials like application's path, database's path, database's type, database's secret key, etc.
 * @returns {Promise<{configPath: string; databasePath: string;}>}
 */
async function askCredentials(): Promise<{
  configPath: string;
  databasePath: string;
}> {
  try {
    const configPath = await input({
      message:
        "Enter the path of the rage config file (If the provided path does not exist, it will automatically create it):",
    });
    const databasePath = await input({
      message:
        "Enter the path of the local database directory (If the provided path does not exist, it will automatically create it):",
    });
    return { configPath: configPath, databasePath: databasePath };
  } catch (error: any) {
    if (error.code === "ExitPromptError") {
      console.log(chalk.red(`\nUnexpected error occurred: ${error.message}`));
      process.exit(1);
    } else {
      console.log(chalk.redBright("\nTerminating process..."));
      process.exit(1);
    }
  }
}

async function start() {
  await askCredentials();
}

start();
