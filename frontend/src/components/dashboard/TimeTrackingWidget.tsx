import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, MoreVertical } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

interface TrackedTask {
  id: string;
  title: string;
  seconds: number;
}

export const TimeTrackingWidget: React.FC = () => {
  const [tasks, setTasks] = useState<TrackedTask[]>([
    { id: '1', title: 'Tactile swatch approval', seconds: 5130 }, // 1h 25m 30s
    { id: '2', title: 'CMYK proof verification', seconds: 1818 }, // 30m 18s
    { id: '3', title: 'Catalog layout design', seconds: 6502 }, // 1h 48m 22s
    { id: '4', title: 'Press machine maintenance', seconds: 1021 }, // 17m 1s
  ]);

  const [activeTaskId, setActiveTaskId] = useState<string | null>('1');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Live timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && activeTaskId) {
      interval = setInterval(() => {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeTaskId ? { ...t, seconds: t.seconds + 1 } : t))
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, activeTaskId]);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const inactiveTasks = tasks.filter((t) => t.id !== activeTaskId);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSelectTask = (id: string) => {
    setActiveTaskId(id);
    setIsPlaying(true);
  };

  return (
    <div className="bg-white border border-[#E5E5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#222321]">My tracking</h3>
        <span className="text-xs text-[#73756F]">Active session</span>
      </div>

      {/* Active Running Task Banner matching Ref 4 (Yellow Accent Highlight) */}
      {activeTask && (
        <div className="p-3.5 rounded-xl bg-[#E8EB39] text-[#222321] flex items-center justify-between shadow-2xs mb-3 border border-[#d3d629]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock size={16} className="shrink-0" />
            <span className="text-xs font-semibold truncate">{activeTask.title}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold tabular-nums">
              {formatDuration(activeTask.seconds)}
            </span>
            <button
              onClick={togglePlayPause}
              className="w-6 h-6 rounded-full bg-[#222321] text-white flex items-center justify-center hover:bg-black transition-colors"
              aria-label={isPlaying ? 'Pause timer' : 'Start timer'}
            >
              {isPlaying ? <Pause size={10} className="fill-current" /> : <Play size={10} className="fill-current ml-0.5" />}
            </button>
            <button className="text-[#222321]/70 hover:text-[#222321]">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Secondary Tracked Tasks List matching Ref 4 */}
      <div className="space-y-1 divide-y divide-[#E5E5E1]/60">
        {inactiveTasks.map((t) => (
          <div
            key={t.id}
            className="pt-2 flex items-center justify-between text-xs py-1.5 hover:bg-[#F5F5F1] px-2 rounded-lg transition-colors group cursor-pointer"
            onClick={() => handleSelectTask(t.id)}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock size={14} className="text-[#73756F] shrink-0" />
              <span className="text-[#222321] truncate font-medium">{t.title}</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[11px] text-[#73756F] tabular-nums">
                {formatDuration(t.seconds)}
              </span>
              <button
                type="button"
                className="w-5 h-5 rounded-full bg-[#F5F5F1] group-hover:bg-[#E8EB39] text-[#222321] flex items-center justify-center transition-colors"
                title="Track this task"
              >
                <Play size={9} className="ml-0.5 fill-current" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
