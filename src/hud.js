
const CSS = `
#hud{--f:"Silkscreen","Press Start 2P","Courier New",ui-monospace,monospace;--ink:#05051a;--navy:#0d1240;--blue:#4da2ff;--cyan:#56e8ff;--lilac:#b06bff;--green:#39ff88;--mag:#ff2dd0;--txt:#e8efff;font-family:var(--f);color:var(--txt);text-transform:uppercase;letter-spacing:.08em;user-select:none}
#hud *{box-sizing:border-box}
#hud .pn{position:absolute;background:linear-gradient(180deg,#171e66,#0a0e38 70%),var(--navy);border:3px solid var(--ink);border-radius:6px;box-shadow:0 0 0 1px var(--blue),0 0 16px rgba(77,162,255,.5),inset 0 0 0 2px rgba(77,162,255,.22),4px 4px 0 var(--ink);padding:9px 13px}
#hud .pn::before,#hud .pn::after{content:"";position:absolute;width:5px;height:5px;border-radius:50%;background:#7a88e8;border:1px solid var(--ink)}
#hud .pn::before{left:3px;top:3px}#hud .pn::after{right:3px;bottom:3px}
#hud .lbl{font-size:10px;color:var(--cyan);text-shadow:0 0 6px rgba(86,232,255,.55)}
#hud .stat{font-size:10px;display:flex;justify-content:space-between;margin:5px 0 2px;color:#fff;text-shadow:0 0 6px rgba(150,180,255,.7)}
#hud .bar{position:relative;height:13px;border:2px solid var(--ink);background:#04041a;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1px rgba(77,162,255,.6)}
#hud .bar i{position:absolute;left:0;top:0;bottom:0;display:block;transition:width .12s;box-shadow:0 0 10px currentColor}
#hud .bar::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(5,5,26,.8) 9px 11px)}
#hud .bar.thin{height:10px}
#hud #tl{left:18px;top:16px;width:290px}
#hud #tl .row{display:flex;align-items:center;gap:10px}
#hud #tl .nm{font-size:22px;color:#fff;text-shadow:0 0 10px rgba(120,160,255,.9),0 0 22px rgba(120,100,255,.6);letter-spacing:.04em;flex:1}
#hud #lv{min-width:42px;height:34px;padding:0 8px;border:2px solid var(--ink);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:15px;background:linear-gradient(var(--lilac),#6a3ae0);color:#fff;box-shadow:0 0 0 1px #d6b0ff,0 0 10px rgba(176,107,255,.8);letter-spacing:0}
#hud #lv::before{content:"LV";font-size:8px;margin-right:4px;opacity:.85}
#hud #tc{left:50%;top:14px;transform:translateX(-50%);text-align:center;min-width:300px}
#hud #water{font-size:30px;line-height:1.1;color:#fff;text-shadow:0 0 12px rgba(86,232,255,.9),2px 2px 0 var(--ink)}
#hud #water b{color:var(--cyan);font-weight:400}
#hud #pips{display:flex;gap:9px;justify-content:center;margin:6px 0 4px}
#hud #pips span{width:14px;height:17px;border:2px solid var(--ink);border-radius:50% 50% 50% 50%/62% 62% 38% 38%;background:#2a1a5a;box-shadow:0 0 0 1px rgba(176,107,255,.6);position:relative}
#hud #pips span.c{background:var(--cyan);box-shadow:0 0 0 1px #fff,0 0 10px var(--cyan)}
#hud #pips span.a{animation:pp 1s infinite}
@keyframes pp{50%{background:var(--mag);box-shadow:0 0 0 1px #fff,0 0 10px var(--mag)}}
#hud #obj{font-size:10px;color:var(--green);text-shadow:0 0 8px rgba(57,255,136,.6)}
#hud #tr{right:18px;top:16px;width:170px;height:170px;padding:6px;border-radius:50%}
#hud #tr::before,#hud #tr::after{display:none}
#hud #tr canvas{width:100%;height:100%;border-radius:50%;display:block}
#hud #boss{left:50%;top:112px;transform:translateX(-50%);width:480px;display:none;text-align:center;box-shadow:0 0 0 1px var(--mag),0 0 18px rgba(255,45,208,.55),inset 0 0 0 2px rgba(255,45,208,.2),4px 4px 0 var(--ink)}
#hud #boss .lbl{color:#ff8ae8;text-shadow:0 0 8px rgba(255,45,208,.8)}
#hud #boss .bar{height:16px;margin-top:5px}
#hud #ab{left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:14px;padding:10px 16px}
#hud .sl{width:68px;text-align:center;position:relative}
#hud .ic{width:52px;height:52px;margin:0 auto 5px;border:3px solid var(--ink);border-radius:8px;position:relative;display:flex;align-items:center;justify-content:center;font-size:23px;letter-spacing:0;background:linear-gradient(#1c2478,#0a0e38);box-shadow:0 0 0 1px #5a6ad8;color:#9fb4ff;overflow:hidden}
#hud .ic u{position:absolute;inset:0;background:conic-gradient(rgba(5,5,26,.78) var(--cd,0deg),transparent 0);text-decoration:none}
#hud .sl.rdy .ic{box-shadow:0 0 0 1px var(--green),0 0 14px rgba(57,255,136,.7);color:var(--green);text-shadow:0 0 8px var(--green)}
#hud .key{font-size:9px;color:#cfe8ff}
#hud #hint{position:absolute;left:18px;bottom:18px;font-size:10px;line-height:1.9;background:rgba(10,14,56,.9);color:#cfe8ff;padding:7px 11px;border:2px solid var(--ink);box-shadow:0 0 0 1px rgba(77,162,255,.6);border-radius:4px;transition:opacity 1.5s}
#hud #vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(255,45,138,.6) 100%);opacity:0;transition:opacity .35s;pointer-events:none}
#hud #lowhp{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(176,107,255,.4) 100%);opacity:0;pointer-events:none;transition:opacity .4s}
#hud #toast{position:absolute;left:0;right:0;top:27%;text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s;pointer-events:none}
#hud #toast.on{opacity:1;transform:none}
#hud #toast h1{margin:0;display:inline-block;font-size:36px;font-weight:400;letter-spacing:.14em;color:#fff;text-shadow:0 0 14px rgba(120,160,255,1),0 0 30px rgba(140,80,255,.8),-2px -2px 0 var(--ink),2px -2px 0 var(--ink),-2px 2px 0 var(--ink),2px 2px 0 var(--ink),0 4px 0 var(--ink)}
#hud #toast h1{filter:drop-shadow(2px 2px 0 #1a0a4a)}#hud #toast p{margin:10px 0 0;font-size:11px;color:var(--green);background:rgba(8,10,44,.92);display:inline-block;padding:5px 12px;border:2px solid var(--ink);box-shadow:0 0 0 1px var(--green),0 0 12px rgba(57,255,136,.5);border-radius:4px}
#hud .dn{position:absolute;font-size:18px;color:#fff;letter-spacing:0;text-shadow:-1.5px -1.5px 0 var(--ink),1.5px -1.5px 0 var(--ink),-1.5px 1.5px 0 var(--ink),1.5px 1.5px 0 var(--ink),0 0 8px rgba(86,232,255,.9);pointer-events:none;will-change:transform,opacity}
#hud .ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;pointer-events:auto;background:radial-gradient(ellipse at center,rgba(8,6,40,.35),rgba(4,3,24,.85))}
#hud .ov.on{display:flex}
#hud .big{font-size:56px;font-weight:400;letter-spacing:.14em;color:#fff;text-shadow:0 0 16px rgba(120,160,255,1),0 0 36px rgba(140,80,255,.7),-3px -3px 0 var(--ink),3px -3px 0 var(--ink),-3px 3px 0 var(--ink),3px 3px 0 var(--ink),0 6px 0 var(--ink);margin:0;text-align:center;line-height:1.15}
#hud .sub{margin:14px 0 22px;font-size:11px;color:var(--cyan);background:rgba(10,14,56,.92);border:2px solid var(--ink);padding:8px 16px;box-shadow:0 0 0 1px var(--blue),0 0 14px rgba(77,162,255,.4);text-align:center;line-height:1.9;border-radius:4px}
#hud .btn{font:inherit;letter-spacing:.2em;text-transform:uppercase;font-size:18px;color:#fff;text-shadow:0 0 10px rgba(86,232,255,.9);background:linear-gradient(#1b2a8a,#0b1450);border:3px solid var(--ink);border-radius:6px;padding:13px 34px;cursor:pointer;box-shadow:0 0 0 2px var(--cyan),0 0 22px rgba(86,232,255,.65),4px 4px 0 var(--ink)}
#hud .btn:hover{transform:translate(-1px,-1px);background:linear-gradient(#2a44c8,#12206a);box-shadow:0 0 0 2px var(--green),0 0 26px rgba(57,255,136,.7),4px 4px 0 var(--ink)}
#hud #cards{display:flex;gap:22px;margin-top:22px}
#hud .card{position:relative;width:220px;padding:18px 14px;cursor:pointer;transition:transform .12s;text-align:center}
#hud .card:hover{transform:translateY(-6px);box-shadow:0 0 0 1px var(--green),0 0 22px rgba(57,255,136,.6),4px 4px 0 var(--ink)}
#hud .card h3{margin:8px 0;font-size:13px;font-weight:400;letter-spacing:.1em;color:#fff;text-shadow:0 0 8px rgba(150,180,255,.8)}
#hud .card p{margin:0;font-size:9px;line-height:1.8;letter-spacing:.04em;color:#b8c8ff}
#hud .card .n{font-size:34px;letter-spacing:0;color:var(--green);text-shadow:0 0 12px var(--green)}
#hud #title{background:radial-gradient(ellipse at 30% 40%,rgba(60,40,200,.5),transparent 60%),radial-gradient(ellipse at center,#0a0c3c,#02021a 90%)}
#hud .console{position:relative;width:min(1120px,95vw);height:min(640px,90vh);border-radius:22px;border:4px solid var(--ink);background:linear-gradient(135deg,#5a6684,#2a3350 40%,#454f70);box-shadow:0 0 0 2px #8a98c8,0 0 50px rgba(77,162,255,.45),inset 0 0 0 3px #1c2340;padding:20px 44px;display:flex}
#hud .console::before,#hud .console::after{content:"";position:absolute;top:90px;bottom:90px;width:14px;border:2px solid var(--ink);border-radius:3px;background:repeating-linear-gradient(180deg,#ff5a3a 0 7px,var(--ink) 7px 9px,#ffb02e 9px 16px,var(--ink) 16px 18px,#ff3d6a 18px 25px,var(--ink) 25px 27px,#ffe84a 27px 34px,var(--ink) 34px 36px)}
#hud .console::before{left:14px}#hud .console::after{right:14px}
#hud .screen{position:relative;flex:1;border:4px solid var(--ink);border-radius:10px;background:radial-gradient(ellipse at 28% 78%,rgba(40,90,230,.55),transparent 45%),linear-gradient(180deg,#0b0f48,#060830 70%,#030420);box-shadow:inset 0 0 40px rgba(0,0,0,.7),0 0 0 1px #6a78c8;display:flex;padding:28px 34px;gap:32px;overflow:hidden}
#hud .screen::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 4px)}
#hud .stage{position:absolute;left:0;right:0;top:56%;height:2px;background:rgba(90,110,230,.45);box-shadow:0 22px 0 rgba(90,110,230,.35),0 44px 0 rgba(90,110,230,.25)}
#hud .lcol{width:300px;flex:none;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
#hud .lcol .pad{position:absolute;bottom:92px;width:290px;height:70px;border-radius:50%;background:radial-gradient(ellipse,rgba(80,190,255,.75),rgba(40,90,230,.35) 60%,transparent 72%);box-shadow:0 0 30px rgba(77,162,255,.7)}
#hud .lcol img{position:relative;-webkit-mask-image:radial-gradient(ellipse 62% 66% at 50% 48%,#000 60%,transparent 100%);mask-image:radial-gradient(ellipse 62% 66% at 50% 48%,#000 60%,transparent 100%);height:370px;width:auto;margin-bottom:84px;filter:drop-shadow(0 0 10px rgba(120,160,255,.7))}
#hud .lcol .lname{position:absolute;left:0;bottom:36px;font-size:40px;color:#fff;text-shadow:0 0 14px rgba(150,180,255,1),0 0 30px rgba(120,100,255,.7);letter-spacing:.02em}
#hud .lcol .lst{position:absolute;left:0;bottom:0;font-size:9px;line-height:1.7;color:#fff;text-shadow:0 0 6px rgba(150,180,255,.8);white-space:nowrap}
#hud .rcol{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;min-width:0}
#hud .rcol h2{margin:0;font-size:38px;font-weight:400;letter-spacing:.1em;text-align:center;color:#fff;text-shadow:0 0 12px rgba(180,200,255,1),0 0 30px rgba(120,120,255,.8),3px 3px 0 #1a1a70;white-space:nowrap}
#hud .rcol h2 small{display:block;margin-top:8px;font-size:11px;letter-spacing:.3em;color:var(--cyan);text-shadow:0 0 8px var(--cyan)}
#hud .mode{margin-top:16px;width:100%;flex:1;border:3px solid var(--ink);border-radius:10px;padding:14px 18px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:linear-gradient(180deg,rgba(60,40,170,.55),rgba(20,16,90,.6));box-shadow:0 0 0 2px var(--lilac),0 0 22px rgba(176,107,255,.75),inset 0 0 30px rgba(0,0,0,.4)}
#hud .mode .tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(#8a4af0,#5a2ac0);border:3px solid var(--ink);padding:3px 18px;font-size:11px;color:#fff;border-radius:4px;box-shadow:0 0 12px rgba(176,107,255,.8);white-space:nowrap}
#hud .mode .sub{margin:12px 0 16px;font-size:10px}
#hud .mode .keys{margin-top:14px;font-size:8px;line-height:1.9;color:#9fb4ff;text-align:center}
#hud .badge{display:flex;align-items:center;gap:10px;margin-top:14px;padding:8px 18px 8px 12px;border:3px solid var(--ink);border-radius:8px;background:linear-gradient(#26308a,#0e1450);box-shadow:0 0 0 2px #7a88e8,0 0 16px rgba(77,162,255,.6);clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,10px 100%,0 50%)}
#hud .badge svg{width:30px;height:34px;flex:none;filter:drop-shadow(0 0 6px #4da2ff)}
#hud .badge b{display:block;font-size:20px;font-weight:700;color:#fff;letter-spacing:.14em;text-shadow:0 0 8px rgba(120,160,255,.9)}
#hud .badge span{display:block;font-size:9px;color:var(--cyan);letter-spacing:.2em}
@media(max-width:900px){#hud #tr{width:110px;height:110px}#hud #tc{min-width:220px}#hud #water{font-size:22px}#hud .lcol{display:none}#hud .rcol h2{font-size:22px}}
`;

export function createHud(root = document.getElementById('hud')) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root.innerHTML = `
  <div id="lowhp"></div><div id="vig"></div>
  <div class="pn" id="tl"><div class="row"><div class="nm">[LOFI]</div><div id="lv">1</div></div><div class="stat"><span>STAMINA:</span><span>[<span id="hpt" style="float:none">100</span>]</span></div><div class="bar"><i id="hp" style="background:linear-gradient(90deg,#1fd070,#39ff88);color:#39ff88;width:100%"></i></div><div class="stat"><span>XP:</span><span>[<span id="xpt"></span>]</span></div><div class="bar thin"><i id="xp" style="background:linear-gradient(90deg,#2a7aff,#56e8ff);color:#4da2ff;width:0"></i></div></div>
  <div class="pn" id="tc"><div class="lbl">WATER CLEANED</div><div id="water"><b>0</b> L</div><div id="pips"></div><div id="obj"></div></div>
  <div class="pn" id="tr"><canvas id="mm" width="300" height="300"></canvas></div>
  <div class="pn" id="boss"><div class="lbl" id="bossn">GRIME TITAN</div><div class="bar"><i id="bossb" style="background:linear-gradient(90deg,#c41a7e,#ff2dd0);color:#ff2dd0;width:100%"></i></div></div>
  <div class="pn" id="ab">
   <div class="sl rdy" id="s0"><div class="ic">&#9876;<u></u></div><div class="key">M1 STRIKE</div></div>
   <div class="sl rdy" id="s1"><div class="ic">&#10052;<u></u></div><div class="key">Q SLAM</div></div>
   <div class="sl rdy" id="s2"><div class="ic">&raquo;<u></u></div><div class="key">SPACE DASH</div></div>
  </div>
  <div id="hint">WASD MOVE &middot; MOUSE LOOK &middot; M1 COMBO<br>Q / M2 ICE SLAM &middot; SPACE DASH</div>
  <div id="toast"><h1></h1><br><p></p></div>
  <div class="ov" id="title"><div class="console"><div class="screen"><div class="stage"></div>
    <div class="lcol"><div class="pad"></div><img src="/lofi-title.png" alt="Lofi the yeti"><div class="lname">[LOFI]</div><div class="lst">STAMINA: [99.9]<br>SPEED: [99.9]<br>INTELLIGENCE: [99.9]</div></div>
    <div class="rcol"><h2>LOFI: THAW &amp; BUILD<small>SELECT GAME MODE</small></h2>
     <div class="mode"><div class="tag">PURIFY THE WATER</div><div class="sub">THE WATER IS SICK. THE YETI IS AWAKE.<br>PURIFY EVERY STREAM &middot; SLAY THE GRIME TITAN</div><button class="btn" id="go">START</button><div class="keys">WASD MOVE &middot; MOUSE LOOK (CLICK TO LOCK) &middot; M1 COMBO<br>Q/M2 SLAM &middot; SPACE DASH &middot; ARROWS ORBIT</div></div>
     <div class="badge"><svg viewBox="0 0 24 28"><path d="M12 1C12 1 3 11.5 3 17.5a9 9 0 0 0 18 0C21 11.5 12 1 12 1Z" fill="#4da2ff" stroke="#05051a" stroke-width="2"/><path d="M7 17.5c2-2 3.4-2 5 0s3 2 5 0" fill="none" stroke="#e8f4ff" stroke-width="1.6"/><path d="M7 21c2-2 3.4-2 5 0s3 2 5 0" fill="none" stroke="#e8f4ff" stroke-width="1.6"/></svg><div><b>CLAY</b><span>HACKATHON III</span></div></div></div>
  </div></div></div>
  <div class="ov" id="lvl"><h2 class="big" style="font-size:40px">LEVEL UP</h2><div class="sub" style="margin:10px 0 0">CHOOSE A BOON &middot; PRESS 1 2 3</div><div id="cards"></div></div>
  <div class="ov" id="end"><h2 class="big" id="endt"></h2><div class="sub" id="endp"></div><button class="btn" id="again">PLAY AGAIN</button></div>`;
  const $ = id => root.querySelector('#' + id);
  const el = {}; ['hp','hpt','xp','xpt','lv','water','pips','obj','boss','bossn','bossb','s0','s1','s2','toast','vig','lowhp','title','lvl','cards','end','endt','endp','mm','hint','go','again'].forEach(k => el[k] = $(k));
  const mm = el.mm.getContext('2d');
  let toastT = 0, hintT = 14, lastPips = '', cache = {};
  const set = (k, node, prop, v) => { if (cache[k] !== v) { cache[k] = v; node[prop] = v; } };
  const dnPool = [];

  function minimap(d) {
    const S = 300, c = S / 2, R = 136, sc = R / 70;
    mm.clearRect(0, 0, S, S); mm.save(); mm.beginPath(); mm.arc(c, c, c - 4, 0, 7); mm.clip();
    const bg = mm.createRadialGradient(c, c, 10, c, c, c); bg.addColorStop(0, '#16206e'); bg.addColorStop(1, '#070a30'); mm.fillStyle = bg; mm.fillRect(0, 0, S, S);
    mm.translate(c, c); mm.rotate(d.yaw);
    mm.strokeStyle = 'rgba(77,162,255,.4)'; mm.lineWidth = 1.5;
    for (let r = 40; r <= 120; r += 40) { mm.beginPath(); mm.arc(0, 0, r, 0, 7); mm.stroke(); }
    const P = (x, z) => [(x - d.px) * sc, (z - d.pz) * sc];
    for (const s of d.streams) {
      const [x, z] = P(s.x, s.z);
      mm.beginPath(); mm.arc(x, z, Math.max(5, s.radius * sc), 0, 7);
      mm.fillStyle = s.clean ? 'rgba(47,200,255,.9)' : 'rgba(57,255,136,.8)'; mm.fill();
      mm.strokeStyle = s.clean ? '#d8f6ff' : '#ff2dd0'; mm.lineWidth = 2.5; mm.stroke();
    }
    for (const e of d.enemies) { const [x, z] = P(e.x, e.z); mm.fillStyle = e.boss ? '#ff2d8a' : '#ff3df0'; mm.beginPath(); mm.arc(x, z, e.boss ? 7 : 3.4, 0, 7); mm.fill(); }
    if (d.target) { let [x, z] = P(d.target.x, d.target.z); const l = Math.hypot(x, z); if (l > R - 10) { x *= (R - 10) / l; z *= (R - 10) / l; } mm.fillStyle = '#39ff88'; mm.strokeStyle = '#05051a'; mm.lineWidth = 2; mm.beginPath(); mm.moveTo(x, z - 9); mm.lineTo(x + 7, z); mm.lineTo(x, z + 9); mm.lineTo(x - 7, z); mm.closePath(); mm.fill(); mm.stroke(); }
    mm.rotate(Math.PI - d.face);
    mm.fillStyle = '#fff'; mm.strokeStyle = '#56e8ff'; mm.lineWidth = 2.6; mm.beginPath(); mm.moveTo(0, -11); mm.lineTo(7, 8); mm.lineTo(0, 4); mm.lineTo(-7, 8); mm.closePath(); mm.fill(); mm.stroke();
    mm.restore();
    mm.strokeStyle = '#05051a'; mm.lineWidth = 4; mm.beginPath(); mm.arc(c, c, c - 3, 0, 7); mm.stroke(); mm.strokeStyle = '#4da2ff'; mm.lineWidth = 2; mm.beginPath(); mm.arc(c, c, c - 8, 0, 7); mm.stroke();
  }

  return {
    update(d, dt) {
      set('hp', el.hp.style, 'width', (Math.max(0, d.hp / d.maxHp) * 100).toFixed(1) + '%');
      set('hpt', el.hpt, 'textContent', Math.ceil(d.hp) + '/' + d.maxHp);
      set('xp', el.xp.style, 'width', (d.xp / d.xpNeed * 100).toFixed(1) + '%');
      set('xpt', el.xpt, 'textContent', Math.floor(d.xp) + '/' + d.xpNeed);
      set('lv', el.lv, 'textContent', d.level);
      set('water', el.water, 'innerHTML', '<b>' + Math.round(d.water).toLocaleString('en-US') + '</b> L');
      const pips = d.streams.map((s, i) => '<span class="' + (s.clean ? 'c' : s.active ? 'a' : '') + '"></span>').join('') ;
      if (pips !== lastPips) { lastPips = pips; el.pips.innerHTML = pips; }
      set('obj', el.obj, 'textContent', d.objective);
      el.lowhp.style.opacity = d.hp / d.maxHp < .3 ? .9 : 0;
      if (d.boss) { el.boss.style.display = 'block'; set('bossb', el.bossb.style, 'width', (d.boss.hp / d.boss.max * 100).toFixed(1) + '%'); } else el.boss.style.display = 'none';
      [d.cd.melee, d.cd.slam, d.cd.dash].forEach((f, i) => { const s = el['s' + i]; set('cd' + i, s.firstChild.lastChild.style, 'cssText', '--cd:' + (f * 360).toFixed(0) + 'deg'); s.classList.toggle('rdy', f <= 0); });
      if (toastT > 0 && (toastT -= dt) <= 0) el.toast.classList.remove('on');
      if (hintT > 0 && (hintT -= dt) <= 0) el.hint.style.opacity = 0;
      minimap(d);
    },
    toast(title, sub = '', t = 2.6) { const h = el.toast; h.querySelector('h1').textContent = title; h.querySelector('p').textContent = sub; h.querySelector('p').style.display = sub ? 'inline-block' : 'none'; h.classList.add('on'); toastT = t; },
    hurt() { el.vig.style.transition = 'none'; el.vig.style.opacity = .9; requestAnimationFrame(() => { el.vig.style.transition = 'opacity .5s'; el.vig.style.opacity = 0; }); },
    dmg(x, y, text, big) {
      const n = dnPool.pop() || Object.assign(document.createElement('div'), { className: 'dn' });
      n.textContent = text; n.style.fontSize = big ? '28px' : '18px'; n.style.color = big ? '#39ff88' : '#ffffff'; root.appendChild(n);
      let t = 0; const ox = (Math.random() - .5) * 30;
      const f = () => { t += .016; n.style.transform = 'translate(' + (x + ox) + 'px,' + (y - t * 70) + 'px) translate(-50%,-50%)'; n.style.opacity = Math.max(0, 1 - t / .8); if (t < .8) requestAnimationFrame(f); else { n.remove(); dnPool.push(n); } }; f();
    },
    showTitle(onStart) { el.title.classList.add('on'); el.go.onclick = () => { el.title.classList.remove('on'); onStart(); }; },
    showLevelUp(choices, onPick) {
      el.cards.innerHTML = '';
      const done = i => { document.removeEventListener('keydown', key); el.lvl.classList.remove('on'); onPick(choices[i]); };
      const key = e => { const i = '123'.indexOf(e.key); if (i >= 0 && i < choices.length) done(i); };
      choices.forEach((c, i) => { const d = document.createElement('div'); d.className = 'pn card'; d.innerHTML = '<div class="n">' + c.icon + '</div><div class="lbl">' + (i + 1) + '</div><h3>' + c.name + '</h3><p>' + c.desc + '</p>'; d.onclick = () => done(i); el.cards.appendChild(d); });
      document.addEventListener('keydown', key); el.lvl.classList.add('on');
    },
    showEnd(win, lines) { el.endt.innerHTML = win ? 'THE WATER<br>RUNS CLEAR' : 'LOFI<br>REFREEZES'; el.endp.innerHTML = lines.join('<br>'); el.end.classList.add('on'); el.again.onclick = () => location.reload(); },
  };
}
