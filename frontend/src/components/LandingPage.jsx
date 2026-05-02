import React, { useEffect, useState } from 'react';
import './LandingPage.css';

export default function LandingPage({ onEnter }) {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    // Generate random nodes for the background
    const generateNodes = () => {
      const newNodes = [];
      for (let i = 0; i < 20; i++) {
        newNodes.push({
          id: i,
          left: `${Math.random() * 100}%`,
          animationDuration: `${10 + Math.random() * 20}s`,
          animationDelay: `${-Math.random() * 20}s`,
          opacity: 0.1 + Math.random() * 0.5,
        });
      }
      setNodes(newNodes);
    };

    generateNodes();
  }, []);

  return (
    <div className="landing-container">
      {/* Background elements */}
      <div className="landing-bg"></div>
      
      <div className="nodes-background">
        {nodes.map(node => (
          <div 
            key={node.id} 
            className="node" 
            style={{
              left: node.left,
              animationDuration: node.animationDuration,
              animationDelay: node.animationDelay,
              opacity: node.opacity
            }}
          />
        ))}
        
        {/* We can also draw some static SVG lines to look like the image's molecular network */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0.15, pointerEvents: 'none' }}>
          <line x1="10%" y1="20%" x2="25%" y2="40%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="25%" y1="40%" x2="15%" y2="60%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="25%" y1="40%" x2="45%" y2="35%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="45%" y1="35%" x2="60%" y2="20%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="45%" y1="35%" x2="55%" y2="55%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="55%" y1="55%" x2="70%" y2="70%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="70%" y1="70%" x2="85%" y2="50%" stroke="var(--accent-teal)" strokeWidth="1" />
          <line x1="85%" y1="50%" x2="90%" y2="30%" stroke="var(--accent-teal)" strokeWidth="1" />
          
          {/* Node points at intersections */}
          <circle cx="10%" cy="20%" r="3" fill="var(--accent-teal)" />
          <circle cx="25%" cy="40%" r="4" fill="var(--accent-teal)" />
          <circle cx="15%" cy="60%" r="3" fill="var(--accent-teal)" />
          <circle cx="45%" cy="35%" r="4" fill="var(--accent-teal)" />
          <circle cx="60%" cy="20%" r="3" fill="var(--accent-teal)" />
          <circle cx="55%" cy="55%" r="4" fill="var(--accent-teal)" />
          <circle cx="70%" cy="70%" r="3" fill="var(--accent-teal)" />
          <circle cx="85%" cy="50%" r="4" fill="var(--accent-teal)" />
          <circle cx="90%" cy="30%" r="3" fill="var(--accent-teal)" />
        </svg>
      </div>

      <div className="landing-content">
        <div className="landing-icon-container">
          <span className="landing-icon">⚛</span>
        </div>
        
        <h1 className="landing-title">MolGAN Generator</h1>
        
        <p className="landing-subtitle">
          Enter the next generation of molecular synthesis. Explore, create, and analyze novel chemical structures in real-time.
        </p>
        
        <button className="landing-button" onClick={onEnter}>
          Initialize Synthesis <span className="landing-button-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
