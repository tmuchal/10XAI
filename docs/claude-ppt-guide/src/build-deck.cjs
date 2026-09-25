// Sample company deck: "Q3 2026 business results" — the kind of deck the video walks through.
// All figures are illustrative sample data. Charts are native PowerPoint charts (editable).
// Usage: node build-deck.cjs <out.pptx>
const pptxgen = require("pptxgenjs");

const OUT = process.argv[2] || "sample-company-deck.pptx";
const C = {
  navy: "16213E", ink: "1F2937", muted: "6B7280", line: "E5E7EB",
  bg: "FFFFFF", tint: "F3F6FA", teal: "0F7B8A", tealLt: "9FD3D9",
  accent: "FF6B35", good: "2E9E6B", bad: "D64545", white: "FFFFFF",
};
const F = "Malgun Gothic";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "2026년 3분기 경영실적 보고";
pres.company = "누리테크 (예시)";

const W = 13.33, M = 0.6;

function title(slide, text, sub) {
  slide.addText(text, { x: M, y: 0.45, w: W - 2 * M, h: 0.8, fontFace: F, fontSize: 28, bold: true, color: C.navy, margin: 0, isTextBox: true });
  if (sub) slide.addText(sub, { x: M, y: 1.2, w: W - 2 * M, h: 0.4, fontFace: F, fontSize: 14, color: C.muted, margin: 0, isTextBox: true });
}
function footer(slide, n, src) {
  slide.addText(src || "출처: 사내 ERP 매출 데이터 (예시 데이터)", { x: M, y: 7.0, w: 8, h: 0.3, fontFace: F, fontSize: 10, color: C.muted, margin: 0, isTextBox: true });
  slide.addText(String(n), { x: W - M - 0.5, y: 7.0, w: 0.5, h: 0.3, fontFace: F, fontSize: 10, color: C.muted, align: "right", margin: 0, isTextBox: true });
}
function dot(slide, x, y, color, label) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.42, h: 0.42, fill: { color } });
  slide.addText(label, { x, y, w: 0.42, h: 0.42, fontFace: F, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
}

// 1. Title (dark)
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.OVAL, { x: 9.2, y: -1.4, w: 5.6, h: 5.6, fill: { color: C.teal, transparency: 55 } });
  s.addShape(pres.shapes.OVAL, { x: 11.1, y: 3.9, w: 3.2, h: 3.2, fill: { color: C.accent, transparency: 25 } });
  s.addText("2026년 3분기 경영실적 보고", { x: M + 0.2, y: 2.3, w: 9, h: 1.0, fontFace: F, fontSize: 40, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText("매출 18% 성장 — 온라인 채널이 성장을 견인", { x: M + 0.2, y: 3.35, w: 9, h: 0.6, fontFace: F, fontSize: 20, color: C.tealLt, margin: 0, isTextBox: true });
  s.addText("경영기획팀  |  2026.10.02  |  대외비", { x: M + 0.2, y: 5.9, w: 8, h: 0.4, fontFace: F, fontSize: 13, color: "AAB4C8", margin: 0, isTextBox: true });
  s.addNotes("오프닝: 결론부터. 3분기 매출 482억, 전년 대비 18% 성장.");
}

// 2. Executive summary — big stat callouts
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "핵심 요약: 매출·이익·고객 모두 전년 대비 개선", "3분기 실적 한눈에 보기");
  const stats = [
    ["482억", "3분기 매출", "+18% YoY", C.teal],
    ["12.4%", "영업이익률", "+2.1%p YoY", C.navy],
    ["3,240", "신규 고객 수", "+35% YoY", C.accent],
  ];
  const cw = 3.8, gap = 0.36, y = 1.95;
  stats.forEach(([big, label, delta, col], i) => {
    const x = M + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: 2.3, fill: { color: C.tint }, rectRadius: 0.12 });
    s.addText(big, { x: x + 0.35, y: y + 0.3, w: cw - 0.7, h: 1.0, fontFace: F, fontSize: 48, bold: true, color: col, margin: 0, isTextBox: true });
    s.addText(label, { x: x + 0.35, y: y + 1.35, w: cw - 0.7, h: 0.4, fontFace: F, fontSize: 16, color: C.ink, margin: 0, isTextBox: true });
    s.addText(delta, { x: x + 0.35, y: y + 1.75, w: cw - 0.7, h: 0.35, fontFace: F, fontSize: 14, bold: true, color: C.good, margin: 0, isTextBox: true });
  });
  const msgs = [
    "온라인 채널 매출 +69억 — 전체 성장분(+74억)의 대부분",
    "원가 절감 8.1억이 영업이익 개선폭의 약 45% 기여",
    "4분기: 온라인 전용 상품 출시와 파트너 재계약에 집중",
  ];
  msgs.forEach((m, i) => {
    const yy = 4.65 + i * 0.68;
    dot(s, M, yy, [C.teal, C.navy, C.accent][i], String(i + 1));
    s.addText(m, { x: M + 0.65, y: yy - 0.02, w: 11, h: 0.46, fontFace: F, fontSize: 16, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
  });
  footer(s, 2);
}

// 3. Revenue trend — native clustered column
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "3분기 매출 482억, 전년 동기 대비 18% 성장", "분기별 매출 (단위: 억 원)");
  s.addChart(pres.charts.BAR, [
    { name: "2025년", labels: ["1분기", "2분기", "3분기"], values: [368, 385, 408] },
    { name: "2026년", labels: ["1분기", "2분기", "3분기"], values: [412, 447, 482] },
  ], {
    x: M, y: 1.75, w: 7.8, h: 5.0, barDir: "col", barGapWidthPct: 60,
    chartColors: [C.tealLt, C.teal],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontFace: F, dataLabelFontSize: 12, dataLabelColor: C.ink,
    catAxisLabelFontFace: F, catAxisLabelFontSize: 13, catAxisLabelColor: C.ink,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    catAxisLineShow: true, catAxisLineColor: C.line,
    showLegend: true, legendPos: "t", legendFontFace: F, legendFontSize: 12, legendColor: C.ink,
  });
  const x = 8.75, w = W - M - x;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w, h: 4.6, fill: { color: C.tint }, rectRadius: 0.12 });
  s.addText("+74억", { x: x + 0.3, y: 2.2, w: w - 0.6, h: 0.8, fontFace: F, fontSize: 40, bold: true, color: C.accent, margin: 0, isTextBox: true });
  s.addText("전년 동기 대비 증가액", { x: x + 0.3, y: 3.0, w: w - 0.6, h: 0.35, fontFace: F, fontSize: 13, color: C.muted, margin: 0, isTextBox: true });
  s.addText([
    { text: "6개 분기 연속 성장", options: { bullet: true, breakLine: true } },
    { text: "2분기 대비 +35억 (+7.8%)", options: { bullet: true, breakLine: true } },
    { text: "연간 목표 1,800억 대비 누적 달성률 74%", options: { bullet: true } },
  ], { x: x + 0.3, y: 3.6, w: w - 0.6, h: 2.6, fontFace: F, fontSize: 13, color: C.ink, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });
  footer(s, 3);
}

// 4. Channel mix — native stacked column
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "온라인 비중 20% → 31%, 성장분 대부분을 온라인이 만들었다", "채널별 3분기 매출 (단위: 억 원)");
  s.addChart(pres.charts.BAR, [
    { name: "직접영업", labels: ["2025년 3분기", "2026년 3분기"], values: [210, 205] },
    { name: "파트너", labels: ["2025년 3분기", "2026년 3분기"], values: [118, 128] },
    { name: "온라인", labels: ["2025년 3분기", "2026년 3분기"], values: [80, 149] },
  ], {
    x: M, y: 1.75, w: 6.4, h: 5.1, barDir: "col", barGrouping: "stacked", barGapWidthPct: 70,
    chartColors: [C.navy, C.tealLt, C.accent],
    showValue: true, dataLabelPosition: "ctr", dataLabelFontFace: F, dataLabelFontSize: 13, dataLabelColor: C.white, dataLabelFontBold: true,
    catAxisLabelFontFace: F, catAxisLabelFontSize: 13, catAxisLabelColor: C.ink,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "r", legendFontFace: F, legendFontSize: 12, legendColor: C.ink,
  });
  const rows = [
    ["온라인", "+69억", "+86%", C.accent],
    ["파트너", "+10억", "+8%", C.teal],
    ["직접영업", "−5억", "−2%", C.navy],
  ];
  const x = 7.6;
  s.addText("채널별 증감 (전년 동기 대비)", { x, y: 2.0, w: 5, h: 0.4, fontFace: F, fontSize: 16, bold: true, color: C.navy, margin: 0, isTextBox: true });
  rows.forEach(([ch, amt, pct, col], i) => {
    const y = 2.6 + i * 1.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: W - M - x, h: 0.85, fill: { color: C.tint }, rectRadius: 0.1 });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.28, w: 0.3, h: 0.3, fill: { color: col } });
    s.addText(ch, { x: x + 0.75, y, w: 1.8, h: 0.85, fontFace: F, fontSize: 16, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
    s.addText(amt, { x: x + 2.6, y, w: 1.4, h: 0.85, fontFace: F, fontSize: 20, bold: true, color: amt.startsWith("−") ? C.bad : C.good, valign: "middle", align: "right", margin: 0, isTextBox: true });
    s.addText(pct, { x: x + 4.0, y, w: 1.0, h: 0.85, fontFace: F, fontSize: 14, color: C.muted, valign: "middle", align: "right", margin: 0, isTextBox: true });
  });
  s.addText("시사점: 온라인 전용 상품과 구독형 가격제가 신규 고객 유입을 주도", { x, y: 5.9, w: W - M - x, h: 0.8, fontFace: F, fontSize: 14, italic: true, color: C.teal, margin: 0, isTextBox: true });
  footer(s, 4);
}

// 5. Operating profit bridge — waterfall built from shapes (pptxgenjs has no native waterfall)
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "영업이익 42.0억 → 59.8억, 원가 절감이 개선폭의 약 45% 기여", "영업이익 증감 분석 (단위: 억 원, 전년 동기 대비)");
  const steps = [
    { l: "25년 3분기\n영업이익", v: 42.0, t: "total" },
    { l: "매출 증가\n효과", v: 13.2 },
    { l: "원가 절감", v: 8.1, hi: true },
    { l: "인건비 증가", v: -2.6 },
    { l: "마케팅비\n증가", v: -0.9 },
    { l: "26년 3분기\n영업이익", v: 59.8, t: "total" },
  ];
  const x0 = M + 0.3, base = 6.0, top = 2.2, maxV = 65, scale = (base - top) / maxV;
  const bw = 1.3, gap = (W - 2 * M - 0.6 - steps.length * bw) / (steps.length - 1);
  s.addShape(pres.shapes.LINE, { x: M, y: base, w: W - 2 * M, h: 0, line: { color: C.line, width: 1 } });
  let run = 0;
  steps.forEach((st, i) => {
    const x = x0 + i * (bw + gap);
    let y0, y1, col;
    if (st.t === "total") { y0 = 0; y1 = st.v; run = st.v; col = C.navy; }
    else { y0 = run; y1 = run + st.v; run = y1; col = st.v >= 0 ? (st.hi ? C.accent : C.good) : C.bad; }
    const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    const ry = base - hi * scale, rh = Math.max((hi - lo) * scale, 0.04);
    s.addShape(pres.shapes.RECTANGLE, { x, y: ry, w: bw, h: rh, fill: { color: col } });
    const lab = st.t === "total" ? st.v.toFixed(1) : (st.v > 0 ? "+" : "−") + Math.abs(st.v).toFixed(1);
    s.addText(lab, { x: x - 0.2, y: ry - 0.45, w: bw + 0.4, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: col === C.navy ? C.navy : col, align: "center", margin: 0, isTextBox: true });
    s.addText(st.l, { x: x - 0.25, y: base + 0.1, w: bw + 0.5, h: 0.7, fontFace: F, fontSize: 12, color: C.ink, align: "center", valign: "top", margin: 0, isTextBox: true });
    if (i < steps.length - 1) {
      const ny = base - run * scale;
      s.addShape(pres.shapes.LINE, { x: x + bw, y: ny, w: gap, h: 0, line: { color: "9CA3AF", width: 1, dashType: "dash" } });
    }
  });
  footer(s, 5, "출처: 재무팀 손익 분석 (예시 데이터)");
}

// 6. 2x2 priority matrix
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "4분기 과제 우선순위: '빠른 성과' 2건부터 즉시 착수", "과제별 기대 효과 × 실행 난이도");
  const gx = M + 0.7, gy = 1.8, gw = 7.4, gh = 4.8;
  const quads = [
    ["전략 과제", "효과 높음 · 난이도 높음", C.tint, 0, 0],
    ["빠른 성과 ★", "효과 높음 · 난이도 낮음", "FFE8DE", 1, 0],
    ["보류", "효과 낮음 · 난이도 높음", "F9FAFB", 0, 1],
    ["여유 시 진행", "효과 낮음 · 난이도 낮음", C.tint, 1, 1],
  ];
  quads.forEach(([t, d, col, cx, cy]) => {
    const x = gx + cx * (gw / 2 + 0.08), y = gy + cy * (gh / 2 + 0.08);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: gw / 2 - 0.04, h: gh / 2 - 0.04, fill: { color: col }, rectRadius: 0.08 });
    s.addText(t, { x: x + 0.2, y: y + 0.15, w: 3, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: cx === 1 && cy === 0 ? C.accent : C.navy, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.2, y: y + 0.5, w: 3.3, h: 0.3, fontFace: F, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  });
  s.addText("기대 효과 ↑", { x: M - 0.35, y: gy + gh / 2 - 0.2, w: 1.0, h: 0.4, fontFace: F, fontSize: 11, color: C.muted, rotate: 270, align: "center", margin: 0, isTextBox: true });
  s.addText("실행 난이도 높음  ←→  낮음", { x: gx, y: gy + gh + 0.12, w: gw, h: 0.3, fontFace: F, fontSize: 11, color: C.muted, align: "center", margin: 0, isTextBox: true });
  const items = [
    ["A", "온라인 전용 상품", 1, 0, 0.12, 1.0],
    ["B", "파트너 재계약", 1, 0, 0.3, 1.65],
    ["C", "신규 ERP 도입", 0, 0, 0.3, 1.2],
    ["D", "해외 파일럿", 0, 1, 0.3, 1.2],
    ["E", "사내 교육 개편", 1, 1, 0.3, 1.2],
  ];
  items.forEach(([k, name, cx, cy, fx, fy]) => {
    const x = gx + cx * (gw / 2 + 0.08) + fx * (gw / 2) - 0.25, y = gy + cy * (gh / 2 + 0.08) + fy * 1.0;
    dot(s, x, y, cx === 1 && cy === 0 ? C.accent : C.teal, k);
    s.addText(name, { x: x + 0.5, y: y, w: 2.2, h: 0.42, fontFace: F, fontSize: 13, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
  });
  const rx = 8.9, rw = W - M - rx;
  s.addText("권고", { x: rx, y: 1.9, w: rw, h: 0.45, fontFace: F, fontSize: 18, bold: true, color: C.navy, margin: 0, isTextBox: true });
  s.addText([
    { text: "A·B는 10월 즉시 착수 (예상 효과 +22억)", options: { bullet: true, breakLine: true } },
    { text: "C는 2027년 예산 편성 시 재검토", options: { bullet: true, breakLine: true } },
    { text: "D는 시장 조사 결과 확인 후 결정", options: { bullet: true } },
  ], { x: rx, y: 2.5, w: rw, h: 3.0, fontFace: F, fontSize: 13, color: C.ink, paraSpaceAfter: 12, valign: "top", margin: 0, isTextBox: true });
  footer(s, 6, "출처: 부서별 과제 제안서 평가 (예시 데이터)");
}

// 7. Roadmap — process flow
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "4분기 실행 로드맵: 12주 안에 4단계로 추진", "주요 마일스톤과 담당 조직");
  const phases = [
    ["10월 1–2주", "준비", "온라인 전용 상품\n기획 확정", "상품기획팀"],
    ["10월 3주–11월", "출시", "온라인 채널\n단독 런칭", "마케팅팀"],
    ["11월", "확장", "파트너 3사\n재계약 완료", "영업본부"],
    ["12월", "점검", "성과 리뷰 및\n2027 계획 반영", "경영기획팀"],
  ];
  const n = phases.length, gap = 0.3, w = (W - 2 * M - gap * (n - 1)) / n, y = 2.1;
  phases.forEach(([when, ph, what, who], i) => {
    const x = M + i * (w + gap);
    s.addShape(pres.shapes.CHEVRON, { x, y, w, h: 0.9, fill: { color: [C.tealLt, C.teal, C.navy, C.accent][i] } });
    s.addText(ph, { x: x + 0.3, y, w: w - 0.6, h: 0.9, fontFace: F, fontSize: 20, bold: true, color: i === 0 ? C.navy : C.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 1.2, w, h: 3.1, fill: { color: C.tint }, rectRadius: 0.1 });
    s.addText(when, { x: x + 0.25, y: y + 1.4, w: w - 0.5, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: C.teal, margin: 0, isTextBox: true });
    s.addText(what, { x: x + 0.25, y: y + 1.9, w: w - 0.5, h: 1.2, fontFace: F, fontSize: 17, bold: true, color: C.ink, valign: "top", margin: 0, isTextBox: true });
    s.addText("담당: " + who, { x: x + 0.25, y: y + 3.6, w: w - 0.5, h: 0.4, fontFace: F, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  });
  footer(s, 7, "출처: 4분기 사업계획 (예시 데이터)");
}

// 8. Risks table
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  title(s, "주요 리스크 3건 — 모두 대응책과 담당자 지정 완료", "리스크 영향도와 대응 계획");
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 14 } });
  const lvl = (t, col) => ({ text: t, options: { bold: true, color: col, align: "center" } });
  s.addTable([
    [hdr("리스크"), hdr("영향도"), hdr("대응 방안"), hdr("담당")],
    ["원자재 가격 상승 (환율 1,400원 이상 지속)", lvl("높음", C.bad), "분기 단위 장기계약 전환, 대체 공급처 2곳 확보", "구매팀"],
    ["파트너 1개사 계약 종료 가능성", lvl("중간", C.accent), "11월 재계약 협상 선제 착수, 조건 시뮬레이션 준비", "영업본부"],
    ["온라인 채널 개인정보 규제 강화", lvl("낮음", C.good), "동의 절차 개편 및 외부 법률 검토 완료 (9월)", "법무팀"],
  ], {
    x: M, y: 1.9, w: W - 2 * M, colW: [4.2, 1.3, 4.9, 1.73], rowH: 0.85,
    fontFace: F, fontSize: 14, color: C.ink, valign: "middle", margin: [0.08, 0.15, 0.08, 0.15],
    border: { type: "solid", pt: 1, color: C.line },
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.75, w: W - 2 * M, h: 0.8, fill: { color: "FFE8DE" }, rectRadius: 0.1 });
  s.addText("요청 사항: 원자재 장기계약 전환을 위한 선급금 12억 집행 승인", { x: M + 0.3, y: 5.75, w: W - 2 * M - 0.6, h: 0.8, fontFace: F, fontSize: 16, bold: true, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
  footer(s, 8, "출처: 리스크관리위원회 9월 회의 (예시 데이터)");
}

// 9. Closing (dark)
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.OVAL, { x: -1.5, y: 4.2, w: 4.6, h: 4.6, fill: { color: C.teal, transparency: 55 } });
  s.addText("결론 및 의사결정 요청", { x: M + 0.2, y: 1.0, w: 10, h: 0.8, fontFace: F, fontSize: 34, bold: true, color: C.white, margin: 0, isTextBox: true });
  const pts = [
    ["1", "3분기 매출 482억(+18%), 영업이익률 12.4%로 목표 초과 달성"],
    ["2", "성장 동력은 온라인 채널 — 4분기 온라인 전용 상품에 집중"],
    ["3", "승인 요청: 원자재 장기계약 선급금 12억 집행"],
  ];
  pts.forEach(([k, t], i) => {
    const y = 2.4 + i * 1.05;
    s.addShape(pres.shapes.OVAL, { x: M + 0.2, y, w: 0.6, h: 0.6, fill: { color: i === 2 ? C.accent : C.teal } });
    s.addText(k, { x: M + 0.2, y, w: 0.6, h: 0.6, fontFace: F, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(t, { x: M + 1.1, y, w: 10.8, h: 0.6, fontFace: F, fontSize: 20, color: C.white, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addText("문의: 경영기획팀 (내선 1234)", { x: M + 0.2, y: 6.3, w: 11.5, h: 0.4, fontFace: F, fontSize: 13, color: "AAB4C8", align: "right", margin: 0, isTextBox: true });
}

pres.writeFile({ fileName: OUT }).then(() => console.log("wrote " + OUT));
