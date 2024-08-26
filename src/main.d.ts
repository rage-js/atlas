interface RageConfigurations {
  method: "PAI" | "NI" | "POU";
  methodSpecificSettings: {
    interval?: number;
  };
  databaseType: "MongoDB";
  databaseSpecificSettings: {
    secretKey?: string;
    dbs?: string[];
    excludeCollections?: string[];
  };
  loopStartDelay: number;
  outDir: string;
}

export { RageConfigurations };
