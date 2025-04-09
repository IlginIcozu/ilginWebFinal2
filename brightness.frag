#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_frame;
uniform vec2 u_resolution;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(u_frame, vTexCoord);
    float brightness = (color.r + color.g + color.b) / 3.0; 
    // store in grayscale
    gl_FragColor = vec4(brightness, brightness, brightness, 1.0);
}
