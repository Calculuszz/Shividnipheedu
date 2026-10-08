'use client';

import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import BackButton from '@/components/BackButton';
import EventName from '@/components/EventName';
import FieldError from '@/components/FieldError';
import FloatingGhost from '@/components/FloatingGhost';
import Doodle from '@/components/Doodle';
import Sponsors from '@/components/Sponsors';
import { formatTime } from '@/lib/bookingTime';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

type Registration = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  qr_code: string;
  attended: boolean;
  attended_at: string | null;
};

type TabType = 'attendance' | 'scanner';

// Admin data goes through server routes (httpOnly session cookie); the browser
// never queries the registrations table directly.
async function adminFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, credentials: 'same-origin' });
  if (response.status === 401) {
    // Session expired: back to the password screen
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

const POLL_MS = 5000;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('attendance');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFieldError('ยังไม่ได้ใส่รหัสผ่านเลยนะ');
      return;
    }

    try {
      // Server-side password verification for security
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Escape Room / Haunted House passwords lead to their own pages
        if (data.role !== 'registration') {
          window.location.replace(data.home);
          return;
        }
        setIsAuthenticated(true);
        setError('');
      } else if (response.status === 429) {
        setError('ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่นะ');
      } else {
        setError('รหัสผิด ประตูห้องผียังไม่ยอมเปิด');
      }
    } catch (err) {
      console.error(err);
      setError('สัญญาณหลอนหาย ลองใหม่อีกทีนะ');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-halloween-dark px-4 py-8">
        <div className="max-w-md mx-auto">
          <BackButton />
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-halloween-orange mb-2">
              Admin Access
            </h1>
            <p className="display-font"><EventName /></p>
          </div>

          <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-8">
            <form onSubmit={handleLogin} noValidate className="space-y-6" suppressHydrationWarning>
              <div>
                <label className="block text-halloween-cream font-bold mb-2 font-iannnnn-owl">
                  รหัสผ่าน
                </label>
                <input
                  key="admin-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldError('');
                  }}
                  className={`w-full bg-halloween-dark border-2 rounded px-4 py-3 text-halloween-cream focus:border-halloween-orange focus:outline-none font-iannnnn-owl ${
                    fieldError ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  placeholder="กรอกรหัสผ่าน"
                  required
                  aria-invalid={!!fieldError}
                  suppressHydrationWarning
                />
                {fieldError && <FieldError message={fieldError} />}
              </div>

              {error && (
                <div className="bg-halloween-error/15 border border-halloween-error rounded p-3 text-halloween-error text-center font-iannnnn-owl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold text-xl py-4 rounded-lg transition-colors font-iannnnn-owl"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-halloween-dark">
      {/* Tabs and Logout Button */}
      <div className="bg-halloween-charcoal border-b border-halloween-purple">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { id: 'attendance' as TabType, label: 'Attendance Table' },
                { id: 'scanner' as TabType, label: 'QR Scanner' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'text-halloween-orange border-b-4 border-halloween-orange'
                      : 'text-halloween-gray hover:text-halloween-bone'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {});
                setIsAuthenticated(false);
              }}
              className="bg-halloween-red hover:bg-halloween-orange text-halloween-dark px-4 py-2 rounded transition-colors font-iannnnn-owl"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'attendance' && <AttendanceTable />}
        {activeTab === 'scanner' && <QRScanner onExit={() => setActiveTab('attendance')} />}
      </div>
    </div>
  );
}

// Attendance Table Component
function AttendanceTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const itemsPerPage = 50;
  // Manual ticks still being saved, and when the last one finished. A poll that
  // started before a tick was saved still carries the old value, so it must not
  // overwrite the tick (that made the box flip back until the next poll).
  const savingTicks = useRef(0);
  const lastTickSavedAt = useRef(0);

  useEffect(() => {
    fetchRegistrations();

    // Keep the table fresh while it's open (other scanners check people in)
    const timer = setInterval(fetchRegistrations, POLL_MS);
    return () => clearInterval(timer);
  }, [currentPage, searchQuery]);

  const fetchRegistrations = async () => {
    const startedAt = Date.now();
    try {
      const params = new URLSearchParams({
        mode: 'page',
        page: String(currentPage),
        pageSize: String(itemsPerPage),
        search: searchQuery.trim(),
      });
      const data = await adminFetch(`/api/admin/registrations?${params}`);
      // Stale: a tick was saved (or is saving) after this request left. The next poll is fresh.
      if (savingTicks.current > 0 || startedAt <= lastTickSavedAt.current) return;
      setTotalCount(data.total);
      setCheckedInCount(data.checkedIn);

      // Reset to page 1 if search changes and current page is out of bounds
      const maxPage = Math.ceil(data.total / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(1);
        return;
      }

      setRegistrations(data.rows);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (id: string, currentStatus: boolean) => {
    // Optimistic update - update UI immediately
    setRegistrations((prev) =>
      prev.map((reg) =>
        reg.id === id
          ? {
              ...reg,
              attended: !currentStatus,
              attended_at: !currentStatus ? new Date().toISOString() : null,
            }
          : reg
      )
    );

    // Update checked-in count optimistically
    setCheckedInCount((prev) => (!currentStatus ? prev + 1 : prev - 1));

    savingTicks.current += 1;
    try {
      const error = await adminFetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, attended: !currentStatus }),
      }).then(() => null, (e) => e);
      savingTicks.current -= 1;
      lastTickSavedAt.current = Date.now();

      if (error) {
        // Revert optimistic updates on error
        setRegistrations((prev) =>
          prev.map((reg) =>
            reg.id === id
              ? {
                  ...reg,
                  attended: currentStatus,
                  attended_at: currentStatus ? reg.attended_at : null,
                }
              : reg
          )
        );
        setCheckedInCount((prev) => (currentStatus ? prev + 1 : prev - 1));
        throw error;
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    setExportError('');

    try {
      const { rows: allRows } = (await adminFetch('/api/admin/registrations?mode=all')) as {
        rows: Record<string, unknown>[];
      };

      const formatDate = (value: unknown) =>
        value
          ? new Date(String(value)).toLocaleString('th-TH', {
              timeZone: 'Asia/Bangkok',
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : '';

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('รายชื่อผู้ลงทะเบียน', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = [
        { header: 'ลำดับ', key: 'no', width: 8 },
        { header: 'รหัสนิสิต', key: 'student_id', width: 14 },
        { header: 'ชื่อ-นามสกุล', key: 'full_name', width: 28 },
        { header: 'อีเมล', key: 'email', width: 30 },
        { header: 'คณะ', key: 'department', width: 28 },
        { header: 'เพศ', key: 'gender', width: 14 },
        { header: 'ชั้นปี', key: 'year', width: 10 },
        { header: 'ช่องทางรับรู้งาน', key: 'referral_source', width: 22 },
        { header: 'กิจกรรมที่สนใจ', key: 'interested_activities', width: 36 },
        { header: 'การเดินทาง', key: 'transportation', width: 20 },
        { header: 'ผลเกมผี', key: 'ghost_result', width: 18 },
        { header: 'เช็คอินแล้ว', key: 'attended', width: 12 },
        { header: 'เวลาเช็คอิน', key: 'attended_at', width: 22 },
        { header: 'เวลาลงทะเบียน', key: 'created_at', width: 22 },
      ];

      allRows.forEach((row, index) => {
        sheet.addRow({
          ...row,
          no: index + 1,
          student_id: String(row.student_id ?? ''),
          attended: row.attended ? 'ใช่' : 'ไม่',
          attended_at: formatDate(row.attended_at),
          created_at: formatDate(row.created_at),
        });
      });

      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: 'FFF5EEE6' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A3167' } };
      header.alignment = { vertical: 'middle' };
      sheet.autoFilter = { from: 'A1', to: 'N1' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SHIVIDNI-PHEEDU-registrations-${today}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting registrations:', error);
      setExportError('ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExporting(false);
    }
  };

  const toggleColumn = (column: string) => {
    setHiddenColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  const columns = [
    { id: 'attended', label: 'เข้าร่วม' },
    { id: 'student_id', label: 'รหัสนิสิต' },
    { id: 'full_name', label: 'ชื่อ-นามสกุล' },
    { id: 'department', label: 'คณะ' },
    { id: 'attended_at', label: 'เวลาเช็คอิน' },
  ];

  if (loading) {
    return (
      <div className="py-12 text-center">
        <FloatingGhost className="w-16" />
        <p className="mt-4 text-halloween-cream font-iannnnn-owl">กำลังเปิดสมุดรายชื่อผี...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total People */}
        <div className="bg-halloween-charcoal border-2 border-halloween-purple rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-halloween-gray text-sm font-bold mb-1 font-iannnnn-owl">จำนวนผู้ลงทะเบียน</p>
              <p className="text-halloween-cream text-4xl font-black">{totalCount}</p>
            </div>
            <div className="bg-halloween-purple/20 p-4 rounded-lg">
              <svg className="w-8 h-8 text-halloween-purple" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Check-ins */}
        <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-halloween-gray text-sm font-bold mb-1 font-iannnnn-owl">จำนวนผู้เช็คอิน</p>
              <p className="text-halloween-orange text-4xl font-black">{checkedInCount}</p>
            </div>
            <div className="bg-halloween-orange/20 p-4 rounded-lg">
              <svg className="w-8 h-8 text-halloween-orange" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {/* Search Input */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              key="search-student-id"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              placeholder="ค้นหารหัสนิสิต..."
              className="w-full bg-halloween-dark border-2 border-halloween-purple rounded px-4 py-2 text-halloween-cream focus:border-halloween-orange focus:outline-none font-iannnnn-owl"
              suppressHydrationWarning
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="bg-halloween-gray hover:bg-halloween-red text-halloween-dark px-4 py-2 rounded transition-colors font-bold font-iannnnn-owl"
            >
              ล้างการค้นหา
            </button>
          )}
          <button
            type="button"
            onClick={exportToExcel}
            disabled={exporting || totalCount === 0}
            className="ml-auto flex items-center gap-2 bg-halloween-moon hover:bg-halloween-orange text-halloween-dark px-4 py-2 rounded font-bold font-iannnnn-owl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {exporting ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลด Excel'}
          </button>
        </div>
        {exportError && <FieldError message={exportError} />}
      </div>

      <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-halloween-dark">
              <tr>
                {columns.map(
                  (col) =>
                    !hiddenColumns.has(col.id) && (
                      <th
                        key={col.id}
                        className="px-4 py-3 text-left text-halloween-orange font-bold font-iannnnn-owl"
                      >
                        {col.label}
                      </th>
                    )
                )}
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <Doodle name="tombstone" className="mx-auto w-20 -rotate-6 opacity-80" />
                    <p className="mt-3 text-halloween-cream font-iannnnn-owl">
                      {searchQuery ? 'ไม่เจอรหัสนี้ในสมุดรายชื่อผี ลองพิมพ์ใหม่ดูนะ' : 'ยังไม่มีใครลงทะเบียนเลย เงียบเหมือนป่าช้า'}
                    </p>
                  </td>
                </tr>
              )}
              {registrations.map((reg, index) => (
                <tr
                  key={reg.id}
                  className={`border-t border-halloween-purple ${
                    index % 2 === 0 ? 'bg-halloween-charcoal' : 'bg-halloween-dark'
                  }`}
                >
                  {!hiddenColumns.has('attended') && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={reg.attended}
                        onChange={() => {
                          // Ticking in is instant; taking a check-in away needs a second look
                          if (reg.attended && !window.confirm(`ยกเลิกการเช็คอินของ ${reg.full_name} ใช่ไหม?`)) return;
                          toggleAttendance(reg.id, reg.attended);
                        }}
                        className="w-5 h-5 cursor-pointer"
                        aria-label={`Mark ${reg.full_name} as attended`}
                      />
                    </td>
                  )}
                  {!hiddenColumns.has('student_id') && (
                    <td className="px-4 py-3 text-halloween-cream">{reg.student_id}</td>
                  )}
                  {!hiddenColumns.has('full_name') && (
                    <td className="px-4 py-3 text-halloween-cream">{reg.full_name}</td>
                  )}
                  {!hiddenColumns.has('department') && (
                    <td className="px-4 py-3 text-halloween-cream">{reg.department}</td>
                  )}
                  {!hiddenColumns.has('attended_at') && (
                    <td className="px-4 py-3 text-halloween-cream">
                      {reg.attended_at
                        ? `${formatTime(reg.attended_at)} น.`
                        : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-halloween-orange text-halloween-dark font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-halloween-red transition-colors font-iannnnn-owl"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-halloween-cream px-4 font-iannnnn-owl">
            หน้า {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-halloween-orange text-halloween-dark font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-halloween-red transition-colors font-iannnnn-owl"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}

// QR Scanner Component
type ScanResult = { success: boolean; message: string; name?: string; detail?: string };

// Escape Room booking codes look like SVP-7K3QX9; entry tickets are SHIVIDNIPHEEDU-<id>-<time>
const BOOKING_QR = /^SVP-[A-Z0-9]{6}$/i;
// The same QR held in front of the camera is ignored for this long after its result
const SAME_QR_COOLDOWN_MS = 5000;

/** Beep + vibrate so staff don't have to look at the screen for every scan */
function scanFeedback(audio: AudioContext | null, ok: boolean) {
  navigator.vibrate?.(ok ? 80 : [120, 80, 120]);
  if (!audio) return;
  const tones = ok ? [{ hz: 1046, at: 0, len: 0.12 }] : [{ hz: 330, at: 0, len: 0.14 }, { hz: 330, at: 0.2, len: 0.14 }];
  for (const { hz, at, len } of tones) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = hz;
    osc.type = ok ? 'sine' : 'square';
    const start = audio.currentTime + at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + len);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + len + 0.02);
  }
}

function QRScanner({ onExit }: { onExit: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mirrors mediaStream so cleanup on unmount can stop the camera (state would be stale there)
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  // The scan loop runs in a setInterval, which only ever sees the first render's
  // state, so "busy" and "last code" live in refs.
  const busyRef = useRef(false);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  // Browsers only allow sound after a tap, so this is created on "เปิดกล้อง"
  const audioRef = useRef<AudioContext | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recentAttendees, setRecentAttendees] = useState<Registration[]>([]);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobileDevice(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);

  // Subscribe to real-time attendance updates
  useEffect(() => {
    // Recent check-ins from every scanner, refreshed while the scanner is open
    const fetchRecentAttendees = async () => {
      try {
        const data = await adminFetch('/api/admin/registrations?mode=recent');
        setRecentAttendees(data.rows);
      } catch (error) {
        console.error('Error fetching recent attendees:', error);
      }
    };

    fetchRecentAttendees();
    const timer = setInterval(fetchRecentAttendees, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // Request camera permission and start scanning
  const startCamera = async () => {
    setCameraError(null);
    try {
      audioRef.current ??= new AudioContext();
      void audioRef.current.resume();
    } catch {
      // No Web Audio: vibration only
    }

    // Stop any existing stream
    if (streamRef.current) {
      stopCamera();
    }

    // Check if page is served over HTTPS (required for getUserMedia on iOS)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';

    if (!isSecureContext && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setCameraError('iOS Safari ต้องใช้ HTTPS เพื่อเข้าถึงกล้อง กรุณาเปิดผ่าน https://');
      console.error('getUserMedia requires HTTPS on iOS Safari. Current URL:', window.location.href);
      return;
    }

    // Check if mediaDevices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(`กล้องไม่รองรับในเบราว์เซอร์นี้ ${!isSecureContext ? '(ต้องใช้ HTTPS)' : ''}`);
      console.error('getUserMedia not supported. isSecureContext:', isSecureContext);
      return;
    }

    // Define Constraints
    const mobileConstraints: MediaStreamConstraints = {
      video: { facingMode: { exact: "environment" } }, // Back camera for mobile
      audio: false
    };

    const desktopConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    // Simple check to see if we're likely on a desktop/notebook
    let constraints: MediaStreamConstraints = mobileConstraints;
    if (!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      console.log("Desktop/Notebook detected, using standard camera.");
      constraints = desktopConstraints;
    } else {
      console.log("Mobile device detected, attempting back camera.");
    }

    console.log('Requesting camera access...');

    try {
      // Try to get the stream with primary constraints
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Successfully got stream with primary constraints.");
      streamRef.current = stream;
          setMediaStream(stream);
      setScanning(true);

    } catch (err: any) {
      // Handle Failure (e.g., no back camera on mobile)
      console.warn(`Failed to get primary camera (${err?.name}): ${err?.message}`);

      if (constraints === mobileConstraints) {
        console.log("Back camera unavailable, trying front camera...");
        try {
          const stream = await navigator.mediaDevices.getUserMedia(desktopConstraints);
          console.log("Successfully got stream with fallback constraints.");
          streamRef.current = stream;
          setMediaStream(stream);
          setScanning(true);
        } catch (fallbackErr: any) {
          handleCameraError(fallbackErr);
          return;
        }
      } else {
        handleCameraError(err);
        return;
      }
    }
  };

  // Handle camera errors
  const handleCameraError = (err: any) => {
    let errorMessage = 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage = 'กรุณาอนุญาตการเข้าถึงกล้องจากเบราว์เซอร์';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage = 'ไม่พบกล้อง';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage = 'กล้องถูกใช้งานโดยแอปพลิเคชันอื่น';
    } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      errorMessage = 'ไม่พบกล้องที่ตรงกับความต้องการ';
    }

    console.error(`getUserMedia Error: ${err.name}`, err);
    setCameraError(errorMessage);
  };

  // Stop camera and cleanup
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMediaStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  // Closing the camera on mobile also leaves the full-screen scanner and returns to the dashboard
  const closeScanner = () => {
    stopCamera();
    onExit();
  };

  // Scan QR code from video feed
  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && !busyRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            const last = lastCodeRef.current;
            // Still the same QR in front of the camera: don't report it again
            if (last && last.code === code.data && Date.now() - last.at < SAME_QR_COOLDOWN_MS) return;
            processQRCode(code.data);
          }
        }
      }
    }, 500); // Scan every 500ms
  };

  // Hide the result and scan again. The cooldown for this QR starts now.
  const finishScan = () => {
    setResult(null);
    setProcessing(false);
    busyRef.current = false;
    if (lastCodeRef.current) lastCodeRef.current.at = Date.now();
  };

  const showScanResult = (next: ScanResult) => {
    setResult(next);
    scanFeedback(audioRef.current, next.success);
    // Desktop clears itself; mobile shows a popup the staff taps (warnings also clear themselves)
    if (!isMobileDevice || !next.success) setTimeout(finishScan, 3000);
  };

  const processQRCode = async (decodedText: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setProcessing(true);
    lastCodeRef.current = { code: decodedText, at: Date.now() };

    // An Escape Room booking QR is not an entry ticket; no need to ask the server
    if (BOOKING_QR.test(decodedText.trim())) {
      showScanResult({
        success: false,
        message: 'นี่คือ QR การจอง Escape Room',
        detail: 'ไม่ใช่บัตรเข้างาน ให้เปิด QR จากอีเมลลงทะเบียน',
      });
      return;
    }

    try {
      const scan = await adminFetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr: decodedText }),
      });
      const data = scan.row as Registration | undefined;

      if (scan.status === 'not_found' || !data) {
        showScanResult({ success: false, message: 'QR นี้ไม่ใช่บัตรเข้างาน', detail: 'ไม่พบในรายชื่อผู้ลงทะเบียน' });
        return;
      }

      if (scan.status === 'already') {
        showScanResult({
          success: false,
          message: `${data.full_name} เช็คอินแล้ว`,
          detail: data.attended_at ? `เมื่อ ${formatTime(data.attended_at)} น.` : undefined,
        });
        return;
      }

      // Server already marked the check-in (only if it wasn't checked in yet)
      const updatedAttendee: Registration = data;

      // Optimistically update the list - add to top immediately
      setRecentAttendees((prev) => {
        return [updatedAttendee, ...prev.filter(a => a.id !== updatedAttendee.id)].slice(0, 20);
      });

      showScanResult({ success: true, message: 'เช็คอินสำเร็จ!', name: data.full_name });
    } catch (error) {
      console.error('Error processing QR code:', error);
      // Let the same QR be tried again straight away
      lastCodeRef.current = null;
      showScanResult({ success: false, message: 'เกิดข้อผิดพลาด', detail: 'ลองสแกนใหม่อีกครั้ง' });
    }
  };

  // Effect to handle setting the video source when the stream changes
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.muted = true;
      videoRef.current.play().then(() => {
        console.log('Video playing successfully');
        // Start QR scanning after video is ready
        setTimeout(() => {
          startQRScanning();
        }, 500);
      }).catch((err) => {
        console.error('Video play error:', err);
        setCameraError('ไม่สามารถเริ่มวิดีโอได้');
      });
    }
  }, [mediaStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // MOBILE LAYOUT
  if (isMobileDevice) {
    return (
      <div className="fixed inset-0 bg-halloween-dark">
        {!scanning && !mediaStream ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-2xl font-bold text-halloween-orange mb-6 text-center font-iannnnn-owl">
              สแกน QR Code เพื่อเช็คอิน
            </h2>
            <button
              type="button"
              onClick={startCamera}
              className="w-full max-w-sm bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold text-xl py-4 rounded-lg transition-colors font-iannnnn-owl"
            >
              เปิดกล้อง
            </button>
            {cameraError && (
              <div className="mt-4 p-4 bg-halloween-error/15 border border-halloween-error rounded-lg text-halloween-error text-center max-w-sm font-iannnnn-owl">
                {cameraError}
              </div>
            )}
            <button
              type="button"
              onClick={closeScanner}
              className="mt-4 w-full max-w-sm border-2 border-halloween-purple text-halloween-cream hover:border-halloween-orange font-bold py-3 rounded-lg transition-colors font-iannnnn-owl"
            >
              กลับหน้า Dashboard
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            {scanning && !result && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-halloween-orange rounded-lg"></div>
              </div>
            )}

            {/* Close button: stop camera and go back to the dashboard */}
            <button
              type="button"
              onClick={closeScanner}
              className="absolute top-4 right-4 bg-halloween-red hover:bg-halloween-orange text-halloween-dark px-4 py-2 rounded-lg font-bold shadow-lg font-iannnnn-owl"
            >
              ปิดกล้อง
            </button>
          </div>
        )}

        {/* Mobile Success/Error popup with confirmation */}
        {result && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div
              className={`w-full max-w-sm p-8 rounded-lg text-center shadow-2xl border-4 ${
                result.success
                  ? 'bg-green-600 text-white border-green-400'
                  : 'bg-halloween-error text-halloween-dark border-halloween-orange'
              }`}
            >
              <div className="text-3xl font-bold mb-2 font-iannnnn-owl">{result.message}</div>
              {result.name && (
                <div className="text-xl mb-2 font-iannnnn-owl">{result.name}</div>
              )}
              {result.detail && <div className="text-lg font-iannnnn-owl">{result.detail}</div>}
              <button
                type="button"
                onClick={finishScan}
                className="mt-6 w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-lg transition-colors font-iannnnn-owl"
              >
                ตกลง
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // DESKTOP/TABLET LAYOUT
  return (
    <div className="w-full pb-24">
      <div className="flex gap-4 h-[calc(100vh-280px)] w-full">
      {/* Camera Section - 2/3 width */}
      <div className="w-2/3">
        <h2 className="text-2xl font-bold text-halloween-orange mb-4 font-iannnnn-owl">
          สแกน QR Code เพื่อเช็คอิน
        </h2>

        {!scanning && !mediaStream ? (
          <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-8 flex flex-col items-center justify-center h-full">
            <button
              type="button"
              onClick={startCamera}
              className="bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold text-xl py-4 px-8 rounded-lg transition-colors font-iannnnn-owl"
            >
              เปิดกล้อง
            </button>
            {cameraError && (
              <div className="mt-4 p-4 bg-halloween-error/15 border border-halloween-error rounded-lg text-halloween-error text-center max-w-md font-iannnnn-owl">
                {cameraError}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-4 h-full flex flex-col">
            <div className="relative bg-black rounded-lg overflow-hidden flex-1">
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                playsInline
                muted
                autoPlay
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning overlay */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-halloween-orange rounded-lg"></div>
                </div>
              )}

              {!scanning && mediaStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-halloween-orange font-bold text-xl font-iannnnn-owl">
                    กำลังเริ่มกล้อง...
                  </div>
                </div>
              )}

              {processing && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-halloween-orange text-halloween-dark px-6 py-2 rounded-lg font-bold font-iannnnn-owl">
                  กำลังประมวลผล...
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={stopCamera}
              className="mt-4 w-full bg-halloween-gray hover:bg-halloween-blue text-halloween-dark font-bold py-3 rounded-lg transition-colors font-iannnnn-owl"
            >
              ปิดกล้อง
            </button>
          </div>
        )}
      </div>

      {/* Recent Attendees List - 1/3 width */}
      <div className="w-1/3">
        <h2 className="text-2xl font-bold text-halloween-orange mb-4 font-iannnnn-owl">
          ผู้เข้าร่วมล่าสุด ({recentAttendees.length})
        </h2>
        <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {recentAttendees.length === 0 ? (
              <div className="p-8 text-center text-halloween-gray font-iannnnn-owl">
                ยังไม่มีผู้เข้าร่วม
              </div>
            ) : (
              <div className="divide-y divide-halloween-purple">
                {recentAttendees.map((attendee, index) => (
                  <div
                    key={attendee.id}
                    className={`p-4 hover:bg-halloween-dark transition-colors ${
                      index === 0 ? 'bg-halloween-orange/10' : ''
                    }`}
                  >
                    <div className="font-bold text-halloween-cream text-lg">
                      {attendee.full_name}
                    </div>
                    <div className="text-halloween-gray text-sm mt-1">
                      {attendee.student_id}
                    </div>
                    <div className="text-halloween-gray text-xs mt-1">
                      {attendee.attended_at
                        ? `${formatTime(attendee.attended_at)} น.`
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Success notification (centered popup) */}
      {result && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className={`max-w-md w-full mx-4 p-8 rounded-lg text-center shadow-2xl border-4 ${
              result.success
                ? 'bg-green-600 text-white border-green-400'
                : 'bg-halloween-error text-halloween-dark border-halloween-orange'
            }`}
          >
            <div className="text-3xl font-bold mb-2 font-iannnnn-owl">{result.message}</div>
            {result.name && (
              <div className="text-2xl mt-2 font-iannnnn-owl">{result.name}</div>
            )}
            {result.detail && <div className="text-xl mt-2 font-iannnnn-owl">{result.detail}</div>}
          </div>
        </div>
      )}
      </div>

      {/* Fixed Sponsors centered at bottom */}
      <Sponsors />
    </div>
  );
}
