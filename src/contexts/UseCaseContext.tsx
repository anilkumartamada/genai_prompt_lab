
import { createContext, useContext, useState, ReactNode } from 'react';

interface UseCaseContextType {
  generatedUseCases: string[];
  setGeneratedUseCases: (useCases: string[]) => void;
  // Use Case Generator form data
  department: string;
  setDepartment: (department: string) => void;
  dailyTasks: string;
  setDailyTasks: (dailyTasks: string) => void;
  // Prompt Evaluator form data
  selectedUseCase: string;
  setSelectedUseCase: (useCase: string) => void;
  customUseCase: string;
  setCustomUseCase: (customUseCase: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
}

const UseCaseContext = createContext<UseCaseContextType | undefined>(undefined);

export const useUseCaseContext = () => {
  const context = useContext(UseCaseContext);
  if (!context) {
    throw new Error('useUseCaseContext must be used within a UseCaseProvider');
  }
  return context;
};

export const UseCaseProvider = ({ children }: { children: ReactNode }) => {
  const [generatedUseCases, setGeneratedUseCases] = useState<string[]>([]);
  
  // Use Case Generator form data
  const [department, setDepartment] = useState("");
  const [dailyTasks, setDailyTasks] = useState("");
  
  // Prompt Evaluator form data
  const [selectedUseCase, setSelectedUseCase] = useState("");
  const [customUseCase, setCustomUseCase] = useState("");
  const [prompt, setPrompt] = useState("");

  return (
    <UseCaseContext.Provider value={{ 
      generatedUseCases, 
      setGeneratedUseCases,
      department,
      setDepartment,
      dailyTasks,
      setDailyTasks,
      selectedUseCase,
      setSelectedUseCase,
      customUseCase,
      setCustomUseCase,
      prompt,
      setPrompt
    }}>
      {children}
    </UseCaseContext.Provider>
  );
};
