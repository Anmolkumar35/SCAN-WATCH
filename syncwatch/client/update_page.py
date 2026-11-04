page_code = r'''import React, { useState, useEffect, useRef } from "react";
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
  const serverBase = `http://${backendHost}:5000`;

  useEffect(() => {
    const socket = io(serverBase);
    socketRef.current = socket;

    socket.emit("join-room", { roomId, username });

    socket.on("update-users", (userList) => {
      setUsers(userList);
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("sync-video", ({ action, currentTime, videoUrl: remoteUrl }) => {
      if (remoteUrl && remoteUrl !== videoUrl) {
        setVideoUrl(remoteUrl);
      }
      if (videoRef.current) {
        isRemote.current = true;
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
          videoRef.current.currentTime = currentTime;
        }
        if (action === "play") {
          videoRef.current.play().catch(() => {});
        } else if (action === "pause") {
          videoRef.current.pause();
        }
        setTimeout(() => {
          isRemote.current = false;
        }, 350);
      }
    });

    return () => socket.disconnect();
  }, [roomId, videoUrl, serverBase, username]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendSync = (action) => {
    if (isRemote.current || !videoRef.current) return;
    socketRef.current?.emit("sync-video", {
      roomId,
      action,
      currentTime: videoRef.current.currentTime,
      videoUrl,
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!currentMsg.trim()) return;
    socketRef.current?.emit("send-message", {
      roomId,
      username,
      message: currentMsg.trim(),
    });
    setCurrentMsg("");
  };

  const handleLoad = () => {
    if (!inputUrl.trim()) return;
    const url = inputUrl.trim();
    setVideoUrl(url);
    socketRef.current?.emit("sync-video", {
      roomId,
      action: "pause",
      currentTime: 0,
      videoUrl: url,
    });
    setInputUrl("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    try {
      setIsUploading(true);
      setUploadStatus("Uploading video to server...");

      const response = await fetch(`${serverBase}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        const finalUrl = data.videoUrl.replace("localhost", backendHost);
        setVideoUrl(finalUrl);
        setUploadStatus("Uploaded successfully!");

        socketRef.current?.emit("sync-video", {
          roomId,
          action: "pause",
          currentTime: 0,
          videoUrl: finalUrl,
        });
      } else {
        setUploadStatus("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("Error uploading video file.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  return (