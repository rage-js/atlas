import chalk from "chalk";
import path from "path";
import * as fsS from "fs";
import * as fsP from "fs/promises";

/**
 * Writes JSON files with the given data in the given directory
 * @param {string} databasePath
 * @param {string} databaseName
 * @param {string} fileName
 * @param {any} dataToWrite
 */
async function writeJsonFiles(
  databasePath: string,
  databaseName: string,
  fileName: string,
  dataToWrite: any
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
      await fsP.mkdir(folderPath, { recursive: true });
      // console log that the directory is created
    }

    const schemasFolderPath = path.join(folderPath, "schemas");

    if (!fsS.existsSync(schemasFolderPath)) {
      await fsP.mkdir(schemasFolderPath, { recursive: true });
      // console log that the schemas directory is created
    }

    if (!fsS.existsSync(path.join(schemasFolderPath, `${fileName}.json`))) {
      // console log that the database doesn't have any schema files
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
