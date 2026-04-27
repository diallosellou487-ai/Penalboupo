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

// 🔥 RANDOM SEED
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

  if(r < 0.5) return 1 + rand() * 1.5;
  if(r < 0.8) return 2 + rand() * 3;
  if(r < 0.95) return 5 + rand() * 10;
  return 15 + rand() * 15; // MAX 30
}

let currentRound = null;

function startGame(){

  const roundId = getRoundId();
  if(roundId === currentRound) return;

  currentRound = roundId;

  let crash = getCrash(roundId);
  let coef = 1;

  console.log("RENDER ROUND:", roundId, "CRASH:", crash.toFixed(2));

  let interval = setInterval(()=>{

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

setInterval(startGame,1000);

wss.on("connection", ()=>{
  console.log("CLIENT CONNECTÉ (RENDER)");
});

const port = process.env.PORT || 8080;

server.listen(port, ()=>{
  console.log("RENDER SERVER RUNNING");
});
