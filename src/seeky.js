// seeky.js: Seeky, the DeepSeek sprite, painted in watercolour and ink. A plump little whale in DeepSeek blue that floats
// a hand's breadth above the ground: a soft domed body with a pale belly, two flippers, round eyes, a tail that curls up
// behind it into a fluke (the pose of the DeepSeek logo), a water spout on its head and a few winks of spirit glitter.
// `u` is the body unit (the body is 10u wide and 6u tall and floats 2u up). (x, y) is the point on the ground below it.
//
// Body-local coordinates in the front view, used by the o.draw / o.armL / o.armR hooks:
//   body x -5u..5u, y -8u..-2u; eye centres (±2.5u, -6u); mouth near (0, -4.3u); the ground is y 0 (Seeky hovers above).
//   Flippers pivot at (±4.9u, -4.5u) and are 2.2u long. o.armL / o.armR are called at the flipper TIP in arm space (x runs
//   outward along the arm), so a held prop just draws around (0, 0).
//
// Everything here draws one frame. Motion comes from what you pass in: feel() / emotions() for moods, move() for
// dances, turn() for turns, and jump() / take() / stroll() / spring() from core.js for acting.

// ---------- views ----------
// Turns are drawn KEY VIEWS, like a cartoon model sheet, never a rotated 3D box. Every view faces screen-right;
// flip: true mirrors it to face left. Numbers are in u.
//   L, R: silhouette edges.  strip: the darker side face.  seam: where its shade fades out (no line is drawn there).
//   face: where the features go. A front-view x maps to cx + x·fw; sides = which eyes show; mx = mouth x; bx = cheek x.
//   arms: [pivotX, dir, which, layer] ('L' = o.aL / o.armL; layer 0 = behind the body, 1 = in front of it, 2 = behind and
//   in shadow).  tail: control points from the root to the fluke. The tail is at the whale's rear, so it is drawn BEHIND the
//   body, hidden at the root, unless the view looks at the rear (tailFront), where it is nearest and is drawn over the body
//   (or behind a hat that needs the room: tailAside).
//   belly: [x, half-width] of the pale underside.  spout: x of the blowhole.  yaw: the heading in turns (front 0 … back .5),
//   and fit: where hats sit on the head in this view (axis x, how far below the head top, pitch). See hats.js.
const VIEWS = {
  front: { L: -5, R: 5, face: { cx: 0, fw: 1, sides: [-1, 1], mx: 0, bx: 3.6 }, hat: 0, yaw: 0, fit: { cx: 0, dip: .5 }, belly: [0, 3.7], spout: 1.2,
           tail: [[-2.4, -6], [-4.7, -7.3], [-5.9, -9.1], [-5.3, -10.9]], arms: [[-4.9, -1, 'L', 0], [4.9, 1, 'R', 0]] },
  q:     { L: -5, R: 5.1, strip: [-5, -2.3], seam: -2.3, face: { cx: 1.5, fw: .74, sides: [-1, 1], mx: .3, bx: 3.6 }, hat: .5, yaw: .125, fit: { cx: .5, dip: .5 },
           belly: [1.3, 3.2], spout: 2, tail: [[-2, -5.6], [-5, -6.5], [-6.8, -8.2], [-6.6, -10.1]], arms: [[5, 1, 'R', 2], [-4.7, -1, 'L', 1]] },
  // The profile is drawn, not squeezed from the front view: top / bot trace the head, back and belly from the tail root to
  // the nose (left to right); tail starts at that root, so body, stalk and fluke are ONE outline. bellyUp is the edge of
  // the pale throat (it doubles as the mouth line), hl the back highlight [x, y, rx, ry].
  side:  { L: -4.6, R: 5.45, whale: true, face: { cx: 1.9, fw: .55, sides: [1], mx: 2.5, bx: 2.1, dy: .2 }, hat: 1.5, yaw: .25, fit: { cx: 1.5, dip: .75, pitch: .1 }, spout: 2,
           top: [[-4.4, -5.55], [-3.3, -6.25], [-1.9, -7.1], [0, -7.85], [2, -8.1], [3.6, -7.6], [4.7, -6.5], [5.3, -5.5], [5.45, -4.7]],
           bot: [[-4.4, -3.65], [-3.2, -3.1], [-1.6, -2.45], [.4, -2.05], [2.4, -2.1], [4, -2.75], [4.9, -3.3], [5.3, -3.95], [5.45, -4.7]],
           bellyUp: [[-4, -3.8], [-2.6, -3.5], [-.8, -3.5], [1, -3.75], [2.4, -4], [3.8, -4.15], [5, -4.35], [5.25, -4.45]], hl: [.8, -6.9, 2.4, .7],
           tail: [[-4.4, -4.6], [-6.5, -4.7], [-7.9, -6], [-7.9, -8], [-7, -9.6]], arms: [[1.5, 0, 'L', 1]] },
  // Seen from behind (qback, back) the tail is the part nearest the viewer: tailFront draws it OVER the body, growing out of
  // the lower rear and rising over the back, with the fluke curling forward at the top.
  // tailAside is the tail's other path: with a hat that stands over the back of the head (see hatNeedsRoom in hats.js) it curls
  // up beside the head instead, so the fluke does not hide the hat, and the hat is drawn in front of it.
  qback: { L: -5.1, R: 5, strip: [2.3, 5], seam: 2.3, face: null, hat: -.3, yaw: .375, fit: { cx: -.3, dip: .5 }, spout: -.7, tailFront: true,
           tail: [[-1.3, -3.3], [-2.8, -4.7], [-3.5, -6.7], [-2.8, -8.9], [-1.6, -10.4]],
           tailAside: [[-1.3, -3.3], [-3.4, -4.3], [-5.3, -5.5], [-6.9, -7.7], [-6.7, -9.9]], arms: [[-5, -1, 'R', 2], [4.7, 1, 'L', 1]] },
  back:  { L: -5, R: 5, face: null, hat: 0, yaw: .5, fit: { cx: 0, dip: .5 }, back: true, spout: -.3, tailFront: true,
           tail: [[.2, -3.3], [-1.2, -4.8], [-1.9, -6.9], [-1.2, -9], [.3, -10.4]],
           tailAside: [[.2, -3.3], [-1.9, -4.4], [-4.2, -5.6], [-5.8, -7.7], [-5.6, -9.9]], arms: [[-4.9, -1, 'R', 0], [4.9, 1, 'L', 0]] },
};

// ---------- body shape ----------
// The body is a superellipse 6u tall around y = -5u: domed on top (NT), flatter underneath (NB). All in u.
const NT = 2.4, NB = 3.6;
function bodyHW(V, y) {   // half-width at height y
  const d = clamp(Math.abs((y + 5) / 3)), n = y < -5 ? NT : NB;
  return (V.R - V.L) / 2 * Math.pow(1 - Math.pow(d, n), 1 / n);
}
function bodyTB(V, x) {   // [top, bottom] heights at x
  if (V.top) { const P = profile(V); return [_at(P.top, x), _at(P.bot, x)]; }
  const d = clamp(Math.abs(x - (V.L + V.R) / 2) / ((V.R - V.L) / 2), 0, .999);
  return [-5 - 3 * Math.pow(1 - Math.pow(d, NT), 1 / NT), -5 + 3 * Math.pow(1 - Math.pow(d, NB), 1 / NB)];
}
function bodyPts(V, u, j = 0, n = 40) {
  const cx = (V.L + V.R) / 2, a = (V.R - V.L) / 2, p = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * TAU, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? NT : NB);
    p.push([(cx + a * Math.sign(c) * Math.pow(Math.abs(c), e)) * u + jit(j), (-5 + 3 * Math.sign(s) * Math.pow(Math.abs(s), e)) * u + jit(j)]);
  }
  return p;
}
const _cos = (i, n) => (1 - Math.cos(Math.PI * i / n)) / 2;   // samples bunched toward both ends, where the outline curves
// The band of the body between heights y0 < y1, inset by ins: the underside shade, gloom, the jaw and the lid.
function bodySlice(V, u, y0, y1, ins = 0, n = 14) {
  const cx = (V.L + V.R) / 2, R = [], L = [];
  for (let i = 0; i <= n; i++) {
    const y = lerp(y0, y1, _cos(i, n));
    if (V.top) { const [a, b] = profSpan(V, y, ins) || [cx, cx]; R.push([b * u, y * u]); L.push([a * u, y * u]); continue; }
    const w = Math.max(0, bodyHW(V, y) - ins); R.push([(cx + w) * u, y * u]); L.push([(cx - w) * u, y * u]);
  }
  return R.concat(L.reverse());
}

// ---------- drawn profiles ----------
// A view with V.top / V.bot has its own silhouette. These are the dense, left-to-right curves through its control points.
const profile = V => V._prof ||= { top: through(V.top, 8), bot: through(V.bot, 8) };
function _at(C, x) {   // height of a left-to-right curve at x
  if (x <= C[0][0]) return C[0][1];
  for (let i = 1; i < C.length; i++) if (x <= C[i][0]) { const [x0, y0] = C[i - 1], [x1, y1] = C[i]; return x1 === x0 ? y1 : lerp(y0, y1, (x - x0) / (x1 - x0)); }
  return C[C.length - 1][1];
}
function profSpan(V, y, ins = 0) {   // [left, right] of the body at height y, or null above or below it
  const P = profile(V), x0 = V.top[0][0], x1 = V.top[V.top.length - 1][0];
  let a = Infinity, b = -Infinity;
  for (let i = 0; i <= 80; i++) { const x = lerp(x0, x1, i / 80); if (y >= _at(P.top, x) && y <= _at(P.bot, x)) { a = Math.min(a, x); b = Math.max(b, x); } }
  return a > b ? null : [a + ins, b - ins];
}
// Head, back, tail stalk, fluke and belly as one closed outline, so the tail grows out of the body instead of being glued on.
function whalePts(V, u, wag, j) {
  const P = profile(V), [A, F, B] = tailParts(V.tail, u, wag), S = ([x, y]) => [x * u + jit(j), y * u + jit(j)];
  return [...P.top.slice().reverse().map(S), ...A, ...F, ...B.reverse(), ...P.bot.map(S)];
}
// The column of the body between x0 < x1: the darker side face in the 3/4 views.
function bodyCols(V, u, x0, x1, n = 12) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, _cos(i, n)), [t, b] = bodyTB(V, x); top.push([x * u, t * u]); bot.push([x * u, b * u]); }
  return top.concat(bot.reverse());
}
// Key view for a heading in turns: 0 = front, .25 = facing right, .5 = back, .75 (or -.25) = facing left.
// Snaps to the nearest eighth, which is how a drawn turn works: front → q → side, one drawing per step.
function spinView(a) {
  const K = [['front', 0], ['q', 0], ['side', 0], ['qback', 0], ['back', 0], ['qback', 1], ['side', 1], ['q', 1]];
  const [view, f] = K[((Math.round(a * 8) % 8) + 8) % 8]; return { view, flip: !!f };
}
// A turn from heading a0 to a1 (in turns) between t0 and t1. It steps through the key views and smears the
// in-between drawings. Spread it into seeky(): seeky(x, y, u, { ...feel('happy', t), ...turn(t, 2, 2.2, 0, .25) }).
function turn(t, t0, t1, a0, a1) {
  const k = ease(seg(t, t0, t1)), v = spinView(lerp(a0, a1, k));
  return { ...v, smear: t > t0 && t < t1 ? .55 * Math.sin(k * Math.PI) : 0, smearDir: 0 };
}

// ---------- colour ----------
// Tints shift the body colour with the mood. tint: a name here or any hex colour; tintK: 0..1 strength.
// Seeky is already blue, so sadness ('blue') greys it toward slate instead.
const TINT = { pale: '#EEF0FA', flush: '#E23E36', blue: '#7C86A6', rosy: '#EF8EA8', green: '#7FB27A', gold: '#F0BE46' };
function tintCols(o) {
  const c = { col: o.col || PAL.ds, dk: o.dk || PAL.dsDk, lt: o.lt || PAL.dsLt };
  const tc = o.tint && (TINT[o.tint] || o.tint), k = clamp(o.tintK ?? 1);
  if (!tc || k <= 0) return c;
  return { col: mixCol(c.col, tc, .55 * k), dk: mixCol(c.dk, mixCol(tc, PAL.ink, .35), .5 * k), lt: mixCol(c.lt, mixCol(tc, '#FFFFFF', .4), .45 * k) };
}

// ---------- parts ----------
// The tail: one outline from the root up to a two-lobed fluke. wag (radians) swings it about its root, more at the tip.
const tailPts = (P, u, wag) => { const [A, F, B] = tailParts(P, u, wag); return A.concat(F, B.reverse()); };
function tailParts(P, u, wag) {   // [one edge of the stalk, the fluke, the other edge]
  const [bx, by] = P[0], Q = P.map(([x, y], i) => {
    const a = wag * (.3 + i / (P.length - 1)), dx = x - bx, dy = y - by;
    return [(bx + dx * Math.cos(a) - dy * Math.sin(a)) * u, (by + dx * Math.sin(a) + dy * Math.cos(a)) * u];
  });
  const C = through(Q), n = C.length, A = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = lerp(1.9, .55, Math.pow(i / (n - 1), .8)) * u / 2;
    A.push([C[i][0] - dy / d * w, C[i][1] + dx / d * w]); B.push([C[i][0] + dy / d * w, C[i][1] - dx / d * w]);
  }
  // the fluke, in the tip's own frame: s = sideways, f = forward along the tail; the notch sits in the trailing edge
  const tip = C[n - 1], pre = C[n - 3], fx = tip[0] - pre[0], fy = tip[1] - pre[1], fd = Math.hypot(fx, fy) || 1;
  const at = (s, f) => [tip[0] + (-fy / fd * s + fx / fd * f) * u, tip[1] + (fx / fd * s + fy / fd * f) * u];
  return [A, [at(1.05, .2), at(2.3, 1.2), at(1.1, .95), at(0, .55), at(-1.1, .95), at(-2.3, 1.2), at(-1.05, .2)], B];
}
// A flipper reaching out along +x (dir 1) or -x (dir -1) from its root: a soft paddle, widest near the tip.
const flipperPts = (u, dir) => [[0, -.5], [1.1, -.62], [2.05, -.42], [2.45, 0], [2.1, .34], [1.1, .52], [0, .45]].map(([a, b]) => [dir * a * u, b * u]);
// The profile's pectoral fin: a long leaf, narrow at the root, that sweeps back along the belly.
const finPts = u => [[0, -.35], [.7, -.62], [1.6, -.6], [2.5, -.25], [2.95, .05], [2.3, .22], [1.4, .4], [.6, .45], [0, .35]].map(([a, b]) => [a * u, b * u]);
// The blowhole's fountain at (x, top of the head): a stem that splits into two curls, with droplets falling off them.
// k 0..1 makes it spray higher; age drives the drops.
const SPOUT_OK = ['mask', 'masq', 'bowtie', 'cat', 'bow', 'flower', 'band', 'sweatband'];   // hats that leave the blowhole free
function spout(u, sw, x, top, k, age) {
  const h = 1.2 + .7 * k, P = pts => pts.map(([a, b]) => [(x + a) * u, (top + .15 - b) * u]), c = '#D4E0FF', o = { wash: c, fill: PAL.sky, fillOp: 50, ink: PAL.ink };
  paint(ribbon(P([[0, 0], [.06, h * .5], [0, h]]), .55 * u, .32 * u), { ...o, sw: sw * .5 });
  for (const s of [-1, 1]) paint(ribbon(P([[0, h - .1], [s * .55, h + .3], [s * 1, h + .05], [s * 1.08, h - .35]]), .36 * u, .16 * u), { ...o, sw: sw * .45 });
  for (let i = 0; i < 2; i++) {
    const ph = frac(age * .9 + i * .5), s = i ? 1 : -1, [dx, dy] = P([[s * (1.1 + ph * .5), h - .55 - ph * 1.4]])[0], r = 1 - ph * .5;
    paint(ellPts(dx, dy, .16 * u * r, .21 * u * r, 8), { ...o, sw: sw * .35 });
  }
}
// Spirit glitter: a few tiny stars that wink in and out around Seeky, somewhere new each time.
function glitter(u, V, seed) {
  for (let i = 0; i < 3; i++) {
    const c = T * .4 + hash(i * 5 + seed), ph = frac(c), k = Math.floor(c), a = Math.sin(ph * Math.PI);
    if (a < .2) continue;
    const ang = TAU * hash(i * 17 + k * 3.7 + seed), r = 1.2 + .25 * hash(i + k * 9.1);
    const gx = (V.L + V.R) / 2 + Math.cos(ang) * (V.R - V.L) / 2 * r, gy = -5 + Math.sin(ang) * 3.3 * r - ph * .8;
    paint(starPts(gx * u, gy * u, u * .55 * a, .3, 4, ph), { wash: '#FFF0B8', fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: clamp(u / 40, .3, .9) });
  }
}

// ---------- Seeky ----------
// Options (all optional):
//   pose:   dx, dy (in u; negative dy = up), sq (squash; negative stretches), rot (pivots at the ground point), flip, sx, sy,
//           aL, aR (flipper raise angles: 0 = straight out, + = up, - = down), walk (swim phase: the tail beats and the
//           flippers paddle), hover (float height in u; default: a slow bob), tailWag (extra tail swing, rad), noShadow
//   view:   front | q | side | qback | back (see VIEWS). smear 0..1 + smearDir ±1 (0 = both sides) for fast moves
//   face:   eyes (a name, or [left, right] for mismatched eyes), mouth, lookX / lookY (-1..1), squint 0..1, blush 0..1,
//           gloom 0..1 (dark forehead with gloom lines), lid 0..1 (the jaw drops open, front view only), seed (blink, bob)
//   colour: col / dk / lt, or tint + tintK
//   extras: hat, emote + emoteK (0..1 pop) + emoteAge (s since it appeared), spout (0..1 extra spray, false hides it),
//           noGlitter, draw(u, sw), armL(u, sw), armR(u, sw)
//   boil:   boilKey (a stable id for its boil seeds; defaults to call order, so set it if characters come and go mid-shot)
function seeky(x, y, u, o = {}) {
  // each part boils from its own seed (see boilSeed), so a moving flipper never re-boils the body, or the next character
  const id = o.boilKey ?? ++SPRITE_N, rs = part => boilSeed(`seeky ${id} ${part}`), seed = o.seed || 0;
  x += (o.dx || 0) * u;
  const V = VIEWS[o.view] || VIEWS.front;
  const hov = o.hover ?? .2 + .22 * Math.sin(T * 2.1 + seed * 1.3), lift = (o.dy || 0) - hov;
  const dy = lift * u, sq = (o.sq || 0) + (o.take || 0), sm = clamp(o.smear || 0);
  const sw = clamp(u / 15, .45, 2.4) * (o.swMul || 1), J = u * .07;
  const { col, dk, lt } = tintCols(o), belly = mixCol(lt, '#FFFFFF', .62);
  const swim = o.walk != null ? Math.sin(o.walk * TAU) : 0;

  rs('shadow');
  if (!o.noShadow) {   // Seeky floats, so its shadow is a soft spot on the ground that shrinks as it rises
    const f = 1 - Math.min(.55, Math.abs(lift) * .07), w = (V.R - V.L) / 10;
    paint(ellPts(x, y + u * .15, u * 4.6 * f * w, u * .8 * f, 22), { fill: PAL.ink, fillOp: 75, bleed: .25, tex: .3, border: .1, ink: null });
  }
  if (sm > .05) smearTrail(x, y + dy, u, V, sm, o.smearDir ?? (o.flip ? -1 : 1), col);

  push();
  translate(x, y + dy);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (o.sx ?? 1) * (1 + sq * .6) * (1 + sm * .35), (o.sy ?? 1) * (1 - sq));

  const arm = ([px, dir, which, layer]) => {
    rs('arm' + which);
    // swimming paddles the flippers in opposition, so they never twin
    const a = (which === 'L' ? (o.aL ?? .2) : (o.aR ?? .2)) + .3 * swim * (which === 'L' ? 1 : -1), hook = which === 'L' ? o.armL : o.armR;
    const fo = { wash: layer === 2 ? mixCol(col, dk, .4) : col, washOp: 255, fill: dk, fillOp: 60, tex: .5, ink: PAL.ink, sw: sw * .8, curv: .5 };
    // a raised (or dropped) flipper slides its root out to the body's edge, so it stands beside the body instead of behind it
    push(); translate((px + dir * .55 * clamp((Math.abs(a) - .7) / .9)) * u, -4.5 * u);
    if (dir === 0) {   // side view: a pectoral fin sweeping back and down from behind the mouth; a raises it forward
      translate(0, .9 * u); rotate(2.3 - (a >= 0 ? 1.6 : .6) * a);
      paint(finPts(u), fo);
      if (hook) { translate(2.9 * u, 0); hook(u, sw); }
    } else {
      rotate(dir < 0 ? a : -a);
      paint(flipperPts(u, dir), fo);
      if (hook) { translate(dir * 2.2 * u, 0); if (dir < 0) scale(-1, 1); hook(u, sw); }
    }
    pop();
  };

  // the tail behind everything, then the far flippers, the body, and the near flippers
  rs('tail');
  const wag = (o.tailWag || 0) + .09 * Math.sin(T * 2.4 + seed) + .22 * swim;
  if (!V.whale && !V.tailFront) paint(tailPts(V.tail, u, wag), { wash: mixCol(col, dk, .2), washOp: 255, fill: dk, fillOp: 70, tex: .5, border: .4, ink: PAL.ink, sw: sw * .9, curv: .25 });
  V.arms.filter(a => a[3] !== 1).forEach(arm);

  rs('body');
  const lid = V === VIEWS.front ? o.lid || 0 : 0, room = !!V.tailFront && hatNeedsRoom(o.hat);   // room: the tail steps aside for the hat
  if (lid > .01) lunchbox(u, o, sw, J, lid, col, dk, lt, belly);
  else {
    const body = V.whale ? whalePts(V, u, wag, J) : bodyPts(V, u, J), wk = (V.R - V.L) / 10, cx = (V.L + V.R) / 2;
    paint(body, { wash: col, washOp: 255, ink: null });
    if (V.whale) paint(tailPts(V.tail, u, wag), { fill: dk, fillOp: 60, bleed: .15, tex: .5, border: .4, ink: null });   // the stalk is a shade darker
    paint(bodySlice(V, u, -3.8, -2, .12), { fill: dk, fillOp: 100, bleed: .04, tex: .7, border: .5, ink: null });   // underside shade
    if (V.whale) whaleBelly(V, u, J, sw, o, belly, dk);
    else if (V.belly) paint(ellPts(V.belly[0] * u, -3.2 * u, V.belly[1] * u, 1.05 * u, 22, J), { wash: belly, washOp: 240, fill: '#FFFFFF', fillOp: 40, bleed: .1, tex: .5, ink: null });
    const px = V.strip ? (V.strip[0] < 0 ? (V.seam + V.R) / 2 - 1.2 : (V.L + V.seam) / 2 - .6) : cx - 1.6 * wk;
    if (V.hl) paint(ellPts(V.hl[0] * u, V.hl[1] * u, V.hl[2] * u, V.hl[3] * u, 18, J * 2, -.1), { fill: lt, fillOp: 130, bleed: .2, tex: .85, border: .8, ink: null });
    else paint(ellPts(px * u, -6.5 * u, 2.9 * u * (V.strip ? .75 : wk), 1.2 * u, 18, J * 2, -.08), { fill: lt, fillOp: V.back ? 80 : 130, bleed: .2, tex: .85, border: .8, ink: null });
    if (V.strip) {   // the side face turned from the light: a soft shade, strongest at the outer edge and fading toward the face; no line, no hard edge
      const outer = V.strip[0] < V.seam ? V.strip[0] : V.strip[1];
      for (let k = 1; k <= 4; k++) { const e = lerp(outer, V.seam, k / 4); paint(bodyCols(V, u, Math.min(outer, e), Math.max(outer, e)), { fill: dk, fillOp: 48, bleed: .25, tex: .5, border: .3, ink: null }); }
    }
    paint(body, { ink: PAL.ink, sw });
    if (o.gloom > .02) gloom(u, sw, V, o.gloom);
    if (V.face) {
      const F = V.face;
      rs('mask'); faceUnder(V, u, sw, o.hat, { col, dk, lt });
      push(); translate(F.cx * u, (F.dy || 0) * u); scale(F.fw, 1);
      if (o.blush) blush(u, sw, F, o.blush === true ? 1 : o.blush);
      rs('eyes'); eyes(u, o, sw, F.sides, sm); rs('mouth');
      push(); translate(F.mx * u, 0); mouth(u, o.mouth, sw); pop();
      pop();
      rs('wear'); faceOver(V, u, sw, o.hat);
    }
    if (room) { rs('tailF'); frontTail(V.tailAside, u, sw, wag, col, dk); }
    rs('hat'); hat(u, o.hat, sw, V, { col, dk, lt });
  }
  if (V.tailFront && !room && lid <= .01) { rs('tailF'); frontTail(V.tail, u, sw, wag, col, dk); }
  rs('spout');
  if (o.spout !== false && lid <= .01 && (!o.hat || SPOUT_OK.includes(o.hat)))
    spout(u, sw, V.spout, bodyTB(V, V.spout)[0], clamp(o.spout || 0) + .45 * pulse(T + seed * .37), T + seed);
  V.arms.filter(a => a[3] === 1).forEach(arm);
  rs('glitter'); if (!o.noGlitter) glitter(u, V, seed);
  rs('draw'); if (o.draw) o.draw(u, sw);
  pop();

  rs('emote');
  if (o.emote) {
    const top = EMOTE_TOP.includes(o.emote), dir = o.flip ? -1 : 1;
    const ex = top ? x + dir * V.hat * u : x + dir * (V.R + .4) * u, ey = y + dy + (top ? -11 : -8.6) * u * (1 - sq);
    emote(o.emote, ex, ey, u * .9, o.emoteK ?? 1, o.emoteAge ?? T);
  }
  rs('after');   // so whatever is drawn next doesn't depend on this pose
}

// The tail seen from behind: it grows out of the lower rear of the body and rises over the back. Its outline is an open
// line that starts at the root (no line closes the base), and the stalk is the body's own colour with a soft shade on a
// darker rump under it, so the join reads as one body rather than a stalk laid on top.
function frontTail(path, u, sw, wag, col, dk) {
  const [A, F, B] = tailParts(path, u, wag), [rx, ry] = path[0], shape = A.concat(F, B.slice().reverse());
  paint(ellPts(rx * u, (ry + .1) * u, 2.3 * u, 1.3 * u, 18), { fill: dk, fillOp: 70, bleed: .2, tex: .6, border: .5, ink: null });
  paint(shape, { wash: col, washOp: 255, fill: dk, fillOp: 50, bleed: .2, tex: .5, border: .4, ink: null });
  inkLine(shape, sw * .9, PAL.ink, 'ink', 0);
}

// The profile's pale throat and belly. Its upper edge doubles as the mouth line, running from the nose back to a small
// smile at the corner of the mouth; a few throat grooves run along the belly, as on a real rorqual.
function whaleBelly(V, u, J, sw, o, belly, dk) {
  const up = through(V.bellyUp, 6), x0 = up[0][0], x1 = up[up.length - 1][0];
  const lo = profile(V).bot.filter(p => p[0] >= x0 && p[0] <= x1).map(([x, y]) => [x, y - .12]).reverse();
  paint(up.concat(lo).map(([x, y]) => [x * u + jit(J * .5), y * u + jit(J * .5)]), { wash: belly, washOp: 240, fill: '#FFFFFF', fillOp: 40, bleed: .1, tex: .5, ink: null });
  const groove = mixCol(belly, dk, .5);
  for (let k = 0; k < 3; k++) inkLine([[3.7 + .2 * k, -3.65 + .33 * k], [2.4 + .1 * k, -3.5 + .33 * k], [1 + .1 * k, -3.4 + .33 * k]].map(([x, y]) => [x * u, y * u]), sw * .35, groove, 'inkfine', .5);
  const edge = through([[5.3, -4.5], [3.8, -4.15], [2.4, -4], [1, -3.75]], 6).map(([x, y]) => [x * u, y * u]);
  inkLine(edge, sw * .5, PAL.ink, 'inkfine', .3);
  if (!o.mouth) inkLine([[2.7, -4.02], [2.2, -4.05], [1.85, -4.38]].map(([x, y]) => [x * u, y * u]), sw * .75, PAL.ink, 'ink', .4);
}

// The big mouth: the top 2.9u of the body hinges open at the back-left corner (front view only), like a whale gulping.
// The mouth is the dark wedge between jaw and lid; both rows of teeth point INTO it, staggered, and each tooth is sized
// to the gap at its spot, so they never cross, even when the lid is only open a crack.
function lunchbox(u, o, sw, J, lid, col, dk, lt, belly) {
  const F = VIEWS.front, hy = -5.1 * u, A = lid * 1.25, gap = x => (x + 5 * u) * Math.sin(A);
  const jaw = bodySlice(F, u, -5.1, -2), top = bodySlice(F, u, -8, -5.1);
  const tooth = (tx, dir) => {   // base on the jaw line from tx to tx + 1.3u, tip pointing up (dir -1) or down (dir 1)
    const h = Math.min(.8 * u, .42 * gap(tx + .65 * u)); if (h < .12 * u) return;
    paint([[tx, hy], [tx + 1.3 * u, hy], [tx + .65 * u, hy + dir * h]], { wash: PAL.cream, ink: PAL.ink, sw: sw * .45 });
  };
  // lower jaw, with the pale belly
  paint(jaw, { wash: col, washOp: 255, ink: null });
  paint(bodySlice(F, u, -3.8, -2, .12), { fill: dk, fillOp: 100, bleed: .04, tex: .7, border: .5, ink: null });
  paint(ellPts(0, -3.2 * u, 3.7 * u, 1.05 * u, 22, J), { wash: belly, washOp: 240, fill: '#FFFFFF', fillOp: 40, bleed: .1, tex: .5, ink: null });
  // the open mouth: a dark wedge from the hinge to the lid's far corner, with the tongue lying in it
  paint([[-5 * u, hy], [5 * u, hy], [-5 * u + 10 * u * Math.cos(A), hy - 10 * u * Math.sin(A)]], { wash: '#4A1F2A', ink: null });
  const th = Math.min(.5 * u, .3 * gap(1.8 * u));
  if (th > .08 * u) paint(ellPts(1.8 * u, hy - th * .7, 2.2 * u, th, 16), { wash: PAL.rose, fill: '#E2476E', fillOp: 60, ink: null });
  for (let i = 0; i < 6; i++) tooth(-4.4 * u + i * 1.6 * u, -1);
  paint(jaw, { ink: PAL.ink, sw });
  // lid
  push(); translate(-5 * u, hy); rotate(-A); translate(5 * u, -hy);
  paint(top, { wash: col, washOp: 255, ink: null });
  paint(ellPts(-1.6 * u, -6.7 * u, 2.9 * u, .9 * u, 16, J), { fill: lt, fillOp: 120, bleed: .15, tex: .8, border: .8, ink: null });
  for (let i = 0; i < 5; i++) tooth(-3.6 * u + i * 1.6 * u, 1);
  paint(top, { ink: PAL.ink, sw });
  if (o.gloom > .02) gloom(u, sw, VIEWS.front, o.gloom);
  eyes(u, o, sw, [-1, 1], 0);
  hat(u, o.hat, sw, VIEWS.front, { col, dk, lt });
  pop();
}

// A smear drawing: dry-brush streaks and speed lines trailing a fast move (dir ±1), or on both sides for a spin (0).
function smearTrail(x, y, u, V, k, dir, col) {
  const sides = dir === 0 ? [-1, 1] : [-dir];
  for (const s of sides) for (let i = 0; i < 4; i++) {
    const yy = y - (7.2 - i * 1.5) * u, x0 = x + s * (V.R - .5) * u, len = (3 + 3 * hash(i + 7 * s)) * u * k;
    inkLine([[x0, yy], [x0 + s * len * .5, yy + jit(u * .1)], [x0 + s * len, yy]], 2.2 * k, col, 'dry', .3);
    if (i % 2) inkLine([[x0 + s * len * .3, yy + .5 * u], [x0 + s * len * 1.1, yy + .5 * u]], .6, PAL.ink, 'inkfine', 0);
  }
}

// Gloom: a dark wash over the forehead with hanging gloom lines (despair, dread, a guilty conscience).
function gloom(u, sw, V, g) {
  paint(bodySlice(V, u, -7.9, -5.3, .15), { fill: PAL.indigo, fillOp: 160 * g, bleed: .08, tex: .5, border: .6, ink: null });
  const cx = (V.L + V.R) / 2, wk = (V.R - V.L) / 10, n = Math.round((V.R - V.L) * .7);
  for (let i = 0; i < n; i++) {
    const gx = cx + lerp(-3.6, 3.6, i / Math.max(1, n - 1)) * wk, y0 = bodyTB(V, gx)[0] + .25;
    inkLine([[gx * u, y0 * u], [gx * u + jit(u * .05), (y0 + 2.2 * g * (.7 + .3 * hash(i))) * u]], sw * .45, PAL.ink, 'inkfine', 0);
  }
}

function blush(u, sw, F, b) {
  for (const s of F.sides) {
    const bx = s * F.bx * u;
    paint(ellPts(bx, -4.6 * u, u * .85, u * .42, 14), { fill: PAL.rose, fillOp: 170 * clamp(b), bleed: .2, ink: null });
    if (b > .6) for (let k = 0; k < 3; k++) inkLine([[bx - .5 * u + k * .4 * u, -4.35 * u], [bx - .3 * u + k * .4 * u, -4.85 * u]], sw * .4, mixCol(PAL.rose, PAL.ink, .3), 'inkfine', 0);
  }
}

// ---------- eyes ----------
// normal, look, wide, happy, closed, sleepy, wink, narrow, angry, determined, sad, teary, cry, squeeze, shine,
// scared, blank, spark, red, heart, x, swirl, dot, shades. o.eyes may be a pair: ['narrow', 'wide'].
function eyes(u, o, sw, sides, smear = 0) {
  const kinds = Array.isArray(o.eyes) ? o.eyes : o.eyes === 'wink' ? ['happy', 'normal'] : [o.eyes || 'normal', o.eyes || 'normal'];
  const sqz = clamp(o.squint || 0);
  if (smear > .5) { for (const s of sides) inkLine([[s * 2.5 * u - .9 * u, -6 * u], [s * 2.5 * u + .9 * u, -6 * u]], sw * 1.4, PAL.ink, 'ink', 0); return; }
  if (sqz > .8) { for (const s of sides) inkLine([[s * 2.5 * u - .8 * u, -5.9 * u], [s * 2.5 * u + .8 * u, -5.9 * u]], sw, PAL.ink, 'ink', 0); return; }
  if (kinds[0] === 'shades') {   // sunglasses: two dark lenses, a bridge, arms running back along the head
    const P = pts => pts.map(([a, b]) => [a * u, b * u]);
    const lens = cx => P([[cx - 1.4, -7.1], [cx + 1.4, -7.1], [cx + 1.3, -6.2], [cx + .8, -5.35], [cx, -5.2], [cx - .8, -5.35], [cx - 1.3, -6.2]]);
    if (sides.length > 1) {
      for (const s of [-1, 1]) inkLine(P([[s * 3.9, -6.85], [s * 5, -6.95]]), sw * .8, PAL.ink, 'ink', 0);
      inkLine(P([[-1.15, -6.75], [0, -7.05], [1.15, -6.75]]), sw * .8, PAL.ink, 'ink', .5);
    } else inkLine(P([[1.1, -6.85], [-5, -6.95]]), sw * .8, PAL.ink, 'ink', 0);   // profile: the arm runs back to the ear
    for (const s of sides) {
      const cx = s * 2.5;
      paint(lens(cx), { wash: '#2A2740', ink: PAL.ink, sw: sw * .9, curv: .3 });
      inkLine(P([[cx - .85, -6.35], [cx - .25, -6.85]]), sw * .45, PAL.cream, 'inkfine', 0);   // glint
      inkLine(P([[cx - .45, -5.85], [cx - .05, -6.2]]), sw * .3, PAL.cream, 'inkfine', 0);
    }
    return;
  }
  if (sqz > 0) { push(); translate(0, -6 * u); scale(1 + sqz * .15, 1 - sqz); translate(0, 6 * u); }
  for (const s of sides) { push(); translate(s * 2.5 * u, -6 * u); eye(kinds[s < 0 ? 0 : 1], s, u, o, sw); pop(); }
  if (sqz > 0) pop();
}

// One eye, drawn around its centre. s = -1 for the left eye, 1 for the right.
function eye(e, s, u, o, sw) {
  const lx = (o.lookX || 0) * u * .5, ly = (o.lookY || 0) * u * .4;
  const slit = (w, h) => {   // Seeky's resting eyes: soft tall ovals with a catchlight
    paint(ellPts(lx, ly, w * .58 * u, h * .42 * u, 18, u * .02), { wash: PAL.ink, ink: null });
    if (u > 9) paint(ellPts(lx - w * .2 * u, ly - h * .17 * u, u * .19 * w, u * .22 * w, 10), { wash: PAL.cream, washOp: 235, ink: null });
  };
  const blinkOn = ['normal', 'look', 'wide'].includes(e) && ((T * .9 + (o.seed || 0) * 1.7) % 3.3) < .12;
  if (blinkOn) { inkLine([[-.7 * u, .5 * u], [.7 * u, .5 * u]], sw, PAL.ink, 'ink', 0); return; }
  const lineEye = (pts, w = 1.3, c = .2) => inkLine(pts.map(([a, b]) => [a * u, b * u]), sw * w, PAL.ink, 'ink', c);
  switch (e) {
    case 'normal': case 'look': slit(1, 2); break;
    case 'wide': slit(1.25, 2.7); break;
    case 'happy': lineEye([[-.9, .7], [0, -.5], [.9, .7]]); break;
    case 'closed': lineEye([[-.9, .2], [0, .6], [.9, .2]], 1.2, .4); break;
    case 'sleepy':
      paint(rectPts(-.5 * u + lx, .05 * u, u, .95 * u, u * .03), { wash: PAL.ink, ink: null });
      lineEye([[-.8, .05], [0, -.1], [.8, .1]], 1.1, .4); break;
    case 'narrow': paint(rectPts(-.6 * u + lx, -.1 * u + ly, 1.2 * u, .7 * u, u * .03), { wash: PAL.ink, ink: null }); break;
    case 'angry': case 'determined': {   // top edge slants DOWN toward the middle
      const hi = e === 'angry' ? .75 : .5, top = e === 'angry' ? -.7 : -.55;
      const P = [[-.65, s < 0 ? top : top + hi], [.65, s < 0 ? top + hi : top], [.65, 1], [-.65, 1]];
      paint(P.map(([a, b]) => [a * u + lx, b * u + ly]), { wash: PAL.ink, ink: null });
      if (e === 'determined' && u > 9) paint(ellPts(lx - .2 * u, ly + .25 * u, u * .16, u * .2, 8), { wash: PAL.cream, ink: null });
      break;
    }
    case 'sad': case 'teary': {   // top edge slants UP toward the middle (worried)
      const P = [[-.6, s < 0 ? -.2 : -.85], [.6, s < 0 ? -.85 : -.2], [.6, .9], [-.6, .9]];
      paint(P.map(([a, b]) => [a * u + lx, b * u + ly]), { wash: PAL.ink, ink: null });
      if (u > 9) paint(ellPts(lx - .18 * u, ly + .05 * u, u * .16, u * .22, 8), { wash: PAL.cream, ink: null });
      if (e === 'teary') {
        const w = Math.sin(T * 9 + s) * .06 * u;
        paint(ellPts(0, .95 * u + w, .95 * u, .38 * u, 14), { wash: PAL.sky, washOp: 210, fill: '#FFFFFF', fillOp: 60, ink: PAL.ink, sw: sw * .4 });
        paint(ellPts(-.35 * u, .85 * u + w, .18 * u, .1 * u, 8), { wash: '#FFFFFF', ink: null });
      }
      break;
    }
    case 'cry': {   // squeezed shut, with tear streams running down the body and drops flicking off
      lineEye([[-.9, .45], [-.3, -.05], [.3, .15], [.9, -.2]].map(([a, b]) => [a * -s, b]), 1.3, .3);
      const R = []; for (let k = 0; k <= 5; k++) R.push([(s * .55 + Math.sin(T * 8 + k * 1.3 + s) * .12 * k / 5) * u, (.4 + k * .72) * u]);
      paint(ribbon(R, .45 * u, .8 * u), { wash: PAL.sky, washOp: 230, fill: '#FFFFFF', fillOp: 70, ink: PAL.ink, sw: sw * .45 });
      for (let k = 0; k < 2; k++) {
        const ph = frac(T * 1.8 + k * .5 + (s > 0 ? .25 : 0)), p = arcPt([s * .9 * u, .2 * u], [s * 3.6 * u, 1.8 * u], 1.6 * u, ph);
        paint(ellPts(p[0], p[1], .22 * u * (1 - ph * .5), .3 * u * (1 - ph * .5), 8), { wash: PAL.sky, ink: PAL.ink, sw: sw * .35 });
      }
      break;
    }
    case 'squeeze': lineEye([[-.55 * -s, -.7], [.55 * -s, 0], [-.55 * -s, .7]], 1.3, 0); break;   // > <
    case 'shine':
      paint(ellPts(lx * .6, ly * .6, u * .78, u * 1.12, 16), { wash: PAL.ink, ink: null });
      paint(ellPts(lx * .6 - .25 * u, ly * .6 - .45 * u, u * .3, u * .38, 10), { wash: PAL.cream, ink: null });
      paint(ellPts(lx * .6 + .25 * u, ly * .6 + .45 * u, u * .14, u * .14, 8), { wash: PAL.cream, ink: null });
      break;
    case 'scared':
      paint(ellPts(0, 0, u * .95, u * 1.15, 16), { wash: PAL.cream, ink: PAL.ink, sw: sw * .6 });
      paint(ellPts((o.lookX || 0) * u * .3 + Math.sin(T * 40) * .04 * u, .1 * u, u * .3, u * .4, 10), { wash: PAL.ink, ink: null });
      break;
    case 'blank': paint(ellPts(0, 0, u * .8, u * 1.05, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .7 }); break;
    case 'spark':
      paint(ellPts(0, 0, u * 1.5, u * 1.5, 18), { fill: PAL.ochre, fillOp: 90, bleed: .3, ink: null });
      paint(starPts(0, 0, u * 1.35 * (1 + .12 * Math.sin(T * 14))), { wash: PAL.cream, fill: PAL.ochre, fillOp: 80, ink: PAL.ink, sw: sw * .55 });
      break;
    case 'red':
      paint(ellPts(0, 0, u * 1.7, u * 1.7, 18), { fill: '#E0283F', fillOp: 110, bleed: .35, ink: null });
      paint(rectPts(-.6 * u, -u, 1.2 * u, 2 * u, u * .05), { wash: '#FF2F4A', ink: PAL.ink, sw: sw * .5 });
      break;
    case 'heart': paint(heartPts(0, .1 * u, u * .9 * (1 + .1 * pulse(T))), { wash: '#E2476E', ink: PAL.ink, sw: sw * .5 }); break;
    case 'x': lineEye([[-.8, -.8], [.8, .8]], 1, 0); lineEye([[.8, -.8], [-.8, .8]], 1, 0); break;
    case 'swirl': {
      const sp = []; for (let k = 0; k < 16; k++) { const a = k * .7 + T * 6 * s, r = k * .06 * u; sp.push([Math.cos(a) * r, Math.sin(a) * r]); }
      inkLine(sp, sw * .6, PAL.ink, 'inkfine', .6); break;
    }
    case 'dot': paint(ellPts(lx * .5, ly * .5, u * .45, u * .55, 12), { wash: PAL.ink, ink: null }); break;
    default: slit(1, 2);
  }
}

// ---------- mouths ----------
// o, O, smile, grin, flat, wobble, cat, frown, smirk, laugh, open, wail, teeth, tongue, pout, yawn
function mouth(u, m, sw) {
  if (!m) return;
  const P = pts => pts.map(([a, b]) => [a * u, b * u]), dark = '#4A1F2A';
  const line = (pts, w = .8, c = .6) => inkLine(P(pts), sw * w, PAL.ink, 'ink', c);
  switch (m) {
    case 'o': paint(ellPts(0, -4.3 * u, u * .45, u * .5, 12), { wash: PAL.ink, ink: null }); break;
    case 'O': paint(ellPts(0, -4.1 * u, u * .8, u * .95, 14), { wash: dark, ink: PAL.ink, sw: sw * .6 }); break;
    case 'smile': line([[-.8, -4.6], [0, -4.1], [.8, -4.6]]); break;
    case 'frown': line([[-.8, -4.1], [0, -4.6], [.8, -4.1]]); break;
    case 'grin': paint(P([[-1.3, -4.8], [1.3, -4.8], [.9, -3.9], [-.9, -3.9]]), { wash: dark, ink: PAL.ink, sw: sw * .6, curv: .3 }); break;
    case 'flat': line([[-.7, -4.4], [.7, -4.4]], .8, 0); break;
    case 'wobble': line([[-1, -4.4], [-.5, -4.7], [0, -4.4], [.5, -4.7], [1, -4.4]], .7, .3); break;
    case 'cat': line([[-.9, -4.5], [-.45, -4.1], [0, -4.5], [.45, -4.1], [.9, -4.5]], .7, .5); break;
    case 'smirk': line([[-.8, -4.35], [.2, -4.3], [.9, -4.75]], .8, .5); break;
    case 'laugh':
      paint(P([[-1.4, -4.9], [1.4, -4.9], [1, -4], [0, -3.4], [-1, -4]]), { wash: dark, ink: PAL.ink, sw: sw * .6, curv: .4 });
      paint(ellPts(0, -3.85 * u, .7 * u, .32 * u, 12), { wash: PAL.rose, ink: null }); break;
    case 'open':
      paint(ellPts(0, -4.25 * u, u * .75, u * .6, 14), { wash: dark, ink: PAL.ink, sw: sw * .6 });
      paint(ellPts(0, -3.95 * u, u * .45, u * .2, 10), { wash: PAL.rose, ink: null }); break;
    case 'wail': {
      const w = Math.sin(T * 30) * .06;
      paint(P([[-1.5, -4.5 + w], [-.5, -4.9], [.5, -4.9 - w], [1.5, -4.5], [1.2, -3.3], [-1.2, -3.3]]), { wash: dark, ink: PAL.ink, sw: sw * .6, curv: .3 });
      paint(ellPts(0, -3.6 * u, .8 * u, .25 * u, 12), { wash: PAL.rose, ink: null }); break;
    }
    case 'teeth':
      paint(rectPts(-1.3 * u, -4.85 * u, 2.6 * u, .95 * u, u * .04), { wash: PAL.cream, ink: PAL.ink, sw: sw * .6 });
      line([[-1.25, -4.38], [1.25, -4.38]], .4, 0);
      for (const tx of [-.65, 0, .65]) line([[tx, -4.8], [tx, -3.95]], .35, 0);
      break;
    case 'tongue':
      paint(P([[.05, -4.3], [.75, -4.3], [.72, -3.75], [.4, -3.55], [.08, -3.75]]), { wash: PAL.rose, ink: PAL.ink, sw: sw * .5, curv: .5 });
      line([[-.8, -4.6], [0, -4.2], [.8, -4.5]]); break;
    case 'pout': line([[-.45, -4.2], [0, -4.5], [.45, -4.2]], 1, .6); line([[-.25, -4.0], [0, -3.9], [.25, -4.0]], .6, .6); break;
    case 'yawn':
      paint(ellPts(0, -4.1 * u, u * .6, u * 1.05, 14), { wash: dark, ink: PAL.ink, sw: sw * .6 });
      paint(ellPts(0, -3.45 * u, u * .38, u * .25, 10), { wash: PAL.rose, ink: null }); break;
  }
}

// ---------- emotes ----------
// Painted reaction marks, never lettering: ! ? !! !? zzz sweat spark heart hearts anger steam bulb dots scribble
// music swirl stars cloud. k = 0..1 pop-in progress (with overshoot); age = seconds since it appeared (drives the
// looping ones). Emotes in EMOTE_TOP sit over the head; the rest sit by its top corner.
const EMOTE_TOP = ['steam', 'stars', 'cloud', 'bulb', 'scribble'];
function emote(kind, x, y, s, k = 1, age = T) {
  const p = backOut(k); if (p < .02) return;
  const sw = clamp(s / 15, .4, 2), P = pts => pts.map(([a, b]) => [a * s, b * s]);
  const dot = (dx, col) => paint(ellPts(dx, 1.25 * s, .42 * s, .42 * s, 12), { wash: col, ink: PAL.ink, sw: sw * .7 });
  const bang = (dx, col) => {
    push(); translate(dx, 0); rotate(.1 + .08 * Math.sin(age * 16) * Math.exp(-age * 3));
    paint(P([[-.62, -2.3], [.62, -2.3], [.22, .45], [-.22, .45]]), { wash: col, fill: PAL.cream, fillOp: 70, ink: PAL.ink, sw: sw * .8, curv: .25 }); dot(0, col);
    pop();
  };
  const quest = (dx, col) => {
    push(); translate(dx, 0); rotate(-.08 + .08 * Math.sin(age * 12) * Math.exp(-age * 3));
    paint(ribbon(P([[-1, -1.3], [-.55, -2.15], [.35, -2.3], [1, -1.6], [.7, -.75], [.05, -.3], [0, .4]]), .75 * s, .5 * s), { wash: col, fill: PAL.cream, fillOp: 60, ink: PAL.ink, sw: sw * .8 });
    dot(0, col); pop();
  };
  push(); translate(x, y); scale(p);
  switch (kind) {
    case '!': bang(0, PAL.ochre); break;
    case '?': quest(0, PAL.sky); break;
    case '!!': bang(-.8 * s, PAL.ochre); bang(.9 * s, PAL.ochre); break;
    case '!?': bang(-.9 * s, PAL.ochre); quest(1 * s, PAL.sky); break;
    case 'zzz': for (let i = 0; i < 3; i++) {   // painted Z shapes drifting up and away
      const ph = frac(age * .4 + i / 3), a = Math.sin(ph * Math.PI), zs = (.8 + ph * .7) * s * Math.min(1, a * 1.6);
      if (a < .12) continue;
      const zx = ph * 2.6 * s, zy = -ph * 4.2 * s, Z = [[-.6, -.6], [.6, -.6], [.6, -.28], [-.12, .3], [.6, .3], [.6, .6], [-.6, .6], [-.6, .28], [.12, -.3], [-.6, -.3]];
      push(); translate(zx, zy); rotate(-.15 + .1 * Math.sin(age * 2 + i));
      paint(Z.map(([a, b]) => [a * zs, b * zs]), { wash: PAL.cream, fill: PAL.sky, fillOp: 70, ink: PAL.ink, sw: sw * .7 });
      pop();
    } break;
    case 'sweat': for (const [dx, dy, r] of [[0, 0, 1], [1.6, 1.4, .7]])
      paint(P([[dx, dy - 1.6 * r], [dx + .9 * r, dy + .2], [dx, dy + .9 * r], [dx - .9 * r, dy + .2]]), { wash: PAL.sky, fill: '#FFFFFF', fillOp: 60, ink: PAL.ink, sw: sw * .6, curv: .7 });
      break;
    case 'spark': {
      const tw = 1 + .15 * Math.sin(age * 12);
      paint(starPts(0, 0, 1.6 * s * tw), { wash: PAL.cream, fill: PAL.ochre, fillOp: 80, ink: PAL.ink, sw: sw * .5 });
      paint(starPts(1.9 * s, 1.2 * s, .8 * s / tw), { wash: PAL.ochre, ink: PAL.ink, sw: sw * .4 });
      break;
    }
    case 'heart': paint(heartPts(0, 0, s * 1.8 * (1 + .12 * pulse(age + OFF))), { wash: '#E2476E', fill: PAL.rose, fillOp: 90, ink: PAL.ink, sw: sw * .6 }); break;
    case 'hearts': for (let i = 0; i < 3; i++) {
      const ph = frac(age * .55 + i / 3), a = Math.sin(ph * Math.PI); if (a < .1) continue;
      paint(heartPts((Math.sin(ph * 6 + i * 2) * .7 + i * .7 - .7) * s, -ph * 3.8 * s, s * (.5 + .6 * a)), { wash: '#E2476E', fill: PAL.rose, fillOp: 90, ink: PAL.ink, sw: sw * .5 });
    } break;
    case 'anger': {   // the comic "vein pop": four curved strokes, each bowed in toward the centre
      const b = 1 + .15 * pulse(age + OFF, 8);
      for (let i = 0; i < 4; i++) { push(); rotate(i * Math.PI / 2 + Math.PI / 4); scale(b); inkLine(P([140, 160, 180, 200, 220].map(d => [2.1 + 1.3 * Math.cos(d * Math.PI / 180), 1.3 * Math.sin(d * Math.PI / 180)])), sw * 1.1, '#D8394E', 'ink', .6); pop(); }
      break;
    }
    case 'steam': for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) {
      const ph = frac(age / .7 + j * .5 + (sd > 0 ? .25 : 0)), r = (.55 + ph * .9) * s, cx = sd * (3.2 + ph * 1.8) * s, cy = (1 - ph * 3) * s;
      const puff = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, bump = 1 + .22 * Math.abs(Math.sin(a * 2.5)); puff.push([cx + Math.cos(a) * r * bump, cy + Math.sin(a) * r * .8 * bump]); }
      paint(puff, { wash: PAL.cream, washOp: 255 * (1 - ph * .8), ink: ph < .6 ? PAL.ink : null, sw: sw * .5 });
    } break;
    case 'bulb': {
      const gl = .5 + .5 * Math.sin(age * 10);
      glow(0, -1.4 * s, 4.5 * s, '#FFD27A', .75 + .25 * gl);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .45, r0 = 1.6 * s, r1 = (2.2 + .4 * gl) * s; inkLine([[Math.cos(a) * r0, -1.4 * s + Math.sin(a) * r0], [Math.cos(a) * r1, -1.4 * s + Math.sin(a) * r1]], sw * .8, PAL.ochre, 'ink', 0); }
      paint(ellPts(0, -1.4 * s, 1.15 * s, 1.2 * s, 16), { wash: '#FFE68A', fill: PAL.cream, fillOp: 90, ink: PAL.ink, sw: sw * .7 });
      paint(rectPts(-.5 * s, -.3 * s, s, .8 * s), { wash: '#9A93A8', ink: PAL.ink, sw: sw * .6 });
      break;
    }
    case 'dots': for (let i = 0; i < 3; i++) {
      const ph = frac(age / 1.8), q = backOut(clamp((ph - i * .22) * 6)); if (q < .02) continue;
      paint(ellPts((i - 1) * 1.3 * s, 0, .42 * s * q, .42 * s * q, 10), { wash: PAL.ink, ink: null });
    } break;
    case 'scribble': {
      const pts = []; for (let i = 0; i < 34; i++) { const a = i * .95, r = (1.1 + .5 * Math.sin(i * 1.7)) * s; pts.push([Math.cos(a) * r * 1.5 + jit(.2 * s), Math.sin(a) * r * .8 + jit(.2 * s)]); }
      inkLine(pts, sw * .8, PAL.ink, 'ink', .7); break;
    }
    case 'music': {
      const b = Math.sin(age * 5) * .3 * s;
      push(); translate(0, b); rotate(.1 * Math.sin(age * 5));
      paint(ellPts(0, 1.2 * s, .7 * s, .5 * s, 12, 0, -.3), { wash: PAL.ink, ink: null });
      inkLine(P([[.6, 1.1], [.6, -1.6], [1.6, -1]]), sw * .8, PAL.ink, 'ink', 0);
      pop();
      const b2 = Math.sin(age * 5 + 2) * .3 * s;
      paint(ellPts(2.2 * s, 2.2 * s + b2, .45 * s, .33 * s, 10, 0, -.3), { wash: PAL.ink, ink: null });
      inkLine([[2.6 * s, 2.15 * s + b2], [2.6 * s, .6 * s + b2]], sw * .6, PAL.ink, 'ink', 0);
      break;
    }
    case 'swirl': {
      const sp = []; for (let i = 0; i < 18; i++) { const a = i * .6 + age * 5, r = i * .09 * s; sp.push([Math.cos(a) * r, Math.sin(a) * r]); }
      inkLine(sp, sw * .7, PAL.violet, 'inkfine', .6); break;
    }
    case 'stars': for (let i = 0; i < 3; i++) {   // little stars circling the head
      const a = age * 5 + i * TAU / 3, d = .75 + .25 * Math.sin(a);
      paint(starPts(Math.cos(a) * 4.2 * s, Math.sin(a) * s, .75 * s * d, .45, 5, age * 3), { wash: PAL.ochre, fill: PAL.cream, fillOp: 60, ink: PAL.ink, sw: sw * .5 });
    } break;
    case 'cloud': {   // a little rain cloud of its own
      const bob = Math.sin(age * 2) * .15 * s, c = [];
      for (let i = 0; i < 40; i++) {
        const a = i / 40 * TAU, up = Math.sin(a) < 0, r = up ? 1 + .38 * Math.pow(Math.abs(Math.sin(a * 3)), .6) : 1;
        c.push([Math.cos(a) * 2.8 * s * (up ? r * .92 : 1), bob - .2 * s + Math.sin(a) * (up ? 1.35 : .7) * s * r]);
      }
      for (let i = 0; i < 6; i++) { const ph = frac(age * 2.4 + hash(i)), rx = (-2 + i * .8) * s, ry = (.7 + ph * 2) * s; inkLine([[rx, ry], [rx - .12 * s, ry + .7 * s]], sw * 1.1, mixCol(PAL.sky, PAL.indigo, .3), 'ink', 0); }
      paint(c, { wash: '#A3A8C4', fill: PAL.indigo, fillOp: 70, bleed: .1, ink: PAL.ink, sw: sw * .8, curv: .4 });
      break;
    }
  }
  pop();
}
// Heart outline points, centred at (cx, cy), about 2r wide.
function heartPts(cx, cy, r, n = 22) {
  const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; p.push([cx + 16 * Math.pow(Math.sin(a), 3) * r / 16, cy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * r / 16]); } return p;
}

// ---------- emotions ----------
// Each emotion is a face AND a way of moving. body(t) returns pose offsets for seeky(), and every one is alive: it
// moves on its own, at its own energy, locked to the beat (PROJECT.bpm). take = how big the reaction is when Seeky
// switches INTO this emotion. fade = the emote is a one-off that fades out instead of staying.
const _b = t => { const bp = bpOf(t), s1 = Math.sin(bp * Math.PI); return { bp, s1, ab: Math.abs(s1), hit: pulse(t), s2: Math.sin(bp * TAU), f: frac(bp) }; };
const EMO = {
  neutral:    { eyes: 'normal', take: .3, body: t => { const b = _b(t); return { dy: -.25 * b.ab, sq: .03 * b.hit, aL: .15 + .05 * b.s1, aR: .15 - .05 * b.s1 }; } },
  happy:      { eyes: 'happy', mouth: 'smile', blush: .3, take: .6, body: t => { const b = _b(t); return { dy: -1.2 * b.ab, sq: .1 * b.hit, aL: .4 + .4 * b.s1, aR: .4 - .4 * b.s1 }; } },
  excited:    { eyes: 'wide', mouth: 'open', emote: 'spark', take: 1, body: t => { const b = _b(t), h = Math.abs(b.s2); return { dy: -2.4 * h, sq: .16 * pulse2(t) - .06 * h, aL: 1 + .5 * Math.sin(b.bp * TAU * 2), aR: 1 - .5 * Math.sin(b.bp * TAU * 2) }; } },
  laugh:      { eyes: 'squeeze', mouth: 'laugh', blush: .45, take: .8, body: t => { const c = Math.abs(Math.sin(t * TAU * 5)); return { dy: -.45 * c, sq: .08 * c - .04, rot: -.07 + .03 * Math.sin(t * TAU * 5), aL: -.35 + .12 * c, aR: -.35 + .12 * c }; } },
  love:       { eyes: 'heart', mouth: 'cat', blush: .8, tint: 'rosy', tintK: .5, emote: 'hearts', take: .7, body: t => { const b = _b(t), s = Math.sin(b.bp * Math.PI / 2); return { rot: .08 * s, dx: .5 * s, dy: -.6 * b.ab, sq: .05 * b.hit, aL: -.1 + .15 * b.s1, aR: -.1 - .15 * b.s1 }; } },
  shy:        { eyes: 'look', mouth: 'wobble', blush: 1, take: .3, body: t => { const b = _b(t), s = Math.sin(b.bp * Math.PI / 2); return { lookX: -.7, lookY: .8, sq: .06, rot: -.05 + .02 * s, dx: .15 * s, aL: -.55 + .15 * Math.sin(t * TAU * 1.5), aR: -.6 - .12 * Math.sin(t * TAU * 1.5) }; } },
  proud:      { eyes: 'closed', mouth: 'smile', tint: 'gold', tintK: .3, emote: 'spark', take: .5, body: t => { const b = _b(t); return { sq: -.1 - .03 * b.ab, dy: -.3 * b.hit, aL: -.9, aR: -.9, rot: .02 * b.s1 }; } },
  smug:       { eyes: 'narrow', mouth: 'smirk', take: .4, body: t => { const b = _b(t), s = Math.sin(b.bp * Math.PI / 2); return { lookX: .4, rot: -.06 + .03 * s, dy: -.2 * b.ab, aL: -.5, aR: .5 + .15 * s }; } },
  relieved:   { eyes: 'closed', mouth: 'smile', emote: 'sweat', take: .4, body: t => { const b = _b(t), br = Math.sin(t * TAU * .35); return { sq: .05 + .05 * br, dy: -.15 * b.ab, aL: -.7 + .1 * br, aR: -.7 + .1 * br }; } },
  sad:        { eyes: 'sad', mouth: 'frown', tint: 'blue', tintK: .35, gloom: .35, emote: 'cloud', take: .3, body: t => { const b = _b(t), s = Math.sin(b.bp * Math.PI / 4); return { sq: .08 + .02 * s, rot: .03 * s, aL: -.75, aR: -.75, lookY: .5 }; } },
  cry:        { eyes: 'cry', mouth: 'wail', tint: 'blue', tintK: .2, take: .8, body: t => { const b = _b(t), sob = Math.sin(b.f * Math.PI) * Math.exp(-b.f * 2); return { sq: .14 * sob - .02, dy: -.7 * sob, aL: .9 + .15 * Math.sin(t * TAU * 6), aR: .9 - .15 * Math.sin(t * TAU * 6), rot: .03 * b.s1 }; } },
  angry:      { eyes: 'angry', mouth: 'teeth', tint: 'flush', tintK: .45, emote: 'anger', take: .8, body: t => { const b = _b(t); return { dx: .1 * Math.sin(t * TAU * 18), sq: .12 * b.hit, aL: -.3 + .1 * b.hit, aR: -.3 + .1 * b.hit }; } },
  furious:    { eyes: 'red', lid: .28, tint: 'flush', tintK: .85, emote: 'steam', take: 1.2, body: t => { const b = _b(t); return { dx: .22 * Math.sin(t * TAU * 20), rot: .025 * Math.sin(t * TAU * 13), sq: .2 * b.hit, dy: -.8 * Math.sin(b.f * Math.PI) * (1 - b.f), aL: 1 + .2 * Math.sin(t * TAU * 9), aR: 1 - .2 * Math.sin(t * TAU * 9) }; } },
  scared:     { eyes: 'scared', mouth: 'wobble', tint: 'pale', tintK: .6, emote: 'sweat', take: 1.1, body: t => ({ dx: .1 * Math.sin(t * TAU * 22), sq: -.06, aL: 1 + .08 * Math.sin(t * TAU * 17), aR: 1 + .08 * Math.sin(t * TAU * 19), lookX: .6 * Math.sign(Math.sin(t * 2.3)) }) },
  surprised:  { eyes: 'wide', mouth: 'O', emote: '!', fade: true, take: 1.3, body: t => { const b = _b(t); return { sq: -.12, dy: -.3 - .15 * b.ab, aL: 1.1 + .05 * b.s2, aR: 1.1 - .05 * b.s2 }; } },
  confused:   { eyes: ['narrow', 'wide'], mouth: 'wobble', emote: '?', take: .6, body: t => { const b = _b(t); return { rot: .1 * Math.sin(b.bp * Math.PI / 4), aL: .1, aR: 1.5 + .15 * Math.sin(t * TAU * 3), dy: -.15 * b.ab }; } },
  thinking:   { eyes: 'look', mouth: 'flat', emote: 'dots', take: .4, body: t => { const b = _b(t); return { lookX: .5, lookY: -.8, rot: .05, aR: .9, aL: -.3 + .25 * Math.sin(b.f * Math.PI), dy: -.1 * b.ab }; } },
  idea:       { eyes: 'shine', mouth: 'grin', emote: 'bulb', take: 1.1, body: t => { const b = _b(t); return { dy: -1 * b.ab, sq: -.05 + .1 * b.hit, aR: 1.55 + .1 * b.s2, aL: .2 + .2 * b.s1 }; } },
  determined: { eyes: 'determined', mouth: 'flat', take: .7, body: t => { const b = _b(t), p1 = Math.sin(b.f * Math.PI), p2 = Math.abs(Math.cos(b.f * Math.PI)); return { rot: .06, sq: -.04 + .06 * b.hit, dy: -.3 * b.ab, aL: .1 + .7 * p1, aR: .1 + .7 * p2 }; } },
  sleepy:     { eyes: 'sleepy', mouth: 'o', emote: 'zzz', take: .2, body: t => { const br = Math.sin(t * TAU * .3); return { sq: .05 + .05 * br, rot: .06 * Math.sin(t * .8), aL: -.6, aR: -.6 }; } },
  bored:      { eyes: 'narrow', mouth: 'flat', take: .2, body: t => { const f = frac(bpOf(t) / 4), sigh = f < .3 ? ease(f / .3) : 1 - ease((f - .3) / .7); return { lookX: -.3, lookY: .4, sq: .08 - .14 * sigh, rot: -.04, aL: -.85 + .05 * Math.sin(t * 2), aR: -.85 - .05 * Math.sin(t * 2) }; } },
  nervous:    { eyes: 'look', mouth: 'wobble', tint: 'pale', tintK: .2, emote: 'sweat', take: .5, body: t => { const b = _b(t); return { lookX: beatN(t) % 2 ? .8 : -.8, dx: .3 * b.s1, sq: .04, aL: -.1 + .2 * Math.sin(t * TAU * 5), aR: -.1 + .2 * Math.sin(t * TAU * 5 + 1) }; } },
  suspicious: { eyes: 'narrow', mouth: 'flat', take: .4, body: t => { const s = Math.sin(t * TAU * .25); return { lookX: s, rot: -.08 * s, dx: .4 * s, sq: .04, aL: -.4, aR: -.4 }; } },
  disgusted:  { eyes: 'squeeze', mouth: 'wobble', tint: 'green', tintK: .5, take: .8, body: t => { const a = frac(bpOf(t) / 2) * BEAT * 2, sh = Math.exp(-a * 6) * Math.sin(a * 45); return { rot: -.1, dx: -.3 + .15 * sh, sq: .05, aL: .7 + .2 * sh, aR: .7 - .2 * sh }; } },
  dizzy:      { eyes: 'swirl', mouth: 'wobble', emote: 'stars', take: .7, body: t => { const a = t * TAU * .8; return { rot: .12 * Math.sin(a), dx: .7 * Math.sin(a), dy: -.3 * Math.abs(Math.cos(a)), aL: .3 + .6 * Math.sin(a * 1.3), aR: .3 - .6 * Math.sin(a * 1.3) }; } },
  cool:       { eyes: 'shades', mouth: 'smirk', emote: 'music', take: .4, body: t => { const b = _b(t); return { rot: .04 * b.hit, dy: -.35 * b.hit, sq: .06 * b.hit, aL: -.4, aR: .7 + .1 * b.s1 }; } },
  starstruck: { eyes: 'spark', mouth: 'open', tint: 'gold', tintK: .3, take: 1, body: t => { const b = _b(t), h = Math.abs(b.s2); return { dy: -1.6 * h, sq: .1 * pulse2(t), aL: 1.1 + .35 * Math.sin(b.bp * TAU * 2), aR: 1.1 + .35 * Math.sin(b.bp * TAU * 2) }; } },
  ko:         { eyes: 'x', mouth: 'wobble', tint: 'pale', tintK: .3, emote: 'stars', take: 1, body: t => ({ sq: .28 + .02 * Math.sin(t * 3), rot: .12, aL: -1, aR: -.9 }) },
  playful:    { eyes: 'wink', mouth: 'tongue', take: .6, body: t => { const b = _b(t), side = beatN(t) % 2 ? 1 : -1, k = lerp(-side, side, easeOut(clamp(b.f * 3))); return { dx: .8 * k, dy: -1.4 * b.ab, rot: .1 * k, sq: .1 * b.hit, aL: .65 + .55 * k, aR: .65 - .55 * k }; } },
  mischief:   { eyes: 'narrow', mouth: 'grin', gloom: .3, take: .5, body: t => { const r = Math.sin(t * TAU * 4); return { lookX: .3, sq: .07, rot: .04, aL: -.05 + .15 * r, aR: -.05 - .15 * r, dy: -.1 * Math.abs(r) }; } },
  hopeful:    { eyes: 'shine', mouth: 'cat', blush: .35, take: .5, body: t => { const b = _b(t); return { sq: -.06 - .02 * b.ab, dy: -.25 * b.ab, lookY: -.4, aL: .5 + .05 * b.s1, aR: .5 - .05 * b.s1, rot: .03 * Math.sin(b.bp * Math.PI / 2) }; } },
};

// One emotion, alive at time t: face, colour and body motion together. Spread it into seeky():
//   seeky(x, y, u, feel('happy', t))       seeky(x, y, u, { ...feel('sad', t), view: 'q', hat: 'beanie' })
function feel(name, t, over = {}) {
  const E = EMO[name] || EMO.neutral;
  return { eyes: E.eyes, mouth: E.mouth, tint: E.tint, tintK: E.tintK ?? 1, blush: E.blush || 0, gloom: E.gloom || 0,
           lid: E.lid || 0, emote: E.emote, ...(E.body ? E.body(t) : {}), ...over };
}

// An emotion timeline with ACTED changes: keys = [[t0, 'neutral'], [t1, 'surprised'], [t2, 'happy', { emote: 'music' }]].
// Around each change the eyes squeeze shut and the body squashes just before (anticipation), and the face swaps
// under the squint. Then a take fires (a squash-stretch the size of the new emotion's `take`), the body settles into
// its new motion with overshoot, colour, blush and gloom cross-fade, and the new emote pops in. o.take scales every take.
// Spread the result into seeky() and add any other pose: seeky(x, y, u, { ...emotions(t, keys), view: 'q' }).
function emotions(t, keys, o = {}) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const [tc, name, over] = keys[i], age = t - tc, cur = feel(name, t, over);
  const tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, tkS = o.take ?? 1;
  const E = EMO[name] || EMO.neutral;
  let squint = cur.squint || 0;
  if (tn - t < .1) squint = Math.max(squint, 1 - (tn - t) / .1);
  if (i > 0 && age < .14) squint = Math.max(squint, 1 - age / .14);
  const prev = i > 0 ? feel(keys[i - 1][1], t, keys[i - 1][2]) : null;
  if (prev && age < .5) {
    const base = { dy: 0, sq: 0, aL: .2, aR: .2, rot: 0, dx: 0, lookX: 0, lookY: 0 };
    const k = backOut(seg(age, 0, .4)), kc = ease(seg(age, 0, .3));
    for (const f in base) cur[f] = lerp(prev[f] ?? base[f], cur[f] ?? base[f], k);
    const a = tintCols(prev), b = tintCols(cur);
    cur.col = mixCol(a.col, b.col, kc); cur.dk = mixCol(a.dk, b.dk, kc); cur.lt = mixCol(a.lt, b.lt, kc); cur.tint = null;
    for (const f of ['blush', 'gloom', 'lid']) cur[f] = lerp(prev[f] || 0, cur[f] || 0, kc);
  }
  // takes: the one this key fires, plus the anticipation squash of the next one
  const t1 = prev ? take(t, tc, (E.take ?? .6) * tkS) : { sq: 0, dy: 0 };
  const En = i + 1 < keys.length ? EMO[keys[i + 1][1]] || EMO.neutral : null, t2 = En ? take(t, tn, (En.take ?? .6) * tkS) : { sq: 0, dy: 0 };
  cur.sq = (cur.sq || 0) + t1.sq + t2.sq; cur.dy = (cur.dy || 0) + t1.dy + t2.dy;
  cur.squint = squint;
  // the emote pops in after the swap (it carries on if the emote didn't change); one-off emotes fade out
  const same = prev && prev.emote === cur.emote;
  cur.emoteK = same ? 1 : seg(age, .06, .32) * (E.fade && !(over && over.emote) ? 1 - seg(age, 1.4, 1.8) : 1);
  cur.emoteAge = age;
  return cur;
}

// ---------- moves ----------
// Beat-locked dances: bounce, hop, roof (arms up), sway, spin (a drawn spin through the key views, once a bar), wave,
// walk, run, idle, stomp, shimmy, mix (changes every two bars). Returns pose offsets; spread into seeky().
function move(style, t, seed = 0) {
  const bp = bpOf(t), bi = Math.floor(bp), bf = bp - bi, hit = Math.max(0, 1 - bf * 3.5), s1 = Math.sin(bp * Math.PI), ab = Math.abs(s1);
  const o = { dy: 0, sq: 0, aL: .2, aR: .2, rot: 0, walk: null, dx: 0 };
  if (style === 'mix') style = ['bounce', 'roof', 'sway', 'spin', 'hop', 'wave'][(Math.floor(bp / 8) + seed) % 6];
  switch (style) {
    case 'bounce': o.dy = -ab * 1.6; o.sq = hit * .12; o.aL = .4 + s1; o.aR = .4 - s1; break;
    case 'hop': o.dy = -ab * 4; o.sq = hit * .18; o.aL = o.aR = .3 + ab * 1.1; break;
    case 'roof': o.dy = -ab * 1.2; o.sq = hit * .1; o.aL = o.aR = 1.25 + .3 * Math.sin(bp * TAU); break;
    case 'sway': o.dx = s1 * 3; o.rot = s1 * .12; o.aL = .5 + .6 * s1; o.aR = .5 - .6 * s1; o.sq = hit * .08; break;
    case 'spin': {
      const ph = (((bi % 4) + 4) % 4 === 3) ? bf : 0;
      Object.assign(o, spinView(ph)); o.smear = ph > .1 && ph < .9 ? .5 : 0; o.smearDir = 0;
      o.dy = -Math.sin(ph * Math.PI) * 3 - ab; o.aL = o.aR = .6 + ph; o.sq = hit * .1; break;
    }
    case 'wave': o.dy = -ab; o.aL = 1.1 + .5 * Math.sin(bp * TAU * 2); o.aR = -.2; o.sq = hit * .08; break;
    case 'walk': o.walk = bp / 2; o.dy = -ab * .6; o.aL = .3 * s1; o.aR = -o.aL; break;
    case 'run': o.walk = bp * 1.5; o.dy = -Math.abs(Math.sin(bp * TAU)); o.aL = .8 * Math.sin(bp * TAU * 1.5); o.aR = -o.aL; o.rot = -.08; break;
    case 'idle': o.dy = -ab * .5; o.sq = hit * .05; break;
    case 'stomp': o.dy = -Math.max(0, Math.sin(bp * TAU)) * 1.4; o.sq = hit * .2; o.rot = (bi % 2 ? 1 : -1) * .06 * hit; o.aL = o.aR = -.3 + hit * .9; break;
    case 'shimmy': o.dx = Math.sin(bp * TAU * 2) * .6; o.rot = Math.sin(bp * TAU * 2) * .05; o.aL = .9 + .4 * Math.sin(bp * TAU * 2); o.aR = .9 - .4 * Math.sin(bp * TAU * 2); o.dy = -ab * .5; break;
  }
  return o;
}
function dancer(x, y, u, style, t, extra = {}) { seeky(x, y, u, { ...move(style, t, extra.seed || 0), ...extra }); }
