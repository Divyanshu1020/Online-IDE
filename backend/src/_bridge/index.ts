import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import * as pty from 'node-pty';
import path from "path";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Allow requests from your frontend
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
const userDir = path.resolve(__dirname, '..','user');
console.log("userDir", userDir);

const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: userDir, 
});

app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

app.get("/", (req, res) => {
    res.send("Hello World!");
});

io.on("connection", (socket) => {
    console.log("User connected")
    // ptyProcess.write("ls\r");


    ptyProcess.onData((data) => {
        console.log("Output:", data);
        socket.emit("output", data);
    });

    socket.on('input', (msg) => {
        ptyProcess.write(`${msg}\r`); 
        console.log("User input:", msg);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
});