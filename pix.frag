#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265359
const float PHI = 1.61803398874989484820459;
const float SEED = 43758.0;


const float GRAIN_SCALE = 1.0; 

uniform vec2 resolution;
uniform sampler2D pg;
uniform sampler2D pg2;
uniform sampler2D img;
uniform float ak;
uniform float dirX;
uniform float dirY;
uniform float satOn;
uniform float proD;
uniform float u_time;
uniform float u_lineDir;


float random(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(vec2 x) {
	vec2 i = floor(x);
	vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = random(i);
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));

	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}



vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)),
              d / (q.x + e),
              q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.8;
    vec2 shift = vec2(10.0);
    for (int i = 0; i < 10; i++) {
        value += amplitude * noise(st);
        st = st * 2.0 + shift;
        amplitude *= 0.6;
    }
    return value;
}

void main() {
  // Standard UV
  vec2 uv = gl_FragCoord.xy / resolution;
  uv.y = 1.0 - uv.y;


  vec2 offset = vec2(texture2D(pg2, uv).r * 10.0 * ak)
                * vec2(1.0/resolution.x, 1.0/resolution.y)
                * random(uv * 400.0 * GRAIN_SCALE); 

  vec2 pgCol = vec2(texture2D(pg, uv)) * noise(uv * 40.0 * GRAIN_SCALE);

  // Direction logic
  if(satOn == 1.0) {
    if(pgCol.x < proD) offset.x *= dirX * -1.0;
    else               offset.x *= dirX;
    if(pgCol.y < proD) offset.y *= dirY * -1.0;
    else               offset.y *= dirY;
  }
  else if(satOn == 2.0) { 
    if(pgCol.x < 0.5) offset.x *= -1.0;
    else              offset.x *= dirX;
    if(pgCol.y < 0.5) offset.y *= -1.0;
    else              offset.y *= dirY;
  }
  else { // satOn == 3
    if(pgCol.x < 0.1) offset.x *= -1.0;
    else              offset.x *= dirX;
    if(pgCol.y < 0.1) offset.y *= -1.0;
    else              offset.y *= dirY;
  }

  // Glitch line
  float ldir;
  if(u_lineDir == 0.0) {
    ldir = fract(sin(uv.x * 1000.0) * SEED);
  } else {
    ldir = fract(sin(uv.y * 1000.0) * SEED);
  }

  float glitchLine = step(0.98, ldir);
  vec2 glitchLineOffset = vec2(0.0, glitchLine * 0.1);

  // Base color
  vec3 c = texture2D(img, uv + offset).rgb;

  // Slight hue shift
  vec3 hsv = rgb2hsv(c);
  hsv.y *= 1.0005;
  c = hsv2rgb(hsv);

  c -= texture2D(img, uv - random(uv / 2.0 * GRAIN_SCALE) - offset).rgb; // CHANGED
  c += texture2D(img, uv + random(uv / 1.0 * GRAIN_SCALE) / offset).rgb; // CHANGED


  c = clamp(c, 0.05, 0.9);

  // Slight chromatic aberration
  float aberrationAmount = 0.000002;
  vec2 aberrationOffset = vec2(aberrationAmount, 0.0);

  float r = texture2D(img, uv - offset + vec2(aberrationOffset.x, 0.0)).r;
  float g = texture2D(img, uv - offset).g;
  float b = texture2D(img, uv - offset - vec2(aberrationOffset.x, 0.0)).b;
  vec3 chro = vec3(r, g, b);

  gl_FragColor = vec4(c, 1.0);
}
