/* Capital Champions V3.2.1 - verified room fix */
(function () {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const msg = (ca, en) => (typeof lang !== 'undefined' && lang === 'en' ? en : ca);
  const setStatus = (text) => { const el = byId('netStatus'); if (el) el.textContent = text; };
  const setCode = (code) => {
    const host = byId('hostCode');
    const box = byId('codeBox');
    if (host) host.textContent = code;
    if (box) box.value = code;
  };
  const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const peerId = (code) => 'capital-' + code.toLowerCase();
  const destroyOldPeer = () => {
    try { if (typeof conn !== 'undefined' && conn) conn.close(); } catch (_) {}
    try { if (typeof peer !== 'undefined' && peer && !peer.destroyed) peer.destroy(); } catch (_) {}
  };
  const peerOptions = { debug: 1, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } };

  function attachConnection(c) {
    conn = c;
    conn.on('open', function () {
      setStatus(msg('✅ Amic connectat', '✅ Friend connected'));
      if (typeof showSub === 'function') showSub('onlineGame');
      if (typeof isHost !== 'undefined' && isHost && typeof onlineNext === 'function') onlineNext();
    });
    conn.on('data', function (data) { if (typeof handleNet === 'function') handleNet(data); });
    conn.on('close', function () { setStatus(msg('Connexió tancada', 'Connection closed')); });
    conn.on('error', function () { setStatus(msg('Error en la connexió amb l’amic', 'Friend connection error')); });
  }

  function createRoom() {
    if (typeof Peer === 'undefined') {
      setStatus(msg('No s’ha carregat el servei online. Revisa Internet i torna a carregar la pàgina.', 'Online service did not load. Check the internet connection and reload the page.'));
      return;
    }
    destroyOldPeer();
    isHost = true;
    setCode('');
    setStatus(msg('Preparant sala…', 'Preparing room…'));
    const code = randomCode();
    peer = new Peer(peerId(code), peerOptions);
    let opened = false;
    peer.on('open', function () {
      opened = true;
      setCode(code);
      setStatus(msg('✅ Sala preparada. Comparteix aquest codi amb el teu amic.', '✅ Room ready. Share this code with your friend.'));
    });
    peer.on('connection', attachConnection);
    peer.on('error', function (err) {
      if (err && err.type === 'unavailable-id' && !opened) {
        setStatus(msg('Aquest codi ja existia. Creant-ne un altre…', 'That code was already used. Creating another…'));
        setTimeout(createRoom, 300);
      } else {
        setStatus(msg('No s’ha pogut crear la sala: ', 'Could not create room: ') + (err.type || err.message || 'error'));
      }
    });
  }

  function joinRoom() {
    if (typeof Peer === 'undefined') {
      setStatus(msg('No s’ha carregat el servei online. Revisa Internet i torna a carregar la pàgina.', 'Online service did not load. Check the internet connection and reload the page.'));
      return;
    }
    const box = byId('codeBox');
    const code = box ? box.value.trim().toUpperCase() : '';
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setStatus(msg('El codi ha de tenir 6 lletres o números.', 'The code must contain 6 letters or numbers.'));
      return;
    }
    destroyOldPeer();
    isHost = false;
    setStatus(msg('Connectant amb la sala…', 'Connecting to room…'));
    peer = new Peer(undefined, peerOptions);
    peer.on('open', function () {
      /* Critical fix: connect only after this peer is registered with PeerServer. */
      const c = peer.connect(peerId(code), { reliable: true, serialization: 'json' });
      attachConnection(c);
    });
    peer.on('error', function (err) {
      if (err && err.type === 'peer-unavailable') {
        setStatus(msg('La sala encara no està disponible. Confirma que qui convida veu “Sala preparada” i torna-ho a provar.', 'The room is not available yet. Make sure the host sees “Room ready”, then try again.'));
      } else {
        setStatus(msg('Error de connexió: ', 'Connection error: ') + (err.type || err.message || 'error'));
      }
    });
  }

  function install() {
    document.documentElement.setAttribute('data-room-fix','v2');
    console.info('Capital Champions room fix v2 loaded');
    const host = byId('hostBtn');
    const join = byId('joinBtn');
    const apply = byId('applyBtn');
    if (!host || !join || !apply) return setTimeout(install, 100);
    host.onclick = createRoom;
    join.onclick = function () {
      isHost = false;
      setCode('');
      setStatus(msg('Escriu el codi de 6 caràcters i prem “Entrar a la sala”.', 'Enter the 6-character code and press “Join room”.'));
    };
    apply.onclick = joinRoom;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
