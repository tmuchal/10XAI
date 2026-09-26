  // ---------- Uchay reaction cam: full-frame close-ups that freeze the story for a beat ----------
  function buildReactionCam(){
    const scrib = [];
    for (let r = 0; r < 6; r++){
      const y0 = 90 + r*150, xs = r % 2 ? [40, 520] : [1080, 1560];
      let d = `M${xs[0]} ${y0}`;
      for (let x = xs[0]; x <= xs[1]; x += 34) d += ` L${x + 17} ${y0 - 42 - (x*7 % 23)} L${x + 34} ${y0 + 8}`;
      scrib.push(`<path d="${d}" fill="none" stroke="#6DB33F" stroke-width="${10 + r % 3*4}" stroke-linejoin="round" stroke-linecap="round" opacity="${.18 + (r % 3)*.07}"/>`);
    }
    const el0 = document.createElement('div');
    el0.className = 'react';
    el0.style.display = 'none';
    el0.innerHTML = `
      <svg class="rbg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="900" fill="#D6ECF0"/>${scrib.join('')}
      </svg>
      <div class="rface"><svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <filter id="rfuzz" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G"/></filter>
          <radialGradient id="rhood" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#F66558"/><stop offset=".55" stop-color="#E0342C"/><stop offset="1" stop-color="#A81F18"/></radialGradient>
          <radialGradient id="rskin" cx="42%" cy="38%" r="72%"><stop offset="0" stop-color="#86CC52"/><stop offset=".65" stop-color="#62A836"/><stop offset="1" stop-color="#3E7E22"/></radialGradient>
        </defs>
        <g transform="translate(-170,0)">
          <path d="M730 300 C706 230 650 205 612 150" fill="none" stroke="#2A1E1A" stroke-width="34" stroke-linecap="round"/>
          <path d="M730 300 C706 230 650 205 612 150" fill="none" stroke="#E0342C" stroke-width="22" stroke-linecap="round"/>
          <path d="M870 300 C894 230 950 205 988 150" fill="none" stroke="#2A1E1A" stroke-width="34" stroke-linecap="round"/>
          <path d="M870 300 C894 230 950 205 988 150" fill="none" stroke="#E0342C" stroke-width="22" stroke-linecap="round"/>
          <g filter="url(#rfuzz)">
            <text x="800" y="196" text-anchor="middle" font-family="'Gochi Hand', 'Comic Sans MS', cursive" font-size="236" fill="#A81F18" stroke="#A81F18" stroke-width="26" stroke-linejoin="round">Uchay</text>
            <text x="800" y="196" text-anchor="middle" font-family="'Gochi Hand', 'Comic Sans MS', cursive" font-size="236" fill="#EE3B30" stroke="#F4574B" stroke-width="8" stroke-linejoin="round">Uchay</text>
          </g>
          <circle cx="455" cy="590" r="80" fill="url(#rhood)" stroke="#2A1E1A" stroke-width="9"/>
          <circle cx="1145" cy="590" r="80" fill="url(#rhood)" stroke="#2A1E1A" stroke-width="9"/>
          <circle cx="430" cy="560" r="22" fill="#FF8A7E" opacity=".7"/>
          <circle cx="1120" cy="560" r="22" fill="#FF8A7E" opacity=".7"/>
          <ellipse cx="800" cy="630" rx="335" ry="380" fill="url(#rhood)" stroke="#2A1E1A" stroke-width="10"/>
          <path d="M560 420 Q640 300 790 285" fill="none" stroke="#FF8A7E" stroke-width="22" stroke-linecap="round" opacity=".6"/>
          <ellipse cx="800" cy="632" rx="212" ry="262" fill="url(#rskin)" stroke="#2A1E1A" stroke-width="7"/>
          <ellipse cx="740" cy="430" rx="80" ry="34" fill="#9BD86A" opacity=".45"/>
          <ellipse cx="690" cy="700" rx="46" ry="30" fill="#3E7E22" opacity=".28"/>
          <ellipse cx="910" cy="690" rx="40" ry="26" fill="#3E7E22" opacity=".28"/>
          <rect x="693" y="560" width="36" height="96" rx="18" fill="#DDEFC4" opacity=".85" transform="rotate(-6 711 608)"/>
          <rect x="866" y="560" width="36" height="96" rx="18" fill="#DDEFC4" opacity=".85" transform="rotate(6 884 608)"/>
          <g class="rm-shock">
            <ellipse cx="722" cy="522" rx="52" ry="38" fill="#fff" stroke="#2A1E1A" stroke-width="7"/>
            <ellipse cx="878" cy="522" rx="52" ry="38" fill="#fff" stroke="#2A1E1A" stroke-width="7"/>
            <circle cx="702" cy="526" r="25" fill="#7A4A2A"/><circle cx="702" cy="526" r="12" fill="#1A1310"/><circle cx="710" cy="517" r="6" fill="#fff"/>
            <circle cx="858" cy="526" r="25" fill="#7A4A2A"/><circle cx="858" cy="526" r="12" fill="#1A1310"/><circle cx="866" cy="517" r="6" fill="#fff"/>
            <path d="M664 462 Q720 430 776 452" fill="none" stroke="#2A1E1A" stroke-width="12" stroke-linecap="round"/>
            <path d="M824 452 Q880 430 936 462" fill="none" stroke="#2A1E1A" stroke-width="12" stroke-linecap="round"/>
          </g>
          <g class="rm-squint">
            <ellipse cx="722" cy="526" rx="50" ry="16" fill="#fff" stroke="#2A1E1A" stroke-width="7"/>
            <ellipse cx="878" cy="526" rx="50" ry="16" fill="#fff" stroke="#2A1E1A" stroke-width="7"/>
            <circle cx="706" cy="527" r="12" fill="#1A1310"/><circle cx="862" cy="527" r="12" fill="#1A1310"/>
            <path d="M668 494 L776 482" fill="none" stroke="#2A1E1A" stroke-width="12" stroke-linecap="round"/>
            <path d="M824 462 Q880 428 934 450" fill="none" stroke="#2A1E1A" stroke-width="12" stroke-linecap="round"/>
          </g>
          <path d="M784 608 Q800 578 816 608" fill="none" stroke="#3E7E22" stroke-width="7" stroke-linecap="round"/>
          <circle cx="786" cy="620" r="8" fill="#1A1310"/><circle cx="814" cy="620" r="8" fill="#1A1310"/>
          <g class="rmouth">
            <g class="rm-shock">
              <ellipse cx="800" cy="735" rx="74" ry="92" fill="#6E1717" stroke="#2A1E1A" stroke-width="9"/>
              <rect x="762" y="648" width="76" height="24" rx="8" fill="#FFF7EE" stroke="#2A1E1A" stroke-width="3"/>
              <ellipse cx="800" cy="790" rx="50" ry="34" fill="#E3707E"/>
              <path d="M800 768 L800 800" stroke="#B84A58" stroke-width="5" stroke-linecap="round"/>
            </g>
            <g class="rm-squint">
              <ellipse cx="808" cy="728" rx="36" ry="30" fill="#6E1717" stroke="#2A1E1A" stroke-width="8"/>
            </g>
          </g>
        </g>
      </svg></div>
      <div class="rcap"><span class="rko"></span><span class="ren"></span></div>`;
    return el0;
  }
