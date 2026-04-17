const path = require("path");
const jsonServer = require("json-server");

const dbPath = path.join(__dirname, "db.json");
const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post("/tasks/batch-order", (req, res) => {
  const body = req.body;
  const updates = body && body.updates;
  if (!Array.isArray(updates)) {
    return res
      .status(400)
      .json({ error: "Expected body: { updates: [{ id, order, status }] }" });
  }

  const state = router.db.getState();
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const byId = new Map(tasks.map((t) => [t.id, { ...t }]));

  for (const u of updates) {
    if (u == null || typeof u.id !== "number") continue;
    const cur = byId.get(u.id);
    if (!cur) continue;
    if (typeof u.order === "number") cur.order = u.order;
    if (u.status != null) cur.status = u.status;
  }

  const nextTasks = tasks.map((t) => {
    const merged = byId.get(t.id);
    return merged !== undefined && merged !== null ? merged : t;
  });
  router.db.setState({ ...state, tasks: nextTasks }).write();
  return res.status(204).end();
});

server.use(router);

const port = Number(process.env.PORT) || 3000;
const httpServer = server.listen(port, () => {
  console.log(`JSON Server listening on http://localhost:${port}`);
});

httpServer.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      "Port " +
        port +
        " is already in use. Stop the other process or run: PORT=3001 npm run server",
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
