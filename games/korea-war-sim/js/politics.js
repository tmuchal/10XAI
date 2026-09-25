// 한반도 대전략 — domestic politics: regimes, factions, decrees, espionage, political events
'use strict';

const FACTIONS = ['army', 'sec', 'party', 'biz', 'people'];
const FACTION_BASE = { army: '군부', sec: '정보·보안기관', party: '관료', biz: '재계', people: '민중' };
// Label for the "party" faction and faction weights per regime
const REGIMES = {
  democracy:     { party: '의회·여당', w: { army: 0.12, sec: 0.05, party: 0.18, biz: 0.25, people: 0.4 }, elections: 36, coupMult: 0.3 },
  authoritarian: { party: '집권당·관료', w: { army: 0.25, sec: 0.25, party: 0.2, biz: 0.15, people: 0.15 }, elections: 72, rigged: true, coupMult: 0.8 },
  oneparty:      { party: '당 중앙위원회', w: { army: 0.25, sec: 0.2, party: 0.35, biz: 0.08, people: 0.12 }, coupMult: 0.7 },
  monarchy:      { party: '왕실', w: { army: 0.25, sec: 0.2, party: 0.35, biz: 0.1, people: 0.1 }, coupMult: 0.6 },
  theocracy:     { party: '성직자·혁명수비대', w: { army: 0.2, sec: 0.25, party: 0.35, biz: 0.08, people: 0.12 }, coupMult: 0.6 },
  junta:         { party: '군사평의회', w: { army: 0.45, sec: 0.25, party: 0.1, biz: 0.1, people: 0.1 }, coupMult: 1.3 },
};
const LEADER_TITLES = ['대통령', '총통', '국가주석', '위원장', '최고지도자', '원수', '영도자', '황제'];

// Decrees. fx keys: fac {faction: delta}, stab, rep, money, mp, power, fuel, flag, flagTurns, gov, rel (neighbors), special
const DECREES = [
  { id: 'speech', cat: '선전', name: '대국민 담화', cost: 5, cd: 3, desc: '국영 방송으로 지도자의 결의를 알린다.', fx: { fac: { people: 4 }, stab: 2 } },
  { id: 'propaganda', cat: '선전', name: '선전선동 총력전', cost: 18, cd: 6, desc: '6턴간 전쟁 피로도 -50%. 국제 평판 소폭 하락.', fx: { fac: { people: 5, party: 3 }, stab: 3, rep: -2, flag: 'propaganda', flagTurns: 6 } },
  { id: 'cult', cat: '선전', name: '개인숭배 확립', cost: 35, once: true, need: { power: 40, notGov: ['democracy'] }, desc: '초상화·동상·찬가. 매 턴 안정도 +0.4 영구. 국제 평판 -8.', fx: { fac: { party: 10, people: 5, sec: 5 }, stab: 6, rep: -8, power: 10, flag: 'cult' } },
  { id: 'nationalism', cat: '선전', name: '민족주의 고취', cost: 10, cd: 8, desc: '안정도와 민심이 오르지만 이웃 나라와 관계가 나빠진다.', fx: { fac: { people: 7, army: 4 }, stab: 5, rep: -5, rel: -10 } },
  { id: 'media', cat: '치안', name: '언론·인터넷 통제', cost: 15, once: true, need: { notGov: ['democracy'] }, desc: '반정부 사건 발생 감소, 전쟁 피로도 -30% 영구. 민심 -6.', fx: { fac: { sec: 6, people: -6 }, rep: -6, power: 8, flag: 'media' } },
  { id: 'secpolice', cat: '치안', name: '비밀경찰 확대', cost: 25, cd: 8, desc: '쿠데타·봉기 위험 감소. 민심 -8.', fx: { fac: { sec: 15, people: -8 }, power: 8, rep: -3 } },
  { id: 'martial', cat: '치안', name: '비상계엄 선포', cost: 10, once: true, need: { gov: ['democracy'] }, desc: '의회를 해산하고 군사정권을 세운다. 선거 폐지. 서방의 제재가 시작된다.', fx: { fac: { army: 15, sec: 10, people: -20, biz: -6, party: -25 }, stab: -6, rep: -30, power: 25, gov: 'junta', special: 'coupSelf' } },
  { id: 'lifelong', cat: '치안', name: '헌법 개정 · 종신 집권', cost: 20, once: true, need: { gov: ['junta', 'authoritarian'], power: 45 }, desc: '임기 제한을 없앤다. 권력 기반 +25.', fx: { fac: { party: 10, people: -8 }, rep: -10, power: 25, flag: 'lifelong' } },
  { id: 'purge_army', cat: '숙청', name: '군부 숙청', cost: 10, cd: 12, need: { notGov: ['democracy'] }, desc: '반란 싹을 자른다. 군부는 두려움에 복종하지만 4턴간 지휘 공백 (전투력 -12%).', fx: { fac: { army: 25, sec: 5, people: -3 }, stab: -4, power: 12, flag: 'purgeArmy', flagTurns: 4, special: 'purge' } },
  { id: 'purge_party', cat: '숙청', name: '당·관료 숙청', cost: 10, cd: 12, need: { notGov: ['democracy'] }, desc: '정적을 제거한다. 3턴간 행정 마비 (수입 -10%).', fx: { fac: { party: 20, sec: 5 }, stab: -3, power: 12, flag: 'purgeParty', flagTurns: 3, special: 'purge' } },
  { id: 'nationalize', cat: '경제', name: '재벌·과두 재산 몰수', cost: 0, cd: 20, desc: '거대 기업 자산을 국유화한다. 막대한 일시 수입, 재계 붕괴, 6턴간 경제 -15%.', fx: { fac: { biz: -35, people: 10 }, rep: -8, money: 'nationalize', flag: 'econShock', flagTurns: 6, power: 6 } },
  { id: 'taxcut', cat: '경제', name: '재계 감세', cost: 40, cd: 8, desc: '재계의 지지를 산다.', fx: { fac: { biz: 15, people: -3 } } },
  { id: 'bread', cat: '경제', name: '배급 확대 · 빵과 서커스', cost: 30, cd: 5, desc: '민중을 달랜다.', fx: { fac: { people: 12 }, stab: 3 } },
  { id: 'bonus', cat: '군사', name: '군 특별 상여금', cost: 40, cd: 4, desc: '장성들의 충성을 산다.', fx: { fac: { army: 15 } } },
  { id: 'mobilize', cat: '군사', name: '총동원령', cost: 0, cd: 12, desc: '예비군과 민간인을 징집한다. 인력 대폭 증가, 민심·재계 반발, 4턴간 경제 -10%.', fx: { fac: { people: -12, biz: -8, army: 5 }, mp: 'mobilize', stab: -3, flag: 'mobilized', flagTurns: 4 } },
  { id: 'wareco_decree', cat: '군사', name: '전시 경제 전환', cost: 0, cd: 10, desc: '8턴간 부대 생산비 -20%, 연구 -30%.', fx: { fac: { biz: -5, army: 5 }, flag: 'warEconomy', flagTurns: 8 } },
  { id: 'nukeprog', cat: '군사', name: '핵무기 개발 착수', cost: 60, once: true, need: { noNukes: true }, desc: '핵분열 무기 연구를 허가한다. 서방 제재와 평판 -25.', fx: { rep: -25, fac: { army: 8, people: 4 }, flag: 'nukeProgram', special: 'nukeprog' } },
  { id: 'amnesty', cat: '유화', name: '정치범 사면 · 민주화 약속', cost: 10, cd: 10, desc: '민심과 평판이 회복되지만 권력 기반이 약해진다.', fx: { fac: { people: 15, sec: -10, army: -5 }, rep: 10, power: -15, stab: 3 } },
  { id: 'successor', cat: '유화', name: '후계자 지명', cost: 5, once: true, need: { notGov: ['democracy'] }, desc: '권력 승계 구도를 확정해 쿠데타 동기를 줄인다.', fx: { fac: { party: 8, army: 4 }, stab: 4, power: 6, flag: 'successor' } },
  { id: 'rig', cat: '유화', name: '선거 조작 준비', cost: 25, cd: 12, need: { elections: true }, desc: '다음 선거를 확실히 이긴다. 발각되면 대규모 시위.', fx: { rep: -12, flag: 'rigged', special: 'rig' } },
  { id: 'energyweapon', cat: '외교', name: '에너지 무기화 (수출 중단)', cost: 0, cd: 10, need: { oilExporter: true }, desc: '적국과 중립국에 원유 공급을 끊는다. 적국 연료 -30, 자국 수입 감소.', fx: { rep: -6, special: 'energy' } },
];

// Espionage operations against a target nation
const OPS = [
  { id: 'recon', name: '정보 수집', cost: 10, base: 0.85, desc: '3턴간 대상국 부대 위치 파악' },
  { id: 'sabotage', name: '산업 사보타주', cost: 20, base: 0.6, desc: '대상국 다음 달 수입 -20%' },
  { id: 'steal', name: '기술 탈취', cost: 25, base: 0.45, desc: '대상국이 보유한 기술 하나의 연구 진척 확보' },
  { id: 'disinfo', name: '허위정보 캠페인', cost: 15, base: 0.65, desc: '대상국 안정도 -6' },
  { id: 'assassinate', name: '요인 암살', cost: 40, base: 0.3, desc: '대상국 안정도 -15. 실패 시 평판 -15, 관계 -40' },
  { id: 'coup', name: '정권 전복 공작', cost: 60, base: 0.12, desc: '성공 시 친(親)자국 정권 수립: 강화·동맹. 대상 안정도가 낮을수록 유리' },
  { id: 'proxy', name: '반군·대리 세력 지원', cost: 30, base: 0.55, desc: '대상국 도시 2곳 방어력 -30, 안정도 -5' },
];

// Political events that only fire for the player (built dynamically in engine/ui)
const POL_EVENTS = {
  coup: { title: '쿠데타 기도', text: '새벽 3시, 수도방위사령부 일부 부대가 방송국과 대통령궁으로 진격하고 있습니다. 반란군 지휘관들이 지도자의 퇴진을 요구합니다.' },
  uprising: { title: '민중 봉기', text: '수도 중심 광장에 수십만 명이 모여 정권 퇴진을 외치고 있습니다. 시위대 일부가 관공서를 점거했습니다.' },
  election: { title: '선거의 날', text: '대통령 선거가 다가왔습니다. 여론조사 결과에 정권의 운명이 달려 있습니다.' },
  assassination: { title: '암살 미수', text: '지도자의 차량 행렬이 폭발물 공격을 받았습니다. 경호원 두 명이 사망했고 배후는 불분명합니다.' },
  scandal: { title: '부정선거 폭로', text: '개표 조작 증거가 외신에 유출되었습니다. 거리로 사람들이 쏟아져 나옵니다.' },
};

// Flavor events tied to specific nations (nuance). fx like decrees; nations: which nations can get it
const NATION_EVENTS = [
  { n: ['KOR'], title: '재벌 총수 소환', text: '검찰이 방산 재벌 총수를 뇌물 혐의로 소환했습니다.', choices: [{ label: '법대로 처리', fx: { fac: { biz: -10, people: 8 }, rep: 3 } }, { label: '특별사면', fx: { fac: { biz: 12, people: -8 } } }] },
  { n: ['KOR'], title: '광장의 촛불', text: '수백만 개의 촛불이 광화문을 메웠습니다. 전쟁 방식에 대한 불만이 터져 나옵니다.', choices: [{ label: '국민과 대화', fx: { fac: { people: 10 }, power: -5 } }, { label: '차벽 봉쇄', fx: { fac: { people: -10, sec: 5 }, stab: -2 } }] },
  { n: ['PRK'], title: '장마당 단속', text: '보위부가 장마당의 외화 거래를 대대적으로 단속하려 합니다.', choices: [{ label: '단속 강행', fx: { fac: { sec: 8, people: -10 }, money: 15 } }, { label: '묵인', fx: { fac: { people: 6, biz: 6 }, power: -3 } }] },
  { n: ['PRK'], title: '고난의 행군 재현 우려', text: '흉작과 제재로 지방에서 아사자가 나오기 시작했습니다.', choices: [{ label: '군량미 방출', fx: { fac: { people: 12, army: -8 }, stab: 3 } }, { label: '군 우선 배급 유지', fx: { fac: { army: 6, people: -12 }, stab: -3 } }] },
  { n: ['PRK', 'CHN', 'VNM'], title: '당 전원회의', text: '당 중앙위원회 전원회의가 소집되었습니다. 노선 투쟁이 벌어집니다.', choices: [{ label: '강경파 중용', fx: { fac: { army: 8, party: 5, biz: -5 } } }, { label: '실용파 중용', fx: { fac: { biz: 8, party: 3, army: -4 } } }] },
  { n: ['CHN'], title: '부동산 기업 연쇄 부도', text: '대형 부동산 개발사가 채무 불이행을 선언했습니다. 지방정부 재정이 흔들립니다.', choices: [{ label: '국유은행 구제금융', fx: { money: -40, fac: { biz: 8 } } }, { label: '시장에 맡긴다', fx: { fac: { people: -8, biz: -10 }, stab: -3 } }] },
  { n: ['CHN'], title: '대만 통일 여론 고조', text: '관영매체와 인터넷에서 "무력 통일" 요구가 들끓습니다.', choices: [{ label: '여론 활용', fx: { fac: { people: 8, army: 6 }, rep: -5 } }, { label: '검열로 진정', fx: { fac: { sec: 4, people: -3 } } }] },
  { n: ['RUS'], title: '용병 집단 반란', text: '민간군사기업 지휘관이 국방부 수뇌부 교체를 요구하며 모스크바로 진격을 선언했습니다.', choices: [{ label: '협상·망명 보장', fx: { fac: { army: -10, sec: -5 }, power: -8 } }, { label: '진압 명령', fx: { fac: { sec: 10, army: 5 }, stab: -5, mp: -20 } }] },
  { n: ['RUS'], title: '올리가르히의 불만', text: '제재로 해외 자산을 잃은 재벌들이 불만을 품고 있습니다.', choices: [{ label: '국내 자산 보상', fx: { money: -30, fac: { biz: 12 } } }, { label: '창문 사고 경고', fx: { fac: { biz: -10, sec: 8 }, power: 6, rep: -4 } }] },
  { n: ['USA'], title: '의회 전쟁권한 결의', text: '의회가 전쟁권한법에 따라 해외 파병 철수 표결을 추진합니다.', choices: [{ label: '의회 설득', fx: { money: -20, fac: { party: 8 } } }, { label: '행정명령 강행', fx: { fac: { party: -12, people: -5 }, power: 5 } }] },
  { n: ['USA'], title: '방위산업 증산 요구', text: '탄약 재고가 바닥나 방산업체들이 증산 계약을 요구합니다.', choices: [{ label: '국방물자생산법 발동', fx: { money: -40, fac: { biz: 12, army: 5 } } }, { label: '동맹국에 분담 요구', fx: { rel: -5, money: 20 } }] },
  { n: ['JPN'], title: '평화헌법 개정 논쟁', text: '자위대를 헌법에 명기하는 개헌안이 발의되었습니다.', choices: [{ label: '개헌 추진', fx: { fac: { army: 10, people: -6 }, rel: -6, special: 'dropPeaceConst' } }, { label: '보류', fx: { fac: { people: 4 } } }] },
  { n: ['JPN'], title: '야스쿠니 참배 논란', text: '각료들이 야스쿠니 신사 참배를 예고했습니다.', choices: [{ label: '참배 허용', fx: { fac: { party: 6 }, rel: -8 } }, { label: '자제 지시', fx: { fac: { party: -3 } } }] },
  { n: ['IRN'], title: '히잡 시위 재점화', text: '도덕경찰의 단속 과정에서 여성이 숨지자 전국에서 시위가 일어났습니다.', choices: [{ label: '바시즈 투입', fx: { fac: { sec: 8, people: -14 }, rep: -8 } }, { label: '단속 완화', fx: { fac: { people: 10, party: -8 } } }] },
  { n: ['ISR'], title: '사법개혁 반대 시위', text: '사법부 권한 축소 법안에 반대해 예비군 조종사들이 복무 거부를 선언했습니다.', choices: [{ label: '법안 철회', fx: { fac: { people: 8, army: 8, party: -10 } } }, { label: '강행 처리', fx: { fac: { army: -10, people: -8 }, power: 6 } }] },
  { n: ['TUR'], title: '리라화 폭락', text: '통화 가치가 하루 만에 15% 떨어졌습니다.', choices: [{ label: '금리 인상', fx: { fac: { biz: -6, people: 4 }, money: -15 } }, { label: '저금리 고수', fx: { fac: { people: -8 }, stab: -3 } }] },
  { n: ['IND', 'PAK'], title: '카슈미르 긴장', text: '실질통제선(LoC)에서 포격전이 벌어졌습니다.', choices: [{ label: '보복 타격', fx: { fac: { army: 8, people: 6 }, rel: -15 } }, { label: '외교 채널 가동', fx: { rep: 4 } }] },
  { n: ['UKR'], title: '서방 무기 지원 패키지', text: '동맹국이 새로운 무기 지원 패키지를 발표했습니다.', choices: [{ label: '장거리 무기 요청', fx: { money: 50, special: 'grantMissiles' } }, { label: '방공 체계 요청', fx: { money: 40, special: 'grantSam' } }] },
  { n: ['GBR'], title: '스코틀랜드 독립 투표 요구', text: '스코틀랜드 의회가 두 번째 독립 주민투표를 요구합니다.', choices: [{ label: '거부', fx: { fac: { people: -5 }, stab: -2 } }, { label: '투표 허용', fx: { fac: { people: 5 }, stab: -4, power: -5 } }] },
  { n: ['FRA'], title: '연금개혁 총파업', text: '노조가 무기한 총파업에 들어갔습니다. 정유소가 멈췄습니다.', choices: [{ label: '49조 3항 강행', fx: { fac: { people: -10 }, power: 5, fuel: -10 } }, { label: '양보', fx: { fac: { people: 8, biz: -5 }, money: -20 } }] },
  { n: ['DEU'], title: '에너지 위기', text: '겨울을 앞두고 가스 가격이 폭등했습니다.', choices: [{ label: '원전 가동 연장', fx: { fuel: 20, fac: { people: -3 } } }, { label: '보조금 지급', fx: { money: -35, fac: { people: 6 } } }] },
  { n: ['TWN'], title: 'TSMC 해외 공장 이전 압박', text: '동맹국이 첨단 공정 이전을 요구합니다.', choices: [{ label: '일부 이전', fx: { rel: 12, fac: { biz: -6 } } }, { label: '"실리콘 방패" 유지', fx: { fac: { biz: 8 }, rel: -5 } }] },
  { n: ['SAU'], title: 'OPEC+ 감산 결정', text: '원유 감산 여부를 결정해야 합니다.', choices: [{ label: '감산 (유가 방어)', fx: { money: 40, rel: -8 } }, { label: '증산 (서방 요청)', fx: { money: 10, rel: 8 } }] },
  { n: ['EGY'], title: '수에즈 운하 통행료 급감', text: '홍해 위기로 선박들이 희망봉으로 우회하고 있습니다.', choices: [{ label: '홍해 호위 참여', fx: { money: 15, rel: 5 } }, { label: '관망', fx: { money: -15 } }] },
  { n: ['POL', 'LTU', 'LVA', 'EST', 'FIN'], title: '국경 하이브리드 도발', text: '국경에 난민을 밀어내는 하이브리드 공격이 시작되었습니다.', choices: [{ label: '국경 장벽 강화', fx: { money: -15, fac: { people: 5, army: 4 } } }, { label: '인도적 수용', fx: { rep: 6, fac: { people: -4 } } }] },
];

// ---------- cabinet ----------
const POSTS = [
  { id: 'defense',  name: '국방장관',     fac: 'army',  desc: '지상·해상 공격력 ±2%/등급' },
  { id: 'chief',    name: '합참의장',     fac: 'army',  desc: '전투 사기 ±2%/등급, 전략가면 공격 +5%' },
  { id: 'intel',    name: '정보기관장',   fac: 'sec',   desc: '첩보 성공률 ±5%/등급, 적 공작 방어' },
  { id: 'interior', name: '내무·치안장관', fac: 'sec',   desc: '봉기 위험 ∓2%p/등급' },
  { id: 'economy',  name: '경제·재무장관', fac: 'biz',   desc: '예산 수입 ±3%/등급' },
  { id: 'foreign',  name: '외교장관',     fac: 'party', desc: '강화 수락 ±5%/등급, 관계 개선 효과 증가' },
];
// Regime-specific titles for the same posts
const POST_TITLES = {
  PRK: { defense: '국방상', chief: '총참모장', intel: '국가보위상', interior: '사회안전상', economy: '내각총리', foreign: '외무상' },
  CHN: { defense: '중앙군사위 부주석', chief: '연합참모부 참모장', intel: '국가안전부장', interior: '공안부장', economy: '국무원 총리', foreign: '외교부장' },
  RUS: { defense: '국방장관', chief: '총참모장', intel: 'FSB 국장', interior: '국가근위대 사령관', economy: '총리', foreign: '외무장관' },
  USA: { defense: '국방장관', chief: '합참의장', intel: 'CIA 국장', interior: '국토안보부 장관', economy: '재무장관', foreign: '국무장관' },
  IRN: { defense: '국방장관', chief: '혁명수비대 총사령관', intel: '정보부 장관', interior: '내무장관', economy: '경제장관', foreign: '외무장관' },
  JPN: { defense: '방위대신', chief: '통합막료장', intel: '내각정보관', interior: '국가공안위원장', economy: '재무대신', foreign: '외무대신' },
};
const MINISTER_TRAITS = {
  loyal:     { name: '충신',     desc: '충성도가 매달 오른다' },
  ambitious: { name: '야심가',   desc: '야망이 매달 커진다' },
  corrupt:   { name: '부패',     desc: '담당 분야 효율 -1등급, 비자금 상납 +3/턴' },
  hawk:      { name: '강경파',   desc: '군부 충성 +, 국제 평판 -' },
  technocrat:{ name: '기술관료', desc: '능력 +1등급으로 취급' },
  demagogue: { name: '선동가',   desc: '민심 +0.5/턴' },
  strategist:{ name: '전략가',   desc: '합참의장이면 공격 +5%' },
  inept:     { name: '무능',     desc: '능력 -1등급으로 취급' },
};
const NAME_POOLS = {
  ko: { sur: ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'], given: ['영철', '성호', '민준', '정훈', '태식', '광수', '재혁', '동원', '상철', '명길', '혜진', '수영', '경희', '병철', '용남', '철민', '정일', '승우', '현주', '대성'], order: 'sg' },
  zh: { sur: ['왕', '리', '장', '류', '천', '양', '황', '자오', '저우', '우', '쉬', '쑨', '마', '주', '후'], given: ['젠궈', '웨이', '밍', '하이펑', '즈창', '샤오린', '융', '창칭', '리핑', '궈량', '신화', '쥔', '롱', '타오'], order: 'sg' },
  ja: { sur: ['사토', '스즈키', '다카하시', '다나카', '와타나베', '이토', '야마모토', '나카무라', '고바야시', '가토'], given: ['히로시', '다케시', '겐지', '유키', '아키라', '마사오', '도모코', '신지', '료', '가즈키'], order: 'sg' },
  ru: { sur: ['이바노프', '페트로프', '스미르노프', '볼코프', '소콜로프', '쿠즈네초프', '모로조프', '파블로프', '코발렌코', '셰브첸코'], given: ['세르게이', '알렉세이', '드미트리', '이고르', '니콜라이', '안드레이', '올가', '유리', '파벨', '빅토르'], order: 'gs' },
  me: { sur: ['호세이니', '라시디', '카리미', '알하셈', '유수프', '하다드', '사이드', '만수르', '아지즈', '칸'], given: ['하산', '알리', '레자', '아흐마드', '모하마드', '파티마', '오마르', '카림', '타리크', '자밀'], order: 'gs' },
  we: { sur: ['존슨', '밀러', '해리스', '워커', '클라크', '베르나르', '슈미트', '로시', '코발스키', '마르탱', '헤이스', '브룩스'], given: ['제임스', '로버트', '마이클', '데이비드', '캐서린', '엘리자베스', '토마스', '안나', '마르코', '장', '클라우스', '헬렌'], order: 'gs' },
};
const CULTURE = { KOR: 'ko', PRK: 'ko', CHN: 'zh', TWN: 'zh', JPN: 'ja', RUS: 'ru', UKR: 'ru', BLR: 'ru', KAZ: 'ru', IRN: 'me', SAU: 'me', EGY: 'me', PAK: 'me', TUR: 'me', IRQ: 'me', SYR: 'me', AFG: 'me' };
const SLUSH_EVENTS = {
  plot: { title: '각료의 비밀 회동', text: '정보 보고에 따르면 한 각료가 군 지휘관들과 심야에 비밀 회동을 가졌습니다. 권력 공백을 노리는 움직임으로 보입니다.' },
  scandal: { title: '비자금 의혹 보도', text: '해외 언론이 지도자 일가의 해외 계좌 내역을 입수해 보도했습니다.' },
};
