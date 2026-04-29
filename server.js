const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ✅ route obligatoire (Render health check)
app.get("/", (req, res) => {
  res.send("SERVER OK");
});

// ⏱️ SYNCHRO
const START_TIME = 1710000000000;
const ROUND_DURATION = 5000;

// 🎲 crash
function getCrashFromSeed(seed){
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  let h = parseInt(hash.substring(0, 8), 16);

  let crash = (100 / (h % 100)) + 1;
  if(crash > 30) crash = 30;

  return crash;
}

// 📈 timeline
function generateTimeline(crash){
  let timeline = [];
  let coef = 1;

  while(coef < crash){
    coef *= 1.02;
    if(coef > crash) coef = crash;
    timeline.push(parseFloat(coef.toFixed(2)));
  }

  return timeline;
}

// 🔥 game state
function getGameState(){
  let now = Date.now();

  let round = Math.floor((now - START_TIME) / ROUND_DURATION);
  if(round < 0) round = 0;

  let seed = "seed-" + round;

  let crash = getCrashFromSeed(seed);
  let timeline = generateTimeline(crash);

  let timeInRound = (now - START_TIME) % ROUND_DURATION;
  let index = Math.floor(timeInRound / 40);

  return { round, seed, crash, timeline, index };
}

// 🚀 loop
setInterval(()=>{
  let game = getGameState();
  let coef = game.timeline[game.index] || game.crash;

  wss.clients.forEach(c=>{
    if(c.readyState === WebSocket.OPEN){
      c.send(JSON.stringify({
        type:"update",
        coef:coef,
        round:game.round,
        seed:game.seed
      }));
    }
  });

  if(coef >= game.crash){
    wss.clients.forEach(c=>{
      if(c.readyState === WebSocket.OPEN){
        c.send(JSON.stringify({
          type:"crash",
          coef:game.crash.toFixed(2),
          round:game.round,
          seed:game.seed
        }));
      }
    });
  }

},40);

// connexion
wss.on("connection", ()=>{
  console.log("Client connecté");
});

// ✅ PORT RENDER (IMPORTANT)
const PORT = process.env.PORT || 8080;

server.listen(PORT, ()=>{
  console.log("Server running on port", PORT);
});
