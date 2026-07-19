import http from "node:http";
import { ga4Report } from "./index.js";

const port = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  // Cloud Run health
  if (req.url === "/" || req.url?.startsWith("/health")) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("ok");
    return;
  }
  // Accept / and /ga4Report
  void ga4Report(req, res);
});

server.listen(port, () => {
  console.log(`ga4-report listening on ${port}`);
});
