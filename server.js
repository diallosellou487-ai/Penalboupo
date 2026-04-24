const wss = new WebSocket.Server({ port: 8080 });
function getCrash(){
  let r = Math.random();

  if(r < 0.5) return 1 + Math.random() * 1.5;
  if(r < 0.8) return 2 + Math.random() * 3;
  if(r < 0.95) return 5 + Math.random() * 10;
  return 15 + Math.random() * 20;
}

let running = false;

function startGame(){

  if(wss.clients.size === 0){
    running = false;
    return;
  }

  running = true;

  let crash = getCrash();
  let coef = 1;

  let interval = setInterval(()=>{

    coef += 0.03;

    wss.clients.forEach(c=>{
      c.send(JSON.stringify({
        type:"update",
        coef:coef.toFixed(2)
      }));
    });

    if(coef >= crash){
      clearInterval(interval);

      wss.clients.forEach(c=>{
        c.send(JSON.stringify({
          type:"crash",
          coef:coef.toFixed(2)
        }));
      });

      setTimeout(startGame,2000);
    }

  },80);
}

wss.on("connection", ()=>{
  if(!running) startGame();
});

console.log("Server running...");
