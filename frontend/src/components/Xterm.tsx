import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
const SERVER_URL = "http://172.23.45.89:3000";

import "xterm/css/xterm.css";

export default function Xterminal() {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [xterm, setXterm] = useState<Terminal | null>(null);
  const [userDir, setUserDir] = useState<string>("");

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);
    if (newSocket) {
      newSocket.emit("input", " ");
    }
    

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendInputToBackend = useCallback(
    (inp: string) => {
      console.log("sending", inp);
      if (socket) {
        socket.emit("input", inp);
      }
    },
    [socket]
  );

  useEffect(() => {
    if (!terminalRef.current) return;

    const newXterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      
      theme: {
        background: "#282c34",
        foreground: "#abb2bf",
        
      },
    });
    const fitAddon = new FitAddon();
    newXterm.loadAddon(fitAddon);

    setXterm(newXterm);
    newXterm.open(terminalRef.current);
    fitAddon.fit();

    let currentLine = "";

    newXterm.onKey(({ key, domEvent }) => {
      const printable =
        !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) {
        // Enter
        sendInputToBackend(currentLine);
        currentLine = "";
        newXterm.write("\r\n");
      } else if (domEvent.keyCode === 8) {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          newXterm.write("\b \b");
        }
      } else if (printable) {
        currentLine += key;
        newXterm.write(key);
      }
    });

    window.addEventListener("resize", () => fitAddon.fit());

    return () => {
      newXterm.dispose();
      window.removeEventListener("resize", () => fitAddon.fit());
    };
  }, [terminalRef, sendInputToBackend]);

  useEffect(() => {
    if (!socket || !xterm) return;

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("output", (data) => {
      xterm.write(data);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("output");
    };
  }, [socket, xterm]);

  return (
    <div
      id="terminal"
      ref={terminalRef}
      className="h-full max-h-[300px] bg-[#282c34] p-2  "
    ></div>
  );
}
