
import React from 'react';
import {
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface ScoreChartProps {
  scores: {
    formatting: number;
    impact: number;
    keywords: number;
    relevance: number;
  };
}

export const ScoreChart: React.FC<ScoreChartProps> = ({ scores }) => {
  const data = [
    { subject: 'Formatting', A: scores.formatting, fullMark: 100 },
    { subject: 'Impact', A: scores.impact, fullMark: 100 },
    { subject: 'Keywords', A: scores.keywords, fullMark: 100 },
    { subject: 'Relevance', A: scores.relevance, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Scores"
            dataKey="A"
            stroke="#4F46E5"
            fill="#4F46E5"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
