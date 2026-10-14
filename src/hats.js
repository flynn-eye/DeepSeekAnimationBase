// hats.js: Seeky's hats, drawn for the view they are seen from, never squeezed from the front.
//
// A view fixes a heading A (V.yaw, in turns: front 0, 3/4 1/8, side 1/4, 3/4 back 3/8, back 1/2). A hat places its parts round
// the head by AZIMUTH: phi is the angle from the whale's nose, positive toward its right side (the side you see when it faces
// screen-right). A part at azimuth phi and radius rho lands at screen x = rho·sin(A - phi), and cos(A - phi) says how near the
// viewer it is (> 0 = on the near side). So a bow on the right ear is off to the left from the front, face-on in 3/4, beside
// the head in profile and edge-on from behind, a crown shows the spikes that really stand there, and a visor points where
// the nose points. Nothing is projected: the five views are five drawings, built from the same parts. All numbers are in u.
//
// Hats: party, hard, crown, halo, wizard, hood, top, fedora, band, sweatband, beanie, bow, flower, headphones, cat. Face
// pieces (worn on the face, and tied round the head): mask, masq, bowtie. Whiskers come with cat.

const HAT_K = .17;   // how much of a ring you see from above: its height ÷ its width
const HATS = {};     // name → (H, c) => void: draws one hat for the head frame H, with the body colours c = { col, dk, lt }

// The head frame for one view: where the hat sits and how to put a part at an azimuth round the head.
function hatFrame(V, u, sw, raise = 0) {
  const f = V.fit, A = TAU * V.yaw, cx = f.cx, base = bodyTB(V, cx)[0] + f.dip - raise, pitch = f.pitch || 0;
  const H = { V, u, sw, A, cx, base };
  H.raised = d => hatFrame(V, u, sw, raise + d);   // the same frame, d higher: for a big hat that would sit too low on the face
  const fn = v => typeof v === 'function' ? v : () => v;
  H.z = phi => Math.cos(A - phi);
  H.at = (phi, rho, h = 0) => { const a = A - phi; return [cx + rho * Math.sin(a), base - h + rho * (HAT_K * Math.cos(a) + pitch * Math.cos(phi))]; };
  H.arc = (h, rho, p0, p1, n = 12) => {   // rho and h may be functions of the azimuth
    const hf = fn(h), rf = fn(rho);
    return Array.from({ length: n + 1 }, (_, i) => { const p = lerp(p0, p1, i / n); return H.at(p, rf(p), hf(p)); });
  };
  H.ring = (h, rho, n = 32) => H.arc(h, rho, 0, TAU, n).slice(0, -1);
  H.near = (h, rho, n = 12) => H.arc(h, rho, A + Math.PI / 2, A - Math.PI / 2, n);   // the half facing the viewer, left → right
  H.band = (h0, h1, r0, r1 = r0) => H.near(h0, r0).concat(H.near(h1, r1).reverse());   // a strip of the near side
  // the axis of a hat that leans toward azimuth phi by tau radians: the offset of its centre at height h
  H.lean = (phi, tau) => h => [h * Math.tan(tau) * Math.sin(A - phi), HAT_K * h * Math.tan(tau) * Math.cos(A - phi)];
  const px = pts => pts.map(([x, y]) => [x * u, y * u]);
  H.px = px;
  H.head = V.top ? [...profile(V).top, ...profile(V).bot.slice().reverse()] : bodyPts(V, 1, 0, 64);   // the head's outline, in u
  H.wrap = pts => clipPoly(pts, H.head);   // cut a band that wraps the head by the head's own outline
  H.paint = (pts, o) => paint(px(pts), o);
  H.line = (pts, w, col = PAL.ink, br = 'ink', c = .3) => inkLine(px(pts), w, col, br, c);
  H.ink = (k = .8) => ({ ink: PAL.ink, sw: sw * k });
  // a small mark on the surface at an azimuth, squashed by how squarely it faces the viewer; hidden on the far side
  H.decal = (phi, rho, h, draw, minZ = .1) => {
    const z = H.z(phi); if (z < minZ) return;
    const [x, y] = H.at(phi, rho, h); push(); translate(x * u, y * u); scale(Math.max(.25, z), 1); draw(u, z); pop();
  };
  return H;
}

// A hat turned on a lathe: prof = [[h, r, ox, oy], ...] from the base up (ox, oy shift the axis: a lean, a bent tip).
// Returns its outline: the two edges, the far half of the top ring over the top, and the near half of the base ring under it.
function lathe(H, prof) {
  const o = p => [p[2] || 0, p[3] || 0], sh = (q, [ox, oy]) => [q[0] + ox, q[1] + oy], A = H.A, h2 = Math.PI / 2;
  const L = prof.map(p => sh(H.at(A + h2, p[1], p[0]), o(p))), R = prof.map(p => sh(H.at(A - h2, p[1], p[0]), o(p)));
  const t = prof[prof.length - 1], b = prof[0];
  const top = t[1] > .06 ? H.arc(t[0], t[1], A + h2, A + 3 * h2, 10).slice(1, -1).map(q => sh(q, o(t))) : [];
  const bot = H.near(b[0], b[1], 10).slice(1, -1).map(q => sh(q, o(b))).reverse();
  return L.concat(top, R.reverse(), bot);
}
// A strip of the near side of a surface of revolution between heights h0 and h1; r(h) is its radius, off(h) its axis offset.
function strip(H, h0, h1, r, off = () => [0, 0]) {
  const arc = h => H.near(h, r(h)).map(([x, y]) => { const [ox, oy] = off(h); return [x + ox, y + oy]; });
  return arc(h0).concat(arc(h1).reverse());
}
const hatDecal = (H, phi, rho, h, draw, off) => {   // like H.decal, on a leaning surface
  const [ox, oy] = off ? off(h) : [0, 0], z = H.z(phi); if (z < .1) return;
  const [x, y] = H.at(phi, rho, h); push(); translate((x + ox) * H.u, (y + oy) * H.u); scale(Math.max(.25, z), 1); draw(H.u, z); pop();
};

HATS.party = (H, c) => {
  const lean = H.lean(-2.6, .2), top = 5.2, r = h => 2.1 * (1 - h / top);   // it sits jauntily, tipped back and to the whale's left
  H.paint(lathe(H, [0, 1.3, 2.6, 3.9, top].map(h => [h, r(h), ...lean(h)])), { wash: PAL.rose, fill: PAL.violet, fillOp: 50, ...H.ink() });
  for (const [h0, h1, col] of [[.9, 1.6, PAL.ochre], [2.7, 3.4, PAL.cream]]) H.paint(strip(H, h0, h1, r, lean), { wash: col, ink: null });
  [[.3, 1.1, PAL.cream], [1.5, 2.2, PAL.teal], [-1, 1.9, PAL.ochre], [2.6, 3, PAL.cream], [-2.2, 2.6, PAL.teal], [3.5, 1.7, PAL.ochre], [-3.2, 3.2, PAL.cream]]
    .forEach(([phi, h, col]) => hatDecal(H, phi, r(h) * .97, h, (u) => paint(ellPts(0, 0, .22 * u, .22 * u, 8), { wash: col, ink: null }), lean));
  const [ox, oy] = lean(top);   // the pom on the tip
  H.paint(ellPts(H.cx + ox, H.base - top + oy - .15, .75, .75, 12), { wash: PAL.ochre, ...H.ink(.6) });
};

HATS.hard = H => {
  const hh = 2.9, R = 3.3, yel = '#F2C53D', dk = '#D9A51E', r = h => R * Math.sqrt(Math.max(0, 1 - (h / hh) ** 2)), cs = Math.cos;
  const nose = phi => Math.pow(Math.max(0, cs(phi)), 3), nape = phi => Math.pow(Math.max(0, -cs(phi)), 3);
  // the brim is a ring with a visor at the nose (tipped up) and a short guard at the nape
  H.paint(H.ring(phi => .1 + .6 * nose(phi), phi => 3.75 + 1.5 * nose(phi) + .8 * nape(phi)), { wash: dk, ...H.ink() });
  H.paint(lathe(H, Array.from({ length: 9 }, (_, i) => [i / 8 * hh, r(i / 8 * hh)])), { wash: yel, fill: dk, fillOp: 50, ...H.ink() });
  // the rib over the crown runs nose to nape: a vertical band from the front, an arc in profile (only where the dome faces us)
  const seen = (phi, h) => H.z(phi) * r(h) / R ** 2 + HAT_K * h / hh ** 2 > 0, rib = [];
  for (let i = 0; i <= 8; i++) if (seen(0, i / 8 * hh)) rib.push(H.at(0, r(i / 8 * hh), i / 8 * hh));
  for (let i = 7; i >= 0; i--) if (seen(Math.PI, i / 8 * hh)) rib.push(H.at(Math.PI, r(i / 8 * hh), i / 8 * hh));
  if (rib.length > 2) H.paint(ribbon(rib, .8, .8), { wash: '#FFE27A', ...H.ink(.5) });   // in u: H.paint scales to px once
  H.decal(0, r(1.2) * .98, 1.2, u => paint(ellPts(0, 0, .55 * u, .55 * u, 12), { wash: PAL.ds, ink: PAL.ink, sw: H.sw * .5 }));   // badge at the front
  H.decal(Math.PI, r(1.2) * .98, 1.2, u => paint(ellPts(0, 0, .45 * u, .45 * u, 10), { wash: '#9A93A8', ink: PAL.ink, sw: H.sw * .5 }));   // ratchet at the back
};

HATS.crown = H => {
  const Rc = 2.9, bandH = 1.1, spikeH = 2.5, gold = '#F2C53D', dk = '#B07A10', ks = [0, 1, 2, 3, 4].map(k => k * TAU / 5);
  const spike = phi => [H.at(phi - .3, Rc, bandH), H.at(phi, Rc, bandH + spikeH), H.at(phi + .3, Rc, bandH)];
  const draw = phi => {
    H.paint(spike(phi), { wash: gold, fill: PAL.ochre, fillOp: 90, ...H.ink() });
    if (H.z(phi) > -.2) H.paint(ellPts(H.at(phi, Rc, bandH + spikeH)[0], H.at(phi, Rc, bandH + spikeH)[1] - .35, .38, .38, 8), { wash: PAL.rose, ink: null });
  };
  ks.filter(p => H.z(p) < 0).sort((a, b) => H.z(a) - H.z(b)).forEach(draw);   // the spikes behind, then the open top, then the near ones
  H.paint(H.ring(bandH, Rc), { wash: dk, ...H.ink(.6) });
  ks.filter(p => H.z(p) >= 0).sort((a, b) => H.z(a) - H.z(b)).forEach(draw);
  H.paint(H.band(0, bandH, Rc), { wash: gold, fill: PAL.ochre, fillOp: 90, ...H.ink() });
  H.paint(strip(H, .2, .5, () => Rc), { wash: '#FFE27A', ink: null });
  ks.forEach((phi, k) => H.decal(phi, Rc, .55, u => paint(ellPts(0, 0, (k ? .34 : .46) * u, (k ? .34 : .46) * u, 10), { wash: k ? PAL.teal : PAL.rose, ink: PAL.ink, sw: H.sw * .4 })));
};

HATS.halo = H => {   // it hovers over the head, tipped back; the far half is thin and pale, the near half bold, which is all the depth it needs
  const h = phi => 2.7 - .55 * Math.cos(phi), pale = mixCol(PAL.ochre, PAL.paper, .5), A = H.A, q = Math.PI / 2;
  H.paint(H.ring(h, 2.9, 36), { fill: '#FFE9A8', fillOp: 45, bleed: .2, ink: null });
  H.line(H.arc(h, 2.9, A + q, A + 3 * q, 16), H.sw * .9, pale, 'ink', .5);
  H.line(H.arc(h, 2.9, A - q, A + q, 16), H.sw * 1.7, PAL.ochre, 'ink', .5);
};

// the wizard's and the hood's tips bend toward the nape and droop: sideways in profile, toward us from behind, away from the front
const bendTip = (H, phi, len, drop, top) => h => {
  const k = Math.pow(h / top, 2.2), d = len * k;
  return [d * Math.sin(H.A - phi), d * HAT_K * Math.cos(H.A - phi) + drop * k];
};

HATS.wizard = H => {
  const top = 6.4, r = h => 2.55 * Math.pow(1 - h / top, 1.15), off = bendTip(H, -2.8, 2.4, 1.5, top), blue = PAL.indigo;
  H.paint(H.ring(.1, 4.3), { wash: mixCol(blue, PAL.ink, .25), ...H.ink() });
  const hs = [0, .8, 1.8, 3, 4.2, 5.3, top];
  H.paint(lathe(H, hs.map(h => [h, r(h), ...off(h)])), { wash: blue, fill: PAL.violet, fillOp: 80, ...H.ink() });
  H.paint(strip(H, .3, 1.1, r, off), { wash: mixCol(PAL.violet, PAL.ink, .3), ink: null });
  hatDecal(H, 0, r(.7), .7, u => paint(rectPts(-.4 * u, -.4 * u, .8 * u, .8 * u), { wash: PAL.ochre, ink: PAL.ink, sw: H.sw * .4 }), off);   // buckle
  hatDecal(H, .4, r(2.6) * .97, 2.6, u => paint(starPts(0, 0, .85 * u, .4, 5), { wash: PAL.ochre, ink: null }), off);
  hatDecal(H, -1.1, r(4.1) * .97, 4.1, u => paint(starPts(0, 0, .5 * u, .4, 5), { wash: PAL.cream, ink: null }), off);
  hatDecal(H, Math.PI + .5, r(3.2) * .97, 3.2, u => {   // a crescent on the back
    paint(ellPts(0, 0, .8 * u, .8 * u, 14), { wash: PAL.ochre, ink: null });
    paint(ellPts(.38 * u, -.12 * u, .7 * u, .7 * u, 14), { wash: blue, ink: null });
  }, off);
};

HATS.hood = H0 => {
  const H = H0.raised(.45), top = 5.1, vio = PAL.violet, dk = mixCol(vio, PAL.ink, .4), lt = mixCol(vio, '#FFFFFF', .5), off = bendTip(H, Math.PI, 3.4, 1.7, top);
  const cap = [[0, 4.45], [.7, 4.4], [1.6, 4.1], [2.6, 3.4], [3.5, 2.4], [4.2, 1.4], [4.7, .6], [top, .03]], zb = H.z(Math.PI);
  const r = h => { let i = 1; while (i < cap.length - 1 && h > cap[i][0]) i++; const [h0, r0] = cap[i - 1], [h1, r1] = cap[i]; return lerp(r0, r1, clamp((h - h0) / (h1 - h0))); };
  if (zb > .1) {   // from behind the hood drapes down the nape, with a seam down the middle
    const xc = H.cx - 3 * Math.sin(H.A), w = 1 + 2.7 * zb, y0 = H.base + .4, y1 = -3.4;
    H.paint([[xc - w, y0], [xc + w, y0], [xc + w * 1.05, lerp(y0, y1, .5)], [xc + w * .75, y1], [xc, y1 + .5], [xc - w * .75, y1], [xc - w * 1.05, lerp(y0, y1, .5)]], { wash: dk, fill: vio, fillOp: 90, ...H.ink(), curv: .4 });
    H.line([[xc, y0 + .4], [xc, y1 + .3]], H.sw * .5, PAL.ink, 'inkfine', 0);
  }
  H.paint(lathe(H, cap.map(([h, rr]) => [h, rr, ...off(h)])), { wash: vio, fill: dk, fillOp: 70, ...H.ink() });
  if (H.z(0) > -.2) {   // the lining frames the face: an arc round the nose, so it is not there from behind
    const edge = h => H.arc(h, 4.45, -1, 1, 10);
    H.paint(edge(0).concat(edge(.75).reverse()), { wash: lt, fill: vio, fillOp: 60, ...H.ink(.6) });
  }
  H.line(H.near(2.2, 3.7, 8).slice(2, -2), H.sw * .45, dk, 'inkfine', .5);   // a fold across the crown
};

const shifted = (pts, [ox, oy]) => pts.map(([x, y]) => [x + ox, y + oy]);
// Clip a polygon to a convex one (Sutherland-Hodgman): a band that wraps the head is cut by the head's own outline.
function clipPoly(subject, clip) {
  let area = 0; clip.forEach((p, i) => { const q = clip[(i + 1) % clip.length]; area += p[0] * q[1] - q[0] * p[1]; });
  const sg = area >= 0 ? 1 : -1;
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length], inside = p => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0, inp = out; out = [];
    inp.forEach((p, j) => {
      const q = inp[(j + 1) % inp.length], ip = inside(p), iq = inside(q);
      if (ip !== iq) {
        const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]), t = d1 / (d1 - d2);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
      if (iq) out.push(q);
    });
  }
  return out;
}

HATS.top = H => {
  const lean = H.lean(-2, .09), ch = 4.4, felt = '#3A3148', r = () => 2.35;
  H.paint(H.ring(.1, 3.9), { wash: felt, ...H.ink() });   // the brim
  H.paint(lathe(H, [0, ch].map(h => [h, 2.35, ...lean(h)])), { wash: felt, fill: PAL.indigo, fillOp: 60, ...H.ink() });
  H.paint(shifted(H.ring(ch, 2.35), lean(ch)), { wash: '#4C4260', ...H.ink(.5) });   // the flat top
  H.paint(strip(H, .35, 1.25, r, lean), { wash: '#C8324A', ink: null });
  hatDecal(H, 0, 2.38, .8, u => {   // a buckle on the front of the band, which is not there from behind
    paint(rectPts(-.55 * u, -.5 * u, 1.1 * u, 1 * u), { wash: PAL.ochre, ink: PAL.ink, sw: H.sw * .4 });
    paint(rectPts(-.28 * u, -.25 * u, .56 * u, .5 * u), { wash: '#C8324A', ink: null });
  }, lean);
};

HATS.fedora = H => {
  const lean = H.lean(-2.2, .1), felt = '#3B3550', ch = 3, r = h => 2.7 - .6 * Math.pow(h / ch, 2), red = '#C8324A';
  H.paint(H.ring(phi => .05 + .6 * Math.pow(Math.sin(phi), 2), 4.5), { wash: felt, ...H.ink() });   // the brim curls up at the sides, flat at nose and nape
  H.paint(lathe(H, [0, 1, 2, ch].map(h => [h, r(h), ...lean(h)])), { wash: felt, fill: PAL.indigo, fillOp: 50, ...H.ink() });
  H.paint(strip(H, .35, 1.15, r, lean), { wash: red, ink: null });
  H.line(shifted([H.at(0, 1.5, ch), H.at(Math.PI, 1.5, ch)], lean(ch)), H.sw * .6, PAL.ink, 'inkfine', .3);   // the crease along the top, nose to nape
  for (const s of [-1, 1]) hatDecal(H, s * .38, r(1.6) * .98, 1.9, u => inkLine([[0, -.9 * u], [s * .15 * u, .9 * u]], H.sw * .45, PAL.ink, 'inkfine', 0), lean);   // the pinch at the front
  hatDecal(H, 1.25, r(.8) * 1.02, .75, u => {   // a feather in the band on the right side
    push(); rotate(-.6);
    paint(ellPts(0, -.7 * u, .3 * u, 1.1 * u, 10), { wash: PAL.ochre, ...H.ink(.4) });
    inkLine([[0, .3 * u], [0, -1.6 * u]], H.sw * .35, PAL.ink, 'inkfine', 0); pop();
  }, lean);
};

// A band round the head: cut by the head's outline so it wraps the dome. The knot of the headband sits at the nape: it
// shows as a bow behind the head in profile, in the middle from behind, and not at all from the front.
function headband(H, col, w, knot) {
  const R = 4.1, h0 = .15, zn = H.z(Math.PI), red = '#D8394E';
  H.paint(H.wrap(H.band(h0, h0 + w, R)), { wash: col, fill: mixCol(col, PAL.ink, .5), fillOp: 50, ...H.ink(.6) });
  if (knot) {
    if (zn > -.3) bowKnot(H, H.at(Math.PI, 3.4, h0 + w / 2), col);
  } else {
    for (const [a, b] of [[.22, .38], [.62, .78]]) H.paint(H.wrap(H.band(h0 + w * a, h0 + w * b, R)), { wash: red, ink: null });
    H.decal(0, R - .5, h0 + w / 2, u => paint(starPts(0, 0, .5 * u, .45, 5), { wash: red, ink: null }));   // a star on the front
    H.decal(Math.PI, R - .2, h0 + w / 2, u => inkLine([[0, -.5 * w * u], [0, .5 * w * u]], H.sw * .5, PAL.ink, 'inkfine', 0));   // the seam at the back
  }
}
HATS.band = H => headband(H, '#D8394E', .8, true);
HATS.sweatband = H => headband(H, PAL.cream, 1.1, false);

HATS.beanie = H => {
  const lean = H.lean(Math.PI, .14), tk = 3.7, teal = PAL.teal, dk = mixCol(teal, PAL.ink, .22), r = h => 3.75 * Math.sqrt(Math.max(0, 1 - Math.pow(h / tk, 2.2)));
  H.paint(lathe(H, [0, .6, 1.5, 2.4, 3.1, 3.5, tk].map(h => [h, r(h), ...lean(h)])), { wash: teal, fill: PAL.sky, fillOp: 60, ...H.ink() });
  for (let k = 0; k < 9; k++) {   // knitted ribs run from the cuff to the crown; they sweep round as the hat turns
    const phi = k * TAU / 9 + .2, z = H.z(phi); if (z < .15) continue;
    H.line([1.2, 1.9, 2.6, 3.2, 3.55].map(h => { const p = H.at(phi, r(h) * .99, h), [ox, oy] = lean(h); return [p[0] + ox, p[1] + oy]; }), H.sw * .4, dk, 'inkfine', .5);
  }
  H.paint(strip(H, 0, 1.15, () => 3.85, lean), { wash: dk, fill: teal, fillOp: 50, ...H.ink(.7) });   // the folded cuff
  for (let k = 0; k < 14; k++) {
    const phi = k * TAU / 14, z = H.z(phi); if (z < .15) continue;
    H.line([.1, 1.05].map(h => shifted([H.at(phi, 3.86, h)], lean(h))[0]), H.sw * .3, mixCol(dk, PAL.ink, .4), 'inkfine', 0);
  }
  const [ox, oy] = lean(tk);   // a fluffy pom
  H.paint(starPts(H.cx + ox, H.base - tk + oy - .3, 1, .8, 9), { wash: PAL.cream, ...H.ink(.5) });
};

// a spot on top of the head at an azimuth, kept on the head: no lower than the silhouette (+ depth) at that x
const onTop = (H, phi, rho, h, depth = .6) => { const [x, y] = H.at(phi, rho, h); return [x, Math.min(y, bodyTB(H.V, x)[0] + depth)]; };

HATS.bow = H => {   // on the right side of the head: it faces whichever way the head's right side faces
  const phi = .95, z = H.z(phi), [bx, by] = onTop(H, phi, 2.9, 1.1, .3), u = H.u, far = z < 0;
  const pink = far ? mixCol(PAL.rose, PAL.ink, .22) : PAL.rose, deep = '#E2476E';
  push(); translate(bx * u, by * u); scale(Math.max(.22, Math.abs(z)) * (far ? .8 : 1), far ? .8 : 1);
  for (const s of [-1, 1]) paint([[0, 0], [s * 1.8 * u, -1 * u], [s * 2 * u, 0], [s * 1.6 * u, 1 * u]], { wash: pink, fill: deep, fillOp: 70, ...H.ink(.6), curv: .3 });
  paint(ellPts(0, 0, .5 * u, .5 * u, 10), { wash: deep, ...H.ink(.5) });
  pop();
};

HATS.flower = H => {   // face-on it shows its petals; from the far side it shows the green back of the flower
  const phi = .95, z = H.z(phi), [fx, fy] = onTop(H, phi, 2.9, 1.2, .3), u = H.u, sw = H.sw;
  push(); translate(fx * u, fy * u);
  inkLine([[0, 0], [-.2 * u, 1.1 * u]], sw * .6, PAL.sap, 'ink', 0);
  paint(ellPts(-.9 * u * Math.max(.4, Math.abs(z)), .8 * u, .85 * u * Math.max(.4, Math.abs(z)), .32 * u, 10, 0, -.5), { wash: PAL.sap, ...H.ink(.4) });
  scale(Math.max(.3, Math.abs(z)), 1);
  if (z >= 0) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .3; paint(ellPts(Math.cos(a) * .7 * u, Math.sin(a) * .7 * u, .55 * u, .55 * u, 10), { wash: PAL.cream, ...H.ink(.4) }); }
    paint(ellPts(0, 0, .45 * u, .45 * u, 10), { wash: PAL.ochre, ...H.ink(.4) });
  } else {
    paint(starPts(0, 0, 1.15 * u, .6, 5, .3), { wash: PAL.sap, ...H.ink(.4) });
    paint(ellPts(0, 0, .45 * u, .45 * u, 10), { wash: mixCol(PAL.sap, PAL.ink, .25), ink: null });
  }
  pop();
};

HATS.headphones = H => {   // the band is an arch from ear to ear: a full arch from the front, a single upright strip in profile
  const A = H.A, u = H.u, R = 5.15, yc = -5.9, Hh = 4.1, ca = Math.cos(A), sa = Math.sin(A), sw = H.sw, ear = 1.75;   // the cups sit a little behind the cheeks
  const cup = s => {
    const d = s * sa; if (d < -.3) return;   // behind the head
    const w = 1.4 + 1.5 * Math.abs(sa), x = H.cx + R * Math.sin(A - s * ear);
    paint(rrPts((x - w / 2) * u, (yc - 1.45) * u, w * u, 2.9 * u, Math.min(.6, w / 2) * u), { wash: PAL.violet, fill: PAL.rose, fillOp: 50, ...H.ink(.7) });
    if (d > .4) paint(ellPts(x * u, yc * u, (w / 2 - .45) * u, 1 * u, 14), { wash: PAL.rose, fill: '#FFFFFF', fillOp: 50, ink: PAL.ink, sw: sw * .4 });   // the cushion faces us
  };
  const arch = Array.from({ length: 21 }, (_, i) => {
    const th = i / 20 * Math.PI, s = R * Math.cos(th), sg = Math.sign(s || 1), x = H.cx + Math.abs(s) * Math.sin(A - sg * ear), y = yc - Hh * Math.sin(th);
    return { p: [x, y], seen: sg * sa >= -.05 || y < bodyTB(H.V, x)[0] + .1 };   // the far half of the arch only shows above the head
  });
  const runs = []; let run = [];
  arch.forEach(({ p, seen }) => { if (seen) run.push(p); else { if (run.length > 1) runs.push(run); run = []; } });
  if (run.length > 1) runs.push(run);
  [-1, 1].filter(s => s * sa < 0).forEach(cup);
  runs.forEach(r => H.line(r, sw * 2.4, PAL.ink, 'ink', .6));
  [-1, 1].filter(s => s * sa >= 0).forEach(cup);
};

HATS.cat = (H, c) => {
  const ears = [-1, 1].map(s => ({ phi: s * .85, z: H.z(s * .85) })).sort((a, b) => a.z - b.z), sideOn = Math.abs(Math.sin(H.A)) > .85;
  ears.forEach(({ phi, z }, i) => {   // the far ear first; side-on it peeks out behind the near one
    const k = sideOn && !i ? .92 : 1, nudge = sideOn && !i ? -.9 : 0;
    const [x, y0] = H.at(phi, 3, -.3), y = Math.min(y0, bodyTB(H.V, x)[0] + .5), tip = H.at(phi, 3.9, 2.4);   // the base stays on the head's outline
    const w = 2.3 * (.45 + .55 * Math.abs(z)) * k, bx = x + nudge, tx = tip[0] + nudge, ty = tip[1] + (y - y0);
    H.paint([[bx - w / 2, y], [tx, ty], [bx + w / 2, y]], { wash: c.col, fill: c.dk, fillOp: 60, ...H.ink() });
    H.paint([[bx - w * .3, y - .1], [lerp(bx, tx, .72), lerp(y, ty, .72)], [bx + w * .3, y - .1]], { wash: PAL.rose, ink: null });
  });
};

// ---------- face pieces ----------
// mask and masq are painted BEFORE the eyes, so the eyes stay expressive on them. They are tied round the head: the tie shows
// as a strap running back to a knot at the nape in profile, and as a band with a knot across the back from behind.
const eyeSpots = V => V.face ? V.face.sides.map(s => [V.face.cx + s * 2.5 * V.face.fw, -6 + (V.face.dy || 0)]) : [];

function bowKnot(H, k, col) {   // a knot with two tails at the point k: they stream back and down in profile, hang straight from behind
  const d = clamp((k[0] - H.cx) / 2.5, -1, 1);
  for (const s of [-1, 1]) {
    const e = [k[0] + d * 1.8 + s * (1.1 - .6 * Math.abs(d)), k[1] + 2.2 - .5 * Math.abs(d)], m = [lerp(k[0], e[0], .5) - s * .2, lerp(k[1], e[1], .5) - .2];
    H.paint(ribbon([k, m, e], .8, .35), { wash: col, ...H.ink(.5) });   // in u: H.paint scales to px once
  }
  H.paint(ellPts(k[0], k[1], .55, .5, 10), { wash: mixCol(col, PAL.ink, .15), ...H.ink(.5) });
}
function maskTie(H, col) {
  const h = H.base + 6.5, zn = H.z(Math.PI), w = .75;   // the tie rings the head at the height of the eyes
  H.paint(H.wrap(H.band(h - w / 2, h + w / 2, 4.7)), { wash: col, ...H.ink(.5) });
  if (zn > -.3) bowKnot(H, H.at(Math.PI, 3.9, h), col);
}
HATS.mask = H => { if (!H.V.face) maskTie(H, '#4A3B8A'); };
HATS.masq = H => { if (!H.V.face) maskTie(H, PAL.rose); };
HATS.bowtie = () => {};

function faceUnder(V, u, sw, h, c) {
  if (h !== 'mask' && h !== 'masq') return;
  const H = hatFrame(V, u, sw), F = V.face, nx = F.cx, side = V.whale, ball = h === 'masq';
  maskTie(H, ball ? PAL.rose : '#4A3B8A');
  const bandit = side ? [[-.3, -7.6], [6.3, -7.6], [6.3, -4.7], [1.4, -4.7]]
    : [[-7, -7.6], [7, -7.6], [7, -4.7], [nx + 1.7, -4.7], [nx + 1.1, -5.3], [nx - 1.1, -5.3], [nx - 1.7, -4.7], [-7, -4.7]];
  const fancy = side ? [[-.3, -8.2], [2.6, -8.1], [6.3, -7.6], [6.3, -4.9], [2.6, -5], [1.5, -5.7], [-.3, -5.2]]
    : [[-7, -8.6], [-2.8, -8.4], [nx, -7.2], [nx + 2.8, -8.4], [7, -8.6], [7, -4.9], [nx + 1.8, -5.1], [nx + 1, -5.9], [nx - 1, -5.9], [nx - 1.8, -5.1], [-7, -4.9]];
  H.paint(H.wrap(ball ? fancy : bandit), ball ? { wash: PAL.violet, fill: PAL.rose, fillOp: 60, ...H.ink(.7) } : { wash: PAL.violet, fill: '#4A3B8A', fillOp: 40, ...H.ink(.7) });   // light enough for the eyes to read on it
  if (ball) for (const [ex, ey] of eyeSpots(V)) paint(ellPts(ex * u, ey * u, 1.25 * F.fw * u, .78 * u, 14), { wash: c.col, ...H.ink(.4) });   // eye holes show the face
}
function faceOver(V, u, sw, h) {
  const F = V.face, A = TAU * V.yaw;
  if (h === 'bowtie') {
    const wf = .4 + .6 * Math.abs(Math.cos(A)), [x, y] = V.whale ? [3.9, -3.3] : [F.cx + F.mx * F.fw, -3];
    push(); translate(x * u, y * u); scale(wf, 1);
    for (const s of [-1, 1]) paint([[0, 0], [s * 1.6 * u, -.75 * u], [s * 1.6 * u, .75 * u]], { wash: PAL.rose, fill: '#E2476E', fillOp: 70, ink: PAL.ink, sw: sw * .5 });
    paint(ellPts(0, 0, .4 * u, .45 * u, 8), { wash: '#E2476E', ink: PAL.ink, sw: sw * .5 });
    pop();
  } else if (h === 'cat') {   // whiskers fan out from each cheek, past the nose in profile
    for (const [ex, ey] of eyeSpots(V)) {
      const s = ex > F.cx ? 1 : -1, rx = ex + s * 1.5 * F.fw, ry = ey + 1.3, len = 2.4 * Math.sqrt(F.fw) + .4;
      for (const k of [-.3, .3]) inkLine([[rx * u, (ry + k) * u], [(rx + s * len) * u, (ry + k * 2.2 + .1) * u]], sw * .4, PAL.ink, 'inkfine', 0);
    }
  }
}

// Hats that sit off to one side, or are not seen from behind, leave the tail where it is. Every other hat stands over the back of
// the head (or ties a knot there), so seen from behind the tail steps aside (VIEWS.tailAside) and the hat is drawn in front of it.
const HAT_LOW = ['bowtie', 'bow', 'flower'];
const hatNeedsRoom = h => !!h && !!HATS[h] && !HAT_LOW.includes(h);

// Draw hat h on the head, seen from view V. c = the body colours, so ears follow a tint.
function hat(u, h, sw, V = VIEWS.front, c = {}) {
  if (!HATS[h]) return;
  HATS[h](hatFrame(V, u, sw), { col: c.col || PAL.ds, dk: c.dk || PAL.dsDk, lt: c.lt || PAL.dsLt });
}
