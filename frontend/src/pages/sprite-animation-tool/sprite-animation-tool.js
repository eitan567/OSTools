import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';

const RulerSlider = ({ min, max, step, value, onChange, width, unit, label, showLabel, emphasizeTick }) => {
  const marks = [];
  for (let i = min; i <= max; i += step) {
    marks.push(i);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width, fontFamily: 'Arial, sans-serif' }}>
      <span style={{ fontSize: '14px', color: '#4a5568', marginBottom: '4px' }}>{label}: {value}{unit}</span>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          style={{ width: '100%', marginBottom: '20px' }}
        />
        <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', display: 'flex', marginLeft: '8px', marginRight: '8px' }}>
          {marks.map((mark) => (
            <div 
              key={mark} 
              style={{ 
                position: 'absolute',
                left: `${(mark - min) / (max - min) * 100}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ 
                width: '1px', 
                height: emphasizeTick(mark) ? '12px' : '8px', 
                backgroundColor: emphasizeTick(mark) ? '#4a5568' : '#a0aec0'
              }}></div>
              {(showLabel(mark) || mark === min || mark === max) && 
                <span style={{ whiteSpace: 'nowrap', marginTop: '4px', fontSize: '10px', color: '#4a5568' }}>{mark}{unit}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DraggableFrameCard = ({ frame, index, onDragStart, onDragOver, onDrop }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      style={{
        width: '60px',
        height: '60px',
        border: '2px solid #4299e1',
        borderRadius: '4px',
        margin: '0 4px',
        backgroundImage: `url(${frame.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: 'move',
      }}
    >
      <div style={{ 
        backgroundColor: 'rgba(66, 153, 225, 0.7)', 
        color: 'white', 
        padding: '2px 4px', 
        fontSize: '10px' 
      }}>
        {index + 1}
      </div>
    </div>
  );
};

const SpriteAnimationTool = () => {
  const [images, setImages] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameDuration, setFrameDuration] = useState(100);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageUrls = files.map((file, index) => ({
      url: URL.createObjectURL(file),
      number: index + 1
    }));
    setImages(imageUrls);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (event) => {
    setFrameDuration(parseInt(event.target.value));
  };

  const handleFrameChange = (event) => {
    setCurrentFrame(parseInt(event.target.value));
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text'));
    if (dragIndex === dropIndex) return;

    const newImages = [...images];
    const [removed] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, removed);
    setImages(newImages);
    setCurrentFrame(dropIndex);
  };

  useEffect(() => {
    if (images.length > 0) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const scale = Math.min(size / img.width, size / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (size - scaledWidth) / 2;
        const offsetY = (size - scaledHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      };
      img.src = images[currentFrame].url;
    }
  }, [images, currentFrame]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentFrame((prevFrame) => (prevFrame + 1) % images.length);
        animationRef.current = setTimeout(animate, frameDuration);
      };
      animationRef.current = setTimeout(animate, frameDuration);
    } else {
      clearTimeout(animationRef.current);
    }

    return () => clearTimeout(animationRef.current);
  }, [isPlaying, images.length, frameDuration]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    backgroundColor: '#f7fafc',
    // borderRadius: '8px',
    // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    margin: '20px auto',
    maxWidth: '800px'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#2d3748'
  };

  const canvasContainerStyle = {
    width: '200px',
    height: '200px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 8px 3px inset',
    marginBottom: '16px',
    overflow: 'hidden'
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    marginRight: '16px'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Sprite Animation Tool</h1>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        style={{ marginBottom: '16px' }}
      />
      <div style={canvasContainerStyle}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={togglePlay} style={buttonStyle}>
          {isPlaying ? (
            <PauseCircle style={{ width: '40px', height: '40px', color: '#4299e1' }} />
          ) : (
            <PlayCircle style={{ width: '40px', height: '40px', color: '#4299e1' }} />
          )}
        </button>
      </div>
      <div style={{ 
        display: 'flex', 
        overflowX: 'auto', 
        width: '100%', 
        padding: '10px 0', 
        marginBottom: '16px'
      }}>
        {images.map((frame, index) => (
          <DraggableFrameCard
            key={frame.number}
            frame={frame}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
      <RulerSlider
        min={0}
        max={Math.max(0, images.length - 1)}
        step={1}
        value={currentFrame}
        onChange={handleFrameChange}
        width="100%"
        unit=""
        label="Frame"
        showLabel={(mark) => true}
        emphasizeTick={(mark) => false}
      />
      <div style={{ height: '32px' }}></div>
      <RulerSlider
        min={0}
        max={1000}
        step={10}
        value={frameDuration}
        onChange={handleSpeedChange}
        width="100%"
        unit="ms"
        label="Frame Duration"
        showLabel={(mark) => mark % 200 === 0 || mark === 0 || mark === 1000}
        emphasizeTick={(mark) => mark % 200 === 0 || mark === 0 || mark === 1000}
      />
    </div>
  );
};

export default SpriteAnimationTool;