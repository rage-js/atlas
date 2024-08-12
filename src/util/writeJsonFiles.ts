import chalk from "chalk";
import path from "path";
import * as fsS from "fs";
import * as fsP from "fs/promises";
import { createSpinner } from "nanospinner";
import sleep from "./sleep";

/**
 * Writes JSON files with the given data in the given directory
 * @param {string} databasePath
 * @param {string} databaseName
 * @param {string} fileName
 * @param {any} dataToWrite
 * @param [logger=false] logger
 */
async function writeJsonFiles(
  databasePath: string,
  databaseName: string,
  fileName: string,
  dataToWrite: any,
  logger: boolean = false
) {
  try {
    const folderPath = path.join(databasePath, databaseName);
    const finalFilePath = path.join(folderPath, `${fileName}.json`);
    let newlyUpdatedData = [];
    dataToWrite.forEach((document: any) => {
      if (document.id) {
        delete document._id;
        newlyUpdatedData.push(document);
      } else {
        document.id = document._id.toString();
        delete document._id;
        newlyUpdatedData.push(document);
      }
    });
    const convertedJsonData = JSON.stringify(dataToWrite, null, 2);
    if (!fsS.existsSync(folderPath)) {
      const spinner = createSpinner(
        `Creating directory for ${databaseName} database...`
      );
      await sleep(2000);

      await fsP.mkdir(folderPath, { recursive: true });

      // Log about the directory creation
      if (logger) {
        spinner.clear();
        spinner.success({
          text: `Directory for ${databaseName} database created.`,
        });
      }
    }

    const schemasFolderPath = path.join(folderPath, "schemas");

    if (!fsS.existsSync(schemasFolderPath)) {
      const spinner = createSpinner(
        `Creating schemas folder for ${databaseName} database...`
      );
      await sleep(2000);

      await fsP.mkdir(schemasFolderPath, { recursive: true });

      if (logger) {
        spinner.clear();
        spinner.success({
          text: `Schemas folder for ${databaseName} database created.`,
        });
      }
    }

    if (!fsS.existsSync(path.join(schemasFolderPath, `${fileName}.json`))) {
      console.log(
        `${chalk.yellow(
          "Warning!"
        )} Schema file for ${fileName}/${databaseName} collection is not found!`
      );
    }

    await fsP.writeFile(finalFilePath, convertedJsonData);

    return finalFilePath;
  } catch (error: any) {
    if (error.message === "ExitPromptError") {
      console.log(chalk.red(`\nUnexpected error occurred: ${error.message}`));
      process.exit(1);
    } else {
      console.log(chalk.redBright("\nTerminating the process..."));
      process.exit(1);
    }
  }
}

export default writeJsonFiles;
