import { input, select, confirm, password } from "@inquirer/prompts";
import chalk from "chalk";
import { RageConfigurations } from "../main";
import { MongoClient } from "mongodb";
import writeJsonFiles from "./writeJsonFiles";
import sleep from "./sleep";
import path from "path";
import * as fsS from "fs";
import * as fsP from "fs/promises";

async function pullCloudDatabase(
  configurations: RageConfigurations,
  databasePath: string
) {
  try {
    const op = await confirm({
      message:
        "Proceed with database specific configuration written on rage config file? (Enter no to manually enter the configuration):",
    });

    var newConfigSettings: RageConfigurations["databaseSpecificSettings"] = {
      secretKey: configurations.databaseSpecificSettings.secretKey,
      dbs: configurations.databaseSpecificSettings.dbs,
      excludeCollections:
        configurations.databaseSpecificSettings.excludeCollections,
    };

    // User wants to input configuration manually
    if (op !== true) {
      if (configurations.databaseType === "MongoDB") {
        var databaseSecret = await password({
          message:
            "Enter the database secret key (MongoDB URI) (Hit enter if you want to proceed with already existing configuration from rage config file):",
        });

        // If the user wants to proceed with existing database secret
        if (databaseSecret === "") {
          databaseSecret = configurations.databaseSpecificSettings.secretKey!;
        }

        var dbs: string | string[] = await input({
          message:
            "Enter the whitelisted databases (Use ',' to seperate the values) (Hit enter if you want to proceed with already existing configuration rage config file):",
        });

        dbs = dbs.split(",");
        dbs = dbs.map((e) => e.trim());

        var excludeCollections: string | string[] = await input({
          message:
            "Enter the blacklisted collections in all databases (Mention the database of the collection, e.g. 'db/col') (Use ',' to seperate the values):",
        });
        excludeCollections = excludeCollections.split(",");
        excludeCollections = excludeCollections.map((e) => e.trim());

        newConfigSettings.dbs = dbs;
        newConfigSettings.excludeCollections = excludeCollections;
        newConfigSettings.secretKey = databaseSecret;
      }
    } else {
      newConfigSettings.dbs = configurations.databaseSpecificSettings.dbs;
      newConfigSettings.excludeCollections =
        configurations.databaseSpecificSettings.excludeCollections;
      newConfigSettings.secretKey =
        configurations.databaseSpecificSettings.secretKey;
    }

    // Fetch the cloud database and update the local database

    // Create a MongoDB connection
    const mongodbInstance = new MongoClient(newConfigSettings.secretKey!);
    await mongodbInstance.connect();

    newConfigSettings.dbs!.forEach(async (dbName) => {
      const db = mongodbInstance.db(dbName);
      const collections = await db.listCollections().toArray();

      for (const collection of collections) {
        const collectionName = collection.name;
        if (collectionName in newConfigSettings.excludeCollections!) {
          // Skip
        } else {
          const data = await db.collection(collectionName).find().toArray();
          const res = await writeJsonFiles(
            databasePath,
            dbName,
            collectionName,
            data,
            true
          );
        }
      }
    });

    await sleep(10000);
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

async function pushLocalDatabase(
  configurations: RageConfigurations,
  databasePath: string
) {
  try {
    const op = await confirm({
      message:
        "Proceed with database specific configuration written on rage config file? (Enter no to manually enter the configuration):",
    });

    var newConfigSettings: RageConfigurations["databaseSpecificSettings"] = {
      secretKey: configurations.databaseSpecificSettings.secretKey,
      dbs: configurations.databaseSpecificSettings.dbs,
      excludeCollections:
        configurations.databaseSpecificSettings.excludeCollections,
    };

    // User wants to input configuration manually
    if (op !== true) {
      if (configurations.databaseType === "MongoDB") {
        var databaseSecret = await password({
          message:
            "Enter the database secret key (MongoDB URI) (Hit enter if you want to proceed with already existing configuration from rage config file):",
        });

        // If the user wants to proceed with existing database secret
        if (databaseSecret === "") {
          databaseSecret = configurations.databaseSpecificSettings.secretKey!;
        }

        var dbs: string | string[] = await input({
          message:
            "Enter the whitelisted databases to push (Use ',' to seperate the values) (Hit enter if you want to proceed with already existing configuration rage config file):",
        });

        dbs = dbs.split(",");
        dbs = dbs.map((e) => e.trim());

        var excludeCollections: string | string[] = await input({
          message:
            "Enter the blacklisted collections in all databases to ignore (Mention the database of the collection, e.g. 'db/col') (Use ',' to seperate the values):",
        });
        excludeCollections = excludeCollections.split(",");
        excludeCollections = excludeCollections.map((e) => e.trim());

        newConfigSettings.dbs = dbs;
        newConfigSettings.excludeCollections = excludeCollections;
        newConfigSettings.secretKey = databaseSecret;
      }
    } else {
      newConfigSettings.dbs = configurations.databaseSpecificSettings.dbs;
      newConfigSettings.excludeCollections =
        configurations.databaseSpecificSettings.excludeCollections;
      newConfigSettings.secretKey =
        configurations.databaseSpecificSettings.secretKey;
    }

    // Push the local database to the cloud

    // Create a MongoDB connection
    const mongodbInstance = new MongoClient(newConfigSettings.secretKey!);
    await mongodbInstance.connect();

    const actualPath = path.join(process.cwd(), databasePath);

    newConfigSettings.dbs!.forEach(async (dbName) => {
      const db = mongodbInstance.db(dbName);

      let allCollections = await fsP.readdir(
        path.join(actualPath, `/${dbName}`),
        "utf-8"
      );

      allCollections = allCollections.filter(
        (file) => path.extname(file).toLowerCase() === ".json"
      );

      allCollections.forEach(async (collection) => {
        collection = collection.slice(0, -5);
        const cols = await db.listCollections({ name: collection }).toArray();
        if (cols.length === 0) {
          await db.createCollection(collection);
          // console log on collection creation
        }
      });

      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        const collectionName = collection.name;
        if (collectionName in newConfigSettings.excludeCollections!) {
          // Skip
        } else {
          const fullPath = path.join(
            actualPath,
            `/${dbName}`,
            `/${collectionName}.json`
          );

          let content: any;

          try {
            content = await fsP.readFile(fullPath, "utf-8");
            if (content === "[]") {
              content = [];
            } else {
              content = JSON.parse(content);
            }

            // Empty the collection
            const c = db.collection(collectionName);
            await c.deleteMany({});

            content.forEach(async (document: any) => {
              c.insertOne(document).catch((error: any) => {
                console.log(`Unexpected error occurred!`);
              });
            });

            continue;
          } catch (error: any) {
            console.log(`Unexpected error occurred!`);
          }
        }
      }
    });

    await sleep(10000);
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

export { pullCloudDatabase, pushLocalDatabase };
