const API_URL = 'http://localhost:8080/api.php';

// Zwraca Promise z odpowiedzią JSON
function apiFetch(endpoint, opts = {}) {
  opts.headers = opts.headers || {};
  let authToken = localStorage.getItem('token');
  if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
  if (opts.body && typeof opts.body !== 'string') {
    opts.body = JSON.stringify(opts.body);
    opts.headers['Content-Type'] = 'application/json';
  }
  return fetch(API_URL + endpoint, opts).then(async (res) => {
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) {
      let txt = await res.text();
      throw new Error(txt || 'API error');
    }
    if (res.headers.get('content-type')?.includes('application/json'))
      return res.json();
    return res.text();
  });
}

// === LOGIN PAGE ===
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').onsubmit = function (e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    apiFetch('/api/login', {
      method: 'POST',
      body: { username: user, password: pass },
    })
      .then((data) => {
        if (!data.token) throw new Error('Brak tokena!');
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
      })
      .catch((err) => {
        document.getElementById('loginError').innerText =
          'Błędne dane logowania!';
      });
  };
}

// === GALERIA RYB ===
if (document.getElementById('gallery')) {
  apiFetch('/api/gallery')
    .then((fishes) => {
      const gallery = document.getElementById('gallery');
      gallery.innerHTML = '';
      fishes.forEach((fish) => {
        gallery.innerHTML += `
          <div class="fish-card">
            <img src="${fish.img}" alt="${fish.name}" width="70"/><br/>
            <strong>${fish.name}</strong>
            <p>${fish.desc}</p>
            <p><small>Maks. wielkość: ${fish.max_size} cm</small></p>
          </div>
        `;
      });
    })
    .catch(() => {
      document.getElementById('gallery').innerHTML =
        '<div class="error-message">Błąd ładowania galerii!</div>';
    });
}

// === AKWARIUM GŁÓWNE ===
let aquariumState = {};

if (document.getElementById('aquarium')) {
  function loadAquarium() {
    apiFetch('/api/aquarium')
      .then((state) => {
        aquariumState = state;
        renderAquarium();
        renderStats();
      })
      .catch(() => {
        document.getElementById('aquarium').innerHTML =
          '<div class="error-message">Błąd ładowania akwarium!</div>';
      });
  }

  function renderAquarium() {
    const aquarium = document.getElementById('aquarium');
    aquarium.innerHTML = '';
    aquarium.style.filter = aquariumState.light
      ? 'brightness(1)'
      : 'brightness(0.4)';
    if (!aquariumState.is_clean) {
      aquarium.innerHTML =
        '<div class="error-message" style="position:absolute;width:100%;top:45%;">Akwarium jest brudne! Wyczyść je!</div>';
    }
    (aquariumState.fishes || []).forEach((fish, idx) => {
      let left = 40 + 70 * idx;
      let top = 100 + 20 * Math.sin(idx);
      aquarium.innerHTML += `
        <img class="fish" style="left:${left}px;top:${top}px;width:${fish.size}px;" 
          src="${fish.img}" 
          data-id="${fish.id}" 
          alt="${fish.name}" 
          title="${fish.name} (kliknij po statystyki)"/>
      `;
    });
  }

  function renderStats() {
    document.getElementById('phStat').innerText = aquariumState.water.ph;
    document.getElementById('tempStat').innerText =
      aquariumState.water.temp + '°C';
    document.getElementById('hardStat').innerText = aquariumState.water.hard;
  }

  loadAquarium(); // Załaduj dane na start

  // Dodaj rybę
  document.getElementById('addFishBtn').onclick = () => {
    if (!aquariumState.is_clean) {
      alert('Nie możesz dodać ryby do brudnego akwarium!');
      return;
    }
    apiFetch('/api/gallery').then((fishes) => {
      let opts = fishes
        .map((f) => `<option value="${f.id}">${f.name}</option>`)
        .join('');
      document.getElementById('fishModal').innerHTML = `
          <div class="modal-content" style="background:#23214b;padding:2em;border-radius:10px;min-width:240px;">
            <h3>Dodaj rybę</h3>
            <select id="fishType">${opts}</select>
            <input type="number" id="fishSize" placeholder="Wielkość (cm)" min="1" max="35" style="width:90%;margin-top:1em"/>
            <button id="confirmAdd">Dodaj</button>
            <button id="cancelAdd">Anuluj</button>
          </div>
        `;
      document.getElementById('fishModal').classList.add('active');
      document.getElementById('cancelAdd').onclick = () =>
        document.getElementById('fishModal').classList.remove('active');
      document.getElementById('confirmAdd').onclick = () => {
        const fishId = +document.getElementById('fishType').value;
        const size = +document.getElementById('fishSize').value;
        apiFetch('/api/fish', {
          method: 'POST',
          body: { fish_id: fishId, size: size },
        })
          .then(() => {
            document.getElementById('fishModal').classList.remove('active');
            loadAquarium();
          })
          .catch((err) => alert(err.message || 'Błąd dodawania ryby!'));
      };
    });
  };

  // Usuń rybę
  document.getElementById('removeFishBtn').onclick = () => {
    if (!aquariumState.fishes || !aquariumState.fishes.length)
      return alert('Brak ryb do usunięcia!');
    let opts = aquariumState.fishes
      .map((f) => `<option value="${f.id}">${f.name} (${f.size} cm)</option>`)
      .join('');
    document.getElementById('fishModal').innerHTML = `
      <div class="modal-content" style="background:#23214b;padding:2em;border-radius:10px;">
        <h3>Usuń rybę</h3>
        <select id="fishToRemove">${opts}</select>
        <button id="confirmRemove">Usuń</button>
        <button id="cancelRemove">Anuluj</button>
      </div>
    `;
    document.getElementById('fishModal').classList.add('active');
    document.getElementById('cancelRemove').onclick = () =>
      document.getElementById('fishModal').classList.remove('active');
    document.getElementById('confirmRemove').onclick = () => {
      const id = +document.getElementById('fishToRemove').value;
      apiFetch('/api/fish/' + id, { method: 'DELETE' })
        .then(() => {
          document.getElementById('fishModal').classList.remove('active');
          loadAquarium();
        })
        .catch((err) => alert(err.message || 'Błąd usuwania ryby!'));
    };
  };

  // Nakarm rybę (losową)
  document.getElementById('feedFishBtn').onclick = () => {
    apiFetch('/api/fish/feed', { method: 'POST' })
      .then(() => loadAquarium())
      .catch((err) => alert(err.message || 'Błąd karmienia ryby!'));
  };

  // Czyszczenie akwarium
  document.getElementById('cleanBtn').onclick = () => {
    apiFetch('/api/aquarium/clean', { method: 'POST' }).then(() =>
      loadAquarium()
    );
  };

  // Włącz/wyłącz światło
  document.getElementById('lightOnBtn').onclick = () => {
    apiFetch('/api/aquarium/light', {
      method: 'POST',
      body: { state: true },
    }).then(() => loadAquarium());
  };
  document.getElementById('lightOffBtn').onclick = () => {
    apiFetch('/api/aquarium/light', {
      method: 'POST',
      body: { state: false },
    }).then(() => loadAquarium());
  };

  // Klik w rybę – statystyki i edycja
  document.getElementById('aquarium').onclick = (e) => {
    if (!e.target.classList.contains('fish')) return;
    const id = +e.target.dataset.id;
    const fish = (aquariumState.fishes || []).find((f) => f.id === id);
    document.getElementById('fishModal').innerHTML = `
      <div class="modal-content" style="background:#23214b;padding:2em;border-radius:10px;">
        <h3>${fish.name}</h3>
        <img src="${fish.img}" width="60"/>
        <p>Wielkość: <span id="fishSizeStat">${fish.size}</span> cm</p>
        <p>Wiek: ${fish.age || 0} lat</p>
        <p>Szybkość: ${fish.speed || 0} km/h</p>
        <input type="number" id="editFishSize" value="${
          fish.size
        }" min="1" max="40"/>
        <button id="editFishBtn">Zmień wielkość</button>
        <button id="closeFishStat">Zamknij</button>
      </div>
    `;
    document.getElementById('fishModal').classList.add('active');
    document.getElementById('editFishBtn').onclick = () => {
      const newSize = +document.getElementById('editFishSize').value;
      apiFetch('/api/fish/' + fish.id, {
        method: 'PUT',
        body: { size: newSize },
      })
        .then(() => {
          document.getElementById('fishSizeStat').innerText = newSize;
          loadAquarium();
        })
        .catch((err) => alert(err.message || 'Błąd zmiany wielkości!'));
    };
    document.getElementById('closeFishStat').onclick = () =>
      document.getElementById('fishModal').classList.remove('active');
  };
}

// Wyloguj – czyści token!
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').onclick = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  };
}

// Zamknięcie modala po kliknięciu w tło
if (document.getElementById('fishModal')) {
  document.getElementById('fishModal').onclick = (e) => {
    if (e.target === document.getElementById('fishModal')) {
      document.getElementById('fishModal').classList.remove('active');
    }
  };
}
