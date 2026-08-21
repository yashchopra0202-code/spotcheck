"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { CONCEPTS } from "@/lib/funnel";

export default function PathAConcepts() {
  const { go } = useFunnel();
  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · LEARN</span>
      <h2 className="title" style={{ fontSize: 20 }}>What just happened, explained</h2>
      {CONCEPTS.map((c, i) => (
        <div key={c.title} className="concept">
          <div className="l">Concept {i + 1}</div>
          <b>{c.title}</b>
          <p>{c.body}</p>
        </div>
      ))}
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("test")}>Test what I learned →</button>
    </div>
  );
}
