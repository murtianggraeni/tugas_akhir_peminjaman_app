// index.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const http = require("http");
const NodeCache = require("node-cache");
const compression = require("compression");
const { setupWebSocketServer } = require("./config/websocketServer");

const WebSocket = require("ws");
const routeUser = require("./routes/routeAuth");
const routePeminjaman = require("./routes/routeUser");
const routeAdmin = require("./routes/routeAdmin");
const routeSensor = require("./routes/routeSensor");
const routeNotification = require("./routes/routeNotification");
const routeStatus = require('./routes/routeStatus');
const connectDb = require("./config/db");

const sensorController = require("./controllers/sensorController");

const { initializeWebSocket } = require("./controllers/sensorController");
const { updateExpiredPeminjaman } = require("./controllers/userController");
const { getAndUpdateCounts } = require("./controllers/countController");

const app = express();

const server = http.createServer(app);


const admin = require('firebase-admin');
const serviceAccount = require('./pushnotification-fe894-firebase-adminsdk-6o36a-b5a82eb18b.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase admin initialized successfully.");

// Cache setup
const cache = new NodeCache({ stdTTL: 100 });

// Enable compression for faster response
app.use(compression());

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDb();

// Initialize WebSocket
// console.log("Setting up WebSocket server...");
const wss = setupWebSocketServer(server);
sensorController.initializeWebSocket(wss);
// console.log("WebSocket server setup complete");

app.get("/", (req, res) => {
  res.send("API Ready");
});

app.use("/admin", routeAdmin);
app.use("/auth", routeUser);
app.use("/user", routePeminjaman);
app.use("/sensor", routeSensor);
app.use("/status", routeStatus);
app.use("/notifications", routeNotification);

const port = process.env.PORT || 5000;

// Start server
server.listen(port, async () => {
  console.log(`Server berjalan di port ${port}`);
  try {
    // Perbarui data expired peminjaman dan count saat startup
    await updateExpiredPeminjaman();
    await getAndUpdateCounts();
    // console.log("Initial update of expired peminjaman and counts completed");

    // Schedule task to update peminjaman and counts every 5 minutes
    scheduleUpdateExpiredPeminjaman();
  } catch (error) {
    console.error("Error during startup:", error);
  }
});

// Fungsi untuk menjalankan pembaruan secara berkala setiap 5 menit
const scheduleUpdateExpiredPeminjaman = () => {
  cron.schedule("*/5 * * * *", async () => {
    // console.log("Menjalankan pemeriksaan peminjaman kedaluwarsa...");
    try {
      await updateExpiredPeminjaman();
      await getAndUpdateCounts();
      // console.log(
      //   "Pemeriksaan peminjaman kedaluwarsa dan update counts selesai"
      // );
    } catch (error) {
      console.error("Error during scheduled update:", error);
    }
  });
};

// ------------------------------------------------------------------------------------------------------------ //

// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const cron = require("node-cron");
// const http = require("http");
// const NodeCache = require("node-cache");
// const compression = require("compression");
// const { setupWebSocketServer } = require("./config/websocketServer");

// const WebSocket = require("ws");
// const routeUser = require("./routes/routeAuth");
// const routePeminjaman = require("./routes/routeUser");
// const routeAdmin = require("./routes/routeAdmin");
// const routeSensor = require("./routes/routeSensor");
// const routeNotification = require("./routes/routeNotification");
// const connectDb = require("./config/db");

// const sensorController = require("./controllers/sensorController");

// const { initializeWebSocket } = require("./controllers/sensorController");
// const { updateExpiredPeminjaman } = require("./controllers/userController");
// const { getAndUpdateCounts } = require("./controllers/countController");

// const app = express();
// // const server = http.createServer((req, res) => {
// //     // Log all incoming requests
// //     console.log('[HTTP] Incoming request:', req.method, req.url);
// //     app(req, res);
// // });
// const server = http.createServer(app);


// const admin = require('firebase-admin');
// const serviceAccount = require('./pushnotification-fe894-firebase-adminsdk-6o36a-b5a82eb18b.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// // Debug logging middleware
// // app.use((req, res, next) => {
// //     console.log('[HTTP] Request:', req.method, req.url);
// //     if (req.headers.upgrade !== 'websocket') {
// //         console.log('[HTTP] Headers:', req.headers);
// //     }
// //     next();
// // });

// // CORS configuration
// // app.use(cors({
// //     origin: '*',
// //     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //     allowedHeaders: ['Content-Type', 'Authorization']
// // }));

// // Cache setup
// const cache = new NodeCache({ stdTTL: 100 });

// // Enable compression for faster response
// app.use(compression());

// app.use(cors());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Connect to database
// connectDb();

// // Initialize WebSocket
// // console.log("Setting up WebSocket server...");
// const wss = setupWebSocketServer(server);
// sensorController.initializeWebSocket(wss);
// // console.log("WebSocket server setup complete");

// app.get("/", (req, res) => {
//   res.send("API Ready");
// });

// app.use("/admin", routeAdmin);
// app.use("/auth", routeUser);
// app.use("/user", routePeminjaman);
// app.use("/sensor", routeSensor);
// app.use("/notifications", routeNotification);

// // Special handling for sensor routes
// // app.use("/sensor", (req, res, next) => {
// //   console.log("[HTTP] Sensor route request:", req.method, req.url);
// //   if (
// //     req.headers.upgrade &&
// //     req.headers.upgrade.toLowerCase() === "websocket"
// //   ) {
// //     console.log("[HTTP] WebSocket upgrade request detected");
// //     return next();
// //   }
// //   console.log("[HTTP] Regular HTTP request, passing to sensor routes");
// //   routeSensor(req, res, next);
// // });

// const port = process.env.PORT || 5000;

// // Start server
// server.listen(port, async () => {
//   console.log(`Server berjalan di port ${port}`);
//   try {
//     // Perbarui data expired peminjaman dan count saat startup
//     await updateExpiredPeminjaman();
//     await getAndUpdateCounts();
//     // console.log("Initial update of expired peminjaman and counts completed");

//     // Schedule task to update peminjaman and counts every 5 minutes
//     scheduleUpdateExpiredPeminjaman();
//   } catch (error) {
//     console.error("Error during startup:", error);
//   }
// });

// // Fungsi untuk menjalankan pembaruan secara berkala setiap 5 menit
// const scheduleUpdateExpiredPeminjaman = () => {
//   cron.schedule("*/5 * * * *", async () => {
//     // console.log("Menjalankan pemeriksaan peminjaman kedaluwarsa...");
//     try {
//       await updateExpiredPeminjaman();
//       await getAndUpdateCounts();
//       // console.log(
//       //   "Pemeriksaan peminjaman kedaluwarsa dan update counts selesai"
//       // );
//     } catch (error) {
//       console.error("Error during scheduled update:", error);
//     }
//   });
// };

// --------------------------------------------------------------------------------------------------------- //

// Handle WebSocket upgrade
// index.js

// Handle WebSocket upgrade
// server.on('upgrade', (request, socket, head) => {
//     const pathname = request.url;

//     if (pathname.startsWith('/sensor/') && pathname.endsWith('/updateCurrent')) {
//         console.log('[WebSocket] Upgrade request for:', pathname);

//         // Make sure handleUpgrade is called only once
//         wss.handleUpgrade(request, socket, head, (ws) => {
//             wss.emit('connection', ws, request);
//         });
//     } else {
//         // If path is invalid, destroy the socket and avoid multiple upgrade attempts
//         socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
//         socket.destroy();
//     }
// });

// app.listen(port, async () => {

//     console.log(`Server berjalan di port ${port}`);
//     await updateExpiredPeminjaman();
//     console.log('Initial update of expired peminjaman completed');
// })
