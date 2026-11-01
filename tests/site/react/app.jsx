import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
function Button({ onClick, children }) { return <button id="btn" onClick={onClick}>{children}</button>; }
function Label({ n }) { return <span id="lbl">Count: {n}</span>; }
function Static() { return <p id="static">static</p>; }
const Memo = React.memo(Static);
function App() {
  const [n, setN] = useState(0);
  return <div id="app"><h2>React test</h2><Label n={n} /><Button onClick={() => setN(n + 1)}>+1</Button><Memo /></div>;
}
createRoot(document.getElementById('root')).render(<App />);
