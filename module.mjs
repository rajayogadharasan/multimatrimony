// @ts-check
import { module } from "@prisma/composer";
import { envSecret } from "@prisma/composer-prisma-cloud";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import backendContractJson from "./src/prisma/contract.json" with { type: "json" };
import backendService from "./src/service.mts";

export default module("multimatrimony", ({ provision }) => {
  const database = provision(
    postgres({
      name: "database",
      contract: dataContract(backendContractJson),
      config: "./prisma.config.ts",
    }),
  );
  provision(backendService, {
    deps: { db: database },
    input: { jwtSecret: envSecret("JWT_SECRET") }, // Signs login tokens (JWTs).
  });
});
