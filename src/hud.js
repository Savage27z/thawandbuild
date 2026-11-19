
const CSS = `
#hud{font-family:"Courier New",ui-monospace,"SF Mono",Menlo,monospace;color:#1b1f33;text-transform:uppercase;letter-spacing:.14em;user-select:none}
#hud *{box-sizing:border-box}
#hud .pn{position:absolute;background:linear-gradient(rgba(246,239,224,.93),rgba(246,239,224,.93)),repeating-linear-gradient(135deg,rgba(27,31,51,.18) 0 1px,transparent 1px 5px);background-blend-mode:normal;border:1.5px solid #1b1f33;box-shadow:3px 3px 0 rgba(27,31,51,.9),inset 0 0 0 3px rgba(246,239,224,.9),inset 0 0 0 4px rgba(27,31,51,.45);padding:9px 13px}
#hud .pn.hatch{background:repeating-linear-gradient(135deg,rgba(27,31,51,.10) 0 1px,transparent 1px 5px),#f6efe0}
#hud .lbl{font-size:10px;font-weight:700;opacity:.75}
#hud .bar{position:relative;height:12px;border:1.5px solid #1b1f33;background:#d9d2c3;overflow:hidden}
#hud .bar i{position:absolute;left:0;top:0;bottom:0;display:block;transition:width .12s}
#hud .bar::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 17px,rgba(27,31,51,.55) 17px 18px)}
#hud .bar.thin{height:6px}
#hud .bar.thin::after{display:none}
#hud #tl{left:18px;top:16px;width:270px}
#hud #tl .row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
#hud #lv{width:40px;height:40px;border:1.5px solid #1b1f33;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;background:#ffc36b;flex:none;letter-spacing:0}
#hud #tc{left:50%;top:14px;transform:translateX(-50%);text-align:center;min-width:290px}
#hud #water{font-size:30px;font-weight:900;letter-spacing:.08em;line-height:1.1;color:#1b1f33}
#hud #water b{color:#1f9a9a}
#hud #pips{display:flex;gap:8px;justify-content:center;margin:5px 0 3px}
#hud #pips span{width:13px;height:13px;border:1.5px solid #1b1f33;border-radius:50%;background:#3a2150;position:relative}
#hud #pips span.c{background:#38c2c0;box-shadow:0 0 0 2px rgba(56,194,192,.35)}
#hud #pips span.a{animation:pp 1s infinite}
@keyframes pp{50%{background:#b34bff}}
#hud #obj{font-size:10px;font-weight:700;opacity:.85}
#hud #tr{right:18px;top:16px;width:164px;height:164px;padding:6px;border-radius:50%}
#hud #tr canvas{width:100%;height:100%;border-radius:50%;display:block}
#hud #boss{left:50%;top:112px;transform:translateX(-50%);width:460px;display:none;text-align:center}
#hud #boss .bar{height:15px;margin-top:4px}
#hud #ab{left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:16px;padding:10px 18px}
#hud .sl{width:62px;text-align:center;position:relative}
#hud .ic{width:50px;height:50px;margin:0 auto 4px;border:1.5px solid #1b1f33;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;letter-spacing:0;background:#dff2f7;overflow:hidden}
#hud .ic u{position:absolute;inset:0;background:conic-gradient(rgba(27,31,51,.62) var(--cd,0deg),transparent 0);text-decoration:none}
#hud .sl.rdy .ic{box-shadow:0 0 0 3px rgba(143,184,207,.7)}
#hud .key{font-size:10px;font-weight:700}
#hud #hint{position:absolute;left:18px;bottom:18px;font-size:10px;line-height:1.7;font-weight:700;background:rgba(244,236,220,.88);color:#1b1f33;padding:6px 10px;border:1px solid #1b1f33;transition:opacity 1.5s}
#hud #vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(255,70,90,.55) 100%);opacity:0;transition:opacity .35s;pointer-events:none}
#hud #lowhp{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(179,75,255,.35) 100%);opacity:0;pointer-events:none;transition:opacity .4s}
#hud #toast{position:absolute;left:0;right:0;top:27%;text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s;pointer-events:none}
#hud #toast.on{opacity:1;transform:none}
#hud #toast h1{margin:0;display:inline-block;font-size:38px;font-weight:900;letter-spacing:.22em;color:#f6efe0;text-shadow:-2px -2px 0 #1b1f33,2px -2px 0 #1b1f33,-2px 2px 0 #1b1f33,2px 2px 0 #1b1f33,0 4px 0 #1b1f33}
#hud #toast p{margin:8px 0 0;font-size:13px;font-weight:700;color:#1b1f33;background:rgba(246,239,224,.9);display:inline-block;padding:3px 10px;border:1.5px solid #1b1f33}
#hud .dn{position:absolute;font-weight:900;font-size:18px;color:#f6efe0;letter-spacing:0;text-shadow:-1.5px -1.5px 0 #1b1f33,1.5px -1.5px 0 #1b1f33,-1.5px 1.5px 0 #1b1f33,1.5px 1.5px 0 #1b1f33;pointer-events:none;will-change:transform,opacity}
#hud .ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;pointer-events:auto;background:radial-gradient(ellipse at center,rgba(27,31,51,.25),rgba(27,31,51,.62))}
#hud .ov.on{display:flex}
#hud .big{font-size:64px;font-weight:900;letter-spacing:.2em;color:#f6efe0;text-shadow:-3px -3px 0 #1b1f33,3px -3px 0 #1b1f33,-3px 3px 0 #1b1f33,3px 3px 0 #1b1f33,0 7px 0 #1b1f33;margin:0;text-align:center;line-height:1.1}
#hud .sub{margin:14px 0 22px;font-size:14px;font-weight:700;background:#f6efe0;border:1.5px solid #1b1f33;padding:6px 16px;box-shadow:3px 3px 0 #1b1f33;text-align:center;line-height:1.7}
#hud .btn{font:inherit;font-weight:900;letter-spacing:.2em;text-transform:uppercase;font-size:16px;color:#1b1f33;background:#ffc36b;border:2px solid #1b1f33;padding:11px 26px;cursor:pointer;box-shadow:4px 4px 0 #1b1f33}
#hud .btn:hover{transform:translate(-1px,-1px);background:#ffd48f}
#hud #cards{display:flex;gap:20px;margin-top:20px}
#hud .card{width:210px;padding:16px 14px;cursor:pointer;position:relative;transition:transform .12s;text-align:center}
#hud .card:hover{transform:translateY(-6px)}
#hud .card h3{margin:6px 0;font-size:15px;letter-spacing:.12em}
#hud .card p{margin:0;font-size:11px;line-height:1.6;font-weight:700;letter-spacing:.06em}
#hud .card .n{font-size:30px;font-weight:900;letter-spacing:0}
@media(max-width:900px){#hud #tr{width:110px;height:110px}#hud #tc{min-width:220px}#hud #water{font-size:22px}}
`;

export function createHud(root = document.getElementById('hud')) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root.innerHTML = `
  <div id="lowhp"></div><div id="vig"></div>
  <div class="pn" id="tl"><div class="row"><div id="lv">1</div><div style="flex:1"><div class="lbl">LOFI THE YETI <span id="hpt" style="float:right">100</span></div><div class="bar" style="margin-top:4px"><i id="hp" style="background:#ff8d7a;width:100%"></i></div></div></div><div class="lbl" style="display:flex;justify-content:space-between"><span>XP</span><span id="xpt"></span></div><div class="bar thin"><i id="xp" style="background:#ffc36b;width:0"></i></div></div>
  <div class="pn hatch" id="tc"><div class="lbl">WATER CLEANED</div><div id="water"><b>0</b> L</div><div id="pips"></div><div id="obj"></div></div>
  <div class="pn" id="tr"><canvas id="mm" width="300" height="300"></canvas></div>
  <div class="pn" id="boss"><div class="lbl" id="bossn">GRIME TITAN</div><div class="bar"><i id="bossb" style="background:#ff3355;width:100%"></i></div></div>
  <div class="pn" id="ab">
   <div class="sl rdy" id="s0"><div class="ic">&#9876;<u></u></div><div class="key">M1 STRIKE</div></div>
   <div class="sl rdy" id="s1"><div class="ic">&#10052;<u></u></div><div class="key">Q SLAM</div></div>
   <div class="sl rdy" id="s2"><div class="ic">&raquo;<u></u></div><div class="key">SPACE DASH</div></div>
  </div>
  <div id="hint">WASD MOVE &middot; MOUSE LOOK &middot; M1 COMBO<br>Q / M2 ICE SLAM &middot; SPACE DASH</div>
  <div id="toast"><h1></h1><br><p></p></div>
  <div class="ov" id="title"><h2 class="big">LOFI<br><span style="font-size:34px;letter-spacing:.4em">THAW &amp; BUILD</span></h2><div class="sub">THE WATER IS SICK. THE YETI IS AWAKE.<br>PURIFY EVERY STREAM &middot; SLAY THE GRIME TITAN</div><button class="btn" id="go">WAKE LOFI</button><div class="sub" style="margin-top:22px;font-size:11px">WASD MOVE &middot; MOUSE LOOK (CLICK TO LOCK) &middot; M1 COMBO &middot; Q/M2 SLAM &middot; SPACE DASH &middot; ARROWS ORBIT</div></div>
  <div class="ov" id="lvl"><h2 class="big" style="font-size:44px">LEVEL UP</h2><div class="sub" style="margin:10px 0 0">CHOOSE A BOON &middot; PRESS 1 2 3</div><div id="cards"></div></div>
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
    mm.fillStyle = '#e9f3f3'; mm.fillRect(0, 0, S, S);
    mm.translate(c, c); mm.rotate(d.yaw);
    mm.strokeStyle = 'rgba(27,31,51,.28)'; mm.lineWidth = 1.5;
    for (let r = 40; r <= 120; r += 40) { mm.beginPath(); mm.arc(0, 0, r, 0, 7); mm.stroke(); }
    const P = (x, z) => [(x - d.px) * sc, (z - d.pz) * sc];
    for (const s of d.streams) {
      const [x, z] = P(s.x, s.z);
      mm.beginPath(); mm.arc(x, z, Math.max(5, s.radius * sc), 0, 7);
      mm.fillStyle = s.clean ? 'rgba(56,194,192,.85)' : 'rgba(58,33,80,.85)'; mm.fill();
      mm.strokeStyle = '#1b1f33'; mm.lineWidth = 2; mm.stroke();
    }
    for (const e of d.enemies) { const [x, z] = P(e.x, e.z); mm.fillStyle = e.boss ? '#ff3355' : '#7a2fa8'; mm.beginPath(); mm.arc(x, z, e.boss ? 7 : 3.4, 0, 7); mm.fill(); }
    if (d.target) { let [x, z] = P(d.target.x, d.target.z); const l = Math.hypot(x, z); if (l > R - 10) { x *= (R - 10) / l; z *= (R - 10) / l; } mm.fillStyle = '#ffc36b'; mm.strokeStyle = '#1b1f33'; mm.lineWidth = 2; mm.beginPath(); mm.moveTo(x, z - 9); mm.lineTo(x + 7, z); mm.lineTo(x, z + 9); mm.lineTo(x - 7, z); mm.closePath(); mm.fill(); mm.stroke(); }
    mm.rotate(Math.PI - d.face);
    mm.fillStyle = '#fff'; mm.strokeStyle = '#1b1f33'; mm.lineWidth = 2.2; mm.beginPath(); mm.moveTo(0, -11); mm.lineTo(7, 8); mm.lineTo(0, 4); mm.lineTo(-7, 8); mm.closePath(); mm.fill(); mm.stroke();
    mm.restore();
    mm.strokeStyle = '#1b1f33'; mm.lineWidth = 3; mm.beginPath(); mm.arc(c, c, c - 3, 0, 7); mm.stroke();
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
      n.textContent = text; n.style.fontSize = big ? '28px' : '18px'; n.style.color = big ? '#ffc36b' : '#f6efe0'; root.appendChild(n);
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
