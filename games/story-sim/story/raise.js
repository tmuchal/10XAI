// 운명극장 — 육성 시뮬레이션 팩: 「별을 키우는 용사」
// 용사가 열 살 고아 소녀를 맡아 열여덟 살 성년식까지 키운다. 월 3순(상순/중순/하순) × 96턴.
// 전역 충돌을 막기 위해 IIFE 로 감싼다(클래식 스크립트끼리 const 를 공유하므로).
(function () {
  'use strict';

  // ---------- 도우미 ----------
  // 턴 구간 조건 (나이 = 10 + floor(turn/12), 3월 시작)
  const R = (a, b) => ({ all: [{ turn: '>=' + a }, { turn: '<=' + b }] });
  // 나이에 따라 딸 캐릭터 id 를 바꿔 같은 장면을 만든다
  const byAge = fn => [{
    if: { age: '<14' }, then: fn('daughter'),
    else: [{ if: { age: '<17' }, then: fn('daughter_teen'), else: fn('daughter_adult') }],
  }];
  const D = age => (age < 14 ? 'daughter' : age < 17 ? 'daughter_teen' : 'daughter_adult');

  // ---------- 딸 대화 토픽 (나이별 캐릭터 id 로 생성) ----------
  const dTalk = d => [
    { t: '오늘 하루 어땠어?', lines: [
      { c: d, t: '음… 오늘은요, 아니 오늘은, 그냥 평범했어!', e: 'smile' },
      { c: d, t: '근데 아빠가 물어봐 주니까 갑자기 특별한 하루였던 것 같아.', e: 'shy' },
      { c: 'me', t: '그럼 매일 물어봐야겠네.' },
      { c: d, t: '…매일은 좀 귀찮거든? 이틀에 한 번.', e: 'laugh' },
    ], fx: { aff: { daughter: 2 }, v: { stress: -2 } } },

    { t: '밥은 잘 먹고 다니니?', if: { age: '<14' }, lines: [
      { c: d, t: '마르타 할머니가 당근을 몰래 수프에 갈아 넣어.', e: 'angry' },
      { c: d, t: '나 다 알아. 주황색이잖아. 수프가 주황색이면 범인은 당근이야.', e: 'cold' },
      { c: 'me', t: '명탐정이 따로 없구나.' },
      { c: d, t: '그러니까 아빠가 할머니한테 말 좀 해 줘. 딸의 인권이 걸린 문제야.', e: 'worried' },
    ], fx: { aff: { daughter: 1 }, v: { hp: 1 } } },

    { t: '친구는 좀 생겼어?', if: { age: '<15' }, lines: [
      { c: d, t: '어… 빵집 레오랑, 그리고 고양이 한 마리.', e: 'neutral' },
      { c: d, t: '고양이도 친구로 쳐 주는 거지? 걔가 제일 말이 잘 통하는데.', e: 'smile' },
      { c: 'me', t: '물론이지. 고양이는 비밀을 안 퍼뜨리니까.' },
      { c: d, t: '맞아! 아빠 좀 아는구나.', e: 'laugh' },
    ], fx: { aff: { daughter: 2, leo: 1 } } },

    { t: '공부는 할 만해?', if: { v: { int: '<40' } }, lines: [
      { c: d, t: '글자들이 자꾸 춤을 춰. 특히 「왕국 연대기」는 왕 이름이 다 똑같아.', e: 'tired' },
      { c: d, t: '레오폴트 1세, 레오폴트 2세, 레오폴트 3세… 이름 짓기 귀찮았던 거 아니야?', e: 'angry' },
      { c: 'me', t: '아빠도 그 시험은 찍었어.' },
      { c: d, t: '용사가 찍었다고?! …조금 안심했어.', e: 'surprised' },
    ], fx: { aff: { daughter: 2 }, v: { stress: -3 } } },

    { t: '요즘 읽는 책 있어?', if: { v: { int: '>=40' } }, lines: [
      { c: d, t: '「별자리와 옛 왕국들」. 도서관 제일 안쪽 서가에서 찾았어.', e: 'smile' },
      { c: d, t: '북쪽에 아스트렐이라는 나라가 있었대. 마왕군한테 하룻밤 만에 무너졌다는데….', e: 'worried' },
      { c: d, t: '이상하지. 처음 보는 이름인데 자꾸 읽고 싶어져.', e: 'neutral' },
    ], fx: { aff: { daughter: 1 }, v: { int: 1 }, flag: 'heard_astrelle' } },

    { t: '힘든 일 있으면 말해.', if: { v: { stress: '>=50' } }, lines: [
      { c: d, t: '…없어.', e: 'cold' },
      { c: d, t: '없다니까. 그냥, 요즘 좀 졸려서 그래.', e: 'tired' },
      { c: 'me', t: '이번 달엔 좀 쉬자. 아빠가 일정 다시 짤게.' },
      { c: d, t: '……응. 고마워. 사실은 좀, 많이 힘들었어.', e: 'cry' },
    ], fx: { aff: { daughter: 4 }, v: { stress: -8 } } },

    { t: '검 연습은 재밌어?', if: { v: { combat: '>=20' } }, lines: [
      { c: d, t: '가렌 아저씨가 나보고 "타고난 손목"이래!', e: 'laugh' },
      { c: d, t: '근데 아저씨는 모든 사람한테 그렇게 말하는 것 같기도 해. 빵집 아저씨한테도 했어.', e: 'smirk' },
      { c: 'me', t: '그 사람은 빵 반죽을 잘 치대거든.' },
      { c: d, t: '아하, 그래서 손목이구나. 인정.', e: 'smile' },
    ], fx: { aff: { daughter: 2, garen: 1 }, v: { combat: 1 } } },

    { t: '마법 공부는 어때?', if: { v: { magic: '>=20' } }, lines: [
      { c: d, t: '오늘은 촛불을 켜려다가 커튼을 켰어.', e: 'worried' },
      { c: d, t: '모르간 선생님이 "불은 불이지요"라고 하셨어. 그게 위로야?', e: 'angry' },
      { c: d, t: '그래도… 손끝에서 별빛이 튀어나오는 순간은 진짜 좋아.', e: 'shy' },
    ], fx: { aff: { daughter: 2, morgan: 1 }, v: { magic: 1 } } },

    { t: '기도는 무슨 내용으로 해?', if: { v: { faith: '>=25' } }, lines: [
      { c: d, t: '비밀인데… 첫 번째는 아빠 무릎이 덜 아프게 해 달라는 거.', e: 'shy' },
      { c: d, t: '두 번째는 고양이 고등어가 쥐를 그만 물어 오게 해 달라는 거.', e: 'neutral' },
      { c: d, t: '세 번째는… 진짜 엄마 아빠가 하늘에서 편하게 있게 해 달라는 거.', e: 'sad' },
      { c: 'me', t: '좋은 기도구나.' },
    ], fx: { aff: { daughter: 3 }, v: { faith: 1, moral: 1 } } },

    { t: '돈 얘기 좀 할까?', if: { v: { money: '<100' } }, lines: [
      { c: d, t: '아빠, 우리 혹시… 가난해?', e: 'worried' },
      { c: 'me', t: '가난한 게 아니라 잠시 현금이 여행을 떠난 거야.' },
      { c: d, t: '그럼 내가 아르바이트 더 할게. 여관 아주머니가 나 일 잘한대.', e: 'smile' },
      { c: d, t: '용사님 집 가계부는 내가 지킨다!', e: 'laugh' },
    ], fx: { aff: { daughter: 3 }, v: { house: 1 } } },

    { t: '좋아하는 사람 있어?', if: { age: '>=13' }, lines: [
      { c: d, t: '뭐?! 아, 아빠는 그런 걸 왜 물어?!', e: 'surprised' },
      { c: d, t: '없어. 진짜 없어. 레오는 그냥 빵 주는 애고, 루카스는 그냥 잘난 척하는 애고….', e: 'shy' },
      { c: 'me', t: '이름을 두 개나 댔는데.' },
      { c: d, t: '아빠 미워! 오늘 저녁 설거지 아빠가 해!', e: 'angry' },
    ], fx: { aff: { daughter: 1 } } },

    { t: '커서 뭐가 되고 싶어?', if: { age: '>=12' }, lines: [
      { c: d, t: '음… 어제는 기사였고, 오늘은 화가고, 내일은 아마 요리사.', e: 'smile' },
      { c: d, t: '아빠는 내가 뭐가 됐으면 좋겠어?', e: 'neutral' },
      { c: 'me', t: '네가 웃으면서 할 수 있는 거면 뭐든.' },
      { c: d, t: '…그 대답 반칙이야. 그런 말 들으면 진짜 열심히 하고 싶어지잖아.', e: 'shy' },
    ], fx: { aff: { daughter: 3 }, v: { stress: -2, moral: 1 } } },

    { t: '그 펜던트, 아직도 하고 다니네.', if: { flag: 'pendant_glow' }, lines: [
      { c: d, t: '응. 이거 없으면 잠이 안 와.', e: 'neutral' },
      { c: d, t: '가끔 밤에 따뜻해져. 누가 "괜찮아"라고 말해 주는 것처럼.', e: 'smile' },
      { c: d, t: '아빠, 이거 진짜 우리 엄마 거였을까?', e: 'worried' },
      { c: 'me', t: '언젠가 꼭 알아내 줄게.' },
    ], fx: { aff: { daughter: 3 } } },

    { t: '아스트렐… 무섭지 않아?', if: { flag: 'heritage_known' }, lines: [
      { c: d, t: '무서워. 한 나라의 마지막 사람이라는 거.', e: 'sad' },
      { c: d, t: '근데 더 무서운 건, 그게 알려지면 아빠 딸이 아니게 될까 봐.', e: 'cry' },
      { c: 'me', t: '왕관을 쓰든 칼을 차든, 너는 내 딸이야. 그건 누구도 못 바꿔.' },
      { c: d, t: '…응. 그 말, 백 번 해 줘.', e: 'smile' },
    ], fx: { aff: { daughter: 5 }, v: { stress: -5 } } },

    { t: '다리우스라는 녀석 말이야.', if: { flag: 'met_darius' }, lines: [
      { c: d, t: '걔 나쁜 애 아니야. …아마도.', e: 'worried' },
      { c: d, t: '자꾸 나를 "공주님"이라고 불러. 비꼬는 건지 진심인지 모르겠어.', e: 'angry' },
      { c: d, t: '근데 걔 눈은 가끔, 길 잃은 강아지 같아.', e: 'sad' },
    ], fx: { aff: { darius: 1 } } },

    { t: '요즘 반항기라며?', if: { flag: 'rebel' }, lines: [
      { c: d, t: '반항기 아니거든. 자아 찾기 기간이거든.', e: 'cold' },
      { c: d, t: '…근데 어제 문 쾅 닫은 건 미안. 경첩 떨어졌지?', e: 'shy' },
      { c: 'me', t: '아빠가 고쳤어. 용사는 경첩도 고친다.' },
      { c: d, t: '풉. 그게 뭐야.', e: 'laugh' },
    ], fx: { aff: { daughter: 4 }, v: { stress: -4 } } },

    { t: '같이 산책 갈래?', lines: [
      { c: d, t: '갈래! 언덕 위에 노을 보러 가자.', e: 'laugh' },
      { c: d, t: '(언덕 위, 노을을 보며) 아빠, 이 도시는 아빠가 지킨 거지?', e: 'neutral' },
      { c: d, t: '그럼 나도 커서 뭔가 지키는 사람이 될래. 아빠처럼.', e: 'smile' },
    ], fx: { aff: { daughter: 3 }, v: { stress: -5, sense: 1 } } },

    { t: '독립하면 뭐 하고 싶어?', if: { age: '>=16' }, lines: [
      { c: d, t: '독립이라니… 벌써 그런 얘길 해?', e: 'sad' },
      { c: d, t: '음, 창문이 큰 집. 그리고 아빠 방. 아빠는 가끔 와서 자고 가.', e: 'smile' },
      { c: 'me', t: '가끔?' },
      { c: d, t: '…자주. 아니, 그냥 같이 살자. 계획 수정.', e: 'shy' },
    ], fx: { aff: { daughter: 4 } } },
  ];

  // ---------- 캐릭터 ----------
  const DPERSONA_BASE = '용사 {name}에게 입양된 소녀 {s.dname}. 북쪽 국경의 불탄 마을에서 발견된 고아로, 목에 은빛 별 펜던트를 걸고 있다. 사실 그녀는 마왕군에게 멸망한 북방 별의 왕국 아스트렐의 마지막 핏줄이며, 그 피에는 마왕의 봉인을 완성하거나 깨뜨릴 수 있는 별의 힘이 잠들어 있다(본인은 이야기 초반엔 모른다). {name}를 "아빠"라고 부르며 반말을 쓴다. 절대 {name}를 "용사님"이라고 딱딱하게 부르지 않고, 누구에게도 잔인하게 굴지 않는다.';

  const chars = {
    daughter: {
      name: '{s.dname}', short: '{s.dname}', role: '용사의 딸 (10~13세)', color: '#c9b8ff',
      look: { sex: 'f', age: 'child', skin: '#f8e2d4', hair: '#cfc6ee', hair2: '#8f84cc', hairStyle: 'twintail', bangs: 'straight', eyes: '#5f9dff', eyeShape: 'round', outfit: 'dress_child', outfitColor: '#f4a7b9', accent: '#ffffff', acc: ['ribbon', 'necklace'] },
      persona: DPERSONA_BASE + ' 지금은 10~13살. 호기심이 많고 말이 빠르며, 질문을 세 개씩 한꺼번에 한다. 당근을 싫어하고 고양이 고등어를 아낀다. 아빠에게 버림받을까 봐 속으로 겁을 내서, 칭찬받으면 과하게 신나고 혼나면 조용히 방에 숨는다. 말끝에 "~거든?", "진짜로?"를 자주 붙인다.',
      talk: dTalk('daughter'),
    },
    daughter_teen: {
      name: '{s.dname}', short: '{s.dname}', role: '용사의 딸 (14~16세)', color: '#c9b8ff',
      look: { sex: 'f', age: 'teen', skin: '#f8e2d4', hair: '#cfc6ee', hair2: '#8f84cc', hairStyle: 'ponytail', bangs: 'side', eyes: '#5f9dff', eyeShape: 'round', outfit: 'school', outfitColor: '#3b4f8a', accent: '#f4d27a', acc: ['ribbon', 'necklace'] },
      persona: DPERSONA_BASE + ' 지금은 14~16살 사춘기. 겉으로는 쿨한 척, 아빠의 잔소리에 "알았다고"를 연발하지만 속으로는 여전히 아빠의 인정을 갈구한다. 자기 출생의 비밀과 진로 사이에서 흔들린다. 부끄러우면 괜히 화를 내고, 진심을 말할 땐 목소리가 작아진다. 스트레스가 높으면 문을 쾅 닫는다.',
      talk: dTalk('daughter_teen'),
    },
    daughter_adult: {
      name: '{s.dname}', short: '{s.dname}', role: '용사의 딸 (17~18세)', color: '#c9b8ff',
      look: { sex: 'f', age: 'adult', skin: '#f8e2d4', hair: '#cfc6ee', hair2: '#8f84cc', hairStyle: 'long', bangs: 'side', eyes: '#5f9dff', eyeShape: 'gentle', outfit: 'gown', outfitColor: '#e9e4ff', accent: '#c9a74a', acc: ['necklace', 'earrings', 'hairpin'] },
      persona: DPERSONA_BASE + ' 지금은 17~18살, 성년식을 앞둔 숙녀. 차분하고 농담을 잘하며, 이제는 아빠를 걱정하는 쪽이 되었다. 자신의 길을 스스로 고르려 하지만 마지막 한 걸음은 아빠의 한마디를 기다린다. 어린 시절 이야기를 꺼내면 웃다가 울기도 한다.',
      talk: dTalk('daughter_adult'),
    },

    marta: {
      name: '마르타', short: '마르타', role: '가정부 할머니', color: '#d9c7a7',
      look: { sex: 'f', age: 'elder', skin: '#f1d3bf', hair: '#cfcfcf', hairStyle: 'bun', bangs: 'parted', eyes: '#6b5a4e', eyeShape: 'gentle', outfit: 'maid', outfitColor: '#4a4a5a', accent: '#ffffff', acc: ['glasses'] },
      persona: '용사의 집을 돌보는 일흔 살 가정부. 왕실이 "용사가 애를 굶겨 죽일까 봐" 붙여 준 사람이다. 입이 거칠고 잔소리가 많지만 아이를 누구보다 아끼며, 딸의 컨디션과 속마음을 제일 먼저 눈치챈다. {name}를 "도련님"이라고 부르며 존댓말 반, 반말 반을 섞는다. 젊은 시절 궁정 시녀장이었다는 과거가 있다. 절대 아이 앞에서 울지 않는다.',
      talk: [
        { t: '아이 상태는 좀 어때요?', lines: [
          { c: 'marta', t: '밥은 두 공기, 잠은 여덟 시간, 한숨은 하루 세 번. 대충 멀쩡합니다.', e: 'neutral' },
          { c: 'marta', t: '한숨이 다섯 번 넘어가면 그땐 도련님이 좀 들여다보시우.', e: 'cold' },
        ], fx: { aff: { marta: 2 } } },
        { t: '제가 잘하고 있는 걸까요?', lines: [
          { c: 'marta', t: '잘하는 부모는 그런 질문을 안 해요. 좋은 부모가 하지.', e: 'smile' },
          { c: 'marta', t: '마왕 목을 벤 손으로 머리 땋아 주는 것도 이제 제법이던데.', e: 'laugh' },
        ], fx: { aff: { marta: 3 }, v: { stress: -2 } } },
        { t: '궁정 시절 이야기 좀 해 주세요.', lines: [
          { c: 'marta', t: '선왕 폐하 시절, 이 몸이 시녀장이었지요. 공주님들 드레스 끈을 마흔 개씩 묶었어요.', e: 'smirk' },
          { c: 'marta', t: '그중 한 분은… 별처럼 웃는 분이셨는데. 아이고, 늙으면 말이 많아져.', e: 'sad' },
        ], fx: { aff: { marta: 2 }, flag: 'marta_hint' } },
        { t: '살림 비결이 뭐예요?', lines: [
          { c: 'marta', t: '돈은 적게 쓰고, 칭찬은 많이 쓰고, 소금은 적당히.', e: 'neutral' },
          { c: 'marta', t: '아이한테 집안일 좀 시키세요. 손이 야무져야 어디 가서도 안 굶어요.', e: 'cold' },
        ], fx: { aff: { marta: 2 }, v: { house: 1 } } },
        { t: '마르타 씨는 행복하세요?', if: { age: '>=13' }, lines: [
          { c: 'marta', t: '별걸 다 물으시네. …이 나이에 아침마다 "할머니!" 소리 듣는 거, 그게 행복이지 뭐예요.', e: 'shy' },
          { c: 'marta', t: '에헴. 수프 식겠어요. 어서 가요.', e: 'cold' },
        ], fx: { aff: { marta: 4 } } },
        { t: '그 펜던트 문양, 본 적 있으세요?', if: { flag: 'pendant_glow' }, lines: [
          { c: 'marta', t: '……여덟 꼭지 별이라. 그건 이 나라 문장이 아니에요.', e: 'worried' },
          { c: 'marta', t: '북쪽, 아주 북쪽의 것이지요. 더는 묻지 마시우. 늙은이 입은 무거워야 오래 삽니다.', e: 'cold' },
        ], fx: { aff: { marta: 1 }, flag: 'heard_astrelle' } },
      ],
    },

    garen: {
      name: '가렌 브라이트실드', short: '가렌', role: '왕국 기사단장, 옛 전우', color: '#e0a060',
      look: { sex: 'm', age: 'adult', skin: '#e2b48f', hair: '#6b4a2e', hairStyle: 'short', bangs: 'none', eyes: '#7a5230', eyeShape: 'gentle', outfit: 'armor', outfitColor: '#8a8f99', accent: '#b8322f', acc: ['beard', 'scar', 'cape'] },
      persona: '{name}와 함께 마왕을 쓰러뜨린 파티의 방패잡이, 지금은 왕국 기사단장. 곰 같은 덩치에 웃음소리가 크고, 모든 문제를 "일단 팔굽혀펴기 백 번"으로 해결하려 든다. {name}를 "형님"이라 부르며 반말과 허풍을 섞는다. 결혼을 못 해서 {s.dname}를 조카처럼 끔찍이 아낀다. 전쟁에서 잃은 동료들 이야기를 할 때만 목소리가 낮아진다. 절대 아이에게 진검을 먼저 쥐여 주지 않는다.',
      talk: [
        { t: '기사단은 요즘 어때?', lines: [
          { c: 'garen', t: '평화롭지! 너무 평화로워서 신입들이 칼 대신 뜨개질을 배우고 있어.', e: 'laugh' },
          { c: 'garen', t: '…농담이야. 북쪽 국경에 마족 잔당이 좀 보인다더군. 형님은 신경 쓰지 마.', e: 'worried' },
        ], fx: { aff: { garen: 2 } } },
        { t: '우리 애 검술 재능 있어?', lines: [
          { c: 'garen', t: '있지! 첫날 나무칼로 내 정강이를 정확히 쳤거든.', e: 'laugh' },
          { c: 'garen', t: '형님 닮았어. 급소를 아는 눈이야. 좀 무섭더라.', e: 'smirk' },
        ], fx: { aff: { garen: 2 }, v: { combat: 1 } } },
        { t: '옛날 얘기 해 볼까.', lines: [
          { c: 'garen', t: '마왕성 계단 기억나? 형님이 "여기서 딱 한 번만 쉬자" 해 놓고 세 시간 잤잖아.', e: 'laugh' },
          { c: 'garen', t: '그때 죽은 녀석들 몫까지… 우린 잘 살아야 해, 형님.', e: 'sad' },
        ], fx: { aff: { garen: 3 } } },
        { t: '장가는 언제 가?', lines: [
          { c: 'garen', t: '큭. 형님, 그건 마왕보다 강한 공격이야.', e: 'cry' },
          { c: 'garen', t: '요즘 빵집 과부 한나 씨가 나한테 식빵 끄트머리를 챙겨 주거든. 이건 신호일까?', e: 'shy' },
        ], fx: { aff: { garen: 2 } } },
        { t: '기사 시험은 어떤 거야?', if: { age: '>=14' }, lines: [
          { c: 'garen', t: '열여섯부터 볼 수 있어. 무예, 체력, 그리고 기사도… 도덕 말이야.', e: 'neutral' },
          { c: 'garen', t: '칼만 잘 쓰는 놈은 용병이지 기사가 아니거든. 그 애한테 둘 다 가르치자고.', e: 'smile' },
        ], fx: { aff: { garen: 2 }, flag: 'knows_knight_exam' } },
      ],
    },

    morgan: {
      name: '모르간 엘더윈', short: '모르간', role: '수상한 마법사', color: '#a58cff',
      look: { sex: 'm', age: 'adult', skin: '#f0e6e0', hair: '#d7dbe8', hair2: '#8f9bb8', hairStyle: 'long_m', bangs: 'parted', eyes: '#a58cff', eyeShape: 'droopy', outfit: 'robe', outfitColor: '#2b2350', accent: '#c9a74a', acc: ['monocle', 'earrings'] },
      persona: '왕립 마법 학원의 괴짜 객원 교수. 나른한 말투와 수수께끼 같은 비유를 즐기고, 늘 사탕을 문다. 정체는 멸망한 아스트렐 왕국의 궁정 마법사로, 12년 전 갓난 공주를 품에 안고 탈출했다가 국경 마을에 맡긴 장본인이다. 그 죄책감 때문에 {s.dname}를 멀리서 지켜본다. 누구에게나 정중한 존댓말을 쓰고 "흐음"으로 말을 시작한다. 비밀을 한 번에 털어놓지 않고, 거짓말은 하지 않되 진실을 조각내어 건넨다.',
      talk: [
        { t: '선생님, 우리 애 마법 재능은요?', lines: [
          { c: 'morgan', t: '흐음. 재능이라는 말은 부족하군요. 우물에 물이 있냐고 묻는 것과 비슷하달까요.', e: 'smirk' },
          { c: 'morgan', t: '다만 그 우물이 아주, 아주 깊습니다. 두레박 줄을 튼튼하게 가르치지요.', e: 'neutral' },
        ], fx: { aff: { morgan: 2 }, v: { magic: 1 } } },
        { t: '왜 늘 사탕을 무세요?', lines: [
          { c: 'morgan', t: '흐음, 마력은 단것을 좋아합니다. …라고 학생들에게 말하지요.', e: 'smile' },
          { c: 'morgan', t: '사실은 담배를 끊으려고요. 제자에게 들키면 안 됩니다. 비밀입니다.', e: 'shy' },
        ], fx: { aff: { morgan: 2 } } },
        { t: '북쪽 나라에 대해 아세요?', if: { flag: 'heard_astrelle' }, lines: [
          { c: 'morgan', t: '아스트렐. 밤하늘을 문장으로 쓰던 나라였지요. 별을 읽는 왕과, 별을 부르는 무녀들.', e: 'sad' },
          { c: 'morgan', t: '그 나라의 마지막 밤을… 저는 조금 압니다. 언젠가, 준비가 되면 말씀드리지요.', e: 'worried' },
        ], fx: { aff: { morgan: 3 }, flag: 'morgan_hint' } },
        { t: '마왕의 봉인은 괜찮은 겁니까?', if: { age: '>=13' }, lines: [
          { c: 'morgan', t: '당신이 친 봉인은 훌륭합니다. 다만 모든 자물쇠에는 열쇠 구멍이 있지요.', e: 'cold' },
          { c: 'morgan', t: '그 열쇠가 누구인지 마족들이 알아내기 전에… 흐음, 차나 한잔 더 하시지요.', e: 'smirk' },
        ], fx: { aff: { morgan: 1 } } },
        { t: '선생님은 왜 이 아이를 챙기세요?', if: { age: '>=12' }, lines: [
          { c: 'morgan', t: '흐음. 빚이 있어서요. 아주 오래된, 갚을 길 없는 빚.', e: 'sad' },
          { c: 'morgan', t: '당신이 그 아이를 주워 와 주어서 감사합니다, 용사님. 진심으로.', e: 'smile' },
        ], fx: { aff: { morgan: 3 } } },
      ],
    },

    lucas: {
      name: '루카스 폰 에렌시아', short: '루카스', role: '에렌시아 제2왕자', color: '#f2d27c',
      look: { sex: 'm', age: 'teen', skin: '#f6e1d3', hair: '#f2d27c', hair2: '#d9a94a', hairStyle: 'short', bangs: 'parted', eyes: '#3aa37a', eyeShape: 'sharp', outfit: 'suit', outfitColor: '#1f3a6e', accent: '#d9b44a', acc: ['epaulets'] },
      persona: '에렌시아 왕국의 제2왕자, {s.dname}보다 한 살 많다. 잘생기고 말솜씨가 좋지만 오만한 척하는 건 외로움을 감추기 위해서다. 형인 왕세자와 늘 비교당해 왔고, 궁 밖을 몰래 나와 시장에서 "그냥 루크"로 지내는 걸 좋아한다. {s.dname}에게는 처음엔 반말로 놀리다가, 점점 진지해진다. 용사 {name}를 동경하지만 인정하지 않는다. 절대 약속을 어기지 않는다.',
      talk: [
        { t: '왕자님, 또 궁에서 도망 나왔어?', lines: [
          { c: 'lucas', t: '도망이 아니라 민정 시찰이야. 시장 꼬치구이 가격을 조사하는 중이지.', e: 'smirk' },
          { c: 'lucas', t: '…세 개째 먹고 있는 건 샘플이 부족해서야.', e: 'shy' },
        ], fx: { aff: { lucas: 2 } } },
        { t: '우리 딸이랑은 잘 지내?', lines: [
          { c: 'lucas', t: '걘 날 왕자 취급을 안 해요. 어제는 내 이마에 딱밤을 때렸어요.', e: 'angry' },
          { c: 'lucas', t: '…그게 싫지 않았다는 게 문제지만요. 아, 방금 건 못 들은 걸로.', e: 'shy' },
        ], fx: { aff: { lucas: 2 } } },
        { t: '형님이랑은 어때?', if: { age: '>=13' }, lines: [
          { c: 'lucas', t: '형은 완벽해요. 검도, 학문도, 웃는 각도까지. 저는 예비품이고요.', e: 'cold' },
          { c: 'lucas', t: '그러니까 용사님 같은 사람이 부러워요. 누구의 예비품도 아니잖아요.', e: 'sad' },
        ], fx: { aff: { lucas: 3 } } },
        { t: '왕자로 사는 건 어때?', lines: [
          { c: 'lucas', t: '금으로 된 새장이에요. 모이는 맛있는데 날 수가 없죠.', e: 'sad' },
          { c: 'lucas', t: '그 애는 내가 본 사람 중에 제일 자유로워 보여요. 부럽게.', e: 'smile' },
        ], fx: { aff: { lucas: 2 } } },
        { t: '무도회 준비는 잘돼?', if: { age: '>=14' }, lines: [
          { c: 'lucas', t: '첫 춤 상대를 아직 못 정했어요. 아니, 정했는데 상대가 모르고 있어요.', e: 'shy' },
          { c: 'lucas', t: '용사님, 혹시… 따님 발 크기가 몇이죠? 아니 그게 아니라, 구두를 선물… 아무것도 아닙니다!', e: 'surprised' },
        ], fx: { aff: { lucas: 3 } } },
      ],
    },

    cecilia: {
      name: '세실리아 드 로즈벨', short: '세실리아', role: '공작 영애, 라이벌', color: '#e06a5a',
      look: { sex: 'f', age: 'teen', skin: '#f9e4d8', hair: '#c2453a', hair2: '#f08a5d', hairStyle: 'wavy', bangs: 'straight', eyes: '#c08a2a', eyeShape: 'sharp', outfit: 'gown', outfitColor: '#7b2d4f', accent: '#f2c14e', acc: ['tiara', 'ribbon'] },
      persona: '로즈벨 공작가의 외동딸, {s.dname}와 동갑. 예법, 무용, 미술, 성적 모든 것에서 일등을 해야 직성이 풀리는 노력파. 고아 출신인 {s.dname}가 자기와 겨루는 게 처음엔 못마땅했지만, 점점 유일하게 대등한 친구로 여긴다. 말끝마다 "흥"과 "~거든요"를 붙이는 고상한 존댓말을 쓴다. 엄격한 어머니에게 칭찬받아 본 적이 없다. 지는 건 싫어해도 비겁하게 이기지는 않는다.',
      talk: [
        { t: '세실리아 양, 안녕하세요.', lines: [
          { c: 'cecilia', t: '흥. 용사님이시군요. 따님께 전해 주세요. 이번 시험도 제가 일등이라고.', e: 'smirk' },
          { c: 'cecilia', t: '…그리고 지난번에 빌린 손수건 돌려 드린다고요. 빨아서, 다려서, 향수까지 뿌렸거든요.', e: 'shy' },
        ], fx: { aff: { cecilia: 2 } } },
        { t: '우리 딸이 라이벌이라고?', lines: [
          { c: 'cecilia', t: '라이벌이라뇨. 저와 대등한 사람은 없거든요.', e: 'cold' },
          { c: 'cecilia', t: '다만 그 애가 제 뒤를 제일 바짝 쫓아오는 건 인정해 드리죠. 조금, 아주 조금.', e: 'smirk' },
        ], fx: { aff: { cecilia: 2 } } },
        { t: '어머님은 잘 계시니?', if: { age: '>=12' }, lines: [
          { c: 'cecilia', t: '어머니는 제 성적표에서 "이등"이란 글자만 찾으세요. 없으면 아무 말씀도 없고요.', e: 'sad' },
          { c: 'cecilia', t: '따님은 좋겠어요. 넘어져도 웃어 주는 아버지가 있어서. …부러운 거 아니거든요.', e: 'cry' },
        ], fx: { aff: { cecilia: 4 } } },
        { t: '취미가 뭐야?', lines: [
          { c: 'cecilia', t: '취미라뇨. 저는 전부 진지하게 하거든요.', e: 'cold' },
          { c: 'cecilia', t: '…몰래 고양이 스케치를 해요. 따님네 고등어, 모델로 빌려도 되나요?', e: 'shy' },
        ], fx: { aff: { cecilia: 3 }, v: { sense: 1 } } },
        { t: '다음 대회도 나올 거야?', if: { age: '>=11' }, lines: [
          { c: 'cecilia', t: '당연하죠. 이번엔 반드시 이겨요. 지난번엔 바람이 불어서 진 거거든요.', e: 'angry' },
          { c: 'cecilia', t: '그러니까 따님도 대충 하면 용서 안 해요. 제 승리가 싸구려가 되잖아요.', e: 'smirk' },
        ], fx: { aff: { cecilia: 2 } } },
      ],
    },

    leo: {
      name: '레오 베이커', short: '레오', role: '빵집 아들, 소꿉친구', color: '#d8a657',
      look: { sex: 'm', age: 'teen', skin: '#f0caa8', hair: '#a0622d', hairStyle: 'messy', bangs: 'straight', eyes: '#7a5230', eyeShape: 'round', outfit: 'casual', outfitColor: '#d8a657', accent: '#6b8e4e', acc: ['mole'] },
      persona: '용사의 집 건너편 "햇살 빵집"의 아들. {s.dname}보다 한 살 많고, 새벽 네 시에 일어나 반죽을 치대는 성실한 소년. 수줍고 말수가 적지만 말할 땐 솔직하다. 반말을 쓰고 "그, 그러니까"로 말을 더듬는다. {s.dname}를 처음 본 날부터 좋아했지만 한 번도 티를 내지 못했다. 용사님을 "아저씨"라 부르며 무서워한다. 절대 빵을 버리지 않는다.',
      talk: [
        { t: '레오, 오늘 빵은 뭐야?', lines: [
          { c: 'leo', t: '오, 오늘은 호두 크림빵이요. 그, 그러니까… 걔가 좋아하는 거.', e: 'shy' },
          { c: 'leo', t: '아, 아니요! 손님들이 좋아하는 거요! 손님들!', e: 'surprised' },
        ], fx: { aff: { leo: 2 } } },
        { t: '꿈이 뭐야?', lines: [
          { c: 'leo', t: '왕국에서 제일 맛있는 빵집이요. 아버지 빵집을 키워서요.', e: 'smile' },
          { c: 'leo', t: '용사님처럼 대단한 건 아니지만… 매일 아침 누군가를 웃게 하는 거니까요.', e: 'shy' },
        ], fx: { aff: { leo: 3 } } },
        { t: '우리 애 어떻게 생각해?', if: { age: '>=13' }, lines: [
          { c: 'leo', t: '네?! 그, 그러니까… 좋은 친구요. 아주 좋은. 세상에서 제일.', e: 'surprised' },
          { c: 'leo', t: '아저씨, 그 눈빛 무서워요. 마왕 볼 때 눈빛 같아요.', e: 'worried' },
        ], fx: { aff: { leo: 1 } } },
        { t: '반죽 치대는 거 힘들지 않아?', lines: [
          { c: 'leo', t: '힘들죠. 근데 반죽은 거짓말을 안 해요. 한 만큼 부풀어요.', e: 'smile' },
          { c: 'leo', t: '가렌 아저씨가 제 손목 보고 기사단 오라고 했어요. 전 빵이 좋아서 거절했어요.', e: 'laugh' },
        ], fx: { aff: { leo: 2 } } },
        { t: '고민 있으면 말해 봐.', if: { age: '>=14' }, lines: [
          { c: 'leo', t: '걔는 점점 멀리 가는 것 같아요. 왕자님이랑 공작 영애랑 어울리고….', e: 'sad' },
          { c: 'leo', t: '전 그냥 빵집 애니까. 그래도 매일 아침 창문 앞에 빵 하나는 놓아둘 거예요.', e: 'smile' },
        ], fx: { aff: { leo: 3 } } },
      ],
    },

    elena: {
      name: '시스터 엘레나', short: '엘레나', role: '성당의 수녀', color: '#9fd3a8',
      look: { sex: 'f', age: 'adult', skin: '#f6ddd0', hair: '#8a5a3b', hairStyle: 'long', bangs: 'parted', eyes: '#5f8f6b', eyeShape: 'gentle', outfit: 'priest', outfitColor: '#f2f0ea', accent: '#c9a74a', acc: ['veil', 'necklace'] },
      persona: '수도 대성당의 젊은 수녀이자 고아원 선생님. 부드럽고 따뜻하지만 주먹이 세다(전직 모험가 파티의 성직자였다). 존댓말을 쓰며 "주님 보시기에"라는 말을 자주 쓰고, 화가 나면 미소가 더 깊어진다. {s.dname}의 신성력이 비정상적으로 강하다는 걸 처음 알아본다. 거짓 기적을 파는 사기꾼을 제일 싫어한다.',
      talk: [
        { t: '수녀님, 고아원 아이들은 잘 지내요?', lines: [
          { c: 'elena', t: '네. 어제 따님이 와서 아이들에게 그림책을 읽어 줬어요. 목소리 연기가 일품이더군요.', e: 'smile' },
          { c: 'elena', t: '특히 마왕 역할을요. 용사님을 많이 관찰했나 봐요.', e: 'smirk' },
        ], fx: { aff: { elena: 2, daughter: 1 } } },
        { t: '신앙이란 뭘까요?', lines: [
          { c: 'elena', t: '주님 보시기에, 신앙은 거창한 게 아니에요. 넘어진 사람 앞에서 멈춰 서는 발걸음이죠.', e: 'neutral' },
          { c: 'elena', t: '용사님은 이미 한 아이 앞에서 멈춰 서셨잖아요.', e: 'smile' },
        ], fx: { aff: { elena: 2 }, v: { faith: 1 } } },
        { t: '예전엔 모험가였다면서요?', lines: [
          { c: 'elena', t: '어머, 누가 그래요? …가렌 경이군요. 그 입, 주님께서 꿰매 주셨으면.', e: 'smile' },
          { c: 'elena', t: '메이스로 오우거 세 마리 정도요. 과거의 일이에요. 주님은 용서하셨어요.', e: 'shy' },
        ], fx: { aff: { elena: 3 } } },
        { t: '우리 애 신성력이 강하다고요?', if: { v: { faith: '>=30' } }, lines: [
          { c: 'elena', t: '성수가 그 애 손끝에서 빛나요. 대주교님보다 밝게요.', e: 'worried' },
          { c: 'elena', t: '축복이자 짐이에요. 잘 지켜 주세요. 그런 빛은 나방도 불러 모으니까요.', e: 'cold' },
        ], fx: { aff: { elena: 2 }, flag: 'elena_notice' } },
        { t: '수녀님의 소원은요?', lines: [
          { c: 'elena', t: '고아원 지붕 수리요. 매우 현실적이죠?', e: 'laugh' },
          { c: 'elena', t: '그리고 모든 아이가, 한 번쯤은 "잘했어"라는 말을 듣고 자라는 세상이요.', e: 'smile' },
        ], fx: { aff: { elena: 3 }, v: { moral: 1 } } },
      ],
    },

    darius: {
      name: '다리우스', short: '다리우스', role: '마족 청년', color: '#d7263d',
      look: { sex: 'm', age: 'teen', skin: '#ebe3f2', hair: '#1d1a2e', hair2: '#6b2240', hairStyle: 'messy', bangs: 'side', eyes: '#d7263d', eyeShape: 'sharp', outfit: 'coat', outfitColor: '#1a1a24', accent: '#8b1e3f', acc: ['earrings', 'choker'] },
      persona: '마왕군 잔당이 "밤의 공주"를 데려오라고 보낸 반인반마 소년. 인간 어머니와 마족 아버지 사이에서 태어나 양쪽 모두에게 버림받았다. 냉소적이고 비꼬는 반말을 쓰며 {s.dname}를 "공주님"이라 부른다. 사실 명령을 따를 생각이 점점 사라지고 있고, 그녀가 자기를 괴물 취급하지 않은 첫 사람이라 흔들린다. 용사 {name}를 증오한다고 말하지만 그건 두려움이다. 절대 먼저 사과하지 않는다.',
      talk: [
        { t: '너, 여기서 뭐 하는 거냐.', lines: [
          { c: 'darius', t: '산책. 마족은 산책도 하면 안 돼, 용사 나리?', e: 'smirk' },
          { c: 'darius', t: '걱정 마. 당신 딸 안 잡아먹어. …아직은.', e: 'cold' },
        ], fx: { aff: { darius: 1 } } },
        { t: '왜 우리 애를 공주라고 불러?', lines: [
          { c: 'darius', t: '공주니까. 당신이 모르는 척하는 건지, 진짜 모르는 건지 궁금하네.', e: 'smirk' },
          { c: 'darius', t: '별의 피는 냄새가 달라. 밤에 제일 밝게 타는 냄새.', e: 'neutral' },
        ], fx: { aff: { darius: 1 }, flag: 'darius_hint' } },
        { t: '네 어머니는?', lines: [
          { c: 'darius', t: '……', e: 'cold' },
          { c: 'darius', t: '인간 마을에서 돌에 맞아 죽었어. 마족 애를 낳았다고. 됐냐?', e: 'angry' },
          { c: 'darius', t: '그러니까 착한 척 동정하지 마. 그런 눈이 제일 역겨워.', e: 'sad' },
        ], fx: { aff: { darius: 3 } } },
        { t: '마왕군에서 나와라.', if: { age: '>=15' }, lines: [
          { c: 'darius', t: '나오면? 인간들이 날 받아 줄까? 당신이 보증이라도 서 줄래?', e: 'smirk' },
          { c: 'darius', t: '…농담이야. 대답하지 마. 진짜로 그러겠다고 할까 봐 무섭다.', e: 'worried' },
        ], fx: { aff: { darius: 4 } } },
        { t: '단 거 좋아하냐?', lines: [
          { c: 'darius', t: '마족은 피를 좋아하지, 단 걸 좋아할 리가….', e: 'cold' },
          { c: 'darius', t: '…그 호두 크림빵 한 입만. 빵집 녀석한텐 비밀로 해.', e: 'shy' },
        ], fx: { aff: { darius: 3 } } },
      ],
    },

    king: {
      name: '레오폴트 4세', short: '국왕', role: '에렌시아 국왕', color: '#e8c65a',
      look: { sex: 'm', age: 'elder', skin: '#f0d2bc', hair: '#e8e8e8', hairStyle: 'short', bangs: 'parted', eyes: '#4a6fa5', eyeShape: 'droopy', outfit: 'robe', outfitColor: '#7a1f2b', accent: '#e8c65a', acc: ['crown', 'beard', 'cape'] },
      persona: '에렌시아의 늙은 국왕. 사람 좋고 수다스러우며 용사에게 늘 "자네"라고 부른다. 용사에게 아이를 맡긴 장본인으로, 사실 그 아이가 아스트렐의 핏줄일지 모른다고 의심하고 있었다. 정치적으로는 노련하지만 아이들 앞에선 사탕을 나눠 주는 할아버지다. 누구에게도 강요하지 않는다.',
      talk: [],
    },
  };

  // ---------- 장면 ----------
  const SC = {};

  SC.prologue = [
    { bg: 'black' },
    { title: '별을 키우는 용사', sub: '프롤로그 — 전쟁이 끝난 뒤' },
    '마왕 노크투르가 봉인된 지 석 달.',
    '왕도 루멘하르트는 아직도 축제 중이었다. 종은 매일 울렸고, 빵은 공짜였으며, 사람들은 당신의 이름으로 건배했다.',
    '그리고 당신은… 할 일이 없었다.',
    { bg: 'throne_room' },
    { show: 'king', e: 'smile', at: 'c' },
    { c: 'king', t: '용사 {name}! 자네, 요즘 뭐 하고 지내나?', e: 'smile' },
    { c: 'me', t: '낮잠을 잡니다, 폐하. 아주 전문적으로.' },
    { c: 'king', t: '허허허! 그럴 줄 알았네. 마왕을 벤 칼이 녹슬고 있다는 소문이 자자해.', e: 'laugh' },
    { c: 'king', t: '그래서 말인데… 자네에게 마지막 임무를 하나 주려 하네.', e: 'neutral' },
    { c: 'me', t: '또 드래곤입니까? 이번엔 몇 마리죠?' },
    { c: 'king', t: '아니, 훨씬 어려운 일이야.', e: 'worried' },
    { c: 'king', t: '북쪽 국경, 마왕군이 불태운 마을 잔해에서 아이 하나가 발견됐네. 열 살 여자아이야.', e: 'sad' },
    { c: 'king', t: '부모도, 이름도 기억하지 못해. 가진 거라곤 목에 건 은빛 별 펜던트 하나뿐이고.', e: 'sad' },
    { c: 'king', t: '그 아이를 자네가 맡아 주게. 열여덟 성년식 날까지.', e: 'smile' },
    { c: 'me', t: '…폐하. 저는 칼밖에 휘둘러 본 적이 없습니다.' },
    { c: 'king', t: '그러니까 부탁하는 걸세. 칼 말고 다른 걸 휘둘러 볼 때도 됐지. 이를테면… 국자라든가.', e: 'laugh' },
    { c: 'king', t: '연금은 매달 나라에서 주겠네. 집도 있고, 가정부도 붙여 주지. 나머지는 자네 몫이야.', e: 'neutral' },
    { hide: 'king' },
    '문이 열렸다.',
    '시종 뒤에, 작은 아이가 서 있었다. 제 몸보다 큰 망토를 뒤집어쓰고, 신발 한 짝은 끈이 풀린 채로.',
    '은빛이 도는 연보라색 머리카락. 밤하늘을 한 방울 떨어뜨린 것 같은 파란 눈.',
    '아이는 당신을 올려다보았다. 울지도, 웃지도 않고.',
    { show: 'daughter', e: 'worried', at: 'c' },
    { c: 'daughter', t: '…아저씨가 마왕 죽인 사람이야?', e: 'worried', as: '소녀' },
    { c: 'me', t: '죽인 건 아니고, 봉인했지. 좀 더 친환경적으로.' },
    { c: 'daughter', t: '……', e: 'neutral', as: '소녀' },
    { c: 'daughter', t: '그럼 아저씨는 세상에서 제일 센 사람이네.', e: 'neutral', as: '소녀' },
    { c: 'daughter', t: '…그럼 나 안 버려?', e: 'sad', as: '소녀' },
    '가슴 한가운데를 무언가가 쿡, 하고 찔렀다. 마왕의 창보다 깊숙이.',
    { choice: [
      { t: '무릎을 꿇고 눈을 맞춘다. "안 버려. 약속할게."', fx: { aff: { daughter: 8 } }, then: [
        { c: 'daughter', t: '…약속은 새끼손가락으로 하는 거야.', e: 'shy', as: '소녀' },
        '당신은 전설의 성검을 쥐던 손가락으로, 아주 작은 손가락을 걸었다.',
      ] },
      { t: '"버리긴. 너 설거지 할 줄 알아?"', fx: { aff: { daughter: 5 }, v: { house: 2 } }, then: [
        { c: 'daughter', t: '…할 줄 알아. 그릇 안 깨고.', e: 'surprised', as: '소녀' },
        { c: 'me', t: '합격. 우리 집은 그릇 안 깨는 사람을 안 버려.' },
        { c: 'daughter', t: '풉.', e: 'smile', as: '소녀' },
      ] },
      { t: '말없이 망토를 벗어 아이 어깨에 둘러 준다.', fx: { aff: { daughter: 6 }, v: { sense: 2 } }, then: [
        '아이는 망토 깃에 코를 묻었다. 전장의 먼지와, 햇볕 냄새가 났다.',
        { c: 'daughter', t: '…따뜻해.', e: 'shy', as: '소녀' },
      ] },
    ] },
    { c: 'me', t: '그런데 이름이 뭐니?' },
    { c: 'daughter', t: '몰라. 마을 사람들은 "꼬마"라고 불렀어. 기억 안 나.', e: 'sad', as: '소녀' },
    { c: 'daughter', t: '아저씨가 지어 줘. 제일 센 사람이 지어 주는 이름이면 튼튼할 거야.', e: 'neutral', as: '소녀' },
    { input: 'dname', label: '딸의 이름', def: '올리브' },
    { c: 'me', t: '{s.dname}. 오늘부터 너는 {s.dname}야.' },
    { c: 'daughter', t: '{s.dname}….', e: 'surprised' },
    { c: 'daughter', t: '{s.dname}. {s.dname}! 이상하다. 입에 착 붙어.', e: 'laugh' },
    { bg: 'town_square' },
    '왕궁을 나서는 길. {s.dname}는 당신의 망토 자락을 꼭 쥐고 따라왔다. 한 번도 놓지 않고.',
    { bg: 'house_day' },
    { show: 'marta', e: 'cold', at: 'r' },
    { c: 'marta', t: '늦었수. 수프가 두 번 식었다가 세 번째 데워지는 중이에요.', e: 'cold' },
    { c: 'marta', t: '마르타라고 합니다. 왕실에서 보냈지요. "용사가 애를 굶겨 죽이지 않게 감시하라"고.', e: 'smirk' },
    { c: 'me', t: '신뢰가 대단하군요.' },
    { c: 'marta', t: '신뢰는 실적으로 쌓는 거지요, 도련님. 자, 꼬마 아가씨. 이리 와요. 손부터 씻고.', e: 'smile' },
    { c: 'daughter', t: '꼬마 아니야. {s.dname}야. 방금 생겼어.', e: 'angry' },
    { c: 'marta', t: '어머나, 그거 참 좋은 이름이네. 그럼 {s.dname} 아가씨, 손 씻으러 가시지요.', e: 'laugh' },
    { hide: 'marta' },
    { bg: 'house_night' },
    '그날 밤. 당신은 난생처음 동화책이라는 것을 읽었다.',
    '「용감한 기사와 무서운 용」. 용이 나오는 대목에서 {s.dname}가 물었다.',
    { c: 'daughter', t: '진짜 용은 이것보다 커?', e: 'surprised' },
    { c: 'me', t: '세 배쯤. 입 냄새는 열 배.' },
    { c: 'daughter', t: '으엑.', e: 'laugh' },
    { c: 'daughter', t: '…아빠라고 불러도 돼? 아니, 아직 이상한가. 아저씨라고 할까?', e: 'shy' },
    { choice: [
      { t: '"아빠가 좋겠다."', fx: { aff: { daughter: 5 } }, then: [
        { c: 'daughter', t: '아빠. …아빠. 헤헤. 연습해 둘게.', e: 'smile' },
      ] },
      { t: '"편한 대로 불러. 천천히."', fx: { aff: { daughter: 3 }, v: { moral: 1 } }, then: [
        { c: 'daughter', t: '그럼 천천히. 대신 금방 바꿀 거야. 아마 내일.', e: 'smile' },
      ] },
    ] },
    { chat: 'daughter', goal: '처음 함께 보내는 밤. 낯선 집에서 불안한 아이가 새 아빠에게 이것저것 묻는다. 아이를 안심시키고 잠들게 한다.', max: 3 },
    { c: 'daughter', t: '아빠, 불 끄지 마. …조금만 켜 둬.', e: 'tired' },
    '당신은 촛불을 하나 남겨 두었다. 그리고 문간에 앉아, 아이의 숨소리가 고르게 될 때까지 기다렸다.',
    '마왕성 앞에서 밤을 새울 때보다 이상하게 더 긴장되는 밤이었다.',
    { title: '1년차', sub: '{s.dname}, 열 살' },
    { c: 'marta', t: '자, 도련님. 이제 매달 계획을 짜셔야 해요. 상순, 중순, 하순. 공부, 일, 휴식.', e: 'neutral' },
    { c: 'marta', t: '돈은 연금만으로는 빠듯할 거예요. 아이가 크면 아르바이트도 하나둘 시켜 보시고.', e: 'cold' },
    { c: 'marta', t: '그리고 무엇보다… 자주 말을 거세요. 애들은 말을 먹고 자라니까.', e: 'smile' },
    { fx: { flag: 'started' } },
    { end: true },
  ];

  // ===== 10세 =====
  SC.ev_school_first = [
    { bg: 'house_day' },
    '왕립 초등 학당 입학식 날 아침.',
    { c: 'daughter', t: '아빠! 머리 이상해! 한쪽이 더 높아!', e: 'cry' },
    '당신이 땋아 준 양 갈래 머리는, 확실히 왼쪽이 오른쪽보다 손가락 두 마디쯤 높았다.',
    { c: 'me', t: '이건… 전략적 비대칭이야. 적의 시선을 분산시키지.' },
    { c: 'daughter', t: '학교에 적이 있어?!', e: 'surprised' },
    { c: 'marta', t: '이리 와요, 아가씨. 도련님은 칼질만 전략적이지 머리는 영 아니에요.', e: 'cold' },
    { bg: 'school' },
    '학당 정문 앞. 아이들이 부모 손을 잡고 들어가고 있었다. 누군가 당신을 알아보고 수군거렸다.',
    { c: 'daughter', t: '아빠, 다들 쳐다봐.', e: 'worried' },
    { c: 'me', t: '아빠가 좀 유명해서 그래.' },
    { c: 'daughter', t: '…나 때문이 아니라?', e: 'sad' },
    { c: 'daughter', t: '고아라서. 나 어디서 왔는지 모르는 애라서.', e: 'sad' },
    { choice: [
      { t: '"네가 어디서 왔는지보다, 어디로 갈지가 중요해."', fx: { aff: { daughter: 4 }, v: { moral: 2 } }, then: [
        { c: 'daughter', t: '…어디로 갈지. 음. 일단 교실?', e: 'smile' },
        { c: 'me', t: '좋은 출발이야.' },
      ] },
      { t: '"누가 뭐라 하면 아빠 이름 대. 마왕 봉인한 사람 딸이라고."', fx: { aff: { daughter: 3 }, v: { stress: -3 } }, then: [
        { c: 'daughter', t: '그거 좀 무섭게 들리는데. 좋아, 써먹을게.', e: 'smirk' },
      ] },
      { t: '말없이 머리를 한 번 쓰다듬는다.', fx: { aff: { daughter: 3 }, v: { sense: 1 } }, then: [
        { c: 'daughter', t: '머리 망가져! …한 번만 더 해.', e: 'shy' },
      ] },
    ] },
    { c: 'daughter', t: '다녀올게, 아빠!', e: 'laugh' },
    '작은 등이 교문 너머로 사라졌다. 당신은 괜히 그 자리에 한참 서 있었다.',
    { bg: 'house_day' },
    '저녁. {s.dname}는 문을 열자마자 소리쳤다.',
    { c: 'daughter', t: '아빠! 오늘 선생님이 나 글씨 예쁘대! 그리고 급식에 당근 나왔어! 최악이야!', e: 'laugh' },
    { chat: 'daughter', goal: '학교 첫날 이야기를 듣는다. 친구, 선생님, 급식 이야기를 들어 주고 칭찬해 준다.', max: 3 },
    { fx: { v: { int: 2 }, flag: 'school_started' } },
    { end: true },
  ];

  SC.ev_meet_leo = [
    { bg: 'town_square' },
    '이른 아침, 건너편 빵집에서 고소한 냄새가 길을 건너왔다.',
    { c: 'daughter', t: '아빠, 저 냄새 뭐야. 나 저 냄새랑 결혼할래.', e: 'surprised' },
    { show: 'leo', e: 'shy', at: 'r' },
    { c: 'leo', t: '저, 저기… 새로 이사 오신… 용, 용사님 댁이죠?', e: 'shy' },
    { c: 'leo', t: '아버지가 이거 드리래요. 이, 이사 떡 대신 빵이요.', e: 'worried' },
    '소년은 바구니를 내밀었다. 손등에 밀가루가 하얗게 묻어 있었다.',
    { c: 'daughter', t: '너 누구야? 몇 살이야? 이거 네가 만들었어? 매일 만들어?', e: 'surprised' },
    { c: 'leo', t: '레, 레오. 열한 살. 반은 내가. 매일.', e: 'surprised' },
    { c: 'daughter', t: '질문 네 개에 다 대답했어. 너 좋은 애구나.', e: 'smile' },
    { c: 'leo', t: '……!', e: 'shy' },
    '레오는 귀까지 빨개져서 도망가듯 빵집으로 돌아갔다. 바구니는 두고.',
    { c: 'daughter', t: '아빠, 쟤 왜 저래?', e: 'neutral' },
    { choice: [
      { t: '"밀가루 알레르기인가 보다."', fx: { v: { stress: -2 } }, then: [
        { c: 'daughter', t: '빵집 아들이?! 불쌍해….', e: 'sad' },
      ] },
      { t: '"…아빠도 모르겠다. 모르고 싶다."', fx: { aff: { daughter: 1 } }, then: [
        { c: 'daughter', t: '아빠 표정 왜 그래? 마왕 봤을 때 표정이야.', e: 'smirk' },
      ] },
    ] },
    { fx: { aff: { leo: 10 }, flag: 'met_leo' } },
    { end: true },
  ];

  SC.ev_garen_visit = [
    { bg: 'house_day' },
    '쾅쾅쾅! 문짝이 떨어질 듯한 노크.',
    { show: 'garen', e: 'laugh', at: 'c' },
    { c: 'garen', t: '형님! 형님이 애를 키운다는 게 사실이오?! 이 가렌, 두 눈으로 확인하러 왔소!', e: 'laugh' },
    { c: 'marta', t: '문 부서져요, 곰 양반.', e: 'cold' },
    { show: 'daughter', e: 'surprised', at: 'l' },
    { c: 'daughter', t: '아빠, 곰이 말을 해.', e: 'surprised' },
    { c: 'garen', t: '크하하! 곰이라니! 이 몸은 왕국 기사단장 가렌 브라이트실드! 네 아빠의 방패였던 남자다!', e: 'laugh' },
    { c: 'daughter', t: '방패는 왜 수염이 있어?', e: 'neutral' },
    { c: 'garen', t: '…형님, 이 애 급소를 아는군.', e: 'cry' },
    '가렌은 선물이라며 나무 검 한 자루를 내밀었다. 손잡이에 작게 별 모양이 새겨져 있었다.',
    { c: 'garen', t: '여자애라고 칼 못 쥘 거 없지. 형님만 허락하면, 내가 도장에서 기초부터 가르치마.', e: 'smile' },
    { choice: [
      { t: '"좋아. 대신 살살."', fx: { aff: { garen: 5, daughter: 2 }, v: { combat: 3, str: 1 } }, then: [
        { c: 'garen', t: '살살은 내 사전에 없지만 형님 부탁이니 넣어 두지!', e: 'laugh' },
        { c: 'daughter', t: '나 칼 배울 거야! 그래서 아빠 지킬 거야!', e: 'laugh' },
        { c: 'garen', t: '형님… 나 방금 울 뻔했어.', e: 'cry' },
      ] },
      { t: '"칼보다는 책부터 쥐여 주고 싶어."', fx: { aff: { garen: 2 }, v: { int: 2 } }, then: [
        { c: 'garen', t: '하긴, 형님은 책을 베개로만 썼으니 딸은 달라야지!', e: 'laugh' },
        { c: 'garen', t: '그래도 나무 검은 두고 가마. 언젠가 필요할 거야.', e: 'smile' },
      ] },
    ] },
    { c: 'garen', t: '그럼, 오늘은 기념으로 팔씨름이나 한 판!', e: 'smirk' },
    { c: 'daughter', t: '나랑?', e: 'surprised' },
    '가렌은 과장되게 신음하며 {s.dname}에게 져 주었다. 테이블이 부서질 정도로 요란하게.',
    { c: 'daughter', t: '내가 이겼어! 나 곰 이겼어!', e: 'laugh' },
    { c: 'marta', t: '테이블 값은 곰 양반 월급에서 까겠수.', e: 'cold' },
    { fx: { flag: 'met_garen', v: { stress: -5 } } },
    { end: true },
  ];

  SC.ev_cat = [
    { bg: 'house_night' },
    '비 오는 밤. 현관에서 {s.dname}가 뭔가를 품에 안고 서 있었다. 흠뻑 젖은 채로.',
    { c: 'daughter', t: '…아빠. 이거 봐도 화 안 낼 거지?', e: 'worried' },
    '품에서 고개를 내민 것은, 등에 줄무늬가 있는 삐쩍 마른 새끼 고양이였다.',
    { c: 'daughter', t: '골목에서 울고 있었어. 엄마가 없대. 나처럼.', e: 'sad' },
    { c: 'marta', t: '고양이는 털 날려요. 가구 긁어요. 생선 훔쳐요.', e: 'cold' },
    { c: 'daughter', t: '내가 다 치울게. 내 생선 줄게. 가구는… 내가 대신 긁힐게.', e: 'cry' },
    { choice: [
      { t: '"키우자. 대신 네가 책임지는 거야."', fx: { aff: { daughter: 6 }, v: { moral: 2, house: 1 } }, then: [
        { c: 'daughter', t: '진짜?! 아빠 최고! 세상에서 두 번째로 최고!', e: 'laugh' },
        { c: 'me', t: '첫 번째는?' },
        { c: 'daughter', t: '이 고양이. 이름은 고등어로 할 거야. 등이 고등어 같으니까.', e: 'smile' },
        { c: 'marta', t: '…가구 긁으면 도련님 방 가구부터예요.', e: 'smirk' },
        { fx: { flag: 'cat' } },
      ] },
      { t: '"오늘 밤만 재우고, 내일 좋은 주인 찾아 주자."', fx: { aff: { daughter: -2 }, v: { moral: 1 } }, then: [
        { c: 'daughter', t: '…응. 알았어.', e: 'sad' },
        '다음 날, 고양이는 빵집 레오네로 갔다. {s.dname}는 매일 빵집 창문 앞에 쪼그려 앉아 고양이를 보았다.',
        { c: 'leo', t: '그, 그러니까… 언제든 보러 와도 돼. 고양이도, 나도… 아, 아니 고양이만.', e: 'shy' },
        { fx: { aff: { leo: 5 }, flag: 'cat_leo' } },
      ] },
    ] },
    { end: true },
  ];

  SC.ev_pendant = [
    { bg: 'daughter_room' },
    '한밤중. 딸의 방에서 푸른 빛이 새어 나왔다.',
    '당신은 반사적으로 검을 집어 들고 문을 열었다.',
    { show: 'daughter', e: 'tired', at: 'c' },
    '{s.dname}는 곤히 자고 있었다. 빛은, 그 아이 목에 걸린 은빛 별 펜던트에서 나오고 있었다.',
    '여덟 개의 꼭지를 가진 별. 에렌시아 어디에서도 본 적 없는 문양.',
    '빛은 아이의 숨결에 맞추어 천천히 밝아졌다 어두워졌다. 마치 자장가처럼.',
    { c: 'daughter', t: '…엄마…. 별이… 떨어져….', e: 'sad' },
    '잠꼬대였다. 당신이 손을 뻗자, 빛은 스르르 꺼졌다.',
    '마왕성에서 느꼈던 것과 닮은, 그러나 정반대의 기운이 방 안에 희미하게 남아 있었다.',
    { choice: [
      { t: '펜던트를 조심스럽게 살펴본다.', fx: { v: { int: 1 } }, then: [
        '뒷면에 아주 작은 글씨가 새겨져 있었다. 고대 문자. "별은 밤을 잊지 않는다."',
        { fx: { flag: 'pendant_text' } },
      ] },
      { t: '이불을 덮어 주고 조용히 나온다.', fx: { aff: { daughter: 2 } }, then: [
        '이 아이가 무엇이든 간에, 지금은 그냥 잠든 열 살 아이였다.',
      ] },
    ] },
    { bg: 'house_day' },
    '다음 날 아침.',
    { c: 'daughter', t: '아빠, 나 어젯밤에 이상한 꿈 꿨어. 하늘에서 별이 비처럼 떨어지는 꿈.', e: 'neutral' },
    { c: 'daughter', t: '무서운데 예뻤어. 그리고 누가 내 이름을 불렀어. {s.dname} 말고 다른 이름으로.', e: 'worried' },
    { chat: 'daughter', goal: '딸이 이상한 꿈 이야기를 한다. 펜던트가 빛났던 걸 말할지 말지 고민하며, 아이를 불안하게 하지 않도록 대화한다.', max: 3 },
    { fx: { flag: 'pendant_glow' } },
    { end: true },
  ];

  SC.ev_lost_tooth = [
    { bg: 'house_day' },
    { c: 'daughter', t: '아빠아아아! 이빨이! 이빨이 빠졌어!', e: 'cry' },
    '{s.dname}는 피 묻은 앞니 하나를 보물처럼 손바닥에 올려 들고 뛰어왔다.',
    { c: 'daughter', t: '나 죽는 거야? 이빨이 빠지면 다음은 머리카락이고 그다음은 영혼이 빠진대. 레오가 그랬어.', e: 'cry' },
    { c: 'me', t: '레오를 좀 만나 봐야겠군.' },
    { c: 'marta', t: '아이고, 젖니가 빠진 거예요. 지붕에 던지면 까치가 새 이를 물어다 준답니다.', e: 'smile' },
    { c: 'daughter', t: '까치가? 새 이를? 까치는 이를 어디서 구해?', e: 'surprised' },
    { choice: [
      { t: '"까치 이빨 가게가 있어."', fx: { aff: { daughter: 2 }, v: { sense: 1 } }, then: [
        { c: 'daughter', t: '…아빠 거짓말할 때 코 벌렁거려.', e: 'smirk' },
        { c: 'me', t: '용사의 코는 원래 이래.' },
      ] },
      { t: '"같이 지붕에 올라가서 던지자."', fx: { aff: { daughter: 4 }, v: { stress: -5 } }, then: [
        { bg: 'sky_sunset' },
        '당신은 딸을 어깨에 태우고 지붕에 올랐다. 노을이 온 도시를 주황색으로 칠하고 있었다.',
        { c: 'daughter', t: '헌 이 줄게, 새 이 다오! …이거 맞아?', e: 'laugh' },
        { c: 'me', t: '맞아. 그리고 까치한테 당근은 가져오지 말라고 해.' },
        { c: 'daughter', t: '까치야! 당근 금지야!', e: 'laugh' },
      ] },
    ] },
    { end: true },
  ];

  SC.ev_nightmare = [
    { bg: 'house_night' },
    '천둥이 치던 밤. 비명 소리.',
    { bg: 'daughter_room', fx: 'shake' },
    { show: 'daughter', e: 'cry', at: 'c' },
    { c: 'daughter', t: '불이야! 불! 엄마! 엄마 어디 있어!', e: 'cry' },
    '당신이 달려 들어가 끌어안자, {s.dname}는 발버둥 치다가 이내 당신의 옷깃을 움켜쥐었다.',
    { c: 'daughter', t: '…아빠?', e: 'cry' },
    { c: 'me', t: '아빠야. 여긴 집이야. 불 없어.' },
    { c: 'daughter', t: '꿈에서… 마을이 타고 있었어. 검은 날개 달린 것들이 하늘을 덮었어.', e: 'sad' },
    { c: 'daughter', t: '누가 나를 안고 뛰었어. 흰머리 남자였어. 계속 미안하다고 했어.', e: 'worried' },
    '흰머리 남자. 당신은 그 말을 기억해 두었다.',
    { c: 'daughter', t: '아빠는 그런 거 안 무서워? 마왕군 같은 거.', e: 'worried' },
    { choice: [
      { t: '"무서웠어. 그래서 싸웠어. 무서운 걸 너한테까지 안 보내려고."', fx: { aff: { daughter: 5 }, v: { moral: 2, combat: 1 } }, then: [
        { c: 'daughter', t: '…아빠도 무서웠구나. 그럼 나도 무서워해도 되는 거네.', e: 'sad' },
        { c: 'me', t: '되지. 대신 무서울 땐 아빠 부르기.' },
      ] },
      { t: '"아빠가 문 앞에서 지킬게. 밤새."', fx: { aff: { daughter: 6 }, v: { stress: -6 } }, then: [
        '당신은 정말로 밤새 문 앞에 앉아 있었다. 새벽녘, 작은 손이 문틈으로 나와 당신 소매를 붙잡았다.',
        { c: 'daughter', t: '아빠도 자. 나 이제 괜찮아.', e: 'tired' },
      ] },
    ] },
    { chat: 'daughter', goal: '악몽을 꾼 딸을 달랜다. 딸은 불타는 마을, 흰머리 남자, 검은 날개 꿈을 이야기한다.', max: 3 },
    { fx: { flag: 'nightmare1' } },
    { end: true },
  ];

  SC.ev_first_snow = [
    { bg: 'sky_day' },
    '첫눈이 내렸다. 루멘하르트의 지붕들이 하얀 설탕을 뒤집어쓴 과자처럼 변했다.',
    { c: 'daughter', t: '아빠! 눈! 눈이야! 하늘에서 설탕이 와!', e: 'laugh' },
    { bg: 'town_square' },
    '{s.dname}는 광장 한가운데서 두 팔을 벌리고 빙글빙글 돌았다.',
    { c: 'daughter', t: '눈사람 만들자! 아빠만 한 거! 아니, 곰 아저씨만 한 거!', e: 'laugh' },
    { if: { flag: 'met_leo' }, then: [
      { c: 'leo', t: '나, 나도 끼워 줘. 당근 코… 가져왔어.', e: 'shy' },
      { c: 'daughter', t: '당근은 코로 쓸 때만 허락해 줄게.', e: 'smirk' },
      { fx: { aff: { leo: 3 } } },
    ] },
    '한 시간 뒤, 광장에는 어딘가 당신을 닮은, 험상궂은 눈사람이 서 있었다. 이름은 "눈의 용사".',
    { c: 'daughter', t: '아빠, 내년에도 만들자. 내후년에도. 내가 열여덟 살 될 때까지.', e: 'smile' },
    { c: 'me', t: '열여덟 이후엔?' },
    { c: 'daughter', t: '그땐 아빠가 늙었으니까 내가 혼자 만들어 줄게.', e: 'laugh' },
    { fx: { aff: { daughter: 4 }, v: { stress: -8, sense: 2 }, flag: 'snowman' } },
    { end: true },
  ];

  // ===== 11세 =====
  SC.ev_bully = [
    { bg: 'school' },
    '학당에서 연락이 왔다. {s.dname}가 싸웠다고.',
    { bg: 'house_day' },
    { show: 'daughter', e: 'angry', at: 'c' },
    '뺨에 긁힌 자국, 치마에 흙. 그런데 눈은 한 번도 굽히지 않고 있었다.',
    { c: 'daughter', t: '걔들이 먼저 그랬어. 나보고 "주워 온 애"래. 진짜 부모가 버린 거래.', e: 'angry' },
    { c: 'daughter', t: '그래서 밀었어. 세 명 다.', e: 'cold' },
    { c: 'me', t: '세 명을?' },
    { c: 'daughter', t: '곰 아저씨가 가르쳐 줬어. 중심을 무너뜨리라고.', e: 'smirk' },
    { choice: [
      { t: '"잘했다." (엄지를 든다)', fx: { aff: { daughter: 4 }, v: { combat: 2, moral: -3, stress: -3 } }, then: [
        { c: 'daughter', t: '진짜? 혼 안 내?', e: 'surprised' },
        { c: 'marta', t: '도련님! 애를 그렇게 가르치면 어떡해요!', e: 'angry' },
        { c: 'me', t: '…다음엔 한 명씩 차례로 하렴.' },
        { c: 'marta', t: '도련님!!', e: 'angry' },
      ] },
      { t: '"화난 건 이해해. 하지만 손은 쓰지 말자."', fx: { aff: { daughter: 1 }, v: { moral: 3 } }, then: [
        { c: 'daughter', t: '그럼 뭘 써? 말? 걔들은 말이 안 통해.', e: 'angry' },
        { c: 'me', t: '말이 안 통하는 상대를 이기는 게 진짜 강한 거야. 아빠도 마왕이랑 말로 해 보려 했어.' },
        { c: 'daughter', t: '…그래서?', e: 'neutral' },
        { c: 'me', t: '안 통해서 칼로 했지.' },
        { c: 'daughter', t: '아빠!!', e: 'laugh' },
      ] },
      { t: '말없이 상처에 약을 발라 준다.', fx: { aff: { daughter: 5 }, v: { sense: 1 } }, then: [
        '연고를 바르자 {s.dname}의 어깨가 조금씩 떨리기 시작했다.',
        { c: 'daughter', t: '…진짜야? 나 버려진 거야?', e: 'cry' },
        { c: 'me', t: '누군가는 너를 불 속에서 안고 뛰었어. 끝까지. 그건 버린 게 아니야.' },
        { c: 'daughter', t: '……응.', e: 'cry' },
      ] },
    ] },
    { chat: 'daughter', goal: '학교에서 "주워 온 애"라는 놀림을 받고 싸운 딸과 이야기한다. 딸의 상처받은 마음을 다독인다.', max: 3 },
    { end: true },
  ];

  SC.ev_meet_cecilia = [
    { bg: 'palace_hall' },
    '예법 교실. 은 식기 스무 개가 늘어선 긴 식탁 앞.',
    { show: 'cecilia', e: 'smirk', at: 'r' },
    { c: 'cecilia', t: '어머나. 생선 나이프로 빵을 자르는 분은 처음 보네요.', e: 'smirk' },
    { show: 'daughter', e: 'angry', at: 'l' },
    { c: 'daughter', t: '빵이 잘리면 빵 나이프지. 너 누구야?', e: 'angry' },
    { c: 'cecilia', t: '세실리아 드 로즈벨. 로즈벨 공작가의 외동딸이에요. 기억해 두세요. 앞으로 모든 일등 자리에 쓰여 있을 이름이거든요.', e: 'cold' },
    { c: 'daughter', t: '{s.dname}. 용사네 딸. 기억해 둬. 앞으로 그 일등 자리 옆에 쓰여 있을 이름이야.', e: 'smirk' },
    { c: 'cecilia', t: '……흥! 옆이면 이등이잖아요!', e: 'angry' },
    { c: 'daughter', t: '아. 그렇네.', e: 'surprised' },
    '교실에 웃음이 터졌다. 세실리아는 새빨개졌지만, 이상하게 입꼬리는 조금 올라가 있었다.',
    { bg: 'house_day' },
    { c: 'daughter', t: '아빠, 나 라이벌 생겼어. 머리가 불타는 소라빵처럼 생긴 애.', e: 'smirk' },
    { choice: [
      { t: '"라이벌이 있으면 더 빨리 자란단다."', fx: { v: { grace: 2, int: 1 } }, then: [
        { c: 'daughter', t: '그럼 걔도 나 때문에 자라겠네. 그건 좀 싫은데.', e: 'neutral' },
      ] },
      { t: '"외모로 놀리는 건 좋지 않아."', fx: { v: { moral: 2 }, aff: { cecilia: 2 } }, then: [
        { c: 'daughter', t: '칭찬이었어. 소라빵 맛있잖아.', e: 'smile' },
      ] },
    ] },
    { fx: { flag: 'met_cecilia', aff: { cecilia: 8 } } },
    { end: true },
  ];

  SC.ev_meet_elena = [
    { bg: 'church' },
    '대성당 뒤편 고아원. {s.dname}가 봉사 활동을 가겠다고 해서 따라왔다.',
    { show: 'elena', e: 'smile', at: 'r' },
    { c: 'elena', t: '어서 오세요. 용사님이시군요. 주님 보시기에, 오늘 지붕 고칠 일손이 하나 늘었네요.', e: 'smile' },
    { c: 'me', t: '…저 말입니까?' },
    { c: 'elena', t: '마왕도 봉인하셨는데 지붕쯤이야.', e: 'laugh' },
    '당신이 지붕 위에서 망치질을 하는 동안, {s.dname}는 아이들 틈에 섞여 있었다.',
    { show: 'daughter', e: 'smile', at: 'l' },
    { c: 'daughter', t: '자, 줄 서! 그림책 읽어 줄게. 마왕 목소리는 우리 아빠 흉내야.', e: 'laugh' },
    { c: 'daughter', t: '"크하하하, 낮잠 좀 자자, 용사여…."', e: 'smirk' },
    { c: 'me', t: '저건 마왕이 아니라 그냥 나잖아.' },
    { c: 'elena', t: '후훗. 닮았네요.', e: 'laugh' },
    '해 질 녘. 아이 하나가 넘어져 무릎이 까졌다. {s.dname}가 달려가 손을 얹었다.',
    '그 순간, 아주 희미한 금빛이 그녀의 손끝에서 번졌다. 상처가 눈에 띄게 아물었다.',
    { c: 'elena', t: '……!', e: 'surprised' },
    { c: 'daughter', t: '어? 호 해 줬더니 나았네. 나 호 잘하나 봐.', e: 'smile' },
    { c: 'elena', t: '용사님. 저 아이… 성당에 자주 보내 주세요. 가르쳐야 할 것이 있어요.', e: 'worried' },
    { fx: { flag: 'met_elena', aff: { elena: 10 }, v: { faith: 3, moral: 2 } } },
    { end: true },
  ];

  SC.ev_meet_lucas = [
    { bg: 'town_market' },
    '시장 골목. 꼬치구이 노점 앞에서 소동이 벌어졌다.',
    { show: 'lucas', e: 'smirk', at: 'r' },
    { c: 'lucas', t: '돈? 아, 돈. 그러니까… 이 단추 금이거든? 이걸로 꼬치 삼십 개쯤 되지 않을까?', e: 'smirk' },
    { show: 'daughter', e: 'neutral', at: 'l' },
    { c: 'daughter', t: '단추로 계산하는 사람 처음 봐. 너 바보야?', e: 'neutral' },
    { c: 'lucas', t: '바, 바보?! 난 이 나라의… 아니, 그냥 루크야. 평범한 루크.', e: 'angry' },
    { c: 'daughter', t: '평범한 루크는 금단추 안 달아.', e: 'smirk' },
    '{s.dname}는 동전 두 개를 꺼내 꼬치 두 개를 샀다. 하나를 소년에게 내밀었다.',
    { c: 'daughter', t: '자. 빚이야. 다음에 갚아.', e: 'smile' },
    { c: 'lucas', t: '……', e: 'surprised' },
    { c: 'lucas', t: '…고마워. 이 은혜는 꼭 갚는다. 왕…, 아니 루크의 이름을 걸고.', e: 'shy' },
    '소년이 사라진 뒤, 멀리서 근위병들이 "왕자 전하!"를 외치며 뛰어가는 소리가 들렸다.',
    { c: 'daughter', t: '아빠, 방금 왕자 전하라고 했지?', e: 'surprised' },
    { c: 'me', t: '했지.' },
    { c: 'daughter', t: '…나 왕자한테 바보라고 했어.', e: 'worried' },
    { c: 'me', t: '했지.' },
    { c: 'daughter', t: '꼬치 두 개 값 받아 내야겠다.', e: 'smirk' },
    { fx: { flag: 'met_lucas', aff: { lucas: 10 } } },
    { end: true },
  ];

  SC.ev_heart_rain = [
    { bg: 'house_night' },
    '장맛비가 사흘째 이어지던 밤. {s.dname}가 베개를 안고 거실로 나왔다.',
    { show: 'daughter', e: 'sad', at: 'c' },
    { c: 'daughter', t: '아빠… 안 자?', e: 'sad' },
    { c: 'me', t: '빗소리 듣고 있었어. 너는?' },
    { c: 'daughter', t: '나도. 빗소리가 너무 커서, 내 생각이 안 들려.', e: 'neutral' },
    '둘은 한참을 말없이 빗소리를 들었다. 난로에서 장작이 탁, 소리를 냈다.',
    { c: 'daughter', t: '아빠는 왜 나 데려왔어? 왕이 시켜서?', e: 'worried' },
    { choice: [
      { t: '"처음엔 그랬지. 지금은 아니야."', fx: { aff: { daughter: 5 } }, then: [
        { c: 'daughter', t: '지금은 뭔데?', e: 'neutral' },
        { c: 'me', t: '지금은 네가 없으면 이 집이 너무 조용해서.' },
        { c: 'daughter', t: '…그거 좋은 대답이다.', e: 'smile' },
      ] },
      { t: '"네가 \'안 버려?\'라고 물었잖아. 그 대답을 지키려고."', fx: { aff: { daughter: 6 }, v: { moral: 2 } }, then: [
        { c: 'daughter', t: '그거 기억해? 난 창피해서 까먹은 척했는데.', e: 'shy' },
        { c: 'me', t: '용사는 약속을 까먹지 않아.' },
      ] },
      { t: '"솔직히 말하면, 아빠가 외로워서."', fx: { aff: { daughter: 7 }, v: { sense: 2 } }, then: [
        { c: 'daughter', t: '…용사도 외로워?', e: 'surprised' },
        { c: 'me', t: '마왕 잡고 나니까 할 게 없더라. 그때 네가 왔어.' },
        { c: 'daughter', t: '그럼 우리 서로 구해 준 거네. 비긴 거다.', e: 'smile' },
      ] },
    ] },
    { chat: 'daughter', goal: '비 오는 밤, 딸이 "왜 나를 데려왔냐"고 묻는다. 진심을 담아 부녀의 정을 나눈다.', max: 3 },
    '{s.dname}는 당신 어깨에 기대 잠들었다. 빗소리는 어느새 자장가가 되어 있었다.',
    { fx: { aff: { daughter: 2 }, v: { stress: -10 } } },
    { end: true },
  ];

  // ===== 12세 =====
  SC.ev_meet_morgan = [
    { bg: 'mage_tower' },
    '왕립 마법 학원 탑. 계단이 칠백칠십칠 개라는 소문은 사실이었다.',
    { show: 'daughter', e: 'tired', at: 'l' },
    { c: 'daughter', t: '아빠… 마법사들은… 왜 탑에 살아…? 순간이동 할 줄 알면서….', e: 'tired' },
    { show: 'morgan', e: 'smirk', at: 'r' },
    { c: 'morgan', t: '흐음. 좋은 질문입니다. 답은, 순간이동은 멀미가 나기 때문이지요.', e: 'smirk' },
    '계단 꼭대기에, 은발을 낮게 묶은 마법사가 사탕을 문 채 서 있었다. 한쪽 눈에 외알 안경.',
    { c: 'morgan', t: '모르간 엘더윈. 이곳 객원 교수입니다. 용사님은… 소문보다 키가 크시군요.', e: 'neutral' },
    '그의 시선이 당신을 지나, {s.dname}의 목에 걸린 펜던트에서 멈췄다. 아주 잠깐. 사탕이 딱, 부러지는 소리가 났다.',
    { c: 'morgan', t: '……아가씨. 손을 한번 내밀어 보시겠습니까?', e: 'surprised' },
    { c: 'daughter', t: '이렇게?', e: 'neutral' },
    '모르간이 그녀 손바닥 위에 수정 구슬을 올리자, 구슬 속에서 별 무더기가 피어올랐다. 수백, 수천 개의 작은 빛.',
    { c: 'daughter', t: '우와아아! 아빠! 별이야! 내 손에서 별이 나와!', e: 'laugh' },
    { c: 'morgan', t: '흐음. …흐음.', e: 'sad' },
    { c: 'me', t: '무슨 문제라도?' },
    { c: 'morgan', t: '아니요. 문제라기보다는… 오래 기다린 답장 같은 것이지요.', e: 'smile' },
    { c: 'morgan', t: '따님을 제 수업에 보내 주십시오. 수업료는 반만 받겠습니다. 아니, 사탕으로 받겠습니다.', e: 'smirk' },
    { hide: 'morgan' },
    { c: 'daughter', t: '아빠, 저 선생님 좀 이상해. 근데 좋은 이상함이야.', e: 'smile' },
    { c: 'daughter', t: '…근데 왜 나 보면서 울 것 같은 얼굴 했을까?', e: 'worried' },
    '흰머리 남자. 계속 미안하다고 했어. 딸의 악몽이 떠올랐다.',
    { fx: { flag: 'met_morgan', aff: { morgan: 10 }, v: { magic: 4 } } },
    { end: true },
  ];

  SC.ev_king_summon = [
    { bg: 'throne_room' },
    '국왕의 소환. 당신은 딸의 손을 잡고 알현실에 들어섰다.',
    { show: 'king', e: 'smile', at: 'r' },
    { c: 'king', t: '오오! 용사! 그리고 이 아이가 소문의 그…!', e: 'laugh' },
    { show: 'daughter', e: 'worried', at: 'l' },
    { c: 'daughter', t: '아, 안녕하세요, 폐하. {s.dname}입니다. 예법 교실에서 배운 대로 인사드립니다.', e: 'shy' },
    '{s.dname}는 치맛자락을 잡고 무릎을 굽혔다. 조금 비틀거렸지만, 제법이었다.',
    { if: { v: { grace: '>=25' } }, then: [
      { c: 'king', t: '허허, 기품이 있구먼! 용사, 자네 딸이 자네보다 예의 바르네.', e: 'laugh' },
      { fx: { v: { fame: 3 } } },
    ], else: [
      { c: 'king', t: '허허, 씩씩하구먼! 아비를 닮았어. 자네도 처음엔 무릎 대신 칼을 꿇었지.', e: 'laugh' },
    ] },
    { c: 'king', t: '그래, {s.dname}. 아빠가 잘해 주나?', e: 'smile' },
    { c: 'daughter', t: '네! 근데 요리는 못해요. 계란을 검으로 깨요.', e: 'laugh' },
    { c: 'king', t: '크하하하! 그건 짐도 봤네! 마왕성 앞에서 계란을 그렇게 깨더군!', e: 'laugh' },
    '국왕은 아이에게 사탕 한 봉지를 쥐여 주더니, 당신을 조용히 불렀다.',
    { hide: 'daughter' },
    { c: 'king', t: '용사. 저 아이의 펜던트… 빛난 적이 있나?', e: 'worried' },
    { choice: [
      { t: '"…네. 한밤중에, 푸른빛으로."', fx: { flag: 'told_king' }, then: [
        { c: 'king', t: '그랬군. …아니, 아직 말할 때가 아니야. 짐도 확신이 없네.', e: 'sad' },
        { c: 'king', t: '다만 자네가 그 아이를 지켜 주게. 누가 뭐라 하든, 그 아이의 아비는 자네야.', e: 'neutral' },
      ] },
      { t: '"왜 그러십니까, 폐하?"', then: [
        { c: 'king', t: '늙은이의 기우일세. 북쪽 옛 친구의 장신구와 닮아서.', e: 'sad' },
        { c: 'king', t: '잊게나. 아니, 잊지는 말게.', e: 'neutral' },
      ] },
    ] },
    { fx: { v: { fame: 2, grace: 1 }, aff: { daughter: 2 } } },
    { end: true },
  ];

  SC.ev_mother_question = [
    { bg: 'hill_sunset' },
    '언덕 위. {s.dname}는 무릎을 끌어안고 노을을 보고 있었다.',
    { show: 'daughter', e: 'neutral', at: 'c' },
    { c: 'daughter', t: '아빠. 오늘 학교에서 "우리 엄마" 그리기 했어.', e: 'neutral' },
    { c: 'daughter', t: '난 얼굴을 몰라서… 마르타 할머니를 그렸어. 선생님이 할머니냐고 해서 그렇다고 했어.', e: 'smile' },
    { c: 'daughter', t: '그런데 집에 오는 길에 자꾸 궁금해졌어. 우리 진짜 엄마는 어떤 사람이었을까.', e: 'sad' },
    { c: 'daughter', t: '예뻤을까? 노래를 잘했을까? 나처럼 당근을 싫어했을까?', e: 'worried' },
    { choice: [
      { t: '"분명 별처럼 예뻤을 거야. 너를 보면 알 수 있어."', fx: { aff: { daughter: 4 }, v: { charm: 2 } }, then: [
        { c: 'daughter', t: '아빠 오늘 말 잘한다. 뭐 잘못했어?', e: 'smirk' },
        { c: 'me', t: '…네 쿠키 먹었어.' },
        { c: 'daughter', t: '역시!!', e: 'angry' },
      ] },
      { t: '"같이 찾아볼까? 네가 원한다면."', fx: { aff: { daughter: 5 }, v: { int: 1 }, flag: 'search_origin' }, then: [
        { c: 'daughter', t: '…정말? 찾다가 나쁜 걸 알게 되면?', e: 'worried' },
        { c: 'me', t: '그럼 같이 나쁜 걸 알면 되지. 혼자는 아니잖아.' },
        { c: 'daughter', t: '응. 같이.', e: 'smile' },
      ] },
      { t: '"마르타 할머니 그린 거, 할머니가 보면 우실걸."', fx: { aff: { daughter: 3, marta: 5 } }, then: [
        { c: 'daughter', t: '할머니는 안 울어. 대신 부엌에서 양파를 썰겠지.', e: 'laugh' },
        '그날 저녁, 마르타는 양파를 여섯 개나 썰었다. 반찬엔 양파가 하나도 없었다.',
      ] },
    ] },
    { chat: 'daughter', goal: '딸이 친엄마가 어떤 사람이었을지 궁금해한다. 과거와 뿌리에 대한 그리움을 다정하게 받아 준다.', max: 3 },
    { end: true },
  ];

  SC.ev_school_exam = [
    { bg: 'school' },
    '학당 학년말 시험 날.',
    { show: 'daughter', e: 'worried', at: 'c' },
    { c: 'daughter', t: '아빠, 레오폴트 3세가 한 일 뭐였지? 다리 놓은 거? 아니면 다리 부러진 거?', e: 'worried' },
    { c: 'me', t: '…둘 다였던 것 같은데.' },
    { if: { v: { int: '>=45' } }, then: [
      '일주일 뒤. 게시판에 붙은 석차표 맨 위에, {s.dname}의 이름이 있었다.',
      { c: 'daughter', t: '아빠!! 일등!! 나 일등이야!!', e: 'laugh' },
      { if: { flag: 'met_cecilia' }, then: [
        { show: 'cecilia', e: 'angry', at: 'r' },
        { c: 'cecilia', t: '……이, 이번엔 감기에 걸려서 그런 거거든요!', e: 'angry' },
        { c: 'daughter', t: '너 감기 안 걸렸잖아.', e: 'smirk' },
        { c: 'cecilia', t: '마음의 감기요!', e: 'cry' },
        { fx: { aff: { cecilia: 3 } } },
      ] },
      { fx: { v: { int: 3, fame: 3, stress: -5 }, aff: { daughter: 3 }, flag: 'exam_top' } },
    ], else: [
      { if: { v: { int: '>=25' } }, then: [
        '석차표 중간쯤, {s.dname}의 이름이 있었다. 나쁘지 않은 자리였다.',
        { c: 'daughter', t: '중간이야. 딱 중간. 평범 그 자체.', e: 'neutral' },
        { c: 'me', t: '평범은 위대한 거야. 아빠는 꼴찌였거든.' },
        { c: 'daughter', t: '진짜? 용사가?', e: 'surprised' },
        { fx: { v: { int: 1 }, aff: { daughter: 2 } } },
      ], else: [
        '석차표 맨 아래쪽. {s.dname}는 그걸 보자마자 뛰어나갔다.',
        { bg: 'daughter_room' },
        { c: 'daughter', t: '…아빠가 창피하지? 용사 딸이 꼴찌라서.', e: 'cry' },
        { choice: [
          { t: '"아빠도 꼴찌였어. 그래도 세상 구했어."', fx: { aff: { daughter: 5 }, v: { stress: -5 } }, then: [
            { c: 'daughter', t: '…진짜? 그럼 나도 세상 구할 수 있어?', e: 'surprised' },
            { c: 'me', t: '일단 숙제부터 구하자.' },
          ] },
          { t: '"창피하진 않아. 다만 다음엔 같이 공부하자."', fx: { aff: { daughter: 3 }, v: { int: 2 } }, then: [
            { c: 'daughter', t: '아빠가 가르쳐 줄 수 있어…?', e: 'worried' },
            { c: 'me', t: '…마르타 할머니한테 부탁하자.' },
          ] },
        ] },
      ] },
    ] },
    { end: true },
  ];

  SC.ev_cecilia_duel = [
    { bg: 'garden_rose' },
    '로즈벨 공작가의 정원. 세실리아가 {s.dname}에게 결투장을 보냈다. 종목은 무려 「차 따르기」.',
    { show: 'cecilia', e: 'cold', at: 'r' },
    { show: 'daughter', e: 'smirk', at: 'l' },
    { c: 'cecilia', t: '규칙은 간단해요. 찻잔 열 개에 한 방울도 흘리지 않고, 가장 우아하게 따르는 사람이 승리.', e: 'cold' },
    { c: 'daughter', t: '진 사람은?', e: 'smirk' },
    { c: 'cecilia', t: '이긴 사람을 「님」자 붙여서 한 달간 부르는 거예요.', e: 'smirk' },
    { if: { v: { grace: '>=35' } }, then: [
      '{s.dname}의 손목은 흔들림이 없었다. 찻물이 금실처럼 떨어졌다.',
      { c: 'cecilia', t: '……! 어, 언제 이렇게….', e: 'surprised' },
      { c: 'daughter', t: '마르타 할머니가 전직 궁정 시녀장이거든. 집에서 매일 했어.', e: 'smirk' },
      { c: 'cecilia', t: '……{s.dname}, 님.', e: 'cry' },
      { c: 'daughter', t: '…그냥 {s.dname}라고 불러. 님 붙이니까 간지러워.', e: 'shy' },
      { c: 'cecilia', t: '흥! 동정은 사양이거든요! …하지만 고마워요.', e: 'shy' },
      { fx: { v: { grace: 3, fame: 2 }, aff: { cecilia: 8 }, flag: 'beat_cecilia' } },
    ], else: [
      '찻주전자가 기울고, 찻물이 식탁보를 건너 세실리아의 구두까지 여행했다.',
      { c: 'cecilia', t: '후후후. 제 승리네요. 자, 불러 보시죠.', e: 'laugh' },
      { c: 'daughter', t: '…세, 세실리아… 님.', e: 'angry' },
      { c: 'cecilia', t: '어머, 귀가 즐겁네요. 한 달간 잘 부탁드려요.', e: 'smirk' },
      { bg: 'house_day' },
      { c: 'daughter', t: '아빠. 나 예법 교실 더 다닐래. 복수할 거야.', e: 'angry' },
      { fx: { v: { grace: 1, stress: 5 }, aff: { cecilia: 4 } } },
    ] },
    { end: true },
  ];

  SC.ev_leo_bread = [
    { bg: 'town_square' },
    '새벽 네 시. 잠이 안 와 창밖을 보던 당신은 빵집 불빛을 보았다. 그리고 그 앞에 서 있는 딸도.',
    { show: 'leo', e: 'tired', at: 'r' },
    { show: 'daughter', e: 'smile', at: 'l' },
    { c: 'leo', t: '이, 이렇게 접고… 누르고… 다시 접고. 반죽은 화내면 안 돼. 달래야 해.', e: 'smile' },
    { c: 'daughter', t: '반죽을 달래? 반죽한테도 기분이 있어?', e: 'surprised' },
    { c: 'leo', t: '있어. 오늘은 좀 기분이 좋은 것 같아. 너, 너 때문인가.', e: 'shy' },
    { c: 'daughter', t: '나 때문에? 왜?', e: 'neutral' },
    { c: 'leo', t: '아, 아니! 날씨! 날씨 때문에!', e: 'surprised' },
    '두 아이는 밀가루를 뒤집어쓰고 첫 빵을 구워 냈다. 모양이 조금 이상한, 별 모양 빵.',
    { c: 'daughter', t: '이거 아빠 거. 내가 만든 첫 빵이야.', e: 'laugh' },
    { choice: [
      { t: '한 입에 먹고 "왕국 최고의 빵이다."', fx: { aff: { daughter: 3, leo: 3 }, v: { house: 2 } }, then: [
        { c: 'leo', t: '그, 그렇죠? 걔 손이 좋아요. 반죽이 걔를 좋아해요.', e: 'smile' },
      ] },
      { t: '"레오, 우리 딸 새벽에 불러내는 건 곤란한데."', fx: { aff: { leo: -2 }, v: { moral: 1 } }, then: [
        { c: 'leo', t: '히익! 죄, 죄송합니다, 아저씨! 제가 부른 게 아니라 걔가 먼저….', e: 'worried' },
        { c: 'daughter', t: '아빠! 레오 겁주지 마! 내가 온 거야!', e: 'angry' },
      ] },
    ] },
    { fx: { aff: { leo: 6 }, flag: 'leo_bread' } },
    { end: true },
  ];

  // ===== 13세 =====
  SC.ev_secret_nightmare = [
    { bg: 'daughter_room' },
    '열세 살이 된 해 초여름. {s.dname}의 악몽이 다시 시작되었다.',
    '이번엔 소리를 지르지 않았다. 대신, 방 안의 물건들이 공중에 떠 있었다.',
    { show: 'daughter', e: 'cry', at: 'c' },
    '책, 촛대, 고등어의 밥그릇까지. 펜던트가 대낮처럼 빛나고, 창문 유리에 여덟 꼭지 별 모양 서리가 맺혔다.',
    { c: 'daughter', t: '…세레스… 세레스티아… 누가 자꾸 나를 그렇게 불러….', e: 'cry' },
    { c: 'me', t: '{s.dname}! 일어나!' },
    '당신이 이름을 부르는 순간, 떠 있던 물건들이 한꺼번에 떨어졌다.',
    { c: 'daughter', t: '아, 아빠…? 나, 나 또 뭐 한 거야? 방이 왜 이래?', e: 'surprised' },
    { c: 'daughter', t: '나 괴물이야? 나 이상한 거야?', e: 'cry' },
    { choice: [
      { t: '꼭 안아 준다. "괴물 아니야. 아빠 딸이야."', fx: { aff: { daughter: 6 }, v: { stress: -5 } }, then: [
        { c: 'daughter', t: '……', e: 'cry' },
        '작은 어깨가 한참 떨렸다. 당신은 그 떨림이 멎을 때까지 팔을 풀지 않았다.',
      ] },
      { t: '"힘이 센 거야. 아빠처럼. 다룰 줄 알면 돼."', fx: { aff: { daughter: 4 }, v: { magic: 3 } }, then: [
        { c: 'daughter', t: '아빠처럼…? 그럼 나도 뭔가 지킬 수 있어?', e: 'surprised' },
        { c: 'me', t: '배우면. 모르간 선생에게 물어보자.' },
      ] },
    ] },
    { if: { flag: 'met_morgan' }, then: [
      { bg: 'mage_tower' },
      { show: 'morgan', e: 'worried', at: 'r' },
      { c: 'morgan', t: '…세레스티아. 그 이름을 들었다고 했습니까.', e: 'worried' },
      { c: 'morgan', t: '흐음. 용사님. 지금은 한 가지만 말씀드리지요. 그 아이의 힘은 병이 아닙니다. 유산입니다.', e: 'sad' },
      { c: 'morgan', t: '그리고 그 유산을 노리는 자들이 아직 살아 있습니다. 봉인된 마왕의 그림자들이.', e: 'cold' },
      { c: 'me', t: '당신은 뭘 알고 있습니까.' },
      { c: 'morgan', t: '전부요. 그래서 아직 말할 수 없습니다. 아이가 자신의 이름을 스스로 감당할 수 있을 때까지.', e: 'sad' },
      { fx: { aff: { morgan: 3 }, flag: 'morgan_hint' } },
    ] },
    { fx: { flag: 'secret_name', v: { magic: 2 } } },
    { end: true },
  ];

  SC.ev_lucas_secret = [
    { bg: 'balcony_night' },
    '왕궁 연회. 어른들의 지루한 인사를 피해 {s.dname}는 발코니로 나왔다. 선객이 있었다.',
    { show: 'lucas', e: 'sad', at: 'r' },
    { c: 'lucas', t: '…꼬치 빚쟁이. 여긴 어쩐 일이야.', e: 'neutral' },
    { show: 'daughter', e: 'smirk', at: 'l' },
    { c: 'daughter', t: '빚 받으러. 이자까지 해서 꼬치 다섯 개.', e: 'smirk' },
    { c: 'lucas', t: '…풉. 넌 진짜 변하질 않는구나.', e: 'laugh' },
    '루카스는 난간에 기대 연회장 불빛을 내려다보았다.',
    { c: 'lucas', t: '저 안에서 다들 형 얘기만 해. 왕세자 전하는 검술이 뛰어나시고, 학문이 깊으시고….', e: 'cold' },
    { c: 'lucas', t: '나는 「그리고 동생분도」야. 그리고. 항상 그리고.', e: 'sad' },
    { c: 'daughter', t: '…나는 「주워 온 애」야. 「그리고」가 더 나은데?', e: 'neutral' },
    { c: 'lucas', t: '……', e: 'surprised' },
    { c: 'daughter', t: '그래도 우리 아빠는 나를 「내 딸」이라고 불러. 그거면 돼. 한 사람이면.', e: 'smile' },
    { c: 'daughter', t: '너도 한 사람만 찾아. 너를 「그리고」 없이 불러 주는 사람.', e: 'smile' },
    { c: 'lucas', t: '……그럼 네가 해 줘.', e: 'shy' },
    { c: 'daughter', t: '응? 뭘?', e: 'surprised' },
    { c: 'lucas', t: '내 이름. 「그리고」 없이.', e: 'shy' },
    { c: 'daughter', t: '…루카스.', e: 'shy' },
    '연회장의 음악이 바뀌었다. 멀리서 당신은 두 아이의 뒷모습을 보며, 이유 없이 칼자루를 만지작거렸다.',
    { fx: { aff: { lucas: 10 }, flag: 'lucas_balcony1', v: { charm: 2, grace: 1 } } },
    { end: true },
  ];

  SC.ev_cook_dad = byAge(d => [
    { bg: 'house_night' },
    '늦게 돌아온 저녁. 집 안에 좋은 냄새가 났다.',
    { show: d, e: 'smile', at: 'c' },
    { c: d, t: '어서 와, 아빠! 오늘은 내가 저녁 했어. 마르타 할머니는 쉬는 날!', e: 'laugh' },
    '식탁 위에는 스튜, 구운 빵, 그리고 어딘가 별 모양으로 썬 당근이 있었다.',
    { c: 'me', t: '…당근?' },
    { c: d, t: '아빠 눈에 좋으라고. 난 안 먹지만.', e: 'smirk' },
    '한 입 떠먹었다. 마왕성 원정 삼 년 동안 먹은 그 어떤 것보다 맛있었다.',
    { choice: [
      { t: '"…맛있다. 진짜로."', fx: { aff: { daughter: 5 }, v: { house: 2, stress: -4 } }, then: [
        { c: d, t: '진짜? 진짜로 진짜? 거짓말하면 코 벌렁거리는데… 안 벌렁거리네!', e: 'laugh' },
      ] },
      { t: '"당근 네 몫도 있지?" (당근을 딸 접시로 옮긴다)', fx: { aff: { daughter: 2 }, v: { hp: 2, house: 1 } }, then: [
        { c: d, t: '아빠아아! 이건 반칙이야!', e: 'angry' },
        '그래도 {s.dname}는 당근을 다 먹었다. 인상을 잔뜩 쓰면서.',
      ] },
    ] },
    { chat: d, goal: '딸이 처음으로 혼자 저녁을 차려 줬다. 음식과 그녀의 마음을 칭찬하며 식탁에서 이야기를 나눈다.', max: 3 },
    { fx: { flag: 'cook_dad' } },
    { end: true },
  ]);

  SC.ev_rebel = byAge(d => [
    { bg: 'house_night' },
    '쾅!',
    '문이 닫히는 소리에 집 전체가 흔들렸다. 경첩 하나가 바닥에 떨어져 굴렀다.',
    { c: 'marta', t: '…시작됐구먼요. 도련님, 사춘기라는 거예요. 마왕보다 무서운 거.', e: 'worried' },
    { bg: 'daughter_room' },
    { show: d, e: 'angry', at: 'c' },
    { c: d, t: '노크 좀 해! 여긴 내 방이야!', e: 'angry' },
    { c: 'me', t: '문이 없어서 노크할 데가 없는데.' },
    { c: d, t: '……그건 그렇네. 아무튼! 나가!', e: 'angry' },
    { c: d, t: '맨날 공부해라, 일해라, 수업 가라. 나는 아빠 인형이야?', e: 'cry' },
    { c: d, t: '아빠는 내가 뭘 좋아하는지 알기나 해?!', e: 'angry' },
    { choice: [
      { t: '"…미안. 네 얘기를 제대로 안 들었던 것 같다."', fx: { aff: { daughter: 6 }, v: { stress: -12 } }, then: [
        { c: d, t: '……', e: 'surprised' },
        { c: d, t: '갑자기 사과하면… 화를 어디다 내라고.', e: 'cry' },
        { c: 'me', t: '아빠한테 내. 대신 문은 살살 닫고.' },
      ] },
      { t: '"아빠가 널 위해 얼마나 애쓰는데!"', fx: { aff: { daughter: -6 }, v: { stress: 8, moral: 1 } }, then: [
        { c: d, t: '누가 애쓰래?! 나 이런 거 해 달라고 한 적 없어!', e: 'angry' },
        '새로 단 문짝이 또 한 번 쾅 닫혔다. 이번엔 경첩 두 개가 떨어졌다.',
        { fx: { flag: 'rebel_worse' } },
      ] },
      { t: '"그럼 알려 줘. 네가 뭘 좋아하는지."', fx: { aff: { daughter: 4 }, v: { stress: -6, sense: 2 } }, then: [
        { c: d, t: '……알려 주면 들을 거야? 진짜로?', e: 'worried' },
        { c: 'me', t: '진짜로. 받아 적을게.' },
        { c: d, t: '…펜 가져와. 길어.', e: 'shy' },
      ] },
    ] },
    { chat: d, goal: '사춘기 반항 중인 딸과 대화한다. 스트레스가 쌓여 폭발한 딸의 속마음을 들어 주고 관계를 회복한다.', max: 4 },
    { fx: { flag: 'rebel' } },
    { end: true },
  ]);

  SC.ev_rebel_resolve = byAge(d => [
    { bg: 'hill_sunset' },
    '반항기가 시작되고 몇 달 뒤. {s.dname}가 먼저 산책을 가자고 했다.',
    { show: d, e: 'neutral', at: 'c' },
    { c: d, t: '…아빠. 그때 문 쾅 닫은 거. 그리고 그다음에 쾅 닫은 거. 그리고 그다음 거.', e: 'shy' },
    { c: 'me', t: '총 열한 번.' },
    { c: d, t: '세고 있었어?!', e: 'surprised' },
    { c: d, t: '…미안해. 나도 왜 그랬는지 몰라. 그냥 가슴이 막 뜨겁고 답답했어.', e: 'sad' },
    { c: d, t: '근데 아빠는 한 번도 나한테 문 닫은 적 없더라.', e: 'cry' },
    { choice: [
      { t: '"아빠 방엔 원래 문이 없어. 네가 언제든 들어오라고."', fx: { aff: { daughter: 8 }, v: { stress: -10 } }, then: [
        { c: d, t: '거짓말. 그거 아빠가 부순 거잖아. 곰 아저씨랑 술 마시고.', e: 'laugh' },
        { c: 'me', t: '…그것도 사실이지.' },
      ] },
      { t: '"반항할 수 있다는 건, 네가 여기가 안전하다고 믿는다는 거야."', fx: { aff: { daughter: 7 }, v: { moral: 2, sense: 2 } }, then: [
        { c: d, t: '…마르타 할머니가 똑같은 말 했어. 둘이 짰지?', e: 'smirk' },
        { c: 'marta', t: '(멀리서) 안 짰수!', e: 'cold' },
      ] },
    ] },
    { chat: d, goal: '반항기를 지나며 딸이 먼저 사과한다. 서로를 이해하고 화해하는 대화.', max: 3 },
    { fx: { unflag: 'rebel', flag: 'rebel_done' } },
    { end: true },
  ]);

  // ===== 14세 =====
  SC.ev_meet_darius = [
    { bg: 'corridor_night' },
    '달이 없는 밤. 성당 봉사를 마치고 돌아오던 {s.dname}의 발소리가 뒷골목에서 뚝 끊겼다.',
    { show: 'daughter_teen', e: 'worried', at: 'l' },
    { show: 'darius', e: 'smirk', at: 'r' },
    { c: 'darius', t: '찾았다. 별 냄새 나는 공주님.', e: 'smirk' },
    '검은 코트, 창백한 얼굴, 핏빛 눈. 그림자 속에서 소년이 걸어 나왔다. 발밑에서 그림자가 꿈틀거렸다.',
    { c: 'daughter_teen', t: '…너 누구야. 공주는 또 뭐고.', e: 'cold' },
    { c: 'darius', t: '다리우스. 마왕 폐하의 충실한… 아니, 그냥 심부름꾼이지.', e: 'cold' },
    { c: 'darius', t: '너를 데려오래. 얌전히 따라오면 아프진 않아.', e: 'smirk' },
    { if: { v: { combat: '>=35' } }, then: [
      '다리우스가 손을 뻗는 순간, {s.dname}의 발이 먼저 움직였다. 가렌에게 배운 그대로. 중심을 무너뜨려라.',
      { c: 'darius', t: '크윽?!', e: 'surprised' },
      { c: 'daughter_teen', t: '용사 딸한테 손 뻗으면 이렇게 돼.', e: 'smirk' },
      { c: 'darius', t: '…하. 하하! 재밌네, 공주님.', e: 'laugh' },
      { fx: { v: { combat: 2, fame: 1 } } },
    ], else: [
      { if: { v: { magic: '>=35' } }, then: [
        '{s.dname}가 손을 들자, 골목 전체에 별빛이 터졌다. 그림자가 비명을 지르며 흩어졌다.',
        { c: 'darius', t: '크읏… 눈부셔…! 역시 진짜였어.', e: 'surprised' },
        { fx: { v: { magic: 2 } } },
      ], else: [
        '다리우스의 그림자가 발목을 휘감는 찰나, 등 뒤에서 검집이 울렸다.',
        { c: 'me', t: '내 딸한테서 떨어져라.' },
        { c: 'darius', t: '…용사. 쳇, 타이밍 한번 끝내주네.', e: 'angry' },
        { fx: { aff: { daughter: 3 } } },
      ] },
    ] },
    { c: 'darius', t: '오늘은 인사만 하지. 다음엔… 네가 제 발로 오게 될 거야. 네 피가 부를 테니까.', e: 'cold' },
    { hide: 'darius' },
    '그림자가 흩어지고, 골목엔 떨어진 검은 깃털 하나만 남았다.',
    { c: 'daughter_teen', t: '…아빠. 쟤 눈. 무서운데… 슬퍼 보였어.', e: 'sad' },
    { chat: 'daughter_teen', goal: '마족 소년 다리우스에게 습격당한 직후. 겁먹었지만 강한 척하는 딸을 안심시키고, "공주"라는 말에 대해 이야기한다.', max: 3 },
    { fx: { flag: 'met_darius', aff: { darius: 5 } } },
    { end: true },
  ];

  SC.ev_garen_injury = [
    { bg: 'castle_gate' },
    '북쪽 국경에서 돌아온 기사단. 선두에, 붕대를 감은 가렌이 있었다.',
    { show: 'garen', e: 'tired', at: 'r' },
    { c: 'garen', t: '형님… 하하. 마족 잔당 녀석들, 제법이더라고. 어깨를 좀 빌려 줬지.', e: 'tired' },
    { show: 'daughter_teen', e: 'cry', at: 'l' },
    { c: 'daughter_teen', t: '아저씨! 피! 피 나잖아!', e: 'cry' },
    { c: 'garen', t: '이 정도는 침 바르면… 아야야야!', e: 'cry' },
    { if: { v: { faith: '>=35' } }, then: [
      '{s.dname}가 붕대 위에 두 손을 얹었다. 금빛이 스며들었다. 가렌의 찌푸린 얼굴이 천천히 풀렸다.',
      { c: 'garen', t: '…허. 이거 대주교님 치유보다 낫네.', e: 'surprised' },
      { fx: { v: { faith: 3, fame: 3 }, aff: { garen: 6 }, flag: 'healed_garen' } },
    ], else: [
      '{s.dname}는 서툰 손으로 붕대를 다시 감았다. 너무 꽉 감아서 가렌의 팔이 보랏빛이 되었다.',
      { c: 'garen', t: '…고맙다, 꼬마야. 팔이 좀 저리지만 마음은 따뜻해.', e: 'smile' },
      { fx: { v: { house: 2 }, aff: { garen: 4 } } },
    ] },
    { c: 'garen', t: '형님, 조용히 들어. 놈들이 뭔가를 찾고 있어. "별의 아이"라고 하더군.', e: 'cold' },
    { c: 'garen', t: '…설마 아니겠지?', e: 'worried' },
    { choice: [
      { t: '"설마. 우리 애는 그냥 당근 싫어하는 애야."', fx: { v: { stress: -3 } }, then: [
        { c: 'garen', t: '그렇지! 하하… 그렇지.', e: 'laugh' },
      ] },
      { t: '"…가렌. 혹시 그렇다면, 도와줄 수 있어?"', fx: { aff: { garen: 5 }, flag: 'garen_ally' }, then: [
        { c: 'garen', t: '형님. 그걸 말이라고 해? 이 방패는 원래 형님네 거야. 이제 그 애 거고.', e: 'smile' },
      ] },
    ] },
    { end: true },
  ];

  SC.ev_first_love = [
    { bg: 'daughter_room' },
    '요즘 {s.dname}가 이상하다. 거울 앞에 한 시간씩 서 있고, 한숨을 쉬고, 갑자기 베개를 때린다.',
    { c: 'marta', t: '도련님. 이건 제 경험상… 첫사랑이에요.', e: 'smirk' },
    { c: 'me', t: '…누구를 베면 됩니까.' },
    { c: 'marta', t: '아무도 베지 마세요!', e: 'angry' },
    { show: 'daughter_teen', e: 'shy', at: 'c' },
    { c: 'daughter_teen', t: '아, 아빠. 물어볼 게 있는데. 그냥 친구 얘긴데. 진짜 친구 얘긴데.', e: 'shy' },
    { c: 'daughter_teen', t: '누구 생각만 하면 가슴이 쿵쾅거리고 밥이 안 넘어가면, 그거 무슨 병이야?', e: 'worried' },
    { if: { top: 'leo' }, then: [
      { c: 'daughter_teen', t: '그 친구가… 매일 아침 창문 앞에 빵을 놔두는 애를 생각하면 그렇대. 친구가.', e: 'shy' },
      { fx: { set: { crush: 'leo' } } },
    ], else: [
      { if: { top: 'lucas' }, then: [
        { c: 'daughter_teen', t: '그 친구가… 잘난 척하는데 외로워 보이는 금발을 생각하면 그렇대. 친구가.', e: 'shy' },
        { fx: { set: { crush: 'lucas' } } },
      ], else: [
        { if: { top: 'darius' }, then: [
          { c: 'daughter_teen', t: '그 친구가… 무섭고 슬픈 빨간 눈을 생각하면 그렇대. 친구가.', e: 'shy' },
          { fx: { set: { crush: 'darius' } } },
        ], else: [
          { c: 'daughter_teen', t: '그 친구가… 아, 모르겠대. 그냥 누군가를 좋아하고 싶대. 친구가.', e: 'neutral' },
        ] },
      ] },
    ] },
    { choice: [
      { t: '"그건 병이 아니라 봄이야."', fx: { aff: { daughter: 4 }, v: { sense: 3, charm: 1 } }, then: [
        { c: 'daughter_teen', t: '…아빠가 그렇게 시적인 말 하니까 소름 돋아.', e: 'laugh' },
        { c: 'daughter_teen', t: '근데… 좋다. 봄이구나.', e: 'shy' },
      ] },
      { t: '"그 친구한테 아빠가 좀 만나 보자고 전해 줄래?"', fx: { aff: { daughter: -2 }, v: { moral: 1 } }, then: [
        { c: 'daughter_teen', t: '절대 안 돼!! 아빠 칼 들고 갈 거잖아!', e: 'angry' },
        { c: 'me', t: '안 들고 가. 도끼 들고 갈 거야.' },
        { c: 'daughter_teen', t: '아빠아아!!', e: 'angry' },
      ] },
      { t: '"아빠도 그런 적 있어. 네 나이 때."', fx: { aff: { daughter: 5 } }, then: [
        { c: 'daughter_teen', t: '진짜?! 누구? 예뻤어? 어떻게 됐어?', e: 'surprised' },
        { c: 'me', t: '대장간 집 딸이었는데… 아빠가 고백하려는 날 마왕군이 쳐들어왔어.' },
        { c: 'daughter_teen', t: '…마왕 진짜 나쁘다.', e: 'sad' },
      ] },
    ] },
    { chat: 'daughter_teen', goal: '첫사랑에 빠진 딸이 "친구 얘기"라며 연애 상담을 한다. 놀리지 않고, 과보호하지 않고, 다정하게 들어 준다.', max: 4 },
    { fx: { flag: 'first_love' } },
    { end: true },
  ];

  // ===== 15세 =====
  SC.ev_career15 = [
    { bg: 'house_night' },
    '학당에서 진로 조사서가 왔다. 「장래 희망을 세 가지 적으시오.」',
    { show: 'daughter_teen', e: 'worried', at: 'c' },
    { c: 'daughter_teen', t: '아빠. 세 개나 적으래. 난 하나도 모르겠는데.', e: 'worried' },
    { c: 'daughter_teen', t: '세실리아는 벌써 「왕비, 재상, 대공작」 적었대. 걔는 목표가 너무 높아서 코피 날 것 같아.', e: 'smirk' },
    { if: { maxstat: 'combat' }, then: [
      { c: 'daughter_teen', t: '가렌 아저씨는 나보고 기사단에 오래. 검 잡을 때가 제일 나 같다고.', e: 'neutral' },
    ] },
    { if: { maxstat: 'magic' }, then: [
      { c: 'daughter_teen', t: '모르간 선생님은 나보고 마법 학원 본과에 가래. 별이 나를 부른대. 무슨 뜻인지 모르겠어.', e: 'neutral' },
    ] },
    { if: { maxstat: 'int' }, then: [
      { c: 'daughter_teen', t: '도서관 사서님이 나보고 학자 될 거냐고 물었어. 책 냄새가 좋긴 해.', e: 'smile' },
    ] },
    { if: { maxstat: 'faith' }, then: [
      { c: 'daughter_teen', t: '엘레나 수녀님이 나 성당에 오래. 내 손이 사람을 고친대.', e: 'neutral' },
    ] },
    { if: { maxstat: 'sense' }, then: [
      { c: 'daughter_teen', t: '그림이나 음악을 하면 시간이 사라져. 그게 재능인지 도망인지 모르겠어.', e: 'worried' },
    ] },
    { if: { maxstat: 'charm' }, then: [
      { c: 'daughter_teen', t: '요즘 사람들이 나를 자꾸 쳐다봐. 무대에 서 보라는 사람도 있고. 좀 무서워.', e: 'shy' },
    ] },
    { if: { maxstat: 'house' }, then: [
      { c: 'daughter_teen', t: '요리하고 청소할 때 마음이 편해. 이런 것도 꿈이 될 수 있어?', e: 'neutral' },
    ] },
    { if: { maxstat: 'str' }, then: [
      { c: 'daughter_teen', t: '벽돌 공장 반장님이 나보고 정직원 하재. 근데 그게 꿈인지는 모르겠어.', e: 'laugh' },
    ] },
    { c: 'daughter_teen', t: '아빠는 열다섯 살 때 뭐가 되고 싶었어?', e: 'neutral' },
    { choice: [
      { t: '"대장장이. 칼을 쓰는 사람 말고 만드는 사람."', fx: { aff: { daughter: 3 }, v: { str: 1 } }, then: [
        { c: 'daughter_teen', t: '근데 왜 용사가 됐어?', e: 'surprised' },
        { c: 'me', t: '마을에 칼 쓸 사람이 나밖에 안 남았거든.' },
        { c: 'daughter_teen', t: '……', e: 'sad' },
      ] },
      { t: '"몰랐어. 모르는 게 당연한 나이야."', fx: { aff: { daughter: 4 }, v: { stress: -6 } }, then: [
        { c: 'daughter_teen', t: '그럼 이 종이에 「모름」이라고 세 번 쓸까?', e: 'smirk' },
        { c: 'me', t: '「모름, 아직 모름, 곧 앎」.' },
        { c: 'daughter_teen', t: '풉. 그거 좋다. 그렇게 낼래.', e: 'laugh' },
      ] },
    ] },
    { chat: 'daughter_teen', goal: '열다섯 살 딸과 진로에 대해 처음으로 진지하게 이야기한다. 그녀가 잘하는 것, 좋아하는 것, 두려운 것을 듣는다.', max: 4 },
    { fx: { flag: 'career15' } },
    { end: true },
  ];

  SC.ev_secret_reveal = [
    { bg: 'mage_tower' },
    { title: '별의 이름', sub: '모르간의 고백' },
    '모르간이 당신과 {s.dname}를 탑 꼭대기 천문대로 불렀다. 천장이 열려, 별이 쏟아질 듯 가까웠다.',
    { show: 'morgan', e: 'sad', at: 'r' },
    { show: 'daughter_teen', e: 'worried', at: 'l' },
    { c: 'morgan', t: '흐음. 오래 기다리셨습니다. 이제 말씀드릴 때가 된 것 같군요.', e: 'sad' },
    { c: 'morgan', t: '열두 해 전, 북쪽에 아스트렐이라는 나라가 있었습니다. 별을 읽는 왕과, 별을 부르는 무녀의 나라.', e: 'neutral' },
    { c: 'morgan', t: '마왕 노크투르는 그 나라를 제일 먼저 불태웠지요. 왜냐하면 아스트렐 왕가의 피만이 자신을 봉인할 수 있었으니까.', e: 'cold' },
    { c: 'morgan', t: '그날 밤, 왕비 전하께서 갓 태어난 공주를 제게 맡기셨습니다. "이 아이만은 별을 보며 자라게 해 달라"고.', e: 'cry' },
    { c: 'morgan', t: '저는 도망쳤고… 추격을 피하려 국경 마을에 아이를 숨겼습니다. 그리고 그 마을마저 불탔지요.', e: 'cry' },
    { c: 'daughter_teen', t: '……흰머리 남자.', e: 'surprised' },
    { c: 'daughter_teen', t: '꿈에서 나를 안고 뛰던 사람. 계속 미안하다고 하던 사람. …선생님이었어?', e: 'cry' },
    { c: 'morgan', t: '예. 세레스티아 아스트렐 전하. 당신의 진짜 이름입니다.', e: 'cry' },
    { c: 'morgan', t: '그리고 용사님이 마왕을 봉인할 수 있었던 건… 전하의 펜던트가 곁에서 공명했기 때문입니다. 당신은 몰랐겠지만.', e: 'sad' },
    '침묵. 별들만이 반짝였다.',
    { c: 'daughter_teen', t: '…그럼 나는, {s.dname}가 아니야?', e: 'cry' },
    { choice: [
      { t: '"너는 {s.dname}야. 세레스티아이기도 하고. 둘 다 너야."', fx: { aff: { daughter: 8 }, v: { stress: -8, moral: 2 } }, then: [
        { c: 'daughter_teen', t: '둘 다…?', e: 'cry' },
        { c: 'me', t: '이름이 두 개면 불러 줄 사람도 두 배지. 아빠는 계속 {s.dname}라고 부를 거고.' },
        { c: 'daughter_teen', t: '……응. 그렇게 불러 줘. 계속.', e: 'cry' },
      ] },
      { t: '모르간의 멱살을 잡는다. "왜 이제야 말하는 거야!"', fx: { aff: { morgan: -5, daughter: 3 }, v: { stress: 3 } }, then: [
        { c: 'morgan', t: '…맞으셔도 할 말이 없습니다. 비겁했지요. 두려웠습니다. 아이에게 원망받는 게.', e: 'cry' },
        { c: 'daughter_teen', t: '아빠, 놔 줘. …선생님 덕분에 내가 살았잖아. 아빠를 만났잖아.', e: 'sad' },
        '당신은 천천히 손을 놓았다.',
      ] },
      { t: '딸의 손을 잡고 아무 말 없이 곁에 선다.', fx: { aff: { daughter: 6 }, v: { sense: 3 } }, then: [
        '{s.dname}의 손은 차가웠다. 당신은 그 손이 따뜻해질 때까지 놓지 않았다.',
      ] },
    ] },
    { c: 'morgan', t: '마족들이 전하를 찾고 있습니다. 전하의 피로 봉인을 풀려고요. 혹은… 전하를 새로운 밤의 왕관에 씌우려고.', e: 'cold' },
    { c: 'morgan', t: '반대로, 전하의 힘이 완전히 깨어나면 봉인을 영원히 완성할 수도 있습니다. 혹은 아스트렐을 다시 세울 수도.', e: 'neutral' },
    { c: 'morgan', t: '어느 길을 고르든, 그건 전하와… 전하의 아버지가 정하실 일입니다.', e: 'smile' },
    { bg: 'house_night' },
    { chat: 'daughter_teen', goal: '출생의 비밀(멸망한 아스트렐 왕국의 공주 세레스티아)을 알게 된 날 밤. 혼란스러운 딸과 정체성, 두려움, 그리고 부녀 관계에 대해 이야기한다.', max: 4 },
    { c: 'daughter_teen', t: '아빠. 나 공주래. 웃기지. 당근 싫어하는 공주.', e: 'laugh' },
    { c: 'daughter_teen', t: '…근데 오늘 밤은 공주 말고 그냥 아빠 딸로 자도 돼?', e: 'cry' },
    { fx: { flag: ['heritage_known', 'heard_astrelle'], aff: { morgan: 5 } } },
    { end: true },
  ];

  SC.ev_darius_rooftop = [
    { bg: 'rooftop_night' },
    '밤. 지붕 위에서 인기척이 났다. {s.dname}가 창문으로 나가는 게 보였다.',
    { bg: 'sky_night' },
    { show: 'darius', e: 'neutral', at: 'r' },
    { show: 'daughter_teen', e: 'neutral', at: 'l' },
    { c: 'daughter_teen', t: '또 왔네. 이번엔 무슨 심부름이야?', e: 'neutral' },
    { c: 'darius', t: '…심부름 안 해. 오늘은 그냥, 별 보러.', e: 'cold' },
    { c: 'darius', t: '마계엔 별이 없거든. 하늘이 늘 붉어.', e: 'sad' },
    '당신은 굴뚝 뒤에 몸을 숨겼다. 칼자루에 손을 얹은 채로.',
    { c: 'daughter_teen', t: '너, 왜 나를 끝까지 안 데려가? 몇 번이나 기회 있었잖아.', e: 'neutral' },
    { c: 'darius', t: '……', e: 'cold' },
    { c: 'darius', t: '너를 데려가면, 걔들은 네 피로 문을 열어. 넌 껍데기만 남고.', e: 'sad' },
    { c: 'darius', t: '…나는 껍데기가 뭔지 알아. 우리 엄마가 그랬거든.', e: 'cry' },
    { c: 'daughter_teen', t: '다리우스….', e: 'sad' },
    '{s.dname}가 품에서 빵 하나를 꺼냈다. 호두 크림빵.',
    { c: 'daughter_teen', t: '먹어. 레오가 만든 거. 마계엔 이것도 없지?', e: 'smile' },
    { c: 'darius', t: '…없어.', e: 'shy' },
    { choice: [
      { t: '굴뚝 뒤에서 나선다. "배고프면 아래층에 스튜도 있다."', fx: { aff: { darius: 8, daughter: 4 }, v: { moral: 2 }, flag: 'darius_welcome' }, then: [
        { c: 'darius', t: '용, 용사?! 언제부터….', e: 'surprised' },
        { c: 'me', t: '처음부터. 스튜 먹을 거냐, 말 거냐.' },
        { c: 'darius', t: '……먹을게.', e: 'shy' },
        '그날 밤, 마족 소년은 용사의 식탁에서 스튜를 세 그릇 먹었다. 마르타는 한마디도 하지 않고 네 번째를 퍼 주었다.',
      ] },
      { t: '나서지 않고 지켜본다.', fx: { aff: { darius: 4 }, v: { sense: 1 } }, then: [
        '둘은 별이 기울 때까지 말없이 앉아 있었다. 다리우스가 떠나며 한마디를 남겼다.',
        { c: 'darius', t: '…고마워, 공주님. 아니, {s.dname}.', e: 'shy' },
      ] },
      { t: '"당장 떨어져라, 마족."', fx: { aff: { darius: -8, daughter: -4 }, v: { stress: 5 } }, then: [
        { c: 'darius', t: '…그래. 그게 정상이지. 인간은 다 그래.', e: 'cold' },
        { c: 'daughter_teen', t: '아빠! 얘 아무 짓도 안 했어!', e: 'angry' },
        { hide: 'darius' },
      ] },
    ] },
    { fx: { flag: 'darius_roof' } },
    { end: true },
  ];

  SC.ev_royal_ball = [
    { bg: 'ballroom' },
    { title: '왕궁 무도회', sub: '열다섯 살의 데뷔탕트' },
    '왕궁 무도회. 열다섯 살 귀족 자녀들의 첫 사교계 데뷔. 용사의 딸에게도 초대장이 왔다.',
    { show: 'daughter_teen', e: 'shy', at: 'c' },
    { c: 'daughter_teen', t: '아빠… 이 드레스 이상하지 않아? 허리가 너무 조여. 숨을 반만 쉬어야 해.', e: 'shy' },
    { c: 'me', t: '…….' },
    { c: 'daughter_teen', t: '왜 말이 없어? 이상해? 이상하구나!', e: 'worried' },
    { c: 'me', t: '아니. 너무 예뻐서, 아빠가 무도회 참석자 전원을 벨까 고민 중이었어.' },
    { c: 'daughter_teen', t: '그건 고민하지 마!', e: 'laugh' },
    { if: { v: { grace: '>=50' } }, then: [
      '계단을 내려오는 {s.dname}를 보고 연회장이 조용해졌다. 걸음 하나, 손끝 하나가 물 흐르듯 우아했다.',
      { c: 'cecilia', t: '……흥. 오늘만큼은 인정해 드리죠. 오늘만.', e: 'shy' },
      { fx: { v: { fame: 5, charm: 2 }, aff: { cecilia: 3 } } },
    ], else: [
      '계단을 내려오다 {s.dname}는 치맛자락을 밟았다. 휘청— 하는 순간 누군가 그녀의 팔을 잡았다.',
      { fx: { v: { grace: 1 } } },
    ] },
    { show: 'lucas', e: 'shy', at: 'r' },
    { c: 'lucas', t: '…첫 춤. 나랑 춰 줄래? 꼬치 빚, 이걸로 갚을게.', e: 'shy' },
    { choice: [
      { t: '(딸에게 고개를 끄덕여 준다)', fx: { aff: { lucas: 8, daughter: 2 }, v: { charm: 2, grace: 2 }, flag: 'danced_lucas' }, then: [
        '음악이 흘렀다. 왕자와 용사의 딸이 무도회장 한가운데서 돌았다. 서툴게, 그러나 눈부시게.',
        { c: 'lucas', t: '발 밟아도 돼. 네가 밟으면 영광이니까.', e: 'smile' },
        { c: 'daughter_teen', t: '그럼 사양 않고.', e: 'smirk' },
        { c: 'lucas', t: '아얏! 진짜로 밟을 줄은….', e: 'laugh' },
      ] },
      { t: '"첫 춤은 아빠 거다."', fx: { aff: { daughter: 6, lucas: -2 }, v: { grace: 1 } }, then: [
        { c: 'lucas', t: '…용사님과 경쟁이라니. 불리하군요.', e: 'smirk' },
        '당신은 딸의 손을 잡고 무도회장으로 나갔다. 마왕성 계단보다 떨리는 스텝이었다.',
        { c: 'daughter_teen', t: '아빠, 춤 못 추잖아.', e: 'laugh' },
        { c: 'me', t: '검술이랑 비슷해. 상대 발 안 베면 돼.' },
      ] },
      { t: '(뒤에서 레오가 빵 바구니를 들고 서성이는 게 보인다)', if: { flag: 'met_leo' }, fx: { aff: { leo: 8 }, flag: 'danced_leo' }, then: [
        { c: 'daughter_teen', t: '…레오? 너 왜 여기 있어?', e: 'surprised' },
        { c: 'leo', t: '그, 그러니까… 연회 빵 납품하러… 그런데 너, 너무 예뻐서….', e: 'shy' },
        { c: 'daughter_teen', t: '루카스, 미안. 첫 춤은 빵집 애랑 출래.', e: 'smile' },
        { c: 'lucas', t: '…빵에 졌다.', e: 'cry' },
      ] },
    ] },
    { chat: 'daughter_teen', goal: '첫 무도회가 끝난 뒤 마차 안에서 딸과 오늘 밤 이야기를 나눈다. 설렘, 긴장, 사람들의 시선.', max: 3 },
    { fx: { flag: 'royal_ball', v: { fame: 3 } } },
    { end: true },
  ];

  SC.ev_cecilia_friend = [
    { bg: 'library' },
    '비 오는 오후. 도서관 구석에서 {s.dname}는 우는 소리를 들었다.',
    { show: 'cecilia', e: 'cry', at: 'r' },
    { c: 'cecilia', t: '…보지 마요. 저리 가요.', e: 'cry' },
    { show: 'daughter_teen', e: 'worried', at: 'l' },
    { c: 'daughter_teen', t: '세실리아. 무슨 일이야?', e: 'worried' },
    { c: 'cecilia', t: '어머니가… 이번 시험 이등이라고… 공작가의 수치래요.', e: 'cry' },
    { c: 'cecilia', t: '그 일등이 누군지 알아요? …당신이에요. 그래서 더 싫어요. 당신을 미워할 수가 없어서.', e: 'cry' },
    { choice: [
      { t: '(지켜보던 당신은 딸에게 손수건을 쥐여 준다)', fx: { aff: { cecilia: 10 }, v: { moral: 2, sense: 1 } }, then: [
        { c: 'daughter_teen', t: '이거 너한테 빌렸던 거야. 향수까지 뿌려서 돌려준 그거.', e: 'smile' },
        { c: 'cecilia', t: '…바보.', e: 'cry' },
        { c: 'daughter_teen', t: '세실리아. 넌 이등이 아니라, 나랑 같이 제일 높은 데 있는 거야. 일등이 둘일 수도 있잖아.', e: 'smile' },
        { c: 'cecilia', t: '……그런 계산법이 어디 있어요.', e: 'shy' },
        { c: 'daughter_teen', t: '용사네 계산법.', e: 'laugh' },
      ] },
      { t: '(딸의 등을 살짝 민다) "네 방식대로 말해 줘."', fx: { aff: { cecilia: 7 }, v: { int: 1 } }, then: [
        { c: 'daughter_teen', t: '그럼 다음엔 네가 이겨. 내가 봐주는 거 아니고. 전력으로 붙자.', e: 'smirk' },
        { c: 'cecilia', t: '…흥. 당연하죠. 봐주면 죽여 버릴 거거든요.', e: 'smirk' },
        { c: 'cecilia', t: '고마워요. 라이벌.', e: 'smile' },
      ] },
    ] },
    { c: 'cecilia', t: '저기… 이번 주말에 당신 집에 가도 돼요? 고등어 그리러.', e: 'shy' },
    { c: 'daughter_teen', t: '와. 고등어가 공작 영애 모델 되는 날이다.', e: 'laugh' },
    { fx: { flag: 'cecilia_friend' } },
    { end: true },
  ];

  // ===== 16세 =====
  SC.ev_career16 = [
    { bg: 'hill_sunset' },
    '열여섯. 성년식까지 두 해. {s.dname}가 언덕 위에서 먼저 입을 열었다.',
    { show: 'daughter_teen', e: 'neutral', at: 'c' },
    { c: 'daughter_teen', t: '아빠. 나 요즘 생각이 많아. 되고 싶은 거랑, 될 수 있는 거랑, 되어야 하는 거.', e: 'neutral' },
    { if: { flag: 'heritage_known' }, then: [
      { c: 'daughter_teen', t: '모르간 선생님은 아스트렐을 다시 세울 수 있대. 마족들은 나를 밤의 여왕으로 만들고 싶어 하고.', e: 'worried' },
      { c: 'daughter_teen', t: '다들 내 피 얘기만 해. 내가 뭘 좋아하는지는 아무도 안 물어봐.', e: 'sad' },
    ], else: [
      { c: 'daughter_teen', t: '세실리아는 왕비 교육 받는대. 레오는 빵집 물려받고. 다들 길이 있는데 나만 갈림길에 서 있어.', e: 'sad' },
    ] },
    { c: 'daughter_teen', t: '아빠는… 내가 뭘 좋아하는 것 같아?', e: 'worried' },
    { choice: [
      { t: '"검 들 때 네 눈이 제일 반짝여."', if: { v: { combat: '>=40' } }, fx: { aff: { daughter: 3 }, v: { combat: 2 }, set: { dream: 'knight' } }, then: [
        { c: 'daughter_teen', t: '…그렇지? 나도 알아. 칼끝에서 세상이 조용해지는 느낌.', e: 'smile' },
      ] },
      { t: '"손끝에 별이 뜰 때 제일 행복해 보여."', if: { v: { magic: '>=40' } }, fx: { aff: { daughter: 3 }, v: { magic: 2 }, set: { dream: 'mage' } }, then: [
        { c: 'daughter_teen', t: '응. 그 순간엔 무섭지 않아. 내 피가 아니라 내가 하는 거니까.', e: 'smile' },
      ] },
      { t: '"책 읽다 밤새는 거, 아빠 다 알아."', if: { v: { int: '>=40' } }, fx: { aff: { daughter: 3 }, v: { int: 2 }, set: { dream: 'scholar' } }, then: [
        { c: 'daughter_teen', t: '들켰네. 촛불 몰래 켜는 거 아빠가 채워 넣은 거였지?', e: 'shy' },
      ] },
      { t: '"누군가를 돌볼 때, 네가 제일 너 같아."', if: { v: { moral: '>=40' } }, fx: { aff: { daughter: 4 }, v: { moral: 2, faith: 1 }, set: { dream: 'care' } }, then: [
        { c: 'daughter_teen', t: '…아빠가 나를 돌봐 줬으니까. 배운 거야.', e: 'cry' },
      ] },
      { t: '"무대 위에서 넌 빛나. 그림 앞에서도."', if: { v: { sense: '>=40' } }, fx: { aff: { daughter: 3 }, v: { sense: 2, charm: 1 }, set: { dream: 'art' } }, then: [
        { c: 'daughter_teen', t: '진짜? 그건 도망이 아니었구나. 좋아하는 거였구나.', e: 'smile' },
      ] },
      { t: '"모르겠어. 그래서 네가 알려 줬으면 좋겠어."', fx: { aff: { daughter: 5 }, v: { stress: -8 } }, then: [
        { c: 'daughter_teen', t: '…아빠는 늘 그렇게 나한테 공을 넘겨.', e: 'smirk' },
        { c: 'daughter_teen', t: '근데 그게 좋아. 내 인생이니까 내가 차야지.', e: 'smile' },
      ] },
    ] },
    { chat: 'daughter_teen', goal: '열여섯 살 딸과 진로 이야기 두 번째. 되고 싶은 것, 될 수 있는 것, 되어야 하는 것 사이에서 고민하는 딸의 이야기를 듣는다.', max: 4 },
    { fx: { flag: 'career16' } },
    { end: true },
  ];

  SC.ev_knight_exam = byAge(d => [
    { bg: 'field_training' },
    { title: '기사 서임 시험', sub: '왕국 기사단 연무장' },
    '왕국 기사단 서임 시험. 응시자 마흔 명 중 여자는 {s.dname} 한 명뿐이었다.',
    { show: 'garen', e: 'cold', at: 'r' },
    { c: 'garen', t: '(시험관석에서) …형님 딸이라고 봐주는 거 없다. 알지?', e: 'cold' },
    { show: d, e: 'cold', at: 'l' },
    { c: d, t: '봐주면 아저씨 수염 뽑을 거야.', e: 'smirk' },
    '첫 시험: 완전 무장 구보. 두 번째: 목검 대련. 세 번째: 기사도 문답.',
    { if: { v: { hp: '>=45' } }, then: [
      '갑옷을 입고 성벽을 세 바퀴. {s.dname}는 숨이 턱에 차도 멈추지 않았다.',
    ], else: [
      '두 바퀴째에서 다리가 풀렸다. 그래도 기어서라도 결승선을 넘었다.',
      { fx: { v: { stress: 5 } } },
    ] },
    { if: { v: { combat: '>=60' } }, then: [
      '대련 상대는 삼 년 차 종자. 두 합 만에 목검이 공중을 날았다. 상대의 것이.',
      { c: 'garen', t: '…허. 형님 검로를 그대로 닮았네.', e: 'surprised' },
    ], else: [
      '대련은 팽팽했다. 이마가 찢어지고 손목이 저렸지만, 끝내 무승부로 버텨 냈다.',
    ] },
    { c: 'garen', t: '마지막 문답. 기사는 무엇을 위해 검을 드는가.', e: 'neutral' },
    { choice: [
      { t: '(딸의 대답) "지켜야 할 사람의 이름을 기억하기 위해."', fx: { v: { moral: 2 } }, then: [
        { c: d, t: '저는 검을 들 때마다 한 사람을 생각합니다. 불타는 마을에서 저를 데려온 사람.', e: 'neutral' },
      ] },
      { t: '(딸의 대답) "누구의 예비품도 아닌 나로 서기 위해."', fx: { v: { charm: 1, combat: 1 } }, then: [
        { c: d, t: '저는 주워 온 애였고, 누군가의 딸이었고, 이제는 저 자신입니다. 그걸 증명하러 왔습니다.', e: 'cold' },
      ] },
    ] },
    { if: { all: [{ v: { combat: '>=55' } }, { v: { moral: '>=40' } }] }, then: [
      { c: 'garen', t: '……합격. {s.dname}, 왕국 기사 견습으로 임명한다.', e: 'smile' },
      { c: d, t: '……!', e: 'surprised' },
      { c: 'garen', t: '(작게) 형님, 나 지금 울어도 되냐.', e: 'cry' },
      { c: d, t: '아빠! 나 붙었어!! 아빠아!!', e: 'laugh' },
      { fx: { flag: 'knight_pass', v: { fame: 8, combat: 3 }, aff: { garen: 5, daughter: 3 } } },
    ], else: [
      { c: 'garen', t: '…불합격. 검은 좋았다. 하지만 기사의 검은 조금 더 무거워야 해.', e: 'sad' },
      { c: d, t: '……알았어. 내년에 또 올게.', e: 'cry' },
      { c: 'me', t: '잘했어. 불합격한 용사 딸이 세상에서 제일 멋있었다.' },
      { fx: { v: { stress: 8, combat: 1 }, aff: { daughter: 3 } } },
    ] },
    { end: true },
  ]);

  SC.ev_magic_exam = byAge(d => [
    { bg: 'mage_tower' },
    { title: '마법 학원 본과 시험', sub: '별의 방' },
    '마법 학원 본과 입학시험. 시험장은 「별의 방」, 벽 전체가 수정으로 된 원형 홀.',
    { show: 'morgan', e: 'neutral', at: 'r' },
    { c: 'morgan', t: '흐음. 과제는 하나입니다. 이 방의 수정에 불을 밝히십시오. 할 수 있는 만큼.', e: 'neutral' },
    { show: d, e: 'worried', at: 'l' },
    '다른 응시자들은 수정 한두 개, 많아야 열 개를 밝혔다. {s.dname}의 차례.',
    { if: { v: { magic: '>=65' } }, then: [
      '그녀가 눈을 감자 — 방 안의 모든 수정이 동시에 켜졌다. 천장이 사라지고, 한낮에 밤하늘이 떴다.',
      { c: 'morgan', t: '……전하.', e: 'cry' },
      { c: d, t: '어, 어떡해. 너무 켰나? 끌까?', e: 'surprised' },
      { c: 'morgan', t: '아니요. …아니요. 조금만 더 보고 싶습니다.', e: 'smile' },
      { fx: { flag: 'magic_pass', v: { magic: 4, fame: 8 }, aff: { morgan: 5 } } },
    ], else: [
      { if: { v: { magic: '>=45' } }, then: [
        '수정 서른 개가 차례로 불을 밝혔다. 역대 입학생 중 상위권.',
        { c: 'morgan', t: '합격입니다. 흐음, 아직 우물 바닥까지는 한참 남았군요.', e: 'smirk' },
        { fx: { flag: 'magic_pass', v: { magic: 2, fame: 3 } } },
      ], else: [
        '수정 다섯 개. 여섯 번째가 깜빡이다 꺼졌다.',
        { c: 'morgan', t: '흐음. 이번엔 아닙니다. 하지만 별은 늦게 뜨는 것도 있지요.', e: 'sad' },
        { fx: { v: { stress: 6 } } },
      ] },
    ] },
    { end: true },
  ]);

  SC.ev_marta_sick = byAge(d => [
    { bg: 'house_night' },
    '아침에 마르타가 일어나지 않았다. 부엌에 수프 냄새가 나지 않는 아침은 처음이었다.',
    { show: 'marta', e: 'tired', at: 'r' },
    { c: 'marta', t: '에헴… 별거 아니우. 늙으면 가끔 뼈가 파업을 해요.', e: 'tired' },
    { show: d, e: 'cry', at: 'l' },
    { c: d, t: '할머니, 거짓말. 이마가 불덩이야.', e: 'cry' },
    '{s.dname}는 사흘 밤낮을 마르타 곁에 붙어 있었다. 수프를 끓이고, 이마의 수건을 갈고, 옛날이야기를 졸랐다.',
    { c: 'marta', t: '…아가씨. 늙은이 얘기 하나 할까요.', e: 'neutral' },
    { c: 'marta', t: '이 할미가 궁정 시녀장일 때, 북쪽 나라에서 사절단이 왔었지요. 별처럼 웃는 공주님이 계셨어요.', e: 'smile' },
    { c: 'marta', t: '그 공주님 목에… 아가씨 것과 똑같은 펜던트가 있었답니다.', e: 'sad' },
    { c: 'marta', t: '처음 아가씨를 봤을 때 알았어요. 그래서 왕실에 자원했지요. 이 아이는 내가 지키겠다고.', e: 'cry' },
    { c: d, t: '할머니…. 그럼 할머니는 처음부터….', e: 'cry' },
    { c: 'marta', t: '에헴. 울지 마요. 이 할미는 아이 앞에서 안 울어요. …지금은 열이 나서 눈에서 땀이 나는 거고.', e: 'cry' },
    { if: { v: { faith: '>=50' } }, then: [
      '{s.dname}가 마르타의 손을 잡았다. 금빛이 방 안을 채웠다. 새벽녘, 마르타의 열이 내렸다.',
      { c: 'marta', t: '…아이고. 우리 아가씨 손이 약손이네. 백 살까지 잔소리하게 생겼네.', e: 'laugh' },
      { fx: { v: { faith: 3, moral: 2 }, aff: { marta: 10 } } },
    ], else: [
      { if: { v: { house: '>=40' } }, then: [
        '{s.dname}가 끓인 보리죽을 마르타는 한 그릇 다 비웠다. 일주일 뒤, 마르타는 다시 부엌에 섰다.',
        { c: 'marta', t: '간이 좀 싱겁더이다. 그래도 내 평생 제일 맛있는 죽이었수.', e: 'smile' },
        { fx: { v: { house: 3 }, aff: { marta: 10 } } },
      ], else: [
        '의사가 다녀가고, 마르타는 한 달을 앓았다. 그동안 집은 엉망이 되었지만, 아무도 불평하지 않았다.',
        { c: 'marta', t: '집안 꼴 좀 봐요. 할미 없으면 안 되겠네. 그러니까 오래 살아야지.', e: 'smirk' },
        { fx: { v: { stress: 8, money: -150 }, aff: { marta: 8 } } },
      ] },
    ] },
    { chat: d, goal: '가정부 마르타 할머니가 앓아누웠다가 회복한 뒤, 딸과 함께 소중한 사람을 잃을까 두려웠던 마음을 이야기한다.', max: 3 },
    { fx: { flag: 'marta_story', v: { moral: 2 } } },
    { end: true },
  ]);

  SC.ev_leo_confess = byAge(d => [
    { bg: 'town_square' },
    '새벽 네 시. 빵집 앞. 레오가 {s.dname}를 불러냈다. 당신은 우연히(정말 우연히) 창가에 서 있었다.',
    { show: 'leo', e: 'shy', at: 'r' },
    { show: d, e: 'neutral', at: 'l' },
    { c: 'leo', t: '그, 그러니까… 오늘 첫 빵이야. 네 거.', e: 'shy' },
    '레오가 내민 것은 별 모양 빵이었다. 여섯 해 전, 둘이 처음 같이 구웠던 그 모양.',
    { c: 'leo', t: '나, 너 처음 본 날부터… 매일 아침 창문 앞에 빵 놓은 거, 그거 다 이 말 하려고 그런 거야.', e: 'shy' },
    { c: 'leo', t: '좋아해. 왕자님도, 기사단도, 마법 학원도 아니고… 빵집 애지만. 평생 네 아침은 내가 구울게.', e: 'cry' },
    { c: d, t: '……', e: 'surprised' },
    { c: d, t: '…바보. 육 년이나 걸렸어?', e: 'cry' },
    { c: d, t: '나도 알았어. 창문 앞 빵이 네 거라는 거. 그래서 매일 창문 열었던 거야.', e: 'shy' },
    '창가의 당신은, 들고 있던 찻잔에 금이 가는 소리를 들었다.',
    { choice: [
      { t: '(조용히 커튼을 친다)', fx: { aff: { daughter: 4, leo: 5 }, v: { moral: 2 } }, then: [
        '이건 아빠가 볼 장면이 아니었다. 당신은 커튼을 치고, 식은 차를 마셨다. 이상하게 짰다.',
      ] },
      { t: '(창문을 열고) "레오. 아침 먹고 가라. 할 말이 있다."', fx: { aff: { leo: 3, daughter: 2 } }, then: [
        { c: 'leo', t: '히익! 아, 아저씨?!', e: 'surprised' },
        { c: d, t: '아빠!! 엿들었어?!', e: 'angry' },
        '그날 아침 식탁. 당신은 레오에게 딱 한마디만 했다.',
        { c: 'me', t: '울리면 오븐에 넣는다.' },
        { c: 'leo', t: '네, 넵! 절대 안 울립니다! 제가 대신 울겠습니다!', e: 'cry' },
      ] },
    ] },
    { fx: { flag: 'leo_confess', aff: { leo: 10 } } },
    { end: true },
  ]);

  SC.ev_lucas_balcony = byAge(d => [
    { bg: 'balcony_night' },
    '왕궁의 밤. 루카스가 보낸 편지에는 한 줄뿐이었다. 「그 발코니에서.」',
    { show: 'lucas', e: 'neutral', at: 'r' },
    { show: d, e: 'neutral', at: 'l' },
    { c: 'lucas', t: '와 줬네. 안 올 줄 알았어.', e: 'smile' },
    { c: d, t: '꼬치 빚 받으러. 이자가 불어서 이제 백 개쯤 될걸.', e: 'smirk' },
    { c: 'lucas', t: '…그거 평생 갚을게. 매일 한 개씩.', e: 'shy' },
    { c: 'lucas', t: '형이 혼인 동맹 얘기를 꺼냈어. 나를 이웃 나라 공주랑 묶겠대.', e: 'cold' },
    { c: 'lucas', t: '처음으로 아버지께 「싫습니다」라고 했어. 좋아하는 사람이 있다고.', e: 'shy' },
    { c: d, t: '……누군데.', e: 'shy' },
    { c: 'lucas', t: '나를 「그리고」 없이 불러 준 사람. 단추로 꼬치 사려던 바보한테 빚을 준 사람.', e: 'smile' },
    { c: 'lucas', t: '{s.dname}. 성년식 날, 네 대답을 들으러 갈게. 그때까지 기다릴게.', e: 'neutral' },
    { if: { flag: 'heritage_known' }, then: [
      { c: d, t: '루카스. 나… 평범한 애가 아니야. 아스트렐의….', e: 'worried' },
      { c: 'lucas', t: '알아. 아버지께 들었어. 상관없어. 난 공주를 좋아하는 게 아니라 너를 좋아하는 거니까.', e: 'smile' },
      { fx: { aff: { lucas: 3 } } },
    ] },
    { choice: [
      { t: '(멀리서 지켜보던 당신) 헛기침을 크게 한다.', fx: { aff: { lucas: 2 }, v: { stress: -2 } }, then: [
        { c: 'lucas', t: '요, 용사님?! 언제부터…!', e: 'surprised' },
        { c: 'me', t: '「꼬치 빚」부터.' },
        { c: d, t: '아빠아아!!', e: 'angry' },
      ] },
      { t: '(멀리서 지켜보던 당신) 조용히 자리를 뜬다.', fx: { aff: { daughter: 3, lucas: 3 } }, then: [
        '돌아서는 길, 달이 유난히 밝았다. 이 아이가 떠날 날이 생각보다 가깝다는 걸, 당신은 그 달빛 아래서 알았다.',
      ] },
    ] },
    { fx: { flag: 'lucas_confess', aff: { lucas: 10 } } },
    { end: true },
  ]);

  SC.ev_demon_raid = byAge(d => [
    { bg: 'festival', fx: 'flash' },
    { title: '밤이 내려온 날', sub: '마족 습격' },
    '초겨울 축등제의 밤. 하늘의 별이 하나씩 꺼지기 시작했다.',
    '검은 날개. 수백 개의 그림자. 여섯 해 전 {s.dname}의 악몽 그대로였다.',
    { bg: 'town_square', fx: 'shake' },
    '마족 잔당의 습격. 목표는 단 하나 — 별의 아이.',
    { show: d, e: 'cold', at: 'c' },
    { c: d, t: '아빠. 쟤들, 나 때문에 온 거지.', e: 'cold' },
    { c: 'me', t: '뒤로 물러나 있어.' },
    { c: d, t: '싫어. 이번엔 내가 아빠 옆에 설 거야. 그러려고 컸어.', e: 'angry' },
    { if: { flag: 'garen_ally' }, then: [
      { c: 'garen', t: '형님! 기사단 제1대대, 광장 동쪽 확보했다! 이번엔 늦지 않았어!', e: 'laugh' },
      { fx: { aff: { garen: 3 } } },
    ] },
    { if: { flag: 'met_elena' }, then: [
      { c: 'elena', t: '주님 보시기에, 이건 정당방위예요. (메이스를 휘두르며)', e: 'smile' },
    ] },
    { if: { v: { combat: '>=60' } }, then: [
      '{s.dname}의 검이 밤을 갈랐다. 당신이 가르친 검로, 가렌이 다듬은 발놀림. 등을 맞댄 부녀 앞에서 그림자들이 물러섰다.',
      { fx: { v: { combat: 3, fame: 6 } } },
    ] },
    { if: { v: { magic: '>=60' } }, then: [
      '{s.dname}가 하늘로 손을 뻗었다. 꺼졌던 별들이 한꺼번에 되살아나며 빛의 비가 쏟아졌다.',
      { fx: { v: { magic: 3, fame: 6 } } },
    ] },
    { if: { v: { faith: '>=60' } }, then: [
      '다친 시민들 사이를 {s.dname}가 달렸다. 손이 닿는 곳마다 금빛이 피었다. 사람들이 그녀를 「성녀님」이라 불렀다.',
      { fx: { v: { faith: 3, fame: 6 } } },
    ] },
    { if: { flag: 'met_darius' }, then: [
      { show: 'darius', e: 'cold', at: 'r' },
      { c: 'darius', t: '물러서라! 이 여자는… 이 여자는 내가 데려간다!', e: 'angry' },
      '다리우스의 그림자가 마족들을 가로막았다. 그는 그녀를 데려가는 척하며, 동족에게 등을 돌리고 있었다.',
      { if: { aff: { darius: '>=40' } }, then: [
        { c: 'darius', t: '…가, {s.dname}. 여기서 도망쳐. 나 오래 못 버텨.', e: 'cry' },
        { c: d, t: '바보야! 너도 같이 가!', e: 'cry' },
        { fx: { flag: 'darius_betrayed_demons', aff: { darius: 8 } } },
      ], else: [
        { c: 'darius', t: '…착각하지 마. 네 피는 내가 먼저 찜한 거니까.', e: 'smirk' },
      ] },
    ] },
    '새벽. 마족들은 물러갔다. 광장에는 부서진 등불과, 살아남은 사람들의 환호가 남았다.',
    '{s.dname}의 펜던트에 금이 가 있었다. 그 틈으로, 여덟 꼭지 별빛이 조용히 새어 나오고 있었다.',
    { c: d, t: '아빠. 나… 이제 숨을 수 없는 것 같아.', e: 'tired' },
    { chat: d, goal: '마족의 습격을 함께 막아 낸 새벽. 지치고 두려운 딸과, 더는 숨길 수 없게 된 그녀의 힘과 운명에 대해 이야기한다.', max: 3 },
    { fx: { flag: 'demon_raid', v: { stress: 10, fame: 5 } } },
    { end: true },
  ]);

  // ===== 17세 =====
  SC.ev_career17 = [
    { bg: 'house_night' },
    '열일곱의 겨울 밤. 난롯가. {s.dname}가 차 두 잔을 들고 왔다. 이제 그녀가 차를 따르는 쪽이었다.',
    { show: 'daughter_adult', e: 'smile', at: 'c' },
    { c: 'daughter_adult', t: '아빠, 앉아. 오늘은 내가 아빠 상담해 줄게.', e: 'smile' },
    { c: 'me', t: '…무슨 상담?' },
    { c: 'daughter_adult', t: '딸 떠나보낼 준비 상담. 아빠 요즘 밤에 자꾸 내 어릴 때 옷 꺼내 보잖아. 다 알아.', e: 'smirk' },
    { c: 'daughter_adult', t: '내년 봄이면 성년식이야. 그다음엔 나도 내 길을 가야겠지.', e: 'neutral' },
    { c: 'daughter_adult', t: '근데 아빠. 나 정했어. 아니, 거의 정했어. 마지막 한 조각은 아빠가 채워 줘.', e: 'neutral' },
    { choice: [
      { t: '"네가 정한 길이면, 아빠는 그 길 끝에서 기다릴게."', fx: { aff: { daughter: 6 }, v: { stress: -8 } }, then: [
        { c: 'daughter_adult', t: '끝에서 말고 옆에서. 가끔 앞에서도. 넘어지면 곤란하니까.', e: 'laugh' },
      ] },
      { t: '"…사실 아직 준비 안 됐어. 조금만 천천히 커 주면 안 될까."', fx: { aff: { daughter: 7 }, v: { sense: 2 } }, then: [
        { c: 'daughter_adult', t: '…아빠.', e: 'cry' },
        { c: 'daughter_adult', t: '나도 준비 안 됐어. 우리 둘 다 준비 안 된 채로 가자. 그게 가족이잖아.', e: 'cry' },
      ] },
      { t: '"어떤 길이든, 너는 이미 아빠의 자랑이야."', fx: { aff: { daughter: 5 }, v: { moral: 2, charm: 1 } }, then: [
        { c: 'daughter_adult', t: '그 말 들으려고 칠 년 동안 노력했는데. 이렇게 쉽게 해 주면 반칙이야.', e: 'shy' },
      ] },
    ] },
    { chat: 'daughter_adult', goal: '성년식을 앞둔 열일곱 살 딸과 마지막 진로 상담. 이제는 딸이 아빠를 위로하는 쪽. 어떤 길을 가고 싶은지, 아빠에게 무엇을 바라는지.', max: 4 },
    { fx: { flag: 'career17' } },
    { end: true },
  ];

  SC.ev_darius_choice = [
    { bg: 'forest' },
    '동쪽 숲. 다리우스가 마지막으로 {s.dname}를 불러냈다. 당신은 멀찍이 뒤따랐다.',
    { show: 'darius', e: 'cold', at: 'r' },
    { show: 'daughter_adult', e: 'neutral', at: 'l' },
    { c: 'darius', t: '잔당들이 마지막 의식을 준비하고 있어. 봉인이 가장 약해지는 날. 네 성년식 날이야.', e: 'cold' },
    { c: 'darius', t: '선택지는 두 개야. 너를 그놈들에게 넘기든가. 아니면….', e: 'worried' },
    { c: 'darius', t: '네가 먼저 왕관을 쓰든가. 밤의 왕관. 그러면 마족들은 너를 따를 거야. 전쟁도 없고, 희생도 없어. 대신 넌 인간 세상에 못 돌아와.', e: 'sad' },
    { c: 'darius', t: '…나는 네 곁에 있을게. 어느 쪽이든.', e: 'shy' },
    { c: 'daughter_adult', t: '……', e: 'worried' },
    { choice: [
      { t: '(앞으로 나선다) "세 번째 길이 있다. 내가 찾는다."', fx: { aff: { daughter: 5, darius: 3 }, v: { moral: 3 }, flag: 'third_way' }, then: [
        { c: 'darius', t: '…용사. 또 그 소리야? 당신들 인간은 늘 세 번째 길 타령이지.', e: 'smirk' },
        { c: 'me', t: '그리고 늘 찾아냈지. 마왕도 그렇게 봉인했다.' },
        { c: 'darius', t: '……하. 좋아. 이번 한 번만 믿어 주지.', e: 'smile' },
      ] },
      { t: '(딸의 선택을 지켜본다)', fx: { v: { sense: 2 } }, then: [
        { if: { all: [{ v: { moral: '<=40' } }, { v: { magic: '>=50' } }] }, then: [
          { c: 'daughter_adult', t: '…밤의 왕관. 그게 제일 아무도 안 다치는 길이라면.', e: 'cold' },
          { c: 'daughter_adult', t: '다리우스. 그 손, 잡을게.', e: 'neutral' },
          { c: 'darius', t: '……정말?', e: 'surprised' },
          { fx: { flag: 'darius_pact', aff: { darius: 10 } } },
        ], else: [
          { c: 'daughter_adult', t: '아니. 난 둘 다 안 해. 넘겨지지도 않고, 도망치지도 않아.', e: 'cold' },
          { c: 'daughter_adult', t: '그리고 다리우스, 너도 내 쪽으로 와. 네 자리 하나쯤 우리 식탁에 있어.', e: 'smile' },
          { c: 'darius', t: '……너희 부녀는 진짜 구제 불능이다.', e: 'cry' },
          { fx: { flag: 'darius_saved', aff: { darius: 8 } } },
        ] },
      ] },
    ] },
    { end: true },
  ];

  SC.ev_letter = [
    { bg: 'daughter_room' },
    '성년식을 한 달 앞둔 날. 책상 위에 편지 한 통이 놓여 있었다. 「아빠에게. 성년식 끝나고 열어 볼 것.」',
    '당신은 물론 바로 열었다. 용사는 기다리는 걸 제일 못한다.',
    { bg: 'house_night' },
    '「아빠에게.',
    '아빠, 이 편지 지금 열었지? 알아. 아빠는 기다리는 걸 제일 못하니까.',
    '처음 만난 날 기억나? 나는 아빠한테 "나 안 버려?"라고 물었어. 그때 아빠 표정, 아직도 기억해. 마왕보다 무서운 걸 본 사람 같았어.',
    '그 뒤로 아빠는 한 번도 나를 버린 적이 없어. 내가 문을 열한 번 쾅 닫았을 때도. 당근을 몰래 버렸을 때도.',
    '나는 이제 곧 어른이 돼. 어디로 가든, 무엇이 되든, 이것만은 기억해 줘.',
    '나를 키운 건 별의 피가 아니라, 아빠가 켜 둔 촛불 하나였어.',
    '사랑해, 아빠. 세상에서 제일 센 사람.',
    '— 아빠의 딸, {s.dname}」',
    '당신은 편지를 다시 봉투에 넣었다. 그리고 성년식이 끝나면, 처음 읽는 척하기로 했다.',
    { show: 'daughter_adult', e: 'smirk', at: 'c' },
    { c: 'daughter_adult', t: '아빠. 눈 왜 빨개?', e: 'smirk' },
    { c: 'me', t: '…양파.' },
    { c: 'daughter_adult', t: '오늘 저녁에 양파 없는데.', e: 'laugh' },
    { fx: { aff: { daughter: 8 }, v: { stress: -10 }, flag: 'letter' } },
    { end: true },
  ];

  // ===== 상태 이벤트 (나이 무관) =====
  SC.ev_sick = byAge(d => [
    { bg: 'daughter_room' },
    '{s.dname}가 쓰러졌다. 수업에서 돌아오자마자, 현관에서.',
    { show: d, e: 'tired', at: 'c' },
    { c: 'marta', t: '과로예요. 몸이 버티질 못한 거예요. 도련님, 일정을 너무 빡빡하게 짜셨수.', e: 'angry' },
    { c: d, t: '…괜찮아. 나 내일 수업 가야 해. 빠지면 뒤처져.', e: 'tired' },
    { c: d, t: '아빠가 기대하는데… 실망시키기 싫어.', e: 'cry' },
    { choice: [
      { t: '"기대 같은 거 다 취소야. 이번 달은 무조건 쉰다."', fx: { aff: { daughter: 5 }, setv: { stress: 20 }, v: { hp: 3 } }, then: [
        { c: d, t: '…정말? 혼 안 내?', e: 'surprised' },
        { c: 'me', t: '아빠가 혼나야지. 마르타 할머니한테 벌써 혼났어.' },
        { c: d, t: '풉… 쿨럭.', e: 'laugh' },
      ] },
      { t: '약초죽을 직접 끓여 준다.', fx: { aff: { daughter: 4 }, setv: { stress: 30 }, v: { hp: 2, money: -50 } }, then: [
        '당신이 끓인 죽은 살짝 탔고, 많이 짰다. {s.dname}는 한 숟갈도 남기지 않았다.',
        { c: d, t: '…맛없어. 근데 또 해 줘.', e: 'smile' },
      ] },
    ] },
    { chat: d, goal: '과로로 쓰러진 딸의 병상 곁에서. 아빠를 실망시킬까 봐 무리했던 딸의 마음을 풀어 준다.', max: 3 },
    { fx: { flag: 'was_sick' } },
    { end: true },
  ]);

  SC.ev_sick_again = byAge(d => [
    { bg: 'daughter_room' },
    '또다시 {s.dname}가 앓아누웠다. 이번엔 열이 사흘을 갔다.',
    { c: 'marta', t: '도련님. 이러다 애 잡겠어요. 쉬게 하세요. 제발.', e: 'angry' },
    { show: d, e: 'tired', at: 'c' },
    { c: d, t: '…아빠, 미안. 또 쓰러졌어.', e: 'tired' },
    { c: 'me', t: '사과는 아빠가 해야지.' },
    '당신은 이번 달 계획표를 찢었다. 그리고 한 달 내내 딸 곁에서 동화책을 읽었다. 여섯 살짜리 책을.',
    { fx: { setv: { stress: 25 }, v: { hp: 2, money: -80 }, aff: { daughter: 2 } } },
    { end: true },
  ]);

  SC.ev_delinquent = byAge(d => [
    { bg: 'tavern' },
    '밤 열한 시. 딸이 들어오지 않았다. 당신은 뒷골목 주점에서 그녀를 찾아냈다.',
    { show: d, e: 'smirk', at: 'c' },
    '험상궂은 무리 사이에서, {s.dname}가 주사위를 굴리고 있었다. 짙은 화장, 찢어진 치마.',
    { c: d, t: '…아빠? 여긴 왜 와. 창피하게.', e: 'cold' },
    { c: d, t: '여기 애들은 나보고 공부하라고 안 해. 착하게 굴라고도 안 하고. 편해.', e: 'smirk' },
    { choice: [
      { t: '말없이 그녀의 손목을 잡고 끌고 나온다.', fx: { aff: { daughter: -4 }, v: { moral: 4, stress: 6 } }, then: [
        { c: d, t: '놔! 놓으라고! 아빠가 뭔데!', e: 'angry' },
        { c: 'me', t: '아빠지.' },
        { c: d, t: '……', e: 'cry' },
        '돌아오는 길 내내, 그녀는 한 번도 손을 뿌리치지 않았다.',
      ] },
      { t: '옆자리에 앉는다. "한 판 끼워 줘."', fx: { aff: { daughter: 4 }, v: { moral: 2, stress: -4 } }, then: [
        '무리가 술렁였다. 용사다. 진짜 용사다. 한 명씩 슬금슬금 자리를 떴다.',
        { c: d, t: '…아빠 때문에 다 도망갔잖아.', e: 'angry' },
        { c: 'me', t: '그럼 둘이 하자. 지는 사람이 설거지.' },
        { c: d, t: '……바보 아빠.', e: 'cry' },
      ] },
      { t: '"네가 원하는 게 이거라면, 말리지 않겠다."', fx: { aff: { daughter: -2 }, v: { moral: -3, charm: 1 } }, then: [
        { c: d, t: '……진짜? 그럼 나 오늘 안 들어가.', e: 'surprised' },
        '그녀는 그날 새벽에 들어왔다. 현관에 앉아 기다리던 당신을 보고, 아무 말 없이 방으로 들어갔다.',
        { fx: { flag: 'delinq_ignored' } },
      ] },
    ] },
    { chat: d, goal: '뒷골목에서 비행 청소년들과 어울리던 딸을 찾아낸 밤. 화내지 않고, 왜 그랬는지 그녀의 마음을 들어 본다.', max: 4 },
    { fx: { flag: 'delinquent' } },
    { end: true },
  ]);

  SC.ev_delinquent2 = byAge(d => [
    { bg: 'house_night' },
    '새벽. 딸의 방이 비어 있었다. 책상 위에 쪽지 한 장.',
    '「찾지 마. 나는 원래 주워 온 애였잖아. 원래 자리로 가는 것뿐이야.」',
    { c: 'marta', t: '…도련님. 짐을 싸서 나갔어요. 북쪽 성문으로.', e: 'cry' },
    { bg: 'castle_gate' },
    '당신은 달렸다. 마왕성 계단을 오를 때보다 빨리.',
    { show: d, e: 'cold', at: 'c' },
    '성문 밖, 길 위에 그녀가 서 있었다. 뒤돌아보지 않고.',
    { c: d, t: '왜 왔어. 나 같은 거, 없는 게 아빠한테 나아.', e: 'cold' },
    { if: { aff: { daughter: '>=30' } }, then: [
      { choice: [
        { t: '"처음 만난 날 약속했잖아. 안 버린다고. 너도 날 버리지 마."', fx: { aff: { daughter: 10 }, v: { moral: 6, stress: -10 }, unflag: 'delinquent' }, then: [
          { c: d, t: '……', e: 'cry' },
          { c: d, t: '…새끼손가락 약속이었지. 그거 깨면 바늘 천 개 삼켜야 하는 거.', e: 'cry' },
          { c: d, t: '아빠 바늘 삼키게 할 순 없잖아. …집에 갈래.', e: 'cry' },
          '그녀가 돌아서서 당신에게 달려와 안겼다. 열 살 때처럼, 망토에 코를 묻고.',
          { fx: { flag: 'came_back' } },
        ] },
        { t: '아무 말 없이, 망토를 벗어 그녀 어깨에 둘러 준다.', fx: { aff: { daughter: 10 }, v: { moral: 5, stress: -10 }, unflag: 'delinquent' }, then: [
          '처음 만난 날처럼. 전장의 먼지와 햇볕 냄새.',
          { c: d, t: '……따뜻해. 아직도.', e: 'cry' },
          { c: d, t: '…미안해, 아빠. 집에 가자.', e: 'cry' },
          { fx: { flag: 'came_back' } },
        ] },
      ] },
    ], else: [
      { c: 'me', t: '돌아와라. 제발.' },
      { c: d, t: '…늦었어, 아빠. 너무 늦었어.', e: 'cry' },
      '그녀는 끝내 돌아보지 않았다. 북쪽 길이 새벽안개 속으로 그녀를 삼켰다.',
      { fx: { flag: 'ran_away' } },
      { ending: 'runaway' },
    ] },
    { end: true },
  ]);

  SC.ev_debt = byAge(d => [
    { bg: 'house_day' },
    '빚쟁이가 문을 두드렸다. 가계부는 빨간 글씨로 가득했다.',
    { show: d, e: 'worried', at: 'l' },
    { c: d, t: '아빠… 우리 쫓겨나?', e: 'worried' },
    { show: 'garen', e: 'laugh', at: 'r' },
    { c: 'garen', t: '형님! 여기 있소! 기사단 비상금… 아니 내 쌈짓돈이오!', e: 'laugh' },
    { c: 'me', t: '가렌….' },
    { c: 'garen', t: '갚지 마시오. 대신 조카한테 아저씨 멋있다고 한 번만 말해 주쇼.', e: 'shy' },
    { c: d, t: '아저씨 멋있어. 진짜로. 수염 빼고.', e: 'smile' },
    { c: 'garen', t: '…수염이 핵심인데.', e: 'cry' },
    { c: 'marta', t: '도련님. 이제 애한테 아르바이트 좀 시키시우. 용사 체면이 밥 먹여 주지 않아요.', e: 'cold' },
    { fx: { v: { money: 400, stress: 5 }, aff: { garen: 3 } } },
    { end: true },
  ]);

  SC.ev_fame = byAge(d => [
    { bg: 'town_square' },
    '광장을 지나는데 아이들이 몰려들었다.',
    '"용사님 딸이다!" "진짜 {s.dname} 님이야!" "사인해 주세요!"',
    { show: d, e: 'surprised', at: 'c' },
    { c: d, t: '어, 어? 나? 아빠가 아니라?', e: 'surprised' },
    '아이들은 당신을 지나쳐 그녀에게 몰려갔다. 당신은 처음으로 「용사님 옆 사람」이 되었다.',
    { c: d, t: '아빠… 이거 어떡해. 사인 같은 거 안 해 봤어.', e: 'shy' },
    { choice: [
      { t: '"이름 쓰고, 옆에 별 하나 그려."', fx: { v: { charm: 2, fame: 2 }, aff: { daughter: 2 } }, then: [
        '{s.dname}의 첫 사인. 삐뚤빼뚤한 이름 옆에 여덟 꼭지 별.',
        { c: d, t: '아빠 것도 해 줄까? 딸 사인 첫 번째 소장자.', e: 'laugh' },
      ] },
      { t: '"유명해지면 조심할 것도 많아진다."', fx: { v: { moral: 2, grace: 1 } }, then: [
        { c: d, t: '알아. 아빠 보고 배웠어. 시장에서 사과 하나 사도 소문나는 거.', e: 'smirk' },
      ] },
    ] },
    { fx: { flag: 'famous' } },
    { end: true },
  ]);

  SC.ev_novel = byAge(d => [
    { bg: 'daughter_room' },
    '밤마다 딸의 방에서 사각사각 소리가 났다. 어느 날, 원고 뭉치가 식탁 위에 올려져 있었다.',
    '「별을 키우는 용사」 — 지은이 {s.dname}.',
    { show: d, e: 'shy', at: 'c' },
    { c: d, t: '아, 아빠! 그거 보면 안 돼! 아직 완성 안 됐어!', e: 'surprised' },
    { c: 'me', t: '…주인공이 칼로 계란을 깨는데.' },
    { c: d, t: '실화 바탕이니까!', e: 'angry' },
    '당신은 밤새 원고를 읽었다. 마지막 장에서 용사는 딸에게 이렇게 말했다. 「너는 내가 지킨 것 중에 제일 빛나는 거야.」',
    { choice: [
      { t: '"출판사에 보내 보자."', fx: { v: { sense: 3, int: 2, fame: 3 }, aff: { daughter: 4 }, flag: 'wrote_novel' }, then: [
        { c: d, t: '진, 진짜? 아빠 얘기가 다 나오는데?', e: 'surprised' },
        { c: 'me', t: '괜찮아. 아빠 멋있게 나오잖아. 계란 빼고.' },
        '석 달 뒤, 작은 출판사에서 책이 나왔다. 초판 삼백 부. 첫 번째 구매자는 가렌이었다. 열 권.',
      ] },
      { t: '"…아빠 우는 장면은 빼 주면 안 될까."', fx: { v: { sense: 2 }, aff: { daughter: 3 }, flag: 'wrote_novel' }, then: [
        { c: d, t: '안 돼. 그게 클라이맥스야.', e: 'smirk' },
      ] },
    ] },
    { end: true },
  ]);

  SC.ev_case = byAge(d => [
    { bg: 'town_market' },
    '시장 보석상에서 도난 사건이 벌어졌다. 경비대는 청소부 소년을 범인으로 몰고 있었다.',
    { show: d, e: 'cold', at: 'c' },
    { c: d, t: '잠깐만요. 그 애가 범인이면 이상한 게 세 개 있어요.', e: 'cold' },
    { c: d, t: '첫째, 진열장 자물쇠는 안쪽에서 열렸어요. 둘째, 바닥 발자국은 굽 있는 구두예요. 셋째—', e: 'neutral' },
    { c: d, t: '사장님, 오늘 아침에 왜 새 구두를 신으셨어요? 옛날 구두는 어디 있죠?', e: 'smirk' },
    '보석상 주인의 얼굴이 새하얗게 질렸다. 보험금을 노린 자작극이었다.',
    { c: d, t: '아빠, 나 방금 좀 멋있었지?', e: 'laugh' },
    { c: 'me', t: '좀이 아니라 많이.' },
    { fx: { flag: 'solved_case', v: { int: 3, moral: 2, fame: 4 }, aff: { daughter: 2 } } },
    { end: true },
  ]);

  SC.ev_miracle = byAge(d => [
    { bg: 'church' },
    '대성당. 역병에 걸린 아이들이 누워 있는 병동에 {s.dname}가 들어섰다.',
    { show: 'elena', e: 'worried', at: 'r' },
    { c: 'elena', t: '의사들도 손을 놓았어요. 주님 보시기에… 이건 너무 가혹해요.', e: 'cry' },
    { show: d, e: 'neutral', at: 'l' },
    { c: d, t: '수녀님. 저 해 볼게요.', e: 'neutral' },
    '그녀가 두 손을 모으자, 병동 전체가 금빛으로 물들었다. 스테인드글라스의 성인들이 빛 속에서 고개를 숙이는 것 같았다.',
    '아침. 아이들이 하나둘 눈을 떴다. 배고프다고 울었다. 살아 있는 울음이었다.',
    { c: 'elena', t: '……기적이에요. 진짜 기적.', e: 'cry' },
    { c: d, t: '아니에요. 그냥… 다들 살고 싶어 했어요. 저는 조금 거든 것뿐이에요.', e: 'tired' },
    '그날 이후, 왕도 사람들은 그녀를 「별의 성녀」라고 불렀다.',
    { fx: { flag: 'miracle', v: { faith: 5, moral: 3, fame: 10, stress: 8 }, aff: { elena: 8 } } },
    { end: true },
  ]);

  SC.ev_gallery = byAge(d => [
    { bg: 'town_square' },
    '왕도 화랑 주인이 찾아왔다. 성당 봉사 때 {s.dname}가 그린 벽화를 보고 왔다고.',
    { show: d, e: 'surprised', at: 'c' },
    { c: d, t: '제 그림을 전시하자고요? 그거 고아원 애들이랑 손바닥 찍은 건데요?', e: 'surprised' },
    '「별을 세는 아이들」. 서른 개의 작은 손바닥이 밤하늘의 별자리가 되는 그림.',
    { choice: [
      { t: '"해 보자. 아빠가 첫 관람객 할게."', fx: { v: { sense: 3, fame: 5, money: 300 }, aff: { daughter: 3 }, flag: 'gallery' }, then: [
        '전시 첫날, 그림 앞에서 한 노부인이 오래 울었다. 전쟁에서 손주들을 잃었다고 했다.',
        { c: d, t: '아빠. 그림이 사람을 울릴 수도 있구나. 나쁜 울음 말고 좋은 울음으로.', e: 'cry' },
      ] },
      { t: '"아이들 허락부터 받자."', fx: { v: { moral: 3, sense: 2, fame: 3 }, aff: { daughter: 2, elena: 3 }, flag: 'gallery' }, then: [
        '고아원 아이들은 만장일치로 찬성했다. 조건은 하나, 전시회에 과자가 나올 것.',
      ] },
    ] },
    { end: true },
  ]);

  SC.ev_tavern_first = byAge(d => [
    { bg: 'tavern' },
    '주점 「취한 그리핀」. {s.dname}의 첫 근무 날.',
    { show: d, e: 'smile', at: 'c' },
    { c: d, t: '어서 오세요~ 맥주 두 잔이요? 안주는 소시지? 네에~', e: 'smile' },
    '술 취한 용병 하나가 그녀의 손목을 잡았다.',
    { c: d, t: '…손 놔요. 셋 셀 동안.', e: 'cold' },
    { if: { v: { combat: '>=30' } }, then: [
      '둘까지 셀 필요도 없었다. 용병은 탁자 세 개를 부수며 날아갔다.',
      { c: d, t: '탁자값은 저분 앞으로 달아 주세요, 사장님.', e: 'smirk' },
      { fx: { v: { combat: 1, fame: 2 } } },
    ], else: [
      '셋을 세기 전에 주점 주인이 몽둥이를 들고 나왔다. 용병은 쫓겨났다.',
      { c: d, t: '…사장님, 고마워요. 나 좀 무서웠어.', e: 'worried' },
      { fx: { v: { stress: 4 } } },
    ] },
    '그날 밤, 당신은 주점 구석에서 우유 한 잔을 여섯 시간 동안 마셨다.',
    { c: d, t: '아빠. 거기 앉아 있는 거 다 보여. 손님들이 무서워해.', e: 'angry' },
    { fx: { aff: { daughter: 1 }, flag: 'tavern_seen' } },
    { end: true },
  ]);

  SC.ev_bounty_first = byAge(d => [
    { bg: 'forest' },
    '첫 현상금 사냥. 목표는 숲 속 산적 두목 「외눈 브루노」.',
    { show: d, e: 'cold', at: 'c' },
    '{s.dname}는 혼자였다. 당신 몰래 나간 것이다. 당신은 물론 몰래 뒤따라갔다.',
    { c: d, t: '브루노. 현상금 오백 골드. 순순히 따라와.', e: 'cold' },
    '산적들이 웃음을 터뜨렸다. 삼십 초 뒤, 웃음소리는 신음 소리로 바뀌어 있었다.',
    { c: d, t: '…아빠. 나무 뒤에 있는 거 알아. 발 보여.', e: 'smirk' },
    { c: 'me', t: '산책 중이었어.' },
    { c: d, t: '검 뽑고 산책해?', e: 'laugh' },
    { fx: { v: { money: 500, combat: 2, fame: 3, moral: -1 }, flag: 'bounty_done' } },
    { end: true },
  ]);

  SC.ev_dragon = byAge(d => [
    { bg: 'sky_day' },
    { title: '북쪽 설산', sub: '용의 둥지' },
    '북쪽 설산에서 돌아온 {s.dname}는, 등에 거대한 비늘 하나를 짊어지고 있었다.',
    { show: d, e: 'tired', at: 'c' },
    { c: d, t: '아빠. 나 용 봤어. 진짜 입 냄새 열 배더라.', e: 'laugh' },
    { c: 'me', t: '…싸웠어?' },
    { if: { v: { combat: '>=70' } }, then: [
      { c: d, t: '응. 이겼어. 죽이진 않았어. 새끼가 있더라고. 비늘만 하나 받아 왔어. 합의하에.', e: 'smirk' },
      '그해 겨울, 왕도에 소문이 돌았다. 용사의 딸이 용과 협상을 했다고.',
      { fx: { flag: 'dragon_slain', v: { fame: 12, combat: 3, money: 800 } } },
    ], else: [
      { c: d, t: '…도망쳤어. 비늘은 도망치다 주웠어. 살아 돌아온 게 어디야.', e: 'tired' },
      { c: 'me', t: '잘했어. 아빠도 첫 용한테선 도망쳤어.' },
      { fx: { v: { fame: 4, hp: 2, money: 300 } } },
    ] },
    { end: true },
  ]);

  SC.ev_merchant = byAge(d => [
    { bg: 'harbor' },
    '항구. {s.dname}가 가계부와 지도를 펼쳐 놓고 당신을 불렀다.',
    { show: d, e: 'smirk', at: 'c' },
    { c: d, t: '아빠, 우리 모아 둔 돈 말이야. 그냥 두면 안 불어나.', e: 'smirk' },
    { c: d, t: '남쪽 섬에서 향신료를 사서 북쪽에 팔면 세 배야. 배 한 칸만 빌리면 돼.', e: 'neutral' },
    { choice: [
      { t: '"좋아. 네 계산을 믿어 보자." (500G 투자)', fx: { v: { money: -500 } }, then: [
        { if: { v: { int: '>=45' } }, then: [
          '석 달 뒤. 배가 돌아왔다. 금화 자루와 함께.',
          { c: d, t: '봤지? 세 배! 아니, 세 배 반!', e: 'laugh' },
          { fx: { v: { money: 1750, fame: 3, int: 2 }, flag: 'trade_success' } },
        ], else: [
          '석 달 뒤. 배는 돌아왔다. 향신료 대신 바닷물을 싣고.',
          { c: d, t: '…폭풍 계산을 안 했어. 미안해, 아빠.', e: 'cry' },
          { c: 'me', t: '괜찮아. 수업료 낸 거야.' },
          { fx: { v: { money: 100, int: 2, stress: 5 } } },
        ] },
      ] },
      { t: '"아직은 이르다. 더 공부하고 하자."', fx: { v: { int: 1 } }, then: [
        { c: d, t: '쳇. 알았어. 대신 내년엔 꼭이야.', e: 'angry' },
      ] },
    ] },
    { fx: { flag: 'merchant_talk' } },
    { end: true },
  ]);

  SC.ev_mirror = byAge(d => [
    { bg: 'daughter_room' },
    '거울 앞. {s.dname}가 자기 얼굴을 한참 들여다보고 있었다.',
    { show: d, e: 'sad', at: 'c' },
    { c: d, t: '아빠. 나 예뻐?', e: 'sad' },
    { c: d, t: '다들 나 보고 예쁘다는데… 그게 다 「용사 딸」이라서 하는 말 같아.', e: 'worried' },
    { c: d, t: '진짜 내 얼굴은 어떤지 모르겠어.', e: 'sad' },
    { choice: [
      { t: '"세상에서 제일 예뻐. 아빠 눈엔 처음 본 날부터."', fx: { aff: { daughter: 4 }, v: { charm: 1 } }, then: [
        { c: d, t: '아빠 눈은 믿을 수가 없어. 아빠는 고등어도 예쁘다잖아.', e: 'smirk' },
        { c: 'me', t: '고등어는 예뻐.' },
        { c: d, t: '…그건 인정.', e: 'laugh' },
      ] },
      { t: '"얼굴보다, 네가 웃을 때 사람들이 따라 웃는 게 진짜야."', fx: { aff: { daughter: 5 }, v: { charm: 2, moral: 1 } }, then: [
        { c: d, t: '…그거 진짜야?', e: 'surprised' },
        { c: 'me', t: '마르타 할머니한테 물어봐. 할머니도 너 웃으면 따라 웃어. 몰래.' },
        { c: 'marta', t: '(부엌에서) 안 웃었수!', e: 'cold' },
      ] },
    ] },
    { end: true },
  ]);

  SC.ev_strong = byAge(d => [
    { bg: 'field_training' },
    '가렌이 도전장을 내밀었다. 종목: 팔씨름. 이번엔 봐주기 없음.',
    { show: 'garen', e: 'smirk', at: 'r' },
    { show: d, e: 'smirk', at: 'l' },
    { c: 'garen', t: '꼬마야. 몇 년 전 그 테이블 기억하지? 이번엔 진짜다.', e: 'smirk' },
    { c: d, t: '아저씨 그때 져 준 거 다 알아. 이번엔 내가 봐줄게.', e: 'smirk' },
    { if: { v: { str: '>=65' } }, then: [
      '탁. 가렌의 손등이 탁자에 닿았다. 삼 초 만에.',
      { c: 'garen', t: '……형님. 나 은퇴할까.', e: 'cry' },
      { fx: { v: { fame: 3, str: 2 }, aff: { garen: 3 } } },
    ], else: [
      '일 분 동안 팽팽. 결국 {s.dname}의 손등이 내려갔다. 가렌의 이마에 땀이 흥건했다.',
      { c: 'garen', t: '…헉, 헉. 형님, 이 애 진짜 사람 맞아?', e: 'surprised' },
      { fx: { v: { str: 2 }, aff: { garen: 2 } } },
    ] },
    { end: true },
  ]);

  SC.ev_scholar_invite = byAge(d => [
    { bg: 'library' },
    '왕립 아카데미에서 편지가 왔다. 「귀하의 따님을 특별 연구생으로 초빙합니다.」',
    { show: d, e: 'surprised', at: 'c' },
    { c: d, t: '아빠. 나 아카데미 교수님들이랑 같이 연구하래. 고대 별자리 문자 해독.', e: 'surprised' },
    { c: d, t: '…펜던트 뒷면 글씨, 그거 읽을 수 있을지도 몰라.', e: 'neutral' },
    { if: { flag: 'pendant_text' }, then: [
      { c: 'me', t: '「별은 밤을 잊지 않는다.」 아빠가 옛날에 봤어.' },
      { c: d, t: '…아빠 그걸 여태 말 안 했어?! 아니, 근데 그 문장 뒤에 한 줄 더 있어. 아주 작게.', e: 'angry' },
      { c: d, t: '「그리고 밤도 별을 잊지 않는다.」 …무슨 뜻일까.', e: 'worried' },
      { fx: { flag: 'pendant_full' } },
    ] },
    { fx: { v: { int: 4, fame: 4 }, flag: 'academy' } },
    { end: true },
  ]);

  SC.ev_maid_palace = byAge(d => [
    { bg: 'palace_hall' },
    '궁정 시녀 아르바이트 중, {s.dname}는 왕비의 찻잔을 나르게 되었다.',
    { show: d, e: 'worried', at: 'c' },
    '왕비는 찻잔을 받아 들고 그녀를 한참 바라보았다.',
    { c: d, t: '(속으로) 뭐, 뭐지. 차에 뭐 들어갔나. 머리카락? 고등어 털?', e: 'worried' },
    '「…마르타에게 배웠구나. 손목 각도가 그 사람 그대로야.」',
    { c: d, t: '할머니를 아세요?!', e: 'surprised' },
    '「내 시녀장이었지. 무서운 사람. 좋은 사람.」 왕비는 웃으며 금화 한 닢을 쥐여 주었다.',
    { bg: 'house_day' },
    { c: 'marta', t: '…왕비 마마께서? 에헴. 그 양반 아직도 차에 설탕 세 개 넣으시우?', e: 'shy' },
    { fx: { v: { grace: 3, fame: 2, money: 100 }, aff: { marta: 3 }, flag: 'queen_met' } },
    { end: true },
  ]);

  SC.ev_music_night = byAge(d => [
    { bg: 'sky_night' },
    '달밤. 창밖에서 노랫소리가 들렸다. {s.dname}가 지붕 위에서 노래하고 있었다.',
    { show: d, e: 'shy', at: 'c' },
    '아무도 가르쳐 준 적 없는 노래. 가사는 모르는 말이었다. 그런데 이상하게 슬프고, 따뜻했다.',
    { c: d, t: '아, 아빠. 들었어? …이거 어디서 배운 건지 모르겠어. 그냥 입에서 나와.', e: 'shy' },
    { if: { flag: 'heritage_known' }, then: [
      { c: 'morgan', t: '(다음 날) 흐음. 그건 아스트렐의 자장가입니다. 왕비 전하께서 매일 밤 부르시던.', e: 'sad' },
      { fx: { aff: { morgan: 2 } } },
    ] },
    { choice: [
      { t: '"한 번만 더 불러 줘."', fx: { aff: { daughter: 4 }, v: { sense: 3, charm: 1 } }, then: [
        '그녀는 다시 불렀다. 이번엔 당신을 위해서. 별들이 조금 더 가까이 내려온 것 같았다.',
      ] },
      { t: '같이 흥얼거린다. (음치다)', fx: { aff: { daughter: 3 }, v: { stress: -8 } }, then: [
        { c: d, t: '아빠… 그건 노래가 아니라 곰 울음소리야.', e: 'laugh' },
        { c: 'me', t: '가렌한테 배웠어.' },
      ] },
    ] },
    { fx: { flag: 'lullaby' } },
    { end: true },
  ]);

  SC.ev_farm_harvest = byAge(d => [
    { bg: 'farm' },
    '농장 아르바이트 마지막 날. 농장 할아버지가 {s.dname}에게 호박 하나를 안겨 주었다. 그녀 머리통만 한.',
    { show: d, e: 'laugh', at: 'c' },
    { c: d, t: '아빠! 이거 내가 키운 거야! 씨 뿌리고, 물 주고, 벌레 잡고!', e: 'laugh' },
    '「아가씨는 흙이랑 말이 통하는 손이야. 우리 농장 물려받을 생각 없나?」',
    { c: d, t: '할아버지, 그건 좀 생각해 볼게요. 근데 호박은 평생 키우고 싶어.', e: 'smile' },
    '그날 저녁, 마르타는 호박으로 수프와 파이와 전을 만들었다. 사흘 내내 호박이었다.',
    { fx: { v: { hp: 2, house: 1, stress: -4 }, flag: 'farm_love' } },
    { end: true },
  ]);

  // ===== 생일 =====
  SC.bday11 = [
    { bg: 'house_night' },
    { title: '2년차', sub: '{s.dname}, 열한 살' },
    '{s.dname}가 이 집에 온 지 꼭 일 년. 마르타는 이날을 생일로 하자고 했다.',
    { show: 'daughter', e: 'surprised', at: 'c' },
    { c: 'daughter', t: '생일? 내 생일? 나 생일 없는데.', e: 'surprised' },
    { c: 'marta', t: '있어요. 오늘이에요. 방금 생겼어요. 이름처럼.', e: 'smile' },
    '식탁 위에 케이크가 있었다. 모양은 좀 기울었다. 당신이 만든 것이었다.',
    { c: 'daughter', t: '이거… 아빠가 만든 거야? 왜 피사의 탑처럼 기울었어?', e: 'laugh' },
    { c: 'me', t: '전략적 비대칭.' },
    { c: 'daughter', t: '또 그 소리!', e: 'laugh' },
    { choice: [
      { t: '선물: 새 리본 (분홍색)', fx: { aff: { daughter: 4 }, v: { charm: 2 } }, then: [
        { c: 'daughter', t: '리본! 양쪽 다 똑같이 묶어 줄 수 있어? 비대칭 말고.', e: 'smile' },
      ] },
      { t: '선물: 그림책 「별자리 이야기」', fx: { aff: { daughter: 3 }, v: { int: 2, sense: 1 } }, then: [
        { c: 'daughter', t: '별자리! 이거 오늘 밤에 같이 읽어!', e: 'laugh' },
      ] },
      { t: '선물: 작은 나무 방패 (가렌 공방제)', fx: { aff: { daughter: 3, garen: 2 }, v: { combat: 2 } }, then: [
        { c: 'daughter', t: '방패다! 이걸로 고등어 막을 수 있어!', e: 'laugh' },
      ] },
    ] },
    { c: 'daughter', t: '아빠. 소원 빌어도 돼? 촛불 끄면서?', e: 'shy' },
    { c: 'daughter', t: '…내년에도 이 식탁에 있게 해 주세요.', e: 'shy' },
    { chat: 'daughter', goal: '딸의 첫 생일(입양 1주년). 일 년 동안의 추억과 소원 이야기를 나눈다.', max: 3 },
    { fx: { v: { stress: -10 } } },
    { end: true },
  ];

  SC.bday12 = [
    { bg: 'house_night' },
    { title: '3년차', sub: '{s.dname}, 열두 살' },
    { show: 'daughter', e: 'smirk', at: 'c' },
    { c: 'daughter', t: '아빠. 올해 케이크는 내가 만들었어. 아빠가 만들면 또 기울 거니까.', e: 'smirk' },
    '케이크는 반듯했다. 위에 초콜릿으로 「아빠 +1년 축하」라고 써 있었다.',
    { c: 'me', t: '…네 생일인데 왜 아빠 축하야?' },
    { c: 'daughter', t: '아빠가 된 지 2년 됐잖아. 그것도 생일이야.', e: 'smile' },
    { if: { flag: 'met_leo' }, then: [
      { c: 'leo', t: '(창문 밖에서) 생, 생일 축하해! 빵 놓고 갈게! 안녕!', e: 'shy' },
      { c: 'daughter', t: '…레오는 왜 맨날 도망가?', e: 'neutral' },
      { fx: { aff: { leo: 3 } } },
    ] },
    { if: { flag: 'met_cecilia' }, then: [
      '편지도 한 통 와 있었다. 향수 냄새가 진동했다. 「이건 예의상 보내는 거거든요. — C.」',
      { fx: { aff: { cecilia: 2 } } },
    ] },
    { choice: [
      { t: '선물: 은 머리핀', fx: { aff: { daughter: 3 }, v: { charm: 2, grace: 1 } }, then: [
        { c: 'daughter', t: '예쁘다… 세실리아 거보다 예뻐. 확실해.', e: 'smile' },
      ] },
      { t: '선물: 요리책 「마르타의 비밀 레시피」 (손글씨)', fx: { aff: { daughter: 3, marta: 3 }, v: { house: 3 } }, then: [
        { c: 'marta', t: '에헴. 다 가르쳐 주는 건 아니에요. 비법 세 개는 빼놨어요.', e: 'smirk' },
      ] },
      { t: '선물: 하루 종일 원하는 거 다 하기 쿠폰', fx: { aff: { daughter: 5 }, v: { stress: -6 } }, then: [
        { c: 'daughter', t: '그럼… 오늘 아빠 방에서 같이 자기. 무서운 얘기 해 주기. 그리고 아침에 팬케이크.', e: 'laugh' },
      ] },
    ] },
    { chat: 'daughter', goal: '딸의 열두 번째 생일. 학교생활, 친구, 올해 하고 싶은 일을 이야기한다.', max: 3 },
    { fx: { v: { stress: -10 } } },
    { end: true },
  ];

  SC.bday13 = [
    { bg: 'house_night' },
    { title: '4년차', sub: '{s.dname}, 열세 살' },
    { show: 'daughter', e: 'cold', at: 'c' },
    { c: 'daughter', t: '생일 파티? 애들 같아. 안 해.', e: 'cold' },
    { c: 'marta', t: '(작게) 도련님. 열세 살이 되면 다 저래요. 그래도 케이크는 먹어요.', e: 'smirk' },
    '당신은 케이크를 조용히 식탁에 올려 두고 거실로 나갔다.',
    '십 분 뒤. 부엌에서 포크 소리가 났다. 이십 분 뒤. 촛불 끄는 소리. 삼십 분 뒤.',
    { c: 'daughter', t: '…아빠. 케이크 반 남겨 뒀어. 같이 먹을래?', e: 'shy' },
    { choice: [
      { t: '"생일 축하해. 애들 같은 파티 없이."', fx: { aff: { daughter: 5 } }, then: [
        { c: 'daughter', t: '…고마워. 사실 좀 해 주길 바랐는데, 안 해 줘서 더 좋았어. 이상하지?', e: 'shy' },
      ] },
      { t: '선물: 일기장 (자물쇠 달린)', fx: { aff: { daughter: 4 }, v: { sense: 2, int: 1 } }, then: [
        { c: 'daughter', t: '열쇠 아빠가 갖고 있는 거 아니지? 확실해?', e: 'smirk' },
        { c: 'me', t: '예비 열쇠는 마르타 할머니한테.' },
        { c: 'daughter', t: '최악이야!', e: 'laugh' },
      ] },
    ] },
    { chat: 'daughter', goal: '사춘기에 접어든 딸의 열세 번째 생일. 쿨한 척하는 딸과 케이크를 나눠 먹으며 이야기한다.', max: 3 },
    { fx: { v: { stress: -8 } } },
    { end: true },
  ];

  SC.bday14 = [
    { bg: 'house_night' },
    { title: '5년차', sub: '{s.dname}, 열네 살' },
    '열네 살 생일 아침. 당신은 문득 깨달았다. 딸의 키가 어느새 당신 어깨에 닿아 있었다.',
    { show: 'daughter_teen', e: 'smile', at: 'c' },
    { c: 'daughter_teen', t: '아빠, 왜 그렇게 봐? 얼굴에 뭐 묻었어?', e: 'neutral' },
    { c: 'me', t: '…언제 이렇게 컸어?' },
    { c: 'daughter_teen', t: '아빠가 매달 계획표 짜는 동안. 흐흐.', e: 'smirk' },
    '문간에 기둥 하나가 있었다. 매년 생일마다 키를 새겨 온 기둥. 올해의 줄은 작년보다 손가락 세 마디 위였다.',
    { c: 'daughter_teen', t: '열 살 때 줄 봐. 이렇게 작았어? 나 완전 콩알이었네.', e: 'laugh' },
    { choice: [
      { t: '선물: 첫 드레스 (하늘색)', fx: { aff: { daughter: 4 }, v: { charm: 3, grace: 1 } }, then: [
        { c: 'daughter_teen', t: '…아빠가 골랐어? 진짜? 센스 뭐야. 마르타 할머니가 골랐지?', e: 'surprised' },
        { c: 'marta', t: '도련님이 사흘을 고민했수. 가게 주인이 도련님 얼굴 외웠다더군요.', e: 'laugh' },
      ] },
      { t: '선물: 진짜 연습용 검 (날 없는)', fx: { aff: { daughter: 4, garen: 2 }, v: { combat: 3 } }, then: [
        { c: 'daughter_teen', t: '나무 아니고 쇠야! 무거워! 좋아!', e: 'laugh' },
      ] },
      { t: '선물: 편지 한 장 (당신의 손글씨)', fx: { aff: { daughter: 6 }, v: { sense: 2 } }, then: [
        '「네가 온 뒤로 이 집에 처음으로 웃음소리가 생겼다. 고맙다. — 아빠」',
        { c: 'daughter_teen', t: '……이런 거 반칙이야. 생일에 울리면 어떡해.', e: 'cry' },
      ] },
    ] },
    { chat: 'daughter_teen', goal: '열네 살 생일. 훌쩍 자란 딸과 키 재기 기둥 앞에서 지난 네 해를 돌아본다.', max: 3 },
    { fx: { v: { stress: -10 } } },
    { end: true },
  ];

  SC.bday15 = [
    { bg: 'house_night' },
    { title: '6년차', sub: '{s.dname}, 열다섯 살' },
    { show: 'daughter_teen', e: 'laugh', at: 'c' },
    '올해 생일은 시끄러웠다. 집 안에 사람이 가득했다.',
    { if: { flag: 'met_garen' }, then: [
      { c: 'garen', t: '조카! 열다섯이라니! 내가 열다섯일 땐 곰이랑 씨름했지!', e: 'laugh' },
    ] },
    { if: { flag: 'met_cecilia' }, then: [
      { c: 'cecilia', t: '초대해서 온 거예요. 오고 싶어서 온 게 아니거든요. …케이크 한 조각 더 주세요.', e: 'shy' },
    ] },
    { if: { flag: 'met_leo' }, then: [
      { c: 'leo', t: '케, 케이크는 내가 구웠어. 열다섯 층. 한 살에 한 층.', e: 'shy' },
      { fx: { aff: { leo: 3 } } },
    ] },
    { if: { flag: 'met_lucas' }, then: [
      '문 앞에 「익명」으로 꽃다발이 와 있었다. 리본에 왕실 문장이 박혀 있었다.',
      { c: 'daughter_teen', t: '…익명 뜻을 모르나 봐, 그 바보.', e: 'shy' },
      { fx: { aff: { lucas: 3 } } },
    ] },
    { c: 'daughter_teen', t: '아빠. 우리 집에 이렇게 사람 많은 거 처음이다.', e: 'smile' },
    { c: 'me', t: '네가 모은 사람들이야.' },
    { c: 'daughter_teen', t: '…내가? 주워 온 애가?', e: 'surprised' },
    { c: 'me', t: '주워 온 애가 이 집을 가득 채웠네.' },
    { fx: { aff: { daughter: 5 }, v: { charm: 2, stress: -12 } } },
    { chat: 'daughter_teen', goal: '친구들로 북적이는 열다섯 살 생일 파티 뒤, 둘만 남은 부엌에서 설거지하며 이야기한다.', max: 3 },
    { end: true },
  ];

  SC.bday16 = [
    { bg: 'hill_sunset' },
    { title: '7년차', sub: '{s.dname}, 열여섯 살' },
    { show: 'daughter_teen', e: 'neutral', at: 'c' },
    '올해 생일엔 {s.dname}가 언덕에 가자고 했다. 처음 이 도시에 온 해에 둘이 노을을 봤던 그 언덕.',
    { c: 'daughter_teen', t: '아빠, 기억나? 여기서 내가 "나도 뭔가 지키는 사람이 될래" 했던 거.', e: 'smile' },
    { c: 'me', t: '기억나지. 그때 네 키가 이 풀만 했어.' },
    { c: 'daughter_teen', t: '거짓말. 그보단 컸어.', e: 'laugh' },
    { c: 'daughter_teen', t: '올해 선물은 내가 정할게. …아빠 이야기 해 줘. 용사 되기 전 이야기. 한 번도 안 해 줬잖아.', e: 'neutral' },
    { choice: [
      { t: '고향 마을과 대장간 이야기를 한다.', fx: { aff: { daughter: 6 }, v: { sense: 2 } }, then: [
        '당신은 이야기했다. 대장간의 불빛, 쇠 냄새, 동생들, 그리고 마왕군이 오던 날.',
        { c: 'daughter_teen', t: '…아빠도 나처럼 불타는 마을에서 왔구나.', e: 'cry' },
        { c: 'me', t: '그래서 너를 보자마자 알았어. 이 애는 내가 지켜야 한다고.' },
      ] },
      { t: '파티 동료들과의 바보 같은 모험담을 한다.', fx: { aff: { daughter: 5 }, v: { stress: -8 } }, then: [
        '가렌이 미믹 상자에 머리를 물린 이야기, 엘레나가 오우거를 메이스로 설교한 이야기.',
        { c: 'daughter_teen', t: '크하하! 엘레나 수녀님이?! 다음에 만나면 물어봐야지!', e: 'laugh' },
      ] },
    ] },
    { chat: 'daughter_teen', goal: '열여섯 생일, 노을 진 언덕 위. 딸이 선물 대신 아빠의 옛날 이야기를 청한다.', max: 4 },
    { fx: { v: { stress: -10 } } },
    { end: true },
  ];

  SC.bday17 = [
    { bg: 'house_night' },
    { title: '8년차', sub: '{s.dname}, 열일곱 살' },
    { show: 'daughter_adult', e: 'smile', at: 'c' },
    '마지막 생일. 내년 이맘때면 성년식이다.',
    { c: 'daughter_adult', t: '아빠. 올해는 내가 아빠한테 선물할게.', e: 'smile' },
    '그녀가 내민 것은 낡은 망토였다. 처음 만난 날, 당신이 둘러 준 그 망토. 해진 곳마다 촘촘히 기워져 있었다.',
    { c: 'daughter_adult', t: '칠 년 동안 내 이불이었어. 이제 돌려줄게. 아빠 어깨가 추워 보여서.', e: 'shy' },
    { c: 'me', t: '…….' },
    { c: 'daughter_adult', t: '울면 안 돼. 생일은 내 건데 아빠가 울면 주인공 뺏기는 거야.', e: 'laugh' },
    { choice: [
      { t: '망토를 다시 그녀 어깨에 둘러 준다. "이건 네 거야. 평생."', fx: { aff: { daughter: 7 } }, then: [
        { c: 'daughter_adult', t: '……반칙이야. 진짜 반칙이야, 아빠.', e: 'cry' },
      ] },
      { t: '망토를 받아 두른다. "따뜻하다. 네 냄새가 나."', fx: { aff: { daughter: 6 }, v: { sense: 2 } }, then: [
        { c: 'daughter_adult', t: '당연하지. 칠 년 동안 코 묻혔는걸.', e: 'laugh' },
      ] },
    ] },
    { chat: 'daughter_adult', goal: '열일곱, 마지막 생일. 딸이 칠 년 전의 망토를 돌려준다. 곧 떠날 딸과 추억을 나눈다.', max: 4 },
    { fx: { v: { stress: -12 } } },
    { end: true },
  ];

  // ===== 수확제 (매년 가을, 나이별 생성) =====
  const FEST_INTRO = {
    10: ['첫 수확제. {s.dname}는 등불 하나하나에 탄성을 질렀다.', { c: 'daughter', t: '아빠! 사람이 이렇게 많아! 전부 축제야? 전부?', e: 'laugh' }],
    11: ['두 번째 수확제. 올해 {s.dname}는 참가 신청서를 쥐고 있었다.', { c: 'daughter', t: '올해는 구경만 안 할 거야. 나도 나갈래!', e: 'smirk' }],
    12: ['세 번째 수확제. 광장 한가운데 거대한 호박 조형물이 세워졌다.', { c: 'daughter', t: '저 호박, 작년보다 커졌어. 호박도 크는구나.', e: 'surprised' }],
    13: ['네 번째 수확제. {s.dname}는 친구들과 먼저 나가겠다며 앞장섰다.', { c: 'daughter', t: '아빠는 좀 떨어져서 와. …너무 멀리는 말고.', e: 'shy' }],
    14: ['다섯 번째 수확제. 올해부터 {s.dname}는 성인부 예선에 나갈 수 있었다.', { c: 'daughter_teen', t: '올해 상대들 장난 아니래. 그래서 더 좋아.', e: 'smirk' }],
    15: ['여섯 번째 수확제. 사람들이 {s.dname}의 이름을 알아보고 수군거렸다.', { c: 'daughter_teen', t: '다들 쳐다봐. 떨려… 아니, 안 떨려. 조금 떨려.', e: 'worried' }],
    16: ['일곱 번째 수확제. 광장의 등불이 유난히 많았다. 지난 겨울 습격 이후 처음 맞는 큰 축제였다.', { c: 'daughter_teen', t: '올해는 꼭 웃는 축제로 만들 거야. 다들 무서웠잖아.', e: 'smile' }],
    17: ['여덟 번째, 마지막 수확제. 내년엔 {s.dname}가 성인으로 이 축제를 맞는다.', { c: 'daughter_adult', t: '아빠. 마지막이니까 제대로 즐기자. 우리 둘 다.', e: 'smile' }],
  };

  const festival = age => {
    const d = D(age);
    const thr = 22 + 8 * (age - 10), sub = thr - 12;
    const prize = 100 * (age - 8), fame = 3 + (age - 10);
    const win = (flag, lines) => [...lines, { toast: '우승! 상금 ' + prize + 'G' }, { fx: { v: { money: prize, fame: fame, stress: -5 }, aff: { daughter: 3 }, flag: flag } }];
    const second = lines => [...lines, { fx: { v: { money: Math.floor(prize / 3), fame: 1 }, aff: { daughter: 1 } } }];
    const lose = lines => [...lines, { fx: { v: { stress: 4 } } }];
    const rival = age >= 11 ? [{ if: { flag: 'met_cecilia' }, then: [{ c: 'cecilia', t: age < 14 ? '흥. 올해는 제가 이길 거거든요!' : '이번엔 전력이에요. 봐주면 용서 안 해요.', e: 'smirk' }] }] : [];
    const opts = [
      { t: '무술 대회에 나간다', then: [
        { bg: 'field_training' },
        '수확제 무술 대회. 나무 울타리 안의 모래판, 둘러싼 함성.',
        { c: 'garen', t: age < 13 ? '유소년부 심판은 이 가렌이다! 공정하게! …조카 힘내라!' : '올해부터는 봐주기 없다! 공정하게! …조카 힘내라!', e: 'laugh' },
        { if: { all: [{ v: { combat: '>=' + thr } }, { v: { str: '>=' + Math.max(10, thr - 20) } }] }, then: win('won_combat', [
          '결승. 상대의 목검이 떨어지는 소리가 광장에 울렸다.',
          { c: d, t: '아빠! 봤어?! 나 이겼어!', e: 'laugh' },
          { c: 'garen', t: '우승, {s.dname}! 크흡… 형님, 나 또 운다.', e: 'cry' },
        ]), else: [{ if: { v: { combat: '>=' + sub } }, then: second([
          '준결승까지 올랐지만, 한 끗 차이로 졌다.',
          { c: d, t: '…아까 그 발놀림, 한 발만 더 넣었으면 됐는데.', e: 'angry' },
          { c: 'me', t: '그걸 알았으면 내년엔 이긴다.' },
        ]), else: lose([
          '첫 경기에서 모래판에 엉덩방아를 찧었다. 관중석에서 웃음이 터졌다.',
          { c: d, t: '……웃지 마, 아빠.', e: 'cry' },
          { c: 'me', t: '안 웃었어. 박수 쳤어.' },
        ]) }] },
      ] },
      { t: '미술전에 출품한다', then: [
        { bg: 'festival' },
        '광장 회랑에 그림들이 걸렸다. {s.dname}의 그림은 「' + ['우리 집 고양이', '눈의 용사', '노을 언덕', '빗소리', '키 재기 기둥', '별을 세는 아이들', '밤이 걷힌 광장', '망토'][age - 10] + '」.',
        ...rival,
        { if: { v: { sense: '>=' + thr } }, then: win('won_art', [
          '심사위원장이 그녀의 그림 앞에서 오래 멈춰 섰다. 금색 리본이 달렸다.',
          { c: d, t: '금색이다… 아빠, 저거 금색 맞지? 노란색 아니지?', e: 'surprised' },
        ]), else: [{ if: { v: { sense: '>=' + sub } }, then: second([
          '은색 리본. 관람객 몇몇이 그림 앞에서 미소 지었다.',
          { c: d, t: '은색도 예쁘네. 금색보다 겸손해 보이고.', e: 'smile' },
        ]), else: lose([
          '그림 앞에 선 사람은 거의 없었다. 고양이 한 마리가 그 앞에서 낮잠을 잤다.',
          { c: d, t: '…고양이한텐 인기 있네.', e: 'sad' },
        ]) }] },
      ] },
      { t: '요리 대회에 나간다', then: [
        { bg: 'festival' },
        '요리 대회. 주제는 「가을」. {s.dname}는 앞치마를 질끈 동여맸다.',
        { if: { v: { house: '>=' + thr } }, then: win('won_cook', [
          '심사위원 세 명이 동시에 숟가락을 내려놓았다. 그리고 동시에 한 그릇 더를 외쳤다.',
          { c: 'marta', t: '(관중석에서) 에헴! 내가 가르쳤수! 내가!', e: 'laugh' },
        ]), else: [{ if: { v: { house: '>=' + sub } }, then: second([
          '준우승. "간이 조금 아쉽지만 정성이 느껴진다"는 평.',
          { c: d, t: '간… 마르타 할머니가 소금 줄이라고 해서 줄였는데.', e: 'angry' },
        ]), else: lose([
          '냄비에서 연기가 났다. 검은 연기. 심사위원이 조용히 물을 마셨다.',
          { c: d, t: '…당근을 넣어서 그래. 당근이 범인이야.', e: 'cry' },
        ]) }] },
      ] },
      { t: '가을 무도회에 나간다', req: { age: '>=12' }, hint: '열두 살부터 참가할 수 있다', then: [
        { bg: 'ballroom' },
        '광장에 세운 야외 무도회장. 등불 아래서 춤 경연이 열렸다.',
        ...rival,
        { if: { all: [{ v: { grace: '>=' + thr } }, { v: { charm: '>=' + Math.max(10, thr - 10) } }] }, then: win('won_ball', [
          '음악이 멈췄을 때, 모든 시선이 {s.dname}에게 있었다. 박수가 쏟아졌다.',
          { if: { flag: 'met_lucas' }, then: [{ c: 'lucas', t: '(관중석에서) …저게 내 꼬치 빚쟁이야. 멋지지.', e: 'smile' }] },
        ]), else: [{ if: { v: { grace: '>=' + sub } }, then: second([
          '준우승. 우아했지만, 마지막 회전에서 살짝 비틀거렸다.',
          { c: d, t: '그 한 바퀴만 아니었으면….', e: 'angry' },
        ]), else: lose([
          '파트너의 발을 세 번 밟았다. 파트너는 절뚝이며 퇴장했다.',
          { c: d, t: '…다음엔 파트너한테 철 구두 신으라고 할게.', e: 'tired' },
        ]) }] },
      ] },
      { t: '마법 시연회에 나간다', req: { age: '>=13' }, hint: '열세 살부터 참가할 수 있다', then: [
        { bg: 'sky_night' },
        '밤하늘을 무대로 한 마법 시연회. 참가자들이 불꽃과 빛을 쏘아 올렸다.',
        { if: { v: { magic: '>=' + thr } }, then: win('won_magic', [
          '{s.dname}가 손을 들자, 하늘에 여덟 꼭지 별이 피어났다. 광장 전체가 숨을 멈췄다.',
          { c: 'morgan', t: '(군중 속에서) …흐음. 아름답군요. 정말로.', e: 'cry' },
        ]), else: [{ if: { v: { magic: '>=' + sub } }, then: second([
          '예쁜 불꽃 몇 송이. 박수가 나왔다. 준우승.',
        ]), else: lose([
          '불꽃이 옆으로 튀어 심사위원 모자를 태웠다.',
          { c: d, t: '…모자가 가을 느낌 나게 됐네요?', e: 'worried' },
        ]) }] },
      ] },
      { t: '노래 경연에 나간다', then: [
        { bg: 'festival' },
        '광장 무대. 류트 반주에 맞춰 노래 경연이 열렸다.',
        { if: { all: [{ v: { sense: '>=' + (thr - 5) } }, { v: { charm: '>=' + Math.max(10, thr - 10) } }] }, then: win('won_song', [
          '{s.dname}의 목소리가 광장에 퍼지자, 떠들던 사람들이 하나둘 입을 다물었다.',
          { c: d, t: '(노래를 마치고) …아빠 울어? 또?', e: 'smirk' },
        ]), else: [{ if: { v: { sense: '>=' + sub } }, then: second([
          '고음에서 살짝 흔들렸지만, 박수는 컸다. 준우승.',
        ]), else: lose([
          '긴장해서 가사를 잊었다. 대신 "라라라"로 끝까지 불렀다. 관객 몇이 따라 불렀다.',
          { c: d, t: '…라라라도 노래야. 그렇지?', e: 'shy' },
        ]) }] },
      ] },
      { t: '대회는 쉬고, 딸과 축제를 즐긴다', fx: { v: { stress: -12 }, aff: { daughter: 4 } }, then: [
        { bg: 'festival' },
        '둘은 사과 사탕을 사고, 공 던지기를 하고, 등불 아래를 천천히 걸었다.',
        { chat: d, goal: age + '살 가을 수확제. 대회 대신 딸과 둘이 축제를 거닐며 이야기한다.', max: 3 },
      ] },
    ];
    return [
      { bg: 'festival' },
      { title: '수확제', sub: '왕국력 ' + (age - 9) + '년의 가을' },
      ...FEST_INTRO[age].map(x => (typeof x === 'string' ? x : Object.assign({}, x))),
      { choice: opts, prompt: '올해 수확제, 어디에 나갈까?' },
      { bg: 'sky_night' },
      '축제의 마지막 불꽃이 하늘에 올랐다.',
      { c: d, t: age < 14 ? '아빠, 내년에도 오자. 약속!' : age < 17 ? '내년엔 더 잘할 거야. 두고 봐.' : '마지막 수확제… 아빠랑 와서 다행이다.', e: 'smile' },
      { end: true },
    ];
  };
  for (let a = 10; a <= 17; a++) SC['festival' + a] = festival(a);

  // ===== 겨울 이벤트 (새해) =====
  SC.ev_newyear = byAge(d => [
    { bg: 'sky_night' },
    '새해 전야. 대성당 종이 자정을 알렸다.',
    { show: d, e: 'smile', at: 'c' },
    { c: d, t: '아빠, 새해 소원 뭐 빌었어?', e: 'smile' },
    { choice: [
      { t: '"네가 올해도 많이 웃는 거."', fx: { aff: { daughter: 3 }, v: { stress: -5 } }, then: [
        { c: d, t: '그건 아빠가 웃겨 줘야 가능한 건데. 책임져.', e: 'laugh' },
      ] },
      { t: '"비밀. 말하면 안 이뤄진대."', fx: { aff: { daughter: 2 }, v: { sense: 1 } }, then: [
        { c: d, t: '치사해. 그럼 나도 비밀. …아빠 무릎 안 아프게 해 달라고 빈 거 아니야.', e: 'smirk' },
      ] },
    ] },
    { end: true },
  ]);

  // ===== 피날레: 성년식 =====
  SC.finale = [
    { bg: 'black' },
    { title: '성년식', sub: '{s.dname}, 열여덟 살' },
    '여덟 번의 봄이 지나갔다.',
    '당근을 싫어하던 아이는, 오늘 대성당에서 성년의 서약을 한다.',
    { bg: 'house_day' },
    { c: 'marta', t: '도련님. 넥타이가 삐뚤어요. 이리 와요. …칠 년 동안 한 번을 제대로 못 매시네.', e: 'cold' },
    { c: 'marta', t: '에헴. 오늘은 울어도 되는 날이에요. 이 할미도 오늘만은 양파 핑계 안 댈 거고.', e: 'cry' },
    { show: 'daughter_adult', e: 'shy', at: 'c' },
    '계단 위에서 {s.dname}가 내려왔다. 하얀 성년 예복. 은빛 연보라 머리카락 위에 작은 별 머리핀.',
    '처음 만난 날, 제 몸보다 큰 망토를 뒤집어쓰고 끈 풀린 신발을 신고 있던 아이.',
    { c: 'daughter_adult', t: '…아빠. 어때? 이상해?', e: 'shy' },
    { c: 'me', t: '…….' },
    { c: 'daughter_adult', t: '또 말이 없네. 또 전원 벨까 고민 중이야?', e: 'laugh' },
    { c: 'me', t: '아니. 이번엔… 그냥 보고 있었어. 오래 보고 싶어서.' },
    { c: 'daughter_adult', t: '……아빠. 식 시작도 안 했는데 울리지 마.', e: 'cry' },
    { bg: 'chapel' },
    '대성당. 종소리. 가득 찬 자리.',
    { if: { flag: 'met_garen' }, then: [{ c: 'garen', t: '(맨 앞줄에서 손수건 세 장째) 크흡… 조카가… 우리 조카가….', e: 'cry' }] },
    { if: { flag: 'met_cecilia' }, then: [{ c: 'cecilia', t: '(옆자리에서) 흥, 오늘은 제가 이등 해 드리죠. 오늘만. …축하해요, 친구.', e: 'shy' }] },
    { if: { flag: 'met_leo' }, then: [{ c: 'leo', t: '(뒷줄에서 빵 바구니를 꼭 끌어안고) …예쁘다. 진짜 예쁘다.', e: 'shy' }] },
    { if: { flag: 'met_lucas' }, then: [{ c: 'lucas', t: '(귀빈석에서, 왕자답지 않게 몸을 내밀고) …약속한 날이다.', e: 'neutral' }] },
    { if: { flag: 'met_elena' }, then: [{ c: 'elena', t: '주님 보시기에… 아니, 제가 보기에도. 참 잘 자랐어요.', e: 'smile' }] },
    { if: { flag: 'met_morgan' }, then: [{ c: 'morgan', t: '(기둥 그늘에서, 사탕을 문 채) 흐음. 왕비 전하, 보고 계십니까.', e: 'cry' }] },
    { show: 'elena', e: 'smile', at: 'r' },
    { c: 'elena', t: '{s.dname}. 이제 당신은 누구의 아이도 아닌, 스스로의 이름으로 서는 어른입니다.', e: 'smile' },
    { c: 'elena', t: '서약 전에, 당신을 키운 이에게 한마디 하겠어요?', e: 'neutral' },
    { hide: 'elena' },
    { show: 'daughter_adult', e: 'neutral', at: 'c' },
    { c: 'daughter_adult', t: '…아빠. 앞으로 나와 줘.', e: 'neutral' },
    '당신은 제단 앞으로 걸어 나갔다. 마왕의 옥좌 앞으로 걸어가던 그날보다 다리가 떨렸다.',
    { c: 'daughter_adult', t: '여덟 해 전에, 나는 아빠한테 "나 안 버려?"라고 물었어.', e: 'sad' },
    { c: 'daughter_adult', t: '오늘은 내가 대답할게. 아빠, 나도 아빠 안 버려. 어디를 가도. 뭐가 되어도.', e: 'cry' },
    { chat: 'daughter_adult', goal: '성년식 제단 앞. 여덟 해를 함께한 딸에게, 어른이 되는 오늘 아빠로서 마지막으로(그리고 처음으로) 진심을 전한다. 딸은 자신이 가려는 길과 아빠에 대한 고마움을 이야기한다.', max: 5 },
    { if: { aff: { daughter: '>=80' } }, then: [
      { c: 'daughter_adult', t: '아빠. 하나만 부탁할게. 서약할 때 내 손 잡아 줘. 처음 새끼손가락 걸었던 것처럼.', e: 'smile' },
      '당신은 딸의 손을 잡았다. 칼을 쥐던 손으로, 이제는 자기보다 조금 작을 뿐인 손을.',
    ], else: [
      { if: { aff: { daughter: '>=40' } }, then: [
        { c: 'daughter_adult', t: '…고마웠어, 아빠. 말로 잘 못 했지만.', e: 'shy' },
      ], else: [
        { c: 'daughter_adult', t: '…우리, 좀 더 얘기 많이 할걸 그랬나 봐. 그래도 키워 줘서 고마워.', e: 'sad' },
      ] },
    ] },

    // --- 운명의 갈림길 ---
    { if: { flag: 'heritage_known' }, then: [
      { bg: 'sky_night', fx: 'flash' },
      '서약의 순간. 대성당 스테인드글라스가 한꺼번에 어두워졌다.',
      '하늘의 별이 흔들렸다. 봉인이 가장 약해지는 날. 마족들의 마지막 의식.',
      { show: 'morgan', e: 'worried', at: 'r' },
      { c: 'morgan', t: '전하! 봉인이 흔들립니다! 지금 전하의 피가 깨어나고 있어요!', e: 'worried' },
      { c: 'morgan', t: '어느 쪽으로든 흘러갈 겁니다. 왕관으로, 봉인으로, 혹은… 밤으로.', e: 'cold' },
      { if: { flag: 'darius_pact' }, then: [
        { show: 'darius', e: 'neutral', at: 'l' },
        { c: 'darius', t: '…{s.dname}. 약속한 날이야. 손을 잡아. 그러면 밤은 너를 따를 거야.', e: 'neutral' },
      ] },
      { show: 'daughter_adult', e: 'worried', at: 'c' },
      { c: 'daughter_adult', t: '아빠. …아빠가 골라 줘. 아니, 아빠 생각을 말해 줘. 마지막 한 조각이야.', e: 'worried' },
      { choice: [
        { t: '"아스트렐의 왕관을 써라. 네 사람들이 기다리고 있어."', req: { all: [{ v: { grace: '>=55' } }, { v: { int: '>=50' } }] }, hint: '기품 55, 지능 50 이상이어야 왕관의 무게를 견딜 수 있다', fx: { flag: 'claim_throne' }, then: [
          { c: 'daughter_adult', t: '…나라를 다시 세운다. 아빠가 나를 키운 것처럼, 이번엔 내가 누군가를 키울 차례구나.', e: 'neutral' },
          '펜던트가 부서지며 빛의 관이 되었다. 여덟 꼭지 별이 그녀의 이마 위에서 빛났다.',
        ] },
        { t: '"별의 힘으로 봉인을 완성하자. 다시는 아무도 불타지 않게."', req: { all: [{ v: { faith: '>=50' } }, { v: { magic: '>=50' } }] }, hint: '신앙 50, 마력 50 이상이 필요하다', fx: { flag: 'star_seal' }, then: [
          { c: 'daughter_adult', t: '응. 내가 그 불 속에서 살아남은 이유가 이거였나 봐.', e: 'smile' },
          '그녀가 두 손을 하늘로 들었다. 수천 개의 별이 대성당 천장을 뚫고 내려와, 북쪽 하늘의 봉인에 쏟아졌다.',
        ] },
        { t: '(다리우스의 손을 잡으려는 딸을, 보내 준다)', if: { flag: 'darius_pact' }, fx: { flag: 'night_crown' }, then: [
          { c: 'daughter_adult', t: '…고마워, 아빠. 미안해. 밤이 더는 아무도 해치지 않게, 내가 그 위에 앉을게.', e: 'cry' },
          { c: 'darius', t: '…용사. 약속하지. 이 여자는 내가 목숨 걸고 지킨다.', e: 'cold' },
        ] },
        { t: '"왕관도, 봉인도, 밤도 필요 없어. 너는 그냥 너로 살아."', fx: { flag: 'stay_free', aff: { daughter: 3 } }, then: [
          { c: 'daughter_adult', t: '…그 말 기다렸어. 평생.', e: 'cry' },
          '그녀가 펜던트를 쥐자 흔들리던 별들이 조용히 제자리를 찾았다. 봉인은 버텼다. 그녀가 아닌, 그녀가 사랑한 모든 사람들의 이름으로.',
          { if: { flag: 'darius_pact' }, then: [
            { c: 'darius', t: '……하. 역시 너희 부녀는 구제 불능이야.', e: 'smile' },
            { fx: { unflag: 'darius_pact' } },
          ] },
        ] },
      ] },
    ] },

    // --- 고백의 답 ---
    { if: { all: [{ flag: 'lucas_confess' }, { aff: { lucas: '>=60' } }] }, then: [
      { bg: 'balcony_night' },
      { show: 'lucas', e: 'shy', at: 'r' },
      { c: 'lucas', t: '약속한 날이야. 대답 들으러 왔어. …꼬치 빚, 평생 갚게 해 줄래?', e: 'shy' },
      { show: 'daughter_adult', e: 'shy', at: 'l' },
      { choice: [
        { t: '(딸의 등을 살짝 민다)', fx: { flag: 'lucas_promise', aff: { lucas: 5 } }, then: [
          { c: 'daughter_adult', t: '…이자 계산 똑바로 해. 루카스.', e: 'smile' },
          { c: 'lucas', t: '「그리고」 없이 불러 줬다. 됐다. 그걸로 됐어.', e: 'cry' },
        ] },
        { t: '(딸의 선택을 조용히 기다린다)', then: [
          { if: { aff: { lucas: '>=75' } }, then: [
            { c: 'daughter_adult', t: '…응. 평생 받아 낼 거야.', e: 'smile' },
            { fx: { flag: 'lucas_promise' } },
          ], else: [
            { c: 'daughter_adult', t: '루카스. 고마워. 근데 나, 아직 내 길을 먼저 가 보고 싶어.', e: 'sad' },
            { c: 'lucas', t: '…알았어. 기다리는 거, 나 잘해. 왕자는 원래 기다리는 직업이거든.', e: 'smile' },
          ] },
        ] },
      ] },
    ] },
    { if: { all: [{ flag: 'leo_confess' }, { aff: { leo: '>=60' } }, { noflag: 'lucas_promise' }] }, then: [
      { bg: 'town_square' },
      '식이 끝난 뒤. 빵집 앞. 레오가 별 모양 빵 하나를 들고 서 있었다.',
      { c: 'leo', t: '그, 그러니까… 성년 축하해. 그리고… 평생 네 아침, 구워도 돼?', e: 'shy' },
      { c: 'daughter_adult', t: '…바보. 그걸 이제 물어?', e: 'cry' },
      { fx: { flag: 'leo_promise' } },
    ] },

    { bg: 'hill_sunset' },
    '그날 저녁. 부녀는 언덕에 올랐다. 여덟 해 전처럼.',
    { show: 'daughter_adult', e: 'smile', at: 'c' },
    { c: 'daughter_adult', t: '아빠. 이 도시는 아빠가 지킨 거지.', e: 'smile' },
    { c: 'me', t: '그리고 너는, 아빠가 지킨 것 중에 제일 빛나는 거고.' },
    { c: 'daughter_adult', t: '……그거 내 소설 대사잖아. 표절이야.', e: 'laugh' },
    { c: 'daughter_adult', t: '…그래도 들으니까 좋다. 한 번 더 해 줘.', e: 'cry' },
    '노을이 두 사람을 하나의 그림자로 만들었다.',
    { ending: 'auto' },
  ];

  // ---------- 엔딩 ----------
  const endings = {
    runaway: { title: '가출 — 북쪽 길 위에서', rank: 'D', bg: 'castle_gate', c: 'daughter_teen', e: 'cold',
      t: '{s.dname}는 끝내 돌아오지 않았다. 북쪽 길에서 그녀를 봤다는 소문만 가끔 들려왔다. 떠돌이 용병단과 함께였다고도, 혼자였다고도 했다. 당신은 매일 밤 촛불 하나를 켜 두었다. 처음 만난 날처럼. 언젠가 그 불빛을 보고 누군가 문을 두드릴 거라 믿으며.' },
    demon_queen: { title: '밤의 여왕', rank: 'S', bg: 'throne_room', c: 'daughter_adult', e: 'cold',
      t: '{s.dname}는 밤의 왕관을 썼다. 마족들은 새 여왕 앞에 무릎을 꿇었고, 그녀의 첫 칙령은 「인간 땅을 넘보지 말 것」이었다. 다리우스는 그녀의 그림자가 되어 곁을 지켰다. 사람들은 그녀를 마왕이라 불렀지만, 그 마왕의 시대에 국경에서 불타는 마을은 하나도 없었다. 매년 수확제 밤이면, 용사의 집 창문 앞에 검은 깃털 한 장과 호두 크림빵이 놓였다.' },
    star_maiden: { title: '별의 무녀 — 숨겨진 혈통', rank: 'S', bg: 'sky_night', c: 'daughter_adult', e: 'smile',
      t: '아스트렐의 마지막 핏줄은 별의 힘으로 마왕의 봉인을 영원히 완성했다. 그날 이후 북쪽 하늘에는 새 별자리가 떴다. 사람들은 그것을 「용사의 딸자리」라 불렀다. 그녀는 대성당 첨탑의 천문대에서 별을 읽으며, 다시는 아무도 불타지 않도록 밤을 지킨다. 한 달에 한 번은 반드시 집에 내려와, 아빠가 기울게 만든 케이크를 먹는다.' },
    queen: { title: '아스트렐의 여왕', rank: 'S', bg: 'throne_room', c: 'daughter_adult', e: 'smile',
      t: '세레스티아 아스트렐 — 아니, {s.dname} 여왕은 북쪽 폐허 위에 별의 왕국을 다시 세웠다. 불탄 마을의 고아들이 첫 백성이 되었고, 성벽보다 학교가 먼저 지어졌다. 즉위식 날 그녀는 왕관 대신 낡은 망토를 두르고 나타났다. "내 아버지의 것입니다. 이 나라는 이 망토처럼, 누구든 따뜻하게 덮어 줄 겁니다." 왕좌 옆에는 늘 빈 의자 하나가 있다. 용사가 찾아오면 앉는 자리.' },
    crown_princess: { title: '왕자비', rank: 'A', bg: 'palace_hall', c: 'daughter_adult', e: 'shy',
      t: '{s.dname}는 제2왕자 루카스와 혼인했다. 결혼식 날, 신랑은 서약 대신 꼬치 백 개가 든 상자를 내밀었고, 하객들은 영문을 몰라 웃었다. 왕자비가 된 그녀는 고아원과 학당을 세우는 데 온 힘을 쏟았다. 루카스는 더 이상 누구의 「그리고」가 아니었다. 그녀의 남편이자, 가장 든든한 편이었으니까. 장인어른은 매주 궁에 와서 사위와 검술 「연습」을 한다. 사위는 매주 멍이 든다.' },
    general: { title: '왕국군 대장군', rank: 'S', bg: 'castle_gate', c: 'daughter_adult', e: 'cold',
      t: '무예와 지략을 모두 갖춘 {s.dname}는 스물다섯에 왕국군 대장군에 올랐다. 그녀가 지휘한 국경은 단 한 번도 뚫리지 않았다. 병사들은 그녀를 「별의 장군」이라 부르며 따랐다. 출정 전날 밤이면 그녀는 꼭 집에 들러 아빠의 무릎에 약을 발라 주고 간다. "용사님도 늙으시네." "장군님도 잔소리가 늘었네."' },
    knight_commander: { title: '기사단장', rank: 'A', bg: 'field_training', c: 'daughter_adult', e: 'smile',
      t: '견습 기사로 시작한 {s.dname}는 십 년 만에 왕국 기사단장이 되었다. 은퇴한 가렌은 취임식에서 방패를 넘겨주며 엉엉 울었다. 그녀의 기사단 신조는 하나였다. 「지켜야 할 사람의 이름을 기억하라.」 신입 기사들은 첫날 모두 가족의 이름을 방패 안쪽에 새긴다. 그녀의 방패 안쪽에는 한 글자, 「아빠」.' },
    archsage: { title: '대현자', rank: 'S', bg: 'library', c: 'daughter_adult', e: 'smirk',
      t: '{s.dname}는 왕립 아카데미 역사상 최연소 대현자가 되었다. 그녀가 해독한 아스트렐 별자리 문자는 잃어버린 마법 체계를 되살렸다. 모르간은 그녀의 연구실에 사탕을 몰래 채워 넣는 게 낙이 되었다. 강연 때마다 그녀는 첫 문장을 똑같이 시작한다. "제 아버지는 계란을 검으로 깨는 분이었습니다. 저는 그 계란이 왜 깨지는지 궁금했습니다."' },
    court_mage: { title: '궁정 마법사', rank: 'A', bg: 'mage_tower', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 에렌시아의 궁정 마법사가 되었다. 그녀가 밤하늘에 쏘아 올리는 별불꽃은 수확제의 명물이 되었다. 모르간은 스승 자리를 내주고 「제자의 조수」라는 명함을 새로 팠다. 왕도의 아이들은 밤마다 탑 꼭대기의 불빛을 보며 잠든다. 그 불빛이 꺼진 적은 한 번도 없다. 그녀는 어둠을 무서워하는 아이의 마음을 누구보다 잘 알았으니까.' },
    saint: { title: '별의 성녀', rank: 'A', bg: 'church', c: 'daughter_adult', e: 'smile',
      t: '역병의 밤에 기적을 일으킨 {s.dname}는 대성당의 성녀로 추대되었다. 그녀는 화려한 제단 대신 고아원과 빈민가 진료소를 지켰다. 엘레나 수녀는 그녀의 첫 번째 제자이자 경호원이 되었다(메이스 지참). 사람들은 성녀님의 손이 따뜻하다고 말한다. 그녀는 웃으며 답한다. "아빠가 매일 잡아 줘서 그래요."' },
    bandit_queen: { title: '도적 두목', rank: 'C', bg: 'forest', c: 'daughter_adult', e: 'smirk',
      t: '{s.dname}는 동쪽 숲의 도적단을 접수했다. 부하들은 그녀를 「두목」이라 불렀고, 탐관오리들은 그녀의 이름만 들어도 떨었다. 그녀는 부자의 금고만 털었고, 고아원 문 앞에는 늘 금화 자루가 놓였다. 현상금 전단의 초상화는 이상하게 잘 그려져 있었다. 누군가 매번 그 전단을 몰래 떼어 가 액자에 넣는다는 소문이 있다. 은퇴한 용사라나.' },
    madam: { title: '주점 마담', rank: 'C', bg: 'tavern', c: 'daughter_adult', e: 'smirk',
      t: '{s.dname}는 뒷골목 주점 「취한 그리핀」을 인수했다. 그녀의 주점에서는 싸움이 나지 않는다. 한 번 났을 때 마담이 손목 하나로 용병 셋을 창밖으로 던졌기 때문이다. 왕도의 온갖 소문과 비밀이 그녀의 카운터 위를 지나간다. 구석 자리에는 늘 「예약석」 팻말이 붙어 있다. 우유 한 잔을 여섯 시간 동안 마시는 단골을 위한 자리.' },
    bounty_hunter: { title: '현상금 사냥꾼', rank: 'B', bg: 'town_market', c: 'daughter_adult', e: 'cold',
      t: '{s.dname}는 왕국 최고의 현상금 사냥꾼이 되었다. 「별의 사냥꾼」이 쫓으면 도망칠 곳이 없다는 말이 돌았다. 그녀는 절대 목표를 죽이지 않고, 반드시 재판정에 세운다. 그게 아빠와의 유일한 약속이었다. 현상금의 절반은 매번 어디론가 사라진다. 불탄 국경 마을을 다시 짓는 데 쓰인다는 걸 아는 사람은 몇 없다.' },
    adventurer: { title: '전설의 모험가', rank: 'A', bg: 'sky_day', c: 'daughter_adult', e: 'laugh',
      t: '{s.dname}는 배낭 하나 메고 세상 끝으로 떠났다. 용과 협상하고, 사막의 유적을 깨우고, 바다 괴물에게 이름을 지어 주었다. 그녀의 모험담은 음유시인들의 단골 소재가 되었다. 그리고 모든 편지의 마지막 줄은 같았다. 「아빠, 이번 용은 입 냄새가 스무 배였어. 곧 갈게.」 그녀는 정말로, 늘 돌아왔다.' },
    scholar: { title: '왕립 학자', rank: 'B', bg: 'library', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 왕립 아카데미의 학자가 되었다. 전공은 왕국사. 레오폴트 1세부터 4세까지 헷갈리지 않는 유일한 사람이 되었다. 그녀가 쓴 「이름 없는 아이들의 역사」는 전쟁고아들의 기록을 모은 책으로, 학당 필독서가 되었다. 책의 헌사는 짧다. 「이름을 지어 준 사람에게.」' },
    doctor: { title: '왕도의 의사', rank: 'B', bg: 'hospital', c: 'daughter_adult', e: 'smile',
      t: '약초학과 의술을 익힌 {s.dname}는 왕도 빈민가에 진료소를 열었다. 돈이 없는 환자에게는 치료비 대신 이야기 한 편을 받았다. 진료소 벽은 그 이야기들로 빼곡하다. 마르타 할머니는 매일 아침 그녀의 진료소에 수프를 배달한다. "의사 선생 굶으면 환자도 굶어요."' },
    detective: { title: '명탐정', rank: 'B', bg: 'corridor_night', c: 'daughter_adult', e: 'smirk',
      t: '보석상 사건 이후, {s.dname}에게 의뢰가 끊이지 않았다. 그녀는 왕도 최초의 사립 탐정 사무소를 열었다. 「이상한 게 세 개 있어요」라는 말이 나오면 범인은 이미 창백해진다. 그녀의 조수는 은퇴한 용사다. 주 업무는 문 앞에 서서 험상궂은 표정 짓기. 의외로 효과가 좋다.' },
    writer: { title: '작가', rank: 'B', bg: 'daughter_room', c: 'daughter_adult', e: 'smile',
      t: '「별을 키우는 용사」는 왕국 전역의 베스트셀러가 되었다. {s.dname}는 전업 작가가 되어 열두 권의 소설을 더 썼다. 모든 책에는 칼로 계란을 깨는 아버지가 한 명씩 나온다. 독자들은 그 아버지가 실존 인물이냐고 묻는다. 그녀는 늘 같은 답을 한다. "아니요. 실제로는 훨씬 더 서툴고, 훨씬 더 다정해요."' },
    painter: { title: '궁정 화가', rank: 'B', bg: 'garden_rose', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}의 그림은 왕궁 회랑에 걸리게 되었다. 그녀는 귀족의 초상화보다 시장 사람들과 고아원 아이들을 즐겨 그렸다. 가장 유명한 작품은 「눈의 용사」. 험상궂은 눈사람 옆에서 웃고 있는 열 살 소녀와 무뚝뚝한 남자의 그림이다. 그 그림만은 어떤 값에도 팔지 않았다.' },
    prima: { title: '프리마돈나', rank: 'A', bg: 'ballroom', c: 'daughter_adult', e: 'laugh',
      t: '{s.dname}는 왕립 극장의 프리마돈나가 되었다. 그녀가 무대에서 한 바퀴 돌면 극장 전체가 숨을 멈췄다. 공연이 끝나면 늘 맨 앞줄 가운데 자리를 확인한다. 그 자리엔 여덟 해 동안 한 번도 빠짐없이, 꽃다발을 든 무뚝뚝한 남자가 앉아 있었다. 박수는 제일 크고, 박자는 제일 안 맞는.' },
    singer: { title: '음유가인', rank: 'B', bg: 'festival', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}의 노래는 왕국 곳곳의 광장에 울려 퍼졌다. 가장 사랑받은 곡은 가사를 아무도 모르는 옛 자장가였다. 아스트렐의 말로 된 노래. 사람들은 뜻을 몰라도 그 노래를 들으면 울었다. 그녀는 공연 마지막 곡을 늘 이렇게 소개한다. "제 아빠가 곰 울음소리로 따라 부르던 노래입니다."' },
    chef: { title: '왕도 제일의 요리사', rank: 'B', bg: 'town_square', c: 'daughter_adult', e: 'laugh',
      t: '{s.dname}는 왕도 광장에 작은 식당을 열었다. 줄은 매일 골목 끝까지 이어졌다. 대표 메뉴는 별 모양으로 썬 채소가 들어간 스튜. 단, 당근은 없다. 절대로. 주방 한편에는 마르타 할머니의 손글씨 레시피가 액자로 걸려 있다. 비법 세 개는 여전히 빠진 채로.' },
    tycoon: { title: '대륙의 거상', rank: 'A', bg: 'harbor', c: 'daughter_adult', e: 'smirk',
      t: '{s.dname}의 상단은 대륙 세 곳의 항구를 잇는 거대 상회가 되었다. 그녀는 가계부 한 권으로 시작해 금고 백 개를 채웠다. 이익의 일부는 반드시 전쟁고아 장학금으로 쓰인다. 상회의 문장은 여덟 꼭지 별과, 기울어진 케이크. 아무도 그 의미를 모른다. 한 사람만 빼고.' },
    merchant: { title: '상인', rank: 'B', bg: 'town_market', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 왕도 시장에 잡화점을 열었다. 셈이 빠르고 인심이 좋아 단골이 끊이지 않았다. 가게 한쪽에는 「꼬치 외상 불가」라는 이상한 팻말이 붙어 있다. 저녁이면 그녀는 장부를 덮고 아빠 집으로 퇴근한다. 독립했지만, 저녁밥은 여전히 같이 먹는다.' },
    bride: { title: '행복한 신부', rank: 'A', bg: 'church', c: 'daughter_adult', e: 'shy',
      t: '{s.dname}는 소꿉친구 레오와 결혼했다. 결혼식 케이크는 신랑이 직접 구운 열여덟 층짜리. 둘은 햇살 빵집을 이어받아, 매일 새벽 네 시에 함께 반죽을 치댄다. 빵집 창문 앞에는 매일 아침 빵 하나가 놓인다. 이번엔 건너편 용사의 집을 향해. 장인어른은 매일 아침 그 빵을 먹고, 매일 아침 「짜다」고 투덜댄다. 눈이 빨개진 채로.' },
    teacher: { title: '학당 선생님', rank: 'B', bg: 'school', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 자신이 다녔던 왕립 학당의 선생님이 되었다. 그녀의 반에는 「주워 온 애」라는 말이 없다. 그 말을 한 학생은 그녀와 한 시간 동안 면담을 한다. 나올 때는 모두 울면서 사과하러 간다. 입학식 날이면 그녀는 머리를 한쪽만 높게 묶고 나온다. 전략적 비대칭. 긴장한 아이들이 그걸 보고 웃는다.' },
    maid_chief: { title: '궁정 시녀장', rank: 'B', bg: 'palace_hall', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 마르타의 뒤를 이어 궁정 시녀장이 되었다. 그녀의 찻잔 드는 손목 각도는 스승과 똑같았다. 왕비는 그녀가 따른 차가 아니면 마시지 않았다. 은퇴한 마르타는 가끔 궁에 와서 제자의 일을 감독한다. "넥타이가 삐뚤어요, 도련님" 소리는 이제 두 사람에게서 동시에 들린다.' },
    innkeeper: { title: '여관 주인', rank: 'B', bg: 'tavern', c: 'daughter_adult', e: 'laugh',
      t: '{s.dname}는 왕도 입구의 낡은 여관을 사들여 「별빛 여관」이라 이름 붙였다. 지친 여행자들은 따뜻한 수프와 푹신한 침대, 그리고 주인의 수다에 반해 다시 찾아왔다. 여관 로비에는 줄무늬 고양이의 초상화가 걸려 있다. 여관의 명예 지배인, 고등어 3세. 방값을 못 내는 손님에게 그녀는 말한다. "대신 이야기 하나 해 주세요. 우리 아빠가 좋아해요."' },
    nun: { title: '성당의 수녀', rank: 'C', bg: 'church', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 대성당의 수녀가 되어 고아원을 맡았다. 아이들이 무서운 꿈을 꾸면 그녀는 문간에 앉아 밤을 새운다. 누군가 자신에게 그렇게 해 주었던 것처럼. 매주 일요일 미사가 끝나면 그녀는 맨 뒷줄의 무뚝뚝한 남자에게 다가가 속삭인다. "아빠, 또 졸았지?"' },
    mercenary: { title: '용병', rank: 'C', bg: 'castle_gate', c: 'daughter_adult', e: 'cold',
      t: '{s.dname}는 검 한 자루를 들고 용병단에 들어갔다. 기사의 칭호도 명예도 없었지만, 그녀가 지킨 상단과 마을은 무사했다. 그녀는 계약서 마지막 줄에 늘 조항 하나를 추가한다. 「고아는 공짜로 호위함.」 가끔 집에 돌아오면 아빠와 마당에서 목검 대련을 한다. 요즘은 그녀가 이기는 날이 더 많다.' },
    farmer: { title: '농장 주인', rank: 'C', bg: 'farm', c: 'daughter_adult', e: 'laugh',
      t: '{s.dname}는 농장 할아버지의 뒤를 이어 왕도 외곽의 농장을 물려받았다. 그녀의 호박은 수확제에서 삼 년 연속 1등을 했다. 흙이랑 말이 통하는 손. 아빠는 은퇴 후 그녀의 농장에서 일꾼으로 일한다. 급여는 매일 저녁 호박 수프 한 그릇. 당근 밭은 없다.' },
    daddys_girl: { title: '아빠의 곁에서', rank: 'B', bg: 'house_day', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 특별한 무언가가 되지는 않았다. 대신 매일 아침 아빠의 커피를 내리고, 마르타 할머니의 잔소리를 듣고, 고등어의 밥을 챙긴다. 사람들은 용사의 딸이 아깝다고 말했다. 그녀는 웃었다. "세상에서 제일 센 사람 곁에 있는 게, 세상에서 제일 대단한 일이에요." 어느 날 그녀가 자기 길을 찾아 떠나더라도, 이 여덟 해의 기억은 그녀를 영원히 지킬 것이다.' },
    normal: { title: '평범한 아가씨', rank: 'C', bg: 'town_square', c: 'daughter_adult', e: 'smile',
      t: '{s.dname}는 왕도의 평범한 아가씨가 되었다. 시장에서 일하고, 친구들과 수다를 떨고, 가끔 사랑에 빠지고, 가끔 차였다. 영웅담은 없었지만 불행도 없었다. 불타는 마을에서 온 아이에게, 평범한 하루는 그 자체로 기적이었다. 그리고 그 기적을 만든 사람은 오늘도 건너편 집 창가에서 그녀가 퇴근하는 걸 지켜본다.' },
  };

  const endingRules = [
    { id: 'runaway', if: { flag: 'ran_away' } },
    { id: 'demon_queen', if: { flag: 'night_crown' } },
    { id: 'star_maiden', if: { flag: 'star_seal' } },
    { id: 'queen', if: { flag: 'claim_throne', v: { grace: '>=55', int: '>=50', fame: '>=30' } } },
    { id: 'crown_princess', if: { flag: 'lucas_promise', v: { grace: '>=50', charm: '>=50' } } },
    { id: 'general', if: { v: { combat: '>=85', int: '>=65', fame: '>=45' } } },
    { id: 'knight_commander', if: { flag: 'knight_pass', v: { combat: '>=70', moral: '>=50' } } },
    { id: 'archsage', if: { v: { int: '>=90', magic: '>=55' } } },
    { id: 'court_mage', if: { v: { magic: '>=75', int: '>=55' } } },
    { id: 'saint', if: { any: [{ flag: 'miracle', v: { faith: '>=75', moral: '>=65' } }, { v: { faith: '>=90', moral: '>=75' } }] } },
    { id: 'bandit_queen', if: { v: { moral: '<=15', combat: '>=50' } } },
    { id: 'madam', if: { flag: 'did_tavern', v: { charm: '>=55', moral: '<=40' } } },
    { id: 'bounty_hunter', if: { flag: 'did_bounty', v: { combat: '>=55', moral: '<=60' } } },
    { id: 'adventurer', if: { any: [{ flag: 'dragon_slain' }, { v: { combat: '>=55', hp: '>=65', fame: '>=40' } }] } },
    { id: 'bride', if: { flag: 'leo_promise', aff: { leo: '>=70' } } },
    { id: 'tycoon', if: { v: { money: '>=8000' } } },
    { id: 'scholar', if: { v: { int: '>=80' } } },
    { id: 'doctor', if: { flag: 'did_med', v: { int: '>=60', moral: '>=55' } } },
    { id: 'detective', if: { flag: 'solved_case', v: { int: '>=55' } } },
    { id: 'writer', if: { flag: 'wrote_novel', v: { sense: '>=60' } } },
    { id: 'prima', if: { flag: 'did_dance', v: { charm: '>=70', grace: '>=55' } } },
    { id: 'painter', if: { flag: 'did_art', v: { sense: '>=70' } } },
    { id: 'singer', if: { flag: 'did_music', v: { sense: '>=60', charm: '>=55' } } },
    { id: 'chef', if: { flag: 'did_cook', v: { house: '>=70' } } },
    { id: 'merchant', if: { v: { money: '>=3000', int: '>=40' } } },
    { id: 'teacher', if: { v: { int: '>=55', moral: '>=60' } } },
    { id: 'maid_chief', if: { flag: 'did_maid', v: { grace: '>=55', house: '>=55' } } },
    { id: 'innkeeper', if: { flag: 'did_inn', v: { house: '>=50', charm: '>=40' } } },
    { id: 'nun', if: { v: { faith: '>=60', moral: '>=50' } } },
    { id: 'mercenary', if: { v: { combat: '>=45' } } },
    { id: 'farmer', if: { flag: 'did_farm', v: { hp: '>=50' } } },
    { id: 'daddys_girl', if: { aff: { daughter: '>=90' } } },
    { id: 'normal', if: {} },
  ];

  // ---------- 활동 ----------
  const activities = [
    // 교육
    { id: 'study', name: '왕립 학당 수업', cat: '교육', cost: 30, desc: '읽기, 쓰기, 셈, 왕국사. 모든 공부의 기본.',
      fx: { v: { int: 3, moral: 1, stress: 3 }, flag: 'did_study' },
      great: { chance: 0.15, fx: { v: { int: 3 } }, t: '선생님이 {s.dname}의 답안을 반 전체에 읽어 주었다!' },
      fail: { chance: 0.1, fx: { v: { stress: 4 } }, t: '수업 내내 졸았다. 이마에 책 자국.' },
      lines: ['레오폴트 1세, 2세, 3세… 이름 좀 다르게 짓지.', '칠판 글씨가 빼곡하다.', '쉬는 시간 종이 이렇게 반가울 수가.'] },
    { id: 'etiquette', name: '예법 교실', cat: '교육', cost: 40, desc: '인사, 식사 예절, 차 따르기. 귀족 영애들과 함께.',
      fx: { v: { grace: 3, charm: 1, stress: 3 }, flag: 'did_etiquette' },
      great: { chance: 0.12, fx: { v: { grace: 3 } }, t: '찻물 한 방울 흘리지 않았다. 강사가 박수를 쳤다.' },
      fail: { chance: 0.1, fx: { v: { stress: 3 } }, t: '생선 나이프로 빵을 잘랐다. 또.' },
      lines: ['허리 펴고, 턱 당기고, 미소는 반만.', '포크가 왜 네 개나 필요한 거야.', '치맛자락 잡고 무릎 굽히기 백 번.'] },
    { id: 'dojo', name: '무술 도장', cat: '교육', cost: 30, desc: '기초 체력과 맨손 무술. 땀 냄새 가득.',
      fx: { v: { combat: 2, str: 2, hp: 1, grace: -1, stress: 3 }, flag: 'did_dojo' },
      great: { chance: 0.15, fx: { v: { combat: 2, str: 1 } }, t: '사범의 손목을 꺾었다! 사범이 기뻐서 울었다.' },
      fail: { chance: 0.12, fx: { v: { hp: -3, stress: 3 } }, t: '낙법에 실패했다. 엉덩이에 멍.' },
      lines: ['하나! 둘! 하나! 둘!', '중심을 무너뜨려라. 곰 아저씨 말이 맞았다.', '도복 띠를 세 번 고쳐 맸다.'] },
    { id: 'sword', name: '기사단 검술 교습', cat: '교육', cost: 50, desc: '가렌이 직접 가르치는 정통 검술.',
      req: { all: [{ age: '>=12' }, { v: { combat: '>=15' } }] }, hint: '12세 이상, 무예 15 이상',
      fx: { v: { combat: 3, str: 1, hp: 1, sense: -1, stress: 4 }, flag: 'did_sword' },
      great: { chance: 0.15, fx: { v: { combat: 3 } }, t: '가렌의 목검을 쳐 냈다! "형님! 형님 딸이!"' },
      fail: { chance: 0.12, fx: { v: { hp: -4, stress: 3 } }, t: '손목을 삐었다. 가렌이 더 아파했다.' },
      lines: ['검은 팔이 아니라 허리로 휘두르는 것.', '가렌: "좋아! 한 번 더! 백 번 더!"', '손바닥 물집이 굳은살이 되어 간다.'] },
    { id: 'magic', name: '마법 학원', cat: '교육', cost: 60, desc: '마력의 기초와 원소 마법. 탑 계단 칠백칠십칠 개.',
      req: { v: { int: '>=15' } }, hint: '지능 15 이상',
      fx: { v: { magic: 3, int: 1, faith: -1, stress: 4 }, flag: 'did_magic' },
      great: { chance: 0.15, fx: { v: { magic: 3 } }, t: '손끝에서 별빛이 피었다. 교실이 조용해졌다.' },
      fail: { chance: 0.12, fx: { v: { stress: 4, money: -30 } }, t: '촛불 대신 커튼을 켰다. 커튼 값 물어 줌.' },
      lines: ['마력은 단것을 좋아한다… 정말?', '주문을 외우다 혀가 꼬였다.', '수정 구슬 속에 별이 떠다닌다.'] },
    { id: 'theology', name: '신학 교실', cat: '교육', cost: 20, desc: '성당의 교리 수업. 기도와 성가.',
      fx: { v: { faith: 3, moral: 1, magic: -1, stress: 2 }, flag: 'did_theology' },
      great: { chance: 0.12, fx: { v: { faith: 3, moral: 1 } }, t: '기도하는 손끝이 금빛으로 빛났다.' },
      fail: { chance: 0.08, fx: { v: { stress: 2 } }, t: '성가 시간에 박자를 놓쳤다. 엘레나가 미소 지었다. 무섭게.' },
      lines: ['주님 보시기에… 졸면 안 된다.', '스테인드글라스 빛이 무릎 위에 떨어진다.', '성가 음이 너무 높다.'] },
    { id: 'art', name: '미술 교실', cat: '교육', cost: 40, desc: '데생, 수채화, 벽화. 손에 물감이 가득.',
      fx: { v: { sense: 3, charm: 1, str: -1, stress: 2 }, flag: 'did_art' },
      great: { chance: 0.15, fx: { v: { sense: 3 } }, t: '그린 고양이가 진짜처럼 보여서 고등어가 하악질했다!' },
      fail: { chance: 0.1, fx: { v: { stress: 3 } }, t: '물감통을 엎었다. 바닥이 명작이 되었다.' },
      lines: ['빛은 노랑이 아니라 흰색에 가깝다.', '고등어를 모델로 세 시간.', '손톱 밑까지 파랑.'] },
    { id: 'music', name: '음악 교실', cat: '교육', cost: 40, desc: '류트와 성악. 목소리를 악기로.',
      fx: { v: { sense: 2, charm: 2, stress: 2 }, flag: 'did_music' },
      great: { chance: 0.15, fx: { v: { sense: 2, charm: 2 } }, t: '고음이 창문을 흔들었다. 좋은 의미로.' },
      fail: { chance: 0.1, fx: { v: { stress: 3 } }, t: '류트 줄이 끊어져 이마를 쳤다.' },
      lines: ['도, 레, 미… 파가 자꾸 샌다.', '류트 줄이 손끝을 파고든다.', '노래할 땐 아무 생각이 안 나서 좋다.'] },
    { id: 'dance', name: '무용 교실', cat: '교육', cost: 50, desc: '궁정 무도부터 민속춤까지.',
      fx: { v: { charm: 2, grace: 1, hp: 1, stress: 3 }, flag: 'did_dance' },
      great: { chance: 0.15, fx: { v: { charm: 2, grace: 2 } }, t: '회전 열두 바퀴! 거울 속 자신이 낯설 만큼 우아했다.' },
      fail: { chance: 0.12, fx: { v: { hp: -2, stress: 3 } }, t: '파트너 발을 밟고 같이 넘어졌다.' },
      lines: ['하나, 둘, 셋, 돌고.', '발끝으로 서는 건 생각보다 아프다.', '거울 속의 나, 조금 멋있는 것 같기도.'] },
    { id: 'cooking', name: '요리 교실', cat: '교육', cost: 30, desc: '빵부터 정찬까지. 단, 당근 요리 포함.',
      fx: { v: { house: 3, sense: 1, stress: 2 }, flag: 'did_cook' },
      great: { chance: 0.15, fx: { v: { house: 3 } }, t: '강사가 레시피를 물어봤다!' },
      fail: { chance: 0.1, fx: { v: { stress: 3 } }, t: '소금과 설탕을 헷갈렸다. 단짠 스튜.' },
      lines: ['양파 썰 때는 울어도 된다.', '간은 마지막에.', '오늘도 당근은 몰래 빼 둔다.'] },
    { id: 'literature', name: '문학 교실', cat: '교육', cost: 40, desc: '시와 소설을 읽고 쓴다.',
      fx: { v: { sense: 2, int: 2, stress: 2 }, flag: 'did_lit' },
      great: { chance: 0.12, fx: { v: { sense: 2, int: 1 } }, t: '쓴 시가 학당 게시판에 붙었다.' },
      lines: ['「비 오는 밤, 아빠의 어깨」… 이건 너무 부끄럽다.', '문장 하나에 한 시간.', '책장 넘기는 소리가 좋다.'] },
    { id: 'medicine', name: '약초학·의술', cat: '교육', cost: 50, desc: '약초의 효능과 응급 처치. 성당 진료소 실습.',
      req: { all: [{ age: '>=12' }, { v: { int: '>=30' } }] }, hint: '12세 이상, 지능 30 이상',
      fx: { v: { int: 2, moral: 1, faith: 1, stress: 3 }, flag: 'did_med' },
      great: { chance: 0.12, fx: { v: { int: 2, moral: 2 } }, t: '실습 중 다친 아이의 상처를 완벽하게 싸맸다.' },
      fail: { chance: 0.1, fx: { v: { hp: -2, stress: 3 } }, t: '약초를 맛보다 배탈이 났다.' },
      lines: ['쑥, 박하, 카모마일… 그리고 독버섯 주의.', '붕대는 너무 꽉 감지 말 것. 가렌 아저씨 미안.', '약 달이는 냄새가 옷에 밴다.'] },
    { id: 'strategy', name: '병법 강의', cat: '교육', cost: 60, desc: '왕국 사관 학교의 청강. 전술과 지형.',
      req: { all: [{ age: '>=13' }, { v: { int: '>=35' } }] }, hint: '13세 이상, 지능 35 이상',
      fx: { v: { int: 2, combat: 1, sense: -1, stress: 4 }, flag: 'did_strategy' },
      great: { chance: 0.12, fx: { v: { int: 2, combat: 2 } }, t: '모의 전투에서 교관의 부대를 포위했다!' },
      lines: ['지형을 아는 자가 이긴다.', '체스 말이 병사처럼 보인다.', '사관생도들이 슬금슬금 쳐다본다.'] },
    { id: 'astronomy', name: '모르간의 천문학', cat: '교육', cost: 40, desc: '탑 꼭대기에서 별을 읽는 법. 모르간의 특별 수업.',
      req: { flag: 'met_morgan' }, hint: '모르간을 만나야 한다',
      fx: { v: { magic: 2, int: 1, sense: 1, stress: 2 }, aff: { morgan: 1 }, flag: 'did_astro' },
      great: { chance: 0.15, fx: { v: { magic: 2, sense: 2 } }, t: '처음 보는 별자리가 눈에 익숙했다. 모르간이 조용히 웃었다.' },
      lines: ['북쪽 하늘의 여덟 꼭지 별.', '모르간: "흐음, 별은 밤을 잊지 않지요."', '망원경 너머로 시간이 흐른다.'] },

    // 아르바이트
    { id: 'chores', name: '집안일 돕기', cat: '아르바이트', cost: -10, desc: '마르타의 조수. 용돈은 적지만 손이 야무져진다.',
      fx: { v: { house: 2, moral: 1, stress: 1 }, aff: { marta: 1 } },
      great: { chance: 0.15, fx: { v: { house: 2 } }, t: '마르타가 "제법이네"라고 했다! 칠 년에 한 번 나오는 칭찬.' },
      lines: ['걸레질은 끝에서부터.', '마르타: "구석! 구석!"', '고등어가 빨래 바구니에 들어가 있다.'] },
    { id: 'farm', name: '농장 일', cat: '아르바이트', cost: -30, desc: '왕도 외곽 농장. 흙과 햇볕.',
      fx: { v: { hp: 2, str: 1, charm: -1, stress: 3 }, flag: 'did_farm' },
      great: { chance: 0.12, fx: { v: { hp: 2, money: 30 } }, t: '할아버지가 호박을 덤으로 주셨다.' },
      fail: { chance: 0.08, fx: { v: { stress: 3 } }, t: '염소에게 쫓겼다. 염소가 이겼다.' },
      lines: ['흙냄새가 좋다.', '감자 캐기, 무한 반복.', '햇볕에 코가 빨개졌다.'] },
    { id: 'inn', name: '여관 심부름', cat: '아르바이트', cost: -35, desc: '방 청소, 짐 나르기, 손님 응대.',
      fx: { v: { house: 1, charm: 1, stress: 3 }, flag: 'did_inn' },
      great: { chance: 0.12, fx: { v: { money: 40, charm: 1 } }, t: '여행자가 팁을 두둑이 줬다!' },
      fail: { chance: 0.1, fx: { v: { stress: 4 } }, t: '진상 손님. 이불이 왜 네모냐고 따졌다.' },
      lines: ['어서 오세요, 별빛… 아니 황금 사슴 여관입니다!', '침대 시트는 팽팽하게.', '여행자들의 이야기가 재밌다.'] },
    { id: 'church_work', name: '성당 봉사', cat: '아르바이트', cost: -15, desc: '고아원 아이들 돌보기와 청소. 보수는 적다.',
      fx: { v: { faith: 2, moral: 2, stress: 2 }, aff: { elena: 1 }, flag: 'did_church' },
      great: { chance: 0.12, fx: { v: { faith: 2, moral: 1 } }, t: '고아원 아이가 "누나 최고"라고 그림을 그려 줬다.' },
      lines: ['그림책 읽기, 마왕 목소리는 아빠 흉내.', '엘레나: "주님 보시기에, 잘하고 있어요."', '고아원 지붕이 또 샌다.'] },
    { id: 'babysit', name: '아이 돌보기', cat: '아르바이트', cost: -25, desc: '이웃집 쌍둥이 돌보기. 체력 소모 극심.',
      fx: { v: { moral: 1, house: 1, sense: 1, stress: 4 } },
      great: { chance: 0.1, fx: { v: { moral: 2 } }, t: '쌍둥이가 동시에 낮잠에 들었다. 기적.' },
      fail: { chance: 0.12, fx: { v: { stress: 4 } }, t: '쌍둥이가 고등어 꼬리를 잡았다. 대혼란.' },
      lines: ['하나를 잡으면 하나가 도망간다.', '"누나, 한 번 더!" 벌써 스무 번째.', '낮잠 노래를 불러 준다.'] },
    { id: 'bakery', name: '빵집 일손', cat: '아르바이트', cost: -30, desc: '건너편 햇살 빵집. 새벽 네 시 출근.',
      req: { flag: 'met_leo' }, hint: '빵집 아들을 먼저 알아야 한다',
      fx: { v: { house: 2, hp: 1, stress: 3 }, aff: { leo: 2 }, flag: 'did_bakery' },
      great: { chance: 0.12, fx: { v: { house: 2 }, aff: { leo: 2 } }, t: '반죽이 완벽하게 부풀었다. 레오가 감격했다.' },
      lines: ['반죽은 화내면 안 돼. 달래야 해.', '레오가 밀가루를 뒤집어썼다. 또.', '갓 구운 빵 냄새에 잠이 깬다.'] },
    { id: 'hunter', name: '사냥꾼 조수', cat: '아르바이트', cost: -45, desc: '숲에서 덫을 놓고 짐승을 쫓는다.',
      req: { age: '>=12' }, hint: '12세 이상',
      fx: { v: { combat: 1, str: 1, moral: -1, sense: -1, stress: 4 }, flag: 'did_hunt' },
      great: { chance: 0.12, fx: { v: { money: 50, combat: 1 } }, t: '멧돼지를 잡았다! 보너스!' },
      fail: { chance: 0.12, fx: { v: { hp: -3, stress: 3 } }, t: '덫에 자기 발이 걸렸다.' },
      lines: ['발자국을 읽는다.', '토끼 눈이 너무 동그래서 놓아주었다.', '숲이 조용하다. 너무 조용하다.'] },
    { id: 'brick', name: '벽돌 공장', cat: '아르바이트', cost: -60, desc: '고되지만 벌이는 좋다. 근육이 생긴다.',
      req: { age: '>=12' }, hint: '12세 이상',
      fx: { v: { str: 3, hp: 1, charm: -2, grace: -1, stress: 6 } },
      great: { chance: 0.1, fx: { v: { str: 2, money: 40 } }, t: '반장이 "정직원 할래?"라고 물었다.' },
      fail: { chance: 0.12, fx: { v: { hp: -3, stress: 4 } }, t: '벽돌을 발등에 떨어뜨렸다.' },
      lines: ['하나, 둘, 셋… 벽돌 이백 장.', '손바닥이 벽돌색이 되었다.', '땀이 비처럼 흐른다.'] },
    { id: 'weapon', name: '무기점 점원', cat: '아르바이트', cost: -50, desc: '칼 닦고, 손님 응대하고, 가끔 시험 베기.',
      req: { age: '>=12' }, hint: '12세 이상',
      fx: { v: { str: 1, combat: 1, int: 1, stress: 4 } },
      great: { chance: 0.12, fx: { v: { combat: 2 } }, t: '주인이 명검을 한번 휘둘러 보게 해 줬다.' },
      lines: ['이 검은 무게 중심이 좋아요, 손님.', '칼날에 비친 얼굴.', '용사님 딸이라고 하자 매출이 올랐다.'] },
    { id: 'library_job', name: '도서관 사서 보조', cat: '아르바이트', cost: -30, desc: '책 정리와 대출 관리. 조용하다.',
      req: { v: { int: '>=25' } }, hint: '지능 25 이상',
      fx: { v: { int: 2, stress: 2 }, flag: 'did_library' },
      great: { chance: 0.12, fx: { v: { int: 2, sense: 1 } }, t: '서고 깊은 곳에서 아스트렐에 관한 고서를 찾았다.' },
      lines: ['쉿.', '「별자리와 옛 왕국들」, 또 빌려 간다.', '책 먼지에 재채기.'] },
    { id: 'merchant_job', name: '상단 서기', cat: '아르바이트', cost: -50, desc: '항구 상단의 장부 정리와 흥정 보조.',
      req: { all: [{ age: '>=13' }, { v: { int: '>=35' } }] }, hint: '13세 이상, 지능 35 이상',
      fx: { v: { int: 1, charm: 1, stress: 3 }, flag: 'did_trade' },
      great: { chance: 0.12, fx: { v: { money: 80 } }, t: '흥정을 성공시켜 수수료를 받았다!' },
      lines: ['숫자는 거짓말을 안 한다. 사람은 해도.', '향신료 냄새가 코를 찌른다.', '주판알 튕기는 소리.'] },
    { id: 'model', name: '화가 모델', cat: '아르바이트', cost: -60, desc: '화실에서 몇 시간 가만히 앉아 있기.',
      req: { all: [{ age: '>=14' }, { v: { charm: '>=35' } }] }, hint: '14세 이상, 매력 35 이상',
      fx: { v: { charm: 1, sense: 1, moral: -1, stress: 3 }, flag: 'did_model' },
      great: { chance: 0.12, fx: { v: { charm: 2, fame: 1 } }, t: '그림이 화랑에 걸렸다. 제목은 「별빛 소녀」.' },
      lines: ['움직이지 마세요… 코 가려워.', '화가가 "영혼이 보인다"고 했다. 무슨 뜻이지.', '세 시간째 같은 자세.'] },
    { id: 'mage_assist', name: '마법사 조수', cat: '아르바이트', cost: -55, desc: '마법 재료 손질과 실험 보조.',
      req: { v: { magic: '>=30' } }, hint: '마력 30 이상',
      fx: { v: { magic: 2, int: 1, stress: 4 } },
      great: { chance: 0.12, fx: { v: { magic: 2 } }, t: '실험 폭발 없이 무사히 끝났다. 기록적인 날.' },
      fail: { chance: 0.12, fx: { v: { hp: -2, stress: 3 } }, t: '폭발. 눈썹이 조금 탔다.' },
      lines: ['도롱뇽 꼬리 세 개, 달빛 이슬 한 방울.', '플라스크가 보글보글.', '모르간이 사탕을 나눠 줬다.'] },
    { id: 'maid', name: '궁정 시녀', cat: '아르바이트', cost: -70, desc: '왕궁에서 차 시중과 의전 보조. 예법 필수.',
      req: { all: [{ age: '>=14' }, { v: { grace: '>=35' } }] }, hint: '14세 이상, 기품 35 이상',
      fx: { v: { grace: 2, house: 1, stress: 5 }, flag: 'did_maid' },
      great: { chance: 0.12, fx: { v: { grace: 2, fame: 1 } }, t: '왕비가 직접 칭찬했다!' },
      fail: { chance: 0.1, fx: { v: { stress: 4 } }, t: '공작 부인 드레스에 차를 쏟을 뻔했다. 뻔했다.' },
      lines: ['은쟁반은 생각보다 무겁다.', '복도가 너무 길다.', '마르타 할머니의 손목 각도를 떠올린다.'] },
    { id: 'tutor', name: '가정교사', cat: '아르바이트', cost: -80, desc: '귀족 자제들의 공부를 봐 준다. 보수가 좋다.',
      req: { all: [{ age: '>=15' }, { v: { int: '>=55' } }] }, hint: '15세 이상, 지능 55 이상',
      fx: { v: { int: 1, moral: 1, charm: 1, stress: 4 } },
      great: { chance: 0.12, fx: { v: { fame: 1, money: 50 } }, t: '학생의 성적이 올랐다! 부모가 사례금을 줬다.' },
      lines: ['레오폴트 1세부터 다시.', '학생이 코를 판다. 모른 척.', '가르치면서 더 많이 배운다.'] },
    { id: 'tavern', name: '주점 종업원', cat: '아르바이트', cost: -90, desc: '뒷골목 주점 「취한 그리핀」. 벌이는 최고, 평판은 최악.',
      req: { age: '>=15' }, hint: '15세 이상',
      fx: { v: { charm: 2, moral: -2, grace: -2, stress: 5 }, flag: 'did_tavern' },
      great: { chance: 0.12, fx: { v: { money: 60, charm: 1 } }, t: '용병단이 팁을 쏟아부었다.' },
      fail: { chance: 0.12, fx: { v: { stress: 5, moral: -1 } }, t: '취객과 시비. 소금 뿌리고 나왔다.' },
      lines: ['맥주 네 잔, 소시지 두 접시!', '담배 연기가 눈을 찌른다.', '구석에 우유 마시는 단골이 있다. 아빠다.'] },
    { id: 'bounty', name: '현상금 사냥', cat: '아르바이트', cost: -120, desc: '길드 게시판의 현상범을 잡는다. 위험하다.',
      req: { all: [{ age: '>=15' }, { v: { combat: '>=45' } }] }, hint: '15세 이상, 무예 45 이상',
      fx: { v: { combat: 2, moral: -2, fame: 1, hp: -1, stress: 6 }, flag: 'did_bounty' },
      great: { chance: 0.15, fx: { v: { money: 150, fame: 2 } }, t: '거물급 현상범을 잡았다!' },
      fail: { chance: 0.15, fx: { v: { hp: -6, stress: 5 } }, t: '매복에 걸렸다. 간신히 빠져나왔다.' },
      lines: ['수배서의 얼굴을 외운다.', '뒷골목의 발소리.', '포승줄은 두 번 감는다.'] },

    // 휴식
    { id: 'rest', name: '집에서 쉬기', cat: '휴식', cost: 0, desc: '늦잠, 고양이, 아무것도 안 하기.',
      fx: { v: { stress: -12, hp: 1 } },
      great: { chance: 0.15, fx: { v: { stress: -6 }, aff: { daughter: 1 } }, t: '아빠랑 하루 종일 보드게임. 아빠가 졌다. 일부러.' },
      lines: ['고등어가 배 위에서 잔다.', '낮잠 최고.', '창밖 구름이 양 모양이다.'] },
    { id: 'walk', name: '소풍', cat: '휴식', cost: 20, desc: '도시락 싸서 언덕으로.',
      fx: { v: { stress: -15, sense: 1 }, aff: { daughter: 1 } },
      great: { chance: 0.15, fx: { v: { sense: 2 }, aff: { daughter: 2 } }, t: '네잎클로버를 찾았다! 아빠 주머니에 넣어 줬다.' },
      lines: ['샌드위치에 당근 없음 확인.', '민들레 홀씨 불기.', '노을 보고 돌아오기.'] },
    { id: 'vacation_sea', name: '바다 바캉스', cat: '휴식', cost: 150, desc: '남쪽 항구 도시로 여행. 파도와 조개.',
      fx: { v: { stress: -35, hp: 2, charm: 1 }, aff: { daughter: 2 } },
      great: { chance: 0.15, fx: { v: { sense: 2 }, aff: { daughter: 2 } }, t: '돌고래를 봤다! 딸이 하루 종일 돌고래 이야기만 했다.' },
      lines: ['아빠, 바다가 왜 짜?', '모래성 건설 중.', '조개껍데기 한 주머니.'] },
    { id: 'vacation_mt', name: '산 바캉스', cat: '휴식', cost: 120, desc: '호숫가 산장. 맑은 공기와 별밤.',
      fx: { v: { stress: -30, hp: 3 } },
      great: { chance: 0.15, fx: { v: { sense: 2, hp: 1 } }, t: '호수에 비친 별이 하늘보다 많았다.' },
      lines: ['산 공기가 달다.', '모닥불에 마시멜로.', '별이 쏟아질 것 같다.'] },
    { id: 'spa', name: '온천 요양', cat: '휴식', cost: 200, desc: '북부 온천 마을. 몸과 마음이 녹는다.',
      req: { age: '>=13' }, hint: '13세 이상',
      fx: { v: { stress: -45, hp: 3, charm: 1 } },
      lines: ['뜨끈하다….', '온천 계란은 사랑이다.', '아빠가 탕에서 잠들었다.'] },

    // 무사수행
    { id: 'adv_forest', name: '무사수행: 동쪽 숲', cat: '무사수행', cost: 20, desc: '늑대와 고블린이 나오는 숲. 초보자용.',
      fx: { v: { combat: 2, hp: 1, fame: 1, stress: 5 }, flag: 'did_adv' },
      great: { chance: 0.15, fx: { v: { money: 100, combat: 1 } }, t: '고블린 보물 상자를 찾았다!' },
      fail: { chance: 0.12, fx: { v: { hp: -4, stress: 4 } }, t: '늑대 떼에 쫓겨 나무 위에서 밤을 샜다.' },
      lines: ['나뭇가지가 발밑에서 부러진다.', '고블린이 도망갔다. 이겼다고 치자.', '모닥불 옆에서 검을 닦는다.'] },
    { id: 'adv_ruins', name: '무사수행: 고대 유적', cat: '무사수행', cost: 30, desc: '옛 왕국의 유적. 함정과 골렘.',
      req: { all: [{ age: '>=13' }, { v: { combat: '>=30' } }] }, hint: '13세 이상, 무예 30 이상',
      fx: { v: { combat: 2, magic: 1, fame: 2, stress: 6 }, flag: 'did_adv' },
      great: { chance: 0.15, fx: { v: { money: 300, int: 1 } }, t: '고대 금화 항아리를 발견했다!' },
      fail: { chance: 0.15, fx: { v: { hp: -6, stress: 5 } }, t: '함정에 빠졌다. 거미줄 범벅.' },
      lines: ['벽화 속 여덟 꼭지 별…?', '골렘의 눈이 빛난다.', '횃불이 깜빡인다.'] },
    { id: 'adv_snow', name: '무사수행: 북쪽 설산', cat: '무사수행', cost: 50, desc: '용의 둥지가 있다는 설산. 극도로 위험.',
      req: { all: [{ age: '>=15' }, { v: { combat: '>=55' } }] }, hint: '15세 이상, 무예 55 이상',
      fx: { v: { combat: 3, hp: 2, fame: 3, stress: 8 }, flag: ['did_adv', 'did_dragon'] },
      great: { chance: 0.12, fx: { v: { money: 500, fame: 2 } }, t: '서리 거인의 보물을 찾았다!' },
      fail: { chance: 0.15, fx: { v: { hp: -8, stress: 6 } }, t: '눈사태. 동굴에서 사흘을 버텼다.' },
      lines: ['숨이 하얗게 언다.', '저 멀리 거대한 날개 그림자.', '발자국이 눈에 금방 지워진다.'] },
    { id: 'adv_sea', name: '무사수행: 남쪽 해적 토벌', cat: '무사수행', cost: 40, desc: '해군과 함께 해적선을 친다.',
      req: { all: [{ age: '>=16' }, { v: { combat: '>=65' } }] }, hint: '16세 이상, 무예 65 이상',
      fx: { v: { combat: 3, str: 1, fame: 4, stress: 7 }, flag: 'did_adv' },
      great: { chance: 0.15, fx: { v: { money: 600, fame: 3 } }, t: '해적 두목을 사로잡았다! 포상금!' },
      fail: { chance: 0.12, fx: { v: { hp: -6, stress: 5 } }, t: '배에서 떨어졌다. 수영은 배워 둘 걸.' },
      lines: ['갑판이 흔들린다.', '해적 깃발에 해골이 웃고 있다.', '짠 바람이 뺨을 때린다.'] },
  ];

  // ---------- 상점 ----------
  const shop = [
    { id: 'dress_cotton', name: '무명 원피스', price: 200, desc: '소박하지만 단정한 원피스.', fx: { v: { charm: 3 } }, once: true },
    { id: 'dress_silk', name: '비단 드레스', price: 800, desc: '광택이 흐르는 하늘색 비단.', fx: { v: { charm: 6, grace: 4 } }, once: true },
    { id: 'dress_ball', name: '무도회 드레스', price: 1500, desc: '별자수가 박힌 연보라 드레스. 모두의 시선을.', fx: { v: { charm: 8, grace: 6, fame: 2 } }, once: true },
    { id: 'dress_armor', name: '여성용 경갑옷', price: 900, desc: '가볍고 튼튼한 은빛 갑옷.', fx: { v: { combat: 4, hp: 4, charm: 1 } }, once: true },
    { id: 'book_history', name: '「왕국 연대기」', price: 150, desc: '레오폴트 1세부터 4세까지. 두껍다.', fx: { v: { int: 4 } }, once: true },
    { id: 'book_magic', name: '「초급 마법 입문」', price: 300, desc: '모르간이 쓴 책. 여백에 사탕 그림.', fx: { v: { magic: 5, int: 1 } }, once: true },
    { id: 'book_poem', name: '시집 「별을 세는 밤」', price: 100, desc: '작자 미상의 옛 시집.', fx: { v: { sense: 3 } }, once: true },
    { id: 'book_scripture', name: '성경 필사본', price: 200, desc: '금박 장식의 성경.', fx: { v: { faith: 5, moral: 1 } }, once: true },
    { id: 'book_cook', name: '「요리 대백과」', price: 250, desc: '천 가지 레시피. 당근 요리 삼백 가지 포함.', fx: { v: { house: 5 } }, once: true },
    { id: 'book_etiquette', name: '「숙녀의 품격」', price: 250, desc: '궁정 예법의 모든 것.', fx: { v: { grace: 5 } }, once: true },
    { id: 'sword_iron', name: '철검', price: 400, desc: '날이 선 진짜 검. 가렌 추천.', fx: { v: { combat: 5 } }, once: true },
    { id: 'staff_crystal', name: '수정 지팡이', price: 900, desc: '끝에 별빛 수정이 박힌 지팡이.', fx: { v: { magic: 8 } }, once: true },
    { id: 'lute', name: '류트', price: 350, desc: '반들반들한 호두나무 류트.', fx: { v: { sense: 4, charm: 2 } }, once: true },
    { id: 'paints', name: '고급 물감 세트', price: 300, desc: '서른여섯 색 물감과 붓.', fx: { v: { sense: 5 } }, once: true },
    { id: 'mirror', name: '은 손거울', price: 120, desc: '뒷면에 장미 조각.', fx: { v: { charm: 2 } }, once: true },
    { id: 'apron', name: '레이스 앞치마', price: 100, desc: '마르타가 탐내는 앞치마.', fx: { v: { house: 3 }, aff: { marta: 2 } }, once: true },
    { id: 'gift_bear', name: '곰 인형', price: 80, desc: '가렌을 닮은 곰 인형.', fx: { v: { stress: -5 }, aff: { daughter: 5 } }, once: true },
    { id: 'gift_ribbon', name: '리본', price: 50, desc: '분홍, 하늘, 연보라 중 하나.', fx: { v: { charm: 1 }, aff: { daughter: 2 } } },
    { id: 'gift_candy', name: '사탕 한 봉지', price: 20, desc: '모르간이 좋아하는 그 사탕.', fx: { v: { stress: -3 } } },
    { id: 'gift_cattoy', name: '고양이 장난감', price: 30, desc: '고등어 전용 깃털 낚싯대.', fx: { v: { stress: -2 }, aff: { daughter: 1 } } },
    { id: 'food_cake', name: '딸기 케이크', price: 60, desc: '빵집 레오의 역작.', fx: { v: { stress: -8, hp: 1 }, aff: { leo: 1 } } },
    { id: 'food_feast', name: '고기 만찬', price: 150, desc: '통닭구이와 스튜. 기운이 난다.', fx: { v: { hp: 4, str: 1, stress: -5 } } },
    { id: 'food_tea', name: '허브차', price: 40, desc: '카모마일과 라벤더.', fx: { v: { stress: -4, sense: 1 } } },
    { id: 'food_tonic', name: '보약', price: 300, desc: '성당 약방의 비전 보약. 쓰다.', fx: { v: { hp: 8, stress: 3 } } },
  ];

  // ---------- 이벤트 ----------
  const events = [
    // 10세
    { id: 'school_first', if: R(1, 3), scene: 'ev_school_first', prio: 50, at: 'start' },
    { id: 'meet_leo', if: R(2, 5), scene: 'ev_meet_leo', prio: 20 },
    { id: 'garen_visit', if: R(2, 6), scene: 'ev_garen_visit', prio: 30 },
    { id: 'cat', if: R(3, 8), scene: 'ev_cat', prio: 15, at: 'start' },
    { id: 'pendant', if: R(4, 8), scene: 'ev_pendant', prio: 40 },
    { id: 'lost_tooth', if: R(5, 10), scene: 'ev_lost_tooth', prio: 10, at: 'start' },
    { id: 'nightmare', if: { all: [R(8, 11), { flag: 'pendant_glow' }] }, scene: 'ev_nightmare', prio: 30, at: 'start' },
    { id: 'first_snow', if: R(9, 11), scene: 'ev_first_snow', prio: 20 },
    // 11세
    { id: 'bully', if: R(13, 18), scene: 'ev_bully', prio: 20 },
    { id: 'meet_cecilia', if: { all: [{ turn: '>=13' }, { any: [{ flag: 'did_etiquette' }, { turn: '>=17' }] }] }, scene: 'ev_meet_cecilia', prio: 25 },
    { id: 'meet_elena', if: { all: [{ turn: '>=12' }, { any: [{ flag: 'did_church' }, { flag: 'did_theology' }, { turn: '>=20' }] }] }, scene: 'ev_meet_elena', prio: 20, at: 'start' },
    { id: 'meet_lucas', if: R(15, 22), scene: 'ev_meet_lucas', prio: 25 },
    { id: 'heart_rain', if: R(16, 21), scene: 'ev_heart_rain', prio: 20, at: 'start' },
    // 12세
    { id: 'meet_morgan', if: { all: [{ turn: '>=24' }, { any: [{ flag: 'did_magic' }, { turn: '>=27' }] }] }, scene: 'ev_meet_morgan', prio: 30 },
    { id: 'mother_question', if: R(25, 30), scene: 'ev_mother_question', prio: 20, at: 'start' },
    { id: 'leo_bread', if: { all: [R(26, 35), { flag: 'met_leo' }] }, scene: 'ev_leo_bread', prio: 10, at: 'start' },
    { id: 'king_summon', if: R(28, 32), scene: 'ev_king_summon', prio: 20 },
    { id: 'cecilia_duel', if: { all: [R(29, 34), { flag: 'met_cecilia' }] }, scene: 'ev_cecilia_duel', prio: 15 },
    { id: 'school_exam', if: R(32, 35), scene: 'ev_school_exam', prio: 25, at: 'start' },
    // 13세
    { id: 'secret_nightmare', if: R(37, 42), scene: 'ev_secret_nightmare', prio: 40, at: 'start' },
    { id: 'lucas_secret', if: { all: [R(39, 46), { flag: 'met_lucas' }] }, scene: 'ev_lucas_secret', prio: 20 },
    { id: 'cook_dad', if: { all: [{ turn: '>=30' }, { v: { house: '>=35' } }] }, scene: 'ev_cook_dad', prio: 10 },
    { id: 'rebel', if: { all: [{ age: '>=13' }, { age: '<=14' }, { v: { stress: '>=45' } }, { noflag: 'rebel_done' }] }, scene: 'ev_rebel', prio: 45, at: 'start' },
    { id: 'rebel_resolve', if: { all: [{ flag: 'rebel' }, { v: { stress: '<=30' } }] }, scene: 'ev_rebel_resolve', prio: 30 },
    // 14세
    { id: 'meet_darius', if: R(50, 56), scene: 'ev_meet_darius', prio: 40 },
    { id: 'garen_injury', if: { all: [R(52, 58), { flag: 'met_garen' }] }, scene: 'ev_garen_injury', prio: 20 },
    { id: 'first_love', if: { all: [{ age: '>=14' }, { age: '<=16' }, { any: [{ aff: { leo: '>=30' } }, { aff: { lucas: '>=30' } }, { aff: { darius: '>=30' } }] }] }, scene: 'ev_first_love', prio: 15 },
    // 15세
    { id: 'career15', if: R(61, 64), scene: 'ev_career15', prio: 30 },
    { id: 'secret_reveal', if: { all: [R(62, 68), { flag: 'met_morgan' }] }, scene: 'ev_secret_reveal', prio: 50, at: 'start' },
    { id: 'darius_rooftop', if: { all: [R(64, 71), { flag: 'met_darius' }] }, scene: 'ev_darius_rooftop', prio: 20, at: 'start' },
    { id: 'royal_ball', if: R(65, 70), scene: 'ev_royal_ball', prio: 25 },
    { id: 'cecilia_friend', if: { all: [R(66, 71), { flag: 'met_cecilia' }] }, scene: 'ev_cecilia_friend', prio: 15 },
    // 16세
    { id: 'career16', if: R(73, 76), scene: 'ev_career16', prio: 30 },
    { id: 'knight_exam', if: { all: [{ age: '>=16' }, { v: { combat: '>=50' } }] }, scene: 'ev_knight_exam', prio: 25 },
    { id: 'magic_exam', if: { all: [{ age: '>=16' }, { v: { magic: '>=45' } }] }, scene: 'ev_magic_exam', prio: 25 },
    { id: 'marta_sick', if: R(75, 80), scene: 'ev_marta_sick', prio: 20, at: 'start' },
    { id: 'leo_confess', if: { all: [{ age: '>=16' }, { flag: 'met_leo' }, { aff: { leo: '>=45' } }] }, scene: 'ev_leo_confess', prio: 20, at: 'start' },
    { id: 'lucas_balcony', if: { all: [{ age: '>=16' }, { flag: 'met_lucas' }, { aff: { lucas: '>=45' } }] }, scene: 'ev_lucas_balcony', prio: 20 },
    { id: 'demon_raid', if: R(81, 83), scene: 'ev_demon_raid', prio: 55, at: 'start' },
    // 17세
    { id: 'career17', if: R(85, 88), scene: 'ev_career17', prio: 30 },
    { id: 'darius_choice', if: { all: [R(86, 91), { flag: 'met_darius' }, { aff: { darius: '>=20' } }] }, scene: 'ev_darius_choice', prio: 35 },
    { id: 'letter', if: R(92, 95), scene: 'ev_letter', prio: 40, at: 'start' },
    // 상태 이벤트
    { id: 'sick', if: { v: { stress: '>=75' } }, scene: 'ev_sick', prio: 80 },
    { id: 'sick_again', if: { all: [{ flag: 'was_sick' }, { v: { stress: '>=90' } }] }, scene: 'ev_sick_again', prio: 85, once: false },
    { id: 'delinquent', if: { all: [{ age: '>=12' }, { v: { moral: '<=15' } }, { turn: '>=20' }] }, scene: 'ev_delinquent', prio: 45 },
    { id: 'delinquent2', if: { all: [{ age: '>=14' }, { flag: 'delinquent' }, { v: { moral: '<=8' } }] }, scene: 'ev_delinquent2', prio: 70, at: 'start' },
    { id: 'debt', if: { v: { money: '<0' } }, scene: 'ev_debt', prio: 90, at: 'start', once: false },
    { id: 'fame', if: { v: { fame: '>=35' } }, scene: 'ev_fame', prio: 10 },
    { id: 'novel', if: { all: [{ age: '>=13' }, { v: { sense: '>=45', int: '>=40' } }] }, scene: 'ev_novel', prio: 12 },
    { id: 'case', if: { all: [{ age: '>=13' }, { v: { int: '>=50' } }] }, scene: 'ev_case', prio: 12 },
    { id: 'miracle', if: { all: [{ age: '>=15' }, { v: { faith: '>=65', moral: '>=40' } }] }, scene: 'ev_miracle', prio: 15 },
    { id: 'gallery', if: { all: [{ age: '>=13' }, { flag: 'did_art' }, { v: { sense: '>=55' } }] }, scene: 'ev_gallery', prio: 12 },
    { id: 'tavern_first', if: { flag: 'did_tavern' }, scene: 'ev_tavern_first', prio: 30 },
    { id: 'bounty_first', if: { flag: 'did_bounty' }, scene: 'ev_bounty_first', prio: 30 },
    { id: 'dragon', if: { flag: 'did_dragon' }, scene: 'ev_dragon', prio: 30 },
    { id: 'merchant', if: { all: [{ age: '>=14' }, { v: { money: '>=2000' } }] }, scene: 'ev_merchant', prio: 10 },
    { id: 'mirror', if: { all: [{ age: '>=13' }, { v: { charm: '>=45' } }] }, scene: 'ev_mirror', prio: 8 },
    { id: 'strong', if: { all: [{ age: '>=13' }, { flag: 'met_garen' }, { v: { str: '>=45' } }] }, scene: 'ev_strong', prio: 8 },
    { id: 'scholar_invite', if: { all: [{ age: '>=14' }, { v: { int: '>=70' } }] }, scene: 'ev_scholar_invite', prio: 12 },
    { id: 'maid_palace', if: { flag: 'did_maid' }, scene: 'ev_maid_palace', prio: 20 },
    { id: 'music_night', if: { all: [{ age: '>=12' }, { flag: 'did_music' }, { v: { sense: '>=40' } }] }, scene: 'ev_music_night', prio: 8 },
    { id: 'farm_harvest', if: { all: [{ flag: 'did_farm' }, { v: { hp: '>=30' } }] }, scene: 'ev_farm_harvest', prio: 8 },
  ];
  // 매년: 생일(3월, start) · 수확제(10월) · 새해(1월, start)
  for (let a = 11; a <= 17; a++) {
    const b = 12 * (a - 10);
    events.push({ id: 'bday' + a, if: R(b, b + 2), scene: 'bday' + a, prio: 100, at: 'start' });
  }
  for (let a = 10; a <= 17; a++) {
    const b = 12 * (a - 10);
    events.push({ id: 'festival' + a, if: R(b + 7, b + 11), scene: 'festival' + a, prio: 60 });
    if (a <= 16) events.push({ id: 'newyear' + a, if: R(b + 10, b + 11), scene: 'ev_newyear', prio: 5, at: 'start' });
  }

  // ---------- 등록 ----------
  STORY.register({
    id: 'raise',
    genre: '육성 시뮬레이션',
    title: '별을 키우는 용사',
    subtitle: '마왕을 봉인한 손으로, 이번엔 딸을 키운다',
    blurb: '마왕을 봉인한 용사에게 떨어진 마지막 임무는 불탄 마을에서 온 열 살 고아 소녀를 열여덟 살 성년식까지 키우는 것. 매달 공부와 아르바이트와 휴식을 짜고, 무엇보다 딸과 대화하라. 그 아이의 목에 걸린 은빛 별 펜던트에는 멸망한 왕국의 비밀이 잠들어 있다.',
    cover: { bg: 'house_day', c: 'daughter', e: 'smile' },
    world: '에렌시아 왕국의 왕도 루멘하르트. 석 달 전, 용사 {name}와 동료들(방패잡이 가렌, 성직자 엘레나 등)이 마왕 노크투르를 북쪽 마왕성에 봉인하면서 긴 전쟁이 끝났다. 전쟁 초기, 북방의 별의 왕국 아스트렐은 마왕군에게 하룻밤 만에 멸망했는데, 아스트렐 왕가의 피만이 마왕을 봉인하거나 깨울 수 있었기 때문이다. 국왕 레오폴트 4세는 할 일이 없어진 용사에게 국경의 불탄 마을에서 발견된 열 살 고아 소녀를 맡겼다. 소녀는 여덟 꼭지 별 모양 은 펜던트를 하고 있으며, 사실 아스트렐의 마지막 공주 세레스티아다. 마족 잔당은 그녀의 피로 봉인을 풀거나 그녀를 「밤의 여왕」으로 세우려 한다. 이야기는 용사가 딸을 키우는 8년(10~18세)을 다루며, 톤은 따뜻하고 유머러스하고 가끔 애틋하다. 화폐 단위는 G(골드).',
    player: { label: '용사의 이름', def: '아레스' },
    vars: { money: 500, stress: 0, fame: 0 },
    affStart: { daughter: 20, daughter_teen: 20, daughter_adult: 20, marta: 40, garen: 50, morgan: 0, lucas: 0, cecilia: 0, leo: 0, elena: 10, darius: 0 },
    stats: [
      { id: 'hp', name: '체력', max: 100, color: '#e06666' },
      { id: 'str', name: '근력', max: 100, color: '#d98a3d' },
      { id: 'int', name: '지능', max: 100, color: '#7aa2ff' },
      { id: 'grace', name: '기품', max: 100, color: '#c9a7e8' },
      { id: 'charm', name: '매력', max: 100, color: '#f28ab2' },
      { id: 'moral', name: '도덕', max: 100, color: '#8fd19e' },
      { id: 'faith', name: '신앙', max: 100, color: '#f2e27a' },
      { id: 'sense', name: '감수성', max: 100, color: '#7ad1d1' },
      { id: 'combat', name: '무예', max: 100, color: '#b85c5c' },
      { id: 'magic', name: '마력', max: 100, color: '#a58cff' },
      { id: 'house', name: '가사', max: 100, color: '#c9a36b' },
    ],
    chars,
    start: 'prologue',
    scenes: SC,
    endings,
    endingRules,
    sim: {
      unit: 'month',
      start: { year: 1, month: 3 },
      yearLabel: '왕국력 {y}년 {m}월',
      turns: 96,
      ageStart: 10,
      slots: 3,
      slotNames: ['상순', '중순', '하순'],
      hubChar: 'daughter',
      hubCharByAge: { 14: 'daughter_teen', 17: 'daughter_adult' },
      hubBg: 'house_day',
      hubBgNight: 'house_night',
      money: 'money',
      hud: ['money', 'stress', 'fame'],
      activities,
      shop,
      events,
      turnFx: { v: { money: 60 } },
      finale: 'finale',
    },
  });
})();
