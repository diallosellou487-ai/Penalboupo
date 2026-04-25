const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("Server OK");
});

// 🔥 ROUND SYNCHRO
function getRoundId(){
  return Math.floor(Date.now() / 10000);
}

// 🔥 RANDOM AVEC SEED (PAS Math.random)
function random(seed){
  return function(){
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// 🔥 CRASH MAX 30x
function getCrash(roundId){
  const rand = random(roundId);

  let r = rand();

  if(r < 0.5) return 1 + rand() * 1.5;   // 1 → 2.5
  if(r < 0.8) return 2 + rand() * 3;     // 2 → 5
  if(r < 0.95) return 5 + rand() * 10;   // 5 → 15
  return 15 + rand() * 15;               // 15 → 30 MAX
}

let currentRound = null;
let interval = null;

function startGame(){

  const roundId = getRoundId();

  // éviter double lancement
  if(roundId === currentRound) return;

  currentRound = roundId;

  let crash = getCrash(roundId);
  let coef = 1;

  console.log("🎮 ROUND:", roundId, "CRASH:", crash.toFixed(2));

  interval = setInterval(()=>{

    coef += 0.03;

    wss.clients.forEach(c=>{
      if(c.readyState === 1){
        c.send(JSON.stringify({
          type:"update",
          coef:coef.toFixed(2),
          round: roundId
        }));
      }
    });

    if(coef >= crash){

      clearInterval(interval);

      wss.clients.forEach(c=>{
        if(c.readyState === 1){
          c.send(JSON.stringify({
            type:"crash",
            coef:coef.toFixed(2),
            round: roundId
          }));
        }
      });

    }

  },80);
}

// 🔁 synchro automatique
setInterval(()=>{
  startGame();
},1000);

wss.on("connection", ()=>{
  console.log("CLIENT CONNECTÉ");
});

const port = process.env.PORT || 8080;

server.listen(port, ()=>{
  console.log("Server running on port " + port);
});server.listen(port, ()=>{
  console.log("Server running on port " + port);
});
