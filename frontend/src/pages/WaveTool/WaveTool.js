import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import './WaveTool.css';


const WaveTool = () => {
  const [waveSettings, setWaveSettings] = useState({
    layer: 5,
    peak: 5,
    speed: 0.1,
    duration: 10,
    width: 1920,
    height: 911,
    slope: 0.13,
    scale: 0.1,
    offset: 0.25,
    startColor: '#ff00ff',
    endColor: '#00ffff',
    background: '#ffffff',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWaveSettings({
      ...waveSettings,
      [name]: value,
    });
  };

  const downloadSVG = () => {
    const svg = document.getElementById('wave-svg').outerHTML;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, 'wave.svg');
  };

  const downloadPNG = () => {
    const svg = document.getElementById('wave-svg');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const DOMURL = window.URL || window.webkitURL || window;

    const img = new Image();
    const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = DOMURL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = waveSettings.width;
      canvas.height = waveSettings.height;
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        saveAs(blob, 'wave.png');
      });
    };

    img.src = url;
  };

  return (
    <div className="wave-tool">
      <div className="controls">
        <label>Layer:</label>
        <input
          type="range"
          min="1"
          max="10"
          name="layer"
          value={waveSettings.layer}
          onChange={handleChange}
        />
        <label>Peak:</label>
        <input
          type="range"
          min="1"
          max="10"
          name="peak"
          value={waveSettings.peak}
          onChange={handleChange}
        />
        <label>Speed:</label>
        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          name="speed"
          value={waveSettings.speed}
          onChange={handleChange}
        />
        <label>Duration:</label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          name="duration"
          value={waveSettings.duration}
          onChange={handleChange}
        />
        <label>Width:</label>
        <input
          type="number"
          name="width"
          value={waveSettings.width}
          onChange={handleChange}
        />
        <label>Height:</label>
        <input
          type="number"
          name="height"
          value={waveSettings.height}
          onChange={handleChange}
        />
        <label>Slope:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          name="slope"
          value={waveSettings.slope}
          onChange={handleChange}
        />
        <label>Scale:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          name="scale"
          value={waveSettings.scale}
          onChange={handleChange}
        />
        <label>Offset:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          name="offset"
          value={waveSettings.offset}
          onChange={handleChange}
        />
        <label>Start Color:</label>
        <input
          type="color"
          name="startColor"
          value={waveSettings.startColor}
          onChange={handleChange}
        />
        <label>End Color:</label>
        <input
          type="color"
          name="endColor"
          value={waveSettings.endColor}
          onChange={handleChange}
        />
        <label>Background:</label>
        <input
          type="color"
          name="background"
          value={waveSettings.background}
          onChange={handleChange}
        />
        <button onClick={downloadSVG}>Download SVG</button>
        <button onClick={downloadPNG}>Download PNG</button>
      </div>
      <svg
        id="wave-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${waveSettings.width} ${waveSettings.height}`}
        preserveAspectRatio="xMidYMid"
        height={`${waveSettings.height}px`}
        width={`${waveSettings.width}px`}
        style={{
          background: waveSettings.background,
          shapeRendering: 'auto',
          height: '100%',
          width: '100%',
        }}
      >
        <defs>
          <linearGradient y2="0" y1="0" x2="1" x1="0" id="lg-nq4q5u6dq7r">
            <stop offset="0" stopColor={waveSettings.startColor}></stop>
            <stop offset="1" stopColor={waveSettings.endColor}></stop>
          </linearGradient>
        </defs>
        <g>
          <path
            opacity="0.4"
            fill="url(#lg-nq4q5u6dq7r)"
            d={`M 0 0 L 0 526.812 Q 192 ${
              540.954 - waveSettings.peak
            } 384 ${540.954 - waveSettings.peak} T 768 402.047 T 1152 437.688 T 1536 404.443 T 1920 216.993 L 1920 0 Z`}
          >
            <animate
              attributeName="d"
              dur={`${waveSettings.duration}s`}
              repeatCount="indefinite"
              values={`
                M 0 0 L 0 526.812 Q 192 ${
                  526.812 - waveSettings.peak
                } 384 ${526.812 - waveSettings.peak} T 768 402.047 T 1152 437.688 T 1536 404.443 T 1920 216.993 L 1920 0 Z;
                M 0 0 L 0 526.812 Q 192 ${
                  526.812 - waveSettings.peak
                } 384 ${526.812 - waveSettings.peak} T 768 352.047 T 1152 487.688 T 1536 454.443 T 1920 316.993 L 1920 0 Z;
                M 0 0 L 0 526.812 Q 192 ${
                  526.812 - waveSettings.peak
                } 384 ${526.812 - waveSettings.peak} T 768 502.047 T 1152 387.688 T 1536 304.443 T 1920 116.993 L 1920 0 Z;
                M 0 0 L 0 526.812 Q 192 ${
                  526.812 - waveSettings.peak
                } 384 ${526.812 - waveSettings.peak} T 768 402.047 T 1152 437.688 T 1536 404.443 T 1920 216.993 L 1920 0 Z`}
            />
          </path>
          {/* Repeat the above path with different animation durations and paths to create multiple waves */}
        </g>
      </svg>
    </div>
  );
};

export default WaveTool;
