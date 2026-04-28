const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("Seed Timeline Server OK");
});

// 🔒 Générer seed
function generateSeed(){
  return crypto.randomBytes(16).toString("hex");
}

// 🎲 crash déterministe depuis seed
function getCrashFromSeed(seed){
  const hash = crypto.createHash("sha256").update(seed).digest("hex");

  let h = parseInt(hash.substring(0, 8), 16);

  let crash = (100 / (h % 100)) + 1;

  if(crash > 30) crash = 30; // max 30x

  return crash;
}

// 📈 Générer timeline complète
function generateTimeline(crash){

  let timeline = [];
  let coef = 1;

  while(coef < crash){
    coef *= 1.02; // 🔥 vitesse (modifiable)
    if(coef > crash) coef = crash;

    timeline.push(parseFloat(coef.toFixed(2)));
  }

  return timeline;
}

function startGame(){

  if(wss.clients.size === 0) return;

  let seed = generateSeed();
  let crash = getCrashFromSeed(seed);
  let timeline = generateTimeline(crash);

  console.log("SEED:", seed);
  console.log("CRASH:", crash.toFixed(2));

  let index = 0;

  let interval = setInterval(()=>{

    let coef = timeline[index];

    wss.clients.forEach(c=>{
      if(c.readyState === 1){
        c.send(JSON.stringify({
          type:"update",
          coef:coef,
          index:index
        }));
      }
    });

    index++;

    if(index >= timeline.length){
      clearInterval(interval);

      wss.clients.forEach(c=>{
        if(c.readyState === 1){
          c.send(JSON.stringify({
            type:"crash",
            coef:crash.toFixed(2),
            seed:seed
          }));
        }
      });

      setTimeout(startGame,2000);
    }

  },40); // ⚡ vitesse d'envoi (stable)

}

wss.on("connection", (ws)=>{
  console.log("Client connecté");
  startGame();
});

const port = process.env.PORT || 8080;

server.listen(port, ()=>{
  console.log("Server running on port", port);
});
