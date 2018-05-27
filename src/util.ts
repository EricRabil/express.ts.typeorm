import crypto from "crypto";
import flake from "flake-idgen";
import * as winston from "winston";
import nobi = require("nobi");
import { User } from "./database/entities/User";
import child_process, { ChildProcess } from "child_process";
import { EventEmitter } from "events";
const uintformat = require("biguint-format");

const flaker = new flake({id: Number.parseInt(process.env.SERVER_ID as string) || 0, epoch: 1514764800000});

export namespace Security {
    /**
     * Creates a secure random string of a given length
     * @param length the length
     */
    export function random(length: number): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(length / 2, function(err, buffer) {
                err ? reject(err) : resolve(buffer.toString("hex"));
            });
        })
    }
    /**
     * Creates a unique snowflake
     */
    export function snowflake(): Promise<string> {
        return new Promise((resolve, reject) => {
            flaker.next((err, id) => {
                err ? reject(err) : resolve(uintformat(id, 'dec'));
            });
        });
    }
    /**
     * Utilities related to token management
     */
    export namespace Token {
        const decodeBase64 = (data: string) => Buffer.from(data, "base64").toString("ascii");
        const encodeBase64 = (data: string) => Buffer.from(data).toString("base64");

        export interface DecodedToken {
            snowflake: string;
            timestamp: Date;
            hmac: string;
            user: User;
        }

        /**
         * Decodes and validates a signed token
         *
         * @param token the token to decode
         */
        export async function decodeToken(token: string): Promise<DecodedToken | null> {
            const chunks: string[] = token.split(".");
            if (chunks.length !== 3) {
                return null;
            }
            const [snowflakeBase64, timestampBase64] = chunks;
            const snowflake = decodeBase64(snowflakeBase64);
            const timestampEpoch = (decodeBase64(timestampBase64) as any) * 1;
            if (isNaN(timestampEpoch)) {
                return null;
            }
            const timestamp = new Date();
            timestamp.setTime(timestampEpoch);
            if (isNaN(timestamp.getTime())) {
                return null;
            }
            const user = await User.findOne({snowflake});
            if (!user) {
                return null;
            }
            const signer = nobi(user.salt);
            let hmacData: string;
            try {
                hmacData = signer.unsign(token);
            } catch (e) {
                Logger.warn(`Failed to decode HMAC data from token:`);
                console.warn(e);
                return null;
            }
            if (hmacData !== `${snowflakeBase64}.${timestampBase64}`) {
                return null;
            }
            return {
                snowflake,
                timestamp,
                hmac: hmacData,
                user,
            };
        }

        /**
         * Validates a token and then gets the user it belongs to
         * @param token the token to validate
         * @returns undefined if the token is invalid
         */
        export async function getUser(token: string): Promise<User | null> {
            const parsedToken = await decodeToken(token);
            return parsedToken && parsedToken.user;
        }

        /**
         * Creates and signs a token for the given user
         *
         * @param user the user to create a token for
         */
        export async function createToken(user: User | string): Promise<string> {
            if (typeof user === "string") {
                const _user = await User.findOne(user)
                if (!_user) {
                    throw new Error("Unknown user.");
                }
                user = _user;
            }
            const snowflakeBase64 = encodeBase64(user.snowflake);
            const timestampBase64 = encodeBase64(Date.now() + "");
            const signer = nobi(user.salt);
            const partialToken: string = `${snowflakeBase64}.${timestampBase64}`;
            const hmac: string = signer.sign(partialToken);
            return hmac;
        }
    }
}

export namespace StringUtils {
    /**
     * Repeats the given string the given amount of times
     * @param char string to repeat
     * @param amount number of repetitions
     */
    export async function repeatChar(char: string, amount: number): Promise<string> {
        let str: string = "";
        for (let i = 0; i < amount; i++) str += char;
        return str;
    }
}

export namespace ArrayUtils {
    /**
     * Takes a possibly innaccessible variable and wraps it in an array
     */
    export function optional<T>(item: T | undefined | null): T[] {
        if (item) {
            return [item];
        }
        return [];
    }
}

export interface LogMessage {
    content: string;
    timestamp: number;
    stream: "stdout" | "stderr";
}

/**
 * Wrapper class for ChildProcess
 */
export class Process extends EventEmitter {

    /**
     * Process log
     */
    public log: LogMessage[] = [];
    public process!: ChildProcess;

    public constructor(private command: string, private options: {
        cwd: string,
        env: {
            [key: string]: string
        }
    }) {
        super();
    }

    /**
     * Execute and return the exit code
     */
    public exec(): Promise<number> {
        return new Promise((resolve, reject) => {
            const argv = this.command.split(" ");
            this.process = child_process.spawn(argv[0], argv.slice(1), this.options);
            const watcher = (type: "stdout" | "stderr") => (data: string | Buffer) => {
                data = data.toString();
                if (data.length === 0 || data === "\n") {
                    return;
                }
                if (data.endsWith("\n")) {
                    data = data.substring(0, data.length - 2);
                }
                const packet = {
                    content: data,
                    timestamp: Date.now(),
                    stream: type
                };
                this.log.push(packet);
                this.emit("data", packet);
            };
            this.process.stdout.on("data", watcher("stdout"));
            this.process.stderr.on("data", watcher("stderr"));
            this.process.on("close", code => resolve(code));
            this.process.on("error", reject);
        });
    }
}

export const Logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            handleExceptions: false,
            json: false,
            colorize: true,
        }),
    ],
    exitOnError: false,
});