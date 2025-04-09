// #ifdef GL_ES
// precision mediump float;
// #endif

// uniform sampler2D u_currentFrame;
// uniform sampler2D u_prevFrame;
// uniform vec2 u_resolution;

// varying vec2 vTexCoord;

// void main() {
//     vec4 cNow = texture2D(u_currentFrame, vTexCoord);
//     vec4 cPrev = texture2D(u_prevFrame,   vTexCoord);

//     float diff = distance(cNow.rgb, cPrev.rgb);
    
//     float threshold = 0.15; // tweak for sensitivity
//     float isFlicker = diff > threshold ? 1.0 : 0.0;

//     gl_FragColor = vec4(isFlicker, isFlicker, isFlicker, 1.0);
// }

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_currentFrame;
uniform sampler2D u_prevFrame;
uniform vec2 u_resolution;

varying vec2 vTexCoord;

void main() {
    // cNow, cPrev in [0..1]
    vec4 cNow = texture2D(u_currentFrame, vTexCoord);
    vec4 cPrev = texture2D(u_prevFrame, vTexCoord);

    // The difference is in range [0..1].
    float diff = distance(cNow.rgb, cPrev.rgb);

    // Output the raw difference as grayscale
    gl_FragColor = vec4(diff, diff, diff, 1.0);
}
