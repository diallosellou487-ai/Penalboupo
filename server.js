const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("Server OK");
});

// 🎲 crash fixé une fois
function getCrash(){
  let r = Math.random();

  if(r < 0.5) return 1 + Math.random() * 1.5;
  if(r < 0.8) return 2 + Math.random() * 3;
  if(r < 0.95) return 5 + Math.random() * 10;
  return 15 + Math.random() * 15; // max ~30
}

function startGame(){

  if(wss.clients.size === 0) return;

  let crash = getCrash();
  let startTime = Date.now();

  console.log("CRASH FIXE:", crash.toFixed(2));

  let interval = setInterval(()=>{

    // ⏱ temps écoulé
    let t = (Date.now() - startTime) / 1000;

    // 🚀 VITESSE AUGMENTÉE ICI
    let coef = 1 + t * 1.8; // 🔥 plus rapide que normal

    // 🛑 stop au crash
    if(coef >= crash){
      coef = crash;
    }

    // envoi clients
    wss.clients.forEach(c=>{
      if(c.readyState === 1){
        c.send(JSON.stringify({
          type:"update",
          coef:coef.toFixed(2)
        }));
      }
    });

    // 💥 crash
    if(coef >= crash){
      clearInterval(interval);

      wss.clients.forEach(c=>{
        if(c.readyState === 1){
          c.send(JSON.stringify({
            type:"crash",
            coef:coef.toFixed(2)
          }));
        }
      });

      setTimeout(startGame,2000);
    }

  },40); // ⚡ rapide

}

wss.on("connection", ()=>{
  console.log("Client connecté");
  startGame();
});

const port = process.env.PORT || 8080;

server.listen(port, ()=>{
  console.log("Server running on", port);
});
