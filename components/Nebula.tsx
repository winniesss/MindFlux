import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Thought, ThoughtStatus, Language } from '../types';
import { t } from '../locales';

interface NebulaProps {
  thoughts: Thought[];
  onThoughtClick: (thought: Thought) => void;
  onThoughtRelease: (thought: Thought) => void;
  width: number;
  height: number;
  lang: Language;
}

const Nebula: React.FC<NebulaProps> = ({ thoughts, onThoughtClick, onThoughtRelease, width, height, lang }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragY, setDragY] = useState<number | null>(null);
  const simulationRef = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const activeThoughts = thoughts.filter(t => t.status === ThoughtStatus.UNSORTED);
    
    const baseRadius = Math.min(width / 10, 80);
    const responsiveRadius = (d: Thought) => (d.r ? (d.r / 45) * baseRadius : baseRadius);

    const simulation = d3.forceSimulation<Thought>(activeThoughts)
      .force("charge", d3.forceManyBody().strength((d) => d.visualState === 'smoke' ? -150 : -250))
      .force("center", d3.forceCenter(width / 2, height / 2 - 40))
      .force("collision", d3.forceCollide().radius((d) => responsiveRadius(d) + 20).iterations(3))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2 - 40).strength(0.08));

    simulationRef.current = simulation;

    const node = svg.append("g")
      .selectAll("g")
      .data(activeThoughts)
      .join("g")
      .attr("cursor", "grab")
      .on("click", (event, d) => {
        if (event.defaultPrevented) return;
        onThoughtClick(d);
      })
      .call(d3.drag<SVGGElement, Thought>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          setDragY(event.y);
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          setDragY(event.y);
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          const voidYThreshold = height * 0.85; 
          if (event.y > voidYThreshold) {
            onThoughtRelease(d);
          } else {
            d.fx = null;
            d.fy = null;
          }
          setDragY(null);
        })
      );

    node.append("circle")
      .attr("r", responsiveRadius)
      .attr("fill", (d) => d.visualState === 'smoke' ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.08)")
      .attr("stroke", (d) => d.visualState === 'smoke' ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.2)")
      .attr("stroke-width", 1.5)
      .style("backdrop-filter", "blur(12px)")
      .attr("class", "transition-all duration-300 hover:stroke-white/60 hover:fill-white/10");

    node.append("foreignObject")
      .attr("width", (d) => responsiveRadius(d) * 2)
      .attr("height", (d) => responsiveRadius(d) * 2)
      .attr("x", (d) => -responsiveRadius(d))
      .attr("y", (d) => -responsiveRadius(d))
      .style("pointer-events", "none")
      .html((d) => `
        <div xmlns="http://www.w3.org/1999/xhtml" style="
          width: 100%;
          height: 100%;
          display: table;
          background: transparent;
        ">
          <div style="
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            padding: ${width < 1024 ? '12px' : '16px'};
            box-sizing: border-box;
          ">
            <span style="
              color: rgba(255,255,255,0.9) !important;
              font-size: ${width < 1024 ? '12px' : '13px'};
              font-weight: 800;
              line-height: 1.2;
              letter-spacing: -0.02em;
              word-break: break-word;
              display: -webkit-box;
              -webkit-line-clamp: 4;
              -webkit-box-orient: vertical;
              overflow: hidden;
              font-family: 'Inter', system-ui, sans-serif;
            ">
              ${d.content}
            </span>
          </div>
        </div>
      `);

    simulation.on("tick", () => {
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    const handleMouseMove = (event: MouseEvent) => {
      const [mx, my] = d3.pointer(event);
      simulation.alphaTarget(0.1).restart();
      
      activeThoughts.forEach(d => {
        if (d.fx !== undefined && d.fx !== null) return;
        const dx = (d.x || 0) - mx;
        const dy = (d.y || 0) - my;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const repulsionRange = width < 1024 ? 100 : 250;
        
        if (dist < repulsionRange) {
          const force = (repulsionRange - dist) / repulsionRange;
          d.vx = (d.vx || 0) + (dx / dist) * force * 2;
          d.vy = (d.vy || 0) + (dy / dist) * force * 2;
        }
      });
    };

    if (window.innerWidth >= 1024) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => { 
      simulation.stop(); 
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [thoughts, width, height, onThoughtClick, onThoughtRelease]);

  const showEmptyHint = thoughts.filter(t => t.status === ThoughtStatus.UNSORTED).length === 0;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {showEmptyHint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in duration-1000">
           <div className="w-24 h-24 sm:w-32 md:w-40 lg:w-44 h-24 sm:h-32 md:h-40 lg:h-44 rounded-full border border-white/5 flex items-center justify-center mb-10 sm:mb-12 opacity-30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 animate-ping rounded-full duration-[3000ms]"></div>
              <div className="absolute inset-0 border border-white/10 rounded-full scale-75 animate-pulse"></div>
           </div>
           <p className="text-slate-400/60 text-base sm:text-lg md:text-xl lg:text-2xl font-light leading-relaxed max-w-[280px] sm:max-w-lg tracking-tight px-4 italic">
            {t('emptyChaosInvite', lang)}
           </p>
        </div>
      )}

      <svg ref={svgRef} width={width} height={height} className="w-full h-full relative z-10" />
      
      {dragY !== null && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-rose-500/20 to-transparent pointer-events-none transition-opacity duration-300 flex items-center justify-center border-t border-rose-500/10"
          style={{ opacity: dragY > height * 0.7 ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-1 w-full bg-rose-500 rounded-full animate-bounce"></div>
             <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">{t('released', lang)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nebula;