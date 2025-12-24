
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeResume = async (resumeContent: string | { data: string; mimeType: string }): Promise<ResumeAnalysis> => {
  const modelName = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are an expert HR recruiter and professional resume reviewer.
    Analyze the provided resume and extract structured information.
    Provide an overall score (0-100) and specific breakdown scores.
    Identify improvements and upskilling opportunities based on modern industry standards.
    Ensure the output is valid JSON according to the specified schema.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      personalInfo: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          linkedin: { type: Type.STRING },
        },
        required: ["name"]
      },
      score: {
        type: Type.OBJECT,
        properties: {
          overall: { type: Type.NUMBER },
          formatting: { type: Type.NUMBER },
          impact: { type: Type.NUMBER },
          keywords: { type: Type.NUMBER },
          relevance: { type: Type.NUMBER },
        },
        required: ["overall", "formatting", "impact", "keywords", "relevance"]
      },
      summary: { type: Type.STRING },
      sections: {
        type: Type.OBJECT,
        properties: {
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                duration: { type: Type.STRING },
                description: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            }
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                institution: { type: Type.STRING },
                degree: { type: Type.STRING },
                year: { type: Type.STRING },
              },
            }
          },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      },
      improvements: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          }
        }
      },
      upskilling: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["personalInfo", "score", "summary", "sections", "improvements", "upskilling"]
  };

  const contents = typeof resumeContent === 'string' 
    ? { parts: [{ text: `Analyze this resume text: ${resumeContent}` }] }
    : { parts: [{ inlineData: resumeContent }, { text: "Analyze this resume image." }] };

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const result = JSON.parse(response.text || '{}');
  return {
    ...result,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
};
