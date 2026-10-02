precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;

uniform float uTime;
uniform float uStrength;
uniform float uNoiseScale;
uniform float uAngleMult;
uniform float uSeed;

varying vec2 vTexCoord;

float hash31(vec3 p) {
  p = fract(
    p * vec3(
      0.1031,
      0.1030,
      0.0973
    )
  );

  p += dot(
    p,
    p.yzx + 33.33
  );

  return fract(
    (p.x + p.y) * p.z
  );
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  float n000 =
    hash31(i + vec3(0.0, 0.0, 0.0));

  float n100 =
    hash31(i + vec3(1.0, 0.0, 0.0));

  float n010 =
    hash31(i + vec3(0.0, 1.0, 0.0));

  float n110 =
    hash31(i + vec3(1.0, 1.0, 0.0));

  float n001 =
    hash31(i + vec3(0.0, 0.0, 1.0));

  float n101 =
    hash31(i + vec3(1.0, 0.0, 1.0));

  float n011 =
    hash31(i + vec3(0.0, 1.0, 1.0));

  float n111 =
    hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 =
    mix(n000, n100, f.x);

  float nx10 =
    mix(n010, n110, f.x);

  float nx01 =
    mix(n001, n101, f.x);

  float nx11 =
    mix(n011, n111, f.x);

  float nxy0 =
    mix(nx00, nx10, f.y);

  float nxy1 =
    mix(nx01, nx11, f.y);

  return mix(
    nxy0,
    nxy1,
    f.z
  );
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  vec2 coord =
    uv * uResolution;

  vec2 seedOffset = vec2(
    uSeed * 0.00137,
    uSeed * 0.00211
  );

  // Fixed flow field.
  // Time no longer changes the noise itself.
  float n = noise3D(
    vec3(
      coord * uNoiseScale +
      seedOffset,
      17.0
    )
  );

  float angle =
    n *
    6.28318530718 *
    uAngleMult;

  vec2 direction =
    vec2(
      cos(angle),
      sin(angle)
    );

  // Continuous forward travel.
  float travel =
    uTime *
    uStrength;

  vec2 displacementPixels =
    direction * travel;

  vec2 displacementUV =
    vec2(
      displacementPixels.x /
        uResolution.x,

      displacementPixels.y /
        uResolution.y
    );

  // Wrap instead of clamp so motion
  // can continue indefinitely.
  vec2 sampleUV =
    fract(
      uv + displacementUV
    );

  gl_FragColor =
    texture2D(
      uTexture,
      sampleUV
    );
}