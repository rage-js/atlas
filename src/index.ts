#!/usr/bin/env node

import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import { createSpinner } from "nanospinner";
import * as fsS from "fs";
import * as fsP from "fs/promises";
import path from "path";

interface RageConfigurations {
  method: "PAI" | "NI" | "POU";
  methodSpecificSettings: {
    interval?: number;
  };
  databaseType: "MongoDB";
  databaseSpecificSettings: {
    secretKey?: string;
    dbs?: string;
    excludeCollections?: string;
  };
  loopStartDelay: number;
  outDir: string;
}

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
    console.log("\n");

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

async function start() {
  const cred = await askCredentials();
  const configurations = await fetchAllConfigurations(cred.configPath);
}

start();
