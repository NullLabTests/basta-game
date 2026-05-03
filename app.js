import React, {useState, useEffect, useRef} from 'https://esm.sh/react@18.2.0';
import {createRoot} from 'https://esm.sh/react-dom@18.2.0/client';

function randomLetter(){
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return letters[Math.floor(Math.random()*letters.length)];
}

const defaultCategoriesES = ['Nombre','Apellido','País/ciudad','Animal','Color','Fruta/verdura','Objeto','Profesión'];
const defaultCategoriesEN = ['First name','Last name','Country/City','Animal','Color','Fruit/Vegetable','Object','Profession'];

const translations = {
  es: {
    title: 'BASTA - Web',
    players: 'Jugadores (una por línea)',
    categories: 'Categorías (coma-separadas)',
    letter: 'Letra',
    time: 'Tiempo',
    start: 'Iniciar ronda',
    stop: '¡Basta!',
    changeLetter: 'Cambiar letra',
    results: 'Resultados',
    rules: 'Reglas: respuesta única = 10 pts, duplicado = 5 pts, vacío = 0 pts.'
  },
  en: {
    title: 'BASTA - Web',
    players: 'Players (one per line)',
    categories: 'Categories (comma-separated)',
    letter: 'Letter',
    time: 'Time',
    start: 'Start round',
    stop: 'Stop!',
    changeLetter: 'Change letter',
    results: 'Results',
    rules: 'Rules: unique answer = 10 pts, duplicate = 5 pts, blank = 0 pts.'
  }
};

function App(){
  const [lang, setLang] = useState('es');
  const [players, setPlayers] = useState(['Jugador 1','Jugador 2']);
  const [namesText, setNamesText] = useState('Jugador 1\nJugador 2');
  const [categories, setCategories] = useState(defaultCategoriesES);
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

  // sync categories default when language changes and user hasn't modified manually
  useEffect(()=>{
    if(lang==='es') setCategories(defaultCategoriesES);
    else setCategories(defaultCategoriesEN);
  },[lang]);

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
          scoreRound();
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

  const t = translations[lang];

  return (
    React.createElement('div',{className:'container'},
      React.createElement('div',{className:'header'},
        React.createElement('h1',null,t.title),
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
          React.createElement('div',{style:{marginBottom:12}}, React.createElement('small',null,t.time+':'), ' ', React.createElement('span',{className:'timer'},seconds+'s')),
          !running ? React.createElement('div',null,
            React.createElement('button',{className:'btn primary',onClick:startRound},t.start),
            React.createElement('button',{className:'btn secondary',onClick:()=>setLetter(randomLetter()),style:{marginLeft:8}},t.changeLetter)
          ) : React.createElement('button',{className:'btn primary',onClick:stopNow},t.stop)
        )
      ),

      React.createElement('div',{className:'grid'},
        players.map((p,pi)=>React.createElement('div',{className:'card',key:pi},
          React.createElement('h3',null,p),
          React.createElement('div',{className:'answers'},
            React.createElement('table',{className:'table'},
              React.createElement('thead',null, React.createElement('tr',null, React.createElement('th',null,lang==='es'?'Categoría':'Category'), React.createElement('th',null,lang==='es'?'Respuesta':'Answer'))),
              React.createElement('tbody',null, categories.map((c,ci)=>React.createElement('tr',{key:ci},
                React.createElement('td',null,c),
                React.createElement('td',null, React.createElement('input',{type:'text',value:(answers[pi]&&answers[pi][ci])||'',onChange:(e)=>updateAnswer(pi,ci,e.target.value)}))
              )))
            )
          )
        ))
      ),

      React.createElement('div',{className:'results'},
        results ? (
          React.createElement('div',null,
            React.createElement('h3',null,t.results),
            React.createElement('ul',null, players.map((p,i)=>React.createElement('li',{key:i},p+': '+results[i]+' pts')))
          )
        ):null
      ),

      React.createElement('div',{className:'footer'},React.createElement('small',null,lang==='es'?translations.es.rules:translations.en.rules))
    )
  );
}

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
