
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
    
    const simulation = d3.forceSimulation<Thought>(activeThoughts)
      .force("charge", d3.forceManyBody().strength((d) => d.visualState === 'smoke' ? -100 : -150))
      .force("center", d3.forceCenter(width / 2, height / 2 - 60))
      .force("collision", d3.forceCollide().radius((d) => (d.r || 45) + 15).iterations(1))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2 - 60).strength(0.08));

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
          const voidYThreshold = height - 260; 
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
      .attr("r", (d) => d.r || 45)
      .attr("fill", (d) => d.visualState === 'smoke' ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.15)")
      .attr("stroke", (d) => d.visualState === 'smoke' ? "rgba(99, 102, 241, 0.6)" : "rgba(255, 255, 255, 0.45)")
      .attr("stroke-width", 2)
      .style("backdrop-filter", "blur(16px)");

    node.append("foreignObject")
      .attr("width", (d) => (d.r || 45) * 2)
      .attr("height", (d) => (d.r || 45) * 2)
      .attr("x", (d) => -(d.r || 45))
      .attr("y", (d) => -(d.r || 45))
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
            padding: 12px;
            box-sizing: border-box;
          ">
            <span style="
              color: white !important;
              font-size: 16px;
              font-weight: 900;
              line-height: 1.3;
              letter-spacing: -0.01em;
              word-break: break-word;
              text-shadow: 0 2px 10px rgba(0,0,0,0.9);
              display: -webkit-box;
              -webkit-line-clamp: 4;
              -webkit-box-orient: vertical;
              overflow: hidden;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-1000">
           <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center mb-10 opacity-30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
           </div>
           <p className="text-slate-400 text-base md:text-2xl font-black uppercase tracking-[0.5em] opacity-50 leading-loose">
            {lang === 'zh' ? '在此处注入你的思绪' : 'INFUSE YOUR THOUGHTS'}
           </p>
        </div>
      )}

      <svg ref={svgRef} width={width} height={height} className="w-full h-full relative z-10" />
    </div>
  );
};

export default Nebula;
