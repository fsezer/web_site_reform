import http from "node:http";
import { ga4Report, psiReport, scReport } from "./index.js";

const port = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (path === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("ok");
    return;
  }

  if (path === "/psi" || path === "/pagespeed") {
    void psiReport(req, res);
    return;
  }

  if (path === "/sc" || path === "/search-console") {
    void scReport(req, res);
    return;
  }

  // / , /ga4 , legacy /?days=
  void ga4Report(req, res);
});

server.listen(port, () => {
  console.log(`ga4-report listening on ${port}`);
});
