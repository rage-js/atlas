#!/usr/bin/env node

import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import { createSpinner } from "nanospinner";
import * as fsS from "fs";
import * as fsP from "fs/promises";
import path from "path";
import * as Operations from "./util/operations";
import { RageConfigurations } from "./main";

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
      message: "Enter the path of the rage config file:",
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
      console.log(chalk.redBright("\nTerminating the process..."));
      process.exit(1);
    }
  }
}

/**
 * Sleep function which will make the process wait for few seconds
 * @param ms {number}
 * @returns {Promise<any>}
 */
async function sleep(ms: number): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Finds rage config file from the given path and reads the config file and returns all the configurations that exists on the config file
 * @returns {Promise<RageConfigurations>}
 */
async function fetchAllConfigurations(
  configPath: string
): Promise<RageConfigurations> {
  try {
    // Start the loading spinner
    const spinner = createSpinner("Finding config file...").start();
    await sleep(5000);

    // Get full path
    const currentPath = process.cwd();
    const fullPath = path.join(currentPath, configPath);

    if (fsS.existsSync(fullPath)) {
      spinner.clear();
      spinner.success({ text: `Config file found successfully.` });

      var data: any = await fsP.readFile(fullPath, "utf-8");
      data = JSON.parse(data);

      var returnValues: RageConfigurations = {
        method: data.method,
        methodSpecificSettings: data.methodSpecificSettings,
        databaseType: data.databaseType,
        databaseSpecificSettings: data.databaseSpecificSettings,
        loopStartDelay: data.loopStartDelay,
        outDir: data.outDir,
      };

      return returnValues;
    } else {
      console.log(
        chalk.red(`\nInvalid file path! Please provide a valid path`)
      );
      process.exit(1);
    }
  } catch (error: any) {
    if (error.message === "ExitPromptError") {
      console.log(chalk.red(`\nUnexpected error occurred: ${error.message}`));
      process.exit(1);
    } else {
      console.log(chalk.redBright("\n Terminating the process..."));
      process.exit(1);
    }
  }
}

/**
 * Function that checks if the given database path exists, if not creates one.
 * @returns {Promise<boolean>}
 */
async function checkDatabasePath(databasePath: string): Promise<boolean> {
  try {
    // Start the loading spinner
    const spinner = createSpinner("Finding the database directory...").start();
    await sleep(5000);

    // Get the full path
    const currentPath = process.cwd();
    const fullPath =
      databasePath === "." ? currentPath : path.join(currentPath, databasePath);

    try {
      // Find the full path
      await fsP.access(fullPath, fsS.constants.F_OK);
      spinner.clear();
      spinner.success({ text: `Directory found successfully.` });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // If directory doesn't exist
        spinner.update({ text: `Creating directory...` });
        await fsP.mkdir(fullPath, { recursive: true });
        spinner.clear();
        spinner.success({
          text: `Directory created successfully.`,
        });
      } else {
        console.log(chalk.red(`\nError accessing directory: ${error.message}`));
        process.exit(1);
      }
    }

    return true;
  } catch (error: any) {
    if (error.message === "ExitPromptError") {
      console.log(chalk.red(`\nUnexpected error occurred: ${error.message}`));
      process.exit(1);
    } else {
      console.log(chalk.redBright("\n Terminating the process..."));
      process.exit(1);
    }
  }
}

/**
 * Function that is in a never ending loop, which prompts repeatedly the list of operations that can be executed
 */
async function prompt(configurations: RageConfigurations) {
  try {
    var loopActive = true;
    while (loopActive) {
      // Clear the console (Works on Windows, not sure if it works on Mac and Linux OS)
      process.stdout.write("\x1Bc");

      const op = await select({
        message:
          "Choose any operation below to execute (Press Ctrl+C to exit):",
        choices: [
          {
            name: "Pull cloud database",
            value: "PullCloudDatabase",
            description:
              "Fetches the cloud database data and overwrites the local database with the fetched data.",
          },
          {
            name: "Push local database",
            value: "PushLocalDatabase",
            description:
              "Pushes the local database data to the cloud database and updates the cloud database.",
          },
        ],
      });

      if (op === "PullCloudDatabase") {
        await Operations.pullCloudDatabase(configurations);
      }

      if (op === "PushLocalDatabase") {
        await Operations.pushLocalDatabase(configurations);
      }

      continue;
    }
  } catch (error: any) {
    if (error.message === "ExitPromptError") {
      console.log(chalk.red(`\nUnexpected error occurred: ${error.message}`));
      process.exit(1);
    } else {
      console.log(chalk.redBright("\n Terminating the process..."));
      process.exit(1);
    }
  }
}

async function start() {
  const { configPath, databasePath } = await askCredentials();
  console.log("\n"); // Give a new line after prompting for the spinners
  const configurations = await fetchAllConfigurations(configPath);
  await checkDatabasePath(databasePath);
  // Prompt function automatically enters new lines when needed, so there is noo need to manually console log them
  await prompt(configurations);
}

start();
