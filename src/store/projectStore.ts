import { create } from "zustand";

interface StepRecord {
  stepName: string;
  status: string;
  output?: unknown;
  errorCode?: string | null;
  errorMsg?: string | null;
}

interface ProjectRecord {
  id: string;
  name: string | null;
  websiteUrl: string;
  status: string;
  steps: StepRecord[];
}

interface ProjectStore {
  currentProject: ProjectRecord | null;
  setProject: (project: ProjectRecord) => void;
  updateStepStatus: (stepName: string, status: string, output?: object) => void;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setProject: (project) => set({ currentProject: project }),
  updateStepStatus: (stepName, status, output) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          steps: state.currentProject.steps.map((s) =>
            s.stepName === stepName ? { ...s, status, output: output ?? s.output } : s
          ),
        },
      };
    }),
  clearProject: () => set({ currentProject: null }),
}));
