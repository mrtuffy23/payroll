import { GoogleGenAI } from "@google/genai";
import { Employee, SalarySlip } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generatePerformanceReview = async (employee: Employee, slip: SalarySlip): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable (Missing API Key)";

  try {
    const prompt = `
      Create a short, professional textual summary for a salary slip (in Indonesian).
      Employee: ${employee.name} (${employee.position})
      Stats:
      - Attendance: ${slip.totalAttendanceDays} days
      - Overtime: ${slip.totalOvertimeHours} hours
      - Performance Score: ${slip.performanceScore}/100
      - Bonus Received: ${slip.performanceBonus > 0 ? 'Yes' : 'No'}
      - Deductions (Absent): ${slip.deductions}
      
      Tone: Professional and Encouraging (or Warning if score is low).
      Max 2 sentences.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Terima kasih atas kontribusi Anda.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analisis performa tidak tersedia saat ini.";
  }
};