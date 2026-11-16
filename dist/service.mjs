import node from "@prisma/composer/node";
import { compute } from "@prisma/composer-prisma-cloud";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import { type } from "arktype";
import { secretString } from "@prisma/composer/arktype";
import contractJson from "./prisma/contract.json" with { type: "json" };
export default compute({
    name: "backend",
    deps: { db: postgres(dataContract(contractJson)) },
    input: type({
        jwtSecret: secretString(),
    }),
    build: node({ module: import.meta.url, dir: "../dist", entry: "index.js", dependencies: "external" }),
});
