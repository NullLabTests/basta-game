import React, {useState, useEffect, useRef} from 'https://esm.sh/react@18.2.0';
import {createRoot} from 'https://esm.sh/react-dom@18.2.0/client';

function randomLetter(){
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return letters[Math.floor(Math.random()*letters.length)];
}

// Small validation dictionaries (not exhaustive)
const animals = ['dog','cat','horse','cow','sheep','goat','pig','lion','tiger','bear','eagle','owl','fish','shark','whale','dolphin','rabbit','mouse','rat','frog','lizard','snake','chicken','duck','goose'];
const colors = ['red','blue','green','yellow','pink','purple','orange','brown','black','white','gray','violet','indigo','turquoise','teal','magenta'];
const countries = ['mexico','united states','usa','canada','spain','france','germany','italy','brazil','argentina','colombia','peru','china','japan','india','australia','netherlands','sweden','norway'];
const professions = ['teacher','doctor','engineer','artist','lawyer','nurse','chef','driver','farmer','musician','scientist','programmer','developer','writer','journalist','pilot'];

const defaultCategoriesES = ['Nombre','Apellido','País/ciudad','Animal','Color','Fruta/verdura','Objeto','Profesión'];
const defaultCategoriesEN = ['First name','Last name','Country/City','Animal','Color','Fruit/Vegetable','Object','Profession'];

const translations = {
  es: {
    title: 'BASTA - Web',
    players: 'Jugadores (una por línea)',
    categories: 'Categorías (coma-separadas)',
    letter: 'Letra',
    time: 'Tiempo / por turno',
    start: 'Iniciar ronda',
    stop: '¡Basta!',
    changeLetter: 'Cambiar letra',
    results: 'Resultados',
    nextPlayer: 'Siguiente jugador',
    finishTurn: 'Terminar turno',
    rules: 'Reglas: respuesta válida y única = 10 pts, duplicado = 5 pts, inválida = 0 pts.'
  },
  en: {
    title: 'BASTA - Web',
    players: 'Players (one per line)',
    categories: 'Categories (comma-separated)',
    letter: 'Letter',
    time: 'Time / per turn',
    start: 'Start round',
    stop: 'Stop!',
    changeLetter: 'Change letter',
    results: 'Results',
    nextPlayer: 'Next player',
    finishTurn: 'Finish turn',
    rules: 'Rules: valid & unique = 10 pts, duplicate = 5 pts, invalid = 0 pts.'
  }
};

// Simple WebAudio sounds
function playTone(frequency=440, duration=0.12, type='sine'){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = frequency;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    o.start();
    setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01); o.stop(); ctx.close(); }, duration*1000);
  }catch(e){/* ignore audio errors */}
}

function App(){
  const [lang, setLang] = useState('es');
  const [players, setPlayers] = useState(['Jugador 1','Jugador 2']);
  const [namesText, setNamesText] = useState('Jugador 1\nJugador 2');
  const [categories, setCategories] = useState(defaultCategoriesES);
  const [letter, setLetter] = useState('');
  const [perTurnSeconds, setPerTurnSeconds] = useState(45);

  // gameplay state
  const [roundActive, setRoundActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [finished, setFinished] = useState([]);
  const [answers, setAnswers] = useState({}); // answers[playerIdx][catIdx]
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState(null);

  const turnTimerRef = useRef(null);
  const [turnSeconds, setTurnSeconds] = useState(perTurnSeconds);

  useEffect(()=>{ const list = namesText.split('\n').map(s=>s.trim()).filter(Boolean); if(list.length) setPlayers(list); },[namesText]);

  useEffect(()=>{ if(lang==='es') setCategories(defaultCategoriesES); else setCategories(defaultCategoriesEN); },[lang]);

  useEffect(()=>()=>{ if(turnTimerRef.current) clearInterval(turnTimerRef.current); },[]);

  function startRound(){
    setLetter(randomLetter());
    setRoundActive(true);
    setFinished(players.map(()=>false));
    setAnswers({});
    setRevealed(false);
    setResults(null);
    setCurrentTurn(0);
    setTurnSeconds(perTurnSeconds);
    playTone(880,0.12,'sawtooth');
    startTurnTimer();
  }

  function startTurnTimer(){
    if(turnTimerRef.current) clearInterval(turnTimerRef.current);
    setTurnSeconds(perTurnSeconds);
    turnTimerRef.current = setInterval(()=>{
      setTurnSeconds(s=>{
        if(s<=1){
          clearInterval(turnTimerRef.current);
          finishTurn();
        }
        return s-1;
      });
    },1000);
  }

  function finishTurn(){
    playTone(440,0.12,'triangle');
    setFinished(f=>{
      const copy = [...f]; copy[currentTurn]=true; return copy;
    });
    // advance to next unfinished player
    const next = players.findIndex((_,i)=>! (i<=currentTurn ? i<=currentTurn && true : false) );
    // simpler: find first not finished
    const nf = players.findIndex((_,i)=>{ return ! (finished[i] || (i===currentTurn)); });
    let nextIdx = nf;
    if(nextIdx===-1){
      // check if any remain after marking current finished
      const still = players.findIndex((_,i)=>!( (finished[i]|| (i===currentTurn)) ));
      nextIdx = still;
    }
    // recompute based on updated finished state
    const updatedFinished = [...finished]; updatedFinished[currentTurn]=true;
    const remaining = players.findIndex((_,i)=>!updatedFinished[i]);
    if(remaining===-1){
      // round over
      setRoundActive(false);
      setRevealed(true);
      scoreRound();
      return;
    }
    // move to remaining
    const nextPlayer = remaining;
    setCurrentTurn(nextPlayer);
    setTurnSeconds(perTurnSeconds);
    startTurnTimer();
  }

  function setPlayerAnswer(pi, ci, val){
    setAnswers(a=>{
      const copy = {...a};
      copy[pi]=copy[pi]||{};
      copy[pi][ci]=val.trim();
      return copy;
    });
  }

  function maskOrShow(pi, ci){
    if(revealed) return (answers[pi] && answers[pi][ci]) || '';
    if(pi===currentTurn) return (answers[pi] && answers[pi][ci]) || '';
    const v = (answers[pi] && answers[pi][ci]) || '';
    return v? '***' : '';
  }

  async function validateAnswerOnline(cat, val){
    if(!val || !val.trim()) return false;
    const v = val.trim();
    // quick client-side name heuristic
    if(/name/i.test(cat) || /nombre/i.test(cat) || /apellido/i.test(cat)){
      return /^[A-Za-zÁÉÍÓÚÑáéíóúñ' -]{2,}$/.test(v);
    }
    // Use Wikipedia opensearch (CORS-friendly with origin=*) to validate terms in ES/EN
    const query = v;
    const langDomains = (lang === 'es') ? ['es','en'] : ['en','es'];
    for(const ld of langDomains){
      try{
        const url = `https://${ld}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`;
        const res = await fetch(url).then(r=>r.json());
        if(Array.isArray(res) && res[1] && res[1].length>0) return true;
      }catch(e){
        // ignore fetch errors and try next
      }
    }
    // no match on Wikipedia; consider invalid
    return false;
  }

  async function scoreRound(){
    const catCount = categories.length;
    const scoreTbl = players.map(()=>0);
    const validityCache = new Map();
    for(let ci=0; ci<catCount; ci++){
      const map = new Map();
      players.forEach((p,pi)=>{
        const val = (answers[pi] && answers[pi][ci]) || '';
        const key = val.trim().toLowerCase() || '__blank__'+pi;
        if(!map.has(key)) map.set(key,[]);
        map.get(key).push(pi);
      });
      for(const [key, arr] of map.entries()){
        if(key.startsWith('__blank__')) continue;
        const sample = (answers[arr[0]] && answers[arr[0]][ci]) || '';
        let valid = validityCache.has(key) ? validityCache.get(key) : null;
        if(valid === null || valid === undefined){
          try{
            valid = await validateAnswerOnline(categories[ci], sample);
          }catch(e){ valid = false; }
          validityCache.set(key, valid);
        }
        if(!valid) continue;
        if(arr.length===1) scoreTbl[arr[0]] += 10; else arr.forEach(i=>scoreTbl[i]+=5);
      }
    }
    setResults(scoreTbl);
    // play success tone and mark winner for animation
    playTone(1200,0.15,'sine');
    // add winner flag to UI by applying a class later (handled at render)
  }

  const t = translations[lang];

  return (
    React.createElement('div',{className:'container'},
      React.createElement('div',{className:'header'},
        React.createElement('h1',null,t.title + ' — ' + (letter?('['+letter+']'):'') ),
        React.createElement('div',{className:'toggle'},
          React.createElement('div',{className:'lang-btn '+(lang==='es'?'active':''), onClick:()=>setLang('es')},'ES'),
          React.createElement('div',{className:'lang-btn '+(lang==='en'?'active':''), onClick:()=>setLang('en')},'EN')
        )
      ),

      React.createElement('div',{className:'controls'},
        React.createElement('div',{className:'panel'},
          React.createElement('label',null,t.players),
          React.createElement('textarea',{value:namesText,onChange:e=>setNamesText(e.target.value),rows:4,style:{minWidth:240}})
        ),
        React.createElement('div',{className:'panel'},
          React.createElement('label',null,t.categories),
          React.createElement('input',{type:'text',value:categories.join(','), onChange: e => setCategories(e.target.value.split(',').map(s=>s.trim()).filter(Boolean)), style:{minWidth:300}})
        ),
        React.createElement('div',null,
          React.createElement('div',{style:{marginBottom:8}}, React.createElement('small',null,t.letter+':'), ' ', React.createElement('span',{className:'timer'},letter||'--')),
          React.createElement('div',{style:{marginBottom:8}}, React.createElement('small',null,t.time+':'), ' ', React.createElement('span',{className:'timer'},turnSeconds+'s')),
          !roundActive ? React.createElement('div',null,
            React.createElement('button',{className:'btn primary',onClick:startRound},t.start),
            React.createElement('button',{className:'btn secondary',onClick:()=>setLetter(randomLetter()),style:{marginLeft:8}},t.changeLetter)
          ) : React.createElement('div',null,
            React.createElement('div',null, React.createElement('small',null, players[currentTurn] + ' — ' + t.time + ': ' + turnSeconds+'s')),
            React.createElement('div',{style:{marginTop:6}}, React.createElement('button',{className:'btn primary',onClick:finishTurn},t.finishTurn))
          )
        )
      ),

      React.createElement('div',{className:'grid'},
        players.map((p,pi)=>{
          const isActive = roundActive && currentTurn===pi && !revealed;
          return React.createElement('div',{className:'card',key:pi, style:{opacity:isActive?1:(revealed?1:0.85)}},
            React.createElement('h3',null,p + (isActive ? ' (Your turn)' : '')),
            React.createElement('div',{className:'answers'},
              React.createElement('table',{className:'table'},
                React.createElement('thead',null, React.createElement('tr',null, React.createElement('th',null,lang==='es'?'Categoría':'Category'), React.createElement('th',null,lang==='es'?'Respuesta':'Answer'), React.createElement('th',null,lang==='es'?'Estado':'Status'))),
                React.createElement('tbody',null, categories.map((c,ci)=>React.createElement('tr',{key:ci},
                  React.createElement('td',null,c),
                  React.createElement('td',null, isActive ? React.createElement('input',{type:'text',value:(answers[pi]&&answers[pi][ci])||'',onChange:(e)=>setPlayerAnswer(pi,ci,e.target.value)}) : React.createElement('span',null, maskOrShow(pi,ci)) ),
                  React.createElement('td',null, revealed ? ( validateAnswer(c,(answers[pi]&&answers[pi][ci])||'') ? (lang==='es'?'Válido':'Valid') : (lang==='es'?'Inválido':'Invalid') : ( (finished[pi] || (!roundActive && revealed)) ? (lang==='es'?'Terminado':'Done') : (isActive ? (lang==='es'?'Escribiendo':'Entering') : '—') ))
                )))
              )
            )
          );
        })
      ),

      React.createElement('div',{className:'results'},
        revealed && results ? (
          React.createElement('div',null,
            React.createElement('h3',null,t.results),
            React.createElement('ul',null, players.map((p,i)=>React.createElement('li',{key:i},p+': '+results[i]+' pts'))),
            React.createElement('div',{style:{marginTop:8}}, React.createElement('strong',null, (results[0]===results[1])? (lang==='es'?'Empate':'Tie') : (players[results.indexOf(Math.max(...results))] + ' ' + (lang==='es'?'gana':'wins') ) ) )
          )
        ):null
      ),

      React.createElement('div',{className:'footer'},React.createElement('small',null,lang==='es'?translations.es.rules:translations.en.rules))
    )
  );
}

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
