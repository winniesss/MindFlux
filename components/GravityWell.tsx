import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Thought, ThoughtStatus, Weight } from '../types';

interface GravityWellProps {
  thoughts: Thought[];
  onComplete: (thought: Thought) => void;
  width: number;
  height: number;
}

const GravityWell: React.FC<GravityWellProps> = ({ thoughts, onComplete, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const activeTasks = thoughts.filter(t => t.status === ThoughtStatus.LET_ME);
    
    // Configure visual properties based on weight
    activeTasks.forEach(t => {
      // Size
      if (t.weight === Weight.URGENT) t.r = 30; // Small, dense
      else if (t.weight === Weight.IMPORTANT) t.r = 45; // Large, important
      else t.r = 35; // Casual

      // Initial random position if not set
      if (!t.x) t.x = Math.random() * width;
      if (!t.y) t.y = 0; // Start from top
    });

    // Gravity Logic: Heavier items fall deeper and stronger
    // URGENT: Target Y = height (bottom), Strength high
    // IMPORTANT: Target Y = height * 0.8, Strength medium
    // CASUAL: Target Y = height * 0.5, Strength low (will float on top of others)

    const simulation = d3.forceSimulation<Thought>(activeTasks)
      .force("collide", d3.forceCollide().radius((d) => (d.r || 30) + 5).iterations(3))
      .force("x", d3.forceX(width / 2).strength(0.08)) // Keep centered horizontally
      .force("y", d3.forceY((d) => {
          if (d.weight === Weight.URGENT) return height;
          if (d.weight === Weight.IMPORTANT) return height - 100;
          return height - 200;
      }).strength((d) => {
          if (d.weight === Weight.URGENT) return 0.2;
          if (d.weight === Weight.IMPORTANT) return 0.1;
          return 0.05;
      }))
      .force("box", () => {
        // Custom force to keep inside canvas boundaries
        for (const node of activeTasks) {
          if (!node.r) continue;
          if ((node.y || 0) > height - node.r) {
              node.y = height - node.r;
              if(node.vy && node.vy > 0) node.vy *= -0.5; // Dampen
          }
        }
      });

    const draw = () => {
      context.clearRect(0, 0, width, height);
      
      activeTasks.forEach(node => {
        if (!node.x || !node.y || !node.r) return;
        
        context.beginPath();
        context.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
        
        // Styling based on weight
        if (node.weight === Weight.URGENT) {
          // Dense Iron/Amber
          context.fillStyle = '#b45309'; // Amber 700
          context.strokeStyle = '#f59e0b'; // Amber 500
        } else if (node.weight === Weight.IMPORTANT) {
           // Crystalline Blue
           context.fillStyle = '#1e40af'; // Blue 800
           context.strokeStyle = '#60a5fa'; // Blue 400
        } else {
           // Light Wood/Grey
           context.fillStyle = '#475569'; // Slate 600
           context.strokeStyle = '#94a3b8'; // Slate 400
        }
        
        context.lineWidth = 3;
        context.fill();
        context.stroke();

        // Label
        context.fillStyle = 'white';
        context.font = '10px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const label = node.content.length > 10 ? node.content.substring(0, 10) + '...' : node.content;
        context.fillText(label, node.x, node.y);
      });
    };

    simulation.on('tick', draw);

    // Interaction to break (complete) tasks
    const handleClick = (event: MouseEvent) => {
       const rect = canvas.getBoundingClientRect();
       const x = event.clientX - rect.left;
       const y = event.clientY - rect.top;

       const clicked = activeTasks.find(node => {
         if (!node.x || !node.y || !node.r) return false;
         const dx = x - node.x;
         const dy = y - node.y;
         return Math.sqrt(dx*dx + dy*dy) < node.r;
       });

       if (clicked) {
         onComplete(clicked);
       }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      simulation.stop();
      canvas.removeEventListener('click', handleClick);
    };
  }, [thoughts, width, height, onComplete]);

  return (
    <div className="relative w-full h-full bg-slate-900/50">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="block"
      />
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-slate-400 uppercase tracking-widest">Gravity Field Active</p>
        <p className="text-[10px] text-slate-600">Tap to crush tasks</p>
      </div>
    </div>
  );
};

export default GravityWell;
