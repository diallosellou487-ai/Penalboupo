const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("SYNC CRASH SERVER OK");
});

// ⏱️ IMPORTANT : doit être IDENTIQUE sur Render + Termux
const START_TIME = 1710000000000;

// ⚡ durée d’un round (5s)
const ROUND_DURATION = 5000;

// 🎲 crash basé sur seed
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
    coef *= 1.02; // ⚡ vitesse
    if(coef > crash) coef = crash;

    timeline.push(parseFloat(coef.toFixed(2)));
  }

  return timeline;
}

// 🔥 état du jeu synchronisé
function getGameState(){

  let now = Date.now();

  // 📊 round global basé sur le temps
  let round = Math.floor((now - START_TIME) / ROUND_DURATION);

  if(round < 0) round = 0;

  let seed = "seed-" + round;

  let crash = getCrashFromSeed(seed);
  let timeline = generateTimeline(crash);

  // ⏱ position dans le round actuel
  let timeInRound = (now - START_TIME) % ROUND_DURATION;
  let index = Math.floor(timeInRound / 40);

  return { round, seed, crash, timeline, index };
}

// 🚀 boucle serveur
setInterval(()=>{

  let game = getGameState();

  let coef = game.timeline[game.index] || game.crash;

  wss.clients.forEach(c=>{
    if(c.readyState === 1){
      c.send(JSON.stringify({
        type:"update",
        coef:coef,
        round:game.round,
        seed:game.seed
      }));
    }
  });

  // 💥 crash sync
  if(coef >= game.crash){

    wss.clients.forEach(c=>{
      if(c.readyState === 1){
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

wss.on("connection", ()=>{
  console.log("Client connecté");
});

const port = process.env.PORT || 8080;

server.listen(port, ()=>{
  console.log("SERVER SYNC READY");
});});
