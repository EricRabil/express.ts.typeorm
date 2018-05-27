import { Route } from "../http";
import { API_V0, ERROR_CODES } from "../Constants";
import { RestError } from "../http/util";

let testIncr = 0;

export = [
    {
        opts: {
            path: API_V0.TEST_1,
            method: "get"
        },
        handler(req, res, next) {
            res.json({test: "successful", number: testIncr++});
        }
    },
    {
        opts: {
            path: API_V0.TEST_2,
            method: "get"
        },
        handler(req, res, next) {
            throw new RestError("Success!", ERROR_CODES.TEST_2);
        }
    }
] as Route[];