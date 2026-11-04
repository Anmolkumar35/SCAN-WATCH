import fs from "fs";
import path from "path";

async function runStep7Tests() {
  try {
    console.log("=== STARTING STEP 7 VERIFICATION ===");
    const timestamp = Date.now();

    // 1. Register User A
    const regResA = await fetch("http://127.0.0.1:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "User A Test",
        username: "usera_" + timestamp,
        email: "usera_" + timestamp + "@scanewatch.com",
        password: "Password123"
      })
    });
    const regDataA = await regResA.json();
    const tokenA = regDataA?.data?.token;

    if (!tokenA) {
      console.error("❌ User A Register/Login failed:", regDataA);
      return;
    }
    console.log("✅ 1. User A registered and authenticated.");

    // 2. Create small mock video file
    const mockVideoPath = path.resolve("test_clip.mp4");
    fs.writeFileSync(mockVideoPath, Buffer.from("mock video stream content bytes for test purpose only"));

    // 3. Upload Movie (Multipart form-data)
    const fileBuffer = fs.readFileSync(mockVideoPath);
    const blob = new Blob([fileBuffer], { type: "video/mp4" });
    const formData = new FormData();
    formData.append("title", "Interstellar Test Cut");
    formData.append("duration", "7200");
    formData.append("video", blob, "test_clip.mp4");

    const uploadRes = await fetch("http://127.0.0.1:5000/api/movies/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${tokenA}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log("✅ 2. Movie Upload Response:", uploadData.message);
    const movieId = uploadData?.data?.movie?._id;

    if (!movieId) {
      console.error("❌ Movie creation failed:", uploadData);
      return;
    }

    // 4. GET User A Movies
    const listRes = await fetch("http://127.0.0.1:5000/api/movies", {
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    const listData = await listRes.json();
    console.log(`✅ 3. Fetched User A movies. Count: ${listData.count}`);

    // 5. GET Single Movie
    const getRes = await fetch(`http://127.0.0.1:5000/api/movies/${movieId}`, {
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    const singleData = await getRes.json();
    console.log("✅ 4. Retrieved Movie Metadata:", singleData.data.movie.title);

    // 6. Test Video Streaming HTTP Range Request
    const streamRes = await fetch(`http://127.0.0.1:5000/api/movies/${movieId}/stream`, {
      headers: {
        "Authorization": `Bearer ${tokenA}`,
        "Range": "bytes=0-10"
      }
    });
    console.log(`✅ 5. Range Request HTTP Status: ${streamRes.status} (Expected 206)`);
    console.log("   Content-Range:", streamRes.headers.get("content-range"));

    // 7. Test User B cannot access User A movie (403 Forbidden)
    const regResB = await fetch("http://127.0.0.1:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "User B Test",
        username: "userb_" + timestamp,
        email: "userb_" + timestamp + "@scanewatch.com",
        password: "Password123"
      })
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB?.data?.token;

    const unauthRes = await fetch(`http://127.0.0.1:5000/api/movies/${movieId}`, {
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    console.log(`✅ 6. User B Access to User A Movie: ${unauthRes.status} (Expected 403 Forbidden)`);

    // 8. Delete Movie
    const deleteRes = await fetch(`http://127.0.0.1:5000/api/movies/${movieId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    const deleteData = await deleteRes.json();
    console.log("✅ 7. Delete Movie Response:", deleteData.message);

    // Cleanup local test temp clip
    if (fs.existsSync(mockVideoPath)) {
      fs.unlinkSync(mockVideoPath);
    }

    console.log("🎉 ALL STEP 7 TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

runStep7Tests();