// actions.js: Seeky's daily life, in the spirit of the old QQ pets: eat a burger, sip bubble tea, take a bath, nap,
// study, play ball, have a sick day. Each action is a six-second skit that loops, with its own props, acted through
// emotions() and seeky()'s pose options, and like everything else it is a pure function of time. The skits lean on
// what makes Seeky a whale: it gulps the burger with its big jaw, showers with its blowhole and balances the ball on
// its spout.
//
//   act(name, x, y, u, t, o)   draws the skit standing on the ground point (x, y): props behind, Seeky, props in front.
//                              t = seconds since the action started (it loops every ACTIONS[name].len seconds).
//                              o: { key (a stable boil id when several are on screen), hat (only where the skit allows one) }
//   LOOPS.actions              every action side by side: studio.html?loop=actions, or the preview's tab.
//   LOOPS['act-<name>']        one action on its own, big: studio.html?loop=act-bath.

// Where a body-local point (bx, by, in u, front view) of a Seeky posed with o lands in the world. Ignores rot and smear;
// o.hover must be set, since the default hover is a bob the caller can't see.
function bodyAt(x, y, u, o, bx, by) {
  const sq = o.sq || 0, f = o.flip ? -1 : 1;
  return [x + (o.dx || 0) * u + f * bx * u * (o.sx ?? 1) * (1 + sq * .6), y + ((o.dy || 0) - (o.hover || 0)) * u + by * u * (o.sy ?? 1) * (1 - sq)];
}
// The tip of the right flipper (front view) at raise angle a, body-local, in u: the point o.armR draws around.
const flipperTip = a => { const px = 4.9 + .55 * clamp((Math.abs(a) - .7) / .9); return [px + 2.2 * Math.cos(a), -4.5 - 2.2 * Math.sin(a)]; };

(() => {
  const SW = u => clamp(u / 15, .45, 2.4);
  const hoverAt = (k = 1, seed = 0) => k * (.2 + .22 * Math.sin(T * 2.1 + seed * 1.3));
  // A looping emotion track: the first key is entered from the last one, so the loop's seam is acted like any change.
  const loopFeel = (t, keys, o) => emotions(t, [[-99, keys[keys.length - 1][1], keys[keys.length - 1][2]], ...keys], o);
  const P = (pts, x, y, s) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  // a dome: the top half of an ellipse, closed by its base (in whatever units the caller maps it to)
  const half = (cx, cy, rx, ry, n = 16) => { const p = []; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; p.push([cx - Math.cos(a) * rx, cy - Math.sin(a) * ry]); } return p; };

  // ---------- props ----------
  // A burger centred on its patty, s = half its width.
  function burger(x, y, s, sw, rot = 0) {
    push(); translate(x, y); rotate(rot);
    const Q = pts => P(pts, 0, 0, s);
    paint(rrPts(-.96 * s, .14 * s, 1.92 * s, .44 * s, .2 * s), { wash: '#E6A95E', fill: '#B8752F', fillOp: 70, tex: .5, ink: PAL.ink, sw });
    const leaf = []; for (let i = 0; i <= 12; i++) leaf.push([-1.12 + i * 2.24 / 12, .24 + (i % 2 ? .12 : -.02)]);
    paint(Q([[-1.08, 0], [1.08, 0], ...leaf.reverse()]), { wash: '#8CC56A', fill: PAL.sap, fillOp: 80, ink: PAL.ink, sw: sw * .7 });
    paint(rrPts(-1.02 * s, -.2 * s, 2.04 * s, .36 * s, .16 * s), { wash: '#7B4B2C', fill: '#4A2A18', fillOp: 90, tex: .6, ink: PAL.ink, sw });
    paint(Q([[-1.08, -.26], [1.08, -.26], [1.02, -.1], [.66, -.1], [.54, .16], [.4, -.1], [-.28, -.1], [-.42, .12], [-.56, -.1], [-1.02, -.1]]), { wash: '#F6C343', fill: PAL.ochre, fillOp: 70, ink: PAL.ink, sw: sw * .7 });
    paint(Q(half(0, -.22, 1.02, .8)), { wash: '#ECB26A', fill: '#BF7B34', fillOp: 55, tex: .5, ink: PAL.ink, sw });
    paint(ellPts(-.38 * s, -.72 * s, .32 * s, .13 * s, 10, 0, -.4), { wash: '#FBD9A4', washOp: 200, ink: null });
    for (const [a, b] of [[-.55, -.48], [-.1, -.8], [.35, -.62], [.7, -.36], [.15, -.4], [-.32, -.3]]) paint(ellPts(a * s, b * s, .09 * s, .05 * s, 8, 0, .5), { wash: PAL.cream, ink: PAL.ink, sw: sw * .3 });
    pop();
  }

  // A rubber duck sitting on (x, y) its waterline, dir 1 = facing right.
  function duck(x, y, s, sw, dir = 1, rot = 0) {
    push(); translate(x, y); rotate(rot); scale(dir, 1);
    const yel = { wash: '#FFD54A', fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw };
    paint(P([[-1.35, -1.05], [-.85, -.45], [-.1, -.4], [.6, -.5], [1.15, -.15], [1, .2], [.1, .3], [-.9, .22], [-1.25, -.3]], 0, 0, s), { ...yel, curv: .5 });
    paint(ellPts(.55 * s, -1 * s, .5 * s, .48 * s, 16), yel);
    paint(ellPts(1.1 * s, -.92 * s, .36 * s, .14 * s, 10), { wash: '#F08A3C', ink: PAL.ink, sw: sw * .6 });
    paint(ellPts(.7 * s, -1.12 * s, .08 * s, .1 * s, 8), { wash: PAL.ink, ink: null });
    inkLine(P([[-.45, -.2], [-.05, 0], [.35, -.2]], 0, 0, s), sw * .6, PAL.ink, 'ink', .5);
    pop();
  }

  // A soap bubble: a clear film with a glint. a = 0..1 fades it.
  function bubble(x, y, r, sw, a = 1, film = 70) {
    if (r < 1 || a <= .02) return;
    paint(ellPts(x, y, r, r, 18), { wash: '#FFFFFF', washOp: film * a, fill: PAL.sky, fillOp: 30 * a, ink: a > .4 ? mixCol(PAL.sky, PAL.ink, .35) : null, sw: sw * .45 });
    inkLine([[x - r * .62, y - r * .05], [x - r * .5, y - r * .42], [x - r * .18, y - r * .62]], sw * .55, '#FFFFFF', 'inkfine', .5);
  }
  // Popping: a ring of short strokes flying out from (x, y) over k = 0..1.
  function popRing(x, y, r, sw, k) {
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + .3, d0 = r * (.7 + .6 * k), d1 = d0 + r * .4 * (1 - k);
      inkLine([[x + Math.cos(a) * d0, y + Math.sin(a) * d0], [x + Math.cos(a) * d1, y + Math.sin(a) * d1]], sw * .6, mixCol(PAL.sky, PAL.ink, .3), 'inkfine', 0);
    }
  }

  // Suds piled along a waterline from x - w to x + w, highest in the middle, where Seeky sits.
  function foam(x, y, w, u, sw, key, t) {
    boilSeed(key + ' foam');
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const f = i / 8, bx = x + lerp(-w, w, f) + (hash(i + row * 9) - .5) * u, r = u * (.75 + .45 * hash(i * 3 + row)) * (row ? 1 : 1.15);
      const by = y - (row ? 0 : .45 * u) - u * .7 * Math.sin(f * Math.PI) * (row ? .4 : 1) + Math.sin(t * 3 + i) * .06 * u;
      paint(ellPts(bx, by, r, r * .82, 14), { wash: '#FFFFFF', washOp: 245, fill: PAL.sky, fillOp: 30, bleed: .1, ink: mixCol(PAL.sky, PAL.ink, .45), sw: sw * .45 });
    }
  }

  // A clawfoot bathtub on the ground at (x, y): the back (the far rim and the inside) and the front (the near wall).
  const RIM = 4.6, TUBW = 7.2;
  function tubBack(x, y, u, sw, key) {
    boilSeed(key + ' tub back');
    paint(ellPts(x, y - RIM * u, TUBW * u, 1.15 * u, 32), { wash: '#DCE8F2', fill: mixCol(PAL.sky, PAL.ink, .2), fillOp: 70, bleed: .2, ink: PAL.ink, sw });
  }
  function tubFront(x, y, u, sw, key) {
    boilSeed(key + ' tub front');
    for (const s of [-1, 1]) paint(P([[-.5, -.9], [.5, -.9], [.6, -.3], [.85, 0], [-.85, 0], [-.6, -.3]], x + s * 5.3 * u, y, u), { wash: '#F0C25A', fill: PAL.ochre, fillOp: 80, ink: PAL.ink, sw: sw * .8, curv: .3 });
    const lip = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; lip.push([x + Math.cos(a) * TUBW * u, y - RIM * u + Math.sin(a) * 1.15 * u]); }
    const wall = through([[-TUBW, -RIM], [-7.05, -3], [-6.4, -1.7], [-5, -1.05], [0, -.9], [5, -1.05], [6.4, -1.7], [7.05, -3], [TUBW, -RIM]]).slice(1, -1).map(([a, b]) => [x + a * u, y + b * u]);
    paint(lip.concat(wall), { wash: '#FFFFFF', fill: mixCol(PAL.sky, '#FFFFFF', .3), fillOp: 70, bleed: .15, tex: .5, border: .5, ink: PAL.ink, sw });
    inkLine(lip.slice(2, -2).map(([a, b]) => [a, b + .4 * u]), sw * .6, mixCol(PAL.sky, PAL.ink, .2), 'inkfine', .5);
  }
  // A long-handled bath brush, drawn upright from the flipper tip at (0, 0).
  function scrubBrush(u, sw) {
    paint(ribbon([[0, 0], [-.5 * u, -1.3 * u], [-1 * u, -2.6 * u]], .34 * u, .26 * u), { wash: '#C98A55', fill: '#8E5A2E', fillOp: 60, ink: PAL.ink, sw: sw * .7 });
    push(); translate(-1.15 * u, -3.05 * u); rotate(-.35);
    for (let i = 0; i < 7; i++) inkLine([[(-.66 + i * .22) * u, -.2 * u], [(-.7 + i * .23) * u, -.7 * u]], sw * .45, '#8E5A2E', 'inkfine', 0);
    paint(ellPts(0, 0, .85 * u, .4 * u, 14), { wash: PAL.rose, fill: '#C9506E', fillOp: 60, ink: PAL.ink, sw: sw * .7 });
    pop();
  }

  // A wooden desk in front of Seeky, on the ground at (x, y). top = how high its far edge stands, in u.
  function desk(x, y, u, sw, key, w = 7.4, top = 3.6) {
    boilSeed(key + ' desk');
    const wood = { wash: '#DDA56C', fill: '#B57440', fillOp: 55, tex: .6, ink: PAL.ink, sw }, front = top - 1.7;
    for (const s of [-1, 1]) paint(rectPts(x + s * (w - .3) * u - .35 * u, y - (front - .5) * u, .7 * u, (front - .5) * u), { ...wood, wash: '#B57440' });
    paint([[x - w * u, y - top * u], [x + w * u, y - top * u], [x + (w + .5) * u, y - front * u], [x - (w + .5) * u, y - front * u]], wood);
    paint(rectPts(x - (w + .5) * u, y - front * u, (2 * w + 1) * u, .55 * u), { ...wood, wash: '#C98A55' });
  }
  // A book lying open, (x, y) = the middle of its spine. flip 0..1 turns a page over from right to left.
  function book(x, y, u, sw, flip = 0) {
    const Q = pts => P(pts, x, y, u);
    paint(Q([[-3.7, -.75], [3.7, -.75], [3.95, .72], [-3.95, .72]]), { wash: PAL.teal, fill: mixCol(PAL.teal, PAL.ink, .3), fillOp: 60, ink: PAL.ink, sw });
    for (const s of [-1, 1]) {
      paint(Q([[0, -.62], [s * 1.6, -.74], [s * 3.4, -.66], [s * 3.62, .6], [s * 1.7, .5], [0, .62]]), { wash: PAL.cream, fill: '#E9DCC4', fillOp: 50, ink: PAL.ink, sw: sw * .7, curv: .3 });
      for (let l = 0; l < 4; l++) { const yy = -.42 + l * .26; inkLine(Q([[s * .45, yy], [s * 1.7, yy - .04], [s * 3, yy + .02]]), sw * .35, mixCol(PAL.cream, PAL.ink, .45), 'inkfine', .4); }
    }
    inkLine(Q([[0, -.62], [0, .62]]), sw * .6, PAL.ink, 'ink', 0);
    if (flip > 0 && flip < 1) {   // the turning page lifts off the right, stands up and lays down on the left; its edge lags, so it curls
      const c = Math.cos(flip * Math.PI), up = Math.sin(flip * Math.PI), lift = -2 * up, lag = .8 * up;
      paint(Q([[0, -.62], [c * 1.7 + lag, -.7 + lift * .55], [c * 3.4, -.66 + lift], [c * 3.6, .6 + lift], [c * 1.8 + lag, .5 + lift * .55], [0, .62]]), { wash: '#FFFDF4', fill: '#E9DCC4', fillOp: 40, ink: PAL.ink, sw: sw * .7, curv: .3 });
    }
  }
  // Two closed books and a pencil, for the side of the desk.
  function bookStack(x, y, u, sw) {
    paint(rectPts(x - 1.8 * u, y - .7 * u, 3.6 * u, .7 * u, u * .03), { wash: PAL.rose, fill: '#C9506E', fillOp: 50, ink: PAL.ink, sw: sw * .7 });
    paint(rectPts(x - 1.5 * u, y - 1.35 * u, 3.1 * u, .65 * u, u * .03), { wash: PAL.ochre, fill: '#C88A2A', fillOp: 50, ink: PAL.ink, sw: sw * .7 });
    for (const yy of [-.35, -1.02]) inkLine([[x + 1.2 * u, y + yy * u], [x + 1.6 * u, y + yy * u]], sw * .4, PAL.cream, 'inkfine', 0);
  }
  // Round reading glasses over the eyes, drawn in Seeky's body space (front view).
  function glasses(u, sw) {
    const c = '#5A3A2A';
    for (const s of [-1, 1]) {
      paint(ellPts(s * 2.5 * u, -6 * u, 1.3 * u, 1.18 * u, 20), { ink: c, sw: sw * .85 });
      inkLine([[s * 3.8 * u, -6.25 * u], [s * 4.95 * u, -6.6 * u]], sw * .7, c, 'ink', 0);
      inkLine([[s * 2.5 * u - .7 * u, -6.65 * u], [s * 2.5 * u - .25 * u, -7 * u]], sw * .45, '#FFFFFF', 'inkfine', 0);
    }
    inkLine([[-1.2 * u, -6.15 * u], [0, -6.5 * u], [1.2 * u, -6.15 * u]], sw * .7, c, 'ink', .5);
  }

  // A cup of bubble tea standing at (cx, by), its bottom middle. level 0..1.
  const CUP_H = 2.6;
  function bobaCup(cx, by, u, sw, level) {
    const tw = 1.05, bw = .82, Q = pts => P(pts, cx, by, u), at = f => lerp(bw, tw, f);
    paint(Q([[-bw, 0], [bw, 0], [tw, -CUP_H], [-tw, -CUP_H]]), { wash: '#FFFFFF', washOp: 130, ink: null });
    if (level > .01) {
      const lh = .25 + (CUP_H - .45) * level, f = lh / CUP_H;
      paint(Q([[-bw + .07, -.06], [bw - .07, -.06], [at(f) - .07, -lh], [-at(f) + .07, -lh]]), { wash: '#D9A877', fill: '#B9814E', fillOp: 50, ink: null });
    }
    const n = Math.round(lerp(2, 9, clamp(level * 1.4)));
    for (let i = 0; i < n; i++) paint(ellPts(cx + (hash(i * 3.1) - .5) * 1.3 * u, by - (.24 + .3 * Math.floor(i / 4)) * u, .2 * u, .19 * u, 8), { wash: '#3B2418', ink: null });
    paint(heartPts(cx, by - 1.3 * u, .42 * u), { wash: PAL.rose, ink: PAL.ink, sw: sw * .4 });
    paint(Q(half(0, -CUP_H, tw + .05, .5)), { wash: '#FFFFFF', washOp: 150, ink: PAL.ink, sw: sw * .6 });
    paint(Q([[-bw, 0], [bw, 0], [tw, -CUP_H], [-tw, -CUP_H]]), { ink: PAL.ink, sw: sw * .8 });
  }

  // A pet bed: the back (the far bolster and the cushion) and the front (the near bolster), on the ground at (x, y).
  function bedBack(x, y, u, sw, key) {
    boilSeed(key + ' bed back');
    paint(ellPts(x, y - 2.4 * u, 7.6 * u, 1.6 * u, 32), { wash: '#A893D2', fill: PAL.violet, fillOp: 60, tex: .5, ink: PAL.ink, sw });
    paint(ellPts(x, y - 2.25 * u, 6.7 * u, 1.05 * u, 28), { wash: '#F6D9E2', fill: PAL.rose, fillOp: 40, ink: PAL.ink, sw: sw * .6 });
  }
  function bedFront(x, y, u, sw, key) {
    boilSeed(key + ' bed front');
    const lip = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; lip.push([x + Math.cos(a) * 7.6 * u, y - 2.4 * u + Math.sin(a) * 1.6 * u]); }
    paint(lip.concat(P([[-7.5, -1.3], [-6.2, -.15], [6.2, -.15], [7.5, -1.3]], x, y, u)), { wash: '#A893D2', fill: PAL.violet, fillOp: 70, tex: .5, border: .5, ink: PAL.ink, sw, curv: .2 });
    inkLine(lip.slice(3, -3).map(([a, b]) => [a, b + .35 * u]), sw * .5, '#D9CCF0', 'inkfine', .5);
  }
  // A quilt tucked over Seeky up to its chest; breath (-1..1) lifts it.
  function quilt(x, y, u, sw, key, breath) {
    boilSeed(key + ' quilt');
    const top = through([[-6.6, -3.3], [-5.2, -4.1], [-2.8, -4.6], [0, -4.75], [2.8, -4.6], [5.2, -4.1], [6.6, -3.3]].map(([a, b]) => [a, b - .12 * breath * Math.sin((a + 6.6) / 13.2 * Math.PI)]));
    paint(P([...top, [6.9, -1.4], [-6.9, -1.4]], x, y, u), { wash: '#F2C66D', fill: PAL.ochre, fillOp: 60, tex: .5, ink: PAL.ink, sw, curv: .2 });
    inkLine(P(top.map(([a, b]) => [a, b + .45]), x, y, u), sw * .5, '#FFF5E2', 'inkfine', .5);
    for (const [a, b] of [[-4.6, -2.8], [-1.6, -3.4], [1.8, -2.6], [4.4, -3.3], [-.2, -2.1]]) paint(starPts(x + a * u, y + (b - .1 * breath) * u, .45 * u, .45, 5), { wash: PAL.cream, ink: null });
  }
  // A floppy nightcap with a pompom, in Seeky's body space; droop swings the tip.
  function nightcap(u, sw, droop) {
    const tip = [5.4 + .2 * droop, -7.6 + .35 * droop], Q = pts => P(pts, 0, 0, u);
    paint(Q([[-3.9, -7.2], [-3.3, -8.6], [-1.6, -9.8], [.6, -10.5], [2.8, -10.4], [4.6, -9.6], [5.5, -8.6], tip, [4.5, -8.7], [3.1, -9.1], [3.4, -8.1], [3.9, -7.2]]), { wash: PAL.rose, fill: '#C9506E', fillOp: 50, tex: .5, ink: PAL.ink, sw, curv: .3 });
    for (const [a, b] of [[-1.8, -8.8], [.6, -9.6], [2.6, -9.5], [-.4, -8.2]]) paint(ellPts(a * u, b * u, .3 * u, .3 * u, 10), { wash: PAL.cream, ink: null });
    paint(ribbon(Q([[-4.1, -7], [-2, -7.55], [0, -7.75], [2, -7.55], [4.1, -7]]), .9 * u), { wash: PAL.cream, fill: '#E9DCC4', fillOp: 50, ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(tip[0] * u, tip[1] * u + .3 * u, .7 * u, .7 * u, 14, u * .05), { wash: '#FFFFFF', fill: PAL.cream, fillOp: 60, ink: PAL.ink, sw: sw * .7 });
  }

  // A beach ball of radius r, spun by rot.
  function beachBall(x, y, r, sw, rot) {
    const cols = ['#E5533D', '#FFFFFF', '#F6C343', '#FFFFFF', PAL.teal, '#FFFFFF'];
    for (let i = 0; i < 6; i++) {
      const pts = [[x, y]]; for (let k = 0; k <= 5; k++) { const a = rot + (i + k / 5) * TAU / 6; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
      paint(pts, { wash: cols[i], fill: mixCol(cols[i], PAL.ink, .15), fillOp: 40, ink: null });
    }
    paint(ellPts(x, y, r * .2, r * .2, 10), { wash: '#FFFFFF', ink: PAL.ink, sw: sw * .4 });
    paint(ellPts(x, y, r, r, 26), { ink: PAL.ink, sw });
    inkLine([[x - r * .72, y - r * .2], [x - r * .58, y - r * .55], [x - r * .25, y - r * .74]], sw * .8, '#FFFFFF', 'ink', .5);
  }

  // An ice bag for the forehead, in body space; rises (in u) and spins as it's knocked loose.
  function iceBag(u, sw, rise, spin) {
    push(); translate(-1.6 * u, (-8.55 - rise) * u); rotate(-.12 + spin);
    paint(rrPts(-2 * u, -.72 * u, 3.8 * u, 1.4 * u, .68 * u), { wash: '#BFE3F5', fill: PAL.sky, fillOp: 80, tex: .5, ink: PAL.ink, sw: sw * .8 });
    for (const [a, b] of [[-1.15, -.15], [-.2, .05], [.75, -.2]]) paint(rectPts((a - .3) * u, (b - .25) * u, .6 * u, .5 * u, u * .04), { wash: '#FFFFFF', washOp: 200, ink: mixCol(PAL.sky, PAL.ink, .3), sw: sw * .35 });
    paint(rrPts(1.7 * u, -.48 * u, .85 * u, .9 * u, .25 * u), { wash: PAL.rose, fill: '#C9506E', fillOp: 50, ink: PAL.ink, sw: sw * .6 });
    pop();
  }
  // A thermometer held in the mouth, in body space, sticking up and out to the right. k 0..1 = the reading.
  function thermometer(u, sw, k, wob) {
    push(); translate(.25 * u, -4.35 * u); rotate(-.45 + wob);
    paint(rrPts(0, -.22 * u, 3.5 * u, .44 * u, .2 * u), { wash: '#F4F8FB', washOp: 235, ink: PAL.ink, sw: sw * .6 });
    paint(rrPts(.1 * u, -.09 * u, (.5 + 2.6 * clamp(k)) * u, .18 * u, .08 * u), { wash: '#E0283F', ink: null });
    for (let i = 1; i < 6; i++) inkLine([[(.7 + i * .45) * u, -.22 * u], [(.7 + i * .45) * u, -.06 * u]], sw * .3, PAL.ink, 'inkfine', 0);
    paint(ellPts(.12 * u, 0, .3 * u, .3 * u, 10), { wash: '#E0283F', ink: PAL.ink, sw: sw * .5 });
    pop();
  }
  // Droplets flung out from (x, y) over k = 0..1 (a sneeze, a shake).
  // They fly out to both sides and show from `from` u out, so they never sit on the face like spots.
  function spray(x, y, u, sw, k, n = 10, reach = 4, from = 0) {
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < n; i++) {
      const sd = i % 2 ? 1 : -1, a = (hash(i) - .6) * 1.1, d = (from + reach * easeOut(k) * (.6 + .4 * hash(i + 9))) * u, r = .28 * u * (1 - k * .6);
      paint(ellPts(x + sd * Math.cos(a) * d, y + Math.sin(a) * d * .6 + k * k * 2 * u, r, r * 1.2, 8), { wash: PAL.sky, fill: '#FFFFFF', fillOp: 60, ink: PAL.ink, sw: sw * .35 });
    }
  }
  const sparkle = (x, y, r, k) => { if (k > 0 && k < 1) paint(starPts(x, y, r * backOut(k) * (1 - k * .6), .25, 4, k * 2), { wash: PAL.cream, fill: PAL.ochre, fillOp: 50, ink: PAL.ink, sw: clamp(r / 30, .3, .8) }); };

  // ---------- the skits ----------
  const ACT = {};

  // Eat: Seeky eyes the burger, tosses it up, catches it in its big whale jaw, chews with stuffed cheeks, swallows,
  // and burps through its blowhole.
  ACT.eat = { len: 6, hat: true, draw(x, y, u, lt, o) {
    const sw = SW(u), s = 1.4 * u, tToss = 1.05, tRel = 1.25, tIn = 1.95, tShut = 2.05, tGulp = 3.9, tBurp = 4.6;
    const keys = [[0, 'hopeful', { eyes: 'shine', mouth: 'tongue', lookX: .75, lookY: -.2 }], [tRel - .05, 'excited', { eyes: 'wide', lookX: .1, lookY: -.9, emote: null }],
                  [tShut, 'happy', { mouth: null, emote: null }], [tGulp, 'relieved', { emote: null }], [tBurp + .25, 'happy', { emote: 'heart' }]];
    const pose = t => {
      const m = loopFeel(t, keys), c = { ...m, hover: hoverAt(), seed: 3, boilKey: o.key, hat: o.hat };
      c.aR = kf(t, [[0, .55], [tToss, .4], [tRel, 1.6], [tRel + .45, 1.1], [tShut, .2]]);
      if (t < tShut + .3) c.aL = kf(t, [[0, .3], [tRel, .9], [tShut, .9], [tShut + .3, m.aL ?? .2]]);
      c.lid = kf(t, [[1.3, 0], [1.6, .55], [tIn, .6], [tShut, 0]], easeOut);
      if (t > tRel && t < tShut) c.dy = (m.dy || 0) * .2;
      if (t >= tShut && t < tGulp) {   // chewing, cheeks stuffed
        c.sx = 1.12; c.sq = (m.sq || 0) * .3 + .06 * Math.sin((t - tShut) * TAU * 3.2); c.dy = (m.dy || 0) * .3; c.blush = .7; c.eyes = 'happy';
      } else if (t >= tGulp) c.sx = lerp(1.12, 1.05, ease(seg(t, tGulp, tGulp + .3)));
      const chomp = take(t, tShut, .9), gulp = take(t, tGulp, .5), burp = take(t, tBurp, .4);
      c.sq = (c.sq || 0) + chomp.sq + gulp.sq + burp.sq; c.dy = (c.dy || 0) + chomp.dy + gulp.dy + burp.dy;
      if (t > tBurp) c.spout = 1.3 * Math.exp(-(t - tBurp) * 2.5);
      return c;
    };
    const c = pose(lt);
    if (lt < tRel) c.armR = (u, sw) => { rotate(c.aR); burger(0, -.9 * s, s, sw * .9, -.1 * Math.sin(lt * 3)); };
    if (lt > tShut && lt < tGulp) c.draw = (u, sw) => {   // crumbs flicking off the corners of the mouth
      for (let i = 0; i < 4; i++) {
        const ph = frac((lt - tShut) * 1.6 + i / 4), sd = i % 2 ? 1 : -1;
        if (ph < .8) paint(ellPts(sd * (1.2 + ph * 2) * u, (-4.4 - ph * 1.2 + ph * ph * 3.5) * u, .17 * u * (1 - ph * .5), .12 * u * (1 - ph * .5), 6), { wash: '#E6A95E', ink: PAL.ink, sw: sw * .3 });
      }
    };
    seeky(x, y, u, c);
    if (lt >= tRel && lt < tIn) {   // in flight: a hop up off the flipper, then down into the jaw, which opens up and to the right
      const a = pose(tRel), [tx, ty] = flipperTip(a.aR), A = bodyAt(x, y, u, a, tx, ty - .9 * s / u), B = bodyAt(x, y, u, pose(tIn), 1.6, -6.1);
      const k = seg(lt, tRel, tIn), p = arcPt(A, B, 4.5 * u, k);
      boilSeed(o.key + ' burger');
      burger(p[0], p[1], s * (1 - .35 * seg(k, .8, 1)), sw * .9, k * 4.6);
    }
  } };

  // Drink: a bubble tea on the table, sipped through a bendy straw (pearls ride up it), an "ahh", a second long slurp
  // to the bottom, a puzzled look at the empty cup, and a sprite's sparkle refills it.
  ACT.drink = { len: 6, hat: true, draw(x, y, u, lt, o) {
    const sw = SW(u), tSip = .7, tAh = 2.6, tSip2 = 3.2, tEmpty = 4.2, tFill = 5, cx = x + 4.7 * u, by = y - 2.35 * u;
    const level = lt < tSip ? 1 : lt < tSip2 ? lerp(1, .45, seg(lt, tSip, tAh - .1)) : lt < tFill ? lerp(.45, 0, seg(lt, tSip2, tEmpty - .1)) : ease(seg(lt, tFill, 5.8));
    const m = loopFeel(lt, [[0, 'hopeful', { eyes: 'shine', lookX: .8, lookY: .6 }], [tSip, 'neutral', { eyes: 'closed', mouth: 'o', blush: .4 }], [tAh, 'happy', { emote: 'music' }],
                            [tSip2, 'neutral', { eyes: 'closed', mouth: 'o', blush: .4 }], [tEmpty, 'confused', { lookX: .8, lookY: .7 }], [tFill + .1, 'starstruck', { mouth: 'smile' }]]);
    // g: how far Seeky has leaned in to the straw (its mouth meets the straw's end at g = 1)
    const g = Math.max(ease(seg(lt, tSip - .25, tSip)) * (1 - ease(seg(lt, tAh - .1, tAh + .1))), ease(seg(lt, tSip2 - .2, tSip2)) * (1 - ease(seg(lt, tEmpty - .1, tEmpty + .1))));
    const c = { ...m, seed: 4, boilKey: o.key, hat: o.hat, noShadow: true, aL: lerp(m.aL ?? .2, -.3, g), aR: lerp(m.aR ?? .2, .1, g) };
    c.hover = lerp(hoverAt(.6), 0, g); c.dy = lerp((m.dy || 0) * .35 - .4, .35, g); c.dx = lerp(m.dx || 0, .2, g); c.sq = lerp(m.sq || 0, 0, g); c.rot = lerp(m.rot || 0, 0, g);
    if (g > .5) { c.sx = 1 - .05 * g * (.6 + .4 * Math.sin(lt * TAU * 2.5)); c.lookX = .4; }   // cheeks drawn in as it sucks
    seeky(x, y, u, c);
    desk(x, y, u, sw, o.key, 7.4, 3.1);
    boilSeed(o.key + ' cup');
    bobaCup(cx, by, u, sw, level);
    const mouth = [x + .2 * u, y - 3.95 * u], C = through([[cx + .3 * u, by - .5 * u], [cx + .3 * u, by - (CUP_H + .5) * u], [cx - .4 * u, by - (CUP_H + 1.05) * u], [mouth[0] + 2.2 * u, mouth[1] - .45 * u], [mouth[0] + .35 * u, mouth[1]]], 5);
    paint(ribbon(C, .38 * u), { wash: PAL.rose, fill: '#E2476E', fillOp: 40, ink: PAL.ink, sw: sw * .6 });
    if (g > .9 && level > .02) for (let i = 0; i < 3; i++) {   // pearls riding up the straw
      const q = C[Math.floor(frac(lt * 1.3 + i / 3) * (C.length - 1))];
      paint(ellPts(q[0], q[1], .16 * u, .16 * u, 8), { wash: '#3B2418', ink: null });
    }
    if (lt > tEmpty - .45 && lt < tEmpty) for (let i = 0; i < 3; i++) {   // the slurp at the bottom
      const a = seg(lt, tEmpty - .45 + i * .08, tEmpty), r = (.6 + a) * u;
      if (a > 0 && a < 1) inkLine([[cx - r, by - (CUP_H + .4) * u - i * .35 * u], [cx, by - (CUP_H + .7) * u - r * .3 - i * .35 * u], [cx + r, by - (CUP_H + .4) * u - i * .35 * u]], sw * .45, PAL.ink, 'inkfine', .6);
    }
    for (let i = 0; i < 5; i++) sparkle(cx + (hash(i + 4) - .5) * 4 * u, by - (.4 + 3 * hash(i + 11)) * u, .8 * u, seg(lt, tFill + i * .12, tFill + .45 + i * .12));
  } };

  // Bath: suds and a rubber duck in a clawfoot tub. Seeky scrubs its back, showers with its own blowhole, then falls for the duck.
  ACT.bath = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), rimY = y - RIM * u, ys = y - 1.2 * u, tShower = 2.3, tDuck = 4.2, tSqueak = 4.75;
    const m = loopFeel(lt, [[0, 'happy', { eyes: 'closed', emote: 'music' }], [tShower, 'laugh'], [tDuck, 'hopeful', { lookX: .8, lookY: .45, mouth: 'cat' }],
                            [tSqueak + .25, 'love', { lookX: .5, lookY: .35, tint: null }]], { take: .5 });
    const scrub = lt < tShower - .1, shower = lt >= tShower && lt < tDuck;
    const c = { ...m, hover: 0, noShadow: true, seed: 5, boilKey: o.key, spout: shower ? 1 : 0, dy: (m.dy || 0) * .15, dx: (m.dx || 0) * .3, rot: (m.rot || 0) * .4 };
    if (scrub) {
      const w = Math.sin(lt * TAU * 2.2);
      c.aR = 1.15 + .35 * w; c.aL = .35 - .15 * w; c.rot = .03 * Math.sin(lt * TAU * 1.1);
      c.armR = (u, sw) => { rotate(c.aR); scrubBrush(u, sw); };
    } else if (shower) { c.aL = c.aR = .95 + .25 * Math.sin(lt * TAU * 3); }
    else { c.aL = .2; c.aR = lerp(.3, .7, seg(lt, tDuck, tSqueak)); }
    tubBack(x, y, u, sw, o.key);
    seeky(x, ys, u, c);
    boilSeed(o.key + ' water');
    paint(ellPts(x, rimY + .25 * u, 6.8 * u, .85 * u, 28), { wash: mixCol(PAL.sky, '#FFFFFF', .35), fill: PAL.sky, fillOp: 80, ink: null });
    foam(x, rimY + .1 * u, 5.6 * u, u, sw, o.key, lt);
    boilSeed(o.key + ' duck');
    const hop = lt > tSqueak ? jump(lt, tSqueak, tSqueak + .35, .9) : { dy: 0, sq: 0 };
    duck(x + 4.5 * u, rimY + (.25 + .08 * Math.sin(lt * TAU / 2) + hop.dy) * u, 1.15 * u * (1 + hop.sq * .4), sw, -1, .08 * Math.sin(lt * TAU / 1.5));
    if (lt > tSqueak && lt < tSqueak + 1.2) emote('music', x + 5.5 * u, rimY - 3.4 * u, u * .6, seg(lt, tSqueak, tSqueak + .2), lt - tSqueak);
    tubFront(x, y, u, sw, o.key);
    boilSeed(o.key + ' shower');
    const fade = seg(lt, tShower, tShower + .3) * (1 - seg(lt, tDuck - .3, tDuck));
    if (fade > 0) {   // the blowhole's shower rains down on both sides
      const top = bodyAt(x, ys, u, c, 1.2, -10.2);
      for (let i = 0; i < 12; i++) {
        const ph = frac(lt * 1.5 + hash(i)), sd = i % 2 ? 1 : -1, p = arcPt(top, [top[0] + sd * (2.5 + 3.5 * hash(i + 5)) * u, rimY], 2 * u, ph);
        paint(ellPts(p[0], p[1], .17 * u * fade, .24 * u * fade, 8), { wash: PAL.sky, fill: '#FFFFFF', fillOp: 60, ink: PAL.ink, sw: sw * .35 });
      }
    }
    boilSeed(o.key + ' bubbles');
    for (let i = 0; i < 5; i++) {   // soap bubbles drifting up and popping
      const ph = frac(lt / 3 + i / 5), bx = x + (-5 + 10 * hash(i * 7)) * u + Math.sin(ph * 6 + i) * .6 * u, by = rimY - .6 * u - ph * 8 * u;
      bubble(bx, by, (.35 + .45 * hash(i)) * u * (.6 + .4 * ph), sw, 1 - seg(ph, .85, .95));
      popRing(bx, by, (.35 + .45 * hash(i)) * u, sw, seg(ph, .9, 1));
    }
  } };

  // Sleep: tucked into a pet bed in a nightcap, breathing slowly, a sleep bubble at its mouth. The bubble swells, pops,
  // Seeky half wakes, looks around, and drifts off again.
  ACT.sleep = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), ys = y - 1.1 * u, tSwell = 3.4, tPop = 4.2, tBack = 5.1;
    const m = loopFeel(lt, [[0, 'sleepy', { eyes: 'closed', mouth: 'o', emote: 'zzz' }], [tPop + .05, 'surprised', { eyes: 'sleepy', mouth: 'flat', emote: '?', lookX: .6 }],
                            [tBack, 'sleepy', { eyes: 'closed', mouth: 'o', emote: 'zzz' }]], { take: .4 });
    const br = Math.sin(lt * TAU / 2 - Math.PI / 2);   // three slow breaths a loop; -1 = breathed out
    const c = { ...m, hover: 0, noShadow: true, seed: 6, boilKey: o.key, spout: false, aL: -.55, aR: -.55 };
    c.sq = (m.sq || 0) * .5 + .035 * br; c.dy = (m.dy || 0) * .3; c.rot = (m.rot || 0) * .3;
    c.draw = (u, sw) => nightcap(u, sw, Math.sin(lt * TAU / 2) + 2 * spring(lt, tPop, 5, 14));
    const R = 2.6;   // the sleep bubble breathes with it, then swells to R and pops
    let r = .4 + .6 * (.5 + .5 * br);
    if (lt >= tSwell && lt < tPop) r = lerp(.4 + .6 * (.5 + .5 * Math.sin(tSwell * TAU / 2 - Math.PI / 2)), R, easeIn(seg(lt, tSwell, tPop)));
    else if (lt >= tPop) r = .4 * seg(lt, tBack + .2, 6);
    bedBack(x, y, u, sw, o.key);
    seeky(x, ys, u, c);
    quilt(x, y, u, sw, o.key, br);
    bedFront(x, y, u, sw, o.key);
    boilSeed(o.key + ' bubble');
    const [bx, bc] = bodyAt(x, ys, u, c, .35 + r * .9, -4.2 + r * .1);
    bubble(bx, bc, r * u, sw, 1, 120);
    const at = bodyAt(x, ys, u, c, .35 + R * .9, -4.2 + R * .1);
    popRing(at[0], at[1], R * u, sw, seg(lt, tPop, tPop + .3));
  } };

  // Study: reading glasses on, eyes running along the lines, a page turned, a think, and the idea lands.
  ACT.study = { len: 6, hat: true, draw(x, y, u, lt, o) {
    const sw = SW(u), tFlip = 2.3, tThink = 3.3, tIdea = 4.3;
    const m = loopFeel(lt, [[0, 'neutral', { eyes: 'look', lookY: .8 }], [tThink, 'thinking'], [tIdea, 'idea']], { take: .7 });
    const c = { ...m, hover: hoverAt(.5), seed: 7, boilKey: o.key, hat: o.hat, noShadow: true, dy: (m.dy || 0) * .3, draw: glasses };
    const flip = seg(lt, tFlip, tFlip + .6);
    if (lt < tThink) {
      const line = frac(lt / .85), scan = line < .8 ? lerp(-.65, .65, ease(line / .8)) : lerp(.65, -.65, ease((line - .8) / .2));
      c.lookX = flip > 0 && flip < 1 ? lerp(.7, -.7, flip) : scan; c.lookY = .8;
      c.aL = -.25; c.aR = flip > 0 && flip < 1 ? .2 + .7 * Math.sin(flip * Math.PI) : -.25;
    }
    seeky(x, y, u, c);
    desk(x, y, u, sw, o.key);
    boilSeed(o.key + ' book');
    book(x, y - 2.75 * u, u, sw, flip);
    bookStack(x - 5.6 * u, y - 2.55 * u, u * .9, sw);
  } };

  // Play: Seeky flips its beach ball up with a flipper, balances it on its spout, launches it sky-high, and it comes
  // down on its head. Dizzy, then it laughs.
  ACT.play = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), r = 1.7 * u, tScoop = .55, tCatch = 1.15, tCrouch = 3.2, tLaunch = 3.45, tBonk = 4.6, tRest = 5.3;
    const keys = [[0, 'hopeful', { lookX: .9, lookY: .8 }], [tScoop + .05, 'excited', { lookX: .3, lookY: -.9, emote: null }], [tCatch, 'happy', { lookY: -.9, emote: 'music' }],
                  [tLaunch, 'excited', { eyes: 'wide', lookY: -1, emote: '!' }], [tBonk, 'dizzy'], [tRest + .1, 'laugh']];
    const rest = [x + 8.5 * u, y - r];
    const pose = t => {
      const m = loopFeel(t, keys), c = { ...m, hover: hoverAt(), seed: 8, boilKey: o.key };
      if (t < tCatch + .4) c.aR = kf(t, [[0, -.5], [tScoop, -.75], [tScoop + .18, 1.3], [tCatch + .4, m.aR ?? .5]]);
      if (t > tCatch - .1 && t < tLaunch + .2) { c.spout = 1; c.dy = (m.dy || 0) * .3; c.dx = .35 * Math.sin((t - tCatch) * TAU * .55); c.aL = .9 + .3 * Math.sin(t * TAU * 1.3); c.aR = .9 - .3 * Math.sin(t * TAU * 1.3); }
      const crouch = .2 * ease(seg(t, tCrouch, tLaunch)) * (t < tLaunch ? 1 : 0), go = take(t, tLaunch, 1), bonk = take(t, tBonk, 1.1);
      c.sq = (m.sq || 0) + crouch + go.sq + bonk.sq; c.dy = (c.dy || 0) + go.dy;
      if (t >= tBonk && t < tBonk + .25) c.dy += .4 * Math.sin(seg(t, tBonk, tBonk + .25) * Math.PI);   // knocked down a little
      return c;
    };
    const c = pose(lt);
    seeky(x, y, u, c);
    const jet = t => { const p = pose(t); return bodyAt(x, y, u, p, 1.2, -10.2); };
    let p;
    if (lt < tScoop + .1) p = rest;
    else if (lt < tCatch) { const j = jet(tCatch); p = arcPt(rest, [j[0], j[1] - r], 6 * u, seg(lt, tScoop + .1, tCatch)); }
    else if (lt < tLaunch) { const j = jet(lt); p = [j[0], j[1] - r - .3 * u * Math.abs(Math.sin(lt * TAU * 1.4))]; }
    else if (lt < tBonk) { const j = jet(tLaunch), h = bodyAt(x, y, u, pose(tBonk), 0, -8.05); p = arcPt([j[0], j[1] - r], [h[0], h[1] - r], 15 * u, seg(lt, tLaunch, tBonk)); }
    else if (lt < tRest) {   // it bounces off the head, lands, hops once more and settles
      const h = bodyAt(x, y, u, pose(tBonk), 0, -8.05), k = seg(lt, tBonk, tRest), mid = [x + 6.5 * u, y - r];
      p = k < .65 ? arcPt([h[0], h[1] - r], mid, 4 * u, k / .65) : arcPt(mid, rest, 1.2 * u, (k - .65) / .35);
    } else p = rest;
    boilSeed(o.key + ' ball');
    const air = clamp((y - r - p[1]) / (14 * u));
    paint(ellPts(p[0], y + .15 * u, r * (1 - .5 * air), .35 * u * (1 - .5 * air), 16), { fill: PAL.ink, fillOp: 60 * (1 - air), bleed: .25, tex: .3, ink: null });
    if (lt > tLaunch && lt < tLaunch + .3) {   // the launch: a column of spray chasing the ball up from the blowhole
      const h = bodyAt(x, y, u, c, 1.2, -7.9), k = seg(lt, tLaunch, tLaunch + .3), top = lerp(h[1], Math.max(p[1] + r, h[1] - 8 * u), .8);
      const col = []; for (let i = 0; i <= 5; i++) col.push([lerp(h[0], p[0], i / 5) + Math.sin(i * 2.1 + lt * 30) * .15 * u, lerp(h[1], top, i / 5)]);
      const o2 = { wash: '#D4E0FF', fill: PAL.sky, fillOp: 50, ink: PAL.ink, sw: sw * .5 };
      paint(ribbon(col, .7 * u, 1.9 * u * (1 - k * .5)), o2);
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .5, d = (1 + 1.6 * k) * u; paint(ellPts(p[0] + Math.cos(a) * d * 1.2, top + Math.sin(a) * d * .6 + k * u, .22 * u * (1 - k * .5), .3 * u * (1 - k * .5), 8), o2); }
    }
    beachBall(p[0], p[1], r, sw, seg(lt, tScoop, tRest) * 16 * Math.PI / 3);
  } };

  // Sick: green round the gills, an ice bag on its head, a thermometer in its mouth, shivering. It winds up, ah... ah...
  // and sneezes: the bag flies off, the blowhole fires, then it sniffles back into misery.
  ACT.sick = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), tAh = 2.2, tChoo = 2.95, tSniff = 3.9, ill = { tint: 'green', tintK: .35, blush: .7, mouth: null };
    const m = loopFeel(lt, [[0, 'sad', { ...ill, eyes: 'teary', emote: 'sweat', gloom: .15 }], [tAh, 'neutral', { ...ill, eyes: 'teary', lookY: -.7, emote: null }],
                            [tChoo, 'surprised', { ...ill, eyes: 'squeeze', emote: null }], [tSniff, 'sad', { ...ill, eyes: 'teary', emote: 'sweat', gloom: .15 }]], { take: .6 });
    const wind = ease(seg(lt, tAh, tChoo - .05)) * (lt < tChoo ? 1 : 0), ah = Math.sin(seg(lt, tAh, tChoo) * Math.PI * 2);
    const c = { ...m, hover: hoverAt(.5), seed: 9, boilKey: o.key, dx: (m.dx || 0) + .07 * Math.sin(lt * TAU * 13) * (1 - wind) };
    c.sq = (m.sq || 0) - .14 * wind + .03 * ah * wind; c.dy = (m.dy || 0) * .5 - .5 * wind; c.squint = Math.max(c.squint || 0, .7 * wind);
    const choo = take(lt, tChoo, 1.4); if (lt >= tChoo - .02) { c.sq += choo.sq; c.dy += choo.dy; }
    c.spout = lt > tChoo ? 1.5 * Math.exp(-(lt - tChoo) * 2.5) : false;
    if (lt > tChoo && lt < tChoo + .9) { c.aL = c.aR = 1.2 * Math.exp(-(lt - tChoo) * 4); } else { c.aL = -.5 + .05 * Math.sin(lt * TAU * 13); c.aR = -.55; }
    const fly = seg(lt, tChoo, tChoo + .7), rise = 4.2 * 4 * fly * (1 - fly);
    c.draw = (u, sw) => {
      thermometer(u, sw, .45 + .45 * seg(lt, 0, tAh), .4 * spring(lt, tChoo, 5, 22));
      iceBag(u, sw, rise, fly > 0 && fly < 1 ? Math.sin(fly * Math.PI) * 1.1 : 0);
    };
    seeky(x, y, u, c);
    boilSeed(o.key + ' sneeze');
    const mouth = bodyAt(x, y, u, c, 0, -4.3);
    spray(mouth[0], mouth[1], u, sw, seg(lt, tChoo, tChoo + .55), 14, 4, 5.2);
  } };

  // ---------- more props ----------
  // A gear of n teeth, spun by rot.
  function gear(x, y, r, n, rot, sw, col = '#B9C0CF') {
    const pts = []; for (let i = 0; i < n * 4; i++) { const a = rot + i / (n * 4) * TAU, q = i % 4 < 2 ? r : r * .76; pts.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); }
    paint(pts, { wash: col, fill: mixCol(col, PAL.ink, .3), fillOp: 50, ink: PAL.ink, sw });
    paint(ellPts(x, y, r * .3, r * .3, 12), { wash: PAL.paper, ink: PAL.ink, sw: sw * .7 });
  }
  // A laptop on the desk, seen from behind; (x, y) = the middle of the lid's bottom edge. A little whale sticker on the lid.
  function laptop(x, y, u, sw) {
    paint(P([[-3.4, 0], [3.4, 0], [3.7, .45], [-3.7, .45]], x, y, u), { wash: '#AEB5C3', ink: PAL.ink, sw: sw * .8 });
    paint(rrPts(x - 3.1 * u, y - 2.5 * u, 6.2 * u, 2.55 * u, .35 * u), { wash: '#D3D8E2', fill: '#9AA2B1', fillOp: 50, tex: .5, ink: PAL.ink, sw });
    paint(ribbon(P([[-.5, -1.15], [-1, -1.5], [-.95, -1.95]], x, y, u), .32 * u, .14 * u), { wash: PAL.ds, ink: PAL.ink, sw: sw * .4 });
    paint(ellPts(x, y - 1.1 * u, .8 * u, .5 * u, 14), { wash: PAL.ds, ink: PAL.ink, sw: sw * .5 });
  }
  // The answer: a card with a big tick, popping out of the laptop.
  function answerCard(x, y, u, sw, rot, k) {
    if (k <= .02) return;
    push(); translate(x, y); rotate(rot); scale(k);
    paint(rrPts(-1.3 * u, -1.6 * u, 2.6 * u, 3.2 * u, .25 * u), { wash: '#FFFFFF', fill: PAL.cream, fillOp: 40, ink: PAL.ink, sw: sw * .8 });
    for (let l = 0; l < 3; l++) inkLine([[-.9 * u, (.45 + l * .38) * u], [(.9 - l * .3) * u, (.45 + l * .38) * u]], sw * .4, mixCol(PAL.cream, PAL.ink, .45), 'inkfine', .3);
    inkLine([[-.7 * u, -.65 * u], [-.15 * u, -.1 * u], [.85 * u, -1.15 * u]], sw * 1.6, PAL.sap, 'ink', 0);
    pop();
  }

  // A pond on the ground, centred at (x, y); rings = [[x, y, k], ...] ripples spreading out, k 0..1.
  function pond(x, y, u, sw, rings) {
    paint(ellPts(x, y, 4.2 * u, 1.05 * u, 30, u * .04), { wash: mixCol(PAL.sky, PAL.ds, .25), fill: PAL.ds, fillOp: 60, bleed: .2, tex: .5, ink: PAL.ink, sw });
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) inkLine([[x + s * 4 * u + k * .25 * u, y - .3 * u], [x + s * 4 * u + k * .45 * u, y - 1.1 * u - .2 * u * (k === 0)]], sw * .5, PAL.sap, 'inkfine', .4);
    for (const [rx, ry, k] of rings) if (k > 0 && k < 1) paint(ellPts(rx, ry, (.4 + 1.6 * k) * u, (.12 + .45 * k) * u, 18), { ink: mixCol(PAL.cream, PAL.ds, .25), sw: sw * .5 * (1 - k) });
  }
  function bobber(x, y, u, sw) {
    paint(ellPts(x, y, .35 * u, .35 * u, 12), { wash: '#FFFFFF', ink: PAL.ink, sw: sw * .6 });
    paint(half(x / u, y / u, .35, .35).map(([a, b]) => [a * u, b * u]), { wash: '#E5533D', ink: null });
    inkLine([[x, y - .35 * u], [x, y - .7 * u]], sw * .5, PAL.ink, 'inkfine', 0);
  }
  // An old boot hanging by its top from (x, y), dripping.
  function boot(x, y, s, sw, rot, t) {
    push(); translate(x, y); rotate(rot);
    const Q = pts => P(pts, 0, 0, s);
    paint(Q([[-.55, 0], [.5, 0], [.55, 1.25], [1.35, 1.45], [1.65, 1.9], [1.6, 2.15], [-.62, 2.15], [-.62, 1.1]]), { wash: '#8A5A3A', fill: '#5E3A22', fillOp: 60, tex: .5, ink: PAL.ink, sw, curv: .2 });
    paint(Q([[-.66, 2.05], [1.64, 2.05], [1.66, 2.38], [-.66, 2.38]]), { wash: '#3B2A20', ink: PAL.ink, sw: sw * .7 });
    for (let k = 0; k < 3; k++) inkLine(Q([[-.3, .35 + k * .3], [.3, .5 + k * .3]]), sw * .5, PAL.cream, 'inkfine', 0);
    paint(ellPts(-.2 * s, 2.15 * s, .35 * s, .2 * s, 10), { wash: PAL.sap, ink: PAL.ink, sw: sw * .4 });   // a strand of weed
    for (let i = 0; i < 2; i++) { const ph = frac(t * 1.4 + i * .5); paint(ellPts((.4 + i * .7) * s, (2.5 + ph * 1.6) * s, .1 * s, .14 * s, 8), { wash: PAL.sky, ink: PAL.ink, sw: sw * .3 }); }
    pop();
  }
  // A little orange fish, nose along `rot`.
  function fishy(x, y, s, sw, rot) {
    push(); translate(x, y); rotate(rot);
    paint(P([[-1.1, 0], [-1.7, -.55], [-1.6, .55]], 0, 0, s), { wash: '#F08A3C', ink: PAL.ink, sw: sw * .6 });
    paint(ellPts(0, 0, 1.15 * s, .6 * s, 16), { wash: '#F6A44C', fill: '#F08A3C', fillOp: 60, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(.55 * s, -.12 * s, .12 * s, .14 * s, 8), { wash: PAL.ink, ink: null });
    inkLine([[.5 * s, .22 * s], [.8 * s, .3 * s], [1 * s, .15 * s]], sw * .45, PAL.ink, 'inkfine', .5);   // grinning at you
    pop();
  }

  // A terracotta pot on the ground at (x, y); its soil sits at y - 2.1u.
  function flowerPot(x, y, u, sw) {
    paint(P([[-.9, 0], [.9, 0], [1.15, -1.7], [-1.15, -1.7]], x, y, u), { wash: '#D9805A', fill: PAL.clayDk, fillOp: 50, tex: .5, ink: PAL.ink, sw });
    paint(ellPts(x, y - 2.05 * u, 1.15 * u, .26 * u, 14), { wash: '#5A3A22', ink: null });
    paint(rrPts(x - 1.35 * u, y - 2.2 * u, 2.7 * u, .6 * u, .15 * u), { wash: '#E28E66', fill: PAL.clayDk, fillOp: 40, ink: PAL.ink, sw: sw * .8 });
  }
  // A plant growing out of the soil at (x, y): h = stem height in u, bloom 0..1 opens the flower, sway bends it.
  function plant(x, y, u, sw, h, bloom, sway) {
    const top = [x + sway * h * .18 * u, y - h * u], leafO = { wash: '#8CC56A', fill: PAL.sap, fillOp: 70, ink: PAL.ink, sw: sw * .55 };
    paint(ribbon([[x, y], [x + sway * h * .05 * u, y - h * .5 * u], top], .24 * u, .16 * u), { wash: '#7FB25A', ink: PAL.ink, sw: sw * .5 });
    [[.18, -1, .3], [.45, 1, 1.4], [.7, -1, 2.4]].forEach(([f, s, need]) => {
      const g = clamp((h - need) / .6); if (g <= 0 && need > .3) return;
      const lx = x + sway * h * f * .1 * u, ly = y - h * f * u;
      paint(ellPts(lx + s * .6 * u * Math.max(g, .6), ly, .7 * u * Math.max(g, .6), .3 * u * Math.max(g, .6), 12, 0, s * -.5), leafO);
    });
    if (bloom > 0) {
      const r = .62 * u * backOut(bloom);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; paint(ellPts(top[0] + Math.cos(a) * r, top[1] + Math.sin(a) * r, r * .62, r * .62, 12), { wash: PAL.rose, fill: '#E2476E', fillOp: 50, ink: PAL.ink, sw: sw * .5 }); }
      paint(ellPts(top[0], top[1], r * .5, r * .5, 12), { wash: '#F6C343', fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: sw * .5 });
    } else if (h > 3) paint(ellPts(top[0], top[1] - .2 * u, .35 * u, .5 * u, 12), { wash: '#8CC56A', fill: PAL.rose, fillOp: 50 * clamp(h - 3), ink: PAL.ink, sw: sw * .5 });
  }

  // An easel with a canvas: (cx, top) = the middle of the canvas's top edge, CW × CH u, legs to the ground y.
  const CW = 3.8, CH = 3.4;
  function easel(cx, top, y, u, sw) {
    const wood = { wash: '#C98A55', fill: '#8E5A2E', fillOp: 50, ink: PAL.ink, sw: sw * .7 };
    paint(ribbon([[cx, top - .8 * u], [cx + .1 * u, y]], .3 * u), wood);
    for (const s of [-1, 1]) paint(ribbon([[cx + s * .4 * u, top - .5 * u], [cx + s * 2 * u, y]], .32 * u), wood);
    paint(rectPts(cx - 2.3 * u, top + (CH + .05) * u, 4.6 * u, .35 * u), wood);
  }
  // Seeky's self-portrait, painted stroke by stroke: k[i] 0..1 is how far each stroke has come in (wash, body, tail, belly, face).
  function portrait(cx, top, u, sw, k, fold) {
    push(); translate(cx, top); scale(1, 1 - fold);   // fold: the sheet flipping up and over the top
    const Q = (pts, s = u) => pts.map(([a, b]) => [a * s, b * s]), g = i => ease(k[i]);
    paint(rectPts(-CW / 2 * u, 0, CW * u, CH * u), { wash: '#FFFDF4', ink: PAL.ink, sw: sw * .8 });
    if (g(0) > 0) paint(rectPts(-CW / 2 * u + .2 * u, .2 * u, (CW - .4) * u * g(0), (CH - .4) * u), { fill: PAL.sky, fillOp: 90, bleed: .2, tex: .6, ink: null });
    const by = 2.3;
    if (g(2) > 0) paint(ribbon(Q([[-.6, by - .2], [-1.2, by - .7], [-1.3, by - 1.4 * g(2)]]), .38 * u, .2 * u), { wash: PAL.ds, ink: PAL.ink, sw: sw * .5 });
    if (g(1) > 0) paint(Q(half(0, by + .45, 1.3 * g(1), 1.1 * g(1))), { wash: PAL.ds, fill: PAL.dsDk, fillOp: 50, ink: PAL.ink, sw: sw * .6 });
    if (g(3) > 0) paint(ellPts(0, (by + .25) * u, .85 * u * g(3), .22 * u * g(3), 12), { wash: '#E6EBFF', ink: null });
    if (g(4) > 0) {
      for (const s of [-1, 1]) paint(ellPts(s * .45 * u, (by - .3) * u, .12 * u * g(4), .17 * u * g(4), 8), { wash: PAL.ink, ink: null });
      if (g(4) > .6) inkLine(Q([[-.25, by - .05], [0, by + .1], [.25, by - .05]]), sw * .45, PAL.ink, 'inkfine', .5);
      if (g(4) > .8) for (const s of [-1, 1]) inkLine(Q([[.3 * s, by - 1], [.5 * s, by - 1.35]]), sw * .4, PAL.ds, 'inkfine', .3);
    }
    pop();
  }
  // A paintbrush running out along the arm from the flipper tip; tip = the colour on it.
  function paintbrush(u, sw, tip) {
    paint(ribbon([[0, 0], [2.1 * u, 0]], .22 * u, .16 * u), { wash: '#E5533D', ink: PAL.ink, sw: sw * .5 });
    paint(P([[2.05, -.14], [2.5, -.16], [2.95, 0], [2.5, .16], [2.05, .14]], 0, 0, u), { wash: tip, ink: PAL.ink, sw: sw * .5, curv: .4 });
  }

  // Deep think: glasses on, typing at the laptop; then a long think (gears grinding faster and faster), and the answer
  // pops out of the laptop. Seeky is very pleased with itself.
  ACT.think = { len: 6, hat: true, draw(x, y, u, lt, o) {
    const sw = SW(u), tThink = 1.3, tAns = 3.45, tProud = 4.3;
    const m = loopFeel(lt, [[0, 'determined', { eyes: 'determined', lookY: .7 }], [tThink, 'thinking', { emote: null }], [tAns, 'idea', { emote: null }], [tProud, 'proud', { emote: 'spark' }]], { take: .7 });
    const c = { ...m, hover: hoverAt(.5), seed: 10, boilKey: o.key, hat: o.hat, noShadow: true, dy: (m.dy || 0) * .3, draw: glasses };
    if (lt < tThink || lt > 5.5) { c.aL = -.15 + .4 * Math.abs(Math.sin(lt * TAU * 3.6)); c.aR = -.15 + .4 * Math.abs(Math.cos(lt * TAU * 3.6)); }   // tap tap tap
    else if (lt < tAns) { c.aL = -.3; c.aR = lerp(-.3, .95, ease(seg(lt, tThink, tThink + .3))); c.lookX = .4; c.lookY = -.8; }
    else if (lt < tProud) { c.aL = c.aR = 1.2 + .2 * Math.sin(lt * TAU * 3); }
    seeky(x, y, u, c);
    desk(x, y, u, sw, o.key);
    boilSeed(o.key + ' laptop');
    laptop(x, y - 2.85 * u, u, sw);
    if (lt < tThink || lt > 5.5) for (let i = 0; i < 2; i++) {   // the clatter of keys
      const ph = frac(lt * 4 + i * .5), s = i ? 1 : -1;
      inkLine([[x + s * (3.4 + ph * .5) * u, y - (3.4 + ph * .6) * u], [x + s * (3.8 + ph * .5) * u, y - (3.8 + ph * .6) * u]], sw * .5 * (1 - ph), PAL.ink, 'inkfine', 0);
    }
    boilSeed(o.key + ' gears');
    const gk = seg(lt, tThink + .1, tThink + .4) * (1 - seg(lt, tAns - .1, tAns + .1)), spin = 1.4 * Math.pow(Math.max(0, lt - tThink), 2.2);
    if (gk > 0) {
      const g0 = bodyAt(x, y, u, c, 3.6, -11.2), r = 1.25 * u * backOut(gk);
      gear(g0[0], g0[1], r, 8, spin, sw * .7);
      gear(g0[0] + 1.85 * u * backOut(gk), g0[1] + 1.05 * u, r * .62, 6, -spin * 1.5 + .3, sw * .6, '#D9C27A');
      if (lt > 2.7) emote('sweat', g0[0] - 4.5 * u, g0[1] + 1.5 * u, u * .55, seg(lt, 2.7, 2.9), lt - 2.7);
    }
    boilSeed(o.key + ' answer');
    if (lt > tAns && lt < 5.6) {
      const k = seg(lt, tAns, tAns + .5), p = arcPt([x, y - 4.5 * u], [x + 5.5 * u, y - 10.5 * u], 2 * u, easeOut(k));
      answerCard(p[0], p[1] + Math.sin(lt * 3) * .2 * u, u, sw, .15 * Math.sin(lt * 2) - .1 + (1 - k) * 1.5, backOut(k) * (1 - seg(lt, 5.3, 5.6)));
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; sparkle(x + 5.5 * u + Math.cos(a) * 2.4 * u, y - 10.5 * u + Math.sin(a) * 2.4 * u, .7 * u, seg(lt, tAns + .35 + i * .05, tAns + .8 + i * .05)); }
    }
  } };

  // Slacking off, literally: 摸鱼. Seeky dozes over its rod, the float bobs, a bite! It hauls in... an old boot.
  // A fish jumps out to laugh at it; the boot goes back in, and the line is cast again.
  ACT.fish = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 3 * u, px = x + 6.8 * u, py = y + .25 * u, ROD = [4.2, -4.6];
    const tBite = 1.7, tPull = 2.4, tHang = 3, tBoot = 3.6, tToss = 4.7, tSplash = 5.15, tCast = 5.25, tLand = 5.6;
    const m = loopFeel(lt, [[0, 'bored', { lookX: .8, lookY: .5, emote: 'zzz' }], [tBite + .05, 'surprised', { lookX: .9, lookY: .6 }], [tPull, 'excited', { lookX: .6, lookY: -.6, emote: null }],
                            [tHang + .1, 'starstruck', { lookX: .6, lookY: -.5 }], [tBoot, 'disgusted', { lookX: .6, lookY: -.4 }], [tToss + .2, 'bored', { lookX: .8, lookY: .5, emote: null }]], { take: .6 });
    const c = { ...m, hover: hoverAt(), seed: 11, boilKey: o.key, aL: m.aL ?? .2, dy: (m.dy || 0) * .4, dx: (m.dx || 0) * .3, rot: 0 };
    const bite = lt > tBite && lt < tPull ? Math.max(0, Math.sin((lt - tBite) * TAU * 3)) : 0;
    const bend = lt < tPull ? bite * .8 : lt < tHang ? 1.4 * (1 - seg(lt, tPull + .2, tHang)) : lt < tToss ? .5 + .1 * Math.sin(lt * 6) : 0;
    c.aR = kf(lt, [[0, .25], [tPull, .2], [tPull + .25, 1.25], [tHang, 1.05], [tToss, 1.0], [tToss + .2, 1.5], [tCast, 1.3], [tLand, .25]]);
    if (lt < tBite) c.aR += .05 * Math.sin(lt * 1.5);
    const tipBody = () => { const [tx, ty] = flipperTip(c.aR); return [tx + ROD[0] + bend * .5, ty + ROD[1] + bend * 1.3]; };
    c.armR = (u, sw) => {
      rotate(c.aR);
      paint(ribbon([[0, .3 * u], [2.1 * u, -2.3 * u + bend * .45 * u], [(ROD[0] + bend * .5) * u, (ROD[1] + bend * 1.3) * u]], .3 * u, .12 * u), { wash: '#8E5A2E', ink: PAL.ink, sw: sw * .6 });
      paint(ellPts(.55 * u, -.35 * u, .38 * u, .38 * u, 12), { wash: '#B9C0CF', ink: PAL.ink, sw: sw * .5 });
    };
    boilSeed(o.key + ' pond');
    const splashK = seg(lt, tPull, tPull + .5), backK = seg(lt, tSplash, tSplash + .5), landK = seg(lt, tLand, tLand + .6);
    const fishK = seg(lt, 3.95, 4.6);
    pond(px, py, u, sw, [[px - 1 * u, py - .1 * u, bite > .5 ? frac(lt * 3) : 0], [px - 1 * u, py, splashK], [px + .8 * u, py, backK], [px - 1 * u, py, landK],
                        [px + 1.8 * u, py, seg(lt, 3.95, 4.3)], [px + .2 * u, py, seg(lt, 4.55, 4.9)], [px - 1 * u, py, frac(lt / 1.7) * (lt < tBite ? 1 : 0)]]);
    seeky(sx, y, u, c);
    const tip = bodyAt(sx, y, u, c, ...tipBody()), float = [px - 1 * u, py - .25 * u + (bite * .5 + .06 * Math.sin(lt * 3)) * u];
    boilSeed(o.key + ' line');
    let end = float;
    if (lt >= tPull && lt < tToss + .15) {   // the catch on the line
      const hang = [tip[0] + Math.sin((lt - tHang) * 4) * .9 * u * (lt > tHang), tip[1] + 1.2 * u];
      const b = lt < tHang ? arcPt([px - 1 * u, py], hang, 2.5 * u, easeOut(seg(lt, tPull, tHang))) : hang;
      boot(b[0], b[1], .95 * u, sw * .8, lt < tHang ? (1 - seg(lt, tPull, tHang)) * 2 : .15 * Math.sin((lt - tHang) * 4), lt);
      end = b;
    } else if (lt >= tToss + .15 && lt < tSplash) {   // flung back into the pond
      const b = arcPt([tip[0], tip[1] + 1.2 * u], [px + .8 * u, py], 3 * u, seg(lt, tToss + .15, tSplash));
      boot(b[0], b[1], .95 * u, sw * .8, seg(lt, tToss + .15, tSplash) * 4, lt);
      end = null;
    }
    if (lt >= tSplash && lt < tLand) end = null;
    if (lt >= tCast && lt < tLand) end = arcPt(tip, float, 2 * u, seg(lt, tCast, tLand));
    if (end) {
      const mid = [lerp(tip[0], end[0], .5), Math.max(tip[1], end[1]) + (lt < tPull ? (1 - bite) * 1.2 * u : 0)];
      inkLine([tip, mid, end], sw * .35, PAL.ink, 'inkfine', .6);
      if (end === float || lt >= tCast) bobber(end[0], end[1], u, sw);
    }
    if (fishK > 0 && fishK < 1) {   // a fish leaps out, grinning at the boot
      const f = arcPt([px + 1.8 * u, py], [px + .2 * u, py], 3.5 * u, fishK);
      fishy(f[0], f[1], .75 * u, sw, -Math.PI + (fishK - .5) * 2.4);
    }
    spray(px - 1 * u, py - .3 * u, u, sw, splashK, 8, 2.5, .5);
    spray(px + .8 * u, py - .3 * u, u, sw, backK, 8, 2.5, .5);
  } };

  // Watering: Seeky waters a sprout with its blowhole, and it shoots up in spurts into a flower. Seeky sniffs it,
  // picks it and wears it, and a new sprout pokes up.
  ACT.water = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 2.5 * u, potX = x + 6 * u, soil = y - 2.1 * u, tPour = .6, tStop = 2.9, tBloom = 3.2, tSniff = 3.7, tPick = 4.7, tWear = 5.1, tBlink = 5.85;
    const m = loopFeel(lt, [[0, 'hopeful', { lookX: .9, lookY: .5 }], [tPour, 'happy', { eyes: 'closed', emote: 'music' }], [tStop, 'hopeful', { lookX: .9, lookY: .2, emote: null }],
                            [tBloom + .1, 'starstruck', { lookX: .8 }], [tSniff, 'love', { eyes: 'closed', tint: null, emote: 'hearts' }], [tWear, 'happy', { emote: null }]], { take: .6 });
    const pouring = lt > tPour && lt < tStop, lean = ease(seg(lt, tSniff - .2, tSniff + .2)) * (1 - ease(seg(lt, tPick, tPick + .3)));
    const c = { ...m, hover: hoverAt(), seed: 12, boilKey: o.key, spout: pouring ? 1.2 : 0, dy: (m.dy || 0) * .4, dx: (m.dx || 0) * .3 + 1.4 * lean };
    c.aR = lerp(m.aR ?? .3, .9, ease(seg(lt, tPick - .3, tPick)) * (1 - ease(seg(lt, tWear - .1, tWear + .2))));
    if (lt > tWear && lt < tBlink + .1) c.hat = 'flower';
    if (lt > tBlink - .1) c.squint = Math.max(c.squint || 0, Math.sin(seg(lt, tBlink - .1, 6) * Math.PI));
    seeky(sx, y, u, c);
    // the plant grows in spurts while it's watered, then shrinks back to a sprout once the flower is picked
    const grow = ease(seg(lt, tPour + .3, tStop)), steps = Math.floor(grow * 4) / 4 + ease(frac(grow * 4) * 2) / 4 * (grow < 1), h0 = lerp(.7, 4.2, Math.min(1, steps));
    const h = lt < tWear ? h0 + .25 * spring(lt, tBloom, 5, 16) : lerp(4.2, .7, ease(seg(lt, tWear, 6)));
    const bloom = lt < tPick ? seg(lt, tBloom, tBloom + .5) : 0;
    boilSeed(o.key + ' pot');
    plant(potX, soil, u, sw, h, bloom, .25 * Math.sin(lt * 1.7) + .4 * spring(lt, tBloom, 4, 12));
    flowerPot(potX, y, u, sw);
    boilSeed(o.key + ' water');
    if (lt > tPour - .1 && lt < tStop + .4) {   // an arc of drops from the blowhole to the pot
      const top = bodyAt(sx, y, u, c, 1.2, -10.2), fade = seg(lt, tPour - .1, tPour + .2) * (1 - seg(lt, tStop, tStop + .4));
      for (let i = 0; i < 9; i++) {
        const p = arcPt(top, [potX + (hash(i) - .5) * u, soil], 3.2 * u, frac(lt * 1.6 + i / 9)), r = .2 * u * fade;
        paint(ellPts(p[0], p[1], r, r * 1.25, 8), { wash: PAL.sky, fill: '#FFFFFF', fillOp: 60, ink: PAL.ink, sw: sw * .35 });
      }
    }
    if (lt > tPick && lt < tWear) {   // the picked flower hops to Seeky's head
      const k = seg(lt, tPick, tWear), p = arcPt([potX, soil - 4.2 * u], bodyAt(sx, y, u, c, 2.5, -7.6), 2.5 * u, ease(k)), r = .62 * u * (1 - .4 * k);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3 + k * 4; paint(ellPts(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r, r * .62, r * .62, 12), { wash: PAL.rose, ink: PAL.ink, sw: sw * .5 }); }
      paint(ellPts(p[0], p[1], r * .5, r * .5, 12), { wash: '#F6C343', ink: PAL.ink, sw: sw * .5 });
    }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; sparkle(potX + Math.cos(a) * 2 * u, soil - 4.2 * u + Math.sin(a) * 1.8 * u, .65 * u, seg(lt, tBloom + .1 + i * .05, tBloom + .55 + i * .05)); }
  } };

  // Painting: at the easel, Seeky paints stroke by stroke: the sky, a blue dome, the tail, the belly, the face. It's a
  // self-portrait. Ta-da! Then the sheet flips over for the next one.
  ACT.paint = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 3.5 * u, ps = 1.35, U = u * ps, cx = sx + 10.4 * u, top = y - 9.6 * u, tShow = 4.25, tFlip = 5.3;   // U: the canvas's own unit
    const strokes = [[.5, 1.2, .9, PAL.sky], [1.25, 2.1, 2.4, PAL.ds], [2.15, 2.75, 1.4, PAL.ds], [2.8, 3.3, 2.6, '#E6EBFF'], [3.35, 3.95, 2, PAL.ink]];
    const k = strokes.map(([a, b]) => lt >= tFlip + .7 ? 0 : seg(lt, a, b));
    const cur = strokes.find(([a, b]) => lt >= a - .15 && lt < b + .05);
    const m = loopFeel(lt, [[0, 'neutral', { eyes: 'look', lookX: .9, lookY: -.1 }], [.45, 'determined', { lookX: .9, lookY: -.2 }], [tShow, 'proud', { emote: 'spark' }], [tFlip + .1, 'happy']], { take: .6 });
    const c = { ...m, hover: hoverAt(), seed: 13, boilKey: o.key, hat: o.hat, dy: (m.dy || 0) * .4, dx: (m.dx || 0) * .3 };
    if (cur && lt < tShow) {   // aim the brush tip at the stroke, dabbing
      const ty = (top - y) / u + cur[2] * ps - .3;   // stroke height, body-local (the ground is 0)
      c.aR = Math.asin(clamp((-4.5 - ty) / 5.2, -.9, .99)) + .07 * Math.sin(lt * TAU * 5); c.dx = (c.dx || 0) + .25 * Math.sin(lt * TAU * 1.3);
    } else if (lt >= tShow) { c.aR = lerp(.2, -.6, ease(seg(lt, tShow, tShow + .3))); c.aL = 1.2 + .15 * Math.sin(lt * TAU * 2); }   // brush down: look at it
    else c.aR = .2;
    const tipCol = cur ? cur[3] : PAL.ds;
    c.armR = (u, sw) => paintbrush(u, sw, tipCol);
    boilSeed(o.key + ' easel');
    easel(cx, top, y, U, sw);
    if (lt > tFlip) portrait(cx, top, U, sw, [0, 0, 0, 0, 0], 0);   // the fresh sheet underneath
    const fold = ease(seg(lt, tFlip, tFlip + .6));
    if (fold < 1) portrait(cx, top, U, sw, lt > tFlip ? [1, 1, 1, 1, 1] : k, fold);
    paint(rrPts(cx - .6 * U, top - .35 * U, 1.2 * U, .5 * U, .1 * U), { wash: '#C98A55', ink: PAL.ink, sw: sw * .6 });   // the clamp
    seeky(sx, y, u, c);
    boilSeed(o.key + ' palette');
    paint(ellPts(sx - 6.3 * u, y - 4.4 * u, 1.3 * u, .8 * u, 16, 0, -.3), { wash: '#E0B98A', ink: PAL.ink, sw: sw * .7 });
    [[PAL.ds, -.5, -.2], [PAL.sky, .1, -.45], ['#E5533D', .55, -.05], ['#F6C343', -.1, .3]].forEach(([col, a, b]) => paint(ellPts(sx + (-6.3 + a) * u, y + (-4.4 + b) * u, .22 * u, .18 * u, 8), { wash: col, ink: null }));
  } };

  // ---------- even more props ----------
  // Confetti bursting out of (x, y), a seconds ago: flung up, then fluttering down.
  function confetti(x, y, u, sw, a, n = 28) {
    if (a <= 0 || a > 2) return;
    const cols = [PAL.rose, PAL.ochre, PAL.sky, PAL.sap, PAL.violet, '#E5533D'];
    for (let i = 0; i < n; i++) {
      const vx = (hash(i) - .5) * 14 * u, vy = -(7 + 6 * hash(i + 3)) * u, px = x + vx * a * .7 + Math.sin(a * 6 + i) * .4 * u, py = y + vy * a + 9 * u * a * a;
      paint(ellPts(px, py, .26 * u, .13 * u, 6, 0, a * 9 + i), { wash: cols[i % cols.length], washOp: 255 * (1 - seg(a, 1.5, 2)), ink: null });
    }
  }
  // A puff of stage smoke at (x, y), k = 0..1.
  function poof(x, y, u, sw, k) {
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + .4, d = (.4 + 1.6 * easeOut(k)) * u, r = (.7 + .5 * hash(i)) * u * (1 - k * .5);
      paint(ellPts(x + Math.cos(a) * d, y + Math.sin(a) * d * .6 - k * u, r, r * .85, 14), { wash: PAL.cream, washOp: 255 * (1 - k), ink: k < .6 ? PAL.ink : null, sw: sw * .5 });
    }
  }
  // A music note at (x, y), size s.
  function note(x, y, s, sw, a = 1) {
    if (a <= .02) return;
    paint(ellPts(x, y, .45 * s, .33 * s, 10, 0, -.4), { wash: PAL.ink, washOp: 255 * a, ink: null });
    inkLine([[x + .4 * s, y - .1 * s], [x + .4 * s, y - 1.6 * s], [x + 1.1 * s, y - 1.1 * s]], sw * .7 * a, PAL.ink, 'ink', 0);
  }
  // Drops falling on an arc from p0 to p1, a stream of them (a jet of water).
  function jet(p0, p1, h, u, sw, t, fade, n = 9) {
    if (fade <= 0) return;
    for (let i = 0; i < n; i++) {
      const p = arcPt(p0, p1, h, frac(t * 1.8 + i / n)), r = .2 * u * fade;
      paint(ellPts(p[0], p[1], r, r * 1.25, 8), { wash: PAL.sky, fill: '#FFFFFF', fillOp: 60, ink: PAL.ink, sw: sw * .35 });
    }
  }

  // A two-tier birthday cake on (x, y), its plate. lit[i] 0..1 per candle, lean blows the flames over, smoke[i] 0..1.
  function cake(x, y, u, sw, lit, lean, smoke, t) {
    paint(ellPts(x, y + .05 * u, 2.5 * u, .38 * u, 18), { wash: '#FFFFFF', ink: PAL.ink, sw: sw * .6 });
    const tier = (w, y0, h) => {
      paint(rrPts(x - w * u, y0 - h * u, 2 * w * u, h * u, .25 * u), { wash: '#F6D9E2', fill: PAL.rose, fillOp: 45, tex: .5, ink: PAL.ink, sw: sw * .8 });
      const d = [], n = Math.round(w * 3); for (let i = 0; i <= n; i++) d.push([x + lerp(-w + .1, w - .1, i / n) * u, y0 - h * u + (i % 2 ? .45 : .2) * u]);
      paint([[x - (w - .05) * u, y0 - h * u], [x + (w - .05) * u, y0 - h * u], ...d.reverse()], { wash: PAL.cream, ink: PAL.ink, sw: sw * .5, curv: .4 });
    };
    tier(2.05, y, 1.3); tier(1.45, y - 1.3 * u, 1.05);
    for (const s of [-1, 1]) paint(heartPts(x + s * 1.05 * u, y - 2.45 * u, .28 * u), { wash: '#E5533D', ink: PAL.ink, sw: sw * .4 });
    [-.6, 0, .6].forEach((cx, i) => {
      const bx = x + cx * u, by = y - 2.35 * u, f = lit[i];
      paint(rectPts(bx - .13 * u, by - u, .26 * u, u), { wash: i % 2 ? PAL.sky : '#F6C343', ink: PAL.ink, sw: sw * .5 });
      if (f > .02) {
        const s = .55 * u * f, fl = Math.sin(t * 17 + i * 2) * .1;
        glow(bx, by - 1.4 * u, 1.5 * u * f, '#FFC766', .7 * f);
        paint([[bx + (lean + fl) * s * 1.6, by - u - 1.5 * s], [bx + .45 * s, by - u - .5 * s], [bx, by - u - .02 * s], [bx - .45 * s, by - u - .5 * s]], { wash: '#FFD86A', fill: '#F08A3C', fillOp: 70, ink: PAL.ink, sw: sw * .4, curv: .6 });
      }
      const k = smoke[i];
      if (k > 0 && k < 1) inkLine([[bx, by - 1.05 * u], [bx + .3 * u * Math.sin(k * 6 + i), by - (1.5 + k) * u], [bx - .2 * u, by - (2 + 2 * k) * u]], sw * .6 * (1 - k), '#9A93A8', 'inkfine', .6);
    });
  }

  // An umbrella in its own frame: the handle's hook at (0, 0), the shaft straight up to a scalloped canopy.
  const UMB = 5.6;
  function umbrella(u, sw) {
    inkLine([[0, 0], [0, -UMB * u]], sw * 1.1, PAL.ink, 'ink', 0);
    inkLine([[0, 0], [.08 * u, .5 * u], [.5 * u, .62 * u], [.68 * u, .3 * u]], sw * 1.2, '#8E5A2E', 'ink', .5);
    const rx = 5, ry = 2.4, cy = -UMB, edge = [];
    for (let k = 0; k <= 6; k++) { const ex = rx - 2 * rx * k / 6; edge.push([ex, cy]); if (k < 6) edge.push([ex - rx / 6, cy - .45]); }
    paint(P([...half(0, cy, rx, ry, 20), ...edge], 0, 0, u), { wash: '#E5533D', fill: '#B93A2C', fillOp: 50, tex: .5, ink: PAL.ink, sw, curv: .3 });
    for (let k = 1; k < 6; k++) inkLine(P([[0, cy - ry], [(rx - 2 * rx * k / 6) * .55, cy - ry * .75], [rx - 2 * rx * k / 6, cy]], 0, 0, u), sw * .5, PAL.cream, 'inkfine', .5);
    inkLine([[0, (cy - ry) * u], [0, (cy - ry - .5) * u]], sw * .9, PAL.ink, 'ink', 0);
  }

  // A diamond kite in its own frame, centred at (0, 0), with a ribbon tail of bows; t drives the tail's flutter.
  function kite(u, sw, t) {
    const tail = []; for (let i = 0; i <= 8; i++) tail.push([Math.sin(t * 5 + i * .9) * .45 * u * i / 8, (1.6 + i * .6) * u]);
    inkLine(tail, sw * .5, PAL.ink, 'inkfine', .6);
    for (const i of [3, 6, 8]) { const [bx, by] = tail[i]; for (const s of [-1, 1]) paint([[bx, by], [bx + s * .45 * u, by - .25 * u], [bx + s * .45 * u, by + .25 * u]], { wash: i % 2 ? PAL.sky : PAL.rose, ink: PAL.ink, sw: sw * .4 }); }
    paint(P([[0, -1.3], [0, 1.6], [-.95, 0]], 0, 0, u), { wash: PAL.rose, fill: '#C9506E', fillOp: 50, ink: null });
    paint(P([[0, -1.3], [.95, 0], [0, 1.6]], 0, 0, u), { wash: '#F6C343', fill: PAL.ochre, fillOp: 50, ink: null });
    paint(P([[0, -1.3], [.95, 0], [0, 1.6], [-.95, 0]], 0, 0, u), { ink: PAL.ink, sw: sw * .8 });
    inkLine(P([[0, -1.3], [0, 1.6]], 0, 0, u), sw * .5, '#8E5A2E', 'inkfine', 0); inkLine(P([[-.95, 0], [.95, 0]], 0, 0, u), sw * .5, '#8E5A2E', 'inkfine', 0);
  }

  // A watermelon slice held under the mouth, in body space: d = how much of the red is eaten from the top (in u).
  function melonSlice(u, sw, d, grow, lift) {
    const cy = -3.95 - lift, R = 2.6, r = R - .5;
    const arc = (rr, a0, a1, n = 16) => { const p = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([Math.cos(a) * rr * u, (cy + Math.sin(a) * rr) * u]); } return p; };
    push(); translate(0, cy * u); scale(grow); translate(0, -cy * u);
    paint([...arc(R, 0, Math.PI), ...arc(R - .32, Math.PI, 0)], { wash: '#5FA35A', fill: '#3E7D3A', fillOp: 60, ink: PAL.ink, sw: sw * .8 });
    paint([...arc(R - .3, 0, Math.PI), ...arc(r, Math.PI, 0)], { wash: '#F4F0D8', ink: null });
    if (d < r - .05) {
      const a0 = Math.asin(clamp(d / r));
      paint(arc(r, a0, Math.PI - a0), { wash: '#F0566A', fill: '#D93A50', fillOp: 60, ink: null });
      for (const [sx, sy] of [[-1.2, .55], [-.4, 1.05], [.5, .75], [1.3, .45], [-.7, 1.5], [.25, 1.65], [.95, 1.3]])
        if (sy > d + .15) paint(ellPts(sx * u, (cy + sy) * u, .1 * u, .16 * u, 8, 0, sx * .3), { wash: PAL.ink, ink: null });
    }
    pop();
  }

  // A ukulele across Seeky's belly, in body space. broken snaps a string.
  function ukulele(u, sw, broken, strum) {
    push(); translate(-1.6 * u, -2.9 * u); rotate(-.38);
    const wood = { wash: '#E0A868', fill: '#B57440', fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .8 };
    paint(rrPts(1.1 * u, -.22 * u, 4 * u, .44 * u, .1 * u), { ...wood, wash: '#8E5A2E' });
    paint(rrPts(5 * u, -.4 * u, 1.05 * u, .8 * u, .2 * u), { ...wood, wash: '#8E5A2E' });
    for (const k of [-1, 1]) for (const j of [0, 1]) paint(ellPts((5.3 + j * .45) * u, k * .5 * u, .1 * u, .1 * u, 6), { wash: PAL.cream, ink: null });
    paint(ellPts(-1.2 * u, 0, 1.35 * u, 1.15 * u, 20), wood);
    paint(ellPts(.3 * u, 0, 1 * u, .85 * u, 18), wood);
    paint(ellPts(-.45 * u, 0, .36 * u, .36 * u, 12), { wash: '#4A2A18', ink: PAL.ink, sw: sw * .4 });
    paint(rectPts(-1.75 * u, -.35 * u, .25 * u, .7 * u), { wash: '#4A2A18', ink: null });
    for (let i = 0; i < 4; i++) {
      const yy = (-.15 + i * .1) * u;
      if (broken && i === 1) {   // the snapped string curls up at both ends
        inkLine([[-1.55 * u, yy], [-.9 * u, yy - .2 * u], [-.7 * u, yy - .6 * u], [-.95 * u, yy - .8 * u]], sw * .35, PAL.cream, 'inkfine', .6);
        inkLine([[5 * u, yy], [4.2 * u, yy + .3 * u], [4 * u, yy + .8 * u], [4.3 * u, yy + .95 * u]], sw * .35, PAL.cream, 'inkfine', .6);
      } else inkLine([[-1.55 * u, yy], [5 * u, yy + strum * Math.sin(i * 2 + T * 60) * .05 * u]], sw * .3, PAL.cream, 'inkfine', 0);
    }
    pop();
  }

  // An upside-down top hat standing on its crown at (x, y); its opening is HAT_H above.
  const HAT_H = 2.2;
  function magicHat(x, y, u, sw) {
    paint(rectPts(x - 1.1 * u, y - HAT_H * u, 2.2 * u, HAT_H * u), { wash: '#3A3346', fill: PAL.ink, fillOp: 60, ink: PAL.ink, sw });
    paint(rectPts(x - 1.1 * u, y - (HAT_H - .3) * u, 2.2 * u, .42 * u), { wash: '#C9506E', ink: null });
    paint(ellPts(x, y - HAT_H * u, 1.75 * u, .42 * u, 20), { wash: '#4A4258', ink: PAL.ink, sw });
    paint(ellPts(x, y - HAT_H * u, 1.1 * u, .24 * u, 16), { wash: '#15121C', ink: null });
  }
  // A little round table with a cloth, its top at y - 3.3u.
  function pedestal(x, y, u, sw) {
    paint(rectPts(x - .25 * u, y - 3.1 * u, .5 * u, 3.1 * u), { wash: '#8E5A2E', ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(x, y - .1 * u, 1.4 * u, .3 * u, 14), { wash: '#8E5A2E', ink: PAL.ink, sw: sw * .7 });
    const drape = []; for (let i = 0; i <= 8; i++) drape.push([x + lerp(2.4, -2.4, i / 8) * u, y - (2.15 + (i % 2) * .3) * u]);
    paint([[x - 2.4 * u, y - 3.3 * u], [x + 2.4 * u, y - 3.3 * u], ...drape], { wash: PAL.violet, fill: mixCol(PAL.violet, PAL.ink, .3), fillOp: 50, ink: PAL.ink, sw: sw * .8, curv: .3 });
    paint(ellPts(x, y - 3.3 * u, 2.4 * u, .45 * u, 20), { wash: '#9C86C9', ink: PAL.ink, sw: sw * .8 });
  }

  // A donut seen side-on, and a dumbbell made of two of them (in its holder's frame).
  function donut(x, y, s, sw) {
    paint(ellPts(x, y, .5 * s, 1 * s, 16), { wash: '#E9B07A', fill: '#C8864C', fillOp: 50, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(x + .08 * s, y, .38 * s, .86 * s, 14), { wash: '#F49AB5', fill: PAL.rose, fillOp: 40, ink: null });
    [[-.1, -.5, PAL.sky], [.15, -.1, PAL.ochre], [-.05, .35, '#FFFFFF'], [.2, .6, PAL.sap]].forEach(([a, b, c]) => inkLine([[x + a * s, y + b * s], [x + (a + .1) * s, y + (b + .12) * s]], sw * .5, c, 'inkfine', 0));
  }
  function dumbbell(u, sw, right) {
    paint(rrPts(-1.5 * u, -.14 * u, 3 * u, .28 * u, .1 * u), { wash: '#9AA2B1', ink: PAL.ink, sw: sw * .6 });
    donut(-1.45 * u, 0, u, sw);
    if (right > .02) donut(1.45 * u, 0, u * right, sw);
  }

  // A tall chef's toque, in body space.
  function chefHat(u, sw) {
    const w = { wash: '#FFFFFF', fill: PAL.cream, fillOp: 50, ink: PAL.ink, sw };
    for (const [a, b, r] of [[-1.7, -9, 1.15], [1.7, -9, 1.15], [0, -9.7, 1.35]]) paint(ellPts(a * u, b * u, r * u, r * .9 * u, 16), w);
    paint(rrPts(-2.5 * u, -8.55 * u, 5 * u, 1.1 * u, .2 * u), w);
  }
  // A pancake, flipping: ph = how far round it has turned (radians).
  function pancake(x, y, u, sw, ph, rot = 0, rx = 1.05) {
    const c = Math.cos(ph);
    paint(ellPts(x, y, rx * u, Math.max(.07, Math.abs(c) * .32) * u, 18, 0, rot), { wash: c > 0 ? '#E8B45A' : '#C98A3C', fill: '#B9762F', fillOp: 40, tex: .5, ink: PAL.ink, sw: sw * .6 });
  }

  // A striped deck chair, behind a seated Seeky at (x, y).
  function deckChair(x, y, u, sw) {
    const wood = { wash: '#C98A55', ink: PAL.ink, sw: sw * .7 };
    for (const s of [-1, 1]) paint(ribbon([[x + s * 5.2 * u, y], [x - s * 3.8 * u, y - 3.4 * u]], .35 * u), wood);
    paint(P([[-5.6, -9.6], [5.6, -9.6], [5.2, -2.4], [-5.2, -2.4]], x, y, u), { wash: PAL.cream, ink: null });
    for (let i = 0; i < 4; i++) { const a = -5.6 + i * 2.95, b = a + 1.4; paint(P([[a, -9.6], [b, -9.6], [b * .93, -2.4], [a * .93, -2.4]], x, y, u), { wash: PAL.teal, fill: mixCol(PAL.teal, PAL.ink, .2), fillOp: 40, ink: null }); }
    paint(P([[-5.6, -9.6], [5.6, -9.6], [5.2, -2.4], [-5.2, -2.4]], x, y, u), { ink: PAL.ink, sw: sw * .8 });
    for (const s of [-1, 1]) paint(ribbon([[x + s * 5.7 * u, y - 9.9 * u], [x + s * 5.3 * u, y]], .32 * u), wood);
  }
  // A smiling sun with turning rays.
  function sun(x, y, u, sw, t) {
    glow(x, y, 6 * u, '#FFD27A', .8);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * .5; paint(ribbon([[x + Math.cos(a) * 2.4 * u, y + Math.sin(a) * 2.4 * u], [x + Math.cos(a) * 3.5 * u, y + Math.sin(a) * 3.5 * u]], .5 * u, .1 * u), { wash: '#F6C343', ink: null }); }
    paint(ellPts(x, y, 2 * u, 2 * u, 22), { wash: '#FFD86A', fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: sw * .8 });
    for (const s of [-1, 1]) inkLine([[x + s * .9 * u, y - .3 * u], [x + s * .6 * u, y - .55 * u], [x + s * .3 * u, y - .3 * u]], sw * .6, PAL.ink, 'ink', .5);
    inkLine([[x - .7 * u, y + .5 * u], [x, y + 1 * u], [x + .7 * u, y + .5 * u]], sw * .6, PAL.ink, 'ink', .5);
  }

  // Turning red in the sun (or with effort): Seeky is blue, so a tint would only go purple; mix the colours toward red.
  const sunburn = k => ({ tint: null, col: mixCol(PAL.ds, '#EE6A50', k), dk: mixCol(PAL.dsDk, '#B23A2A', k), lt: mixCol(PAL.dsLt, '#FFB09A', k) });

  // ---------- twelve more skits ----------

  // Birthday: party hat on, a wish with eyes shut, a big blow... and the candles are trick candles that light again.
  // So Seeky puts them out with its blowhole. Confetti!
  ACT.birthday = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 3 * u, kx = x + 3.6 * u, ky = y - 2.25 * u, tWish = 1.4, tBlow = 2.75, tOut = 3.15, tRelit = 3.5, tSquirt = 4.05, tDone = 4.4, tFresh = 5.65;
    const m = loopFeel(lt, [[0, 'starstruck', { lookX: .8, lookY: .4 }], [tWish, 'hopeful', { eyes: 'closed' }], [tBlow - .2, 'determined', { mouth: 'o', lookX: .7 }],
                            [tRelit + .05, 'surprised', { lookX: .8, lookY: .4 }], [tSquirt - .25, 'mischief', { lookX: .8, lookY: .3 }], [tDone + .05, 'laugh'], [5.2, 'happy']], { take: .6 });
    const c = { ...m, hover: hoverAt(), seed: 14, boilKey: o.key, hat: 'party', dy: (m.dy || 0) * .35 };
    if (lt > tWish && lt < tBlow - .3) { c.aL = c.aR = 1.25 + .05 * Math.sin(lt * 6); }
    if (lt > tBlow - .35 && lt < tBlow) { const k = ease(seg(lt, tBlow - .35, tBlow)); c.sx = 1 + .1 * k; c.sq = (c.sq || 0) - .1 * k; }
    if (lt > tBlow && lt < tOut + .1) { c.sx = 1.08 - .1 * seg(lt, tBlow, tOut); c.dx = .25; }
    seeky(sx, y, u, c);
    desk(kx, y, u, sw, o.key, 3.6, 3.1);
    const lit = [0, 1, 2].map(i => lt < tOut ? 1 - seg(lt, tOut - .12, tOut) : lt < tRelit ? 0 : lt < tDone ? seg(lt, tRelit + i * .1, tRelit + i * .1 + .08) : seg(lt, tFresh + i * .08, tFresh + i * .08 + .1));
    const smoke = [0, 1, 2].map(() => Math.max(seg(lt, tOut, tOut + .8) * (lt < tRelit + .3), seg(lt, tDone, tDone + .9)));
    boilSeed(o.key + ' cake');
    cake(kx, ky, u, sw, lit, ease(seg(lt, tBlow, tOut)) * 1.3, smoke, lt);
    if (lt > tBlow && lt < tOut + .1) for (let i = 0; i < 3; i++) {   // the puff of breath
      const ph = frac(lt * 3 + i / 3), m0 = bodyAt(sx, y, u, c, .6, -4.3);
      inkLine([[m0[0] + ph * 6 * u, m0[1] + (i - 1) * .5 * u], [m0[0] + (ph * 6 + 1.6) * u, m0[1] + (i - 1) * .7 * u]], sw * .5 * (1 - ph), mixCol(PAL.sky, PAL.ink, .3), 'inkfine', .3);
    }
    jet(bodyAt(sx, y, u, c, 1.6, -8.4), [kx, ky - 3.4 * u], 3 * u, u, sw, lt, seg(lt, tSquirt, tSquirt + .1) * (1 - seg(lt, tDone + .1, tDone + .25)));
    for (let i = 0; i < 4; i++) sparkle(sx + (i % 2 ? 4 : -4) * u, y - (9 + i) * u, .7 * u, seg(lt, tWish + .2 + i * .2, tWish + .6 + i * .2));
    confetti(kx, ky - 3 * u, u, sw, lt - tDone);
  } };

  // Rain: snug under its umbrella, Seeky peeks a flipper out into the rain, flings the umbrella away and dances in the
  // puddles (adding its own fountain). The umbrella floats back down into its flipper.
  ACT.rain = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 1 * u, tPeek = 1.9, tToss = 2.55, tGone = 3.4, tBack = 5.0, tHeld = 5.6, LEAN = .62;
    const m = loopFeel(lt, [[0, 'neutral', { eyes: 'look', lookY: -.7, lookX: .3 }], [tPeek, 'hopeful', { lookX: -.8, lookY: -.2 }], [tToss - .05, 'excited', { emote: null }],
                            [2.9, 'happy', { emote: 'music' }], [tBack, 'hopeful', { lookY: -.9, lookX: .2, emote: null }]], { take: .6 });
    const dance = ease(seg(lt, 2.8, 3)) * (1 - ease(seg(lt, tBack - .2, tBack)));
    const c = { ...m, hover: hoverAt(), seed: 15, boilKey: o.key, dy: (m.dy || 0) * .3 - 2.2 * Math.abs(Math.sin(lt * TAU)) * dance, spout: 1.2 * dance };
    c.aR = lt < tToss ? 1.2 : lt < tToss + .25 ? lerp(1.2, 1.9, seg(lt, tToss, tToss + .15)) : lt < tBack ? 1.1 + .5 * Math.sin(lt * TAU * 2) * dance : lerp(1.6, 1.2, seg(lt, tBack, tHeld));
    c.aL = lt > tPeek && lt < tToss ? -.2 + .1 * Math.sin(lt * 20) : dance > 0 ? 1.1 - .5 * Math.sin(lt * TAU * 2) * dance : m.aL;
    if (lt > 3.6 && lt < 4.1) Object.assign(c, turn(lt, 3.6, 4.1, 0, 1));   // a twirl in the rain
    const held = lt < tToss || lt >= tHeld;
    if (held) c.armR = (u, sw) => { rotate(c.aR); rotate(-LEAN); umbrella(u, sw); };
    boilSeed(o.key + ' puddle');
    paint(ellPts(sx, y + .25 * u, 5.5 * u, .65 * u, 22), { wash: mixCol(PAL.sky, '#FFFFFF', .2), fill: PAL.sky, fillOp: 60, ink: PAL.ink, sw: sw * .5 });
    if (dance > 0) for (let i = 0; i < 2; i++) { const k = frac(lt * 2 + i * .5) * dance; paint(ellPts(sx + (i ? 2 : -2) * u, y + .25 * u, (.6 + 3 * k) * u, (.15 + .5 * k) * u, 16), { ink: mixCol(PAL.cream, PAL.sky, .3), sw: sw * .5 * (1 - k) }); }
    seeky(sx, y, u, c);
    const [tx, ty] = flipperTip(c.aR), canopy = bodyAt(sx, y, u, c, tx - UMB * Math.sin(LEAN), ty - UMB * Math.cos(LEAN));
    boilSeed(o.key + ' umbrella');
    if (!held) {   // flung away, then drifting back down
      const hand = bodyAt(sx, y, u, c, tx, ty);
      const fly = lt < tGone ? seg(lt, tToss, tGone) : null, back = lt >= tBack ? seg(lt, tBack, tHeld) : null;
      if (fly !== null) { const p = arcPt(hand, [x + 15 * u, y - 24 * u], 5 * u, easeIn(fly)); push(); translate(p[0], p[1]); rotate(-LEAN + fly * 7); umbrella(u, sw); pop(); }
      if (back !== null) { const p = [lerp(x + 4 * u, hand[0], ease(back)) + Math.sin(back * 7) * 1.2 * u * (1 - back), lerp(y - 26 * u, hand[1], ease(back))]; push(); translate(p[0], p[1]); rotate(lerp(.5 * Math.sin(back * 6), -LEAN, ease(back))); umbrella(u, sw); pop(); }
    }
    boilSeed(o.key + ' rain');
    for (let i = 0; i < 50; i++) {
      const ph = frac(lt * 1.5 + hash(i + 50)), px = x + (hash(i) * 30 - 15) * u - ph * 1.5 * u, py = y - 22 * u + ph * 22 * u;
      if (held && Math.abs(px - canopy[0]) < 5.2 * u && py > canopy[1] - 2 * u) continue;   // the canopy keeps it off
      inkLine([[px, py], [px - .25 * u, py + 1.1 * u]], sw * .4, mixCol(PAL.sky, PAL.ink, .25), 'inkfine', 0);
    }
    if (held) for (let i = 0; i < 4; i++) { const k = frac(lt * 2.2 + i / 4), bx = canopy[0] + (i - 1.5) * 2.4 * u; paint(ellPts(bx + (i % 2 ? 1 : -1) * k * u, canopy[1] - 2.3 * u - 1.2 * u * Math.sin(k * Math.PI), .14 * u, .18 * u, 6), { wash: PAL.sky, ink: PAL.ink, sw: sw * .3 }); }
  } };

  // Bubbles: a few small ones, then a GIANT one that swallows Seeky and floats it up into the air... pop!
  ACT.bubble = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 1 * u, tBig = 1.6, tGo = 2.5, tIn = 2.9, tPop = 4.5, tLand = 4.85;
    const m = loopFeel(lt, [[0, 'neutral', { mouth: 'o', lookX: .7, lookY: -.7 }], [tBig, 'neutral', { eyes: 'squeeze', mouth: 'o' }], [tGo + .1, 'surprised', { lookX: .3 }],
                            [3.3, 'excited', { emote: null }], [tPop, 'scared', { emote: null }], [tLand + .05, 'dizzy'], [5.4, 'laugh']], { take: .6 });
    const c = { ...m, hover: hoverAt(), seed: 16, boilKey: o.key, aR: 1 + .05 * Math.sin(lt * 3), dy: (m.dy || 0) * .4 };
    if (lt > tBig && lt < tGo) c.sx = 1.1;
    if (lt >= tIn && lt < tPop) { c.dy += -7 * ease(seg(lt, tIn, 3.8)) + .3 * Math.sin(lt * 3); c.aL = 1 + .5 * Math.sin(lt * TAU * 2); }
    else if (lt >= tPop && lt < tLand) c.dy += lerp(-7 + .3 * Math.sin(tPop * 3), 0, easeIn(seg(lt, tPop, tLand)));
    const land = take(lt, tLand, 1); c.sq = (c.sq || 0) + land.sq; c.dy += land.dy;
    c.armR = (u, sw) => {
      rotate(c.aR);
      paint(ribbon([[0, 0], [-.75 * u, -2.75 * u]], .26 * u, .2 * u), { wash: PAL.teal, ink: PAL.ink, sw: sw * .5 });
      paint(ellPts(-.8 * u, -3.4 * u, .65 * u, .65 * u, 16), { ink: PAL.rose, sw: sw * 1.2 });
    };
    seeky(sx, y, u, c);
    const [tx, ty] = flipperTip(c.aR), ring = bodyAt(sx, y, u, c, tx - .8, ty - 3.4), body = bodyAt(sx, y, u, c, 0, -5);
    boilSeed(o.key + ' bubbles');
    for (let j = 0; j < 5; j++) {   // the warm-up bubbles
      const a = lt - (.15 + j * .28);
      if (a > 0 && a < 1.3) { const p = [ring[0] + a * 2.6 * u, ring[1] - a * 2.2 * u + Math.sin(a * 5 + j) * .3 * u], r = (.45 + .3 * hash(j)) * u * Math.min(1, a * 4); bubble(p[0], p[1], r, sw, 1 - seg(a, 1.1, 1.2)); popRing(p[0], p[1], r, sw, seg(a, 1.1, 1.3)); }
    }
    let B = null;
    if (lt >= tBig && lt < tGo) { const r = lerp(.6, 3.8, easeOut(seg(lt, tBig, tGo))) * u; B = [ring[0] + r * .62, ring[1] - r * .62, r]; }
    else if (lt >= tGo && lt < tIn) { const k = ease(seg(lt, tGo, tIn)), r0 = 3.8 * u, a = [ring[0] + r0 * .62, ring[1] - r0 * .62]; B = [lerp(a[0], body[0], k), lerp(a[1], body[1], k), lerp(r0, 7.6 * u, k)]; }
    else if (lt >= tIn && lt < tPop) B = [body[0], body[1], 7.6 * u * (1 + .02 * Math.sin(lt * 7))];
    if (B) {   // the giant bubble, with a rainbow sheen
      const [bx, by, r] = B;
      bubble(bx, by, r, sw, 1, 45);
      inkLine(ellPts(bx, by, r * .82, r * .82, 24, 0, lt).slice(2, 9), sw * .6, PAL.rose, 'inkfine', .6);
      inkLine(ellPts(bx, by, r * .76, r * .76, 24, 0, lt + 3).slice(2, 8), sw * .6, PAL.sky, 'inkfine', .6);
    }
    const pk = seg(lt, tPop, tPop + .3), pb = bodyAt(sx, y, u, { ...c, dy: -7 + .3 * Math.sin(tPop * 3) }, 0, -5);
    popRing(pb[0], pb[1], 7.6 * u, sw * 1.5, pk);
    spray(pb[0], pb[1], u, sw, pk, 12, 4, 6);
  } };

  // Kite: flying it happily; a gust grabs the kite and lifts Seeky right off the ground, flippers flailing, then sets it down.
  ACT.kite = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 3.5 * u, tGust = 2.6;
    const env = ease(seg(lt, 2.75, 3.4)) - ease(seg(lt, 3.7, 4.25));
    const m = loopFeel(lt, [[0, 'happy', { lookX: .6, lookY: -.9 }], [tGust + .1, 'surprised', { lookY: -.9 }], [3.15, 'excited', { lookY: -.6, emote: null }], [4.25, 'relieved', { emote: null }], [4.7, 'happy', { lookX: .6, lookY: -.9 }]], { take: .6 });
    const c = { ...m, hover: hoverAt(), seed: 17, boilKey: o.key, dy: (m.dy || 0) * .3 - 5 * env, dx: (m.dx || 0) * .3 + 1.5 * env, rot: (m.rot || 0) * .3 + .12 * env };
    c.aR = 1.35 + .08 * Math.sin(lt * 3) + .3 * env; c.aL = env > .05 ? 1.2 + .5 * Math.sin(lt * TAU * 4) : (m.aL ?? .3);
    const land = take(lt, 4.25, .7); c.sq = (c.sq || 0) + land.sq; c.dy += land.dy;
    c.armR = (u, sw) => paint(ellPts(0, 0, .4 * u, .4 * u, 10), { wash: '#C98A55', ink: PAL.ink, sw: sw * .5 });
    seeky(sx, y, u, c);
    const gust = seg(lt, tGust, 2.9) * (1 - seg(lt, 3.9, 4.3));
    const K = [sx + 9 * u + 1.2 * u * Math.sin(lt * 1.3) + 3 * u * env + 2 * u * gust, y - 16 * u + .8 * u * Math.sin(lt * 1.9) - 3 * u * env], kr = .25 * Math.sin(lt * 1.6) + .4 * env;
    const hand = bodyAt(sx, y, u, c, ...flipperTip(c.aR)), tie = [K[0] - Math.sin(kr) * 2.7 * u, K[1] + Math.cos(kr) * 2.7 * u];
    boilSeed(o.key + ' kite');
    inkLine([hand, [lerp(hand[0], tie[0], .5), lerp(hand[1], tie[1], .5) + 2 * u * (1 - env)], tie], sw * .35, PAL.ink, 'inkfine', .6);
    push(); translate(K[0], K[1]); rotate(kr); scale(1.7); kite(u, sw / 1.7, lt); pop();
    for (let i = 0; i < 4 + 3 * gust; i++) {   // the wind
      const ph = frac(lt * (.8 + gust) + i / 4), wx = x - 14 * u + ph * 28 * u, wy = y - (5 + i * 2.6) * u;
      inkLine([[wx, wy], [wx + 1.5 * u, wy - .3 * u], [wx + 3 * u, wy], [wx + 3.6 * u, wy - .6 * u]], sw * (.4 + .4 * gust) * Math.sin(ph * Math.PI), mixCol(PAL.paper, PAL.ink, .4), 'inkfine', .6);
    }
  } };

  // Watermelon: four big bites, then a machine-gun spit of seeds, and the empty rind makes a huge green grin.
  ACT.melon = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 2 * u, bites = [.55, .95, 1.35, 1.75], tSpit = 2.3, tGrin = 3.9, tNew = 5.4;
    const m = loopFeel(lt, [[0, 'hopeful', { eyes: 'shine', mouth: 'tongue', lookY: .6 }], [.5, 'happy', { mouth: null }], [tSpit - .1, 'determined', { mouth: 'o', lookX: .8 }],
                            [tGrin, 'laugh', { mouth: null, blush: .6 }], [tNew, 'hopeful', { eyes: 'shine', mouth: 'tongue', lookY: .6 }]], { take: .5 });
    const c = { ...m, hover: hoverAt(), seed: 18, boilKey: o.key, aL: .25, aR: .25, dy: (m.dy || 0) * .4 };
    let d = bites.reduce((s, b) => s + ease(seg(lt, b, b + .12)) * .52, 0);
    for (const b of bites) { const k = take(lt, b + .02, .35); c.sq = (c.sq || 0) + k.sq; }
    if (lt > .6 && lt < 2.2) c.sx = 1.06;
    const spits = []; for (let i = 0; i < 9; i++) spits.push(tSpit + i * .17);
    for (const s of spits) { const k = take(lt, s, .22); c.sq = (c.sq || 0) + k.sq; }
    const pop = lt >= tNew ? backOut(seg(lt, tNew + .05, tNew + .4)) : 1;
    if (lt >= tNew) d = 0;
    const lift = lt > tGrin && lt < tNew ? .35 * ease(seg(lt, tGrin, tGrin + .2)) : 0;
    c.draw = (u, sw) => { if (pop > .02) melonSlice(u, sw, d, pop * 1.15, lift); };
    seeky(sx, y, u, c);
    boilSeed(o.key + ' seeds');
    const mouth = bodyAt(sx, y, u, c, .3, -4.3);
    spits.forEach((s, i) => {
      const a = lt - s, land = [sx + (5.5 + i * .8) * u, y - .1 * u];
      if (a > 0 && a < .55) { const p = arcPt(mouth, land, 2.5 * u, a / .55); paint(ellPts(p[0], p[1], .13 * u, .2 * u, 8, 0, a * 12), { wash: PAL.ink, ink: null }); }
      else if (a >= .55 && lt < tNew + .3) paint(ellPts(land[0], land[1], .2 * u, .12 * u, 8), { wash: PAL.ink, washOp: 255 * (1 - seg(lt, tNew, tNew + .3)), ink: null });
    });
    if (lt > tSpit && lt < spits[8] + .2) inkLine([[mouth[0] + .8 * u, mouth[1] - .3 * u], [mouth[0] + 1.6 * u, mouth[1] - .6 * u]], sw * .5, PAL.ink, 'inkfine', 0);
    for (let i = 0; i < 4; i++) sparkle(sx + (i % 2 ? 3 : -3) * u, y - (3 + i * .6) * u, .6 * u, seg(lt, tNew + i * .05, tNew + .45 + i * .05));
  } };

  // Ukulele: a gentle strum, a song, then it really rocks out... and a string snaps. Oops.
  ACT.guitar = { len: 6, hat: true, draw(x, y, u, lt, o) {
    const sw = SW(u), tSing = 2, tRock = 3.6, tSnap = 4.6;
    const m = loopFeel(lt, [[0, 'happy', { eyes: 'closed', mouth: 'smile', emote: null }], [tSing, 'happy', { eyes: 'closed', mouth: 'open', emote: null }], [tRock, 'starstruck', { mouth: 'open' }],
                            [tSnap, 'surprised', { emote: '!' }], [5.05, 'nervous', { lookY: .6, lookX: .3 }]], { take: .6 });
    const rock = lt > tRock && lt < tSnap, rate = rock ? 6 : lt < tSnap ? 2 : 0;
    const c = { ...m, hover: hoverAt(), seed: 19, boilKey: o.key, hat: o.hat, aL: .7, aR: -.75 + (rate ? .3 * Math.sin(lt * TAU * rate) : 0), rot: lt < tRock ? .05 * Math.sin(lt * TAU / 2) : (m.rot || 0) * .4 };
    c.dy = (m.dy || 0) * .3 - (rock ? 1.3 * Math.abs(Math.sin(lt * TAU * 2)) : 0); c.spout = rock ? 1 : 0;
    c.draw = (u, sw) => ukulele(u, sw, lt >= tSnap, rate ? 1 : 0);
    seeky(x, y, u, c);
    boilSeed(o.key + ' notes');
    const n = rock ? 6 : 3;
    for (let i = 0; i < n; i++) {   // notes drifting up off the strings
      const ph = frac(lt / (rock ? .8 : 1.5) + i / n), p = bodyAt(x, y, u, c, 1.5 + ph * 4 * (i % 2 ? 1 : -.6), -4 - ph * 7);
      if (lt < tSnap + .3) note(p[0] + Math.sin(ph * 6 + i) * .5 * u, p[1], (rock ? .75 : .6) * u, sw, Math.sin(ph * Math.PI) * (1 - seg(lt, tSnap, tSnap + .3)));
    }
    if (lt > tSnap && lt < tSnap + .3) { const p = bodyAt(x, y, u, c, 1.2, -4.2); popRing(p[0], p[1], 1.2 * u, sw, seg(lt, tSnap, tSnap + .3)); }
  } };

  // Magic: three taps of the wand on an upside-down top hat, a puff of smoke, and out pops a tiny Seeky. They wave at
  // each other; another tap and it's gone. Seeky takes a bow.
  ACT.magic = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 3 * u, hx = x + 5.6 * u, top = y - 3.3 * u, taps = [.9, 1.3, 1.7, 4.05], tPoof = 2.0, tMini = 2.15, tGone = 4.25, tBow = 4.7;
    const m = loopFeel(lt, [[0, 'mischief', { lookX: .8, lookY: .3 }], [tPoof + .05, 'surprised', { lookX: .9, lookY: -.1 }], [2.7, 'starstruck', { lookX: .9 }], [3.3, 'happy', { lookX: .8 }],
                            [3.95, 'mischief', { lookX: .8, lookY: .3 }], [tBow, 'proud', { emote: 'spark' }]], { take: .6 });
    const c = { ...m, hover: hoverAt(), seed: 20, boilKey: o.key, dy: (m.dy || 0) * .3 };
    c.aR = .45 - taps.reduce((s, t) => s + .35 * Math.max(0, Math.sin(seg(lt, t - .12, t + .1) * Math.PI)), 0) + (lt < .8 ? .4 * Math.sin(lt * TAU * 1.5) : 0);
    if (lt > 3.3 && lt < 3.9) c.aL = 1.1 + .5 * Math.sin(lt * TAU * 2.5);
    if (lt > tBow && lt < 5.6) { const k = Math.sin(seg(lt, tBow, 5.6) * Math.PI); c.sq = (c.sq || 0) + .12 * k; c.dy += .5 * k; c.aL = 1.3 * k; }
    c.armR = (u, sw) => { rotate(c.aR); inkLine([[0, 0], [1.4 * u, -.52 * u]], sw * 1.3, PAL.ink, 'ink', 0); inkLine([[1.4 * u, -.52 * u], [1.95 * u, -.72 * u]], sw * 1.3, '#FFFFFF', 'ink', 0); };
    boilSeed(o.key + ' table');
    pedestal(hx, y, u, sw);
    magicHat(hx, top, u, sw);
    seeky(sx, y, u, c);
    const mk = seg(lt, tMini, tMini + .35) * (1 - seg(lt, tGone, tGone + .1));
    if (mk > 0) {   // the tiny Seeky, sitting on the brim
      const mm = emotions(lt, [[0, 'surprised'], [2.6, 'happy'], [3.6, 'love', { tint: null }]]);
      seeky(hx, top - (HAT_H - .2) * u, u * .36 * backOut(mk), { ...mm, hover: hoverAt(.5, 3), seed: 21, boilKey: o.key + ' mini', noShadow: true, aL: lt > 3.3 && lt < 3.9 ? 1.2 + .5 * Math.sin(lt * TAU * 3) : mm.aL, dy: (mm.dy || 0) * .5 });
    }
    boilSeed(o.key + ' magic');
    taps.forEach(t => sparkle(hx + (hash(t) - .5) * 2 * u, top - (HAT_H + .4) * u, .9 * u, seg(lt, t, t + .4)));
    poof(hx, top - (HAT_H + .6) * u, u, sw, seg(lt, tPoof, tPoof + .6));
    poof(hx, top - (HAT_H + .6) * u, u, sw, seg(lt, tGone, tGone + .6));
  } };

  // Workout: curls with a dumbbell made of two donuts, sweating and turning red; a flex... and then it eats one end.
  // The lopsided dumbbell yanks its flipper down.
  ACT.gym = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 1.5 * u, tCurl = .6, tFlex = 3, tLook = 3.8, tBite = 4.2, tChomp = 4.5, tFix = 5.5;
    const m = loopFeel(lt, [[0, 'determined', { lookX: .6, lookY: .3 }], [tCurl, 'determined', { eyes: 'squeeze', emote: 'sweat' }], [tFlex, 'proud', { emote: 'spark' }],
                            [tLook, 'hopeful', { eyes: 'shine', lookX: .8, lookY: -.6, mouth: 'tongue' }], [tChomp, 'happy', { mouth: null }], [4.75, 'surprised', { lookX: .6 }], [5.3, 'laugh']], { take: .5 });
    const c = { ...m, hover: hoverAt(), seed: 22, boilKey: o.key, dy: (m.dy || 0) * .3 };
    const strain = ease(seg(lt, tCurl, 1.2)) * (1 - ease(seg(lt, tFlex, tFlex + .3)));
    if (lt >= tCurl && lt < tFlex) { const r = frac((lt - tCurl) / .6); c.aR = -1 + 2.2 * (.5 - .5 * Math.cos(r * TAU)); c.dx = .06 * Math.sin(lt * 60) * (r > .3 && r < .7); }
    else if (lt >= tFlex && lt < tBite + .3) { c.aR = lerp(-1, 1.5, ease(seg(lt, tFlex, tFlex + .25))); c.aL = lt < tLook ? lerp(.2, 1.5, ease(seg(lt, tFlex, tFlex + .25))) : .3; c.sq = (c.sq || 0) - .06; }
    else if (lt >= tBite + .3) c.aR = lerp(1.5, .1, easeOut(seg(lt, 4.7, 4.95))) + lerp(0, -1.1, ease(seg(lt, tFix, 5.9)));
    else c.aR = -1;
    if (strain > 0) Object.assign(c, sunburn(.45 * strain));
    const tilt = -.9 * easeOut(seg(lt, 4.7, 4.95)) * (1 - ease(seg(lt, tFix, 5.9))), right = lt < tBite ? 1 : lt < tFix ? 0 : backOut(seg(lt, tFix, 5.85));
    if (lt > 4.7 && lt < tFix) c.rot = -.08 * Math.sin(seg(lt, 4.7, tFix) * Math.PI);
    if (lt > tChomp && lt < 5.3) c.sx = 1.06;
    const chomp = take(lt, tChomp, .6); c.sq = (c.sq || 0) + chomp.sq; c.dy += chomp.dy;
    c.armR = (u, sw) => { rotate(c.aR + tilt); scale(1.4); dumbbell(u, sw, right); };
    seeky(sx, y, u, c);
    if (lt >= tBite && lt < tChomp) {   // the donut leaves the bar for the mouth
      const [tx, ty] = flipperTip(c.aR), a = bodyAt(sx, y, u, c, tx + 1.45 * 1.4, ty), b = bodyAt(sx, y, u, c, 0, -4.4), k = seg(lt, tBite, tChomp), p = arcPt(a, b, 1.5 * u, ease(k));
      boilSeed(o.key + ' donut');
      push(); translate(p[0], p[1]); rotate(k * 3); donut(0, 0, 1.4 * u * (1 - .5 * k), sw); pop();
    }
    for (let i = 0; i < 4; i++) sparkle(bodyAt(sx, y, u, c, 7.5, -5)[0] + (i - 1.5) * u, bodyAt(sx, y, u, c, 7.5, -6.5)[1], .55 * u, seg(lt, tFix + i * .05, tFix + .4 + i * .05));
  } };

  // Meditate: floating high above a cushion, eyes shut, rings of calm and pebbles orbiting. A fly buzzes in and lands on
  // its head; one eye opens... and the blowhole blasts it away. Back to calm.
  ACT.zen = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), tFly = 2.4, tLand = 4.0, tBlast = 4.6;
    const m = loopFeel(lt, [[0, 'relieved', { eyes: 'closed', mouth: 'cat', emote: null }], [3.2, 'relieved', { eyes: 'closed', mouth: 'flat', emote: null }],
                            [tLand, 'suspicious', { eyes: ['closed', 'normal'], lookX: -.2, lookY: -1, mouth: 'flat' }], [tBlast - .05, 'angry', { eyes: 'squeeze', emote: null, tint: null, mouth: 'flat' }],
                            [5, 'relieved', { eyes: 'closed', mouth: 'cat', emote: null }]], { take: .3 });
    const c = { ...m, hover: 2.6 + .3 * Math.sin(lt * TAU / 3), seed: 23, boilKey: o.key, aL: .45 + .05 * Math.sin(lt * 2), aR: .45 + .05 * Math.sin(lt * 2), dx: (m.dx || 0) * .15, rot: 0, dy: (m.dy || 0) * .2 };
    c.spout = lt > tBlast ? 1.6 * Math.exp(-(lt - tBlast) * 3) : 0;
    const center = bodyAt(x, y, u, c, 0, -5);
    boilSeed(o.key + ' cushion');
    paint(ellPts(x, y - .45 * u, 4 * u, 1 * u, 20), { wash: '#A893D2', fill: PAL.violet, fillOp: 60, tex: .5, ink: PAL.ink, sw });
    for (const s of [-1, 1]) inkLine([[x + s * 3.9 * u, y - .4 * u], [x + s * 4.4 * u, y + .1 * u]], sw * .6, PAL.ochre, 'ink', 0);
    for (let j = 0; j < 3; j++) { const k = frac(lt / 2 + j / 3); paint(ellPts(center[0], center[1], (5.5 + 5 * k) * u, (2.2 + 2 * k) * u, 30), { ink: mixCol(PAL.ochre, PAL.paper, .3), sw: sw * .5 * (1 - k) }); }
    const stone = (i, near) => {   // pebbles orbiting: the far half of the orbit goes behind Seeky
      const a = lt * TAU / 3 + i * TAU / 3; if ((Math.sin(a) > 0) !== near) return;
      paint(ellPts(center[0] + Math.cos(a) * 7 * u, center[1] + Math.sin(a) * 1.6 * u + 1 * u, (.45 + .1 * i) * u, (.35 + .08 * i) * u, 12, u * .03), { wash: ['#9AA2B1', '#B9A98A', '#8CC5B0'][i], ink: PAL.ink, sw: sw * .5 });
    };
    boilSeed(o.key + ' stones');
    for (let i = 0; i < 3; i++) stone(i, false);
    seeky(x, y, u, c);
    boilSeed(o.key + ' stones near');
    for (let i = 0; i < 3; i++) stone(i, true);
    boilSeed(o.key + ' fly');
    const perch = bodyAt(x, y, u, c, -.9, -8.25);
    let f = null, spin = 0;
    if (lt > tFly && lt < tLand) { const k = seg(lt, tFly, tLand), e = 1 - k; f = [lerp(x + 13 * u, perch[0], ease(k)) + Math.sin(k * 21) * 2.2 * u * e, lerp(y - 15 * u, perch[1], ease(k)) + Math.cos(k * 17) * 1.6 * u * e]; }
    else if (lt >= tLand && lt < tBlast) f = [perch[0] + Math.sin(lt * 9) * .15 * u, perch[1]];
    else if (lt >= tBlast && lt < 5.3) { const k = seg(lt, tBlast, 5.3); f = arcPt(perch, [x - 13 * u, y - 24 * u], 4 * u, easeOut(k)); spin = k * 14; }
    if (f) {
      push(); translate(f[0], f[1]); rotate(spin); scale(1.8);
      const flap = .4 + .6 * Math.abs(Math.sin(T * 60));
      for (const s of [-1, 1]) paint(ellPts(s * .3 * u, -.3 * u, .32 * u, .2 * u * flap, 10, 0, s * .5), { wash: '#FFFFFF', washOp: 170, ink: PAL.ink, sw: sw * .35 });
      paint(ellPts(0, 0, .3 * u, .22 * u, 10), { wash: PAL.ink, ink: null });
      paint(ellPts(.3 * u, -.05 * u, .14 * u, .14 * u, 8), { wash: PAL.ink, ink: null });
      pop();
      if (lt < tLand) for (let i = 1; i < 4; i++) { const q = arcPt(f, [f[0] + 3 * u, f[1] - u], 0, i / 4); paint(ellPts(q[0], q[1], .07 * u, .07 * u, 6), { wash: PAL.ink, washOp: 160 - i * 40, ink: null }); }
    }
  } };

  // Pancakes: chef's hat on, a neat flip... a big flip that lands the pancake on its own head. It slides back into the pan.
  ACT.pancake = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 4.5 * u, PAN = [3.2, -.45], f1 = [1.3, 1.9], f2 = [2.5, 3.3], tSlide = 4.4, tBack = 5.0;
    const m = loopFeel(lt, [[0, 'determined', { lookX: .9, lookY: .4 }], [f1[0], 'excited', { lookX: .9, lookY: -.6, emote: null }], [f1[1] + .05, 'proud', { emote: null, lookX: .8 }],
                            [f2[0] - .05, 'excited', { lookX: .6, lookY: -.9, emote: null }], [f2[1] + .05, 'surprised', { lookY: -1 }], [3.8, 'laugh'], [tBack, 'proud', { emote: 'spark' }]], { take: .6 });
    const toss = t0 => Math.max(0, Math.sin(seg(lt, t0 - .12, t0 + .1) * Math.PI));
    const c = { ...m, hover: hoverAt(), seed: 24, boilKey: o.key, spout: false, dy: (m.dy || 0) * .3, aR: .1 + .45 * toss(f1[0]) + .7 * toss(f2[0]) };
    if (lt > tSlide - .2 && lt < tBack) c.dx = (m.dx || 0) + .6 * Math.sin(seg(lt, tSlide - .2, tBack) * Math.PI);
    c.draw = chefHat;
    const inPan = lt < f1[0] || (lt > f1[1] && lt < f2[0]) || lt >= tBack;
    c.armR = (u, sw) => {
      rotate(c.aR);
      paint(ribbon([[0, 0], [1.75 * u, -.2 * u]], .34 * u, .28 * u), { wash: PAL.ink, ink: PAL.ink, sw: sw * .5 });
      paint(ellPts(3.2 * u, -.3 * u, 1.55 * u, .55 * u, 20), { wash: '#3D3A45', ink: PAL.ink, sw: sw * .8 });
      paint(ellPts(3.2 * u, -.36 * u, 1.25 * u, .38 * u, 18), { wash: '#5A5666', ink: null });
      if (inPan) pancake(PAN[0] * u, PAN[1] * u, u, sw, 0);
    };
    seeky(sx, y, u, c);
    const [ptx, pty] = flipperTip(.1), head = bodyAt(sx, y, u, c, 0, -10.75), pan = bodyAt(sx, y, u, c, ptx + PAN[0], pty + PAN[1]);   // where the pan rests
    boilSeed(o.key + ' pancake');
    if (lt >= f1[0] && lt <= f1[1]) { const k = seg(lt, f1[0], f1[1]), p = arcPt(pan, pan, 3 * u, k); pancake(p[0], p[1], u, sw, k * TAU); }
    else if (lt >= f2[0] && lt < f2[1]) { const k = seg(lt, f2[0], f2[1]), p = arcPt(pan, head, 6 * u, k); pancake(p[0], p[1], u, sw, k * TAU * 3); }
    else if (lt >= f2[1] && lt < tSlide) pancake(head[0], head[1] + .1 * u, u, sw, 0, 0, 1.5 + .1 * spring(lt, f2[1], 6, 20));
    else if (lt >= tSlide && lt < tBack) { const k = seg(lt, tSlide, tBack), p = arcPt(head, pan, 2 * u, ease(k)); pancake(p[0], p[1], u, sw, k * Math.PI, 0, lerp(1.5, 1.05, k)); }
    for (let i = 0; i < 3; i++) {   // steam off the pan
      const ph = frac(lt * .9 + i / 3);
      paint(ellPts(pan[0] + (i - 1) * .8 * u + Math.sin(ph * 5) * .3 * u, pan[1] - (.6 + ph * 3) * u, (.3 + ph * .4) * u, (.25 + ph * .3) * u, 10), { wash: PAL.cream, washOp: 200 * (1 - ph), ink: null });
    }
  } };

  // Sunbathing: shades on in a deck chair, slowly turning lobster red under a smug sun. It notices, panics, and cools off
  // under its own blowhole in a hiss of steam. Shades back on.
  ACT.sunbathe = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), sx = x - 1.5 * u, tSee = 3.7, tCool = 4.3, tCalm = 5.3;
    const m = loopFeel(lt, [[0, 'cool', { mouth: 'smile', emote: null }], [tSee, 'surprised', { lookY: .8, lookX: -.2, emote: '!!' }], [tCool, 'relieved', { eyes: 'squeeze', emote: null }],
                            [4.9, 'relieved', { emote: null }], [tCalm, 'cool', { emote: 'music' }]], { take: .6 });
    const burn = .85 * ease(seg(lt, .3, tSee)) * (lt < tCool ? 1 : 1 - ease(seg(lt, tCool + .1, tCalm)));
    const c = { ...m, hover: .15, noShadow: true, seed: 25, boilKey: o.key, dy: (m.dy || 0) * .15, dx: 0, rot: 0, ...sunburn(burn) };
    c.aL = c.aR = lt < tSee ? 1.75 : lt < tCool ? .7 + .2 * Math.sin(lt * 20) : .4;
    c.spout = lt > tCool && lt < tCalm ? 1.4 : 0;
    boilSeed(o.key + ' sky');
    sun(sx + 10 * u, y - 15 * u, u, sw, lt);
    deckChair(sx, y, u, sw);
    seeky(sx, y, u, c);
    boilSeed(o.key + ' coconut');
    const cx = sx + 7.5 * u;
    paint(ellPts(cx, y - 1.1 * u, 1.15 * u, 1.05 * u, 16), { wash: '#8A5A3A', fill: '#5E3A22', fillOp: 60, ink: PAL.ink, sw: sw * .7 });
    inkLine([[cx + .2 * u, y - 1.9 * u], [cx + .6 * u, y - 3.6 * u]], sw * 1.1, PAL.rose, 'ink', 0);
    paint(P(half(0, 0, 1, .55), cx - .6 * u, y - 3.3 * u, u), { wash: PAL.sky, ink: PAL.ink, sw: sw * .5 });
    if (burn > .2 && lt < tCool) for (let i = 0; i < 3; i++) {   // heat shimmer
      const ph = frac(lt * .8 + i / 3), bx = sx + (i - 1) * 3 * u, by = y - (9 + ph * 3) * u;
      inkLine([[bx, by], [bx + .4 * u, by - .6 * u], [bx, by - 1.2 * u], [bx + .4 * u, by - 1.8 * u]], sw * .5 * Math.sin(ph * Math.PI) * burn, PAL.ochre, 'inkfine', .6);
    }
    if (lt > tCool && lt < tCalm) {   // a shower from the blowhole, and steam hissing off the hot skin
      const top = bodyAt(sx, y, u, c, 1.2, -10.2);
      for (let i = 0; i < 10; i++) { const ph = frac(lt * 1.5 + hash(i)), sd = i % 2 ? 1 : -1, p = arcPt(top, [top[0] + sd * (2 + 3.5 * hash(i + 5)) * u, y - 3 * u], 2 * u, ph); paint(ellPts(p[0], p[1], .17 * u, .24 * u, 8), { wash: PAL.sky, ink: PAL.ink, sw: sw * .35 }); }
      for (let i = 0; i < 4; i++) { const ph = frac(lt * 1.2 + i / 4); paint(ellPts(sx + (i - 1.5) * 2.5 * u, y - (6 + ph * 5) * u, (.6 + ph * .6) * u, (.5 + ph * .4) * u, 12), { wash: PAL.cream, washOp: 220 * (1 - ph), ink: ph < .5 ? mixCol(PAL.paper, PAL.ink, .4) : null, sw: sw * .4 }); }
    }
  } };

  // Brushing teeth: jaw open, scrub scrub, foam everywhere, until it bubbles out of the blowhole. A gargle, a spout to
  // rinse, and a sparkling grin.
  ACT.teeth = { len: 6, draw(x, y, u, lt, o) {
    const sw = SW(u), tFoam = 2.85, tGargle = 3.6, tRinse = 4.6, tGrin = 5.0;
    const m = loopFeel(lt, [[0, 'determined', { eyes: 'closed', emote: null }], [tFoam, 'surprised', { lookY: -1, emote: null }], [tGargle, 'neutral', { eyes: 'closed', mouth: 'wobble' }],
                            [tRinse, 'excited', { emote: null }], [tGrin, 'happy', { mouth: 'teeth', emote: 'spark' }]], { take: .5 });
    const brushing = 1 - ease(seg(lt, tFoam - .05, tFoam + .25)) + ease(seg(lt, 5.6, 6));
    const c = { ...m, hover: hoverAt(), seed: 26, boilKey: o.key, dy: (m.dy || 0) * .3, spout: lt > tRinse && lt < tGrin + .3 ? 1.6 : lt > 1.2 && lt < tRinse ? false : 0 };
    c.lid = lt < tFoam ? .2 + .04 * Math.sin(lt * 9) : lt > 5.65 ? .2 * seg(lt, 5.65, 5.9) : 0;
    c.aR = lerp(.25, .2 + .25 * Math.sin(lt * TAU * 2.4), brushing);
    if (lt > tGargle && lt < tRinse) { c.sq = (c.sq || 0) + .05 * Math.sin(lt * TAU * 8); c.sx = 1.05; }
    const foamN = lt < tRinse ? Math.floor(3 + 11 * seg(lt, .2, tFoam)) : Math.floor(14 * (1 - seg(lt, tRinse, tRinse + .4)));
    const blowFoam = seg(lt, 1.2, tFoam) * (1 - seg(lt, tRinse, tRinse + .3));
    const suds = (bx, by, r) => paint(ellPts(bx * u, by * u, r * u, r * .85 * u, 12), { wash: '#FFFFFF', washOp: 240, fill: PAL.sky, fillOp: 25, ink: mixCol(PAL.sky, PAL.ink, .45), sw: sw * .4 });
    c.draw = (u, sw) => {
      for (let i = 0; i < foamN; i++) suds((hash(i) - .5) * 7, -5 + (hash(i + 7) - .5) * .9 + (lt < tFoam ? 0 : .6), .35 + .3 * hash(i + 3));
      for (let i = 0; i < Math.floor(7 * blowFoam); i++) suds(1.2 + (hash(i + 20) - .5) * 2.4, -8.4 - hash(i + 30) * 1.6 * blowFoam, .4 + .35 * hash(i + 40));   // foam out of the blowhole
      if (lt > tGrin && lt < 5.6) paint(starPts(1.1 * u, -4.5 * u, .7 * u * backOut(seg(lt, tGrin + .1, tGrin + .4)), .3, 4, lt), { wash: PAL.cream, fill: PAL.ochre, fillOp: 50, ink: PAL.ink, sw: sw * .5 });
    };
    seeky(x, y, u, c);
    boilSeed(o.key + ' brush');
    const [tx, ty] = flipperTip(c.aR), T0 = bodyAt(x, y, u, c, tx, ty);
    const H = [lerp(T0[0] - 1.2 * u, bodyAt(x, y, u, c, 2.2 * Math.sin(lt * TAU * 2.4), -5.25)[0], brushing), lerp(T0[1] - 2.6 * u, bodyAt(x, y, u, c, 0, -5.25)[1], brushing)];
    const dx = H[0] - T0[0], dy = H[1] - T0[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    paint(ribbon([T0, H], .4 * u, .3 * u), { wash: PAL.teal, ink: PAL.ink, sw: sw * .6 });
    const hd = (a, b) => [H[0] + ux * a * u + nx * b * u, H[1] + uy * a * u + ny * b * u];
    paint([hd(-.1, -.22), hd(1, -.22), hd(1, .22), hd(-.1, .22)], { wash: '#FFFFFF', ink: PAL.ink, sw: sw * .5 });
    for (let i = 0; i < 5; i++) inkLine([hd(i * .22, -.22), hd(i * .22, -.62)], sw * .4, PAL.sky, 'inkfine', 0);
    if (lt > tGargle && lt < tRinse) for (let i = 0; i < 3; i++) { const ph = frac(lt * 2 + i / 3), p = bodyAt(x, y, u, c, (i - 1) * .7, -4.6 - ph * 3); bubble(p[0], p[1], .3 * u, sw, 1 - ph); }
  } };

  window.ACTIONS = ACT;
  // Draw action `name` at ground point (x, y), t seconds after it started.
  window.act = (name, x, y, u, t, o = {}) => {
    const A = ACT[name]; if (!A) return;
    const lt = ((t % A.len) + A.len) % A.len;
    A.draw(x, y, u, lt, { key: 'act ' + name, ...o, hat: A.hat ? o.hat : undefined });
  };

  // Every action at once, as a sheet (the labels are fine here: it's reference, not a video).
  LOOPS.actions = t => {
    const names = Object.keys(ACT), cols = names.length > 16 ? 6 : 4, rows = Math.ceil(names.length / cols), cw = W / cols, ch = H / rows, uu = Math.min(10, cw / 34, ch / 26);
    names.forEach((n, i) => {
      const cx = cw * (i % cols) + cw / 2, gy = ch * Math.floor(i / cols) + ch - 36;
      act(n, cx, gy, uu, t, { key: 'sheet ' + n });
      letter(n, cx, gy + 24, 17, PAL.ink, { ink: false, alpha: .8 });
    });
    for (let r = 0; r < rows; r++) inkLine([[40, ch * r + ch - 31], [W / 2, ch * r + ch - 33], [W - 40, ch * r + ch - 30]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
  };
  LOOPS.actions.len = 6;
  // One action, big, on a plain ground: studio.html?loop=act-eat and so on.
  for (const n of Object.keys(ACT)) {
    LOOPS['act-' + n] = t => {
      inkLine([[160, 906], [W / 2, 903], [W - 160, 907]], .8, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
      act(n, 960, 900, 34, t);
    };
    LOOPS['act-' + n].len = ACT[n].len;
  }
})();
