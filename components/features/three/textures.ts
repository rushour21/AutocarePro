import * as THREE from 'three';

/** All textures are drawn on a canvas, so the 3D scene needs no network requests or asset files. */
function make(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** one 2 m x 2 m floor tile; repeat it across the floor */
export function floorTexture() {
  const t = make(256, 256, (c) => {
    c.fillStyle = '#cdc5b8';
    c.fillRect(0, 0, 256, 256);
    // gentle speckle so large floors do not look flat
    for (let i = 0; i < 900; i++) {
      const g = 170 + Math.random() * 60;
      c.fillStyle = `rgba(${g},${g - 6},${g - 16},0.12)`;
      c.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    c.strokeStyle = 'rgba(96,86,70,0.38)';
    c.lineWidth = 3;
    c.strokeRect(1.5, 1.5, 253, 253);
    c.strokeStyle = 'rgba(96,86,70,0.14)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(128, 0); c.lineTo(128, 256); c.moveTo(0, 128); c.lineTo(256, 128);
    c.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  // explicit trilinear mipmaps: the speckled tile must average out when the floor is far away, in every renderer
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  return t;
}

/** text painted on the floor of a bay ("01", "RESERVED"...). Transparent background. */
export function labelTexture(main: string, color: string, sub?: string) {
  return make(512, 256, (c) => {
    c.clearRect(0, 0, 512, 256);
    c.fillStyle = color;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `italic 800 ${sub ? 150 : 190}px Inter, Arial, sans-serif`;
    c.fillText(main, 256, sub ? 100 : 128);
    if (sub) {
      c.font = '700 54px Inter, Arial, sans-serif';
      c.fillText(sub, 256, 214);
    }
  });
}

export function signTexture(text: string) {
  return make(512, 128, (c) => {
    c.fillStyle = '#1f2329';
    c.fillRect(0, 0, 512, 128);
    c.strokeStyle = '#f26a2e';
    c.lineWidth = 12;
    c.beginPath();
    c.arc(76, 64, 34, -2.2, 3.4);
    c.stroke();
    c.beginPath();
    c.moveTo(62, 76); c.lineTo(76, 52); c.lineTo(90, 76);
    c.stroke();
    c.fillStyle = '#ffffff';
    c.textBaseline = 'middle';
    c.font = '800 62px Inter, Arial, sans-serif';
    c.fillText(text, 130, 66);
  });
}

/** soft dark blob, used as a fake contact shadow under vehicles */
export function blobTexture() {
  return make(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}

export function hazardTexture() {
  const t = make(128, 32, (c) => {
    c.fillStyle = '#f2b01e';
    c.fillRect(0, 0, 128, 32);
    c.fillStyle = '#1c1d20';
    for (let x = -32; x < 160; x += 32) {
      c.beginPath();
      c.moveTo(x, 32); c.lineTo(x + 16, 32); c.lineTo(x + 32, 0); c.lineTo(x + 16, 0);
      c.closePath();
      c.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
