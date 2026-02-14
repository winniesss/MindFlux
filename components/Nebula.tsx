
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
    const anxietyLevel = Math.min(activeThoughts.length / 10, 1);
    
    const simulation = d3.forceSimulation<Thought>(activeThoughts)
      .force("charge", d3.forceManyBody().strength((d) => 
        d.visualState === 'smoke' ? -30 : -50 - (anxietyLevel * 50)
      ))
      .force("center", d3.forceCenter(width / 2, height / 2 - 20))
      .force("collision", d3.forceCollide().radius((d) => (d.r || 40) + 5))
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2 - 20).strength(0.06));

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
          
          const voidY = height - 100;
          if (event.y > voidY - 100) {
            d3.select(event.sourceEvent.target.parentNode)
              .select(".node-bg")
              .attr("stroke", "rgba(244, 63, 94, 0.8)")
              .attr("fill", "rgba(244, 63, 94, 0.2)");
          }
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          
          const voidY = height - 100;
          if (event.y > voidY - 50) {
            d3.select(event.sourceEvent.target.parentNode)
              .transition()
              .duration(600)
              .style("opacity", 0)
              .attr("transform", `translate(${d.x}, ${height + 100}) scale(0)`)
              .on("end", () => onThoughtRelease(d));
          } else {
            d.fx = null;
            d.fy = null;
          }
          setDragY(null);
        })
      );

    // Filter/Shader for Smoke nodes
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "smoke-blur")
      .append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "4");

    node.each(function(d) {
      const g = d3.select(this);
      const isSmoke = d.visualState === 'smoke';
      
      g.append("circle")
        .attr("class", "node-bg backdrop-blur-sm transition-all duration-300 shadow-xl")
        .attr("r", d.r || 40)
        .attr("fill", isSmoke ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.1)")
        .attr("stroke", isSmoke ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.3)")
        .attr("stroke-width", 1.5)
        .style("filter", isSmoke ? "url(#smoke-blur)" : "none");

      if (isSmoke) {
         // Sub-smokes
         g.append("circle")
           .attr("r", (d.r || 40) * 0.8)
           .attr("fill", "rgba(129, 140, 248, 0.1)")
           .attr("cx", 5)
           .attr("cy", -5)
           .style("filter", "url(#smoke-blur)");
      }
    });

    node.append("foreignObject")
      .attr("x", (d) => -(d.r || 40))
      .attr("y", (d) => -(d.r || 40))
      .attr("width", (d) => (d.r || 40) * 2)
      .attr("height", (d) => (d.r || 40) * 2)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("padding", "12px")
      .style("font-size", "11px")
      .style("color", "white")
      .style("overflow", "hidden")
      .style("pointer-events", "none")
      .style("font-weight", "600")
      .html((d) => `<div class="line-clamp-3 leading-tight opacity-90 tracking-tight">${d.content}</div>`);

    simulation.on("tick", () => {
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [thoughts, width, height, onThoughtClick, onThoughtRelease]);

  const voidIntensity = dragY !== null ? Math.min(Math.max(0, (dragY - (height - 300)) / 200), 1) : 0;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div 
        className="absolute inset-0 transition-colors duration-[4000ms] ease-in-out animate-[nebula-pulse_10s_infinite]"
        style={{ 
          background: `radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 1) 100%)`,
        }} 
      />
      
      <div 
        className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-[50%] blur-3xl transition-all duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(244, 63, 94, ${0.1 + voidIntensity * 0.4}) 0%, transparent 70%)`,
          transform: `translateX(-50%) scale(${1 + voidIntensity * 0.5})`,
          opacity: 0.6 + voidIntensity * 0.4
        }}
      />
      
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center pointer-events-none z-20">
         <div className={`transition-all duration-500 flex flex-col items-center gap-2 ${voidIntensity > 0.3 ? 'translate-y-[-20px] scale-110' : ''}`}>
            <div className={`w-12 h-12 rounded-full border-2 border-rose-500/20 flex items-center justify-center transition-all ${voidIntensity > 0.5 ? 'border-rose-500 bg-rose-500/10' : ''}`}>
               <svg className={`w-6 h-6 text-rose-500 transition-all ${voidIntensity > 0.5 ? 'scale-125' : 'opacity-40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all ${voidIntensity > 0.3 ? 'text-rose-400 opacity-100' : 'text-slate-700 opacity-40'}`}>
              {lang === 'zh' ? '释放外部压力' : 'Release External Noise'}
            </span>
         </div>
      </div>

      <svg ref={svgRef} width={width} height={height} className="w-full h-full relative z-10" />
      
      <style>{`
        @keyframes nebula-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Nebula;
