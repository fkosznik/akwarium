'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const btnAddFish = document.querySelector('button:nth-child(1)');
  const btnClear = document.querySelector('button:nth-child(2)');
  const btnBackground = document.querySelector('button:nth-child(3)');
  const btnDeleteFish = document.querySelector('button:nth-child(4)');
  const btnToggleLight = document.querySelector('button:nth-child(5)');

  const fishList = document.querySelector('div:nth-of-type(4) ul');
  const phEl = document.querySelector('div:nth-of-type(3) ul:nth-of-type(1)');
  const tempEl = document.querySelector('div:nth-of-type(3) ul:nth-of-type(2)');
  const hardEl = document.querySelector('div:nth-of-type(3) ul:nth-of-type(3)');
  const image = document.querySelector('img');

  btnAddFish.addEventListener('click', async () => {
    const res = await fetch('http://localhost:8000/fish');
    const data = await res.json();
    const li = document.createElement('li');
    li.textContent = data.name || 'Nieznana ryba';
    fishList.appendChild(li);
  });

  btnDeleteFish.addEventListener('click', async () => {
    const res = await fetch('http://localhost:8000/fish', { method: 'DELETE' });
    const result = await res.json();
    if (result.success && fishList.children.length > 0) {
      fishList.removeChild(fishList.lastChild);
    }
  });

  btnClear.addEventListener('click', () => {
    fishList.innerHTML = '';
  });

  btnBackground.addEventListener('click', () => {
    const random = Math.floor(Math.random() * 3) + 1;
    image.src = `https://placehold.co/600x400?text=Tło+${random}`;
  });

  btnToggleLight.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  async function loadWaterParams() {
    const res = await fetch('http://localhost:8000/measurements');
    const data = await res.json();
    phEl.textContent = 'PH: ' + (data.ph ?? 'brak');
    tempEl.textContent = 'Temp: ' + (data.temperature ?? 'brak');
    hardEl.textContent = 'Twardość: ' + (data.hardness ?? 'brak');
  }

  loadWaterParams();
});
