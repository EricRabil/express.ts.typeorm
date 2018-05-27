import "reflect-metadata";
import {createConnection} from "typeorm";
import { join } from "path";

const entityDir = join(__dirname, "entities", "*.js");

export function connect() {
    return createConnection({
        type: process.env.DATABASE_ENGINE as any || "mongodb",
        host: "localhost",
        port: 27017,
        database: process.env.DATABASE_NAME as any || "stormstarter",
        entities: [entityDir],
        logging: false,
        synchronize: process.env.NODE_ENV === "DEVELOPMENT"
    });
}