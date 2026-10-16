// Pixi owns the visible WebGL canvas. The natural-media engine writes directly
// to a RenderTexture; paper, grain, light and lettering stay on the same GPU.
let brush = null;
let sceneRandomState = 1;
let sceneMatrix = null;
const sceneStack = [];

function randomSeed(seed) {
  sceneRandomState = Number(seed) >>> 0;
  brush?.seed(sceneRandomState);
}
function random(a, b) {
  sceneRandomState = (Math.imul(sceneRandomState, 1664525) + 1013904223) >>> 0;
  const value = sceneRandomState / 4294967296;
  if (Array.isArray(a)) return a[Math.floor(value * a.length)];
  if (a === undefined) return value;
  if (b === undefined) return value * a;
  return a + (b - a) * value;
}
function noiseSeed(seed) { brush.noiseSeed(seed); }
function noise(x, y = 0) { return brush.noise(x, y); }

// These are scene transform helpers, shared by the existing character and hats.
// Each transform affects brush commands and ordinary Pixi light sprites alike.
function push() { sceneStack.push(sceneMatrix.clone()); brush.push(); }
function pop() {
  if (!sceneStack.length) throw new Error('Unbalanced scene pop().');
  sceneMatrix = sceneStack.pop(); brush.pop();
}
function translate(x, y) {
  sceneMatrix.append(new PIXI.Matrix(1, 0, 0, 1, x, y)); brush.translate(x, y);
}
function rotate(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  sceneMatrix.append(new PIXI.Matrix(c, s, -s, c, 0, 0)); brush.rotate(angle);
}
function scale(x, y = x) { sceneMatrix.append(new PIXI.Matrix(x, 0, 0, y, 0, 0)); brush.scale(x, y); }

const PixiRuntime = {
  app: null,
  initialization: null,
  stage: null,
  paper: null,
  grain: null,
  glow: null,
  lightLayer: null,
  letterLayer: null,
  letterPool: [],
  stats: { backend: 'pixijs-webgl2', frame: 0, frameMs: 0, flushes: 0 },

  init(canvas, width, height) {
    if (!this.initialization) {
      this.initialization = this.initialize(canvas, width, height).catch(error => {
        try { brush?.destroy(); } catch {}
        try { if (this.app?.renderer) this.app.destroy(false); } catch {}
        this.app = null; brush = null; this.initialization = null;
        throw error;
      });
    }
    return this.initialization;
  },

  async initialize(canvas, width, height) {
    if (!window.PIXI || !window.PixiBrushEngine?.createPixiBrush) {
      throw new Error('PixiJS or the local GPU brush build is missing. Run npm install and build ../p5.brush.');
    }
    this.app = new PIXI.Application();
    await this.app.init({ canvas, width, height, resolution: 1, preference: 'webgl',
      antialias: false, autoStart: false, backgroundAlpha: 1,
      preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    brush = window.PixiBrushEngine.createPixiBrush(this.app.renderer,
      { width, height, origin: 'top-left', addToStage: false, seed: 1 });
    window.brush = brush;
    sceneMatrix = new PIXI.Matrix();
    this.stage = new PIXI.Container();
    this.stage.addChild(brush.sprite);
    this.lightLayer = new PIXI.Container();
    this.letterLayer = new PIXI.Container();
    this.stats.pixiVersion = PIXI.VERSION;
    this.stats.brushBackend = brush.diagnostics.backend;
    window.animationRenderer = this.stats;
  },

  textures(paperCanvas, grainCanvas, glowCanvas) {
    this.paper = new PIXI.Sprite(PIXI.Texture.from(paperCanvas));
    this.grain = new PIXI.Sprite(PIXI.Texture.from(grainCanvas));
    this.grain.blendMode = 'multiply';
    this.stage.addChild(this.grain);
    this.glow = new PIXI.Sprite(PIXI.Texture.from(glowCanvas));
    this.glow.blendMode = 'add';
    this.lightLayer.addChild(this.glow);
  },

  begin() {
    // Unwind a failed frame before trying again, as well as normal frame state.
    while (sceneStack.length) pop();
    sceneMatrix.identity();
    brush.clear();
    this.app.renderer.render({ container: this.paper, target: brush.texture, clear: false });
    this.stats.flushes = 0;
    push();
  },

  flush() {
    brush.render();
    this.stats.flushes++;
  },

  light(x, y, radius, color, alpha) {
    this.flush();
    this.glow.position.set(x - radius, y - radius);
    this.glow.width = this.glow.height = radius * 2;
    this.glow.tint = new PIXI.Color(color).toNumber();
    this.glow.alpha = 150 / 255 * alpha;
    this.lightLayer.setFromMatrix(sceneMatrix);
    this.app.renderer.render({ container: this.lightLayer, target: brush.texture, clear: false });
  },

  letters(letters) {
    if (!letters.length) return;
    this.flush();
    for (const node of this.letterPool) node.visible = false;
    let used = 0;
    for (const L of letters) {
      const k = L.pop != null ? backOut(L.pop) : 1;
      if (k <= .01) continue;
      let node = this.letterPool[used];
      if (!node) {
        node = new PIXI.Container();
        node.shadow = new PIXI.Text({ text: '', style: { fill: PAL.ink } });
        node.front = new PIXI.Text({ text: '', style: { fill: PAL.ink } });
        node.addChild(node.shadow, node.front);
        this.letterLayer.addChild(node); this.letterPool.push(node);
      }
      used++;
      const font = L.font?.match(/(?:(bold|[1-9]00)\s+)?([\d.]+)px\s+(.+)/);
      const fontSize = font ? Number(font[2]) : L.size;
      const style = { fontSize, fontFamily: font?.[3] || 'Marker Felt, Comic Sans MS, cursive',
        fontWeight: font?.[1] || 'normal', fill: L.color };
      const anchor = L.align === 'left' ? 0 : L.align === 'right' ? 1 : .5;
      for (const text of [node.shadow, node.front]) { text.text = L.txt; text.anchor.set(anchor, .5); }
      node.front.style = L.stroke ? { ...style, stroke: { color: L.stroke, width: L.size * .12, join: 'round' } } : style;
      node.shadow.style = { ...style, fill: PAL.ink };
      node.shadow.visible = L.ink !== false;
      node.shadow.position.set(L.size * .045, L.size * .055);
      node.position.set(L.x, L.y); node.rotation = L.rot || 0;
      node.scale.set(k); node.alpha = L.alpha ?? 1; node.visible = true;
    }
    this.app.renderer.render({ container: this.letterLayer, target: brush.texture, clear: false });
  },

  end() {
    this.flush();
    while (sceneStack.length) pop();
    this.app.renderer.render({ container: this.stage, clear: true });
    this.stats.frame++;
  },

  gpuInfo() {
    const gl = this.app.renderer.gl, extension = gl.getExtension('WEBGL_debug_renderer_info');
    return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  }
};
