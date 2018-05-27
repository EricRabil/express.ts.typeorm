import { Route } from ".";

export namespace Routing {
    /**
     * Prefix route with path
     * @param route the route
     * @param prefix the prefix
     */
    export function prefixPath(route: Route, prefix: string): Route {
        route.opts.path = `${prefix}/${route.opts.path}`;
        return route;
    }

    /**
     * Prefix paths of routes
     * @param routes the routes
     * @param prefix the prefix
     */
    export function prefixPaths(routes: Route[], prefix: string): Route[] {
        for (let route of routes) {
            prefixPath(route, prefix);
        }
        return routes;
    }
}

export interface RestErrorFields {
    fields?: {
        [key: string]: string[];
    }
}

export type StandardRestError = {
    message: string;
    code: number;
} & RestErrorFields;

export declare interface RestError<T extends object> {
    constructor(response: T): this;
    constructor(response: string, code: number, fields?: RestErrorFields): this;
}

/**
 * Wrapper for errors to be sent to the client
 */
export class RestError<T extends object> {

    private response: T | StandardRestError;
    public statusCode: number;

    constructor(message: T | string, code?: number, fields?: RestErrorFields) {
        if (typeof message === "string" && typeof code === "number") {
            this.response = {
                message,
                code,
                fields: fields as any
            };
            return;
        }
        if (typeof message === "object") {
            this.response = message;
        }
    }

    public get body(): T | StandardRestError {
        return this.response;
    }

    public get json(): string {
        return JSON.stringify(this.response);
    }

    public static INTERNAL_ERROR(ref: string): RestError<StandardRestError> {
        const err = new RestError(`Internal error occurred. Tracking number: ${ref}`, 1002);
        err.statusCode = 500;
        return err as any;
    }
}