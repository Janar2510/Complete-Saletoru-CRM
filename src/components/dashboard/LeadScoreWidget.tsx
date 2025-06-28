// src/components/dashboard/LeadScoreWidget.tsx

import React from "react";
import { Card } from "../common/Card";

export const LeadScoreWidget: React.FC = () => {
  const dummyLeads = [
    { name: "TechCorp Inc.", score: 92 },
    { name: "GreenWave Ltd.", score: 85 },
    { name: "NovaAI Systems", score: 78 },
  ];

  return (
    <Card className="p-4 border border-dark-200/50">
      <h3 className="text-lg font-semibold text-white mb-3">Lead Scores</h3>
      <ul className="space-y-2 text-sm text-dark-100">
        {dummyLeads.map((lead, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-dark-300 px-3 py-2 rounded-lg hover:bg-dark-200 transition-all duration-150"
          >
            <span>{lead.name}</span>
            <span className="font-bold text-white">{lead.score}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
