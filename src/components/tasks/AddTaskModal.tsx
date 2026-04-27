import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Priority, EnergyLevel, LocationType, BucketTag, Recurrence } from '../../types';
import { X } from 'lucide-react';

interface Props { onClose: () => void; }

const BUCKETS: BucketTag[] = ['Work', 'Life', 'Health', 'Social', 'Admin', 'Finance', 'Other'];

export default function AddTaskModal({ onClose }: Props) {
  const addTask = useStore((s) => s.addTask);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 2 as Priority,
    energyRequired: 2 as EnergyLevel,
    location: 'home' as LocationType,
    deadline: '',
    userEstimatedTime: 15,
    waitingOn: '',
    bucketTag: 'Life' as BucketTag,
    recurrence: 'once' as Recurrence,
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    addTask({
      ...form,
      deadline: form.deadline || undefined,
      waitingOn: form.waitingOn || undefined,
      isScaffolded: false,
      completed: false,
      completedViaFocus: false,
    });
    onClose();
  };

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 flex items-end z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-t-2xl p-5 flex flex-col gap-4 fade-in overflow-y-auto scrollbar-hide"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90dvh' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">New Task</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="What needs to get done?" value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" placeholder="Any notes on the 'how'..." value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set('priority', parseInt(e.target.value) as Priority)}>
              <option value={1}>1 — Low</option>
              <option value={2}>2 — Medium</option>
              <option value={3}>3 — High</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Energy Cost</label>
            <select className="input" value={form.energyRequired} onChange={(e) => set('energyRequired', parseInt(e.target.value) as EnergyLevel)}>
              <option value={1}>1 — Easy</option>
              <option value={2}>2 — Moderate</option>
              <option value={3}>3 — Draining</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="label">Est. Time (min)</label>
            <input className="input" type="number" min={1} value={form.userEstimatedTime} onChange={(e) => set('userEstimatedTime', parseInt(e.target.value) || 1)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Location</label>
            <select className="input" value={form.location} onChange={(e) => set('location', e.target.value as LocationType)}>
              <option value="home">🏠 Home</option>
              <option value="away">🚗 Away</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Deadline (optional)</label>
          <input className="input" type="datetime-local" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="label">Bucket</label>
            <select className="input" value={form.bucketTag} onChange={(e) => set('bucketTag', e.target.value as BucketTag)}>
              {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Recurrence</label>
            <select className="input" value={form.recurrence} onChange={(e) => set('recurrence', e.target.value as Recurrence)}>
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="once-3-days">Every 3 Days</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Waiting On (optional)</label>
          <input className="input" placeholder="Person or entity blocking this..." value={form.waitingOn} onChange={(e) => set('waitingOn', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={!form.title.trim()}>
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
