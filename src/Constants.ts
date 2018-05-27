const prefix: <T>(routes: T, prefix: string) => T = <T>(routes: T, prefix: string) => {
    for (const key in routes) {
        routes[key] = `${prefix}${routes[key]}` as any;
    }
    return routes;
}

// The API routes. For example, {LOGIN: "/auth/login"}
export const API_V0 = prefix({
    TEST_1: "/test/1",
    TEST_2: "/test/2"
}, "/api/v0");

// Error codes. For example, {BAD_USERNAME: 1001}
export const ERROR_CODES = {TEST_2: 1002}
