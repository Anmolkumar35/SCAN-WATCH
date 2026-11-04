part1 = """import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

export default function WatchRoomPage({ roomId, username, onLeave }) {
  const [videoUrl, setVideoUrl] = useState("https://www.w3schools.com/html/mov_bbb.mp4");
  const [inputUrl, setInputUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMsg, setCurrentMsg] = useState("");

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const isRemote = useRef(false);

  const backendHost = window.location.hostname || "localhost";
  const serverBase = "http://" + backendHost + ":5000";

  useEffect(() => {
    const socket = io(serverBase);
    socketRef.current = socket;
    socket.emit("join-room", { roomId, username });
    socket.on("update-users", (u) => setUsers(u));
    socket.on("receive-message", (m) => setMessages((prev) => [...prev, m]));
    socket.on("sync-video", ({ action, currentTime, videoUrl: rUrl }) => {
      if (rUrl && rUrl !== videoUrl) setVideoUrl(rUrl);
      if (videoRef.current) {
        isRemote.current = true;
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
          videoRef.current.currentTime = currentTime;
        }
        if (action === "play") videoRef.current.play().catch(() => {});
        else if (action === "pause") videoRef.current.pause();
        setTimeout(() => { isRemote.current = false; }, 350);
      }
    });
    return () => socket.disconnect();
  }, [roomId, videoUrl, serverBase, username]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendSync = (action) => {
    if (isRemote.current || !videoRef.current) return;
    socketRef.current?.emit("sync-video", { roomId, action, currentTime: videoRef.current.currentTime, videoUrl });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!currentMsg.trim()) return;
    socketRef.current?.emit("send-message", { roomId, username, message: currentMsg.trim() });
    setCurrentMsg("");
  };

  const handleLoad = () => {
    if (!inputUrl.trim()) return;
    const url = inputUrl.trim();
    setVideoUrl(url);
    socketRef.current?.emit("sync-video", { roomId, action: "pause", currentTime: 0, videoUrl: url });
    setInputUrl("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("video", file);
    try {
      setIsUploading(true);
      setUploadStatus("Uploading video...");
      const response = await fetch(serverBase + "/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success && data.videoUrl) {
        const finalUrl = data.videoUrl.replace("localhost", backendHost);
        setVideoUrl(finalUrl);
        setUploadStatus("Uploaded successfully!");
        socketRef.current?.emit("sync-video", { roomId, action: "pause", currentTime: 0, videoUrl: finalUrl });
      }
    } catch {
      setUploadStatus("Upload error.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };
"""

part2 = """  return (
    <div style="{{" padding:="" "16px",="" maxwidth:="" "1200px",="" margin:="" "0="" auto",="" color:="" "#fff",="" fontfamily:="" "sans-serif"="" }}="">
      <div style="{{" display:="" "flex",="" justifycontent:="" "space-between",="" alignitems:="" "center",="" marginbottom:="" "16px",="" background:="" "#1e293b",="" padding:="" "12px="" 18px",="" borderradius:="" "8px"="" }}="">
        <div>
          <h2 style="{{" margin:="" 0,="" fontsize:="" "18px"="" }}="">SyncWatch Room: {roomId}</h2>
          <div style="{{" display:="" "flex",="" gap:="" "6px",="" margintop:="" "4px"="" }}="">
            <span style="{{" fontsize:="" "13px",="" color:="" "#94a3b8"="" }}="">Online:</span>
            {users.map((u, i) => (
              <span key="{i}" style="{{" background:="" "#0f172a",="" padding:="" "2px="" 8px",="" borderradius:="" "12px",="" fontsize:="" color:="" "#4ade80"="" }}="">● {u}</span>
            ))}
          </div>
        </div>
        <button onclick="{onLeave}" style="{{" background:="" "#ef4444",="" color:="" "#fff",="" border:="" "none",="" padding:="" "8px="" 14px",="" borderradius:="" "6px",="" cursor:="" "pointer",="" fontweight:="" "bold"="" }}="">Leave Room</button>
      </div>

      <div style="{{" display:="" "grid",="" gridtemplatecolumns:="" "repeat(auto-fit,="" minmax(320px,="" 1fr))",="" gap:="" "16px"="" }}="">
        <div>
          <div style="{{" display:="" "flex",="" gap:="" "8px",="" marginbottom:="" "12px"="" }}="">
            <input style="{{" flex:="" 1,="" padding:="" "9px="" 12px",="" borderradius:="" "6px",="" border:="" "1px="" solid="" #475569",="" background:="" "#1e293b",="" color:="" "#fff"="" }}="" value="{inputUrl}" onchange="{(e)" ==""> setInputUrl(e.target.value)} placeholder="Paste MP4 link..." />
            <button onclick="{handleLoad}" style="{{" background:="" "#2563eb",="" color:="" "#fff",="" padding:="" "9px="" 14px",="" border:="" "none",="" borderradius:="" "6px",="" cursor:="" "pointer"="" }}="">Load</button>
            <input type="file" accept="video/*" ref="{fileInputRef}" onchange="{handleFileUpload}" style="{{" display:="" "none"="" }}="">
            <button disabled="{isUploading}" onclick="{()" ==""> fileInputRef.current?.click()} style={{ background: "#10b981", color: "#fff", padding: "9px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>{isUploading ? "Uploading..." : "Upload"}</button>
          </div>
          {uploadStatus && <div style="{{" marginbottom:="" "10px",="" color:="" "#38bdf8"="" }}="">{uploadStatus}</div>}
          <div style="{{" background:="" "#000",="" borderradius:="" "8px",="" overflow:="" "hidden"="" }}="">
            <video ref="{videoRef}" key="{videoUrl}" src="{videoUrl}" controls="" playsinline="" style="{{" width:="" "100%",="" maxheight:="" "460px",="" display:="" "block"="" }}="" onplay="{()" ==""> sendSync("play")} onPause={() => sendSync("pause")} onSeeked={() => sendSync("seek")} />
          </div>
        </div>

        <div style="{{" background:="" "#1e293b",="" borderradius:="" "8px",="" display:="" "flex",="" flexdirection:="" "column",="" height:="" "510px"="" }}="">
          <div style="{{" padding:="" "12px="" 16px",="" borderbottom:="" "1px="" solid="" #334155",="" fontweight:="" "bold"="" }}="">💬 Live Room Chat</div>
          <div style="{{" flex:="" 1,="" padding:="" "14px",="" overflowy:="" "auto",="" display:="" "flex",="" flexdirection:="" "column",="" gap:="" "10px"="" }}="">
            {messages.map((m) => (
              <div key="{m.id}" style="{{" alignself:="" m.sender="==" username="" ?="" "flex-end"="" :="" "flex-start",="" maxwidth:="" "80%"="" }}="">
                <div style="{{" fontsize:="" "11px",="" color:="" "#94a3b8"="" }}="">{m.sender}</div>
                <div style="{{" background:="" m.sender="==" username="" ?="" "#2563eb"="" :="" "#334155",="" padding:="" "8px="" 12px",="" borderradius:="" "8px",="" fontsize:="" "13px"="" }}="">{m.text}</div>
              </div>
            ))}
            <div ref="{chatBottomRef}" />
          </div>
          <form onsubmit="{handleSendMessage}" style="{{" padding:="" "10px",="" bordertop:="" "1px="" solid="" #334155",="" display:="" "flex",="" gap:="" "8px"="" }}="">
            <input style="{{" flex:="" 1,="" padding:="" "9px="" 12px",="" borderradius:="" "6px",="" border:="" "1px="" solid="" #475569",="" background:="" "#0f172a",="" color:="" "#fff"="" }}="" value="{currentMsg}" onchange="{(e)" ==""> setCurrentMsg(e.target.value)} placeholder="Type message..." />
            <button type="submit" style="{{" background:="" "#3b82f6",="" color:="" "#fff",="" border:="" "none",="" padding:="" "8px="" 16px",="" borderradius:="" "6px",="" cursor:="" "pointer"="" }}="">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
"""

with open("src/pages/WatchRoomPage.jsx", "w", encoding="utf-8") as f:
    f.write(part1 + "\n" + part2)

print("SYNCWATCH_PAGE_PERFECTLY_BUILT")