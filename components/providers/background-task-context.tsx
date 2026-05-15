"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { BackgroundTaskItem } from "@/lib/types/background-tasks";

// ─── Reducer ─────────────────────────────────────────────────────────────────

type TaskAction =
  | { type: "ADD"; task: BackgroundTaskItem }
  | { type: "UPDATE"; id: string; patch: Partial<BackgroundTaskItem> }
  | { type: "REMOVE"; id: string }

function taskReducer(state: BackgroundTaskItem[], action: TaskAction): BackgroundTaskItem[] {
  switch (action.type) {
    case "ADD":    return [...state, action.task]
    case "UPDATE": return state.map(t => t.id === action.id ? { ...t, ...action.patch } : t)
    case "REMOVE": return state.filter(t => t.id !== action.id)
    default:       return state
  }
}

// ─── Context interface ────────────────────────────────────────────────────────

export interface BackgroundTaskContextValue {
  tasks: BackgroundTaskItem[]
  activeTasks: BackgroundTaskItem[]
  addTask: (task: BackgroundTaskItem) => void
  updateTask: (id: string, patch: Partial<BackgroundTaskItem>) => void
  removeTask: (id: string) => void
  /** Lên lịch tự dismiss sau delayMs, có thể cancel nếu gọi lại cùng taskId */
  scheduleAutoDismiss: (taskId: string, delayMs: number) => void
}

export const BackgroundTaskContext = createContext<BackgroundTaskContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function BackgroundTaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(taskReducer, [])
  const dismissRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const scheduleAutoDismiss = useCallback((taskId: string, delayMs: number) => {
    const existing = dismissRefs.current.get(taskId)
    if (existing) clearTimeout(existing)

    const timeout = setTimeout(() => {
      dispatch({ type: "REMOVE", id: taskId })
      dismissRefs.current.delete(taskId)
    }, delayMs)
    dismissRefs.current.set(taskId, timeout)
  }, [])

  useEffect(() => {
    return () => { dismissRefs.current.forEach(clearTimeout) }
  }, [])

  const activeTasks = useMemo(
    () => tasks.filter(t => t.status !== "completed"),
    [tasks]
  )

  const value = useMemo<BackgroundTaskContextValue>(() => ({
    tasks,
    activeTasks,
    addTask:            (task)       => dispatch({ type: "ADD", task }),
    updateTask:         (id, patch)  => dispatch({ type: "UPDATE", id, patch }),
    removeTask:         (id)         => dispatch({ type: "REMOVE", id }),
    scheduleAutoDismiss,
  }), [tasks, activeTasks, scheduleAutoDismiss])

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  )
}

export function useBackgroundTask(): BackgroundTaskContextValue {
  const ctx = useContext(BackgroundTaskContext)
  if (!ctx) throw new Error("useBackgroundTask must be used within BackgroundTaskProvider")
  return ctx
}
