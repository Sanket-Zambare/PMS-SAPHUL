import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useAuth } from "../context/AuthContext";
import { tasksAPI, projectMembersAPI, meetingsAPI, usersAPI, projectsAPI } from "../services/api";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../utils/permissions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function pad(n) { return String(n).padStart(2, "0"); }
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function CalendarPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Day-click modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Meeting create/view modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [viewMeeting, setViewMeeting] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    title: "", description: "", scheduled_at: "", duration_minutes: 60,
    meet_link: "", is_urgent: false, project_id: "", attendee_ids: [],
  });
  const [meetingLoading, setMeetingLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { fetchAll(); }, [year, month]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Tasks
      let tasksData = [];
      if (hasPermission(PERMISSIONS.PROJECT_VIEW_ALL)) {
        const res = await tasksAPI.getAll({});
        tasksData = res.data || [];
      } else {
        const membRes = await projectMembersAPI.getByUser(user.id);
        const ids = membRes.data.map((m) => m.project_id);
        if (ids.length > 0) {
          const res = await tasksAPI.getAll({ project_ids: ids.join(",") });
          tasksData = res.data || [];
        }
      }
      setTasks(tasksData.filter((t) => t.due_date));

      // Meetings for current month
      const mRes = await meetingsAPI.getAll({ year, month: month + 1 });
      setMeetings(mRes.data || []);

      // Users & projects for meeting form
      const [uRes, pRes] = await Promise.all([
        usersAPI.getAll(),
        projectsAPI.getAll(),
      ]);
      setUsers(uRes.data || []);
      setProjects(pRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const buildCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const days = [];
    for (let i = startDow - 1; i >= 0; i--)
      days.push({ date: new Date(year, month, -i), currentMonth: false });
    for (let d = 1; d <= lastDay.getDate(); d++)
      days.push({ date: new Date(year, month, d), currentMonth: true });
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++)
      days.push({ date: new Date(year, month + 1, d), currentMonth: false });
    return days;
  };

  const getTasksForDate = (date) => {
    const s = toDateStr(date);
    return tasks.filter((t) => t.due_date?.slice(0, 10) === s);
  };

  const getMeetingsForDate = (date) => {
    const s = toDateStr(date);
    return meetings.filter((m) => m.scheduled_at?.slice(0, 10) === s);
  };

  const taskChipStyle = (status) => {
    if (status === "DONE") return { background: "#d1fae5", color: "#059669" };
    if (status === "IN_PROGRESS") return { background: "#fef3c7", color: "#d97706" };
    if (status === "BLOCKED") return { background: "#fee2e2", color: "#dc2626" };
    return { background: "#f3f4f6", color: "#6b7280" };
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Day click ──────────────────────────────────────────────────────────────
  const handleDayClick = (day) => {
    setSelectedDay(day.date);
    setShowDayModal(true);
  };

  const openNewMeeting = () => {
    setShowDayModal(false);
    setViewMeeting(null);
    const defaultTime = selectedDay
      ? `${toDateStr(selectedDay)}T10:00`
      : "";
    setMeetingForm({
      title: "", description: "", scheduled_at: defaultTime,
      duration_minutes: 60, meet_link: "", is_urgent: false,
      project_id: "", attendee_ids: [user.id],
    });
    setShowMeetingModal(true);
  };

  const openMeetingDetail = (m) => {
    setViewMeeting(m);
    setShowMeetingModal(true);
    setShowDayModal(false);
  };

  // ── Meeting CRUD ───────────────────────────────────────────────────────────
  const handleMeetingSubmit = async () => {
    if (!meetingForm.title.trim() || !meetingForm.scheduled_at) return;
    setMeetingLoading(true);
    try {
      await meetingsAPI.create({
        ...meetingForm,
        project_id: meetingForm.project_id ? parseInt(meetingForm.project_id) : null,
        duration_minutes: parseInt(meetingForm.duration_minutes) || 60,
      });
      setShowMeetingModal(false);
      fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm("Delete this meeting?")) return;
    try {
      await meetingsAPI.delete(id);
      setShowMeetingModal(false);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const toggleAttendee = (uid) => {
    setMeetingForm((f) => {
      const ids = f.attendee_ids.includes(uid)
        ? f.attendee_ids.filter((id) => id !== uid)
        : [...f.attendee_ids, uid];
      return { ...f, attendee_ids: ids };
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <Container fluid className="page-shell">
      <div className="loading-state">Loading calendar...</div>
    </Container>
  );

  const calendarDays = buildCalendarDays();

  return (
    <Container fluid className="page-shell">
      <div className="page-header">
        <div>
          <p className="page-kicker">Planning</p>
          <h1 className="page-title">Calendar</h1>
          <p className="page-description">Tasks by due date · Click any day to schedule a meeting</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setSelectedDay(new Date()); openNewMeeting(); }}
            style={{
              padding: "8px 18px", border: "1px solid #2563eb", borderRadius: 8,
              background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13,
            }}
          >
            + Schedule Meeting
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: "8px 18px", border: "1px solid #E8640A", borderRadius: 8,
              background: "#fff", color: "#E8640A", fontWeight: 700, cursor: "pointer", fontSize: 13,
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>&#8592;</button>
        <span className="cal-nav-label">{MONTHS[month]} {year}</span>
        <button className="cal-nav-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>&#8594;</button>
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {DAYS.map((d) => <div key={d} className="calendar-day-header">{d}</div>)}
        {calendarDays.map((day, i) => {
          const dayTasks = getTasksForDate(day.date);
          const dayMeetings = getMeetingsForDate(day.date);
          const isToday = day.date.getTime() === today.getTime();
          const total = dayTasks.length + dayMeetings.length;
          const chips = [...dayMeetings.map((m) => ({ type: "meeting", data: m })),
                         ...dayTasks.map((t) => ({ type: "task", data: t }))];
          return (
            <div
              key={i}
              className={`calendar-cell${!day.currentMonth ? " cal-other-month" : ""}${isToday ? " cal-today" : ""}`}
              onClick={() => day.currentMonth && handleDayClick(day)}
              style={{ cursor: day.currentMonth ? "pointer" : "default" }}
            >
              <div className={`cal-date-num${isToday ? " cal-today-num" : ""}`}>
                {day.date.getDate()}
              </div>
              <div className="cal-tasks">
                {chips.slice(0, 3).map((chip, ci) =>
                  chip.type === "meeting" ? (
                    <div
                      key={`m-${chip.data.id}`}
                      className="cal-task-chip"
                      style={{
                        background: chip.data.is_urgent ? "#fee2e2" : "#dbeafe",
                        color: chip.data.is_urgent ? "#dc2626" : "#1d4ed8",
                        fontWeight: 700,
                      }}
                      onClick={(e) => { e.stopPropagation(); openMeetingDetail(chip.data); }}
                      title={chip.data.title}
                    >
                      📅 {chip.data.title}
                    </div>
                  ) : (
                    <div
                      key={`t-${chip.data.id}`}
                      className="cal-task-chip"
                      style={taskChipStyle(chip.data.status)}
                      onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${chip.data.id}`); }}
                      title={chip.data.title}
                    >
                      {chip.data.title}
                    </div>
                  )
                )}
                {total > 3 && <div className="cal-task-more">+{total - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {[
          { label: "Meeting", bg: "#dbeafe", color: "#1d4ed8" },
          { label: "Urgent Meeting", bg: "#fee2e2", color: "#dc2626" },
          { label: "Todo", bg: "#f3f4f6", color: "#6b7280" },
          { label: "In Progress", bg: "#fef3c7", color: "#d97706" },
          { label: "Done", bg: "#d1fae5", color: "#059669" },
          { label: "Blocked", bg: "#fee2e2", color: "#dc2626" },
        ].map((l) => (
          <span key={l.label} className="cal-legend-item">
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: l.bg, border: `1px solid ${l.color}`, marginRight: 4 }} />
            <span style={{ color: l.color, fontSize: 12, fontWeight: 600 }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* ── Day-click modal ── */}
      <Modal show={showDayModal} onHide={() => setShowDayModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            {selectedDay ? `${MONTHS[selectedDay.getMonth()]} ${selectedDay.getDate()}, ${selectedDay.getFullYear()}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDay && (() => {
            const dm = getMeetingsForDate(selectedDay);
            const dt = getTasksForDate(selectedDay);
            return (
              <>
                {dm.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#555", marginBottom: 6 }}>MEETINGS</div>
                    {dm.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => openMeetingDetail(m)}
                        style={{
                          padding: "6px 10px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                          background: m.is_urgent ? "#fee2e2" : "#dbeafe",
                          color: m.is_urgent ? "#dc2626" : "#1d4ed8", fontWeight: 600, fontSize: 13,
                        }}
                      >
                        📅 {m.title} — {new Date(m.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    ))}
                  </div>
                )}
                {dt.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#555", marginBottom: 6 }}>TASKS DUE</div>
                    {dt.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => { setShowDayModal(false); navigate(`/tasks/${t.id}`); }}
                        style={{
                          padding: "6px 10px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                          ...taskChipStyle(t.status), fontWeight: 600, fontSize: 13,
                        }}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                )}
                {dm.length === 0 && dt.length === 0 && (
                  <p style={{ color: "#888", fontSize: 13 }}>Nothing scheduled on this day.</p>
                )}
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={openNewMeeting}>
            + Schedule Meeting
          </Button>
          <Button variant="secondary" onClick={() => setShowDayModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Meeting modal (create or view) ── */}
      <Modal show={showMeetingModal} onHide={() => { setShowMeetingModal(false); setViewMeeting(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{viewMeeting ? viewMeeting.title : "Schedule Meeting"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewMeeting ? (
            /* ── View mode ── */
            <div>
              {viewMeeting.is_urgent && (
                <div style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 800, borderRadius: 6, padding: "6px 12px", marginBottom: 12, fontSize: 13 }}>
                  URGENT MEETING
                </div>
              )}
              {viewMeeting.description && (
                <p style={{ fontSize: 14, color: "#555", marginBottom: 12 }}>{viewMeeting.description}</p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14, marginBottom: 16 }}>
                <div>
                  <span style={{ fontWeight: 700, color: "#888", fontSize: 12 }}>DATE & TIME</span>
                  <div>{new Date(viewMeeting.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: "#888", fontSize: 12 }}>DURATION</span>
                  <div>{viewMeeting.duration_minutes} minutes</div>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: "#888", fontSize: 12 }}>ORGANISER</span>
                  <div>{viewMeeting.created_by_name}</div>
                </div>
                {viewMeeting.meet_link && (
                  <div>
                    <span style={{ fontWeight: 700, color: "#888", fontSize: 12 }}>MEET LINK</span>
                    <div>
                      <a href={viewMeeting.meet_link} target="_blank" rel="noreferrer"
                        style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                        Join Meeting →
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {viewMeeting.attendees?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#888", marginBottom: 6 }}>ATTENDEES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {viewMeeting.attendees.map((a) => (
                      <span key={a.user_id} style={{
                        background: "#f3f4f6", borderRadius: 20, padding: "3px 12px",
                        fontSize: 13, fontWeight: 600,
                      }}>
                        {a.user_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {viewMeeting.created_by === user?.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMeeting(viewMeeting.id)}>
                    Delete Meeting
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* ── Create mode ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Title *</Form.Label>
                <Form.Control
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Sprint Review"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Description</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Agenda or notes..."
                />
              </Form.Group>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Date & Time *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={meetingForm.scheduled_at}
                    onChange={(e) => setMeetingForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number" min={15} step={15}
                    value={meetingForm.duration_minutes}
                    onChange={(e) => setMeetingForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                  />
                </Form.Group>
              </div>

              <Form.Group>
                <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Google Meet / Zoom Link</Form.Label>
                <Form.Control
                  value={meetingForm.meet_link}
                  onChange={(e) => setMeetingForm((f) => ({ ...f, meet_link: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                />
              </Form.Group>

              <Form.Group>
                <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Project (optional)</Form.Label>
                <Form.Select
                  value={meetingForm.project_id}
                  onChange={(e) => setMeetingForm((f) => ({ ...f, project_id: e.target.value }))}
                >
                  <option value="">— No project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label style={{ fontWeight: 700, fontSize: 13 }}>Attendees</Form.Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 130, overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 10px" }}>
                  {users.map((u) => (
                    <label key={u.id} style={{
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                      padding: "3px 10px", borderRadius: 20, fontSize: 13,
                      background: meetingForm.attendee_ids.includes(u.id) ? "#E8640A" : "#f3f4f6",
                      color: meetingForm.attendee_ids.includes(u.id) ? "#fff" : "#333",
                      fontWeight: 600,
                    }}>
                      <input
                        type="checkbox"
                        checked={meetingForm.attendee_ids.includes(u.id)}
                        onChange={() => toggleAttendee(u.id)}
                        style={{ display: "none" }}
                      />
                      {u.name}
                    </label>
                  ))}
                </div>
              </Form.Group>

              <Form.Check
                type="switch"
                label={<span style={{ fontWeight: 700, color: meetingForm.is_urgent ? "#dc2626" : undefined }}>Mark as URGENT (notifies all attendees immediately)</span>}
                checked={meetingForm.is_urgent}
                onChange={(e) => setMeetingForm((f) => ({ ...f, is_urgent: e.target.checked }))}
              />
            </div>
          )}
        </Modal.Body>
        {!viewMeeting && (
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMeetingModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleMeetingSubmit}
              disabled={meetingLoading || !meetingForm.title.trim() || !meetingForm.scheduled_at}
            >
              {meetingLoading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  );
}

export default CalendarPage;
