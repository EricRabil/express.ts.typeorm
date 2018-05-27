import { connect } from './database';
import { HttpServer } from "./http";

connect().then(() => {
    const server: HttpServer = new HttpServer(Number.parseInt(process.env.HTTP_PORT as string) || 8080);
});