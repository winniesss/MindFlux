
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

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const activeThoughts = thoughts.filter(t => t.status === ThoughtStatus.UNSORTED);
    
    // Calculate adaptive radius based on screen width
    const baseRadius = Math.min(width / 8, 60);
    const responsiveRadius = (d: Thought) => (d.r ? (d.r / 45) * baseRadius : baseRadius);

    const simulation = d3.forceSimulation<Thought>(activeThoughts)
      .force("charge", d3.forceManyBody().strength((d) => d.visualState === 'smoke' ? -100 : -150))
      .force("center", d3.forceCenter(width / 2, height / 2 - 40))
      .force("collision", d3.forceCollide().radius((d) => responsiveRadius(d) + 10).iterations(2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2 - 40).strength(0.1));

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
          // Responsive release threshold: bottom 15% of screen
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
      .attr("fill", (d) => d.visualState === 'smoke' ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.15)")
      .attr("stroke", (d) => d.visualState === 'smoke' ? "rgba(99, 102, 241, 0.6)" : "rgba(255, 255, 255, 0.45)")
      .attr("stroke-width", 2)
      .style("backdrop-filter", "blur(16px)");

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
            padding: ${width < 640 ? '10px' : '14px'};
            box-sizing: border-box;
          ">
            <span style="
              color: white !important;
              font-size: ${width < 640 ? '10px' : '13px'};
              font-weight: 800;
              line-height: 1.1;
              letter-spacing: -0.025em;
              word-break: break-word;
              text-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: -webkit-box;
              -webkit-line-clamp: 4;
              -webkit-box-orient: vertical;
              overflow: hidden;
              font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              opacity: 0.95;
            ">
              ${d.content}
            </span>
          </div>
        </div>
      `);

    simulation.on("tick", () => {
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [thoughts, width, height, onThoughtClick, onThoughtRelease]);

  const showEmptyHint = thoughts.filter(t => t.status === ThoughtStatus.UNSORTED).length === 0;

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,1)_0%,rgba(15,23,42,1)_100%)] opacity-80" />
      
      {showEmptyHint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
           <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-white/5 flex items-center justify-center mb-8 sm:mb-10 opacity-30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 animate-ping rounded-full"></div>
           </div>
           <p className="text-slate-400 text-base sm:text-lg md:text-xl font-medium opacity-50 leading-relaxed max-w-sm px-4">
            {t('emptyChaosInvite', lang)}
           </p>
        </div>
      )}

      <svg ref={svgRef} width={width} height={height} className="w-full h-full relative z-10" />
      
      {/* Visual Indicator for Release Zone */}
      {dragY !== null && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-rose-500/10 to-transparent pointer-events-none transition-opacity duration-300 flex items-center justify-center"
          style={{ opacity: dragY > height * 0.7 ? 1 : 0 }}
        >
          <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">{t('released', lang)}</p>
        </div>
      )}
    </div>
  );
};

export default Nebula;
