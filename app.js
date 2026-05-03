import React, {useState, useEffect, useRef} from 'https://esm.sh/react@18.2.0';
import {createRoot} from 'https://esm.sh/react-dom@18.2.0/client';

function randomLetter(){
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return letters[Math.floor(Math.random()*letters.length)];
}

const defaultCategories = ['Nombre','Apellido','País/ciudad','Animal','Color','Fruta/verdura','Objeto','Profesión'];

function App(){
  const [players, setPlayers] = useState(['Jugador 1','Jugador 2']);
  const [namesText, setNamesText] = useState('Jugador 1\nJugador 2');
  const [categories, setCategories] = useState(defaultCategories);
  const [letter, setLetter] = useState('');
  const [seconds, setSeconds] = useState(90);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const timerRef = useRef(null);

  useEffect(()=>{
    const list = namesText.split('\n').map(s=>s.trim()).filter(Boolean);
    if(list.length) setPlayers(list);
  },[namesText]);

  useEffect(()=>()=>{ if(timerRef.current) clearInterval(timerRef.current)},[]);

  function startRound(){
    setLetter(randomLetter());
    setSeconds(90);
    setRunning(true);
    setAnswers({});
    setResults(null);
    timerRef.current = setInterval(()=>{
      setSeconds(s=>{
        if(s<=1){
          clearInterval(timerRef.current);
          setRunning(false);
        }
        return s-1;
      });
    },1000);
  }

  function stopNow(){
    if(timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    scoreRound();
  }

  function updateAnswer(playerIdx, catIdx, val){
    setAnswers(a=>{
      const copy = {...a};
      copy[playerIdx] = copy[playerIdx]||{};
      copy[playerIdx][catIdx]=val.trim();
      return copy;
    });
  }

  function scoreRound(){
    // compute scores simple: unique=10, duplicate=5, blank=0
    const catCount = categories.length;
    const scoreTbl = players.map(()=>0);
    for(let ci=0;ci<catCount;ci++){
      const map= new Map();
      players.forEach((p,pi)=>{
        const val = (answers[pi] && answers[pi][ci]) || '';
        const key = val.toLowerCase() || '__blank__'+pi;
        if(!map.has(key)) map.set(key,[]);
        map.get(key).push(pi);
      });
      for(const [key,arr] of map.entries()){
        if(key.startsWith('__blank__')) continue;
        if(arr.length===1) scoreTbl[arr[0]]+=10; else arr.forEach(i=>scoreTbl[i]+=5);
      }
    }
    setResults(scoreTbl);
  }

  return (
    React.createElement('div',{className:'container'},
      React.createElement('h1',null,'BASTA - Web (Local React)'),
      React.createElement('div',{className:'controls'},
        React.createElement('div',null,
          React.createElement('label',null,'Jugadores (una por línea)'),
          React.createElement('textarea',{value:namesText,onChange:e=>setNamesText(e.target.value),rows:4,style:{width:240}})
        ),
        React.createElement('div',null,
          React.createElement('label',null,'Categorías (coma-separadas)'),
          React.createElement('input',{value:categories.join(','), onChange: e => setCategories(e.target.value.split(',').map(s=>s.trim()).filter(Boolean)), style:{width:300}})
        ),
        React.createElement('div',null,
          React.createElement('div',null, React.createElement('small',null,'Letra:'), ' ', React.createElement('span',{className:'timer'},letter||'--')),
          React.createElement('div',null, React.createElement('small',null,'Tiempo:'), ' ', React.createElement('span',{className:'timer'},seconds+'s')),
          !running ? React.createElement('div',null,
            React.createElement('button',{onClick:startRound},'Iniciar ronda'),
            React.createElement('button',{className:'secondary',onClick:()=>{setLetter(randomLetter())},style:{marginLeft:8}},'Cambiar letra')
          ) : React.createElement('button',{onClick:stopNow},'Basta!')
        )
      ),
      React.createElement('div',{className:'grid'},
        players.map((p,pi)=>React.createElement('div',{className:'card',key:pi},
          React.createElement('h3',null,p),
          React.createElement('div',{className:'answers'},
            React.createElement('table',{className:'table'},
              React.createElement('thead',null, React.createElement('tr',null, React.createElement('th',null,'Categoría'), React.createElement('th',null,'Respuesta'))),
              React.createElement('tbody',null, categories.map((c,ci)=>React.createElement('tr',{key:ci},
                React.createElement('td',null,c),
                React.createElement('td',null, React.createElement('input',{value:(answers[pi]&&answers[pi][ci])||'',onChange:(e)=>updateAnswer(pi,ci,e.target.value)}))
              )))
            )
          )
        ))
      ),
      React.createElement('div',{className:'results'},
        results ? (
          React.createElement('div',null,
            React.createElement('h3',null,'Resultados'),
            React.createElement('ul',null, players.map((p,i)=>React.createElement('li',{key:i},p+': '+results[i]+' pts')))
          )
        ):null
      ),
      React.createElement('div',{className:'footer'},React.createElement('small',null,'Rules: unique answer = 10 pts, duplicates = 5 pts, blank = 0 pts. This is a local-play web version of BASTA.'))
    )
  );
}

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
