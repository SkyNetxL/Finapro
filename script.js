
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
const pauseBtn = document.getElementById('pauseBtn'), soundBtn = document.getElementById('soundBtn');
const overlay = document.getElementById('overlay'), overlayText = document.getElementById('overlayText');
const resumeBtn = document.getElementById('resumeBtn'), restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score'), hsEl = document.getElementById('highscore');
const sprite = new Image(); sprite.src='drone_sprites.png';
let frame=0, running=false, paused=false, muted=false;
let drone={x:80,y:300,vy:0,w:64,h:64}, pipes=[], score=0, best=localStorage.getItem('best')||0, speed=2;
let particles=[];
let sounds={}, music, bgOffset=0;

function loadAudio(){
  sounds.flap=new Audio('blip.wav');
  sounds.score=new Audio('ping.wav');
  sounds.crash=new Audio('crash.wav');
  music=new Audio('cyber_ambience.wav'); music.loop=true; music.volume=0.5;
}
function spawn(){ let gap=160, y=Math.random()*(440-80)+80; pipes.push({x:400,y:y,w:50,gap:gap,sc:false}); }
function reset(){
  drone.y=300; drone.vy=0; pipes=[]; score=0; speed=2; running=true; paused=false;
  overlay.style.display='none'; scoreEl.textContent=0; hsEl.textContent='Рекорд: '+best;
  music.currentTime=0; if(!muted) music.play();
}
function toggleMute(){
  muted=!muted; music.muted=muted; Object.values(sounds).forEach(s=> s.muted=muted);
  soundBtn.textContent = muted? '🔇':'🔊';
}
function togglePause(){
  if(!running) return;
  paused=!paused;
  if(paused){ overlayText.textContent='Пауза'; overlay.style.display='flex'; music.pause(); }
  else { overlay.style.display='none'; if(!muted) music.play(); }
}
pauseBtn.onclick=togglePause; soundBtn.onclick=toggleMute;
resumeBtn.onclick=()=>{ togglePause(); };
restartBtn.onclick=()=>{ reset(); };

canvas.addEventListener('mousedown', e=>flap());
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); }, {passive:false});
document.addEventListener('keydown', e=>{ if(e.key===' ') flap(); if(e.key==='p') togglePause(); if(e.key==='m') toggleMute(); });

function flap(){
  if(!running || paused) return;
  if(!running){ reset(); return; }
  drone.vy=-12; sounds.flap.play();
}
function update(){
  if(running && !paused){
    frame++; drone.vy+=0.6; drone.y+=drone.vy;
    if(frame%80===0) spawn();
    pipes.forEach(p=>{
      p.x-=speed;
      // score/particles
      if(!p.sc && p.x+p.w<drone.x){
        p.sc=true; score++; sounds.score.play(); scoreEl.textContent=score;
        // spawn particles
        for(let i=0;i<10;i++){
          particles.push({x:drone.x+drone.w/2,y:drone.y+drone.h/2,
            vx:(Math.random()-0.5)*4, vy:(Math.random()-1)*4, life:30});
        }
        speed+=0.1;
      }
      // collision
      if(drone.x<p.x+p.w && drone.x+drone.w>p.x &&
        (drone.y<p.y || drone.y+drone.h>p.y+p.gap)){
        endGame();
      }
    });
    if(drone.y+drone.h>600||drone.y<0) endGame();
    bgOffset += 1;
  }
  draw(); requestAnimationFrame(update);
}
function endGame(){
  running=false; music.pause(); sounds.crash.play();
  overlayText.textContent='GAME OVER\nОчки: '+score;
  if(score>best){ best=score; localStorage.setItem('best',best); hsEl.textContent='Рекорд: '+best; }
  overlay.style.display='flex';
}
function draw(){
  // dynamic background: moving grid
  ctx.clearRect(0,0,400,600);
  ctx.strokeStyle='#0ff'; ctx.lineWidth=1;
  let off = bgOffset%40;
  for(let x= -off; x<400; x+=40){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke();
  }
  for(let y= -off; y<600; y+=40){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(400,y); ctx.stroke();
  }
  // pipes
  ctx.fillStyle='rgba(0,255,255,0.3)'; ctx.strokeStyle='#0ff'; ctx.lineWidth=3; ctx.shadowColor='#0ff'; ctx.shadowBlur=8;
  pipes.forEach(p=>{
    ctx.fillRect(p.x,0,p.w,p.y); ctx.strokeRect(p.x,0,p.w,p.y);
    ctx.fillRect(p.x,p.y+p.gap,p.w,600-p.y-p.gap); ctx.strokeRect(p.x,p.y+p.gap,p.w,600-p.y-p.gap);
  });
  // particles
  particles = particles.filter(pt=>pt.life>0);
  particles.forEach(pt=>{
    pt.x+=pt.vx; pt.y+=pt.vy; pt.life--;
    ctx.fillStyle=`rgba(0,255,255,${pt.life/30})`; ctx.fillRect(pt.x,pt.y,2,2);
  });
  // drone animation
  let idx = Math.floor((frame%20)/5);
  ctx.drawImage(sprite, idx*64,0,64,64, drone.x,drone.y,drone.w,drone.h);
}
loadAudio(); reset(); update();
