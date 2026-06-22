import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

const COLUMNS = [
  { id: "TODO", label: "To Do", color: "#6b7280", bg: "#f3f4f6" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#d97706", bg: "#fef3c7" },
  { id: "DONE", label: "Done", color: "#059669", bg: "#d1fae5" },
  { id: "BLOCKED", label: "Blocked", color: "#dc2626", bg: "#fee2e2" },
];

function TaskCard({ task, getProjectName, getUserName, isOverlay }) {
  const navigate = useNavigate();
  const isOverdue =
    task.due_date &&
    task.status !== "DONE" &&
    new Date(task.due_date) < new Date();

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <div
      className="kanban-card"
      style={{ opacity: isOverlay ? 0.95 : 1 }}
    >
      <div className="kanban-card-title">{task.title}</div>

      <div className="kanban-card-meta">
        <span className="kanban-card-project">{getProjectName(task.project_id)}</span>
        {task.assigned_to && (
          <span className="kanban-card-assignee">{getUserName(task.assigned_to)}</span>
        )}
      </div>

      {task.due_date && (
        <div
          className="kanban-card-due"
          style={{ color: isOverdue ? "#dc2626" : "#6b7280" }}
        >
          {isOverdue ? "⚠ " : ""}Due {formatDate(task.due_date)}
        </div>
      )}

      <button
        className="kanban-card-view"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/tasks/${task.id}`);
        }}
      >
        View →
      </button>
    </div>
  );
}

function DraggableCard({ task, getProjectName, getUserName }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.35 : 1, cursor: "grab" }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} getProjectName={getProjectName} getUserName={getUserName} />
    </div>
  );
}

function DroppableColumn({ column, tasks, getProjectName, getUserName }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="kanban-column">
      <div
        className="kanban-column-header"
        style={{ borderTop: `3px solid ${column.color}` }}
      >
        <span className="kanban-column-title" style={{ color: column.color }}>
          {column.label}
        </span>
        <span
          className="kanban-column-count"
          style={{ background: column.bg, color: column.color }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="kanban-column-body"
        style={{
          background: isOver ? "#fff6ef" : undefined,
          border: isOver ? "2px dashed #E8640A" : "2px dashed transparent",
          transition: "all 0.15s",
          minHeight: "120px",
        }}
      >
        {tasks.length === 0 && !isOver && (
          <div className="kanban-empty">Drop tasks here</div>
        )}
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            getProjectName={getProjectName}
            getUserName={getUserName}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanBoard({ tasks, getProjectName, getUserName, onStatusChange }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  // Tasks that don't fit any column (e.g. CANCELLED) — skip them in kanban
  const knownStatuses = COLUMNS.map((c) => c.id);

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // over.id can be a column id or a task id
    let newStatus = COLUMNS.find((c) => c.id === over.id)?.id;
    if (!newStatus) {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {COLUMNS.filter((col) => knownStatuses.includes(col.id)).map((col) => (
          <DroppableColumn
            key={col.id}
            column={col}
            tasks={tasksByColumn[col.id]}
            getProjectName={getProjectName}
            getUserName={getUserName}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            getProjectName={getProjectName}
            getUserName={getUserName}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
