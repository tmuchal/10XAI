// 운명극장 — 아이돌·배우 육성 팩 "별빛을 키우는 법"
// 망해가는 기획사 '별빛 엔터테인먼트'를 물려받은 대표가 연습생 한 명에게 올인해 4년 안에 별로 만드는 이야기.
// 데이터 계약: games/story-sim/SPEC.md
(function () {
  'use strict';

  // ───────────────────────── helpers ─────────────────────────
  const STARS = ['haeun', 'dojun', 'chaerin'];
  const OTHERS = { haeun: ['dojun', 'chaerin'], dojun: ['haeun', 'chaerin'], chaerin: ['haeun', 'dojun'] };

  // 선택한 스타(S.s.star)에 따라 갈라지는 분기. m 은 {haeun:[…],dojun:[…],chaerin:[…]} 또는 id => […]
  function perStar(m) {
    const get = (id) => (typeof m === 'function' ? m(id) : m[id] || []);
    return {
      if: { s: { star: 'haeun' } }, then: get('haeun'),
      else: [{ if: { s: { star: 'dojun' } }, then: get('dojun'), else: get('chaerin') }],
    };
  }
  // 스타가 같은 대사를 말할 때
  const say = (t, e) => perStar((id) => [{ c: id, t, e }]);
  const sayLines = (arr) => perStar((id) => arr.map(([t, e]) => ({ c: id, t, e })));
  const chatStar = (goal, max) => perStar((id) => [{ chat: id, goal, max: max || 4 }]);
  const showStar = (e, at) => perStar((id) => [{ show: id, e, at: at || 'c' }]);
  const hideStar = () => perStar((id) => [{ hide: id }]);
  const affStar = (n) => perStar((id) => [{ fx: { aff: { [id]: n } } }]);
  const affOthers = (n) => perStar((id) => [{ fx: { aff: { [OTHERS[id][0]]: n, [OTHERS[id][1]]: n } } }]);
  const starAff = (cmp) => ({ any: STARS.map((id) => ({ s: { star: id }, aff: { [id]: cmp } })) });
  const IDOL = { s: { track: 'idol' } };
  const ACTOR = { s: { track: 'actor' } };
  const trackBr = (idol, actor) => ({ if: IDOL, then: idol, else: actor });
  const END = { end: true };

  // ───────────────────────── characters ─────────────────────────
  const chars = {
    haeun: {
      name: '한하은', short: '하은', role: '연습생 · 메인보컬 지망', color: '#ff9fbf',
      look: { sex: 'f', age: 'teen', skin: '#f8dfd0', hair: '#3b2a26', hair2: '#8a5a4a', hairStyle: 'long', bangs: 'straight', eyes: '#5a3b2e', eyeShape: 'round', outfit: 'tracksuit', outfitColor: '#f4a7b9', accent: '#ffffff', acc: ['hairpin'] },
      persona: '19살 연습생. 해바라기처럼 밝고, 누구에게나 먼저 인사하고, 연습실 불을 제일 늦게 끄는 아이. 꿈은 무대 한가운데서 고음을 내지르는 메인보컬이다. 하지만 사람 많은 곳에서 마이크를 잡으면 손이 떨리는 무대 공포증이 있고, 아버지 사업 실패로 생긴 가족 빚을 혼자 갚으려 밤마다 편의점 알바를 한다는 사실을 숨기고 있다. 대표에게는 존댓말을 쓰며 "대표님!" 하고 부르고, 신나면 말끝이 올라가고 "헤헤" 하고 웃는다. 힘든 티를 절대 먼저 내지 않으며, 남 탓이나 욕은 하지 않는다. 대표에게 바라는 건 "포기하지 않을 테니 저를 끝까지 믿어주세요"라는 한 가지.',
      talk: [
        { t: '요즘 연습은 어때?', lines: [{ c: 'haeun', t: '대표님! 오늘 고음 삑사리 세 번밖에 안 났어요. 어제는 다섯 번이었거든요!', e: 'laugh' }, { c: 'haeun', t: '헤헤, 발전이죠? 발전 맞죠?', e: 'smile' }, { c: 'me', t: '응, 확실히 발전이야.' }], fx: { aff: { haeun: 2 }, v: { mental: 1 } } },
        { t: '꿈이 뭐야?', lines: [{ c: 'haeun', t: '메인보컬이요. 무대 한가운데서, 조명 딱 받고, 마지막 후렴에서 고음 뻥!', e: 'smile' }, { c: 'haeun', t: '어릴 때 엄마가 설거지하면서 불러주던 노래가 있거든요. 그 노래를 제가 큰 무대에서 부르는 거예요.', e: 'shy' }, { c: 'haeun', t: '…너무 거창한가요?', e: 'worried' }, { c: 'me', t: '아니. 딱 좋은 크기의 꿈이야.' }], fx: { aff: { haeun: 3 } } },
        { t: '가족 얘기 좀 해줄래?', if: { aff: { haeun: '>=35' } }, lines: [{ c: 'haeun', t: '아… 저희 집이요? 그냥 평범해요, 평범!', e: 'smile' }, { c: 'haeun', t: '…사실 아빠 가게가 망하고 나서 조금 복잡해졌어요. 전화가 자주 와요. 모르는 번호로.', e: 'sad' }, { c: 'haeun', t: '그래도 괜찮아요. 제가 데뷔하면 다 해결될 거예요. 그러니까 꼭 데뷔해야 돼요.', e: 'worried' }], fx: { aff: { haeun: 4 }, flag: 'haeun_debt_hint' } },
        { t: '무대 앞에서 떨려?', lines: [{ c: 'haeun', t: '에이, 제가요? 전혀요!', e: 'laugh' }, { c: 'haeun', t: '…', e: 'worried' }, { c: 'haeun', t: '거짓말이에요. 연습실에선 다 되는데, 사람들 눈이 저를 보면 목이 꽉 막혀요. 숨이 안 쉬어져요.', e: 'sad' }, { c: 'me', t: '떨리는 건 진심이라서 그래. 천천히 같이 연습하자.' }, { c: 'haeun', t: '…네. 대표님이 그렇게 말하니까 조금 덜 떨려요.', e: 'shy' }], fx: { aff: { haeun: 3 }, v: { mental: 2 } } },
        { t: '좋아하는 가수 있어?', lines: [{ c: 'haeun', t: '남궁현 선생님이요! 옛날 노래인데 라이브가 진짜 CD 씹어먹는 수준이에요.', e: 'laugh' }, { c: 'haeun', t: '요즘은 타이탄의 류세라 선배도… 음, 실력은 인정해요. 인정은.', e: 'smirk' }], fx: { aff: { haeun: 2 } } },
        { t: '숙소 생활은 괜찮아?', lines: [{ c: 'haeun', t: '보일러가 가끔 삐지는 거 빼면 완전 좋아요!', e: 'smile' }, { c: 'haeun', t: '어제는 실장님이 떡볶이 사오셨는데, 셋이서 싸우다가 결국 제일 많이 먹은 건 실장님이었어요.', e: 'laugh' }], fx: { aff: { haeun: 2, manager: 1 }, v: { stress: -2 } } },
        { t: '데뷔하면 제일 하고 싶은 거?', if: { noflag: 'debuted' }, lines: [{ c: 'haeun', t: '음방 엔딩 요정이요! 카메라가 딱 들어오면 윙크… 아니다, 너무 오글거리나?', e: 'shy' }, { c: 'haeun', t: '그리고 첫 정산 받으면 엄마한테 내복 사드릴 거예요. 빨간색으로.', e: 'smile' }], fx: { aff: { haeun: 3 } } },
        { t: '팬들 반응 봤어?', if: { flag: 'debuted' }, lines: [{ c: 'haeun', t: '봤어요! 어떤 분이 제 직캠에 "이 언니 웃을 때 세상이 밝아짐"이라고 댓글 달아주셨어요.', e: 'laugh' }, { c: 'haeun', t: '캡처해서 배경화면 했어요. 힘들 때마다 봐요.', e: 'shy' }, { c: 'haeun', t: '{s.fandom} 여러분한테 부끄럽지 않은 사람이 될래요.', e: 'smile' }], fx: { aff: { haeun: 2 }, v: { mental: 2, stress: -3 } } },
        { t: '요즘 힘들어 보여.', if: { v: { stress: '>=55' } }, lines: [{ c: 'haeun', t: '네? 아니에요, 저 쌩쌩해요!', e: 'smile' }, { c: 'me', t: '하은아. 나한텐 괜찮은 척 안 해도 돼.' }, { c: 'haeun', t: '……요즘 거울 보면 제가 웃는 게 웃는 게 아닌 것 같아요.', e: 'cry' }, { c: 'haeun', t: '조금만, 아주 조금만 쉬어도 될까요?', e: 'sad' }], fx: { aff: { haeun: 4 }, v: { stress: -6 } } },
        { t: '연기도 해볼 생각 있어?', lines: [{ c: 'haeun', t: '연기요? 저 표정 관리 진짜 못하는데…', e: 'surprised' }, { c: 'haeun', t: '그래도 노래도 결국 이야기잖아요. 대표님이 해보라면 해볼게요!', e: 'smile' }], fx: { aff: { haeun: 1 }, v: { acting: 1 } } },
      ],
    },
    dojun: {
      name: '강도준', short: '도준', role: '연습생 · 전 육상선수, 댄서', color: '#6fa8ff',
      look: { sex: 'm', age: 'adult', skin: '#e9c4a6', hair: '#1d1a1a', hairStyle: 'short', bangs: 'side', eyes: '#2e2622', eyeShape: 'sharp', outfit: 'tracksuit', outfitColor: '#2d3e5c', accent: '#f2c14e', acc: ['scar'] },
      persona: '21살 연습생. 고교 육상 400m 유망주였지만 무릎 부상으로 트랙을 떠났고, 재활 삼아 시작한 춤으로 이 회사에 들어왔다. 지금 꿈은 배우인데, 카메라 앞에서 자기 인생을 다른 사람 인생으로 덮어쓰고 싶어서다. 말이 짧고 직설적이라 오해를 잘 사지만 약속은 무조건 지키고, 후배가 다치면 제일 먼저 뛰어간다. 몰래 작은 노트에 가사를 쓰는데 누가 보면 귀까지 빨개진다. 대표에게 존댓말을 쓰지만 "…네." "그건 아닌데요." 같은 짧은 문장이 많다. 아버지와는 부상 이후 연락을 끊었다. 빈말, 아부, 우는 소리는 하지 않는다.',
      talk: [
        { t: '다리는 괜찮아?', lines: [{ c: 'dojun', t: '…괜찮습니다. 비 오는 날만 좀 쑤시고요.', e: 'cold' }, { c: 'dojun', t: '신경 써주시는 건 감사한데, 그거 때문에 연습 빼달라는 말은 안 할 겁니다.', e: 'neutral' }, { c: 'me', t: '빼달라는 말은 내가 할게. 너는 아프면 아프다고만 해.' }, { c: 'dojun', t: '……네.', e: 'shy' }], fx: { aff: { dojun: 3 }, v: { stamina: 1 } } },
        { t: '왜 연기가 하고 싶어?', lines: [{ c: 'dojun', t: '트랙에선 기록이 전부였어요. 0.1초 느리면 끝.', e: 'cold' }, { c: 'dojun', t: '연기는 다르더라고요. 느려도 되고, 넘어져도 되고. 넘어지는 게 연기가 되기도 하고.', e: 'neutral' }, { c: 'dojun', t: '…그런 데서 한번 살아보고 싶어요.', e: 'shy' }], fx: { aff: { dojun: 3 }, v: { acting: 1 } } },
        { t: '춤은 어디서 배웠어?', lines: [{ c: 'dojun', t: '재활센터 옆에 브레이킹 크루 연습실이 있었어요. 형들이 그냥 받아줬어요.', e: 'neutral' }, { c: 'dojun', t: '처음엔 다리 때문에 바닥 기술만 했는데, 그게 제 스타일이 됐어요.', e: 'smirk' }], fx: { aff: { dojun: 2 }, v: { dance: 1 } } },
        { t: '그 노트 뭐야?', if: { aff: { dojun: '>=40' } }, lines: [{ c: 'dojun', t: '…아무것도 아닙니다.', e: 'surprised' }, { c: 'me', t: '가사 같던데.' }, { c: 'dojun', t: '………봤어요?', e: 'shy' }, { c: 'dojun', t: '웃지 마세요. 그냥, 말로 못 하는 걸 적어두는 거예요. 누구 보여주려고 쓰는 거 아니고.', e: 'angry' }, { c: 'me', t: '안 웃어. 좋던데. 진짜로.' }, { c: 'dojun', t: '…대표님만 아는 걸로 해요.', e: 'shy' }], fx: { aff: { dojun: 5 }, flag: 'dojun_notebook' } },
        { t: '아버지랑은 연락해?', if: { aff: { dojun: '>=30' } }, lines: [{ c: 'dojun', t: '안 합니다.', e: 'cold' }, { c: 'dojun', t: '아버지한테 저는 400m 뛰는 아들이었어요. 그 아들은 무릎이랑 같이 끝났고요.', e: 'sad' }, { c: 'dojun', t: '…다음에 얘기해요. 오늘은 여기까지.', e: 'neutral' }], fx: { aff: { dojun: 3 } } },
        { t: '숙소에서 주로 뭐 해?', lines: [{ c: 'dojun', t: '스트레칭하고, 폼롤러 하고, 잡니다.', e: 'neutral' }, { c: 'dojun', t: '…가끔 라면 끓이면 다들 제 방으로 모여요. 제가 물 조절 잘하거든요.', e: 'smirk' }], fx: { aff: { dojun: 2 }, v: { stress: -2 } } },
        { t: '팬들한테 한마디 해볼래?', if: { flag: 'debuted' }, lines: [{ c: 'dojun', t: '…한마디요?', e: 'surprised' }, { c: 'dojun', t: '밥 먹고 다니세요. 추운데 줄 서지 말고요. 그리고… 고맙습니다.', e: 'shy' }, { c: 'me', t: '그거 그대로 SNS에 올리자. 반응 폭발할걸.' }, { c: 'dojun', t: '…올리지 마세요.', e: 'angry' }], fx: { aff: { dojun: 2 }, v: { fans: 5 } } },
        { t: '힘들면 말해.', if: { v: { stress: '>=55' } }, lines: [{ c: 'dojun', t: '안 힘듭니다.', e: 'cold' }, { c: 'me', t: '도준아.' }, { c: 'dojun', t: '……잠이 안 와요. 눈 감으면 트랙이 보여요. 결승선이 계속 멀어지는.', e: 'tired' }, { c: 'dojun', t: '하루만 아무 생각 없이 뛰고 싶어요. 한강이라도.', e: 'sad' }], fx: { aff: { dojun: 4 }, v: { stress: -6 } } },
        { t: '류세라 알아?', lines: [{ c: 'dojun', t: '타이탄 에이스요? 같은 댄스학원 다녔어요.', e: 'neutral' }, { c: 'dojun', t: '실력은 진짜예요. 성격은… 진짜로 진짜고요.', e: 'smirk' }], fx: { aff: { dojun: 1 } } },
      ],
    },
    chaerin: {
      name: '윤채린', short: '채린', role: '연습생 · 전 국민 아역배우', color: '#c3a6e8',
      look: { sex: 'f', age: 'adult', skin: '#fbe8de', hair: '#2a1f2d', hair2: '#5b4468', hairStyle: 'bob', bangs: 'side', eyes: '#3c2c3a', eyeShape: 'droopy', outfit: 'coat', outfitColor: '#3a3440', accent: '#c9b8d8', acc: ['mole', 'earrings'] },
      persona: '23살. 아홉 살 때 주말극 <엄마의 바다>로 "국민 딸"이 되었지만, 열네 살에 소속사 매니저의 횡령과 폭언, 무리한 스케줄 끝에 촬영장에서 쓰러진 뒤 업계에서 사라졌다. 사람을 쉽게 믿지 않고 말투가 냉소적이며, 칭찬을 들으면 "그런 말 다들 처음엔 해요"라고 받아친다. 하지만 카메라가 켜지는 순간 눈빛이 바뀌는 천생 배우이고, 화면이 사랑하는 얼굴을 가졌다. 대표에게 처음엔 건조한 존댓말을 쓰다가 믿음이 쌓이면 농담을 섞는다. 과거 매니저 이야기가 나오면 손톱을 뜯는 버릇이 있다. 계약서, 녹음, 사전 동의 없는 스케줄을 극도로 싫어하며 거짓말하는 어른을 절대 용서하지 않는다.',
      talk: [
        { t: '아역 시절 얘기 해줄래?', lines: [{ c: 'chaerin', t: '<엄마의 바다> 보셨어요? 시청률 42%. 제가 우는 장면에서 전국이 울었대요.', e: 'smirk' }, { c: 'chaerin', t: '저는 그때 기억이 별로 없어요. 대본, 조명, 사탕. 그리고 누가 계속 "한 번만 더"라고 했던 거.', e: 'cold' }], fx: { aff: { chaerin: 2 } } },
        { t: '왜 다시 돌아왔어?', lines: [{ c: 'chaerin', t: '돈이요.', e: 'cold' }, { c: 'me', t: '진짜 이유는?' }, { c: 'chaerin', t: '……', e: 'neutral' }, { c: 'chaerin', t: '제가 연기를 좋아했는지 싫어했는지, 그걸 모르고 끝난 게 억울해서요. 이번엔 제가 정하고 싶어요.', e: 'sad' }], fx: { aff: { chaerin: 4 } } },
        { t: '예전 매니저 얘기…', if: { aff: { chaerin: '>=45' } }, lines: [{ c: 'chaerin', t: '그 사람 얘기는 왜요.', e: 'cold' }, { c: 'chaerin', t: '…제 출연료로 차를 샀더라고요. 저는 서른 시간째 깨어 있었고요. 쓰러지니까 "프로답지 못하다"고.', e: 'angry' }, { c: 'chaerin', t: '대표님은 그런 사람 아니라는 거, 알아요. 머리로는요. 몸이 아직 몰라서 그래요.', e: 'sad' }, { c: 'me', t: '몸이 알 때까지 기다릴게.' }, { c: 'chaerin', t: '…그 말, 기억할 거예요.', e: 'shy' }], fx: { aff: { chaerin: 6 }, flag: 'chaerin_opened' } },
        { t: '카메라 앞에 서면 어때?', lines: [{ c: 'chaerin', t: '조용해져요. 머릿속이.', e: 'neutral' }, { c: 'chaerin', t: '웃기죠. 카메라 때문에 망가졌는데, 카메라 앞에서만 숨이 쉬어져요.', e: 'smirk' }], fx: { aff: { chaerin: 2 }, v: { acting: 1 } } },
        { t: '요즘 잠은 잘 자?', lines: [{ c: 'chaerin', t: '네 시간이요. 충분해요.', e: 'tired' }, { c: 'me', t: '안 충분해.' }, { c: 'chaerin', t: '…잔소리하는 어른은 오랜만이네요. 나쁘지 않아요.', e: 'smile' }], fx: { aff: { chaerin: 3 }, v: { stress: -3 } } },
        { t: '좋아하는 영화 있어?', lines: [{ c: 'chaerin', t: '<시>요. 이창동 감독님. 말이 없는데 다 들리는 영화.', e: 'neutral' }, { c: 'chaerin', t: '언젠가 대사 한 줄 없이 사람 울리는 역, 해보고 싶어요.', e: 'smile' }], fx: { aff: { chaerin: 2 }, v: { acting: 1 } } },
        { t: '노래도 해볼래?', lines: [{ c: 'chaerin', t: '저 음치예요.', e: 'cold' }, { c: 'chaerin', t: '…농담이에요. 음치는 아닌데, 노래는 숨을 데가 없잖아요. 연기는 배역 뒤에 숨을 수 있는데.', e: 'worried' }, { c: 'chaerin', t: '대표님이 옆에 있으면 한 소절 정도는요.', e: 'shy' }], fx: { aff: { chaerin: 2 }, v: { vocal: 1 } } },
        { t: '팬 편지 읽어봤어?', if: { flag: 'debuted' }, lines: [{ c: 'chaerin', t: '읽었어요. 전부.', e: 'neutral' }, { c: 'chaerin', t: '어떤 분이 "어릴 때 채린이 보면서 버텼는데, 이번엔 제가 채린 씨 버티는 거 볼게요"래요.', e: 'sad' }, { c: 'chaerin', t: '…반칙이에요 그런 거.', e: 'cry' }], fx: { aff: { chaerin: 3 }, v: { mental: 2 } } },
        { t: '괜찮아?', if: { v: { stress: '>=55' } }, lines: [{ c: 'chaerin', t: '괜찮냐는 질문 제일 싫어해요. 괜찮다고 해야 하잖아요.', e: 'cold' }, { c: 'me', t: '그럼 안 괜찮다고 해도 돼.' }, { c: 'chaerin', t: '……안 괜찮아요. 손이 또 떨려요. 옛날처럼.', e: 'cry' }, { c: 'chaerin', t: '오늘은 그냥 옆에 있어 주세요. 말 안 해도 돼요.', e: 'sad' }], fx: { aff: { chaerin: 5 }, v: { stress: -6 } } },
      ],
    },
    manager: {
      name: '오정만', short: '오 실장', role: '별빛 엔터 매니저 실장', color: '#b5c77a',
      look: { sex: 'm', age: 'adult', skin: '#e2b999', hair: '#2b2b2b', hairStyle: 'messy', bangs: 'none', eyes: '#3a2d24', eyeShape: 'gentle', outfit: 'casual', outfitColor: '#6b7a52', accent: '#d9c7a0', acc: ['glasses'] },
      persona: '46살. 1세대 아이돌 로드매니저 출신으로 별빛 엔터에서만 15년을 버틴 산증인. 전 대표(플레이어의 삼촌)의 오랜 친구이며, 회사가 망해가도 월급 없이 남았다. 밴 운전, 방송국 인맥, 도시락 협상까지 못 하는 게 없다. 말투는 투박한 존댓말에 "대표님, 이건 제가 20년 해봐서 아는데요" 같은 옛날 얘기가 많고, 아재개그를 한다. 속으로는 누구보다 아이들을 아끼며, 아이들을 상품 취급하는 말에 크게 화낸다. 대표가 잘못된 결정을 하면 돌려 말하지 않고 직언한다.',
      talk: [
        { t: '회사 사정은 어때요?', lines: [{ c: 'manager', t: '대표님, 솔직히 말씀드리면 통장은 늘 영하권입니다. 이건 제가 20년 해봐서 아는데요, 기획사는 한 방입니다. 한 방.', e: 'worried' }, { c: 'manager', t: '그 한 방이 올 때까지 버티는 게 우리 일이죠. 하하.', e: 'smile' }], fx: { aff: { manager: 2 } } },
        { t: '삼촌은 어떤 분이었어요?', lines: [{ c: 'manager', t: '고집불통에, 계산 못 하고, 애들 밥은 꼭 좋은 걸로 먹이던 양반이었죠.', e: 'smile' }, { c: 'manager', t: '돈 되는 애보다 노래 좋아하는 애를 뽑았어요. 그래서 망했고요. 그래서 제가 남았고요.', e: 'sad' }], fx: { aff: { manager: 3 } } },
        { t: '실장님은 왜 안 떠났어요?', lines: [{ c: 'manager', t: '떠날 데가 없어서요… 는 농담이고요.', e: 'laugh' }, { c: 'manager', t: '애들이 무대에서 눈 반짝이는 거, 그거 한 번 보면 못 끊습니다. 담배보다 독해요.', e: 'smile' }], fx: { aff: { manager: 3 } } },
        { t: '방송국 인맥 좀 있어요?', lines: [{ c: 'manager', t: '있죠! 음방 FD 김 씨, 예능 작가 박 씨, 그리고… 구내식당 이모님.', e: 'smirk' }, { c: 'manager', t: '마지막 분이 제일 중요합니다. 대기실 정보는 전부 거기서 나와요.', e: 'laugh' }], fx: { aff: { manager: 2 }, v: { variety: 1 } } },
        { t: '아재개그 하나만요.', lines: [{ c: 'manager', t: '아이돌이 제일 싫어하는 과일은?', e: 'smirk' }, { c: 'manager', t: '…"탈퇴"! 아니 "탈"이 들어가서… 아, 설명하면 안 되는데.', e: 'laugh' }, { c: 'me', t: '실장님, 그건 좀.' }], fx: { aff: { manager: 2 }, v: { stress: -3 } } },
      ],
    },
    rivalceo: {
      name: '마태성', short: '마 대표', role: '타이탄 엔터테인먼트 대표', color: '#c9a063',
      look: { sex: 'm', age: 'adult', skin: '#f0d0b8', hair: '#141414', hair2: '#555555', hairStyle: 'slick', bangs: 'none', eyes: '#1f1f1f', eyeShape: 'sharp', outfit: 'suit', outfitColor: '#1c1c24', accent: '#b08d57', acc: [] },
      persona: '52살. 업계 3대 기획사 중 하나인 타이탄 엔터테인먼트의 대표. 숫자와 데이터로 스타를 만든다고 믿는 냉정한 사업가로, 작은 회사의 가능성 있는 원석을 거액으로 빼내가는 걸로 유명하다. 항상 여유로운 존댓말에 "시장은 감정을 기억하지 않습니다"라는 말버릇이 있다. 겉으로는 정중하지만 상대의 약점(빚, 불안, 돈)을 정확히 찌른다. 플레이어를 "작은 회사 사장님"이라고 부르며 은근히 무시한다. 불법은 저지르지 않지만, 합법의 가장자리는 전부 쓴다. 한때 자신도 작은 회사에서 시작했다는 과거를 숨기고 있다.',
      talk: [
        { t: '왜 우리 애한테 관심 있으세요?', lines: [{ c: 'rivalceo', t: '관심이요? 투자 검토입니다, 사장님.', e: 'smirk' }, { c: 'rivalceo', t: '원석은 좋은 세공사를 만나야 보석이 되죠. 시장은 감정을 기억하지 않습니다.', e: 'cold' }], fx: { aff: { rivalceo: 1 } } },
        { t: '타이탄은 어떤 회사죠?', lines: [{ c: 'rivalceo', t: '데이터로 움직이는 회사입니다. 팬덤 반응, 음원 추이, 광고 단가. 전부 그래프로 보여요.', e: 'neutral' }, { c: 'rivalceo', t: '사장님 회사는 뭘로 움직입니까? 의리? 추억?', e: 'smirk' }], fx: {} },
        { t: '대표님도 처음부터 컸어요?', lines: [{ c: 'rivalceo', t: '…', e: 'cold' }, { c: 'rivalceo', t: '지하 연습실 하나로 시작했습니다. 제가 키운 첫 가수가 계약금 두 배에 떠났죠.', e: 'neutral' }, { c: 'rivalceo', t: '그날 배웠습니다. 의리는 계약서에 안 적힌다는 걸.', e: 'cold' }], fx: { aff: { rivalceo: 3 } } },
        { t: '세라는 행복해요?', lines: [{ c: 'rivalceo', t: '행복이요? 1위 트로피가 몇 개인지 아십니까.', e: 'cold' }, { c: 'rivalceo', t: '…행복은 계약 조항이 아닙니다, 사장님.', e: 'neutral' }], fx: {} },
        { t: '저희는 안 팝니다.', lines: [{ c: 'rivalceo', t: '다들 처음엔 그렇게 말씀하시죠.', e: 'smirk' }, { c: 'rivalceo', t: '명함은 두고 가겠습니다. 월말 통장 잔고를 보시면 생각이 바뀌실 겁니다.', e: 'cold' }], fx: { aff: { rivalceo: -1 } } },
      ],
    },
    pd: {
      name: '백서진', short: '백 감독', role: '스타 PD 출신 드라마·영화 감독', color: '#e0a96d',
      look: { sex: 'f', age: 'adult', skin: '#f3d6c2', hair: '#4a3226', hairStyle: 'ponytail', bangs: 'parted', eyes: '#4a3226', eyeShape: 'sharp', outfit: 'coat', outfitColor: '#8a6e52', accent: '#2c2c2c', acc: ['glasses', 'headphones'] },
      persona: '41살. 시청률 30%를 넘긴 예능과 드라마를 연달아 만든 스타 PD였다가, 지금은 영화 감독으로 칸을 노리는 연출가. 캐스팅에 인기보다 "눈"을 보며, 신인을 주연으로 써서 대박을 낸 이력이 여럿이다. 말이 빠르고 반말과 존댓말을 섞으며 "다시. 이번엔 거짓말하지 말고." 가 입버릇이다. 현장에서 배우를 몰아붙이지만 절대 인격을 건드리지 않고, 스태프 밥을 먼저 챙긴다. 과거 아역이었던 윤채린의 촬영장에 조연출로 있었고, 그때 막지 못한 일을 후회하고 있다.',
      talk: [
        { t: '어떤 배우를 좋아하세요?', lines: [{ c: 'pd', t: '거짓말 못 하는 배우. 카메라는 거짓말을 제일 먼저 알아채거든.', e: 'neutral' }, { c: 'pd', t: '잘생긴 애들은 많아. 눈이 살아 있는 애는 드물지.', e: 'smirk' }], fx: { aff: { pd: 2 } } },
        { t: '예능은 왜 그만두셨어요?', lines: [{ c: 'pd', t: '웃기는 게 지겨워서? 아니. 웃기려고 누굴 깎아내리는 게 지겨워서.', e: 'cold' }, { c: 'pd', t: '영화는 그래도 사람을 끝까지 보잖아요.', e: 'neutral' }], fx: { aff: { pd: 2 } } },
        { t: '다음 작품은 뭐예요?', lines: [{ c: 'pd', t: '비밀. 근데 힌트는 줄게. 대사가 거의 없어.', e: 'smirk' }, { c: 'pd', t: '그러니까 눈으로 연기할 줄 아는 애가 필요해. 알지?', e: 'neutral' }], fx: { aff: { pd: 2 }, v: { acting: 1 } } },
        { t: '현장에서 제일 싫은 건요?', lines: [{ c: 'pd', t: '배우 밥 굶기는 거. 그리고 "한 번만 더"를 스무 번 하는 거.', e: 'angry' }, { c: 'pd', t: '…옛날에 그런 현장에 있었어. 막지 못했고. 그거 아직 빚이야.', e: 'sad' }], fx: { aff: { pd: 3 } } },
        { t: '저희 애 어때요?', lines: [{ c: 'pd', t: '아직 몰라. 근데 몰라서 궁금해. 그게 좋은 신호야.', e: 'smile' }], fx: { aff: { pd: 2 } } },
      ],
    },
    mentor: {
      name: '남궁현', short: '남궁 선생', role: '데뷔 32년차 가수 겸 배우', color: '#a78bd4',
      look: { sex: 'm', age: 'elder', skin: '#e5c0a0', hair: '#b8b8b8', hair2: '#8a8a8a', hairStyle: 'slick', bangs: 'none', eyes: '#3a2e28', eyeShape: 'gentle', outfit: 'suit', outfitColor: '#4b3b5c', accent: '#d4af37', acc: ['beard'] },
      persona: '58살. 90년대 가요대상 3연속 대상을 받고 이후 배우로도 청룡 남우주연상을 받은 전설. 지금은 소극장 콘서트와 연극을 하며 느긋하게 산다. 플레이어의 삼촌과 오랜 술친구였고, 그 인연으로 별빛의 아이들을 가끔 들여다본다. 느린 반말에 "얘야" "허허" 하며 말하고, 비유와 옛날 이야기를 즐긴다. 성공보다 오래 가는 법을 가르치며, 후배에게 "무대는 너를 사랑하지 않는다. 네가 무대를 사랑하는 거다"라고 말한다. 남의 험담은 절대 하지 않는다. 한때 술과 번아웃으로 5년을 잃은 적이 있다.',
      talk: [
        { t: '오래 가는 비결이 뭐예요?', lines: [{ c: 'mentor', t: '허허, 비결은… 잘 자고, 잘 먹고, 잘 지는 거지.', e: 'smile' }, { c: 'mentor', t: '얘야, 이기는 건 누구나 해. 지고도 다음 무대에 서는 놈이 오래 간다.', e: 'neutral' }], fx: { aff: { mentor: 2 }, v: { mental: 1 } } },
        { t: '삼촌이랑은 어떻게 친해지셨어요?', lines: [{ c: 'mentor', t: '내가 제일 바닥일 때 소주 한 병 들고 찾아온 유일한 놈이었지.', e: 'sad' }, { c: 'mentor', t: '그 녀석 조카가 이 회사를 한다니. 허허, 세상 참.', e: 'smile' }], fx: { aff: { mentor: 3 } } },
        { t: '대상 받던 날 기분은요?', lines: [{ c: 'mentor', t: '솔직히? 무서웠다. 이제 내려갈 일만 남았구나 싶어서.', e: 'worried' }, { c: 'mentor', t: '트로피는 무겁단다. 들고 있으면 팔이 아파. 적당히 내려놓을 줄도 알아야 해.', e: 'neutral' }], fx: { aff: { mentor: 2 }, v: { mental: 1 } } },
        { t: '무대가 무서운 적 있으세요?', lines: [{ c: 'mentor', t: '지금도 무섭지. 32년째.', e: 'smile' }, { c: 'mentor', t: '무서운 게 정상이야. 무섭지 않은 날이 오면, 그땐 그만둘 때다.', e: 'neutral' }], fx: { aff: { mentor: 2 }, v: { stress: -3 } } },
        { t: '5년 공백은 왜…', if: { aff: { mentor: '>=30' } }, lines: [{ c: 'mentor', t: '…술이었지. 박수 소리가 끊기니까 그걸로 귀를 채웠어.', e: 'sad' }, { c: 'mentor', t: '그러니 네 아이 곁에 박수 말고 다른 소리를 채워줘라. 밥 먹었냐는 소리 같은 거.', e: 'neutral' }], fx: { aff: { mentor: 4 } } },
      ],
    },
    reporter: {
      name: '황보람', short: '황 기자', role: '연예 매체 <스냅> 기자', color: '#e06a5a',
      look: { sex: 'f', age: 'adult', skin: '#f1cdb4', hair: '#7a4a2a', hairStyle: 'bob', bangs: 'straight', eyes: '#5a3a22', eyeShape: 'sharp', outfit: 'casual', outfitColor: '#c0392b', accent: '#2b2b2b', acc: ['glasses', 'earrings'] },
      persona: '34살. 매년 1월 1일 열애설을 터뜨리는 연예 매체 <스냅>의 간판 기자. 망원렌즈와 제보 네트워크로 "황보람이 쓰면 사실"이라는 평판을 얻었다. 명랑한 존댓말로 "대표님~ 커피 한잔해요~" 하며 다가오지만 대화는 전부 녹음한다. 특종이 먹고 사는 일이라고 선을 긋지만, 미성년자와 정신건강 문제는 쓰지 않는다는 자기만의 원칙이 있다. 거래를 좋아해서, 다른 기사를 주면 하나를 덮어주는 식의 제안을 한다. 속으로는 한때 가수 지망생이었다.',
      talk: [
        { t: '요즘 뭐 취재하세요?', lines: [{ c: 'reporter', t: '대표님~ 그걸 말하면 특종이 아니죠.', e: 'smirk' }, { c: 'reporter', t: '힌트만 드리면, 요즘 한강 산책하는 커플이 좀 많네요? 호호.', e: 'laugh' }], fx: { aff: { reporter: 1 } } },
        { t: '기자님 원칙이 뭐예요?', lines: [{ c: 'reporter', t: '미성년자랑 정신과 기록은 안 써요. 그건 기사가 아니라 흉기라서.', e: 'cold' }, { c: 'reporter', t: '나머지는요? 공인이잖아요. 다 써요.', e: 'smile' }], fx: { aff: { reporter: 2 } } },
        { t: '왜 기자가 되셨어요?', if: { aff: { reporter: '>=20' } }, lines: [{ c: 'reporter', t: '…저도 연습생이었어요. 3년. 데뷔 조 직전에 잘렸죠.', e: 'sad' }, { c: 'reporter', t: '그 뒤로 무대 뒤가 궁금해서요. 누가 웃고 누가 우는지.', e: 'neutral' }], fx: { aff: { reporter: 3 } } },
        { t: '저희 기사 좋게 써주세요.', lines: [{ c: 'reporter', t: '좋은 기사는 좋은 일이 있어야 나오죠~', e: 'smile' }, { c: 'reporter', t: '1위 하면 제일 먼저 연락 주세요. 단독 인터뷰로 잡아드릴게요.', e: 'smirk' }], fx: { aff: { reporter: 2 } } },
        { t: '녹음 중이죠?', lines: [{ c: 'reporter', t: '…어머, 들켰네.', e: 'surprised' }, { c: 'reporter', t: '대표님 생각보다 눈치 빠르시다. 호감도 상승~', e: 'laugh' }], fx: { aff: { reporter: 2 } } },
      ],
    },
    rival: {
      name: '류세라', short: '세라', role: '타이탄 엔터 에이스', color: '#b77ad6',
      look: { sex: 'f', age: 'teen', skin: '#fbe3d6', hair: '#e8c9a0', hair2: '#f5e6c8', hairStyle: 'wavy', bangs: 'side', eyes: '#6b4a8a', eyeShape: 'sharp', outfit: 'stage', outfitColor: '#9b59b6', accent: '#f1c40f', acc: ['choker', 'earrings'] },
      persona: '20살. 12살에 타이탄에 들어가 8년 동안 한 번도 월말평가 1등을 놓친 적 없는 "인간 메트로놈". 춤, 노래, 표정까지 계산된 완벽주의자로, 별빛의 아이들을 "동네 학원 애들"이라 부르며 도발한다. 반말과 냉소가 기본이고 "그 정도로 데뷔해? 부럽다, 기준이 낮아서."가 말버릇. 사실은 마태성의 혹독한 관리 아래 식사량까지 통제당하며, 무대가 즐거웠던 기억이 가물가물하다. 별빛 아이들이 서로 웃으며 연습하는 모습을 몰래 부러워한다. 자기 약점을 들키는 걸 죽기보다 싫어한다.',
      talk: [
        { t: '연습 잘 돼?', lines: [{ c: 'rival', t: '당연하지. 난 안 되는 날이 없어. 너네처럼.', e: 'smirk' }, { c: 'rival', t: '…그런 날이 있으면 안 되는 거라서.', e: 'cold' }], fx: { aff: { rival: 1 } } },
        { t: '밥은 먹었어?', lines: [{ c: 'rival', t: '…뭐? 왜 그런 걸 물어.', e: 'surprised' }, { c: 'rival', t: '방울토마토 다섯 개. 됐지? 신경 끄시지.', e: 'cold' }], fx: { aff: { rival: 3 } } },
        { t: '우리 애 어떻게 봐?', lines: [{ c: 'rival', t: '솔직히? 거칠어. 근데… 무대에서 웃잖아. 진짜로.', e: 'neutral' }, { c: 'rival', t: '그게 뭐 대단하다는 건 아니고.', e: 'shy' }], fx: { aff: { rival: 2 } } },
        { t: '마 대표는 어때?', lines: [{ c: 'rival', t: '대표님은 틀린 말을 안 해. 그래서 무서워.', e: 'worried' }, { c: 'rival', t: '이 얘기 한 거 비밀이다.', e: 'cold' }], fx: { aff: { rival: 2 } } },
        { t: '무대 즐거워?', lines: [{ c: 'rival', t: '즐거움은 프로한테 필요 없는 감정이야.', e: 'cold' }, { c: 'rival', t: '……예전엔 즐거웠던 것 같기도 하고.', e: 'sad' }], fx: { aff: { rival: 3 } } },
      ],
    },
    fanmaster: {
      name: '문다솜', short: '새벽달', role: '홈마 · 팬사이트 <새벽달> 운영자', color: '#7fb3d9',
      look: { sex: 'f', age: 'adult', skin: '#f6dac8', hair: '#2f2420', hairStyle: 'ponytail', bangs: 'straight', eyes: '#3a2a20', eyeShape: 'round', outfit: 'casual', outfitColor: '#7fa8c9', accent: '#ffffff', acc: ['hat'] },
      persona: '27살 회사원이자, 대포 카메라 하나로 수많은 직캠을 떡상시킨 전설의 홈마 "새벽달". 팬덤의 여론을 움직이는 인물이라 기획사들도 조심스러워한다. 밝은 존댓말에 "우리 애기" "이건 역사다" 같은 팬 용어를 쓰며, 스타의 사생활은 절대 찍지 않는다는 철칙이 있다. 회사가 팬을 무시하거나 스타를 혹사하면 가장 먼저 성명문을 쓴다. 본업에 치이면서도 새벽까지 사진을 보정하며, 좋아하는 사람이 행복한 게 자기 행복이라고 믿는다. 오래전 좋아했던 아이돌이 회사 문제로 사라진 상처가 있다.',
      talk: [
        { t: '어떻게 홈마가 됐어요?', lines: [{ c: 'fanmaster', t: '예전에 좋아하던 애가 있었는데요, 회사가 망하면서 그냥 사라졌어요. 사진 한 장 제대로 안 남기고.', e: 'sad' }, { c: 'fanmaster', t: '그래서 찍어요. 누군가 반짝였던 순간은 남아야 하니까.', e: 'smile' }], fx: { aff: { fanmaster: 3 } } },
        { t: '팬들 분위기 어때요?', lines: [{ c: 'fanmaster', t: '대표님, 팬들은 다 알아요. 애가 행복한지, 억지로 웃는지.', e: 'neutral' }, { c: 'fanmaster', t: '요즘은… 괜찮아 보여요! 그러니까 계속 잘 부탁드려요.', e: 'smile' }], fx: { aff: { fanmaster: 2 } } },
        { t: '제일 좋아하는 사진은요?', lines: [{ c: 'fanmaster', t: '무대 끝나고 인사하다가 울컥한 순간이요. 그건 진짜 역사예요, 역사.', e: 'laugh' }], fx: { aff: { fanmaster: 2 }, v: { fans: 3 } } },
        { t: '회사한테 바라는 거 있어요?', lines: [{ c: 'fanmaster', t: '공지 좀 제때 올려주세요! 그리고 스케줄 끝나면 밥 먹이기. 이 두 개면 돼요.', e: 'smirk' }], fx: { aff: { fanmaster: 2 } } },
        { t: '사생 문제는 어때요?', lines: [{ c: 'fanmaster', t: '숙소 앞에 오는 사람들이요? 그건 팬 아니에요. 저희가 먼저 신고해요.', e: 'angry' }, { c: 'fanmaster', t: '사생활은 애 거예요. 우리는 무대만 가지면 돼요.', e: 'cold' }], fx: { aff: { fanmaster: 3 } } },
      ],
    },
  };

  // ───────────────────────── scenes ─────────────────────────
  const scenes = {};

  const pickStar = (id, name, o1, o2, stats, lines) => ({
    t: `${name}에게 건다`,
    fx: { set: { star: id, starName: name, o1Name: o1, o2Name: o2 }, setv: stats, aff: { [id]: 10 } },
    then: lines,
  });

  scenes.prologue = [
    { bg: 'black' },
    { title: '프롤로그', sub: '유산으로 받은 것' },
    '삼촌의 장례식이 끝난 다음 날, 변호사가 서류 한 장을 내밀었다.',
    '"고인께서 남기신 유산은… 주식회사 별빛 엔터테인먼트, 전부입니다."',
    { bg: 'street_seoul' },
    '서울 마포구, 오래된 건물 지하 1층. 반쯤 떨어진 간판에 별 하나가 깜빡이고 있었다.',
    '통장 잔고 3천만 원. 밀린 월세 두 달. 그리고 연습생 셋.',
    { bg: 'agency_office' },
    { show: 'manager', e: 'worried', at: 'c' },
    { c: 'manager', t: '오셨습니까, 대표님. 오정만입니다. 이 회사 실장이고… 사실상 마지막 직원이죠.', e: 'neutral' },
    { c: 'manager', t: '돌려 말씀 안 드리겠습니다. 이대로 가면 1년 안에 문 닫습니다.', e: 'worried' },
    { c: 'me', t: '연습생이 셋 있다고 들었어요.' },
    { c: 'manager', t: '예. 셋 다 좋은 애들입니다. 근데 셋 다 키울 돈이 없어요.', e: 'sad' },
    { c: 'manager', t: '이건 제가 20년 해봐서 아는데요, 작은 회사는 한 명한테 올인해야 삽니다. 한 명이 뜨면 회사가 살고, 회사가 살면 나머지 애들도 기회가 생겨요.', e: 'neutral' },
    { c: 'manager', t: '일단 애들부터 보시죠. 연습실에 있습니다.', e: 'smile' },
    { hide: 'manager' },
    { bg: 'practice_room' },
    '거울 한쪽 벽에 금이 간 연습실. 낡은 스피커에서 음악이 흘러나오고 있었다.',
    { show: 'haeun', e: 'surprised', at: 'l' },
    { c: 'haeun', t: '앗! 혹시 새 대표님이세요? 안녕하세요! 연습생 한하은입니다! 열아홉 살이고요, 메인보컬 지망이에요!', e: 'laugh' },
    { c: 'haeun', t: '노래 들려드릴까요? 지금 바로 할 수 있어요!', e: 'smile' },
    '하은이 숨을 들이켰다. 첫 소절은 맑고 곧았다. 그런데 눈이 마주치자, 목소리가 가늘게 떨렸다.',
    { c: 'haeun', t: '…헤헤, 아침이라 목이 덜 풀렸나 봐요.', e: 'shy' },
    { show: 'dojun', e: 'neutral', at: 'r' },
    { c: 'dojun', t: '강도준입니다. 스물하나. 춤 춥니다. 목표는 배우고요.', e: 'neutral' },
    { c: 'me', t: '춤추는데 배우?' },
    { c: 'dojun', t: '…둘 다 몸으로 하는 거니까요. 이상합니까?', e: 'cold' },
    '도준이 음악에 맞춰 짧게 몸을 풀었다. 바닥을 쓸 듯 낮게 돌다가 튀어 오르는 움직임에 군더더기가 없었다. 무릎에 감긴 테이핑이 눈에 띄었다.',
    { hide: 'haeun' },
    { hide: 'dojun' },
    '구석 의자에 앉아 휴대폰을 보던 사람이 천천히 고개를 들었다.',
    { show: 'chaerin', e: 'cold', at: 'c' },
    { c: 'chaerin', t: '윤채린이요. 얼굴은 아시죠? 다들 아시던데.', e: 'cold' },
    '알고 있었다. 모를 수가 없었다. 10여 년 전 전국을 울린 "국민 딸". 그리고 어느 날 갑자기 사라진 아이.',
    { c: 'chaerin', t: '미리 말해두면, 저 대표님 안 믿어요. 대표라는 사람 믿었다가 한 번 크게 망했거든요.', e: 'smirk' },
    { c: 'chaerin', t: '그래도 계약서는 꼼꼼히 읽는 편이니까, 거짓말만 안 하시면 돼요.', e: 'neutral' },
    { hide: 'chaerin' },
    { bg: 'agency_office' },
    { show: 'manager', e: 'neutral', at: 'c' },
    { c: 'manager', t: '어떻습니까. 하은이는 목소리가 있고, 도준이는 몸이 있고, 채린이는 얼굴이 있습니다.', e: 'neutral' },
    { c: 'manager', t: '누굴 고르시든 나머지 둘은 제가 최대한 챙기겠습니다. 대표님은 한 명한테 모든 걸 거세요.', e: 'worried' },
    { hide: 'manager' },
    {
      prompt: '누구에게 회사의 운명을 걸까?',
      choice: [
        pickStar('haeun', '하은', '도준', '채린',
          { vocal: 32, dance: 22, acting: 10, variety: 25, visual: 28, mental: 14, stamina: 30, heart: 40, stress: 10 },
          [{ show: 'haeun', e: 'surprised', at: 'c' }, { c: 'haeun', t: '저, 저요? 진짜요? 저 삑사리 나는 거 보셨잖아요!', e: 'surprised' }, { c: 'me', t: '떨리는데도 끝까지 부르는 거 봤어.' }, { c: 'haeun', t: '……대표님. 저 절대, 절대 후회 안 하게 해드릴게요!', e: 'cry' }]),
        pickStar('dojun', '도준', '하은', '채린',
          { vocal: 12, dance: 38, acting: 16, variety: 14, visual: 30, mental: 32, stamina: 48, heart: 24, stress: 10 },
          [{ show: 'dojun', e: 'surprised', at: 'c' }, { c: 'dojun', t: '…저요? 다리 테이핑 봤잖아요.', e: 'surprised' }, { c: 'me', t: '테이핑 감고도 안 멈추는 거 봤어.' }, { c: 'dojun', t: '……후회하지 마십쇼. 저도 안 할 테니까.', e: 'smirk' }]),
        pickStar('chaerin', '채린', '하은', '도준',
          { vocal: 14, dance: 12, acting: 40, variety: 10, visual: 44, mental: 10, stamina: 22, heart: 22, stress: 10 },
          [{ show: 'chaerin', e: 'surprised', at: 'c' }, { c: 'chaerin', t: '…저요? 제 과거 기사 검색은 해보셨어요?', e: 'cold' }, { c: 'me', t: '과거 말고, 지금 너를 보고 골랐어.' }, { c: 'chaerin', t: '다들 처음엔 그렇게 말해요.', e: 'smirk' }, { c: 'chaerin', t: '…그래도, 이번엔 끝까지 들어볼게요.', e: 'neutral' }]),
      ],
    },
    { c: 'manager', t: '결정하셨군요. 좋습니다. 그럼 두 번째 질문입니다.', e: 'neutral' },
    { c: 'manager', t: '아이돌로 키울 겁니까, 배우로 키울 겁니까? 돈이 없으니 길도 하나만 팝니다.', e: 'worried' },
    perStar({
      haeun: [{ c: 'haeun', t: '저는… 무대에서 노래하고 싶어요. 그래도 대표님이 정하시는 길이면 따라갈게요!', e: 'smile' }],
      dojun: [{ c: 'dojun', t: '저는 연기요. 근데 춤으로 먼저 알려지는 것도… 전략이면 받아들이겠습니다.', e: 'neutral' }],
      chaerin: [{ c: 'chaerin', t: '저는 카메라 앞이 편해요. 무대는… 솔직히 무서워요. 그래도 대표님이 고르세요. 이번엔 믿어볼 테니까.', e: 'worried' }],
    }),
    {
      prompt: '어떤 길로 키울까?',
      choice: [
        { t: '아이돌 — 무대와 음원으로 정상에', fx: { set: { track: 'idol', trackName: '아이돌' } }, then: [{ c: 'manager', t: '아이돌이라. 음방, 팬사인회, 1위. 체력 싸움입니다. 각오하시죠.', e: 'smirk' }] },
        { t: '배우 — 카메라 앞에서 오래 가는 길', fx: { set: { track: 'actor', trackName: '배우' } }, then: [{ c: 'manager', t: '배우라. 오디션, 단역, 조연, 주연. 느리지만 오래 갑니다.', e: 'smile' }] },
      ],
    },
    { c: 'manager', t: '팬덤 이름은 나중에 팬들이 생기면 정하시고요. 일단 가칭은 "별조각"으로 하죠. 삼촌이 늘 그러셨거든요. 팬은 별의 조각이라고.', e: 'smile' },
    { fx: { set: { fandom: '별조각' } } },
    { bg: 'rooftop_night' },
    '그날 밤, 옥상. 서울의 불빛이 발아래 깔려 있었다.',
    showStar('neutral', 'c'),
    say('대표님. 진짜 저로 괜찮아요?', 'worried'),
    { c: 'me', t: '4년. 딱 4년만 같이 달려보자. 그 안에 너를 별로 만들게.' },
    chatStar('선택받은 첫날 밤. 스타가 대표에게 무엇을 기대하고 무엇이 두려운지 이야기한다.', 4),
    perStar({
      haeun: [{ c: 'haeun', t: '4년 뒤에, 여기 옥상에서 1위 트로피 들고 사진 찍어요. 약속!', e: 'laugh' }],
      dojun: [{ c: 'dojun', t: '4년. 400m보다는 길네요. 이번엔 완주하겠습니다.', e: 'smirk' }],
      chaerin: [{ c: 'chaerin', t: '4년이요. 계약서엔 그렇게 적어두세요. 말은 날아가니까.', e: 'smile' }],
    }),
    hideStar(),
    { t: '이렇게 별빛 엔터테인먼트의 마지막 4년이 시작되었다.' },
    { toast: '매달 세 번의 스케줄을 짜서 {s.starName}을 키우세요.' },
    END,
  ];

  // ───────────────────────── 1년차: 연습생 ─────────────────────────
  scenes.ev_first_month = [
    { bg: 'agency_office' },
    { title: '1년차', sub: '연습생의 겨울' },
    { show: 'manager', e: 'neutral', at: 'l' },
    { c: 'manager', t: '대표님, 첫 달입니다. 스케줄은 한 달에 세 칸. 레슨비는 공짜가 아니고요.', e: 'neutral' },
    { c: 'manager', t: '그리고 사무실 운영비가 매달 나갑니다. 전기세, 연습실 월세, 제 컵라면값.', e: 'smirk' },
    { c: 'manager', t: '돈이 마이너스로 크게 가면… 그땐 진짜 끝입니다. 그것만 기억해 주세요.', e: 'worried' },
    showStar('smile', 'r'),
    trackBr(
      [{ c: 'manager', t: '아이돌은 보컬, 댄스, 비주얼이 기본이고 예능감이 있으면 뜹니다. 체력은 음방 한 번이면 바닥나고요.', e: 'neutral' }],
      [{ c: 'manager', t: '배우는 연기가 기본이고 비주얼, 멘탈이 버팀목입니다. 오디션에서 열 번 떨어지는 건 일상이에요.', e: 'neutral' }]
    ),
    { c: 'manager', t: '그리고 스트레스. 애들은 기계가 아닙니다. 쉬게 하는 것도 대표님 일이에요.', e: 'cold' },
    perStar({
      haeun: [{ c: 'haeun', t: '저는 안 쉬어도 돼요! 연습 체질이에요!', e: 'laugh' }, { c: 'manager', t: '저런 애가 제일 먼저 쓰러집니다.', e: 'worried' }],
      dojun: [{ c: 'dojun', t: '스케줄 빡빡하게 짜주세요. 쉬는 거 못 합니다.', e: 'neutral' }, { c: 'manager', t: '저런 애가 무릎 나갑니다.', e: 'worried' }],
      chaerin: [{ c: 'chaerin', t: '스케줄은 미리 알려주세요. 갑자기 바뀌는 거, 싫어요.', e: 'cold' }, { c: 'manager', t: '예, 예. 공지는 사흘 전에. 약속합니다.', e: 'smile' }],
    }),
    { c: 'me', t: '좋아. 첫 달부터 제대로 가보자.' },
    { hide: 'all' },
    END,
  ];

  const REACT = {
    haeun: [{ c: 'haeun', t: '축하해! 진짜 진짜 축하해!', e: 'laugh' }, { c: 'haeun', t: '…헤헤. 나도 더 열심히 할게. 진짜로. 언젠가 나도 저기 설 거니까.', e: 'sad' }],
    dojun: [{ c: 'dojun', t: '…축하한다.', e: 'neutral' }, { c: 'dojun', t: '대신 대충 하면 가만 안 둔다. 너한테 걸린 거, 우리 셋 거니까.', e: 'cold' }],
    chaerin: [{ c: 'chaerin', t: '축하해요. 뭐, 저는 원래 기대 안 했어요.', e: 'smirk' }, { c: 'chaerin', t: '…기대 안 했다니까요. 그러니까 그런 눈으로 보지 마세요.', e: 'sad' }],
  };
  scenes.ev_others_intro = [
    { bg: 'practice_room' },
    '연습실 공기가 조금 달라졌다. 셋이 함께 쓰던 거울 앞에, 이제 한 명의 이름이 먼저 불린다.',
    perStar((id) => [{ show: OTHERS[id][0], e: 'neutral', at: 'l' }, { show: OTHERS[id][1], e: 'neutral', at: 'r' }]),
    perStar((id) => [...REACT[OTHERS[id][0]], ...REACT[OTHERS[id][1]]]),
    { t: '{s.starName}은 아무 말도 못 하고 고개만 숙이고 있었다.' },
    {
      prompt: '{s.o1Name}과 {s.o2Name}에게 뭐라고 할까?',
      choice: [
        { t: '"회사가 살면, 너희 차례도 반드시 온다."', fx: { v: { heart: 3 } }, then: [affOthers(5), { t: '두 사람의 표정이 조금 풀렸다. 약속은 무겁다. 지켜야 한다.' }, { fx: { flag: 'promised_others' } }] },
        { t: '"냉정하게 말할게. 지금은 한 명밖에 못 키워."', fx: { v: { mental: 3 } }, then: [affOthers(-3), { t: '차가운 말이었지만, 거짓말은 아니었다. 두 사람은 말없이 연습을 이어갔다.' }] },
        { t: '"셋이 같이 연습하는 건 변함없어."', fx: { v: { stress: -3 } }, then: [affOthers(3), { t: '그날 저녁, 셋은 오랜만에 같이 떡볶이를 먹었다.' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  const mkEval = (n, thr, extra) => [
    { bg: 'practice_room' },
    { title: `월말 평가 ${n}차`, sub: '거울은 거짓말을 안 한다' },
    { show: 'manager', e: 'neutral', at: 'l' },
    showStar('worried', 'r'),
    { c: 'manager', t: `자, ${n}차 월말 평가입니다. 외부 트레이너 세 분 모셨습니다.`, e: 'neutral' },
    trackBr(
      [
        { t: '{s.starName}이 음악에 맞춰 춤을 추고, 이어서 라이브로 노래를 불렀다.' },
        {
          if: { v: { vocal: `>=${thr}`, dance: `>=${thr}` } },
          then: [{ t: '트레이너들이 서로 눈을 마주쳤다. "…작은 회사에서 이게 나와?"' }, { c: 'manager', t: 'A입니다, 대표님! A!', e: 'laugh' }, { fx: { v: { mental: 3, stress: -5 }, flag: `eval${n}_a` } }, affStar(3)],
          else: [{
            if: { any: [{ v: { vocal: `>=${thr}` } }, { v: { dance: `>=${thr}` } }] },
            then: [{ t: '한쪽은 빛났고, 한쪽은 아쉬웠다. "강점은 확실해요. 약점이 더 확실하고요."' }, { c: 'manager', t: 'B입니다. 나쁘지 않아요. 좋지도 않고요.', e: 'neutral' }, { fx: { v: { stress: 2 } } }],
            else: [{ t: '노래는 흔들렸고 동작은 박자를 놓쳤다. 트레이너 한 명이 펜을 내려놓았다.' }, { c: 'manager', t: 'C입니다… 대표님, 레슨 비중을 늘려야겠습니다.', e: 'worried' }, { fx: { v: { stress: 8 } } }],
          }],
        },
      ],
      [
        { t: '{s.starName}이 즉흥 상황극과 독백 연기를 이어갔다.' },
        {
          if: { v: { acting: `>=${thr}`, visual: `>=${thr - 5}` } },
          then: [{ t: '독백이 끝나자 연습실이 조용해졌다. 트레이너 한 명이 조용히 박수를 쳤다.' }, { c: 'manager', t: 'A입니다! 방금 저 눈빛, 봤습니까?', e: 'laugh' }, { fx: { v: { mental: 3, stress: -5 }, flag: `eval${n}_a` } }, affStar(3)],
          else: [{
            if: { v: { acting: `>=${thr - 8}` } },
            then: [{ t: '"감정은 있는데 전달이 안 돼요. 카메라는 더 가까이 옵니다."' }, { c: 'manager', t: 'B. 가능성은 보인다는 평입니다.', e: 'neutral' }, { fx: { v: { stress: 2 } } }],
            else: [{ t: '대사가 두 번 끊겼다. "…연기하는 게 보여요. 연기가 보이면 안 되죠."' }, { c: 'manager', t: 'C입니다. 연기 수업, 더 넣읍시다.', e: 'worried' }, { fx: { v: { stress: 8 } } }],
          }],
        },
      ]
    ),
    ...(extra || []),
    {
      prompt: '평가가 끝난 {s.starName}에게',
      choice: [
        { t: '"잘했어. 오늘은 맛있는 거 먹자."', fx: { v: { stress: -6, money: -20 } }, then: [affStar(3), say('…네! 고기요, 고기!', 'smile')] },
        { t: '"부족한 부분, 같이 보자." (모니터링)', fx: { v: { mental: 2, acting: 1, dance: 1, vocal: 1, stress: 3 } }, then: [say('…네. 한 번만 더 볼게요.', 'neutral')] },
        { t: '말없이 어깨를 두드린다', then: [affStar(2), say('……감사합니다.', 'shy')] },
      ],
    },
    { hide: 'all' },
    END,
  ];
  scenes.ev_eval1 = mkEval(1, 30);
  scenes.ev_eval2 = mkEval(2, 42, [{ show: 'rival', e: 'smirk', at: 'c' }, { c: 'rival', t: '연습실 문 열려 있길래. 흠, 동네 학원 월말평가는 이런 분위기구나.', e: 'smirk' }, { c: 'rival', t: '그 정도로 데뷔해? 부럽다, 기준이 낮아서.', e: 'cold' }, { hide: 'rival' }, { fx: { v: { mental: 2, stress: 3 } } }]);
  scenes.ev_eval3 = mkEval(3, 52, [{ show: 'mentor', e: 'smile', at: 'c' }, { c: 'mentor', t: '허허, 지나가다 들렀다. 얘야, 틀려도 끝까지 하는 게 좋구나.', e: 'smile' }, { c: 'mentor', t: '무대는 너를 사랑하지 않는다. 네가 무대를 사랑하는 거다. 그걸 잊지 마라.', e: 'neutral' }, { hide: 'mentor' }, { fx: { v: { mental: 3 }, aff: { mentor: 5 } } }]);

  // ── 스타별 과거사 1 ──
  scenes.ev_backstory1 = [
    perStar({
      haeun: [
        { bg: 'street_seoul' },
        '새벽 두 시. 회식을 마치고 돌아가던 길, 불 켜진 편의점 안에 낯익은 뒷모습이 보였다.',
        { show: 'haeun', e: 'surprised', at: 'c' },
        { c: 'haeun', t: '어, 어서오세… 대, 대표님?!', e: 'surprised' },
        { c: 'me', t: '하은아. 지금 몇 시인 줄 알아?' },
        { c: 'haeun', t: '…알바요. 주 4일. 연습 끝나고 와요. 괜찮아요, 저 체력 좋아요!', e: 'smile' },
        { c: 'haeun', t: '……집에 보내야 할 돈이 있어서요. 이건 제가 해야 하는 거예요.', e: 'sad' },
        {
          prompt: '하은에게',
          choice: [
            { t: '"알바 그만둬. 그 돈, 회사가 보탤게."', fx: { v: { money: -300, stress: -8, stamina: 5 }, aff: { haeun: 8 }, flag: 'haeun_supported' }, then: [{ c: 'haeun', t: '안 돼요, 회사도 어렵잖아요! …대표님, 왜 이렇게까지 해요.', e: 'cry' }, { c: 'me', t: '네가 우리 회사 전 재산이니까.' }] },
            { t: '"네 선택 존중할게. 대신 주 2일로 줄이자."', fx: { v: { stress: -3, heart: 2 }, aff: { haeun: 4 } }, then: [{ c: 'haeun', t: '…네. 약속할게요. 연습은 절대 안 빠질게요.', e: 'smile' }] },
            { t: '"몸 망가지면 데뷔도 없어. 당장 그만둬."', fx: { v: { stamina: 5, stress: 4 }, aff: { haeun: -3 } }, then: [{ c: 'haeun', t: '……알겠어요. 대표님은 모르세요. 모르는 게 나아요.', e: 'sad' }] },
          ],
        },
        { fx: { flag: 'bs1' } },
      ],
      dojun: [
        { bg: 'dorm' },
        '숙소 거실 소파 틈에 작은 검은 노트가 끼어 있었다. 펼쳐진 페이지에 삐뚤빼뚤한 글씨.',
        '"결승선은 멀어지는데 / 신발 끈은 자꾸 풀려 / 그래도 나는 뛰는 척을 해 / 멈추면 아무도 날 안 볼까 봐"',
        { show: 'dojun', e: 'surprised', at: 'c' },
        { c: 'dojun', t: '……그거, 제 겁니다.', e: 'shy' },
        { c: 'me', t: '가사야? 네가 쓴 거?' },
        { c: 'dojun', t: '아무것도 아니에요. 그냥 낙서.', e: 'angry' },
        {
          prompt: '도준에게',
          choice: [
            { t: '"낙서가 아니라 가사야. 계속 써. 언젠가 곡이 될 거야."', fx: { v: { songs: 1, mental: 2 }, aff: { dojun: 7 }, flag: 'dojun_notebook' }, then: [{ c: 'dojun', t: '…곡이요? 제 말이 누군가한테 들린다고요?', e: 'surprised' }, { c: 'dojun', t: '……생각해 보겠습니다.', e: 'shy' }] },
            { t: '노트를 조용히 돌려주고 비밀로 한다', fx: { aff: { dojun: 5 }, flag: 'dojun_notebook' }, then: [{ c: 'dojun', t: '…고맙습니다. 못 본 걸로 해 주셔서.', e: 'neutral' }] },
            { t: '"배우 하려면 이런 감성도 필요해. 연기에 써먹자."', fx: { v: { acting: 3 }, aff: { dojun: 2 } }, then: [{ c: 'dojun', t: '연기에요? …그것도 괜찮네요.', e: 'smirk' }] },
          ],
        },
        { fx: { flag: 'bs1' } },
      ],
      chaerin: [
        { bg: 'dorm' },
        '숙소 거실 TV에서 케이블 재방송이 흘러나왔다. <엄마의 바다> 17회. 아홉 살 채린이 바닷가에서 울고 있었다.',
        { show: 'chaerin', e: 'cold', at: 'c' },
        '리모컨이 날아가 벽에 부딪혔다. 채린의 손이 떨리고 있었다.',
        { c: 'chaerin', t: '…저 장면, 서른두 번 찍었어요. 진짜 눈물 나올 때까지.', e: 'cold' },
        { c: 'chaerin', t: '마지막엔 매니저가 제 팔을 꼬집었어요. 그게 진짜 눈물이었어요. 전국이 그걸 보고 울었고요.', e: 'cry' },
        {
          prompt: '채린에게',
          choice: [
            { t: '"이제 그런 현장은 없어. 내가 막을게."', fx: { v: { mental: 3, stress: -5 }, aff: { chaerin: 7 } }, then: [{ c: 'chaerin', t: '……말로는 다 막죠.', e: 'sad' }, { c: 'chaerin', t: '그래도, 오늘은 그 말 믿고 잘게요.', e: 'shy' }] },
            { t: '말없이 TV를 끄고 옆에 앉는다', fx: { v: { stress: -8 }, aff: { chaerin: 6 } }, then: [{ t: '한참 뒤, 채린이 작게 말했다. "…고마워요. 아무것도 안 물어봐줘서."' }] },
            { t: '"그 매니저, 법적으로 따져볼 수 있을지도 몰라."', fx: { v: { mental: 1 }, aff: { chaerin: 2 }, flag: 'chaerin_legal_hint' }, then: [{ c: 'chaerin', t: '…10년 전 일이에요. 그리고 저는 아직 그 이름도 못 불러요.', e: 'cold' }] },
          ],
        },
        { fx: { flag: 'bs1' } },
      ],
    }),
    { hide: 'all' },
    END,
  ];

  scenes.ev_meet_sera = [
    { bg: 'audition_hall' },
    '방송사 합동 연습실 대여일. 별빛 엔터에 배정된 시간은 새벽 6시였다. 그리고 문을 열자, 먼저 와 있는 사람이 있었다.',
    { show: 'rival', e: 'cold', at: 'r' },
    '거울 앞에서 같은 8카운트를 백 번째 반복하는 소녀. 타이탄 엔터의 에이스, 류세라.',
    showStar('surprised', 'l'),
    { c: 'rival', t: '…아, 별빛? 아직 안 망했어?', e: 'smirk' },
    { c: 'rival', t: '연습실 시간 바꿔줄까? 우리 대표님이 여기 통째로 잡아놨거든.', e: 'cold' },
    perStar({
      haeun: [{ c: 'haeun', t: '괜찮아요! 저희 시간 저희가 쓸게요. 세라 선배 연습하는 거 옆에서 보고 배우면 좋죠!', e: 'smile' }, { c: 'rival', t: '…너 뭐야. 기분 나쁘게 밝네.', e: 'surprised' }],
      dojun: [{ c: 'dojun', t: '류세라. 학원 때랑 똑같네. 8카운트 백 번.', e: 'smirk' }, { c: 'rival', t: '강도준? 다리 나갔다며. 춤은 무슨.', e: 'cold' }, { c: 'dojun', t: '나갔다가 돌아왔어. 너처럼 한 번도 안 넘어져본 애는 모르겠지만.', e: 'cold' }],
      chaerin: [{ c: 'rival', t: '어? 너… 윤채린? <엄마의 바다>?', e: 'surprised' }, { c: 'chaerin', t: '다들 그 얘기부터 하네요.', e: 'cold' }, { c: 'rival', t: '…나 그거 보고 연예인 하고 싶었는데. 망가진 거 보니까 좀 깬다.', e: 'smirk' }, { c: 'chaerin', t: '응, 깨. 깨야 네가 오래 가.', e: 'smirk' }],
    }),
    { c: 'rival', t: '어쨌든. 방송에서 보면 인사 정도는 해줄게. 볼 일이 있다면.', e: 'cold' },
    { hide: 'rival' },
    {
      prompt: '세라가 나간 뒤',
      choice: [
        { t: '"저런 애를 이겨야 해. 오늘 두 배로 연습하자."', fx: { v: { dance: 2, vocal: 2, acting: 1, stress: 6 }, flag: 'rival_fire' }, then: [say('…네. 이 악물고요.', 'angry')] },
        { t: '"저 애, 방울토마토만 먹는대. 비교하지 마."', fx: { v: { mental: 3, stress: -3 }, aff: { rival: 2 } }, then: [say('…저 선배도 힘들겠네요.', 'worried')] },
      ],
    },
    { fx: { flag: 'met_sera' } },
    { hide: 'all' },
    END,
  ];

  // ── 연습생 갈등 (선택받지 못한 두 사람) ──
  const PAIR_FIGHT = {
    'dojun|chaerin': [
      { c: 'dojun', t: '또 지각이냐. 넌 연습을 취미로 하냐?', e: 'angry' },
      { c: 'chaerin', t: '세 시간 잤어. 너처럼 머리 비우고 뛰기만 하면 되는 거 아니거든.', e: 'cold' },
      { c: 'dojun', t: '뭐? 그 잘난 아역 시절 얘기 또 하려고?', e: 'angry' },
      { c: 'chaerin', t: '……그 얘기, 네 입에서 나오니까 역겹다.', e: 'cold' },
    ],
    'haeun|chaerin': [
      { c: 'haeun', t: '채린 언니, 오늘 보컬 연습 같이 하기로 했잖아요… 한 시간 기다렸어요.', e: 'sad' },
      { c: 'chaerin', t: '까먹었어. 그리고 너는 왜 매번 괜찮은 척해? 짜증 나게.', e: 'cold' },
      { c: 'haeun', t: '…괜찮은 척이라도 해야 버티니까요! 언니처럼 다 싫은 척하는 것보단 나아요!', e: 'angry' },
      { c: 'chaerin', t: '…….', e: 'surprised' },
    ],
    'haeun|dojun': [
      { c: 'dojun', t: '하은아, 거기 박자 또 밀렸다. 몇 번째냐.', e: 'cold' },
      { c: 'haeun', t: '알아요! 안다고요! 오빠는 말을 꼭 그렇게 해야 돼요?', e: 'angry' },
      { c: 'dojun', t: '돌려 말하면 알아듣냐? 무대에선 아무도 안 봐줘.', e: 'cold' },
      { c: 'haeun', t: '……오빠는 다 잘하니까 모르죠. 못하는 사람 마음.', e: 'cry' },
    ],
  };
  scenes.ev_trainee_conflict = [
    { bg: 'practice_room', fx: 'shake' },
    '연습실에서 고성이 터져 나왔다. 문을 열자, {s.o1Name}과 {s.o2Name}이 서로를 노려보고 있었다.',
    perStar((id) => [{ show: OTHERS[id][0], e: 'angry', at: 'l' }, { show: OTHERS[id][1], e: 'cold', at: 'r' }, ...PAIR_FIGHT[OTHERS[id].join('|')]]),
    { t: '{s.starName}이 어쩔 줄 몰라 대표를 바라봤다.' },
    {
      prompt: '어떻게 할까?',
      choice: [
        { t: '둘을 옥상으로 불러 끝까지 이야기하게 한다', fx: { v: { heart: 3, stress: -2 }, flag: 'others_bond' }, then: [{ bg: 'rooftop_night' }, { t: '한 시간 뒤, 옥상 문이 열렸다. 둘은 눈이 빨갰지만, 같은 캔커피를 나눠 들고 있었다.' }, affOthers(6)] },
        { t: '"{s.starName} 데뷔 준비 중이야. 분위기 흐리지 마."', fx: { v: { stress: 4 }, flag: 'others_rift' }, then: [{ t: '연습실이 조용해졌다. 너무 조용해졌다.' }, affOthers(-6)] },
        { t: '{s.starName}에게 중재를 맡긴다', fx: { v: { heart: 4, mental: 2, stress: 3 }, flag: 'others_bond' }, then: [say('저기… 우리 셋이 같이 버틴 거잖아요. 싸우지 마요.', 'worried'), { t: '셋은 한참 말이 없다가, 누가 먼저랄 것도 없이 웃음을 터뜨렸다.' }, affOthers(3), affStar(3)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  // ── 서바이벌 프로그램 ──
  scenes.ev_surv_offer = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'surprised', at: 'l' },
    { c: 'manager', t: '대표님! 대박입니다! 서바이벌 프로그램에서 연락이 왔어요!', e: 'laugh' },
    trackBr(
      [{ c: 'manager', t: '<데뷔 전쟁: 별의 조건>. 100명의 연습생 중 톱 7이 데뷔하는 프로그램입니다. 타이탄의 류세라도 나온답니다.', e: 'neutral' }],
      [{ c: 'manager', t: '<액터스 룸>. 신인 배우 40명이 매주 연기 미션으로 경쟁하는 프로그램입니다. 심사위원에 백서진 감독도 있어요.', e: 'neutral' }]
    ),
    { c: 'manager', t: '떨어지면 "탈락자"라는 꼬리표가 붙습니다. 대신 한 번 뜨면… 인생이 바뀌죠.', e: 'worried' },
    showStar('worried', 'r'),
    perStar({
      haeun: [{ c: 'haeun', t: '방송… 카메라 수십 대 앞에서요? …할 수 있어요. 해야죠. 해볼게요.', e: 'worried' }],
      dojun: [{ c: 'dojun', t: '경쟁이면 자신 있습니다. 순위 매기는 건 익숙하니까.', e: 'smirk' }],
      chaerin: [{ c: 'chaerin', t: '편집으로 사람 망가뜨리는 거, 제가 제일 잘 알아요. …그래도 대표님이 나가라면 나갈게요.', e: 'cold' }],
    }),
    {
      prompt: '서바이벌에 나갈까?',
      choice: [
        { t: '나간다 — 지금 필요한 건 인지도다', fx: { v: { stress: 8 }, flag: 'survival' }, then: [{ c: 'manager', t: '좋습니다! 첫 녹화는 다음 달입니다. 준비하시죠!', e: 'laugh' }] },
        { t: '안 나간다 — 조급하게 소모하지 않는다', fx: { v: { stress: -5, mental: 2 }, flag: 'no_survival' }, then: [affStar(3), { c: 'manager', t: '…대표님 뜻이 그러시다면. 천천히 가는 것도 길이죠.', e: 'neutral' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  const survPass = (fame, fans, flag) => [{ fx: { v: { fame, fans }, flag } }, affStar(3)];
  const survFail = [{ fx: { v: { fame: 3, fans: 25, stress: 10 }, flag: 'surv_out' } }];
  scenes.ev_surv_r1 = [
    { bg: 'audition_hall', fx: 'flash' },
    { title: '서바이벌 1라운드', sub: '포지션 평가' },
    '카메라 서른두 대. 방청석 조명. 그리고 {s.starName}의 이름이 적힌 명찰.',
    showStar('worried', 'c'),
    perStar({
      haeun: [{ if: { v: { mental: '<30' } }, then: [{ t: '대기석에서 하은의 손끝이 하얗게 질려 있었다. 숨을 쉬는 소리가 들릴 정도로 가빴다.' }, { c: 'haeun', t: '대표님… 숨이, 안 쉬어져요.', e: 'cry' }, { c: 'me', t: '나만 봐. 관객 말고 나. 연습실이라고 생각해.' }, { c: 'haeun', t: '……네.', e: 'worried' }, { fx: { v: { mental: 3 } } }], else: [{ c: 'haeun', t: '떨려요. 근데 이번엔 도망 안 가요.', e: 'smile' }] }],
      dojun: [{ c: 'dojun', t: '스타트 라인 같네요. 좋습니다.', e: 'smirk' }],
      chaerin: [{ c: 'chaerin', t: '카메라 앞은 편해요. 문제는 편집이죠.', e: 'cold' }],
    }),
    trackBr(
      [{
        prompt: '어떤 포지션으로 지원할까?',
        choice: [
          { t: '보컬 포지션', then: [{ if: { v: { vocal: '>=40' } }, then: [{ t: '첫 고음이 스튜디오를 갈랐다. 심사위원석에서 "와" 하는 소리가 새어 나왔다.' }, ...survPass(6, 45, 'surv_r1')], else: [{ t: '후렴의 고음에서 음이 흔들렸다. 심사위원이 고개를 저었다.' }, ...survFail] }] },
          { t: '댄스 포지션', then: [{ if: { v: { dance: '>=40' } }, then: [{ t: '킬링 파트에서 카메라가 {s.starName}을 따라 돌았다. 이 직캠, 뜬다.' }, ...survPass(6, 50, 'surv_r1')], else: [{ t: '동선이 꼬였다. 옆 연습생과 어깨가 부딪혔다.' }, ...survFail] }] },
          { t: '비주얼 센터', then: [{ if: { v: { visual: '>=45' } }, then: [{ t: '엔딩 포즈. 카메라가 클로즈업하는 순간, 방청석이 술렁였다.' }, ...survPass(7, 40, 'surv_r1')], else: [{ t: '센터에 섰지만 존재감이 약했다. "센터는 얼굴만으로 서는 자리가 아니에요."' }, ...survFail] }] },
        ],
      }],
      [{
        prompt: '어떤 연기 미션을 고를까?',
        choice: [
          { t: '감정 연기 — 오열 독백', then: [{ if: { v: { acting: '>=40' } }, then: [{ t: '대사 없이 눈물 한 줄. 심사위원 백서진이 펜을 내려놓았다.' }, ...survPass(6, 40, 'surv_r1')], else: [{ t: '울음이 과했다. "우는 척이 보여요. 다시… 아니, 시간이 없네요."' }, ...survFail] }] },
          { t: '코미디 연기', then: [{ if: { v: { variety: '>=32', acting: '>=28' } }, then: [{ t: '스튜디오가 웃음바다가 됐다. 편집자들이 벌써 자막을 고민하는 얼굴이었다.' }, ...survPass(7, 45, 'surv_r1')], else: [{ t: '정적. 웃음 대신 기침 소리만 들렸다.' }, ...survFail] }] },
          { t: '액션 연기', then: [{ if: { v: { stamina: '>=45', acting: '>=25' } }, then: [{ t: '대역 없이 소화한 액션. 스태프들이 먼저 박수를 쳤다.' }, ...survPass(6, 40, 'surv_r1')], else: [{ t: '합이 어긋나 넘어졌다. 다행히 다치진 않았지만, 점수는 다쳤다.' }, ...survFail] }] },
        ],
      }]
    ),
    { if: { flag: 'surv_r1' }, then: [{ toast: '1라운드 통과!' }, say('…됐다. 됐어요, 대표님!', 'laugh')], else: [{ toast: '1라운드 탈락' }, say('……죄송해요.', 'cry')] },
    { hide: 'all' },
    END,
  ];

  scenes.ev_surv_r2 = [
    { bg: 'audition_hall' },
    { title: '서바이벌 2라운드', sub: '콘셉트 평가' },
    '2라운드 상대 팀 센터는, 역시 류세라였다.',
    { show: 'rival', e: 'smirk', at: 'r' },
    { c: 'rival', t: '아직 안 떨어졌네? 운이 좋다. 여기서 끝나겠지만.', e: 'smirk' },
    showStar('neutral', 'l'),
    '무대 30분 전. {s.starName}이 대기실 구석에서 대표를 불렀다.',
    chatStar('서바이벌 2라운드 직전, 라이벌 류세라 팀과의 대결을 앞두고 긴장한 스타를 대표가 다독인다.', 3),
    { hide: 'rival' },
    { bg: 'stage_concert', fx: 'flash' },
    {
      if: { v: { mental: '>=35' }, any: [{ v: { visual: '>=45' } }, { v: { dance: '>=48' } }, { v: { acting: '>=48' } }] },
      then: [{ t: '조명이 켜지고, {s.starName}은 흔들리지 않았다. 마지막 엔딩 컷, 모니터 속 얼굴이 믿을 수 없을 만큼 선명했다.' }, { t: '결과 발표. 표 차이는 단 11표. {s.starName} 팀의 승리였다.' }, { show: 'rival', e: 'surprised', at: 'r' }, { c: 'rival', t: '……말도 안 돼.', e: 'surprised' }, { hide: 'rival' }, ...survPass(9, 70, 'surv_r2'), { fx: { aff: { rival: 3 } } }],
      else: [{ t: '무대는 나쁘지 않았다. 하지만 세라 팀의 무대는 완벽했다. 방출 순위 호명에서, {s.starName}의 이름이 불렸다.' }, ...survFail],
    },
    { if: { flag: 'surv_r2' }, then: [say('대표님, 저 이겼어요! 세라 선배를!', 'laugh')], else: [say('…여기까지인가 봐요.', 'sad')] },
    { hide: 'all' },
    END,
  ];

  scenes.ev_surv_final = [
    { bg: 'stage_concert', fx: 'flash' },
    { title: '서바이벌 파이널', sub: '생방송 문자투표' },
    '생방송. 문자투표 마감 10분 전. 실시간 순위가 전광판에 흘렀다.',
    { show: 'manager', e: 'worried', at: 'l' },
    { c: 'manager', t: '팬덤 규모가 그대로 표로 갑니다. 기도하세요, 대표님.', e: 'worried' },
    { hide: 'manager' },
    showStar('worried', 'c'),
    {
      if: { v: { fans: '>=170', fame: '>=24' } },
      then: [
        { t: '"최종 1위는…" MC가 뜸을 들였다. 류세라의 얼굴이 굳었다.' },
        { t: '"별빛 엔터테인먼트, {s.starName}!"', },
        { bg: 'stage_concert', fx: 'flash' },
        say('……저요? 제가요?', 'cry'),
        { t: '꽃가루가 쏟아졌다. 방청석에서 누군가 "별조각!" 하고 외쳤다. 처음 들어보는, {s.starName}만을 위한 함성이었다.' },
        { fx: { v: { fame: 16, fans: 160 }, flag: ['surv_win', 'surv_top'] } }, affStar(6),
      ],
      else: [{
        if: { v: { fans: '>=100' } },
        then: [{ t: '최종 3위. 1위는 류세라였다. 하지만 {s.starName}의 이름 뒤엔 "역대급 성장캐"라는 수식어가 붙었다.' }, { fx: { v: { fame: 10, fans: 90 }, flag: 'surv_top' } }, affStar(3)],
        else: [{ t: '최종 7위. 데뷔 조에는 들었지만, 스포트라이트는 류세라의 것이었다.' }, { fx: { v: { fame: 6, fans: 45 } } }],
      }],
    },
    { bg: 'rooftop_night' },
    say('대표님. 끝났어요. 진짜로.', 'tired'),
    { c: 'me', t: '끝난 게 아니라 이제 시작이야.' },
    { fx: { v: { stress: 5 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_surv_after = [
    { bg: 'han_river' },
    '탈락 방송이 나간 밤. 한강 둔치 벤치.',
    showStar('sad', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '방송에서 제가 우는 장면만 나왔어요. "울보 연습생"이래요.', e: 'cry' }, { c: 'haeun', t: '근데 이상하죠. 댓글에 "이 친구 노래 한 번만 더 듣고 싶다"는 것도 있었어요.', e: 'sad' }],
      dojun: [{ c: 'dojun', t: '편집 봤어요. 제가 싸가지 없는 애로 나오더라고요.', e: 'cold' }, { c: 'dojun', t: '…틀린 말은 아니라서 할 말이 없네요.', e: 'sad' }],
      chaerin: [{ c: 'chaerin', t: '"몰락한 아역의 씁쓸한 퇴장." 기사 제목 봤어요. 예상했어요.', e: 'cold' }, { c: 'chaerin', t: '…예상했는데도 아프네요.', e: 'cry' }],
    }),
    chatStar('서바이벌에서 탈락한 밤, 한강에서 스타를 위로하고 다음을 약속한다.', 4),
    { t: '다음 날, 회사 SNS에 짧은 영상이 올라왔다. 탈락 직후, 대기실에서 혼자 남아 연습하는 {s.starName}의 뒷모습.' },
    { t: '조회수가 조금씩, 그러나 멈추지 않고 올라갔다.' },
    { fx: { v: { fans: 40, mental: 4, stress: -8 } } },
    affStar(5),
    { hide: 'all' },
    END,
  ];

  // ── 스타별 과거사 2 ──
  scenes.ev_backstory2 = [
    perStar({
      haeun: [
        { bg: 'practice_room' },
        '연습 중 하은의 휴대폰이 계속 울렸다. 발신자 표시 없음. 다섯 번, 여섯 번.',
        { show: 'haeun', e: 'worried', at: 'c' },
        { c: 'haeun', t: '…잠깐만요.', e: 'worried' },
        '복도에서 들려오는 목소리. "다음 달까지 꼭 넣을게요. 엄마한테는 연락하지 마세요. 제발요."',
        { c: 'me', t: '하은아. 얼마야?' },
        { c: 'haeun', t: '……1억 2천이요. 아빠 가게 빚. 아빠는 연락이 안 되고, 엄마는 식당 일 하시고.', e: 'cry' },
        { c: 'haeun', t: '데뷔하면 갚을 수 있을 거라고 생각했어요. 그래서 웃었어요. 웃어야 뽑아줄 테니까.', e: 'cry' },
        {
          prompt: '하은에게',
          choice: [
            { t: '"혼자 짊어지지 마. 변호사부터 알아보자."', fx: { v: { money: -200, mental: 5 }, aff: { haeun: 8 }, flag: 'haeun_lawyer' }, then: [{ c: 'haeun', t: '…그런 방법이 있어요? 저는 그냥 갚아야 하는 줄만…', e: 'surprised' }] },
            { t: '"네가 웃는 거, 가짜 아니었어. 난 알아."', fx: { v: { mental: 3, stress: -8 }, aff: { haeun: 6 } }, then: [{ c: 'haeun', t: '……대표님 앞에서는 안 웃어도 돼요?', e: 'cry' }, { c: 'me', t: '응. 울어도 돼.' }] },
          ],
        },
        { fx: { flag: 'bs2' } },
      ],
      dojun: [
        { bg: 'practice_room' },
        '연습실 문 앞에 트레이닝복 차림의 중년 남자가 서 있었다. 목에 호루라기 자국이 남은 듯한 사람.',
        { show: 'dojun', e: 'cold', at: 'r' },
        { c: 'dojun', t: '……아버지.', e: 'cold' },
        '"여기서 뭐 하냐. 춤? 광대짓?" 남자가 무릎의 테이핑을 노려봤다. "그 다리로 트랙도 못 서는 놈이."',
        { c: 'dojun', t: '가세요. 여기 제 자리예요.', e: 'angry' },
        '남자는 돌아섰다. 그런데 문을 닫기 직전, 아주 작게 말했다. "…무릎은. 안 아프냐."',
        { t: '문이 닫히고, 도준은 한참을 그 자리에 서 있었다.' },
        {
          prompt: '도준에게',
          choice: [
            { t: '"아버지도 너를 걱정하시는 거야."', fx: { v: { heart: 3 }, aff: { dojun: 3 }, flag: 'dojun_father_soft' }, then: [{ c: 'dojun', t: '…걱정이 저런 말투예요? 그럼 저도 걱정을 저렇게 해야겠네요.', e: 'smirk' }, { c: 'dojun', t: '……고맙습니다. 그렇게 말해줘서.', e: 'sad' }] },
            { t: '"오늘 느낀 거, 노트에 써."', fx: { v: { songs: 1, mental: 3 }, aff: { dojun: 5 } }, then: [{ c: 'dojun', t: '…네. 오늘은 쓸 게 많네요.', e: 'sad' }] },
          ],
        },
        { fx: { flag: 'bs2' } },
      ],
      chaerin: [
        { bg: 'cafe' },
        '미팅 자리에 나온 사람은 백서진 감독이었다. 채린은 감독의 얼굴을 보자마자 컵을 내려놓았다.',
        { show: 'pd', e: 'worried', at: 'l' },
        { show: 'chaerin', e: 'cold', at: 'r' },
        { c: 'chaerin', t: '…조연출 언니.', e: 'cold' },
        { c: 'pd', t: '기억하는구나. <엄마의 바다>. 나 그때 막내 조연출이었어.', e: 'sad' },
        { c: 'pd', t: '네가 쓰러지던 날, 나 거기 있었어. 아무것도 못 했어. 그게 10년 동안 빚이야.', e: 'sad' },
        { c: 'chaerin', t: '사과하려고 부른 거예요? 그럼 늦었어요.', e: 'angry' },
        { c: 'pd', t: '아니. 캐스팅하려고 불렀어. 사과는 현장에서 할게. 이번엔 내가 막을 테니까.', e: 'neutral' },
        {
          prompt: '어떻게 할까?',
          choice: [
            { t: '채린의 결정을 기다린다', fx: { v: { mental: 4 }, aff: { chaerin: 6, pd: 3 }, flag: 'met_pd' }, then: [{ c: 'chaerin', t: '……대본 먼저 보여주세요. 그리고 촬영 시간 제한, 계약서에 넣어주세요.', e: 'cold' }, { c: 'pd', t: '당연하지.', e: 'smile' }] },
            { t: '"오늘은 여기까지 하죠." 채린을 데리고 나온다', fx: { v: { stress: -5 }, aff: { chaerin: 8, pd: -2 }, flag: 'met_pd' }, then: [{ bg: 'street_seoul' }, { c: 'chaerin', t: '…고마워요. 제 편 들어줘서. 근데 그 언니, 나쁜 사람은 아니에요.', e: 'sad' }] },
          ],
        },
        { fx: { flag: 'bs2' } },
      ],
    }),
    { hide: 'all' },
    END,
  ];

  // ── 스트레스·자금 위기 ──
  scenes.ev_crisis = [
    { bg: 'dorm', fx: 'shake' },
    '새벽 세 시. 오 실장에게서 전화가 왔다. "대표님, 빨리 숙소로 좀…!"',
    showStar('cry', 'c'),
    perStar({
      haeun: [{ t: '하은이 화장실 바닥에 주저앉아 숨을 헐떡이고 있었다. 과호흡. 손에는 악플 캡처가 가득한 휴대폰.' }, { c: 'haeun', t: '대표님… 웃어야 하는데, 얼굴이 안 움직여요… 무대 생각만 하면 숨이…', e: 'cry' }],
      dojun: [{ t: '도준이 불 꺼진 연습실에서 혼자 춤을 추고 있었다. 무릎이 부어 있었다. 멈추라는 말을 세 번 해도 멈추지 않았다.' }, { c: 'dojun', t: '멈추면… 멈추면 끝이잖아요. 트랙에서처럼.', e: 'cry' }],
      chaerin: [{ t: '채린이 방 안에서 문을 잠그고 있었다. 한참을 설득한 끝에 열린 문 뒤, 채린은 손톱을 피가 날 만큼 뜯고 있었다.' }, { c: 'chaerin', t: '또 그때처럼 될 것 같아요. 카메라가 저를 먹어버릴 것 같아요.', e: 'cry' }],
    }),
    { show: 'manager', e: 'worried', at: 'l' },
    { c: 'manager', t: '대표님. 이건 제가 20년 해봐서 아는데요, 여기서 잘못 판단하면 애 하나를 잃습니다. 회사가 아니라, 사람을요.', e: 'cold' },
    {
      prompt: '어떻게 할까?',
      choice: [
        { t: '모든 활동을 멈추고 한 달 쉬게 한다', fx: { v: { stress: -45, fame: -4, mental: 4 }, flag: 'crisis1' }, then: [affStar(8), say('…쉬어도 돼요? 진짜로요?', 'cry'), { c: 'me', t: '쉬는 것도 일이야. 제일 중요한 일.' }] },
        { t: '전문 상담을 받게 하고 스케줄을 절반으로 줄인다', fx: { v: { stress: -30, money: -300, mental: 6 }, flag: 'crisis1' }, then: [affStar(5), { t: '상담실 문을 나서는 {s.starName}의 어깨가, 조금은 가벼워 보였다.' }] },
        { t: '"지금 멈추면 다 끝나. 조금만 더 버텨."', fx: { v: { stress: 5, mental: -5 }, flag: ['crisis1', 'pushed_hard'] }, then: [affStar(-12), say('…네. 버틸게요. 버티면 되죠.', 'cold'), { c: 'manager', t: '…….', e: 'angry' }, { fx: { aff: { manager: -8 } } }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_burnout = [
    { bg: 'stage_concert', fx: 'shake' },
    '스케줄 도중이었다. 조명 아래에서 {s.starName}이 천천히, 아주 천천히 무너졌다.',
    { bg: 'hospital' },
    '응급실. 의사는 짧게 말했다. "과로, 탈진, 그리고 공황입니다. 최소 1년은 쉬어야 합니다."',
    showStar('tired', 'c'),
    say('……대표님. 저, 이제 무대가 무서워요. 전부 다.', 'cry'),
    { c: 'me', t: '……미안해. 내가 너무 늦게 멈췄어.' },
    { fx: { flag: 'burnout' } },
    perStar((id) => [{ ending: `burnout_${id}` }]),
  ];

  scenes.ev_money_low = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'worried', at: 'c' },
    { c: 'manager', t: '대표님… 통장이 마이너스입니다. 이번 달 월세, 못 냅니다.', e: 'worried' },
    { c: 'manager', t: '방법은 몇 가지 있습니다. 전부 마음에 안 드실 거고요.', e: 'sad' },
    {
      prompt: '돈을 어떻게 마련할까?',
      choice: [
        { t: '은행 대출을 받는다 (+1,500)', fx: { v: { money: 1500 }, flag: 'loan' }, then: [{ c: 'manager', t: '이자가 무섭긴 한데… 일단 숨은 쉬겠네요.', e: 'neutral' }] },
        { t: '삼촌이 남긴 LP와 트로피를 판다 (+800)', fx: { v: { money: 800 }, aff: { manager: -4 } }, then: [{ c: 'manager', t: '…그 트로피, 저 사장님이 처음 받은 거였는데. 아닙니다. 잘하셨어요.', e: 'sad' }] },
        { t: '타이탄의 투자 제안을 받는다 (+3,000)', fx: { v: { money: 3000 }, flag: ['titan_invest', 'titan_offer'] }, then: [{ show: 'rivalceo', e: 'smirk', at: 'r' }, { c: 'rivalceo', t: '현명하십니다, 사장님. 조건은 간단합니다. 계약 갱신 시 우선 협상권은 저희에게.', e: 'smirk' }, { c: 'manager', t: '대표님…!', e: 'angry' }, { hide: 'rivalceo' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_bankrupt = [
    { bg: 'agency_office', fx: 'shake' },
    '빨간 딱지가 붙은 날은 비가 왔다. 책상, 스피커, 금 간 거울까지.',
    { show: 'manager', e: 'cry', at: 'l' },
    { c: 'manager', t: '…죄송합니다, 대표님. 제가 더 잘 막았어야 했는데.', e: 'cry' },
    showStar('cry', 'r'),
    say('대표님 잘못 아니에요. 저희가… 저희가 더 빨리 떴어야 했는데.', 'cry'),
    { fx: { flag: 'bankrupt' } },
    perStar((id) => [{ ending: `bankrupt_${id}` }]),
  ];

  scenes.ev_poach1 = [
    { bg: 'cafe' },
    '청담동의 조용한 카페. 약속 상대는 먼저 와서 에스프레소를 마시고 있었다.',
    { show: 'rivalceo', e: 'smirk', at: 'c' },
    { c: 'rivalceo', t: '처음 뵙겠습니다. 타이탄 엔터테인먼트 마태성입니다. 작은 회사 사장님.', e: 'smirk' },
    { c: 'rivalceo', t: '돌려 말하지 않겠습니다. {s.starName}. 연습생 계약 이적료로 1억 드리죠.', e: 'neutral' },
    { c: 'rivalceo', t: '타이탄 트레이닝 시스템이면 1년 안에 데뷔합니다. 사장님 회사에선요? 통장 잔고가 답하겠죠.', e: 'cold' },
    { c: 'rivalceo', t: '시장은 감정을 기억하지 않습니다.', e: 'cold' },
    {
      prompt: '마태성에게',
      choice: [
        { t: '"우리 애는 상품이 아닙니다." 자리에서 일어난다', fx: { v: { heart: 2 } }, then: [affStar(4), { c: 'rivalceo', t: '멋있으시네요. 멋은 월세를 내주지 않지만.', e: 'smirk' }] },
        { t: '"생각해 보겠습니다." 명함을 받는다', fx: { flag: 'titan_offer' }, then: [{ c: 'rivalceo', t: '현명하십니다. 연락 기다리죠.', e: 'smile' }, { t: '그날 저녁, {s.starName}이 대표의 책상 위 타이탄 명함을 보았다. 아무 말도 하지 않았다.' }, affStar(-6)] },
        { t: '"그 1억, 세라한테 밥이나 사주세요."', fx: { aff: { rival: 2, rivalceo: -3 } }, then: [{ c: 'rivalceo', t: '……재미있는 분이군요.', e: 'cold' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_xmas1 = [
    { bg: 'dorm' },
    { title: '크리스마스', sub: '연습생들의 겨울' },
    '숙소 거실에 편의점 케이크와 치킨 두 마리. 오 실장이 산타 모자를 쓰고 나타났다.',
    { show: 'manager', e: 'laugh', at: 'l' },
    { c: 'manager', t: '메리 크리스마스! 오늘은 다이어트 없습니다! 대표님 카드로 긁었습니다!', e: 'laugh' },
    perStar((id) => [{ show: OTHERS[id][0], e: 'smile', at: 'c' }, { show: id, e: 'laugh', at: 'r' }]),
    '누군가 틀어놓은 캐럴에 맞춰 {s.o1Name}이 엉터리 춤을 췄고, {s.o2Name}이 결국 웃음을 터뜨렸다.',
    { hide: 'all' },
    { bg: 'rooftop_night' },
    showStar('smile', 'c'),
    say('대표님. 1년 전엔 이 회사 문 닫는 줄 알았어요. 근데 올해 크리스마스는 따뜻하네요.', 'smile'),
    chatStar('연습생으로 보낸 첫해의 크리스마스 밤. 한 해를 돌아보고 데뷔에 대한 기대와 두려움을 나눈다.', 4),
    { fx: { v: { stress: -12, money: -50 } } },
    affStar(4),
    affOthers(3),
    { hide: 'all' },
    END,
  ];

  // ── 데뷔 ──
  const debutChoices = (allowDelay) => ({
    prompt: '어떻게 데뷔시킬까?',
    choice: [
      { t: '솔로 데뷔 — 정면 승부 (자금 700)', if: IDOL, req: { v: { money: '>=700' } }, hint: '자금 700 필요', fx: { v: { money: -700 }, flag: ['debut_plan', 'solo_debut'] }, then: [say('혼자요? …무섭지만, 해볼게요.', 'worried')] },
      {
        t: '{s.o1Name}, {s.o2Name}과 3인조 혼성 그룹으로 (자금 900)', if: IDOL, req: { v: { money: '>=900' } }, hint: '자금 900 필요', fx: { v: { money: -900, heart: 4 }, flag: ['debut_plan', 'group_debut'] },
        then: [
          perStar((id) => [{ show: OTHERS[id][0], e: 'surprised', at: 'l' }, { show: OTHERS[id][1], e: 'surprised', at: 'r' }]),
          { t: '{s.o1Name}과 {s.o2Name}이 동시에 대표를 돌아봤다. 약속이 이렇게 빨리 지켜질 줄은 몰랐다는 얼굴로.' },
          affOthers(12),
          { input: 'groupName', label: '그룹 이름', def: 'NOVA' },
          { t: '그룹 이름은 {s.groupName}. {s.starName}이 센터다.' },
        ],
      },
      { t: '디지털 싱글로 소박하게 (자금 300)', if: IDOL, fx: { v: { money: -300 }, flag: ['debut_plan', 'small_debut'] }, then: [{ c: 'manager', t: '작게 시작해서 크게 가는 것도 방법이죠.', e: 'neutral' }] },
      { t: '웹드라마 주연으로 데뷔 (자금 500)', if: ACTOR, req: { v: { money: '>=500' } }, hint: '자금 500 필요', fx: { v: { money: -500 }, flag: ['debut_plan', 'webdrama_debut'] }, then: [say('주연이요? 웹드라마라도… 주연.', 'surprised')] },
      { t: '백서진 감독의 단편영화로 데뷔', if: ACTOR, req: { v: { acting: '>=40' } }, hint: '연기 40 이상', fx: { v: { acting: 3 }, flag: ['debut_plan', 'film_debut', 'met_pd'] }, then: [{ show: 'pd', e: 'smirk', at: 'l' }, { c: 'pd', t: '돈은 없어. 대신 영화제는 간다. 그거면 되지?', e: 'smirk' }, { hide: 'pd' }] },
      { t: '대형 드라마 단역부터', if: ACTOR, fx: { flag: ['debut_plan', 'small_debut'] }, then: [{ c: 'manager', t: '대사 세 줄. 그래도 공중파입니다!', e: 'smile' }] },
      ...(allowDelay ? [{ t: '아직 이르다. 데뷔를 미룬다', fx: { flag: 'debut_delay', v: { stress: -5 } }, then: [{ c: 'manager', t: '…반년. 반년 넘기면 회사가 못 버팁니다.', e: 'worried' }] }] : []),
    ],
  });
  scenes.ev_debut_plan = [
    { bg: 'agency_office' },
    { title: '데뷔 회의', sub: '모든 걸 거는 날' },
    { show: 'manager', e: 'neutral', at: 'l' },
    showStar('worried', 'r'),
    { c: 'manager', t: '대표님, 때가 됐습니다. 데뷔 플랜을 정하셔야 합니다.', e: 'neutral' },
    { if: { flag: 'surv_win' }, then: [{ c: 'manager', t: '서바이벌 1위 출신이라 방송국에서도 먼저 연락이 옵니다. 지금이 골든타임이에요!', e: 'laugh' }, { t: '서바이벌 1위 소식에 투자사 두 곳이 데뷔 비용을 보태겠다고 연락해왔다.' }, { fx: { v: { money: 1000 } } }], else: [{ if: { flag: 'surv_top' }, then: [{ t: '서바이벌 상위권 효과로 음반 유통사가 선급금을 내놓았다.' }, { fx: { v: { money: 500 } } }] }] },
    { if: { flag: 'surv_out' }, then: [{ c: 'manager', t: '서바이벌 탈락 꼬리표가 있긴 한데… 오히려 "재기" 서사는 팬들이 좋아합니다.', e: 'neutral' }] },
    debutChoices(true),
    { hide: 'all' },
    END,
  ];
  scenes.ev_debut_plan2 = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'worried', at: 'l' },
    { c: 'manager', t: '대표님. 더는 못 미룹니다. 이번 달에 데뷔 플랜 확정해야 합니다.', e: 'worried' },
    showStar('neutral', 'r'),
    say('저, 준비됐어요. 대표님만 믿을게요.', 'neutral'),
    debutChoices(false),
    { hide: 'all' },
    END,
  ];

  scenes.ev_debut = [
    { bg: 'black' },
    { title: '데뷔', sub: '{s.starName}, 세상에 서다' },
    trackBr(
      [
        { bg: 'press_room', fx: 'flash' },
        '데뷔 쇼케이스. 기자 쉰 명, 팬 이백 명. 작은 회사치고는 기적 같은 숫자였다.',
        { if: { flag: 'group_debut' }, then: [perStar((id) => [{ show: OTHERS[id][0], e: 'smile', at: 'l' }, { show: id, e: 'smile', at: 'c' }, { show: OTHERS[id][1], e: 'smile', at: 'r' }]), { t: '"안녕하세요, {s.groupName}입니다!" 세 목소리가 겹쳤다.' }], else: [showStar('smile', 'c'), { t: '"안녕하세요, {s.starName}입니다!"' }] },
        { bg: 'stage_concert', fx: 'flash' },
        {
          if: { v: { mental: '>=35' }, any: [{ v: { vocal: '>=50' } }, { v: { dance: '>=50' } }] },
          then: [{ t: '첫 소절부터 공기가 바뀌었다. 기자석에서 셔터 소리가 폭우처럼 쏟아졌다.' }, { t: '그날 밤, 쇼케이스 직캠이 실시간 트렌드에 올랐다. "중소의 기적" "이 회사 어디야?"' }, { fx: { v: { fame: 15, fans: 110 }, flag: 'debut_great' } }],
          else: [{
            if: { any: [{ v: { vocal: '>=38' } }, { v: { dance: '>=38' } }] },
            then: [{ t: '실수 없이 무대를 마쳤다. 박수는 따뜻했고, 기사는 짧았다. "무난한 데뷔."' }, { fx: { v: { fame: 8, fans: 55 } } }],
            else: [{ t: '인이어가 빠졌다. 음 이탈, 박자 실수. 쇼케이스가 끝나고 대기실은 조용했다.' }, { fx: { v: { fame: 4, fans: 25, stress: 12 } } }],
          }],
        },
      ],
      [
        { bg: 'filming_set', fx: 'flash' },
        '첫 촬영장. 조명 스태프가 "신인 누구야?" 하고 물었다.',
        showStar('worried', 'c'),
        { t: '"레디, 액션!"' },
        {
          if: { v: { acting: '>=48', mental: '>=30' } },
          then: [{ t: '첫 테이크에 오케이. 감독이 모니터에서 고개를 들고 한참 {s.starName}을 봤다.' }, { t: '공개 첫 주, "저 신인 누구냐"는 게시글이 커뮤니티 인기글에 올랐다.' }, { fx: { v: { fame: 13, fans: 80, acting: 2 }, flag: 'debut_great' } }],
          else: [{
            if: { v: { acting: '>=36' } },
            then: [{ t: '세 번 만에 오케이. 나쁘지 않았다. "딕션 좋네" 정도의 평.' }, { fx: { v: { fame: 7, fans: 40 } } }],
            else: [{ t: 'NG 열한 번. 스태프들의 한숨이 들렸다. 그래도 마지막 테이크는 살렸다.' }, { fx: { v: { fame: 3, fans: 20, stress: 12 } } }],
          }],
        },
      ]
    ),
    { if: { flag: 'small_debut' }, then: [{ t: '작은 시작이었다. 하지만 시작이었다.' }, { fx: { v: { fame: -2 } } }] },
    { if: { flag: 'surv_win' }, then: [{ t: '서바이벌 1위 출신 효과로 음원 사이트 실시간 차트에 이름이 올랐다.' }, { fx: { v: { fame: 6, fans: 80 } } }] },
    { fx: { flag: 'debuted' } },
    { bg: 'rooftop_night' },
    showStar('cry', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '대표님… 저 오늘 무대에서 안 떨었어요. 아니, 떨었는데 끝까지 불렀어요.', e: 'cry' }, { c: 'haeun', t: '엄마가 객석 맨 뒤에 있었어요. 식당 앞치마도 못 벗고 오셨더라고요.', e: 'cry' }],
      dojun: [{ c: 'dojun', t: '…결승선 통과한 기분이에요. 근데 이상하네요. 여기서부터가 진짜 트랙 같아요.', e: 'smile' }],
      chaerin: [{ c: 'chaerin', t: '14년 만이에요. 누가 제 이름을 불러준 거.', e: 'cry' }, { c: 'chaerin', t: '…이번엔 제가 대답할 수 있어서 좋아요.', e: 'smile' }],
    }),
    chatStar('데뷔 당일 밤, 옥상에서 데뷔 소감과 앞으로의 목표를 이야기한다.', 3),
    affStar(6),
    { hide: 'all' },
    END,
  ];

  // ───────────────────────── 2년차: 신인 ─────────────────────────
  scenes.ev_y2 = [
    { bg: 'agency_office' },
    { title: '2년차', sub: '신인의 해' },
    { show: 'manager', e: 'smile', at: 'l' },
    { c: 'manager', t: '대표님, 새해 복 많이 받으십쇼. 작년 결산입니다.', e: 'smile' },
    { t: '인기 {v.fame}. 팬덤 {v.fans}. 자금 {v.money}만 원.' },
    { if: { flag: 'debuted' }, then: [{ c: 'manager', t: '데뷔는 했습니다. 이제부터가 진짜 전쟁이에요. 올해 목표는 신인상입니다.', e: 'neutral' }], else: [{ c: 'manager', t: '아직 데뷔 전입니다. 올해 안에는 무조건 데뷔해야 합니다.', e: 'worried' }] },
    showStar('smile', 'r'),
    say('올해는 더 잘할게요. 대표님, 떡국 드셨어요?', 'smile'),
    chatStar('새해 첫날, 올해 목표와 각오를 함께 정한다.', 3),
    { fx: { v: { stress: -5 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_first_stage = [
    { bg: 'broadcast_studio' },
    { title: '첫 음악방송', sub: '사전녹화 새벽 5시' },
    '새벽 다섯 시, 방송국 사전녹화. 객석엔 스무 명 남짓한 팬들이 손수 만든 슬로건을 들고 있었다.',
    { show: 'manager', e: 'neutral', at: 'l' },
    { c: 'manager', t: '대기실은 복도 끝 창고 옆입니다. 신인은 원래 거기예요. 저도 20년 전에 거기서 김밥 먹었습니다.', e: 'smile' },
    { hide: 'manager' },
    showStar('worried', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '대표님, 저 손 좀 잡아주세요. 딱 3초만요.', e: 'worried' }, { c: 'me', t: '하나, 둘, 셋.' }, { c: 'haeun', t: '…됐어요. 갔다 올게요!', e: 'smile' }],
      dojun: [{ c: 'dojun', t: '무릎 테이핑 다시 감아주실래요. …실장님 말고, 대표님이요.', e: 'shy' }],
      chaerin: [{ c: 'chaerin', t: '무대는 카메라랑 다르네요. 관객 눈이 너무 많아요.', e: 'worried' }, { c: 'chaerin', t: '…괜찮아요. 한 명만 보고 할게요. 맨 앞에 저 슬로건 든 분.', e: 'neutral' }],
    }),
    { bg: 'stage_concert', fx: 'flash' },
    {
      if: { any: [{ v: { dance: '>=55' } }, { v: { vocal: '>=55' } }] },
      then: [{ t: '3분 20초. 스무 명의 팬이 이백 명처럼 소리를 질렀다. 음방 PD가 모니터를 보며 중얼거렸다. "쟤 다음 주 엔딩 줘."' }, { fx: { v: { fame: 5, fans: 40 } } }],
      else: [{ t: '무대는 무사히 끝났다. 카메라는 선배 그룹 쪽을 더 오래 비췄지만, 스무 명의 팬들은 끝까지 {s.starName}의 이름을 불렀다.' }, { fx: { v: { fame: 2, fans: 20 } } }],
    },
    { show: 'fanmaster', e: 'smile', at: 'r' },
    { c: 'fanmaster', t: '(퇴근길에서) 오늘 진짜 잘했어요! 첫 음방 축하해요!', e: 'laugh' },
    { hide: 'fanmaster' },
    say('…팬분이 저를 알아봐 주셨어요. 저를요!', 'laugh'),
    affStar(3),
    { hide: 'all' },
    END,
  ];

  scenes.ev_first_set = [
    { bg: 'filming_set' },
    { title: '첫 현장', sub: '배우의 대기실은 봉고차' },
    '데뷔작이 공개된 뒤, 첫 외부 촬영 현장. 대기실은 없었다. 봉고차 뒷좌석이 전부였다.',
    showStar('neutral', 'c'),
    say('대본 세 번 더 볼게요. 대사 두 줄이라도 틀리면 안 되니까.', 'neutral'),
    { show: 'pd', e: 'neutral', at: 'r' },
    { c: 'pd', t: '거기, 신인. 아까 리허설 때 대사 없는 부분에서 뭐 했어?', e: 'cold' },
    say('…상대 배우가 대사할 때, 제 캐릭터라면 뭘 생각할지 생각했어요.', 'worried'),
    { c: 'pd', t: '…그래. 그게 보였어. 다음 작품 때 연락할게. 이름 뭐라고 했지?', e: 'smirk' },
    { hide: 'pd' },
    { fx: { v: { acting: 3, fame: 3, fans: 20 }, aff: { pd: 6 }, flag: 'met_pd' } },
    affStar(2),
    { hide: 'all' },
    END,
  ];

  scenes.ev_fandom_name = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'laugh', at: 'l' },
    { c: 'manager', t: '대표님! 팬카페 회원 수가 공식 팬덤명 정할 만큼 모였습니다!', e: 'laugh' },
    showStar('shy', 'r'),
    say('팬덤 이름이요? 저한테요? …우와.', 'surprised'),
    { c: 'manager', t: '팬 투표 후보를 추렸습니다. 최종 결정은 대표님이랑 {s.starName}이 하시죠.', e: 'smile' },
    { input: 'fandom', label: '팬덤 이름', def: '별조각' },
    { t: '공식 팬덤명 발표. "{s.fandom}". 발표 10분 만에 실시간 트렌드에 올랐다.' },
    perStar({
      haeun: [{ c: 'haeun', t: '{s.fandom}! 입에 붙어요! 앞으로 콘서트에서 이 이름 백 번 부를 거예요!', e: 'laugh' }],
      dojun: [{ c: 'dojun', t: '{s.fandom}… 좋네요. 불러보니까 좀 쑥스럽지만.', e: 'shy' }],
      chaerin: [{ c: 'chaerin', t: '{s.fandom}. …이름이 생기니까, 진짜 제 사람들이 생긴 것 같아요.', e: 'smile' }],
    }),
    { fx: { v: { fans: 30, heart: 2 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_mentor = [
    { bg: 'cafe' },
    '인사동 골목의 작은 찻집. 남궁현 선생이 먼저 와서 쌍화차를 두 잔 시켜두었다.',
    { show: 'mentor', e: 'smile', at: 'l' },
    { c: 'mentor', t: '허허, 네가 그 녀석 조카구나. 눈매가 똑같네. 고집 센 눈.', e: 'smile' },
    showStar('shy', 'r'),
    say('선배님, 처음 뵙겠습니다! 영광이에요!', 'surprised'),
    { c: 'mentor', t: '얘야, 영광은 무슨. 너 무대 영상 봤다.', e: 'neutral' },
    trackBr(
      [{ c: 'mentor', t: '노래가 급하더구나. 다 보여주려고 해서 그래. 관객은 네가 숨 쉬는 틈에 반한다.', e: 'neutral' }],
      [{ c: 'mentor', t: '연기가 착하더구나. 착한 건 좋은데, 가끔은 관객을 배신해야 한다. 예상한 대로만 울면 아무도 안 운다.', e: 'neutral' }]
    ),
    { c: 'mentor', t: '그리고 하나만 기억해라. 박수 소리는 언젠가 끊긴다. 끊겼을 때 옆에 누가 남는지, 그걸 지금부터 만들어라.', e: 'sad' },
    chatStar('전설적인 선배 남궁현에게 조언을 들은 뒤, 스타가 어떤 선배가 되고 싶은지 이야기한다.', 3),
    {
      prompt: '헤어지기 전 선생에게',
      choice: [
        { t: '"가끔 아이들 봐주실 수 있을까요?"', fx: { aff: { mentor: 6 }, v: { vocal: 2, acting: 2, mental: 2 }, flag: 'mentor_bond' }, then: [{ c: 'mentor', t: '허허, 공짜 레슨이다 이거지? 그 녀석 조카답구나. 좋다.', e: 'laugh' }] },
        { t: '"삼촌 얘기 더 들려주세요."', fx: { aff: { mentor: 5, manager: 2 }, v: { stress: -5 } }, then: [{ c: 'mentor', t: '그 녀석은 말이다… 허허, 이건 술 한잔 해야 나오는 얘기다.', e: 'smile' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_first_win = [
    { bg: 'broadcast_studio' },
    { title: '1위 후보', sub: '금요일 밤의 발표' },
    { show: 'manager', e: 'surprised', at: 'l' },
    { c: 'manager', t: '대표님, 1위 후보입니다! 상대는… 타이탄 류세라요.', e: 'surprised' },
    { hide: 'manager' },
    '엔딩 무대. 1위 후보 둘이 나란히 섰다. 전광판 숫자가 올라가기 시작했다. 음원, 음반, 방송 점수. 그리고 문자 투표.',
    showStar('worried', 'l'),
    { show: 'rival', e: 'cold', at: 'r' },
    {
      if: { v: { fans: '>=140', fame: '>=36' } },
      then: [
        { bg: 'stage_concert', fx: 'flash' },
        { t: '"이번 주 1위는… {s.starName}!"' },
        say('……네? 네?! 저요?', 'cry'),
        { t: '트로피가 생각보다 무거웠다. 앵콜 무대, {s.starName}은 노래를 반도 못 불렀다. 울어서. 객석의 {s.fandom}이 대신 떼창을 했다.' },
        { c: 'rival', t: '…축하해. 진짜로.', e: 'sad' },
        { t: '그날 밤, 앵콜 직캠이 조회수 300만을 넘겼다. "울면서 앵콜하는 신인" "중소의 기적 첫 1위".' },
        { fx: { v: { fame: 10, fans: 120, wins: 1, stress: -10 }, flag: 'first_win', aff: { rival: 3 } } },
        affStar(8),
        { show: 'reporter', e: 'smile', at: 'c' },
        { c: 'reporter', t: '대표님~ 약속하신 단독 인터뷰! 제일 먼저 저한테 주시는 거죠?', e: 'laugh' },
        { hide: 'reporter' },
        { fx: { aff: { reporter: 4 } } },
      ],
      else: [
        { t: '"이번 주 1위는… 류세라!" 박수 소리. {s.starName}은 웃으며 세라에게 꽃다발을 건넸다.' },
        { c: 'rival', t: '…표 차이 얼마 안 났어. 다음엔 모르겠네.', e: 'neutral' },
        { t: '돌아오는 밴 안. {s.starName}이 창밖을 보며 조용히 말했다.' },
        say('다음엔 제가 받을게요. 꼭요.', 'angry'),
        { fx: { v: { fame: 4, fans: 40, mental: 3 }, flag: 'first_win_miss' } },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_first_win2 = [
    { bg: 'stage_concert', fx: 'flash' },
    '두 번째 1위 후보. 이번엔 전광판 숫자가 올라가는 걸 끝까지 볼 수 있었다.',
    { t: '"이번 주 1위는… {s.starName}!"' },
    showStar('cry', 'c'),
    say('대표님! 대표님, 저 받았어요!', 'cry'),
    { t: '앵콜 무대에서 {s.starName}은 마이크를 객석으로 넘겼다. {s.fandom}의 떼창이 방송국 천장을 울렸다.' },
    { fx: { v: { fame: 9, fans: 100, wins: 1, stress: -8 }, flag: 'first_win' } },
    affStar(6),
    { hide: 'all' },
    END,
  ];

  scenes.ev_cameo = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'laugh', at: 'l' },
    { c: 'manager', t: '대표님! 백서진 감독 드라마에서 카메오 제의가 왔습니다! 1회 등장, 대사 다섯 줄!', e: 'laugh' },
    { bg: 'filming_set' },
    { show: 'pd', e: 'neutral', at: 'r' },
    { c: 'pd', t: '5분짜리 역이야. 주인공 첫사랑의 동생. 근데 이 5분이 16부작 전체를 흔들어야 돼.', e: 'neutral' },
    showStar('worried', 'l'),
    { c: 'pd', t: '다시. 이번엔 거짓말하지 말고.', e: 'cold' },
    {
      if: { v: { acting: '>=42' } },
      then: [{ t: '세 번째 테이크. 현장이 고요해졌다. 붐 마이크를 든 스태프가 코를 훌쩍였다.' }, { c: 'pd', t: '…컷. 오케이. 이 장면 예고편에 쓴다.', e: 'smile' }, { t: '방송 후, 5분 출연분이 클립으로 200만 뷰를 넘겼다. "카메오가 주연 먹었다."' }, { fx: { v: { fame: 8, fans: 70, acting: 3 }, aff: { pd: 6 } } }],
      else: [{ t: '열 번 넘게 다시 찍었다. 감독은 끝까지 화를 내지 않았다. 대신 마지막에 한마디 했다. "다음엔 준비해 와."' }, { fx: { v: { fame: 3, fans: 25, acting: 2, stress: 6 }, aff: { pd: 2 } } }],
    },
    { fx: { flag: 'cameo' } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_supporting = [
    { bg: 'filming_set' },
    { title: '조연 캐스팅', sub: '이름이 있는 역할' },
    { show: 'pd', e: 'smirk', at: 'r' },
    { c: 'pd', t: '다음 작품, 주인공 동생 역. 16부 중에 12부 나와. 이름도 있고, 서사도 있어.', e: 'smirk' },
    showStar('surprised', 'l'),
    say('…조연이요? 이름 있는 역이요?', 'surprised'),
    { c: 'pd', t: '대신 조건이 있어. 3개월 동안 다른 스케줄 줄여. 이 애 인생 전체를 너한테 걸 거니까.', e: 'neutral' },
    {
      prompt: '제안을 받을까?',
      choice: [
        { t: '받는다', fx: { v: { acting: 5, fame: 8, fans: 70, stress: 8, money: 300 }, flag: 'supporting', aff: { pd: 5 } }, then: [affStar(4), say('감독님, 절대 후회 안 하시게 할게요.', 'smile')] },
        { t: '다른 작품의 주연 오디션을 기다린다', fx: { v: { stress: -3 }, aff: { pd: -4 } }, then: [{ c: 'pd', t: '욕심은 좋은데… 그럼 다음 기회에.', e: 'cold' }, { c: 'manager', t: '대표님, 방금 기회 하나 날아간 겁니다.', e: 'worried' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_variety = [
    { bg: 'broadcast_studio' },
    { title: '예능 출연', sub: '금요일 밤 11시' },
    '인기 예능 <정글의 식탁> 게스트 섭외. 무인도에서 3박 4일, 요리와 생존.',
    showStar('smile', 'c'),
    perStar({
      haeun: [{ t: '하은은 밤새 모닥불 앞에서 출연진에게 노래를 불러줬다. 파도 소리에 섞인 아카펠라가 방송 끝 5분을 가득 채웠다.' }, { c: 'haeun', t: '헤헤, 배고프면 노래가 더 잘 나와요!', e: 'laugh' }],
      dojun: [{ t: '도준은 말없이 통발을 놓고, 불을 피우고, 선배들 밥을 먼저 챙겼다. "말 없는 일꾼"이라는 자막이 스무 번 넘게 떴다.' }, { c: 'dojun', t: '…먹어요. 식어요.', e: 'neutral' }],
      chaerin: [{ t: '채린은 생선 손질을 하다가 비명을 지르고, 그러다 결국 누구보다 잘 해냈다. 냉소적인 혼잣말이 자막으로 뜰 때마다 스튜디오가 뒤집어졌다.' }, { c: 'chaerin', t: '생선이 저를 봐요. 저 생선한테 사과해야 돼요?', e: 'worried' }],
    }),
    {
      if: { v: { variety: '>=48' } },
      then: [{ t: '방송 다음 날, {s.starName}의 "명장면"이 짤로 돌기 시작했다. 예능 대세. 떡상. 섭외 전화가 멈추지 않았다.' }, { fx: { v: { fame: 12, fans: 120, variety: 3 }, flag: 'variety_breakout' } }],
      else: [{ t: '방송은 무난하게 지나갔다. 몇몇 장면이 클립으로 돌았다.' }, { fx: { v: { fame: 4, fans: 40, variety: 2 } } }],
    },
    affStar(2),
    { hide: 'all' },
    END,
  ];

  scenes.ev_malicious = [
    { bg: 'dorm' },
    '새벽. 숙소 불이 하나 켜져 있었다. {s.starName}이 휴대폰 화면만 보고 있었다.',
    showStar('sad', 'c'),
    perStar({
      haeun: [{ t: '"웃는 거 가식적임" "고음 빼면 시체" "중소 주제에 1위 욕심"' }],
      dojun: [{ t: '"춤만 추는 로봇" "싸가지 없어 보임" "다리 병신이 무슨 아이돌"' }],
      chaerin: [{ t: '"한물간 아역" "성형했네" "그때 쓰러진 것도 연기였던 듯"' }],
    }),
    say('대표님… 이거 다 제 얘기예요. 모르는 사람들이, 저를 이렇게 알아요.', 'cry'),
    {
      prompt: '어떻게 할까?',
      choice: [
        { t: '휴대폰을 뺏고 "오늘은 나랑 한강 가자."', fx: { v: { stress: -12, mental: 3 } }, then: [{ bg: 'han_river' }, { t: '자전거를 빌려 한 시간을 달렸다. 돌아오는 길, {s.starName}이 처음으로 웃었다.' }, affStar(5)] },
        { t: '악플러 전원 고소를 공지한다 (자금 400)', fx: { v: { money: -400, mental: 5, stress: -6 }, flag: 'sued_haters' }, then: [{ t: '공지 한 시간 만에 게시글 수백 개가 삭제됐다. {s.fandom}이 증거 자료를 모아 보내왔다.' }, { fx: { v: { fans: 30 }, aff: { fanmaster: 4 } } }, affStar(4)] },
        { t: '"신경 쓰지 마. 이것도 인기의 증거야."', fx: { v: { stress: 8, mental: -2 } }, then: [say('…인기가 이런 거면, 저 인기 싫어요.', 'cold'), affStar(-4)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_fansite = [
    { bg: 'street_seoul' },
    '퇴근길. 대포 카메라를 멘 여성이 조심스럽게 대표에게 다가왔다.',
    { show: 'fanmaster', e: 'smile', at: 'c' },
    { c: 'fanmaster', t: '안녕하세요, 대표님. 저 {s.starName} 홈마 "새벽달"이에요. 한 번 인사드리고 싶었어요.', e: 'smile' },
    { c: 'fanmaster', t: '이거… 팬들이 모은 조공이에요. 스태프분들 것도 있어요. 그리고 부탁 하나만 드려도 될까요?', e: 'shy' },
    { c: 'fanmaster', t: '스케줄 끝나면 애 밥 좀 꼭 먹여주세요. 요즘 직캠 보면 볼살이 너무 빠졌어요.', e: 'worried' },
    {
      prompt: '새벽달에게',
      choice: [
        { t: '"꼭 그럴게요. 팬분들 의견, 언제든 보내주세요."', fx: { aff: { fanmaster: 8 }, v: { fans: 40 }, flag: 'fanmaster_ally' }, then: [{ c: 'fanmaster', t: '와… 이런 대표님 처음이에요. 이건 역사다.', e: 'laugh' }] },
        { t: '"회사 일은 회사가 알아서 합니다."', fx: { aff: { fanmaster: -5 } }, then: [{ c: 'fanmaster', t: '…네. 알겠습니다.', e: 'cold' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_fanmeeting = [
    { bg: 'stage_concert' },
    { title: '첫 팬미팅', sub: '{s.fandom}과의 첫 만남' },
    '1,200석 홀이 매진됐다. 객석을 가득 채운 응원봉 불빛.',
    showStar('cry', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '여러분… 제가 무대 공포증이 있었거든요. 근데 여러분 얼굴 보니까, 이제 무대가 제일 안 무서운 곳이 됐어요.', e: 'cry' }, { t: '하은은 준비한 노래 대신, 어릴 때 엄마가 불러주던 노래를 불렀다. 객석 곳곳에서 훌쩍이는 소리가 났다.' }],
      dojun: [{ c: 'dojun', t: '…말 잘 못 하는 거 아시죠. 그래서 써왔어요.', e: 'shy' }, { t: '도준이 주머니에서 꺼낸 종이를 떨리는 목소리로 읽었다. "나 같은 놈을 보러 와줘서 고맙다. 추운데 줄 서지 마라. 밥 먹고 다녀라." 객석이 웃다가 울었다.' }, { fx: { flag: 'dojun_letter' } }],
      chaerin: [{ c: 'chaerin', t: '저는 어릴 때 사랑받는 법만 배웠지, 사랑하는 법은 못 배웠어요.', e: 'sad' }, { c: 'chaerin', t: '근데 여러분 보니까… 이게 그건가 봐요. 사랑하는 거.', e: 'cry' }],
    }),
    { show: 'fanmaster', e: 'cry', at: 'r' },
    { c: 'fanmaster', t: '(맨 앞줄에서 카메라를 내려놓고) …이건 찍으면 안 돼. 그냥 봐야 돼.', e: 'cry' },
    { hide: 'fanmaster' },
    { fx: { v: { fans: 120, fame: 5, stress: -10, heart: 3, money: 400 } } },
    affStar(5),
    { hide: 'all' },
    END,
  ];

  scenes.ev_birthday = [
    { bg: 'cafe' },
    { title: '생일', sub: '역조공의 날' },
    '{s.starName}의 생일. 팬들이 합정역 광고판과 카페 세 곳을 빌려 생일 카페를 열었다.',
    showStar('surprised', 'c'),
    say('대표님, 지하철역에 제 얼굴이 있어요. 엄청 커요!', 'surprised'),
    {
      prompt: '생일을 어떻게 보낼까?',
      choice: [
        { t: '몰래 생일 카페를 방문해 역조공을 한다 (자금 200)', fx: { v: { money: -200, fans: 80, heart: 4, fame: 3 } }, then: [{ t: '모자를 눌러쓴 {s.starName}이 커피 이백 잔을 들고 나타나자 카페가 비명으로 가득 찼다. "역조공 레전드" 영상이 그날 밤 퍼졌다.' }, { fx: { aff: { fanmaster: 5 } } }] },
        { t: 'SNS 라이브로 팬들과 생일 파티를 한다', fx: { v: { fans: 60, variety: 2 } }, then: [{ t: '라이브 동시 접속자 5만 명. 케이크 촛불을 끄다 머리카락을 태울 뻔한 장면이 밈이 됐다.' }] },
        { t: '조용히 셋이서 미역국을 먹는다', fx: { v: { stress: -12 } }, then: [perStar((id) => [{ show: OTHERS[id][0], e: 'smile', at: 'l' }, { show: OTHERS[id][1], e: 'smile', at: 'r' }]), { t: '{s.o1Name}이 끓인 미역국은 짰고, {s.o2Name}이 산 케이크는 찌그러져 있었다. 그래도 최고의 생일이었다.' }, affOthers(3)] },
      ],
    },
    affStar(4),
    { hide: 'all' },
    END,
  ];

  scenes.ev_dating = [
    { bg: 'press_room', fx: 'flash' },
    { title: '단독', sub: '<스냅> 1월 1일 특종' },
    '새벽 여섯 시, 전화가 쉬지 않고 울렸다. <스냅> 단독 보도. 흐릿한 사진 속, 모자를 쓴 두 사람이 한강 공원을 걷고 있었다.',
    { show: 'reporter', e: 'smirk', at: 'r' },
    { c: 'reporter', t: '대표님~ 공식 입장 주실 거죠? 오전 열 시까지요.', e: 'smirk' },
    { hide: 'reporter' },
    { bg: 'agency_office' },
    showStar('worried', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '…대학 작곡과 선배예요. 제가 무대 공포증으로 무너질 때마다 옆에 있어준 사람.', e: 'cry' }, { c: 'haeun', t: '사귀는 거, 맞아요. 반년 됐어요. 죄송해요, 대표님.', e: 'cry' }],
      dojun: [{ c: 'dojun', t: '……세라예요. 류세라.', e: 'shy' }, { c: 'me', t: '타이탄의?' }, { c: 'dojun', t: '밥을 안 먹길래 먹였어요. 몇 번. 그러다 보니까… 네. 맞습니다.', e: 'shy' }, { fx: { flag: 'dojun_sera' } }],
      chaerin: [{ c: 'chaerin', t: '서강우 선배요. 드라마에서 만난. 저한테 처음으로 "촬영 힘들면 멈춰도 돼"라고 말해준 사람이에요.', e: 'sad' }, { c: 'chaerin', t: '숨기려고 한 거 아니에요. 그냥, 제 거 하나쯤은 갖고 싶었어요.', e: 'cry' }],
    }),
    { show: 'manager', e: 'worried', at: 'l' },
    { c: 'manager', t: '대표님, 팬덤 반응이 반반입니다. 결정하셔야 해요.', e: 'worried' },
    {
      prompt: '공식 입장은?',
      choice: [
        { t: '"서로 좋은 감정으로 알아가는 중입니다." 인정한다', fx: { v: { fans: -60, fame: 4, heart: 5, stress: -5 }, flag: 'dating_public' }, then: [affStar(10), say('…대표님. 저 지켜준 거죠? 평생 안 잊을게요.', 'cry'), { t: '팬카페에 탈퇴 글이 올라왔다. 그리고 그보다 조금 더 많은 응원 글이 올라왔다. "행복하면 됐어."' }] },
        { t: '"사생활은 확인이 어렵습니다." 애매하게 넘긴다', fx: { v: { fans: -20, scandal: 10, stress: 4 } }, then: [{ t: '기사 댓글은 추측으로 가득 찼다. 불씨는 꺼지지 않았다.' }] },
        { t: '"사실무근." 부인하고 정리하라고 한다', fx: { v: { stress: 15, scandal: 5 }, flag: 'dating_denied' }, then: [affStar(-15), say('……네. 회사 방침이니까요.', 'cold'), { t: '그날 이후, {s.starName}은 대표 앞에서 휴대폰을 뒤집어 놓기 시작했다.' }] },
      ],
    },
    { if: { flag: ['dating_public', 'dojun_sera'] }, then: [{ show: 'rivalceo', e: 'angry', at: 'r' }, { c: 'rivalceo', t: '(전화로) 사장님. 우리 세라를 끌어들이신 대가는 치르셔야 할 겁니다.', e: 'cold' }, { hide: 'rivalceo' }, { fx: { aff: { rival: 8, rivalceo: -8 } } }] },
    { hide: 'all' },
    END,
  ];

  scenes.ev_dating_exposed = [
    { bg: 'press_room', fx: 'shake' },
    '<스냅> 후속 보도. "부인했던 그 열애, 여전히 진행 중". 사진은 이번엔 선명했다.',
    { show: 'reporter', e: 'cold', at: 'c' },
    { c: 'reporter', t: '대표님, 거짓말은 기사보다 오래 남아요. 제가 말씀드렸잖아요.', e: 'cold' },
    { hide: 'reporter' },
    '"거짓말 아이돌" "팬 기만". 해시태그가 하루 종일 트렌드에 올랐다.',
    showStar('cry', 'c'),
    say('…그만 만나라고 해서, 몰래 만났어요. 제 잘못이에요.', 'cry'),
    { fx: { v: { scandal: 25, fame: -8, fans: -120, stress: 15 } } },
    {
      prompt: '어떻게 수습할까?',
      choice: [
        { t: '회사 잘못이라고 공개 사과한다', fx: { v: { scandal: -12, heart: 3 }, flag: 'dating_public' }, then: [affStar(10), { t: '"교제 사실을 부인한 것은 회사의 판단이었습니다." 대표 명의의 사과문. 비난은 회사로 향했고, {s.starName}은 조금 숨을 쉴 수 있었다.' }] },
        { t: '침묵한다', fx: { v: { scandal: 5 } }, then: [affStar(-5)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_poach2 = [
    { bg: 'agency_office' },
    '{s.starName}이 서류 봉투를 들고 대표실 문을 두드렸다.',
    showStar('worried', 'c'),
    say('대표님. 이거… 타이탄에서 저한테 직접 보냈어요. 계약금 5억이래요.', 'worried'),
    { t: '서류엔 타이탄 로고와 마태성의 서명. 전속계약 해지 위약금까지 대신 내주겠다는 조건이었다.' },
    { show: 'rivalceo', e: 'smirk', at: 'r' },
    { c: 'rivalceo', t: '(전화 속 목소리) 사장님, 선택은 아티스트의 몫 아니겠습니까. 시장은 감정을 기억하지 않습니다.', e: 'smirk' },
    { hide: 'rivalceo' },
    chatStar('타이탄의 5억 이적 제안을 받은 스타와, 남을지 떠날지에 대해 솔직하게 이야기한다.', 4),
    {
      prompt: '{s.starName}에게',
      choice: [
        { t: '"네가 원하는 길로 가. 난 붙잡지 않을게."', then: [{ if: starAff('>=50'), then: [say('…바보예요, 대표님. 그렇게 말하면 제가 어떻게 가요.', 'cry'), { t: '{s.starName}이 서류를 반으로 찢었다.' }, affStar(10)], else: [say('……생각할 시간을 주세요.', 'cold'), { fx: { flag: 'titan_waver' } }, affStar(-3)] }] },
        { t: '정산 비율을 올려 새 계약을 제안한다 (자금 800)', req: { v: { money: '>=800' } }, hint: '자금 800 필요', fx: { v: { money: -800 }, flag: 'better_contract' }, then: [affStar(7), say('돈 때문에 남는 거 아니에요. 근데… 저를 이만큼 생각해준다는 거, 알았어요.', 'shy')] },
        { t: '"타이탄은 너를 상품으로 볼 거야. 세라 봐."', fx: { v: { mental: 2 } }, then: [{ if: { flag: 'met_sera' }, then: [say('…세라 선배, 방울토마토 다섯 개로 버티는 거 알아요. 저 그렇게 살기 싫어요.', 'sad'), affStar(5)], else: [say('…대표님 말 믿을게요.', 'neutral'), affStar(2)] }] },
      ],
    },
    { fx: { flag: 'titan_offer' } },
    { hide: 'all' },
    END,
  ];

  // ── 스타별 과거사 3 ──
  scenes.ev_backstory3 = [
    perStar({
      haeun: [
        { bg: 'street_seoul', fx: 'shake' },
        '팬사인회가 끝난 건물 앞. 검은 양복의 남자 둘이 하은의 앞을 막았다. "한하은 씨? 아버님 채무 건으로 왔습니다."',
        { show: 'haeun', e: 'cry', at: 'c' },
        '줄을 서 있던 팬들이 웅성거렸다. 누군가 휴대폰을 들었다.',
        { c: 'haeun', t: '…여기서는, 여기서는 안 돼요. 제발요.', e: 'cry' },
        { show: 'reporter', e: 'neutral', at: 'r' },
        { c: 'reporter', t: '(멀리서 카메라를 내리며) …이건 안 쓸게요, 대표님. 대신 빨리 정리하세요. 다른 기자는 저처럼 안 참아요.', e: 'cold' },
        { hide: 'reporter' },
        {
          prompt: '하은의 빚을 어떻게 할까?',
          choice: [
            { t: '회사 돈으로 일단 전부 갚는다 (자금 2,000)', req: { v: { money: '>=2000' } }, hint: '자금 2,000 필요', fx: { v: { money: -2000, stress: -15 }, aff: { haeun: 15 }, flag: 'haeun_family_resolved' }, then: [{ c: 'haeun', t: '……대표님. 이거 제가 평생 갚을게요. 노래로, 무대로, 전부.', e: 'cry' }] },
            { t: '변호사와 함께 채무 조정을 밟는다 (자금 600)', if: { flag: 'haeun_lawyer' }, fx: { v: { money: -600, mental: 5, stress: -8 }, aff: { haeun: 10 }, flag: 'haeun_family_resolved' }, then: [{ t: '미리 선임해 둔 변호사가 불법 추심을 문제 삼자, 남자들은 두 번 다시 나타나지 않았다. 남은 빚은 10년 분할로 조정되었다.' }, { c: 'haeun', t: '그때 대표님이 변호사 얘기 안 했으면… 저 어떻게 됐을까요.', e: 'cry' }] },
            { t: '하은이 스스로 팬들에게 털어놓게 한다', fx: { v: { heart: 6, mental: 6, fans: 60, fame: 4, scandal: 5 }, flag: ['haeun_family_resolved', 'haeun_confessed'] }, then: [{ t: '하은은 팬카페에 손편지를 올렸다. "숨기고 웃어서 미안해요." 다음 날, "우리가 지킨다"는 해시태그가 트렌드 1위에 올랐다.' }, { fx: { aff: { haeun: 8, fanmaster: 6 } } }] },
            { t: '"네 가족 문제야. 회사가 나설 일이 아니야."', fx: { v: { stress: 18, scandal: 12 } }, then: [{ fx: { aff: { haeun: -15 } } }, { c: 'haeun', t: '……맞아요. 제 문제예요. 제가 알아서 할게요.', e: 'cold' }] },
          ],
        },
        { if: { flag: 'haeun_family_resolved' }, then: [{ bg: 'house_night' }, { t: '그 주말, 하은의 어머니가 회사로 반찬통 세 개를 보내왔다. 쪽지 한 장. "우리 딸 웃게 해줘서 고맙습니다."' }, { fx: { aff: { haeun: 3, manager: 2 } } }] },
      ],
      dojun: [
        { bg: 'hospital' },
        '리허설 도중, 도준이 무릎을 붙잡고 쓰러졌다. 연골 손상 재발. 의사는 두 달 휴식을 권했다.',
        { show: 'dojun', e: 'tired', at: 'c' },
        { c: 'dojun', t: '…또네요. 이 무릎이 또 저를 멈춰요.', e: 'cry' },
        '병실 문이 열렸다. 도준의 아버지였다. 손에는 전복죽 한 통.',
        '"…트랙 그만둘 때, 내가 한 말. 네 무릎보다 기록이 아까워서 한 말 아니었다. 네가 아플까 봐 겁이 나서 한 말이었다."',
        { c: 'dojun', t: '………그걸 왜 이제 말해요.', e: 'cry' },
        '"네 춤 영상, 다 봤다. 백 번은 봤다."',
        { t: '아버지가 나간 뒤, 도준은 오래 울었다. 그리고 노트를 펼쳐 밤새 무언가를 적었다.' },
        { fx: { v: { stamina: -5, stress: -10, mental: 6, songs: 1 }, flag: 'dojun_father_made_up' } },
        {
          prompt: '도준이 쓴 가사 <결승선>을 어떻게 할까?',
          choice: [
            { t: '곡으로 만들어 발표하자고 한다', fx: { v: { songs: 1, fame: 5, fans: 60 }, aff: { dojun: 10 }, flag: 'dojun_lyrics_public' }, then: [{ c: 'dojun', t: '…제 이름으로요? 작사 강도준?', e: 'surprised' }, { c: 'dojun', t: '……해볼게요. 아버지가 들을 수 있게.', e: 'smile' }] },
            { t: '아버지께만 들려드리자고 한다', fx: { v: { heart: 4 }, aff: { dojun: 8 } }, then: [{ c: 'dojun', t: '네. 이건… 한 사람한테만 들려주고 싶어요.', e: 'shy' }] },
          ],
        },
      ],
      chaerin: [
        { bg: 'press_room', fx: 'shake' },
        '<스냅>에 인터뷰 기사가 떴다. "전 매니저 장모 씨, 윤채린 아역 시절 비화 폭로 — 그 아이는 원래 문제아였다."',
        { show: 'chaerin', e: 'cold', at: 'c' },
        { c: 'chaerin', t: '……그 사람이에요. 제 출연료로 차 산 사람.', e: 'cold' },
        { c: 'chaerin', t: '이제 와서, 제가 다시 뜨니까, 또 저를 팔아먹네요.', e: 'angry' },
        { show: 'pd', e: 'angry', at: 'r' },
        { c: 'pd', t: '대표님. 그때 현장 기록, 스케줄표, 나 다 갖고 있어요. 10년 동안 못 버렸어.', e: 'angry' },
        {
          prompt: '어떻게 대응할까?',
          choice: [
            { t: '채린이 직접 진실을 말하게 하고, 회사가 법적으로 받친다 (자금 700)', fx: { v: { money: -700, mental: 10, heart: 5, fame: 8, fans: 100 }, aff: { chaerin: 15, pd: 6 }, flag: 'chaerin_confronted' }, then: [{ bg: 'press_room', fx: 'flash' }, { c: 'chaerin', t: '저는 아홉 살이었어요. 서른 시간을 깨어 있었고요. 이제는 그 아이 대신 제가 말할게요.', e: 'cold' }, { t: '기자회견은 생중계됐다. 백서진 감독의 증언과 자료가 더해지자, 여론은 한 시간 만에 뒤집혔다. 아역 인권법 개정 청원이 시작됐다.' }] },
            { t: '법무팀만 조용히 움직인다', fx: { v: { money: -400, stress: 6, scandal: 5 } }, then: [{ t: '정정 보도가 나갔지만 작게 실렸다. 채린은 한동안 휴대폰을 보지 않았다.' }, { fx: { aff: { chaerin: 3 } } }] },
            { t: '무대응으로 넘긴다', fx: { v: { stress: 15, scandal: 15, mental: -5 } }, then: [{ fx: { aff: { chaerin: -12 } } }, { c: 'chaerin', t: '……역시 어른들은 다 똑같네요.', e: 'cold' }] },
          ],
        },
      ],
    }),
    { fx: { flag: 'bs3' } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_others_fate = [
    { bg: 'practice_room' },
    '{s.starName}이 바빠진 사이, 연습실에는 {s.o1Name}과 {s.o2Name}이 남아 있었다.',
    perStar((id) => [{ show: OTHERS[id][0], e: 'neutral', at: 'l' }, { show: OTHERS[id][1], e: 'neutral', at: 'r' }]),
    {
      if: { flag: 'group_debut' },
      then: [
        { t: '{s.groupName}의 두 멤버. 센터 {s.starName} 옆에서, 둘도 조금씩 자기 팬을 만들어 가고 있었다.' },
        perStar((id) => [{ c: OTHERS[id][0], t: '대표님, 요즘 저희 이름도 부르는 팬분들 생겼어요.', e: 'smile' }, { c: OTHERS[id][1], t: '센터 옆자리도 나쁘지 않네요. 비 맞을 때 우산이 되니까.', e: 'smirk' }]),
        { fx: { v: { fans: 40, heart: 2 } } }, affOthers(4),
      ],
      else: [{
        if: { any: [{ flag: 'others_bond' }, { flag: 'promised_others' }] },
        then: [
          perStar((id) => [{ c: OTHERS[id][0], t: '대표님. 저희 둘이서 뭔가 해보고 싶어요. 듀엣이든, 유튜브든.', e: 'neutral' }, { c: OTHERS[id][1], t: '{s.starName} 덕분에 회사가 숨 쉬잖아요. 이제 저희 차례 달라고 하면… 욕심인가요.', e: 'worried' }]),
          {
            prompt: '두 사람의 미래는?',
            choice: [
              { t: '프로젝트 유닛으로 데뷔시킨다 (자금 1,000)', req: { v: { money: '>=1000' } }, hint: '자금 1,000 필요', fx: { v: { money: -1000, heart: 4 }, flag: 'others_debut' }, then: [affOthers(12), { t: '반년 뒤, 두 사람의 유닛 곡이 인디 차트 1위에 올랐다. {s.starName}이 누구보다 크게 울었다.' }, { fx: { v: { fans: 50 } } }] },
              { t: '더 좋은 회사로 가도록 추천서를 써준다', fx: { v: { heart: 5 }, flag: 'others_left_good' }, then: [affOthers(8), { t: '"여기서 배운 거, 절대 안 잊을게요." 두 사람은 큰 회사와 계약했다. 떠나는 날, 셋은 연습실 거울 앞에서 사진을 찍었다.' }] },
            ],
          },
        ],
        else: [
          perStar((id) => [{ c: OTHERS[id][1], t: '대표님. 저 타이탄이랑 계약했어요. 여기선… 제 자리가 없더라고요.', e: 'cold' }, { c: OTHERS[id][0], t: '저도 그만둘게요. 연예인 말고, 다른 거 해보려고요.', e: 'sad' }]),
          { t: '말릴 말이 없었다. 약속을 지키지 못한 건 회사였으니까.' },
          { fx: { v: { stress: 10, heart: -3 }, flag: 'others_left_bad' } }, affStar(-3),
        ],
      }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_summer = [
    trackBr(
      [
        { bg: 'stage_concert', fx: 'flash' },
        { title: '여름 페스티벌', sub: '물대포와 떼창' },
        '한여름 야외 페스티벌. 물대포가 터지고 3만 관객이 뛰었다.',
        showStar('laugh', 'c'),
        { if: { v: { stamina: '>=45' } }, then: [{ t: '물에 흠뻑 젖은 채 라이브를 끝까지 소화한 {s.starName}의 영상이 "페스티벌 찢었다"는 제목으로 퍼졌다.' }, { fx: { v: { fame: 6, fans: 80, stamina: -6 } } }], else: [{ t: '두 곡째에 숨이 턱까지 찼다. 무대는 해냈지만 대기실에서 산소캔을 붙잡았다.' }, { fx: { v: { fame: 3, fans: 30, stamina: -10, stress: 6 } } }] },
      ],
      [
        { bg: 'filming_set' },
        { title: '여름 광고 촬영', sub: '이온음료와 청춘' },
        '여름 이온음료 광고. 운동장을 달리는 청춘 콘셉트. 45도 땡볕.',
        showStar('smile', 'c'),
        { if: { v: { visual: '>=50' } }, then: [{ t: '편집본을 본 광고주가 전화를 걸어왔다. "이 친구로 가을 편도 찍읍시다."' }, { fx: { v: { fame: 5, fans: 60, money: 700 } } }], else: [{ t: '무난하게 촬영이 끝났다. 광고는 조용히 전파를 탔다.' }, { fx: { v: { fame: 2, fans: 20, money: 400 } } }] },
      ]
    ),
    say('여름이다, 대표님! 수박 사주세요!', 'laugh'),
    { hide: 'all' },
    END,
  ];

  scenes.ev_rookie_award = [
    { bg: 'awards' },
    { title: '연말 시상식', sub: '신인상' },
    '레드카펫. 플래시가 번개처럼 쏟아졌다. {s.starName}의 첫 시상식.',
    showStar('worried', 'c'),
    trackBr(
      [{ t: '"올해의 신인상 후보는…" 스크린에 다섯 명의 얼굴. 류세라의 얼굴은 없었다. 세라는 이미 3년 전에 신인상을 받았으니까.' }],
      [{ t: '"연기대상 신인연기상 후보는…" 스크린에 다섯 명의 얼굴이 떴다. 그중 {s.starName}의 얼굴이 가장 작은 회사 로고를 달고 있었다.' }]
    ),
    {
      if: { any: [{ all: [IDOL, { v: { fame: '>=38' } }] }, { all: [ACTOR, { v: { fame: '>=30', acting: '>=50' } }] }] },
      then: [
        { bg: 'awards', fx: 'flash' },
        { t: '"수상자는… 별빛 엔터테인먼트, {s.starName}!"' },
        perStar({
          haeun: [{ c: 'haeun', t: '저, 저 무대 공포증 있었거든요. 근데 이 자리는 하나도 안 무서워요. {s.fandom} 여러분이 저기 계시니까요!', e: 'cry' }, { c: 'haeun', t: '그리고 대표님. 저를 골라주셔서 고맙습니다. 엄마, 사랑해!', e: 'cry' }],
          dojun: [{ c: 'dojun', t: '…트랙에서 넘어졌을 때, 다시는 시상대에 못 설 줄 알았습니다.', e: 'cry' }, { c: 'dojun', t: '대표님, 실장님, {s.fandom}. 그리고… 아버지. 고맙습니다.', e: 'cry' }],
          chaerin: [{ c: 'chaerin', t: '열네 살 이후로 이런 데 올 일 없을 줄 알았어요.', e: 'sad' }, { c: 'chaerin', t: '이번엔 제가 선택해서 받은 상이에요. 저를 믿어준 대표님께 이 상을 드리고 싶어요.', e: 'cry' }],
        }),
        { fx: { v: { fame: 8, fans: 100, stress: -10 }, flag: 'rookie_award' } },
        affStar(8),
      ],
      else: [
        { t: '"수상자는… 류세라 선배의 소속사 후배, 타이탄의—" 이름이 불리지 않았다.' },
        { t: '{s.starName}은 끝까지 박수를 쳤다. 카메라가 그 얼굴을 잡았고, 그 장면이 "품격 있는 박수"라는 짤로 돌았다.' },
        { fx: { v: { fans: 40, heart: 3, mental: 3 } } },
      ],
    },
    { bg: 'street_seoul' },
    say('대표님, 내년엔 더 큰 상 받으러 와요.', 'smile'),
    { hide: 'all' },
    END,
  ];

  // ───────────────────────── 3년차: 상승 ─────────────────────────
  scenes.ev_y3 = [
    { bg: 'agency_office' },
    { title: '3년차', sub: '떡상의 해' },
    { show: 'manager', e: 'laugh', at: 'l' },
    { c: 'manager', t: '대표님, 사무실 이사 얘기 나와도 되겠습니다. 농담 반, 진담 반으로요.', e: 'laugh' },
    { t: '인기 {v.fame}. 팬덤 {v.fans}. 자금 {v.money}만 원.' },
    { if: { flag: 'rookie_award' }, then: [{ c: 'manager', t: '신인상 수상 이후로 광고 문의가 세 배입니다. 올해 목표는 본상이에요.', e: 'smile' }], else: [{ c: 'manager', t: '신인상은 놓쳤지만, 3년차가 진짜 승부처입니다. 여기서 뜨면 오래 갑니다.', e: 'neutral' }] },
    showStar('smile', 'r'),
    chatStar('3년차 첫날. 지난 2년을 돌아보고 올해 꼭 이루고 싶은 것을 이야기한다.', 3),
    { fx: { v: { stress: -5 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_comeback = [
    { bg: 'practice_room' },
    { title: '정규 1집', sub: '컴백 D-30' },
    { show: 'manager', e: 'neutral', at: 'l' },
    { c: 'manager', t: '첫 정규 앨범입니다. 타이틀곡이 전부예요. 세 곡 후보가 올라왔습니다.', e: 'neutral' },
    showStar('neutral', 'r'),
    {
      prompt: '타이틀곡은?',
      choice: [
        { t: '히트 작곡가의 곡 (자금 800)', req: { v: { money: '>=800' } }, hint: '자금 800 필요', fx: { v: { money: -800 }, flag: 'title_pro' }, then: [{ c: 'manager', t: '안전한 선택입니다. 차트인은 보장되죠.', e: 'smile' }] },
        { t: '{s.starName}의 자작곡', req: { v: { songs: '>=3' } }, hint: '작곡 작업을 더 해야 한다 (자작곡 3곡 이상)', fx: { v: { heart: 3 }, flag: 'self_title' }, then: [say('제 노래가… 타이틀이요? 진짜로요?', 'cry'), affStar(8)] },
        { t: '해외 작곡 팀의 트렌디한 곡 (자금 400)', fx: { v: { money: -400 }, flag: 'bought_track' }, then: [{ c: 'manager', t: '싸고 트렌디하네요. 근데 이 팀, 전에 좀 말이 있었던 데라…', e: 'worried' }] },
      ],
    },
    { bg: 'broadcast_studio' },
    '컴백 쇼케이스, 그리고 자정의 음원 공개. 대표와 {s.starName}은 사무실에서 새로고침만 눌렀다.',
    {
      if: { v: { fame: '>=65' }, any: [{ v: { vocal: '>=65' } }, { v: { dance: '>=65' } }] },
      then: [
        { bg: 'agency_office', fx: 'flash' },
        { t: '새벽 1시. 멜론, 지니, 벅스, 바이브, 플로. 전부 1위. 음원 차트 올킬.' },
        { show: 'manager', e: 'cry', at: 'l' },
        { c: 'manager', t: '대, 대표님… 올킬입니다. 20년 만에… 올킬…', e: 'cry' },
        say('대표님, 우리 해냈어요!', 'laugh'),
        { t: '그 주 음악방송 3관왕. 트리플 크라운.' },
        { fx: { v: { fame: 12, fans: 200, wins: 3, money: 1500 }, flag: ['comeback', 'hit_song', 'allkill'] } },
        affStar(6),
      ],
      else: [{
        if: { v: { fame: '>=38' } },
        then: [{ t: '실시간 차트 7위로 진입, 다음 날 4위까지 올랐다. 음방 1위 한 번.' }, { fx: { v: { fame: 7, fans: 110, wins: 1, money: 700 }, flag: ['comeback', 'hit_song'] } }],
        else: [{ t: '차트 42위 진입. 그래도 팬들이 스트리밍 총공을 이어갔다.' }, { fx: { v: { fame: 3, fans: 50, money: 200, stress: 6 }, flag: 'comeback' } }],
      }],
    },
    { if: { flag: ['self_title', 'hit_song'] }, then: [{ t: '"작사·작곡 {s.starName}". 크레딧 한 줄이 기사 제목이 됐다. "실력파 싱어송라이터의 탄생."' }, { fx: { v: { fame: 4, vocal: 2 }, flag: 'songwriter_known' } }] },
    { hide: 'all' },
    END,
  ];

  scenes.ev_plagiarism = [
    { bg: 'press_room', fx: 'shake' },
    { title: '표절 논란', sub: '실시간 검색어 1위' },
    '"{s.starName} 타이틀곡, 해외 곡 표절 의혹" 비교 영상이 새벽 사이 수백만 뷰를 찍었다.',
    showStar('worried', 'c'),
    {
      if: { flag: 'bought_track' },
      then: [
        { show: 'manager', e: 'angry', at: 'l' },
        { c: 'manager', t: '그 해외 작곡 팀… 다른 곡도 표절이었답니다. 우리 곡도 후렴 여덟 마디가 거의 같아요.', e: 'angry' },
        say('…제가 부른 노래가 남의 노래였어요?', 'cry'),
        {
          prompt: '어떻게 대응할까?',
          choice: [
            { t: '즉시 활동 중단, 음원 수익 전액 원작자에게', fx: { v: { money: -600, fame: -3, scandal: -5, heart: 6 }, flag: 'plagiarism_handled' }, then: [{ t: '빠르고 깨끗한 사과. 원작자가 오히려 SNS에 "{s.starName}은 피해자"라는 글을 올렸다.' }, affStar(4)] },
            { t: '"장르적 유사성일 뿐" 버틴다', fx: { v: { scandal: 25, fame: -8, fans: -100, stress: 10 } }, then: [{ t: '버틸수록 비교 영상이 늘어났다. 결국 곡은 음원 사이트에서 내려갔다.' }, affStar(-6)] },
          ],
        },
      ],
      else: [{
        if: { flag: 'self_title' },
        then: [
          say('저 표절 안 했어요. 그 곡, 들어본 적도 없어요!', 'angry'),
          {
            if: { v: { songs: '>=4' } },
            then: [{ t: '대표는 {s.starName}의 작업 폴더를 통째로 공개했다. 2년 치 음성 메모, 가사 노트, 수십 개의 데모. 날짜가 전부 찍혀 있었다.' }, { t: '여론이 뒤집혔다. "이 정도면 표절 의혹이 아니라 성실함 인증." 곡은 역주행을 시작했다.' }, { fx: { v: { fame: 8, fans: 120, mental: 5 }, flag: ['plagiarism_handled', 'songwriter_known'] } }, affStar(8)],
            else: [{ t: '증거가 부족했다. 의혹은 흐지부지 가라앉았지만, 꼬리표는 남았다.' }, { fx: { v: { scandal: 10, stress: 8 } } }],
          },
        ],
        else: [{ t: '히트 작곡가가 즉시 원본 작업 파일을 공개했다. 의혹은 하루 만에 해프닝으로 끝났다. 오히려 노이즈 마케팅이 됐다.' }, { fx: { v: { fame: 3, fans: 30, stress: 5 }, flag: 'plagiarism_handled' } }],
      }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_idol_drama = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'surprised', at: 'l' },
    { c: 'manager', t: '대표님, 드라마 조연 제의입니다! "연기돌" 한번 해보시겠냐고요.', e: 'surprised' },
    showStar('surprised', 'r'),
    perStar({
      haeun: [{ c: 'haeun', t: '제가 드라마요? 표정 관리 못 하는데… 근데 해보고 싶어요!', e: 'laugh' }],
      dojun: [{ c: 'dojun', t: '…드디어요. 기다렸습니다.', e: 'smirk' }],
      chaerin: [{ c: 'chaerin', t: '돌아가는 길이네요. 원래 제 자리로.', e: 'smile' }],
    }),
    {
      prompt: '드라마 제의를 받을까?',
      choice: [
        { t: '받는다 — 연기 활동을 병행한다', fx: { v: { acting: 4, fame: 5, fans: 60, stress: 8 }, flag: ['supporting', 'idol_acting'] }, then: [{ t: '첫 방송 후, "연기돌 편견 깼다"는 기사가 났다.' }] },
        { t: '거절한다 — 지금은 음악에 집중한다', fx: { v: { vocal: 2, dance: 2 } }, then: [say('네, 무대가 먼저죠!', 'smile')] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_drama_lead = [
    { bg: 'audition_hall' },
    { title: '주연 오디션', sub: '미니시리즈 <새벽의 온도>' },
    '백서진 감독의 새 미니시리즈. 주연 오디션에 톱배우 셋, 그리고 {s.starName}.',
    { show: 'pd', e: 'cold', at: 'r' },
    { c: 'pd', t: '주인공은 말을 잃은 사람이야. 16부 동안 대사가 서른 줄도 안 돼. 눈으로 해.', e: 'cold' },
    showStar('worried', 'l'),
    { t: '"레디… 액션."' },
    {
      if: { v: { acting: '>=62', mental: '>=40' } },
      then: [{ t: '대사 없이 3분. {s.starName}의 눈에서 눈물이 떨어지기 직전에 멈췄다. 떨어지지 않은 눈물이, 떨어진 눈물보다 무거웠다.' }, { c: 'pd', t: '……컷. 너로 간다. 다른 사람 다 돌려보내.', e: 'smile' }, { fx: { v: { fame: 10, fans: 120, acting: 4, money: 800 }, flag: 'lead_role', aff: { pd: 8 } } }, affStar(5), say('대표님… 저 주인공이에요. 제가요!', 'cry')],
      else: [{ t: '좋은 연기였다. 하지만 "아직 눈이 대사를 따라가요." 주연은 톱배우에게 돌아갔다.' }, { c: 'pd', t: '대신 두 번째 여주… 아니, 두 번째 역할 줄게. 다음엔 네 거다.', e: 'neutral' }, { fx: { v: { fame: 4, fans: 50, acting: 2, stress: 5 } } }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_lead_airing = [
    { bg: 'filming_set' },
    { title: '<새벽의 온도>', sub: '첫 방송' },
    '첫 방송 시청률 6.2%. 4회 11.8%. 8회에서 17%를 넘겼다.',
    showStar('smile', 'c'),
    { t: '{s.starName}이 대사 없이 우는 8회 엔딩 장면이 "올해의 엔딩"으로 불렸다.' },
    { show: 'mentor', e: 'smile', at: 'r' },
    { c: 'mentor', t: '(전화로) 허허, 얘야. 봤다. 울 뻔했다. 아니, 울었다. 늙으면 눈물이 헤퍼져.', e: 'laugh' },
    { fx: { v: { fame: 10, fans: 150, acting: 3, money: 1200 } } },
    affStar(4),
    { hide: 'all' },
    END,
  ];

  scenes.ev_tour1 = [
    { bg: 'airport', fx: 'flash' },
    { title: '첫 아시아 투어', sub: '도쿄 · 방콕 · 타이베이 · 마닐라' },
    '인천공항 출국장. 새벽인데도 팬들이 수백 명 모여 있었다. 공항 패션 사진이 실시간으로 올라왔다.',
    showStar('laugh', 'c'),
    say('대표님, 여권에 도장 찍히는 거 처음이에요!', 'laugh'),
    { bg: 'stage_concert', fx: 'flash' },
    '도쿄 공연. 한국어 가사를 떼창하는 일본 팬들. 방콕에선 공항부터 경찰이 동원됐다.',
    {
      prompt: '투어 일정을 어떻게 짤까?',
      choice: [
        { t: '도시 추가 — 4개 도시를 8개로 늘린다', fx: { v: { fans: 220, fame: 8, money: 2000, stamina: -15, stress: 18 }, flag: 'tour1' }, then: [{ t: '매진, 매진, 또 매진. 그러나 마지막 공연 날, {s.starName}의 목소리가 갈라졌다.' }] },
        { t: '원래대로 4개 도시, 쉬는 날 확보', fx: { v: { fans: 140, fame: 5, money: 1000, stamina: -5, stress: 5 }, flag: 'tour1' }, then: [{ t: '공연과 공연 사이, 방콕 야시장에서 먹은 망고밥이 {s.starName}의 인생 음식이 됐다.' }, affStar(4)] },
      ],
    },
    { fx: { v: { lang: 1 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_biff = [
    { bg: 'awards', fx: 'flash' },
    { title: '부산국제영화제', sub: '첫 레드카펫' },
    '해운대의 밤. 레드카펫 위로 가을 바람이 불었다.',
    showStar('smile', 'c'),
    { if: { flag: 'film_debut' }, then: [{ t: '데뷔작이었던 단편영화가 와이드 앵글 부문에 초청됐다. GV석이 매진됐다.' }, { fx: { v: { fame: 4 } } }] },
    { show: 'pd', e: 'smirk', at: 'r' },
    { c: 'pd', t: '저기 봐. 해외 세일즈사 사람들. 다 네 얼굴 보고 있어.', e: 'smirk' },
    { c: 'pd', t: '내년 영화, 이미 투자 들어왔어. 너 생각하면서 쓴 거야.', e: 'neutral' },
    { fx: { v: { fame: 6, fans: 80, acting: 2 }, flag: 'film_small', aff: { pd: 4 } } },
    affStar(2),
    { hide: 'all' },
    END,
  ];

  scenes.ev_reporter_deal = [
    { bg: 'cafe' },
    { show: 'reporter', e: 'smile', at: 'c' },
    { c: 'reporter', t: '대표님~ 커피 한잔해요. 제가 샀어요.', e: 'smile' },
    { c: 'reporter', t: '거래 하나 해요. 저한테 {s.starName} 사진이 하나 있어요. 새벽 클럽 앞. 아무 일도 없었지만, 제목 달기 나름이죠.', e: 'smirk' },
    { c: 'reporter', t: '대신… 타이탄 류세라 식단 관리 얘기, 대표님 아시는 거 있죠? 그거 주시면 이 사진은 영원히 제 폴더 안에.', e: 'cold' },
    {
      prompt: '황보람에게',
      choice: [
        { t: '세라 이야기를 넘긴다', fx: { v: { heart: -8, fame: 2 }, aff: { reporter: 6, rival: -15 }, flag: 'sold_sera' }, then: [{ t: '다음 날, 타이탄 식단 학대 기사가 1면을 장식했다. 세라는 일주일 동안 활동을 쉬었다. {s.starName}이 기사를 보며 굳은 얼굴로 대표를 봤다.' }, affStar(-8)] },
        { t: '"사진, 쓰세요. 대신 사실대로만."', fx: { v: { heart: 5, scandal: 6 }, aff: { reporter: 4 } }, then: [{ c: 'reporter', t: '…와. 이런 대표님 처음이네요. 알았어요. 사실대로만 쓸게요. 그럼 기사 가치가 없지만.', e: 'surprised' }, { t: '기사는 나오지 않았다.' }, { fx: { v: { scandal: -6 } } }] },
        { t: '"다음 컴백 단독 인터뷰를 드리죠." 역제안한다', fx: { v: { fame: 3 }, aff: { reporter: 8 } }, then: [{ c: 'reporter', t: '호호, 장사할 줄 아시네. 좋아요. 사진은 지울게요.', e: 'laugh' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_group_feud = [
    { bg: 'dorm', fx: 'shake' },
    '{s.groupName} 숙소. 새벽 두 시, 문이 쾅 닫히는 소리.',
    perStar((id) => [{ show: OTHERS[id][0], e: 'angry', at: 'l' }, { show: id, e: 'worried', at: 'c' }, { show: OTHERS[id][1], e: 'cold', at: 'r' }]),
    perStar((id) => [{ c: OTHERS[id][0], t: '예능, 광고, 드라마. 전부 {s.starName} 혼자네. 우리는 백댄서야?', e: 'angry' }, { c: OTHERS[id][1], t: '…나도 같은 생각이었어. 말을 안 했을 뿐이지.', e: 'cold' }, { c: id, t: '나도 쉬고 싶어! 나도 셋이서 무대 서는 게 제일 좋다고!', e: 'cry' }]),
    {
      prompt: '어떻게 할까?',
      choice: [
        { t: '개인 스케줄을 셋이 나눠 받도록 조정한다', fx: { v: { fame: -3, heart: 5, stress: -8 }, flag: 'group_strong' }, then: [affOthers(10), affStar(3), { t: '다음 달, 세 사람이 함께 나간 예능이 그룹 최고 시청률을 찍었다.' }] },
        { t: '센터 중심 전략을 유지한다', fx: { v: { fame: 3, stress: 8 }, flag: 'group_crack' }, then: [affOthers(-10), { t: '숙소 분위기가 차갑게 식었다. 무대 위 미소가 조금씩 어긋났다.' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_switch_track = [
    { bg: 'agency_office' },
    { show: 'pd', e: 'neutral', at: 'l' },
    { c: 'pd', t: '대표님, 솔직하게 말할게요. 저 친구, 무대보다 카메라가 더 사랑해요.', e: 'neutral' },
    { c: 'pd', t: '배우로 전향하면 제가 책임지고 키울게요. 대신 아이돌 활동은 사실상 끝이죠.', e: 'cold' },
    showStar('worried', 'r'),
    chatStar('아이돌에서 배우로 전향할지, 스타의 진짜 마음을 묻는다.', 3),
    {
      prompt: '길을 바꿀까?',
      choice: [
        { t: '배우로 전향한다', fx: { set: { track: 'actor', trackName: '배우' }, flag: ['switched_actor', 'supporting'], v: { acting: 5, fans: -80, fame: 2 } }, then: [say('…무대에 인사하고 올게요. 마지막 음방, 제대로 하고요.', 'cry'), { t: '마지막 음악방송. {s.fandom}이 "새 길도 함께"라는 슬로건을 들었다.' }] },
        { t: '아이돌로 남는다', fx: { v: { stress: -3 } }, then: [say('저는 아직 무대가 좋아요. 연기는 나중에 해도 되잖아요!', 'smile'), { c: 'pd', t: '…그래요. 언제든 연락해요.', e: 'smile' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_sera_fall = [
    { bg: 'broadcast_studio', fx: 'shake' },
    '음악방송 대기실 복도. 타이탄 대기실 문이 열리며 누군가 쓰러졌다. 류세라였다.',
    { show: 'rival', e: 'tired', at: 'r' },
    '타이탄 매니저들은 "리허설 늦는다"며 세라를 일으켜 세우려 했다.',
    showStar('surprised', 'l'),
    {
      prompt: '어떻게 할까?',
      choice: [
        { t: '119를 부르고 병원까지 동행한다', fx: { v: { heart: 8, stress: 4 }, aff: { rival: 20 }, flag: 'sera_saved' }, then: [{ bg: 'hospital' }, { c: 'rival', t: '…왜 도와줬어. 우리 경쟁자잖아.', e: 'cry' }, say('경쟁자니까요. 선배가 있어야 제가 더 잘하잖아요.', 'smile'), { c: 'rival', t: '……바보 같은 회사에 바보 같은 애들. 부럽다, 진짜로.', e: 'cry' }] },
        { t: '마태성에게 직접 항의한다', fx: { v: { heart: 5 }, aff: { rival: 12, rivalceo: -10 }, flag: 'sera_saved' }, then: [{ show: 'rivalceo', e: 'cold', at: 'c' }, { c: 'rivalceo', t: '남의 회사 일입니다, 사장님.', e: 'cold' }, { c: 'me', t: '사람 일입니다, 대표님.' }, { c: 'rivalceo', t: '……', e: 'neutral' }, { t: '다음 주, 타이탄이 세라의 활동 중단과 건강 관리를 공지했다.' }] },
        { t: '우리 무대에 집중한다', fx: { v: { stress: 3 } }, then: [{ t: '무대는 무사히 끝났다. 하지만 {s.starName}은 엔딩 포즈 내내 세라의 대기실 쪽을 보고 있었다.' }, affStar(-3)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_health = [
    { bg: 'hospital' },
    '스케줄 이동 중 밴 안에서 {s.starName}이 정신을 잃었다. 탈진과 영양실조.',
    showStar('tired', 'c'),
    { show: 'manager', e: 'angry', at: 'l' },
    { c: 'manager', t: '대표님. 체력 관리도 스케줄입니다. 애가 기계입니까?', e: 'angry' },
    say('…죄송해요. 제가 괜찮다고 해서…', 'tired'),
    { fx: { v: { stamina: 25, stress: -10, fame: -2, money: -150 } } },
    { toast: '긴급 휴식: 체력 회복, 인기 소폭 하락' },
    { hide: 'all' },
    END,
  ];

  scenes.ev_songwriter = [
    { bg: 'dorm' },
    '새벽 세 시, {s.starName}이 이어폰 한쪽을 내밀었다.',
    showStar('shy', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '들어볼래요? 엄마가 설거지하면서 부르던 멜로디에, 제가 가사 붙여봤어요.', e: 'shy' }],
      dojun: [{ c: 'dojun', t: '…노트에 쓴 거, 멜로디 붙여봤어요. 대표님이 처음 듣는 사람이에요.', e: 'shy' }],
      chaerin: [{ c: 'chaerin', t: '노래는 숨을 데가 없다고 했잖아요. 그래서 숨지 않는 노래를 써봤어요.', e: 'shy' }],
    }),
    '서툴지만 진짜였다. 3분 40초 동안, 대표는 아무 말도 하지 못했다.',
    {
      prompt: '이 곡을',
      choice: [
        { t: '앨범 수록곡으로 발표하자', fx: { v: { songs: 1, fame: 4, fans: 70, mental: 4 }, flag: 'songwriter_known' }, then: [say('진짜요? 제 이름이 크레딧에…!', 'cry'), affStar(6)] },
        { t: '팬미팅에서만 부르는 선물로 남기자', fx: { v: { fans: 60, heart: 4 } }, then: [say('{s.fandom}만 아는 노래. 그것도 좋네요.', 'smile'), affStar(4)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_bonsang = [
    { bg: 'awards' },
    { title: '연말 시상식', sub: '본상' },
    '두 번째 연말. 이번엔 대기실이 복도 끝이 아니었다.',
    showStar('neutral', 'c'),
    trackBr(
      [{
        if: { v: { fame: '>=85' } },
        then: [{ bg: 'awards', fx: 'flash' }, { t: '"본상 수상자… {s.starName}!"' }, say('작년엔 박수 치러 왔는데, 올해는 박수 받으러 왔네요. {s.fandom}, 사랑해요!', 'cry'), { fx: { v: { fame: 8, fans: 150, awards: 1 }, flag: 'bonsang' } }, affStar(5)],
        else: [{ t: '본상은 다른 이름들에게 돌아갔다. 대신 "베스트 퍼포먼스상"이 {s.starName}에게 주어졌다.' }, { fx: { v: { fame: 3, fans: 60 } } }],
      }],
      [{
        if: { v: { acting: '>=65', fame: '>=70' } },
        then: [{ bg: 'awards', fx: 'flash' }, { t: '"우수연기상… {s.starName}!"' }, say('카메라가 저를 먹어버릴 줄 알았는데, 카메라가 저를 살렸어요. 감사합니다.', 'cry'), { fx: { v: { fame: 8, fans: 120, awards: 1 }, flag: 'bonsang' } }, affStar(5)],
        else: [{ t: '우수상은 선배 배우에게 돌아갔다. {s.starName}은 "베스트 커플상"을 받고 멋쩍게 웃었다.' }, { fx: { v: { fame: 3, fans: 50 } } }],
      }]
    ),
    { hide: 'all' },
    END,
  ];

  scenes.ev_scandal_bomb = [
    { bg: 'press_room', fx: 'shake' },
    { title: '폭로', sub: '익명 커뮤니티 글 하나' },
    '"{s.starName}의 진짜 모습 폭로합니다." 익명 글 하나에 그동안 쌓인 논란이 한꺼번에 소환됐다.',
    showStar('cry', 'c'),
    { show: 'fanmaster', e: 'worried', at: 'r' },
    { c: 'fanmaster', t: '대표님, 팬덤도 흔들려요. 회사가 뭐라도 말해줘야 해요.', e: 'worried' },
    {
      prompt: '대응은?',
      choice: [
        { t: '사실관계를 하나하나 밝히고, 잘못은 인정한다', fx: { v: { scandal: -25, fame: -4, heart: 5 } }, then: [{ t: '긴 해명문. 인정할 건 인정하고, 거짓은 증거로 반박했다. 여론은 천천히 돌아섰다.' }, affStar(5), { fx: { aff: { fanmaster: 5 } } }] },
        { t: '법적 대응만 공지한다 (자금 500)', fx: { v: { money: -500, scandal: -10 } }, then: [{ t: '글쓴이는 특정됐지만, 이미 퍼진 이야기는 주워 담을 수 없었다.' }] },
        { t: '아무 대응도 하지 않는다', fx: { v: { scandal: 15, fans: -150, stress: 15 } }, then: [{ t: '침묵은 인정으로 읽혔다.' }, affStar(-5)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_rand_letter = [
    { bg: 'agency_office' },
    '사무실로 팬레터 한 상자가 도착했다. 맨 위 편지 한 장.',
    { t: '"취업에 다섯 번 떨어졌어요. 그래도 {s.starName} 무대 보고 여섯 번째 원서를 냈어요. 붙었어요. 고마워요."' },
    showStar('cry', 'c'),
    say('…대표님. 제가 누군가한테 이런 사람이에요?', 'cry'),
    { fx: { v: { mental: 3, stress: -6, fans: 10 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_rand_rest = [
    { bg: 'agency_office' },
    { show: 'manager', e: 'worried', at: 'c' },
    { c: 'manager', t: '대표님, 요즘 {s.starName} 표정 보셨습니까. 웃는데 눈이 안 웃어요.', e: 'worried' },
    { c: 'manager', t: '이건 제가 20년 해봐서 아는데요, 이럴 때 한 번 쉬어주는 게 1년을 버는 겁니다.', e: 'neutral' },
    {
      prompt: '어떻게 할까?',
      choice: [
        { t: '이번 주는 전부 비운다', fx: { v: { stress: -15, fame: -1 } }, then: [affStar(3), { t: '하루 종일 잠만 잔 {s.starName}이 저녁에 부스스한 얼굴로 나와 "살 것 같아요"라고 말했다.' }] },
        { t: '"조금만 더 버티자."', fx: { v: { stress: 3 }, aff: { manager: -3 } }, then: [{ c: 'manager', t: '…예. 대표님 판단이시니까.', e: 'cold' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  // ───────────────────────── 4년차: 정점 ─────────────────────────
  scenes.ev_y4 = [
    { bg: 'agency_office' },
    { title: '4년차', sub: '마지막 해' },
    { show: 'manager', e: 'neutral', at: 'l' },
    { c: 'manager', t: '대표님. 약속한 4년의 마지막 해입니다. 연말엔 재계약 얘기도 해야 하고요.', e: 'neutral' },
    { t: '인기 {v.fame}. 팬덤 {v.fans}. 자금 {v.money}만 원.' },
    { c: 'manager', t: '4년 전에 저 지하실에서 컵라면 먹던 거 생각하면… 이건 제가 20년 해봐서 아는데요, 꿈 같은 겁니다.', e: 'smile' },
    showStar('smile', 'r'),
    chatStar('약속한 4년의 마지막 해 첫날. 지금까지의 길과 마지막 목표, 그리고 그 이후에 대해 이야기한다.', 4),
    { fx: { v: { stress: -5 } } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_world_tour = [
    { bg: 'airport', fx: 'flash' },
    { title: '월드 투어', sub: '서울에서 LA까지' },
    { show: 'manager', e: 'cry', at: 'l' },
    { c: 'manager', t: '대표님… 월드 투어입니다. 북미, 유럽, 남미. 스타디움 공연도 두 번 있습니다.', e: 'cry' },
    showStar('laugh', 'r'),
    say('지하 연습실에서 시작해서… 스타디움이요?', 'surprised'),
    { bg: 'stage_concert', fx: 'flash' },
    '런던. 파리. 뉴욕. 상파울루. 객석엔 서로 다른 언어로 된 슬로건. 그리고 전부 같은 이름, {s.fandom}.',
    {
      if: { v: { stamina: '>=50' } },
      then: [{ t: '32회 공연을 완주했다. 마지막 LA 공연, 7만 명이 한국어로 떼창을 했다.' }, { fx: { v: { fans: 400, fame: 10, money: 4000, stamina: -15, stress: 12, lang: 2 }, flag: 'world_tour' } }],
      else: [{ t: '투어 중반, 체력이 바닥났다. 세 도시 공연을 취소해야 했다. 그래도 나머지 무대는 전설이 됐다.' }, { fx: { v: { fans: 250, fame: 6, money: 2500, stamina: -20, stress: 18, lang: 1 }, flag: 'world_tour' } }],
    },
    affStar(5),
    { hide: 'all' },
    END,
  ];

  scenes.ev_billboard = [
    { bg: 'agency_office' },
    '새벽 네 시, 대표의 휴대폰이 울렸다. 미국 현지 프로모터였다.',
    {
      if: { v: { fans: '>=2300', fame: '>=140' } },
      then: [
        { bg: 'agency_office', fx: 'flash' },
        { t: '"빌보드 핫 100, 9위. 메인 차트 톱 10입니다."' },
        { show: 'manager', e: 'surprised', at: 'l' },
        { c: 'manager', t: '핫… 100… 대표님, 저 지금 꿈꾸는 거 맞죠? 꼬집어 주세요.', e: 'surprised' },
        showStar('cry', 'r'),
        say('대표님. 우리 지하실… 거기서 여기까지 왔어요.', 'cry'),
        { fx: { v: { fame: 15, fans: 500 }, flag: 'billboard' } },
        affStar(6),
      ],
      else: [{ t: '"빌보드 200, 47위. 첫 진입입니다." 대단한 기록이었다. 하지만 정상까지는 한 걸음이 더 남아 있었다.' }, { fx: { v: { fame: 6, fans: 150 }, flag: 'billboard_near' } }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_baeksang = [
    { bg: 'awards' },
    { title: '백상예술대상', sub: '방송·영화를 아우르는 밤' },
    '5월의 시상식. 방송 부문 후보에 {s.starName}의 이름이 올랐다.',
    showStar('worried', 'c'),
    {
      if: { v: { acting: '>=75', fame: '>=90' }, flag: 'lead_role' },
      then: [{ bg: 'awards', fx: 'flash' }, { t: '"TV 부문 최우수연기상… {s.starName}!"' }, say('대사가 서른 줄도 안 되는 역할이었어요. 그래서 더 많이 말할 수 있었던 것 같아요.', 'cry'), { fx: { v: { fame: 10, fans: 150, awards: 1 }, flag: 'award_baeksang' } }, { show: 'pd', e: 'cry', at: 'r' }, { c: 'pd', t: '(객석에서) …빚, 이제 좀 갚은 것 같다.', e: 'cry' }, affStar(5)],
      else: [{ t: '수상은 선배 배우에게 돌아갔다. 인기상을 받은 {s.starName}은 "다음엔 저 트로피 받을게요"라며 웃었다.' }, { fx: { v: { fame: 4, fans: 60 } } }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_film_offer = [
    { bg: 'cafe' },
    { show: 'pd', e: 'smirk', at: 'l' },
    { c: 'pd', t: '약속한 영화. 제목은 <침묵의 계절>. 주연이야. 투자 끝났고, 칸 출품 목표.', e: 'smirk' },
    showStar('surprised', 'r'),
    { c: 'pd', t: '석 달 동안 섬에서 찍어. 휴대폰 없이, 스케줄 없이. 대신 인생 연기를 가져와.', e: 'neutral' },
    {
      prompt: '영화 주연을 맡을까?',
      choice: [
        { t: '맡는다 — 석 달, 다른 모든 걸 멈춘다', fx: { v: { acting: 8, mental: 4, fame: -3, money: 1500, stress: 10 }, flag: 'film_lead', aff: { pd: 8 } }, then: [{ bg: 'filming_set' }, { t: '섬의 겨울. 파도 소리와 슬레이트 소리만 있는 석 달. {s.starName}은 매일 조금씩 다른 사람이 되어 갔다.' }, affStar(4)] },
        { t: '광고와 드라마 스케줄을 우선한다', fx: { v: { fame: 5, money: 2000 }, aff: { pd: -8 } }, then: [{ c: 'pd', t: '…돈이 먼저구나. 알겠어. 다른 배우 찾을게.', e: 'cold' }] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_cannes = [
    { bg: 'airport' },
    { title: '칸 영화제', sub: '경쟁 부문 공식 초청' },
    '<침묵의 계절>이 칸 영화제 경쟁 부문에 초청됐다. 뤼미에르 극장의 레드카펫.',
    { bg: 'awards', fx: 'flash' },
    showStar('neutral', 'c'),
    { show: 'pd', e: 'smile', at: 'r' },
    '상영이 끝나자 기립박수가 9분 동안 이어졌다.',
    {
      if: { v: { acting: '>=90', mental: '>=65', fame: '>=110' } },
      then: [{ t: '폐막식. 심사위원장이 봉투를 열었다. "여우주연상… 아니, 이 해엔 이렇게 부릅니다. 최우수 연기상. <침묵의 계절>, {s.starName}."' }, say('……', 'cry'), { t: '{s.starName}은 한국어로 소감을 말했다. "대사 없이 우는 법을 가르쳐준 모든 사람에게." 통역이 필요 없었다.' }, { fx: { v: { fame: 20, fans: 400, awards: 1 }, flag: 'cannes_win' } }, affStar(8)],
      else: [{ t: '수상은 불발됐다. 하지만 현지 매체는 "올해 칸이 발견한 얼굴"로 {s.starName}을 꼽았다.' }, { fx: { v: { fame: 10, fans: 180, lang: 1 }, flag: 'cannes_invited' } }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_hollywood = [
    { bg: 'agency_office' },
    '영문 이메일 한 통. 발신인은 할리우드 대형 에이전시였다.',
    { show: 'manager', e: 'surprised', at: 'l' },
    { c: 'manager', t: '대표님, 할리우드 스튜디오 시리즈 조연 제의입니다. 오디션 테이프 보내 달랍니다.', e: 'surprised' },
    showStar('surprised', 'r'),
    {
      if: { v: { lang: '>=3' } },
      then: [{ t: '영어 대사 테이프를 보낸 지 사흘 만에 답장이 왔다. "Callback. LA로 와 주세요."' }],
      else: [{ t: '영어 대사가 조금 어색했다. 그래도 "눈빛만으로 충분하다"며 콜백이 왔다.' }],
    },
    {
      prompt: '할리우드로 갈까?',
      choice: [
        { t: '간다 — 세계 무대에 도전한다', req: { v: { acting: '>=85', lang: '>=3' } }, hint: '연기 85·외국어 3 이상', fx: { v: { fame: 10, fans: 200, stress: 10, lang: 1 }, flag: 'hollywood_yes' }, then: [say('대표님도 같이 가요. 혼자는 안 가요.', 'smile'), { c: 'me', t: '당연하지. 영어는 못 해도 도시락은 챙길게.' }] },
        { t: '아직은 한국에서 뿌리를 내린다', fx: { v: { mental: 3 } }, then: [say('다음에. 더 단단해지면 그때 가요.', 'neutral')] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_poach3 = [
    { bg: 'cafe' },
    '재계약 시즌. 마태성이 이번엔 대표를 먼저 불렀다.',
    { show: 'rivalceo', e: 'neutral', at: 'c' },
    { c: 'rivalceo', t: '사장님. 이번엔 진심으로 말씀드리죠. {s.starName}, 타이탄으로 보내주십시오. 계약금 20억.', e: 'neutral' },
    { c: 'rivalceo', t: '사장님 회사로는 저 아이의 다음 10년을 감당 못 합니다. 그건 사장님도 아시잖습니까.', e: 'cold' },
    { if: { flag: 'titan_invest' }, then: [{ c: 'rivalceo', t: '그리고 잊으셨습니까. 우선 협상권, 저희에게 있습니다.', e: 'smirk' }] },
    {
      prompt: '마태성에게',
      choice: [
        { t: '"결정은 {s.starName}이 합니다. 저는 그 결정을 지킬 뿐이에요."', fx: { v: { heart: 3 } }, then: [{ c: 'rivalceo', t: '……사장님 삼촌도 똑같은 말을 했었죠. 제 첫 가수를 데려가던 날.', e: 'sad' }, { c: 'rivalceo', t: '그때 저는 졌습니다. 이번엔 어떨지 보죠.', e: 'neutral' }, { fx: { aff: { rivalceo: 6 } } }] },
        { t: '"20억보다 비싼 게 있다는 걸 보여드리죠."', fx: { v: { mental: 3 } }, then: [{ c: 'rivalceo', t: '의리입니까? 추억입니까? …하, 시장은 감정을 기억하지 않는다고 했는데.', e: 'smirk' }, { c: 'rivalceo', t: '가끔은 기억하나 봅니다.', e: 'smile' }] },
        { t: '제안을 진지하게 검토한다', fx: { flag: 'considering_titan' }, then: [{ t: '그날 밤, {s.starName}은 대표의 메일함을 우연히 보았다. 타이탄 계약서 초안.' }, affStar(-12)] },
      ],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_producer_dream = [
    { bg: 'practice_room' },
    '텅 빈 연습실. {s.starName}이 금 간 거울 앞에 앉아 있었다. 4년 전 그 거울.',
    showStar('neutral', 'c'),
    say('대표님. 저 요즘 이상한 생각을 해요.', 'neutral'),
    perStar({
      haeun: [{ c: 'haeun', t: '나 같은 애들 있잖아요. 무대가 무서운데 노래는 하고 싶은 애들. 그런 애들 곡 써주고, 옆에서 손잡아주고 싶어요.', e: 'shy' }],
      dojun: [{ c: 'dojun', t: '다친 애들. 한 번 넘어진 애들. 그런 애들로 팀 하나 만들어보고 싶어요. 제가 가사 쓰고.', e: 'smirk' }],
      chaerin: [{ c: 'chaerin', t: '아역들이요. 현장에서 아무도 안 지켜주는 애들. 제가 지켜주는 회사, 만들고 싶어요.', e: 'sad' }],
    }),
    { c: 'me', t: '제작자가 되고 싶다는 거야?' },
    say('…대표님처럼요. 대표님이 저한테 해준 거, 누군가한테 해주고 싶어요.', 'shy'),
    { fx: { flag: 'producer_dream' } },
    affStar(6),
    { hide: 'all' },
    END,
  ];

  scenes.ev_retire_talk = [
    { bg: 'han_river' },
    '한강. 스케줄 사이 두 시간의 틈. {s.starName}이 편의점 커피를 두 손으로 감싸고 있었다.',
    showStar('tired', 'c'),
    say('대표님. 화내지 말고 들어주세요.', 'tired'),
    say('저… 요즘 쉬는 꿈을 꿔요. 아무도 저를 모르는 동네에서, 그냥 사는 꿈.', 'sad'),
    chatStar('지친 스타가 은퇴나 긴 휴식을 조심스럽게 꺼낸다. 대표는 그 마음을 듣는다.', 4),
    { fx: { flag: 'retire_talk' } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_mentor2 = [
    { bg: 'stage_concert' },
    { title: '남궁현 32주년 콘서트', sub: '마지막 게스트' },
    { show: 'mentor', e: 'smile', at: 'l' },
    { c: 'mentor', t: '허허, 오늘 게스트는 내 늦둥이 제자다. 박수!', e: 'laugh' },
    showStar('shy', 'r'),
    '두 사람의 듀엣. 서른두 해의 목소리와 네 해의 목소리가 겹쳤다.',
    { c: 'mentor', t: '(무대 뒤에서) 얘야, 이제 내가 가르칠 건 없다. 하나만 기억해라. 내려올 때도 무대다.', e: 'neutral' },
    { fx: { v: { vocal: 3, acting: 3, mental: 5, fame: 4, fans: 60 }, aff: { mentor: 8 } } },
    affStar(3),
    { hide: 'all' },
    END,
  ];

  scenes.ev_sera_redemption = [
    { bg: 'rooftop_night' },
    '별빛 엔터 옥상. 뜻밖의 손님이 찾아왔다.',
    { show: 'rival', e: 'shy', at: 'l' },
    { c: 'rival', t: '…나 타이탄 나왔어. 계약 끝났거든. 대표님이 순순히 보내주더라. 좀 의외였어.', e: 'neutral' },
    showStar('surprised', 'r'),
    { c: 'rival', t: '그때 병원, 고마웠어. 처음으로 무대 말고 사람 취급 받은 것 같았어.', e: 'shy' },
    {
      if: { aff: { rival: '>=45' } },
      then: [{ c: 'rival', t: '…여기, 나 같은 애 받아줄 자리 있어? 월급 적어도 돼. 방울토마토 말고 밥 먹는 회사면.', e: 'cry' }, { c: 'me', t: '밥은 실장님이 책임질 거야.' }, { t: '류세라가 별빛 엔터테인먼트와 계약했다는 기사에, 업계가 발칵 뒤집혔다.' }, { fx: { v: { fame: 6, fans: 120 }, flag: 'sera_joined', aff: { rival: 10 } } }],
      else: [{ c: 'rival', t: '솔로로 해볼 거야. 이번엔 즐겁게. …너도 그렇게 해.', e: 'smile' }, { fx: { v: { mental: 3 } } }],
    },
    { hide: 'all' },
    END,
  ];

  scenes.ev_national = [
    { bg: 'street_seoul' },
    '어느 날부터 사람들이 {s.starName}을 다른 이름으로 부르기 시작했다.',
    perStar({
      haeun: [{ t: '"국민 여동생." 공익광고 속 하은의 미소가 지하철역마다 걸렸다. 시장 할머니들이 "하은이 왔네" 하며 떡을 쥐여줬다.' }],
      dojun: [{ t: '"국민 남동생." 무뚝뚝하게 할머니 짐을 들어주는 영상이 퍼졌다. "우리 도준이"라는 말이 아줌마 커뮤니티에 넘쳐났다.' }],
      chaerin: [{ t: '"국민 딸"이 돌아왔다. 이번엔 누구도 꼬집지 않은, 스스로 웃는 얼굴로. 아역 인권 캠페인 광고에 채린이 나왔다.' }],
    }),
    showStar('shy', 'c'),
    say('대표님, 시장 가면 반찬을 막 주세요. 다 먹을 수가 없어요.', 'laugh'),
    { fx: { v: { fame: 6, fans: 100, heart: 3 }, flag: 'national_love' } },
    { hide: 'all' },
    END,
  ];

  scenes.ev_final_eve = [
    { bg: 'rooftop_night' },
    { title: '12월', sub: '마지막 시상식 전야' },
    '4년 전 그 옥상. 서울의 불빛은 그대로인데, 모든 게 달라져 있었다.',
    showStar('smile', 'c'),
    perStar({
      haeun: [{ c: 'haeun', t: '기억나요? 4년 뒤에 여기서 트로피 들고 사진 찍자고 했던 거.', e: 'smile' }],
      dojun: [{ c: 'dojun', t: '400m보다 긴 4년이었네요. 이제 마지막 코너예요.', e: 'smirk' }],
      chaerin: [{ c: 'chaerin', t: '4년이요. 계약서에 적으라고 했던 거, 기억나요? 말이 날아갈까 봐.', e: 'smile' }, { c: 'chaerin', t: '…안 날아갔네요. 대표님 말은.', e: 'shy' }],
    }),
    chatStar('마지막 시상식 전날 밤. 4년을 돌아보며 가장 기억에 남는 순간과 고마움을 나눈다.', 5),
    affStar(3),
    { hide: 'all' },
    END,
  ];

  // ───────────────────────── 피날레 ─────────────────────────
  scenes.finale = [
    { bg: 'black' },
    { title: '4년차 12월 31일', sub: '별이 되는 밤' },
    { bg: 'awards' },
    '연말 시상식. 레드카펫 끝, 별빛 엔터테인먼트의 대기실엔 이제 이름표가 붙어 있었다.',
    { show: 'manager', e: 'cry', at: 'l' },
    { c: 'manager', t: '대표님, 저 오늘 울면 안 되는데… 이미 울고 있네요. 하하.', e: 'cry' },
    { hide: 'manager' },
    showStar('neutral', 'c'),
    trackBr(
      [
        { t: '"올해의 가수, 대상 후보를 발표합니다."' },
        {
          if: { v: { fame: '>=145', fans: '>=2000', wins: '>=5' } },
          then: [
            { bg: 'awards', fx: 'flash' },
            { t: '"대상… 별빛 엔터테인먼트, {s.starName}!"' },
            perStar({
              haeun: [{ c: 'haeun', t: '무대가 무서웠던 아이가 있었어요. 편의점에서 새벽에 노래 연습하던 아이요.', e: 'cry' }, { c: 'haeun', t: '그 아이한테 말해주고 싶어요. 너 괜찮아. 끝까지 불러도 돼. …대표님, {s.fandom}, 엄마. 사랑해요!', e: 'cry' }],
              dojun: [{ c: 'dojun', t: '넘어진 놈이 여기까지 왔습니다.', e: 'cry' }, { c: 'dojun', t: '다시 뛰게 해준 대표님, 옆에서 같이 뛴 {s.fandom}. 그리고 객석 어딘가 계실 아버지. …결승선, 통과했습니다.', e: 'cry' }],
              chaerin: [{ c: 'chaerin', t: '예전에 누가 저한테 "한 번만 더"라고 했어요. 서른두 번이나.', e: 'cry' }, { c: 'chaerin', t: '오늘은 제가 말할게요. 한 번만 더, 무대에 서고 싶어요. 제가 원해서요. 고마워요, 대표님.', e: 'smile' }],
            }),
            { fx: { v: { awards: 1 }, flag: 'award_daesang' } },
          ],
          else: [{
            if: { v: { fame: '>=95' } },
            then: [{ t: '대상은 다른 이름이었다. 하지만 {s.starName}은 2년 연속 본상을 받았다. 객석의 {s.fandom}이 누구보다 크게 환호했다.' }, { fx: { flag: 'award_bonsang2' } }],
            else: [{ t: '올해는 무관이었다. {s.starName}은 끝까지 박수를 치며 동료들의 수상을 축하했다.' }],
          }],
        },
      ],
      [
        { t: '"연기대상 후보를 발표합니다."' },
        {
          if: { v: { acting: '>=88', fame: '>=125' }, flag: 'lead_role' },
          then: [
            { bg: 'awards', fx: 'flash' },
            { t: '"올해의 연기대상… {s.starName}!"' },
            perStar({
              haeun: [{ c: 'haeun', t: '노래만 할 줄 알았던 제가 연기로 이 자리에 섰어요. 노래도 연기도 결국 이야기였어요.', e: 'cry' }],
              dojun: [{ c: 'dojun', t: '느려도 되고 넘어져도 되는 곳. 연기가 저한테 그런 곳이었습니다. 대표님, 감사합니다.', e: 'cry' }],
              chaerin: [{ c: 'chaerin', t: '아홉 살 때 이 무대 뒤에서 울던 아이가 있었어요. 오늘은 그 아이가 앞에 서 있어요.', e: 'cry' }, { c: 'chaerin', t: '대표님. 저 이제 알아요. 저, 연기 좋아해요.', e: 'smile' }],
            }),
            { fx: { v: { awards: 1 }, flag: 'award_acting_daesang' } },
          ],
          else: [{
            if: { v: { acting: '>=72' } },
            then: [{ t: '대상은 선배에게 돌아갔지만, {s.starName}은 최우수연기상을 품에 안았다.' }, { fx: { flag: 'award_excellence' } }],
            else: [{ t: '올해 연기대상에서 {s.starName}의 이름은 불리지 않았다. 그래도 {s.starName}은 끝까지 객석을 지켰다.' }],
          }],
        },
        {
          if: { flag: 'film_lead', v: { acting: '>=82', fame: '>=100' } },
          then: [{ t: '그리고 한 달 전 청룡영화상. <침묵의 계절>의 {s.starName}이 주연상을 받았다는 사실이, 오늘 밤 다시 소개되었다.' }, { fx: { flag: 'award_bluedragon' } }],
        },
      ]
    ),
    { if: { flag: 'world_tour' }, then: [{ bg: 'stage_concert', fx: 'flash' }, { t: '시상식이 끝난 자정, 월드 투어 앵콜 공연. 서울 주경기장 6만 석이 {s.fandom}의 불빛으로 가득 찼다.' }] },
    { if: { any: [{ flag: 'group_debut' }, { flag: 'others_debut' }] }, then: [perStar((id) => [{ show: OTHERS[id][0], e: 'smile', at: 'l' }, { show: OTHERS[id][1], e: 'smile', at: 'r' }]), { t: '{s.o1Name}과 {s.o2Name}이 무대 뒤에서 꽃다발을 들고 기다리고 있었다. 셋이 함께 연습실 거울 앞에 섰던 4년 전처럼.' }, perStar((id) => [{ hide: OTHERS[id][0] }, { hide: OTHERS[id][1] }])] },
    { if: { flag: 'sera_joined' }, then: [{ show: 'rival', e: 'smile', at: 'l' }, { c: 'rival', t: '축하해. …다음엔 내가 받는다. 같은 회사라고 봐주는 거 없어.', e: 'smirk' }, { hide: 'rival' }] },
    { bg: 'rooftop_night' },
    { title: '재계약', sub: '4년의 약속, 그다음' },
    '새벽 두 시. 모든 게 시작된 옥상. 대표의 손에는 재계약서가 들려 있었다.',
    showStar('neutral', 'c'),
    {
      if: { any: [{ all: [{ flag: 'titan_offer' }, starAff('<40')] }, { all: [{ flag: 'titan_invest' }, starAff('<55')] }, { all: [{ flag: 'considering_titan' }, starAff('<60')] }] },
      then: [
        say('대표님. 먼저 말할게요.', 'cold'),
        say('타이탄이랑 계약했어요. 어제 도장 찍었어요. …미안해요. 근데 대표님도 저를 붙잡지 않았잖아요.', 'sad'),
        { t: '재계약서가 바람에 날렸다. 아무도 줍지 않았다.' },
        { fx: { flag: 'transferred' } },
      ],
      else: [
        chatStar('4년 계약이 끝나는 밤. 재계약과 앞으로의 길에 대해 진심으로 이야기한다.', 5),
        {
          prompt: '{s.starName}에게 무엇을 내밀까?',
          choice: [
            { t: '"다음 4년도 같이 가자." 재계약서를 내민다', fx: { flag: 'renewed' }, then: [say('…펜 주세요. 이번엔 망설임 없이 쓸게요.', 'smile')] },
            { t: '"평생 파트너로 가자." 특별한 약속을 한다', if: starAff('>=85'), req: starAff('>=92'), hint: '신뢰가 더 깊어야 한다 (신뢰 92 이상)', fx: { flag: ['renewed', 'forever'] }, then: [say('평생이요? 대표님, 그거 계약서엔 못 적는 말이에요.', 'cry'), say('…그러니까 더 좋아요. 약속해요.', 'smile')] },
            { t: '"네 회사를 차려. 내가 첫 투자자가 될게."', if: { flag: 'producer_dream' }, fx: { flag: ['renewed', 'producer_path'] }, then: [say('……대표님. 그거 제가 제일 듣고 싶던 말이에요.', 'cry')] },
            { t: '"쉬고 싶으면, 이제 쉬어도 돼."', if: { any: [{ flag: 'retire_talk' }, { v: { stress: '>=60' } }] }, fx: { flag: 'retire' }, then: [say('…고마워요. 무대에서 내려와도, 대표님은 제 대표님이에요.', 'cry')] },
            { t: '"더 큰 회사로 가. 너는 그럴 자격이 있어."', fx: { flag: 'transferred_blessed' }, then: [say('……바보. 그런 말 하면 제가 어떻게 가요.', 'cry'), { if: starAff('>=60'), then: [say('안 가요. 재계약서 이리 주세요.', 'smile'), { fx: { flag: 'renewed' } }], else: [say('…고마워요. 대표님 덕분에 여기까지 왔어요.', 'sad'), { fx: { flag: 'transferred' } }] }] },
          ],
        },
      ],
    },
    { t: '서울의 새벽이 밝아오고 있었다.' },
    { hide: 'all' },
    { ending: 'auto' },
  ];

  // ───────────────────────── 엔딩 ─────────────────────────
  const NAMES = { haeun: ['하은', '한하은'], dojun: ['도준', '강도준'], chaerin: ['채린', '윤채린'] };
  const endings = {};
  const endingRules = [];
  const fill = (str, id) => str.replace(/\{S\}/g, NAMES[id][0]).replace(/\{F\}/g, NAMES[id][1]);
  const mergeCond = (cond, id) => {
    const out = Object.assign({}, cond);
    out.s = Object.assign({}, cond.s || {}, { star: id });
    return out;
  };
  // 스타별 변형 엔딩을 만든다. d: {title, rank, t, bg, e, x:{id:추가문장}, titles:{id:제목}}
  function mkEnd(id, d, cond) {
    STARS.forEach((sid) => {
      const eid = `${id}_${sid}`;
      endings[eid] = {
        title: fill((d.titles && d.titles[sid]) || d.title, sid),
        rank: d.rank,
        t: fill(d.t + (d.x && d.x[sid] ? ' ' + d.x[sid] : ''), sid),
        bg: d.bg, c: sid, e: (d.es && d.es[sid]) || d.e,
      };
      endingRules.push({ id: eid, if: mergeCond(cond || {}, sid) });
    });
  }
  // 한 스타 전용 엔딩
  function soloEnd(eid, sid, d, cond) {
    endings[eid] = { title: d.title, rank: d.rank, t: d.t, bg: d.bg, c: sid, e: d.e };
    endingRules.push({ id: eid, if: mergeCond(cond || {}, sid) });
  }

  // ── 몰락과 이별 ──
  mkEnd('bankrupt', {
    title: '회사 파산', rank: 'F', bg: 'agency_office', e: 'cry',
    t: '별빛 엔터테인먼트는 그해 겨울 문을 닫았다. {S}의 계약은 채권자들 사이를 떠돌다 이름 모를 회사로 넘어갔다. 오 실장은 마지막 날 사무실 불을 끄며 삼촌의 사진을 가방에 넣었다. 몇 년 뒤, 어느 행사장 무대 구석에서 {S}을 본 사람이 있다고 했다. 여전히 끝까지 노래하고 있더라고.',
  }, { any: [{ flag: 'bankrupt' }, { v: { money: '<-1500' } }] });
  mkEnd('burnout', {
    title: '번아웃, 활동 중단', rank: 'F', bg: 'hospital', e: 'tired',
    t: '{F}의 무기한 활동 중단이 발표되었다. 병원 창가에서 {S}은 오랫동안 아무것도 하지 않는 연습을 했다. 팬들은 "기다릴게"라는 해시태그로 한 달 동안 트렌드를 지켰다. 대표는 매주 면회를 갔지만, 스케줄 이야기는 한 번도 꺼내지 않았다. 너무 늦게 배운 교훈이었다. 별은 연료가 아니라 사람이라는 것.',
  }, { flag: 'burnout' });
  mkEnd('scandal_fall', {
    title: '스캔들 추락', rank: 'F', bg: 'press_room', e: 'cry',
    t: '쌓이고 쌓인 논란은 결국 한 번에 무너졌다. 광고는 전부 내려가고, 방송은 편집되고, {F}이라는 이름은 검색어에서만 살아남았다. {S}은 사과문을 세 번 고쳐 쓰다 끝내 올리지 못했다. 황보람 기자는 마지막 기사를 쓰며 한 줄을 지웠다. "그래도 무대 위의 그 애는 진짜였다."',
  }, { v: { scandal: '>=70' } });
  mkEnd('transfer_blessed', {
    title: '축복 속의 이적', rank: 'B', bg: 'airport', e: 'smile',
    t: '{S}은 더 큰 회사로 떠났다. 떠나는 날, 공항 출국장에서 {S}은 대표에게 90도로 인사했다. "여기서 배운 거, 평생 써먹을게요." 새 회사에서의 첫 무대, {S}은 소감 마지막에 작게 덧붙였다. "별빛 엔터테인먼트, 고마워요." 대표는 사무실 TV 앞에서 그 장면을 열 번 돌려 봤다.',
  }, { flag: ['transferred', 'transferred_blessed'] });
  mkEnd('transfer', {
    title: '계약 분쟁 이적', rank: 'D', bg: 'press_room', e: 'cold',
    t: '"{F}, 타이탄 엔터테인먼트와 전속계약." 기사와 함께 계약 분쟁 소식이 따라붙었다. 위약금 소송은 1년을 끌었고, 그사이 둘은 법정 복도에서만 마주쳤다. 타이탄의 시스템 아래서 {S}은 더 높이 올라갔지만, 무대 위 웃음은 조금씩 계산된 모양이 되어 갔다. 마태성은 인터뷰에서 말했다. "시장은 감정을 기억하지 않습니다." 대표는 그 말이 틀렸다는 걸 증명하지 못했다.',
  }, { flag: 'transferred' });
  mkEnd('no_debut', {
    title: '데뷔하지 못한 별', rank: 'F', bg: 'practice_room', e: 'sad',
    t: '끝내 {S}의 데뷔 무대는 열리지 않았다. 금 간 거울 앞에서의 4년은 누구에게도 보이지 않았다. 그래도 {S}은 연습실 열쇠를 반납하며 웃었다. "여기서 노래한 시간은 진짜였어요." 대표는 그 웃음을 오래 기억했다.',
  }, { noflag: 'debuted' });
  mkEnd('retire_quiet', {
    title: '조용한 은퇴', rank: 'B', bg: 'han_river', e: 'smile',
    t: '{F}은 마지막 무대에서 "이제 저를 위해 살아볼게요"라고 말했다. 은퇴 후 {S}은 바닷가 작은 마을에서 동네 아이들에게 노래와 연기를 가르친다. 가끔 알아보는 사람이 있으면 "닮은 사람이래요"라며 웃는다. 매년 12월, 대표에게 귤 한 상자가 도착한다. 쪽지엔 늘 같은 말. "덕분에 잘 살아요."',
    x: { chaerin: '카메라 없는 삶이 이렇게 조용한 줄, 채린은 스물일곱에 처음 알았다.' },
  }, { flag: 'retire' });

  // ── 정점 ──
  mkEnd('world_star', {
    title: '월드스타 — 빌보드의 별', rank: 'S', bg: 'stage_concert', e: 'laugh',
    t: '빌보드 핫 100 톱 10. 지하 연습실에서 시작한 {F}의 이름이 뉴욕 타임스스퀘어 전광판에 걸렸다. 그래미 시상식 레드카펫에서 {S}은 한국어로 인사했다. "{s.fandom}, 보고 있어요?" 전 세계 {s.fandom}이 같은 순간 같은 이름을 외쳤다. 별빛 엔터테인먼트의 간판은 이제 깜빡이지 않는다.',
    x: { haeun: '무대 공포증이 있던 소녀는 7만 관객 앞에서 엄마의 노래를 불렀다.', dojun: '결승선을 잃었던 소년은 세상에서 가장 넓은 트랙을 찾았다.', chaerin: '카메라에 먹힐까 두려웠던 아이는 이제 세상에서 가장 많은 카메라 앞에 선다.' },
  }, { flag: 'billboard', s: { track: 'idol' } });
  mkEnd('hollywood', {
    title: '할리우드 진출', rank: 'S', bg: 'airport', e: 'smile',
    t: 'LA 공항. {F}은 대표와 오 실장과 함께 입국 심사대에 섰다. 첫 할리우드 시리즈는 전 세계 스트리밍 1위에 올랐고, 외신은 "눈으로 연기하는 배우"라고 썼다. 촬영장 트레일러 문에는 한국어로 된 명패가 붙어 있다. 오 실장은 LA에서도 도시락을 싼다. "이건 제가 20년 해봐서 아는데요, 밥은 한식입니다."',
  }, { flag: 'hollywood_yes' });
  mkEnd('cannes', {
    title: '칸 영화제 수상', rank: 'S', bg: 'awards', e: 'cry',
    t: '칸의 밤, 뤼미에르 극장에 {F}의 이름이 울렸다. 대사 한 줄 없이 사람을 울린 배우. 백서진 감독은 수상 직후 대표를 끌어안고 한참을 울었다. "빚 다 갚았다. 이자까지." 한국으로 돌아오는 비행기에서 {S}은 트로피를 품에 안고 네 시간을 잤다. 4년 만에 처음으로 깊은 잠이었다.',
    x: { chaerin: '<엄마의 바다>의 국민 딸은, 스스로의 이름으로 세계의 배우가 되었다.' },
  }, { flag: 'cannes_win' });
  mkEnd('idol_daesang', {
    title: '가요대상 대상', rank: 'S', bg: 'awards', e: 'cry',
    t: '올해의 가수, 대상. 중소 기획사 최초의 기록이었다. 트로피를 들어 올린 {F}은 한참 동안 말을 잇지 못했고, 객석의 {s.fandom}이 대신 이름을 불렀다. 그날 밤 옥상에서 대표와 {S}과 오 실장은 편의점 컵라면으로 축배를 들었다. 4년 전과 같은 메뉴, 전혀 다른 맛이었다.',
    x: { haeun: '하은은 약속대로 트로피를 들고 옥상에서 사진을 찍었다.', dojun: '도준의 아버지가 객석 맨 뒤에서 가장 오래 박수를 쳤다.' },
  }, { flag: 'award_daesang' });
  mkEnd('acting_daesang', {
    title: '연기대상', rank: 'S', bg: 'awards', e: 'cry',
    t: '연기대상. {F}의 이름이 불리자 선배 배우들이 먼저 일어나 박수를 쳤다. 단역, 카메오, 조연, 주연. 한 계단씩 올라온 4년이 한 문장의 소감으로 정리되었다. "저를 기다려준 모든 사람에게." 남궁현 선생은 객석에서 조용히 고개를 끄덕였다.',
    x: { chaerin: '아홉 살 국민 딸이 아니라, 스물일곱 배우 윤채린이 받은 상이었다.' },
  }, { flag: 'award_acting_daesang' });

  // ── 대표와의 특별한 신뢰 (스타별) ──
  soloEnd('trust_haeun', 'haeun', {
    title: '대표님의 첫 번째 별', rank: 'S', bg: 'rooftop_night', e: 'laugh',
    t: '"평생 파트너"라는 말은 계약서에 적히지 않았다. 대신 하은은 모든 앨범의 첫 번째 땡스 투에 같은 문장을 적었다. "저를 골라준 대표님께." 무대 공포증이 있던 소녀는 이제 신인들에게 "떨리는 건 진심이라서 그래"라고 말해주는 선배가 되었다. 매년 연말, 둘은 그 옥상에서 컵라면을 먹는다. 트로피가 몇 개든, 그 자리엔 늘 두 개의 컵라면뿐이다.',
  }, { flag: 'forever' });
  soloEnd('trust_dojun', 'dojun', {
    title: '같은 트랙을 달리는 사람', rank: 'S', bg: 'han_river', e: 'smile',
    t: '도준은 재계약서에 사인하며 딱 한 마디 했다. "…대표님이 은퇴할 때까지요." 말이 짧은 그가 한 가장 긴 약속이었다. 그 후 도준이 쓴 가사에는 늘 한 사람이 등장한다. 넘어진 사람 옆에서 같이 걸어준 사람. 한강을 뛰는 두 사람의 사진이 가끔 팬들에게 찍히지만, 새벽달은 그 사진만은 절대 올리지 않는다.',
  }, { flag: 'forever' });
  soloEnd('trust_chaerin', 'chaerin', {
    title: '말로 한 계약', rank: 'S', bg: 'rooftop_night', e: 'shy',
    t: '"말은 날아간다"던 채린은, 이번 약속만은 계약서에 적지 않았다. 적을 필요가 없었으니까. 채린은 이후 모든 현장에 대표가 쓴 "촬영 수칙"을 들고 다녔다. 그녀의 후배 아역들은 그 종이를 "채린 언니 헌법"이라고 부른다. 어느 인터뷰에서 기자가 물었다. "믿는 어른이 있나요?" 채린은 망설임 없이 웃었다. "한 명이요. 그거면 충분해요."',
  }, { flag: 'forever' });

  mkEnd('producer_star', {
    title: '제작자가 된 스타', rank: 'A', bg: 'agency_office', e: 'smile',
    t: '{F}은 별빛 엔터테인먼트 안에 작은 레이블을 차렸다. 첫 오디션 날, 금 간 거울 앞에 떨리는 손의 연습생들이 줄지어 섰다. {S}은 그들 앞에서 4년 전 대표가 했던 말을 그대로 했다. "떨리는 게 당연해. 끝까지 해봐." 대표는 이제 두 회사의 첫 번째 투자자다.',
    x: { haeun: '하은의 레이블 이름은 "편의점 새벽 두 시"다. 누구보다 늦게까지 불이 켜진 곳.', dojun: '도준의 첫 팀 이름은 "리스타트". 한 번씩 넘어져 본 아이들로만 꾸렸다.', chaerin: '채린의 회사 계약서 첫 조항은 "만 16세 미만 하루 촬영 8시간 초과 금지"다.' },
  }, { flag: 'producer_path' });
  // ── 스타 전용 서사 엔딩 ──
  soloEnd('haeun_song', 'haeun', {
    title: '엄마에게 바치는 노래', rank: 'A', bg: 'stage_concert', e: 'cry',
    t: '빚을 다 갚은 날, 하은은 단독 콘서트 앙코르에서 어릴 적 엄마가 설거지하며 부르던 노래를 불렀다. 객석 첫 줄의 엄마는 식당 앞치마 대신 {s.fandom}이 선물한 원피스를 입고 있었다. "엄마, 이제 내가 불러줄게." 그 라이브 영상은 "올해 가장 많이 운 3분"이 되었다. 하은은 지금도 무대에 오르기 전 손을 떤다. 그리고 끝까지 부른다.',
  }, { flag: 'haeun_family_resolved', v: { vocal: '>=78' } });
  soloEnd('dojun_lyrics', 'dojun', {
    title: '작사 강도준', rank: 'A', bg: 'han_river', e: 'smile',
    t: '도준의 가사 <결승선>은 수능 응원가가 되고, 재활 병동의 주제가가 되고, 은퇴한 운동선수들의 노래가 되었다. "멈춰도 괜찮아 / 결승선은 네가 정하는 거야." 저작권 협회 명단에 "강도준" 이름이 스무 곡을 넘겼다. 아버지는 그 노래를 휴대폰 벨소리로 쓴다. 전화가 올 때마다 두 사람 다 조금 쑥스러워한다.',
  }, { flag: 'dojun_lyrics_public', v: { songs: '>=4' } });
  soloEnd('chaerin_reborn', 'chaerin', {
    title: '다시 태어난 국민 배우', rank: 'A', bg: 'filming_set', e: 'smile',
    t: '채린의 기자회견 이후 "아역 배우 보호법"이 국회를 통과했다. 사람들은 그 법을 "채린법"이라 부른다. 채린은 그해 스크린과 드라마를 오가며 모든 연기상 후보에 올랐다. 인터뷰에서 누가 아역 시절을 물으면, 이제 채린은 웃으며 대답한다. "그 아이, 잘 컸어요. 제가 키웠거든요."',
  }, { flag: 'chaerin_confronted', v: { acting: '>=72' } });

  // ── 성공의 여러 모양 ──
  mkEnd('blue_dragon', {
    title: '청룡의 주인공', rank: 'A', bg: 'awards', e: 'cry',
    t: '청룡영화상 주연상. 영화 <침묵의 계절>의 {F}은 "올해 가장 조용하고 가장 큰 연기"라는 평을 받았다. 시상식 다음 날부터 시나리오가 하루에 열 편씩 도착했다. {S}은 그중 한 편을 골라 대표에게 내밀었다. "이번엔 대사가 많아요. 괜찮을까요?"',
  }, { flag: 'award_bluedragon' });
  mkEnd('baeksang', {
    title: '백상의 밤', rank: 'A', bg: 'awards', e: 'smile',
    t: '백상예술대상 최우수연기상. {F}은 방송가가 가장 탐내는 배우가 되었다. 출연 제안서가 사무실 책상 두 개를 덮었다. {S}은 그중 가장 작은 역할을 골라 선배들을 놀라게 했다. "좋은 이야기면 크기는 상관없어요." 믿고 보는 배우의 시작이었다.',
  }, { flag: 'award_baeksang' });
  mkEnd('actor_switch', {
    title: '배우 전향 성공', rank: 'A', bg: 'filming_set', e: 'smile',
    t: '아이돌 출신이라는 편견은 딱 두 작품 만에 사라졌다. {F}은 "연기돌"이 아니라 "배우"로 불리기 시작했다. 마지막 음악방송에서 {s.fandom}이 들었던 슬로건 "새 길도 함께"는 이제 촬영장 커피차 문구가 되었다. 가끔 {S}은 OST로 노래도 부른다. 무대에서 배운 호흡이 카메라 앞에서 빛난다.',
  }, { flag: 'switched_actor', v: { acting: '>=65' } });
  mkEnd('singer_songwriter', {
    title: '실력파 싱어송라이터', rank: 'A', bg: 'stage_concert', e: 'smile',
    t: '작사·작곡 {F}. 크레딧에 이름이 쌓일수록 차트보다 오래 남는 노래가 늘었다. 평론가들은 "아이돌이 아니라 뮤지션"이라고 썼다. {S}은 매년 겨울 소극장에서 기타 하나로 공연을 연다. 티켓은 1분 만에 매진되고, 객석엔 늘 새벽달의 카메라 대신 조용한 박수만 있다.',
  }, { v: { songs: '>=5' }, flag: 'songwriter_known' });
  mkEnd('longrun_group', {
    title: '장수 그룹 {s.groupName}', rank: 'A', bg: 'stage_concert', e: 'laugh',
    t: '{s.groupName}은 10주년 콘서트를 열었다. 센터 {S}의 양옆에는 여전히 {s.o1Name}과 {s.o2Name}이 서 있다. 해체 위기는 몇 번 있었지만, 매번 옥상에서 캔커피를 나눠 마시며 넘겼다. "우리는 셋이라서 오래 가요." 10주년 무대에서 셋은 데뷔곡을 불렀다. 4년 전 금 간 거울 앞에서 처음 맞춰보던 그 노래를.',
  }, { flag: ['group_debut', 'group_strong', 'renewed'] });
  mkEnd('love_public', {
    title: '연인 공개와 행복', rank: 'A', bg: 'han_river', e: 'shy',
    t: '공개 연애 3년 차, {F}은 결혼 소식을 손편지로 전했다. 팬카페엔 축하 글이 만 개 넘게 달렸다. "숨기지 않아서 고마웠어." 결혼식 축가는 남궁현 선생이 불렀고, 사회는 오 실장이 봤다가 아재개그로 식장을 얼렸다. {S}은 지금도 활동 중이다. 행복한 사람이 부르는 노래가 더 멀리 간다는 걸 증명하며.',
    x: { dojun: '신부 측 하객석 맨 앞에 앉은 류세라가 제일 크게 울었다.' },
  }, { all: [{ flag: 'dating_public' }, starAff('>=70')] });

  mkEnd('variety_star', {
    title: '예능 대세', rank: 'B', bg: 'broadcast_studio', e: 'laugh',
    t: '금요일 밤 예능 세 개, 주말 예능 두 개. {F}의 얼굴이 안 나오는 채널을 찾기가 더 어려웠다. 연말 예능 대상 신인상, 그리고 "올해의 짤" 1위. 사람들은 {S}을 보며 웃었고, 가끔 {S}의 진지한 무대를 보고 놀랐다. "저 사람 원래 이런 사람이었어?" {S}은 그 질문을 제일 좋아한다.',
  }, { flag: 'variety_breakout', v: { variety: '>=80', fame: '>=70' } });
  mkEnd('national_sibling', {
    title: '국민 여동생', titles: { dojun: '국민 남동생', chaerin: '다시, 국민 딸' }, rank: 'A', bg: 'street_seoul', e: 'laugh',
    t: '시장에 가면 떡을 받고, 택시를 타면 기사님이 사인을 부탁한다. {F}은 온 국민이 응원하는 이름이 되었다. 공익광고, 명절 특집, 봉사 활동 사진 한 장까지 전부 화제가 됐다. 인기의 비결을 묻자 {S}은 머쓱하게 웃었다. "그냥, 인사를 잘해요."',
    x: { chaerin: '이번엔 누가 만들어준 별명이 아니었다. 채린이 스스로 다시 얻은 이름이었다.' },
  }, { v: { fame: '>=110', heart: '>=72' } });
  mkEnd('youth_star', {
    title: '청춘스타', rank: 'B', bg: 'street_seoul', e: 'smile',
    t: '광고판마다 {F}의 얼굴이 걸렸다. 20대가 가장 닮고 싶은 얼굴, 가장 입고 싶은 옷. 대학 축제 섭외 1순위. {S}은 지금 가장 반짝이는 청춘의 상징이 되었다. 대표는 그 반짝임이 오래 가도록, 오늘도 스케줄표에 휴식 칸을 먼저 그린다.',
  }, { v: { fame: '>=90', visual: '>=70' } });
  mkEnd('one_hit', {
    title: '원히트원더', rank: 'C', bg: 'street_seoul', e: 'sad',
    t: '그 노래 하나는 모두가 안다. 노래방 인기곡 순위에 몇 년째 머무는 그 노래. 하지만 {F}이라는 이름을 기억하는 사람은 점점 줄었다. {S}은 행사 무대에서 매번 그 노래를 부른다. 관객이 떼창을 할 때마다 {S}은 생각한다. 한 곡이라도, 누군가의 인생곡이 되었다면 그걸로 됐다고.',
  }, { flag: 'hit_song', v: { fame: '<75' } });
  mkEnd('idol_steady', {
    title: '꾸준한 중견 아이돌', rank: 'B', bg: 'broadcast_studio', e: 'smile',
    t: '대상은 없었지만 공백기도 없었다. {F}은 매년 컴백하고, 매년 팬미팅을 열고, 매년 {s.fandom}과 생일을 보낸다. 음방 대기실에선 후배들이 먼저 찾아와 인사하는 선배가 되었다. 화려하진 않아도 꺼지지 않는 별. 대표는 그게 더 어려운 일이라는 걸 안다.',
  }, { s: { track: 'idol' }, v: { fame: '>=60' } });
  mkEnd('actor_steady', {
    title: '믿고 보는 조연', rank: 'B', bg: 'filming_set', e: 'smile',
    t: '주연 크레딧은 아직이다. 하지만 캐스팅 디렉터들은 말한다. "그 역할은 {F}이 해야 살아." 매년 두 작품, 매번 다른 얼굴. 시청자들은 이름보다 얼굴을 먼저 알아보고 반가워한다. {S}은 오늘도 대본 여백에 캐릭터의 어린 시절을 적는다.',
  }, { s: { track: 'actor' }, v: { fame: '>=50' } });
  mkEnd('fade', {
    title: '빛바랜 별', rank: 'D', bg: 'sky_night', e: 'sad',
    t: '4년의 끝, {F}의 이름은 조용히 잊혀 갔다. 차트에도, 방송에도, 기사에도 없었다. 그래도 {S}은 매주 토요일 작은 카페에서 공연을 한다. 관객은 열 명 남짓. 그중 한 명은 늘 대표다.',
  }, { v: { fame: '<35' } });
  mkEnd('normal', {
    title: '별빛의 다음 장', rank: 'C', bg: 'rooftop_night', e: 'smile',
    t: '대단한 트로피도, 대단한 몰락도 없었다. 다만 {F}은 무대에 섰고, 누군가는 그 무대를 기억한다. 별빛 엔터테인먼트는 망하지 않았고, 금 간 거울 앞에는 새 연습생들이 들어왔다. {S}은 그들에게 먼저 인사를 건넸다. "여기, 좋은 회사야."',
  }, {});
  endings.normal = { title: '별빛의 다음 장', rank: 'C', t: '대단한 트로피도, 대단한 몰락도 없었다. 별빛 엔터테인먼트는 망하지 않았고, 금 간 거울 앞에는 새 연습생들이 들어왔다. 이야기는 다음 장으로 이어진다.', bg: 'rooftop_night' };
  endingRules.push({ id: 'normal', if: {} });

  // ───────────────────────── 시뮬레이션 ─────────────────────────
  const DEB = { flag: 'debuted' };
  const DEB_IDOL = { flag: 'debuted', s: { track: 'idol' } };
  const DEB_ACTOR = { flag: 'debuted', s: { track: 'actor' } };
  const ALL3 = { haeun: 1, dojun: 1, chaerin: 1 };

  const activities = [
    // 트레이닝
    { id: 'vocal', name: '보컬 트레이닝', cat: '트레이닝', desc: '호흡, 발성, 고음. 메인보컬의 기본기.', cost: 60,
      fx: { v: { vocal: 3, stamina: -1, stress: 3 } },
      great: { chance: 0.12, fx: { v: { vocal: 2, mental: 1 } }, t: '고음이 뚫렸다! 트레이너가 녹음 버튼을 눌렀다.' },
      fail: { chance: 0.06, fx: { v: { stress: 4, vocal: -1 } }, t: '무리하다 목이 쉬었다. 사흘간 묵언 수행.' },
      lines: ['"배에 힘! 목으로 부르지 말고!"', '녹음실 유리창 너머로 트레이너가 엄지를 들었다.', '같은 소절을 서른 번째 반복했다.'] },
    { id: 'dance', name: '댄스 레슨', cat: '트레이닝', desc: '안무 습득과 체력. 직캠은 여기서 만들어진다.', cost: 60,
      fx: { v: { dance: 3, stamina: 1, stress: 4 } },
      great: { chance: 0.12, fx: { v: { dance: 2 } }, t: '안무가가 "이거 영상 찍어두자"고 했다. 킬링 파트 완성!' },
      fail: { chance: 0.07, fx: { v: { stamina: -6, stress: 4 } }, t: '착지하다 발목을 삐끗했다. 파스 냄새가 숙소를 채웠다.' },
      lines: ['"5, 6, 7, 8!" 거울 속 동작이 조금씩 맞아 들어갔다.', '연습복이 땀에 젖어 색이 바뀌었다.', '각 맞추기 백 번째. 안무가가 드디어 고개를 끄덕였다.'] },
    { id: 'acting', name: '연기 수업', cat: '트레이닝', desc: '대사, 감정, 카메라 연기.', cost: 70,
      fx: { v: { acting: 3, mental: 1, stress: 3 } },
      great: { chance: 0.12, fx: { v: { acting: 2 } }, t: '즉흥 연기에서 강사가 말을 잃었다. "방금 그거, 진짜였어."' },
      fail: { chance: 0.06, fx: { v: { stress: 5 } }, t: '감정이 안 잡혀 한 시간 내내 같은 장면만 반복했다.' },
      lines: ['"대사를 외우지 말고 이해해."', '거울 앞에서 같은 대사를 열 가지 감정으로 읽었다.', '"지금 누구를 보고 있어? 상대 배우를 봐."'] },
    { id: 'variety_class', name: '예능 특강', cat: '트레이닝', desc: '리액션, 토크, 개인기. 예능감은 연습으로 는다.', cost: 50,
      fx: { v: { variety: 3, heart: 1, stress: 2 } },
      great: { chance: 0.1, fx: { v: { variety: 2 } }, t: '개인기 하나가 강사를 빵 터뜨렸다. 비장의 무기 확보!' },
      lines: ['"리액션은 크게, 반 박자 빠르게!"', '에피소드 토크 연습. 세 번째 이야기에서 웃음이 터졌다.'] },
    { id: 'language', name: '외국어 수업', cat: '트레이닝', desc: '영어·일본어. 해외 활동의 문을 연다.', cost: 50,
      fx: { v: { lang: 1, variety: 1, mental: 1, stress: 2 } },
      lines: ['"Nice to meet you, I am…" 발음이 조금씩 자연스러워졌다.', '일본어 팬레터를 사전 없이 읽는 날을 꿈꾼다.'] },
    { id: 'reading', name: '대본 리딩 스터디', cat: '트레이닝', desc: '저렴하게 연기 감을 유지한다.', cost: 20,
      fx: { v: { acting: 1, mental: 1, stress: 1 } },
      lines: ['카페 구석에서 대본에 형광펜을 칠했다.', '오 실장이 상대역을 읽어줬다. 발연기였다.'] },
    { id: 'stageplay', name: '소극장 연극 무대', cat: '트레이닝', desc: '관객 앞에서 연기하는 법. 멘탈도 단련된다.', cost: 30,
      req: { v: { acting: '>=30' } }, hint: '연기 30 이상',
      fx: { v: { acting: 3, mental: 2, stamina: -2, stress: 4 } },
      great: { chance: 0.1, fx: { v: { acting: 1, fame: 1, fans: 10 } }, t: '커튼콜에 기립박수. 연극 리뷰에 이름이 실렸다.' },
      lines: ['객석 80석. 숨소리까지 들리는 무대.', '대학로 소극장, 두 시간의 공연이 끝났다.'] },
    { id: 'compose', name: '작곡 작업', cat: '트레이닝', desc: '자작곡을 쓴다. 쌓이면 싱어송라이터의 길이 열린다.', cost: 40,
      fx: { v: { songs: 1, vocal: 1, stress: 3 } },
      great: { chance: 0.15, fx: { v: { songs: 1, mental: 2 } }, t: '영감이 폭발했다! 하룻밤에 두 곡 완성.' },
      fail: { chance: 0.12, fx: { v: { songs: -1, stress: 4 } }, t: '한 줄도 못 썼다. 쓴 것마저 지웠다.' },
      lines: ['새벽 세 시, 음성 메모에 멜로디를 흥얼거렸다.', '가사 노트가 한 장 더 채워졌다.', '코드 네 개로 시작한 곡이 점점 모양을 갖췄다.'] },
    { id: 'monitor', name: '모니터링', cat: '트레이닝', desc: '자기 무대와 연기를 돌려 보며 복기한다. 공짜지만 괴롭다.', cost: 0,
      fx: { v: { mental: 2, acting: 1, dance: 1, vocal: 1, stress: 4 } },
      lines: ['같은 영상을 0.5배속으로 스무 번 봤다.', '"여기서 표정이 풀렸네." 메모장이 빼곡해졌다.'] },
    // 관리
    { id: 'skincare', name: '피부관리·다이어트', cat: '관리', desc: '비주얼 관리. 대신 배가 고프다.', cost: 80,
      fx: { v: { visual: 3, stamina: -2, stress: 3 } },
      great: { chance: 0.1, fx: { v: { visual: 2, fans: 10 } }, t: '"리즈 갱신" 셀카가 팬들 사이에서 화제가 됐다.' },
      lines: ['닭가슴살과 방울토마토의 하루.', '피부과 원장님이 "관리 잘하시네요"라고 했다.'] },
    { id: 'gym', name: '헬스 트레이닝', cat: '관리', desc: '체력은 모든 활동의 기본.', cost: 40,
      fx: { v: { stamina: 5, visual: 1, stress: 2 } },
      lines: ['스쿼트 100개. 다리가 후들거렸다.', '러닝머신 위에서 데뷔곡을 흥얼거렸다.'] },
    { id: 'counsel', name: '심리 상담', cat: '관리', desc: '전문가와 마음을 돌본다.', cost: 60,
      fx: { v: { mental: 4, stress: -10 } },
      lines: ['"오늘은 어떤 기분이었어요?" 대답하는 데 오래 걸렸다.', '상담실을 나서며 숨을 깊게 쉬었다.'] },
    { id: 'yoga', name: '요가·명상', cat: '관리', desc: '몸과 마음을 가볍게.', cost: 30,
      fx: { v: { mental: 2, stamina: 2, stress: -7 } },
      lines: ['호흡에만 집중하는 한 시간.', '매트 위에서 잠깐 잠이 들었다.'] },
    // 휴식
    { id: 'rest', name: '숙소 휴식', cat: '휴식', desc: '아무것도 안 하는 날. 제일 중요한 스케줄.', cost: 0,
      fx: { v: { stress: -12, stamina: 4 } },
      lines: ['하루 종일 잤다. 일어나니 저녁이었다.', '배달 음식과 드라마 정주행.'] },
    { id: 'vacation', name: '휴가', cat: '휴식', desc: '제주도 3박 4일. 연습생 셋 모두의 기분이 좋아진다.', cost: 150,
      fx: { v: { stress: -25, stamina: 8, heart: 1 }, aff: ALL3 },
      lines: ['제주 바다 앞에서 셋이 사진을 찍었다.', '휴대폰 알림을 끄고 파도 소리만 들었다.'] },
    { id: 'volunteer', name: '기부·봉사', cat: '휴식', desc: '연탄 배달, 유기견 보호소. 마음이 단단해진다.', cost: 80,
      fx: { v: { heart: 4, stress: -4 } },
      great: { chance: 0.1, fx: { v: { fame: 2, fans: 20, heart: 2 } }, t: '몰래 한 봉사가 뒤늦게 알려져 "선행 요정" 기사가 났다.' },
      lines: ['연탄 200장을 날랐다. 얼굴이 새까매졌다.', '보호소 강아지가 떠나지 않고 따라왔다.'] },
    // 부업
    { id: 'parttime', name: '행사 알바', cat: '부업', desc: '데뷔 전, 회사 살림에 보탠다. 몸은 고되다.', cost: -70,
      req: { noflag: 'debuted' }, hint: '데뷔 전에만 가능',
      fx: { v: { stress: 5, stamina: -3, heart: 1 } },
      lines: ['인형 탈을 쓰고 전단지를 돌렸다.', '웨딩홀 서빙. 축가 부르는 가수를 한참 바라봤다.'] },
    { id: 'vlog', name: '브이로그 촬영', cat: '부업', desc: '자체 콘텐츠로 팬을 모은다.', cost: 20,
      fx: { v: { variety: 2, fans: 5, stress: 2 } },
      great: { chance: 0.1, fx: { v: { fans: 25, fame: 1 } }, t: '브이로그가 알고리즘을 탔다! 조회수 폭발.' },
      lines: ['"오늘은 연습생의 하루를 보여드릴게요!"', '편집은 오 실장 담당. 자막 폰트가 궁서체였다.'] },
    { id: 'busking', name: '버스킹', cat: '부업', desc: '홍대 거리 공연. 관객 앞에 서는 연습.', cost: 10,
      fx: { v: { vocal: 2, mental: 2, fans: 4, stress: 3 } },
      great: { chance: 0.1, fx: { v: { fans: 25, fame: 2 } }, t: '지나가던 유튜버가 영상을 올렸다. "홍대 숨은 보석".' },
      fail: { chance: 0.08, fx: { v: { stress: 4 } }, t: '비가 왔다. 관객 0명.' },
      lines: ['홍대 놀이터 앞, 기타 케이스에 동전이 쌓였다.', '멈춰 선 사람이 하나, 둘, 열.'] },
    // 아이돌 활동
    { id: 'musicshow', name: '음악방송', cat: '아이돌 활동', desc: '매주 음방 출연. 인지도와 팬덤의 기본.', cost: 30,
      req: DEB_IDOL, hint: '아이돌로 데뷔한 뒤',
      fx: { v: { fame: 1, fans: 8, dance: 1, stamina: -3, stress: 5 } },
      great: { chance: 0.12, fx: { v: { fame: 3, fans: 30 } }, t: '직캠 떡상! 하루 만에 100만 뷰.' },
      fail: { chance: 0.06, fx: { v: { fame: -2, scandal: 2, stress: 5 } }, t: '방송사고! 생방송 중 인이어가 빠졌다.' },
      lines: ['새벽 사전녹화. 팬들의 응원법이 스튜디오를 채웠다.', '엔딩 요정 컷에서 카메라가 오래 머물렀다.', '대기실 복도에서 선배들에게 90도 인사.'] },
    { id: 'musicshow_top', name: '1위 후보 무대', cat: '아이돌 활동', desc: '1위를 노리는 컴백 주간 풀 스케줄.', cost: 60,
      req: { flag: 'debuted', s: { track: 'idol' }, v: { fame: '>=50' } }, hint: '아이돌, 인기 50 이상',
      fx: { v: { fame: 1, fans: 12, stamina: -4, stress: 6 } },
      great: { chance: 0.25, fx: { v: { wins: 1, fame: 2, fans: 25 } }, t: '이번 주 1위! 앵콜 무대에서 {s.fandom}이 떼창을 했다.' },
      fail: { chance: 0.05, fx: { v: { stress: 6 } }, t: '아쉬운 2위. 표 차이는 단 300점.' },
      lines: ['1위 후보 발표. 두 손을 모았다.', '전광판의 숫자가 올라가는 10초가 1년 같았다.'] },
    { id: 'recording', name: '앨범 작업', cat: '아이돌 활동', desc: '녹음실에서 다음 앨범을 준비한다.', cost: 150,
      req: DEB_IDOL, hint: '아이돌로 데뷔한 뒤',
      fx: { v: { vocal: 3, dance: 1, fans: 5, stress: 4 } },
      lines: ['녹음 부스 안, 같은 소절 스무 번째 테이크.', '프로듀서가 "이 버전으로 가자"고 했다.'] },
    { id: 'concert', name: '단독 콘서트', cat: '아이돌 활동', desc: '팬덤의 크기를 증명하는 무대. 수익도 크다.', cost: -500,
      req: { flag: 'debuted', s: { track: 'idol' }, v: { fans: '>=300' } }, hint: '아이돌, 팬덤 300 이상',
      fx: { v: { fans: 20, vocal: 1, dance: 1, fame: 1, stamina: -8, stress: 7 } },
      great: { chance: 0.1, fx: { v: { fans: 40, fame: 2 } }, t: '앵콜에서 객석 전체가 떼창. "레전드 콘서트" 후기가 쏟아졌다.' },
      lines: ['응원봉 불빛이 파도처럼 흔들렸다.', '세 시간 공연. 마지막 곡에서 목소리가 갈라졌지만 아무도 신경 쓰지 않았다.'] },
    { id: 'overseas', name: '해외 투어', cat: '아이돌 활동', desc: '아시아 투어 이후 열린다. 크게 벌고 크게 지친다.', cost: -800,
      req: { flag: ['debuted', 'tour1'], s: { track: 'idol' } }, hint: '아시아 투어 이후',
      fx: { v: { fans: 30, fame: 1, lang: 1, stamina: -10, stress: 10 } },
      fail: { chance: 0.08, fx: { v: { stamina: -8, stress: 6 } }, t: '비행기 연착과 시차. 공연 직전 링거를 맞았다.' },
      lines: ['공항 출국장에 모인 팬들의 플래카드.', '낯선 도시, 익숙한 떼창.'] },
    // 방송·광고
    { id: 'fansign', name: '팬사인회', cat: '방송·광고', desc: '팬과 눈을 맞추는 시간. 팬덤이 단단해진다.', cost: 20,
      req: { flag: 'debuted', v: { fans: '>=40' } }, hint: '데뷔 후, 팬덤 40 이상',
      fx: { v: { fans: 12, heart: 1, stress: 3 } },
      great: { chance: 0.1, fx: { v: { fans: 25, fame: 1 } }, t: '팬 응대 영상이 "천사 응대"로 화제가 됐다.' },
      lines: ['"이름이 뭐예요?" 백 번째 질문에도 웃었다.', '팬이 건넨 손편지를 주머니에 소중히 넣었다.'] },
    { id: 'festival', name: '대학 축제·행사', cat: '방송·광고', desc: '돈이 되는 행사. 체력이 녹는다.', cost: -150,
      req: { flag: 'debuted', v: { fame: '>=25' } }, hint: '데뷔 후, 인기 25 이상',
      fx: { v: { fame: 1, fans: 5, stamina: -4, stress: 5 } },
      lines: ['대학 노천극장에 함성이 울렸다.', '하루에 행사 세 개. 밴에서 김밥으로 끼니를 때웠다.'] },
    { id: 'cf', name: '광고 촬영', cat: '방송·광고', desc: '인기가 곧 몸값. 회사 통장이 숨을 쉰다.', cost: -500,
      req: { flag: 'debuted', v: { fame: '>=45' } }, hint: '데뷔 후, 인기 45 이상',
      fx: { v: { fame: 1, visual: 1, stress: 3 } },
      great: { chance: 0.1, fx: { v: { fame: 2, money: 300 } }, t: '광고 매출이 급등해 재계약! 보너스 입금.' },
      fail: { chance: 0.05, fx: { v: { scandal: 5, fame: -2 } }, t: '광고 모델 제품이 논란에 휘말렸다.' },
      lines: ['"한 번만 더 웃어주세요!" 스무 번째 미소.', '편의점 냉장고에 {s.starName}의 얼굴이 붙었다.'] },
    { id: 'variety_show', name: '예능 출연', cat: '방송·광고', desc: '대중에게 얼굴을 알린다. 편집은 운.', cost: -80,
      req: DEB, hint: '데뷔 후',
      fx: { v: { variety: 2, fame: 1, fans: 6, stress: 4 } },
      great: { chance: 0.12, fx: { v: { fame: 4, fans: 35 } }, t: '명장면 탄생! 방송 다음 날 짤이 온 커뮤니티를 뒤덮었다.' },
      fail: { chance: 0.08, fx: { v: { scandal: 4, stress: 6 } }, t: '악마의 편집. 태도 논란 기사가 났다.' },
      lines: ['MC의 무리한 요구에 애교 세 종 세트.', '녹화 여섯 시간, 방송 분량 4분.'] },
    { id: 'radio', name: '라디오 게스트', cat: '방송·광고', desc: '목소리와 입담으로 친근해진다.', cost: -50,
      req: DEB, hint: '데뷔 후',
      fx: { v: { variety: 2, vocal: 1, fans: 3, stress: 1 } },
      lines: ['보이는 라디오, 청취자 사연에 울컥했다.', '라이브 한 소절에 문자 창이 폭발했다.'] },
    { id: 'snslive', name: 'SNS 라이브', cat: '방송·광고', desc: '공짜로 팬과 소통. 말실수만 조심.', cost: 0,
      req: DEB, hint: '데뷔 후',
      fx: { v: { variety: 1, fans: 6, stress: 1 } },
      fail: { chance: 0.08, fx: { v: { scandal: 6, stress: 5 } }, t: '말실수 논란! 해명문을 새벽에 올렸다.' },
      lines: ['"여러분 밥 먹었어요?" 댓글이 폭포처럼 흘렀다.', '라이브 중 오 실장이 화면에 난입했다.'] },
    { id: 'pictorial', name: '화보 촬영', cat: '방송·광고', desc: '패션지 화보. 비주얼과 인지도.', cost: -150,
      req: { flag: 'debuted', v: { visual: '>=50' } }, hint: '데뷔 후, 비주얼 50 이상',
      fx: { v: { visual: 2, fame: 1, fans: 5, stress: 2 } },
      lines: ['조명 아래, 셔터 소리에 맞춰 포즈를 바꿨다.', '"눈빛 좋아요, 그대로!"'] },
    { id: 'ost', name: 'OST 녹음', cat: '방송·광고', desc: '드라마 OST. 역주행의 꿈.', cost: -150,
      req: { flag: 'debuted', v: { vocal: '>=55' } }, hint: '데뷔 후, 보컬 55 이상',
      fx: { v: { vocal: 2, fame: 1, fans: 8 } },
      great: { chance: 0.1, fx: { v: { fame: 4, fans: 40 }, flag: 'hit_song' }, t: '드라마가 대박 나면서 OST가 음원 차트를 역주행했다!' },
      lines: ['드라마 장면을 틀어놓고 감정을 잡았다.', '한 번에 오케이. 음악감독이 박수를 쳤다.'] },
    { id: 'fanmeet', name: '팬미팅', cat: '방송·광고', desc: '팬과 함께하는 하루. 팬덤이 끈끈해진다.', cost: -200,
      req: { flag: 'debuted', v: { fans: '>=180' } }, hint: '데뷔 후, 팬덤 180 이상',
      fx: { v: { fans: 15, heart: 2, stamina: -3, stress: 4 } },
      lines: ['팬들과 함께한 게임 코너에서 벌칙에 걸렸다.', '하이터치 천 명. 손바닥이 빨개졌다.'] },
    // 배우 활동
    { id: 'webdrama', name: '웹드라마', cat: '배우 활동', desc: '작은 예산, 큰 경험. 연기 실전.', cost: -100,
      req: { flag: 'debuted', v: { acting: '>=30' } }, hint: '데뷔 후, 연기 30 이상',
      fx: { v: { acting: 2, fame: 1, fans: 5, stress: 4 } },
      great: { chance: 0.1, fx: { v: { fame: 3, fans: 30 } }, t: '웹드라마 클립이 1000만 뷰를 넘겼다!' },
      lines: ['하루에 서른 신. 웹드라마 현장은 전쟁이다.', '감독님이 "그 표정 좋다"고 했다.'] },
    { id: 'drama_aud', name: '드라마 오디션', cat: '배우 활동', desc: '떨어지는 게 일상. 붙으면 인생이 바뀐다.', cost: 20,
      req: { flag: 'debuted', v: { acting: '>=35' } }, hint: '데뷔 후, 연기 35 이상',
      fx: { v: { acting: 1, mental: 1, stress: 6 } },
      great: { chance: 0.2, fx: { v: { fame: 2, fans: 15, money: 100 } }, t: '단역 캐스팅 성공! 공중파 드라마에 이름이 올랐다.' },
      fail: { chance: 0.15, fx: { v: { stress: 5 } }, t: '낙방. "이미지가 안 맞네요." 열 번째 듣는 말이었다.' },
      lines: ['대기실에 비슷한 얼굴 서른 명.', '3분 안에 모든 걸 보여줘야 한다.'] },
    { id: 'film_aud', name: '영화 오디션', cat: '배우 활동', desc: '스크린의 문. 붙으면 영화 촬영이 열린다.', cost: 20,
      req: { flag: 'debuted', v: { acting: '>=50', fame: '>=20' } }, hint: '데뷔 후, 연기 50·인기 20 이상',
      fx: { v: { acting: 1, stress: 7 } },
      great: { chance: 0.18, fx: { v: { fame: 2, fans: 15 }, flag: 'film_small' }, t: '영화 조연 캐스팅! 스크린 데뷔가 확정됐다.' },
      fail: { chance: 0.15, fx: { v: { stress: 5 } }, t: '최종에서 떨어졌다. 감독은 "다음엔 꼭"이라고 했다.' },
      lines: ['감독 앞에서 대본 없이 즉흥 연기.', '"카메라 테스트 한 번 더 해봅시다."'] },
    { id: 'drama_shoot', name: '드라마 촬영', cat: '배우 활동', desc: '캐스팅된 드라마 촬영. 연기와 인기가 함께 오른다.', cost: -250,
      req: { flag: 'supporting' }, hint: '드라마 배역을 따낸 뒤',
      fx: { v: { acting: 3, fame: 2, fans: 12, stamina: -6, stress: 6 } },
      great: { chance: 0.1, fx: { v: { fame: 3, fans: 30 } }, t: '이번 회 엔딩이 "레전드 엔딩"으로 화제!' },
      fail: { chance: 0.06, fx: { v: { stamina: -6, stress: 5 } }, t: '밤샘 촬영 사흘째. 쪽대본이 또 내려왔다.' },
      lines: ['새벽 4시 콜타임. 분장차에서 대본을 외웠다.', '상대 배우와 호흡이 척척 맞았다.'] },
    { id: 'film_shoot', name: '영화 촬영', cat: '배우 활동', desc: '스크린 연기. 깊이가 달라진다.', cost: -300,
      req: { any: [{ flag: 'film_small' }, { flag: 'film_lead' }] }, hint: '영화 배역을 따낸 뒤',
      fx: { v: { acting: 3, fame: 1, fans: 8, stamina: -6, stress: 6 } },
      great: { chance: 0.1, fx: { v: { acting: 2, mental: 2 } }, t: '원테이크 롱숏 성공. 스태프 전원이 박수를 쳤다.' },
      lines: ['한 장면에 하루. 영화는 느리고 깊다.', '감독이 모니터 앞에서 조용히 눈물을 훔쳤다.'] },
    { id: 'global_meet', name: '해외 캐스팅 미팅', cat: '배우 활동', desc: '해외 에이전시와 화상 미팅. 영어 실력이 필요하다.', cost: 100,
      req: { flag: 'debuted', s: { track: 'actor' }, v: { lang: '>=2', fame: '>=50' } }, hint: '배우, 외국어 2·인기 50 이상',
      fx: { v: { acting: 1, lang: 1, fame: 1, stress: 4 } },
      lines: ['"Your eyes tell the story." 캐스팅 디렉터가 말했다.', '영어 셀프 테이프를 열두 번 다시 찍었다.'] },
  ];

  const shop = [
    { id: 'remodel', name: '연습실 리모델링', price: 1000, once: true, desc: '금 간 거울을 바꾸고 방음벽을 단다. 연습 효율이 오른다.', fx: { v: { dance: 5, vocal: 3, stress: -5 } } },
    { id: 'stylist', name: '전담 스타일리스트 고용', price: 1200, once: true, desc: '코디 하나로 사람이 달라진다.', fx: { v: { visual: 8, fame: 2 } } },
    { id: 'composer', name: '히트 작곡가 섭외', price: 1500, once: true, desc: '곡 작업을 도와줄 작곡가. 자작곡이 늘고 보컬이 다듬어진다.', fx: { v: { songs: 2, vocal: 3 } } },
    { id: 'promo', name: '홍보 예산 집행', price: 800, desc: '온라인 광고와 옥외 광고. 여러 번 살 수 있다.', fx: { v: { fame: 2, fans: 25 } } },
    { id: 'healthfood', name: '건강식 정기 배송', price: 300, desc: '도시락 한 달 치. 체력 회복.', fx: { v: { stamina: 6, stress: -3 } } },
    { id: 'trainer', name: '전속 PT 트레이너', price: 900, once: true, desc: '부상 방지와 체력 강화.', fx: { v: { stamina: 8, dance: 2 } } },
    { id: 'therapist', name: '전속 심리 상담사 계약', price: 900, once: true, desc: '언제든 이야기할 수 있는 사람.', fx: { v: { mental: 8, stress: -15 } } },
    { id: 'newdorm', name: '새 숙소로 이사', price: 2000, once: true, desc: '보일러가 삐지지 않는 숙소. 모두의 기분이 좋아진다.', fx: { v: { stress: -20, heart: 3 }, aff: { haeun: 3, dojun: 3, chaerin: 3, manager: 3 } } },
    { id: 'lawyer', name: '법률 자문 계약', price: 700, once: true, desc: '악플, 루머, 계약 분쟁에 대비한다.', fx: { v: { scandal: -20 } } },
    { id: 'fansupport', name: '팬 역조공 이벤트', price: 500, desc: '팬들에게 선물과 간식을. 여러 번 살 수 있다.', fx: { v: { fans: 25, heart: 2 }, aff: { fanmaster: 2 } } },
    { id: 'van', name: '새 밴 구입', price: 1500, once: true, desc: '이동 중에도 누워서 잘 수 있다.', fx: { v: { stamina: 5, stress: -8 }, aff: { manager: 5 } } },
    { id: 'coach', name: '해외 연기 코치 초빙', price: 1800, once: true, desc: '글로벌 무대를 위한 연기·영어 코칭.', fx: { v: { acting: 8, lang: 2 } } },
  ];

  const T = (c) => ({ turn: c });
  const events = [
    // 위기 (최우선)
    { id: 'bankrupt', if: { v: { money: '<-1500' } }, scene: 'ev_bankrupt', prio: 200, at: 'start' },
    { id: 'burnout', if: { flag: 'crisis1', v: { stress: '>=95' } }, scene: 'ev_burnout', prio: 190, at: 'start' },
    // 새해 · 시즌 (start)
    { id: 'first_month', if: T('==0'), scene: 'ev_first_month', prio: 100, at: 'start' },
    { id: 'xmas1', if: T('==11'), scene: 'ev_xmas1', prio: 100, at: 'start' },
    { id: 'y2', if: T('==12'), scene: 'ev_y2', prio: 100, at: 'start' },
    { id: 'summer', if: { turn: '==19', flag: 'debuted' }, scene: 'ev_summer', prio: 100, at: 'start' },
    { id: 'y3', if: T('==24'), scene: 'ev_y3', prio: 100, at: 'start' },
    { id: 'y4', if: T('==36'), scene: 'ev_y4', prio: 100, at: 'start' },
    { id: 'final_eve', if: T('==46'), scene: 'ev_final_eve', prio: 100, at: 'start' },
    // 시상식
    { id: 'rookie_award', if: { turn: '>=23', flag: 'debuted' }, scene: 'ev_rookie_award', prio: 150 },
    { id: 'bonsang', if: { turn: '>=35', flag: 'debuted' }, scene: 'ev_bonsang', prio: 150 },
    { id: 'baeksang', if: { turn: '>=40', flag: 'debuted', s: { track: 'actor' } }, scene: 'ev_baeksang', prio: 140 },
    // 위기 (end)
    { id: 'money_low', if: { v: { money: '<0' } }, scene: 'ev_money_low', prio: 95 },
    { id: 'crisis', if: { v: { stress: '>=80' } }, scene: 'ev_crisis', prio: 90 },
    { id: 'scandal_bomb', if: { v: { scandal: '>=45' } }, scene: 'ev_scandal_bomb', prio: 88 },
    { id: 'health', if: { v: { stamina: '<15' } }, scene: 'ev_health', prio: 85, once: false },
    // 1년차
    { id: 'debut_plan', if: { turn: '>=10', noflag: ['debuted', 'debut_plan', 'debut_delay'] }, scene: 'ev_debut_plan', prio: 80 },
    { id: 'debut_plan2', if: { turn: '>=15', flag: 'debut_delay', noflag: ['debuted', 'debut_plan'] }, scene: 'ev_debut_plan2', prio: 80 },
    { id: 'debut', if: { turn: '>=11', flag: 'debut_plan', noflag: 'debuted' }, scene: 'ev_debut', prio: 80 },
    { id: 'surv_r1', if: { flag: 'survival' }, scene: 'ev_surv_r1', prio: 70 },
    { id: 'surv_r2', if: { flag: 'surv_r1' }, scene: 'ev_surv_r2', prio: 70 },
    { id: 'surv_final', if: { flag: 'surv_r2' }, scene: 'ev_surv_final', prio: 70 },
    { id: 'surv_after', if: { flag: 'surv_out' }, scene: 'ev_surv_after', prio: 69 },
    { id: 'eval1', if: T('>=2'), scene: 'ev_eval1', prio: 60 },
    { id: 'eval2', if: { turn: '>=5', noflag: 'debuted' }, scene: 'ev_eval2', prio: 60 },
    { id: 'eval3', if: { turn: '>=8', noflag: 'debuted' }, scene: 'ev_eval3', prio: 60 },
    { id: 'others_intro', if: T('>=1'), scene: 'ev_others_intro', prio: 50 },
    { id: 'surv_offer', if: { turn: '>=5', noflag: 'debuted' }, scene: 'ev_surv_offer', prio: 45 },
    { id: 'backstory1', if: T('>=3'), scene: 'ev_backstory1', prio: 40 },
    { id: 'backstory2', if: { turn: '>=8', flag: 'bs1' }, scene: 'ev_backstory2', prio: 40 },
    { id: 'poach1', if: T('>=9'), scene: 'ev_poach1', prio: 38 },
    { id: 'meet_sera', if: T('>=3'), scene: 'ev_meet_sera', prio: 35 },
    { id: 'trainee_conflict', if: T('>=4'), scene: 'ev_trainee_conflict', prio: 30 },
    // 2년차
    { id: 'first_win', if: { flag: 'debuted', s: { track: 'idol' }, v: { fame: '>=32' } }, scene: 'ev_first_win', prio: 55 },
    { id: 'first_win2', if: { flag: 'first_win_miss', noflag: 'first_win', v: { fame: '>=42' } }, scene: 'ev_first_win2', prio: 55 },
    { id: 'first_stage', if: DEB_IDOL, scene: 'ev_first_stage', prio: 50 },
    { id: 'first_set', if: DEB_ACTOR, scene: 'ev_first_set', prio: 50 },
    { id: 'cameo', if: { flag: ['debuted', 'met_pd'], s: { track: 'actor' }, turn: '>=14' }, scene: 'ev_cameo', prio: 50 },
    { id: 'supporting', if: { flag: 'cameo', noflag: 'supporting', v: { acting: '>=46', fame: '>=18' } }, scene: 'ev_supporting', prio: 50 },
    { id: 'backstory3', if: { flag: ['bs2', 'debuted'], turn: '>=18' }, scene: 'ev_backstory3', prio: 48 },
    { id: 'dating', if: { flag: 'debuted', v: { fame: '>=35' }, turn: '>=18' }, scene: 'ev_dating', prio: 46 },
    { id: 'dating_exposed', if: { flag: 'dating_denied', noflag: 'dating_public', turn: '>=26', chance: 0.5 }, scene: 'ev_dating_exposed', prio: 47 },
    { id: 'fandom_name', if: { flag: 'debuted', v: { fans: '>=60' } }, scene: 'ev_fandom_name', prio: 45 },
    { id: 'fanmeeting', if: { flag: 'debuted', v: { fans: '>=200' } }, scene: 'ev_fanmeeting', prio: 44 },
    { id: 'poach2', if: { flag: 'debuted', v: { fame: '>=35' }, turn: '>=19' }, scene: 'ev_poach2', prio: 43 },
    { id: 'malicious', if: { flag: 'debuted', v: { fame: '>=25' }, turn: '>=15' }, scene: 'ev_malicious', prio: 42 },
    { id: 'variety', if: { flag: 'debuted', v: { variety: '>=40' }, turn: '>=15' }, scene: 'ev_variety', prio: 40 },
    { id: 'fansite', if: { flag: 'debuted', v: { fans: '>=90' } }, scene: 'ev_fansite', prio: 35 },
    { id: 'others_fate', if: T('>=17'), scene: 'ev_others_fate', prio: 32 },
    { id: 'mentor', if: T('>=13'), scene: 'ev_mentor', prio: 30 },
    { id: 'birthday', if: { flag: 'debuted', turn: '>=14', v: { fans: '>=50' } }, scene: 'ev_birthday', prio: 20 },
    // 3년차
    { id: 'comeback', if: { flag: 'debuted', s: { track: 'idol' }, turn: '>=26' }, scene: 'ev_comeback', prio: 55 },
    { id: 'drama_lead', if: { flag: 'supporting', s: { track: 'actor' }, turn: '>=27' }, scene: 'ev_drama_lead', prio: 55 },
    { id: 'plagiarism', if: { flag: 'comeback', turn: '>=28' }, scene: 'ev_plagiarism', prio: 52 },
    { id: 'lead_airing', if: { flag: 'lead_role', turn: '>=30' }, scene: 'ev_lead_airing', prio: 50 },
    { id: 'tour1', if: { flag: 'debuted', s: { track: 'idol' }, v: { fans: '>=600' }, turn: '>=28' }, scene: 'ev_tour1', prio: 45 },
    { id: 'biff', if: { flag: 'debuted', s: { track: 'actor' }, turn: '>=33' }, scene: 'ev_biff', prio: 45 },
    { id: 'group_feud', if: { flag: 'group_debut', turn: '>=30' }, scene: 'ev_group_feud', prio: 40 },
    { id: 'sera_fall', if: { flag: ['met_sera', 'debuted'], turn: '>=32' }, scene: 'ev_sera_fall', prio: 37 },
    { id: 'switch_track', if: { flag: 'debuted', s: { track: 'idol' }, v: { acting: '>=55' }, turn: '>=31' }, scene: 'ev_switch_track', prio: 36 },
    { id: 'songwriter', if: { flag: 'debuted', v: { songs: '>=4' }, turn: '>=20' }, scene: 'ev_songwriter', prio: 34 },
    { id: 'reporter_deal', if: { v: { fame: '>=45' }, turn: '>=30' }, scene: 'ev_reporter_deal', prio: 33 },
    { id: 'national', if: { v: { fame: '>=100', heart: '>=70' }, turn: '>=30' }, scene: 'ev_national', prio: 33 },
    { id: 'idol_drama', if: { flag: 'debuted', s: { track: 'idol' }, v: { acting: '>=45' }, noflag: 'supporting', turn: '>=27' }, scene: 'ev_idol_drama', prio: 30 },
    // 4년차
    { id: 'billboard', if: { flag: 'world_tour', turn: '>=42' }, scene: 'ev_billboard', prio: 56 },
    { id: 'cannes', if: { flag: 'film_lead', turn: '>=41' }, scene: 'ev_cannes', prio: 56 },
    { id: 'world_tour', if: { flag: 'tour1', s: { track: 'idol' }, v: { fans: '>=1500', fame: '>=100' }, turn: '>=37' }, scene: 'ev_world_tour', prio: 55 },
    { id: 'film_offer', if: { flag: ['debuted', 'lead_role'], s: { track: 'actor' }, v: { acting: '>=70', fame: '>=75' }, turn: '>=37' }, scene: 'ev_film_offer', prio: 55 },
    { id: 'hollywood', if: { flag: 'film_lead', v: { fame: '>=120' }, turn: '>=43' }, scene: 'ev_hollywood', prio: 54 },
    { id: 'poach3', if: { flag: 'titan_offer', turn: '>=40' }, scene: 'ev_poach3', prio: 50 },
    { id: 'retire_talk', if: { v: { stress: '>=60' }, turn: '>=42' }, scene: 'ev_retire_talk', prio: 45 },
    { id: 'producer_dream', if: { turn: '>=38', any: [{ v: { songs: '>=5' } }, { v: { heart: '>=75' } }] }, scene: 'ev_producer_dream', prio: 35 },
    { id: 'sera_redemption', if: { flag: 'sera_saved', turn: '>=38' }, scene: 'ev_sera_redemption', prio: 31 },
    { id: 'mentor2', if: { flag: 'mentor_bond', turn: '>=39' }, scene: 'ev_mentor2', prio: 30 },
    // 반복 이벤트
    { id: 'rand_rest', if: { v: { stress: '>=70' }, chance: 0.25 }, scene: 'ev_rand_rest', prio: 2, once: false },
    { id: 'rand_letter', if: { flag: 'debuted', chance: 0.12 }, scene: 'ev_rand_letter', prio: 1, once: false },
  ];

  STORY.register({
    id: 'star',
    genre: '아이돌·배우 육성',
    title: '별빛을 키우는 법',
    subtitle: '망해가는 기획사의 마지막 4년',
    blurb: '삼촌에게 물려받은 건 통장 잔고 3천만 원과 금 간 거울, 그리고 연습생 셋. 단 한 명에게 회사의 운명을 걸고, 대화로 마음을 얻어 4년 안에 그 아이를 별로 만들어라. 아이돌의 가요대상인가, 배우의 칸 영화제인가.',
    cover: { bg: 'stage_concert', c: 'haeun', e: 'smile' },
    world: '현대 서울의 연예계. 대형 기획사 타이탄 엔터테인먼트가 데이터와 자본으로 시장을 쥐고 있고, 작은 기획사들은 한 명의 스타에 회사의 명운을 건다. 플레이어는 세상을 떠난 삼촌에게서 마포구 지하 1층의 망해가는 "별빛 엔터테인먼트"를 물려받은 새 대표다. 회사에는 15년 차 매니저 오정만 실장과 연습생 셋 — 메인보컬을 꿈꾸는 한하은, 전 육상선수 댄서 강도준, 몰락한 국민 아역 윤채린 — 이 남아 있다. 대표는 한 명을 골라 아이돌 또는 배우로 4년간 키운다. 음악방송, 음원 차트 올킬, 팬사인회, 직캠 떡상, 서바이벌 오디션, 드라마 캐스팅, 연말 시상식 같은 K-엔터 세계의 모든 것이 무대다. 악플, 열애설, 표절 논란, 이적 제안, 번아웃도 함께 온다. 대표는 스케줄표만이 아니라 대화로 아이의 마음을 얻어야 하며, 스타를 상품이 아닌 사람으로 대하는지가 결말을 가른다. 대표를 부르는 호칭은 "대표님"이다.',
    player: { label: '대표님의 이름', def: '김별' },
    vars: { money: 3000, fame: 0, fans: 0, stress: 10, scandal: 0, wins: 0, songs: 0, lang: 0, awards: 0 },
    varNames: { money: '자금(만 원)', fame: '인기', fans: '팬덤', scandal: '논란', wins: '1위', songs: '자작곡', lang: '외국어', awards: '수상' },
    stats: [
      { id: 'vocal', name: '보컬', max: 100, color: '#ff8fb1' },
      { id: 'dance', name: '댄스', max: 100, color: '#7ab8ff' },
      { id: 'acting', name: '연기', max: 100, color: '#c9a0ff' },
      { id: 'variety', name: '예능감', max: 100, color: '#ffd166' },
      { id: 'visual', name: '비주얼', max: 100, color: '#ff9f6b' },
      { id: 'mental', name: '멘탈', max: 100, color: '#7fd1b9' },
      { id: 'stamina', name: '체력', max: 100, color: '#8bd66a' },
      { id: 'heart', name: '인성', max: 100, color: '#f4a3c8' },
      { id: 'stress', name: '스트레스', max: 100, color: '#e05a5a' },
    ],
    affStart: { haeun: 30, dojun: 30, chaerin: 15, manager: 40, rivalceo: 0, pd: 5, mentor: 10, reporter: 5, rival: 0, fanmaster: 10 },
    chars,
    start: 'prologue',
    scenes,
    endings,
    endingRules,
    sim: {
      unit: 'month',
      start: { year: 1, month: 1 },
      yearLabel: '{y}년차 {m}월',
      turns: 48,
      slots: 3,
      slotNames: ['상순', '중순', '하순'],
      hubChar: 's:star',
      hubBg: 'practice_room',
      hubBgNight: 'dorm',
      money: 'money',
      hud: ['money', 'fame', 'fans'],
      activities,
      shop,
      events,
      turnFx: { v: { money: -80, stress: -3 } },
      finale: 'finale',
    },
  });
})();
