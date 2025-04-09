#ifdef GL_ES
precision highp float;
#endif
#define PI 3.14159265359
const float PHI = 1.61803398874989484820459;
const float SEED = 43758.0;
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

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

 float noise (in vec2 st) {
     vec2 i = floor(st);
     vec2 fu = fract(st);
     float a = random(i);
     float b = random(i + vec2(1.0, 0.0));
     float c = random(i + vec2(0.0, 1.0));
     float d = random(i + vec2(1.0, 1.0));
     vec2 u = fu * fu * (3.0 - 2.0 * fu);
     return mix(a, b, u.x) +(c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
 }


vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
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

vec2 computeDisplacement(vec2 uv, float time) {
    float noiseScale = 5.0;          // Controls particle density
    float noiseSpeed = 0.01;           // Controls particle movement speed
    float displacementStrength = 0.005; // 0.0005

    // Use fbm for detailed noise
    float n = fbm(uv * noiseScale + time * noiseSpeed);

    // Map noise to an angle to create directional displacement
    float angle = n * PI * 2.0;

    // Compute displacement vector based on angle
    vec2 displacement = vec2(cos(angle), sin(angle)) * displacementStrength;

    return displacement;
}


void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv.y = 1. - uv.y;


vec2 displacement = computeDisplacement(uv, -u_time);
vec2 displacedUV = uv + displacement;
vec2 sortedUV = displacedUV;
float sortValue = random(displacedUV*1.0);



  vec2 offset;
  vec2 pgCol;
  offset = vec2(texture2D(pg2, uv).r * 10. * ak ) * vec2(1./resolution.x, 1./resolution.y);//  * random(uv*100.0);
  pgCol = vec2(texture2D(pg, uv))* noise(uv*20.0);

  if(satOn == 1.0){/////sadece düz
    if(pgCol.x < proD) offset.x *= dirX * -1.;
     else offset.x *= dirX;
    if(pgCol.y < proD) offset.y *= dirY * -1.;
     else  offset.y *= dirY;
  }else if(satOn == 2.0){////bu kose
    if(pgCol.x < .5) offset.x *= -1.;
      else if(pgCol.x < 1.) offset.x *= dirX;
    if(pgCol.y < .5) offset.y *= -1.;
      else if(pgCol.y < 1.) offset.y *= dirY;
  }else{////////bu da hepsi
    if(pgCol.x < .1) offset.x *= -1.;
      else offset.x *= dirX;
    if(pgCol.y < .1) offset.y *= -1.;
      else  offset.y *= dirY;
  }

  // if(pgCol.x < .1) offset.x *=  -1. * cos(u_time);
  // else if(pgCol.x < 1.) offset.x *= dirX * cos(u_time);
  // if(pgCol.y < .1) offset.y *= -1. * sin(u_time);
  // else if(pgCol.y < 1.) offset.y *= dirY * sin(u_time);

  // if(pgCol.x < .1) offset.x *=  -1. * dirX* cos(u_time);
  // else if(pgCol.x < 1.) offset.x *= dirX * cos(u_time);
  // if(pgCol.y < .1) offset.y *= -1.* dirY * sin(u_time);
  // else if(pgCol.y < 1.) offset.y *= dirY * sin(u_time);

  vec3 c = texture2D(img, sortedUV + offset).rgb ;
  
  vec3 hsv = rgb2hsv(c.rgb);
  hsv.y *= 1.0005;
  c.rgb = hsv2rgb(hsv);

  // c -= texture2D(img, sortedUV - random(sortedUV/2.0) - offset).rgb;
  // c += texture2D(img, sortedUV + random(sortedUV/1.0) / offset).rgb;

  c -= texture2D(img, uv + random(sortedUV/1.0) - offset).rgb;
  c += texture2D(img, uv + random(sortedUV/1.0) + offset).rgb;

  //c = clamp(c, 0.05, 0.9);



  vec3 prevColor = texture2D(img, uv).rgb;

    vec3 frameDifference = c - prevColor;
    vec2 motionVector = frameDifference.rg * 0.1; // Adjust scaling as needed
    vec2 moshUV = uv + motionVector;
    moshUV = mod(moshUV, 1.0);
    vec3 moshColor = texture2D(img, moshUV).rgb;

    float feedbackAmount = 0.0; 
    c = mix(c, moshColor, feedbackAmount);



    // c = clamp(c, 0.05, 0.9);

    
float aberrationAmount = 0.000002; // Adjust for intensity
vec2 aberrationOffset = vec2(aberrationAmount, 0.0);


float r = texture2D(img, uv - offset + vec2(aberrationOffset.x, 0.0)).r;
float g = texture2D(img, uv - offset).g;
float b = texture2D(img, uv - offset - vec2(aberrationOffset.x, 0.0)).b;

vec3 chro = vec3(r, g, b);



// c = mix(c, chro, 0.1);
// c.rgb = ((c.rgb - vec3(0.5)) * 1.005 + vec3(0.5));


  gl_FragColor = vec4(c, 1.0);
  }