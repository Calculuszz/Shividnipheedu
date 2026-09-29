'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import jsQR from 'jsqr';
import BackButton from '@/components/BackButton';
import EventName from '@/components/EventName';
import FieldError from '@/components/FieldError';
import Sponsors from '@/components/Sponsors';

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('attendance');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFieldError('กรุณากรอกรหัสผ่าน');
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
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาด');
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
              onClick={() => setIsAuthenticated(false)}
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
        {activeTab === 'scanner' && <QRScanner />}
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
  const [playedGameCount, setPlayedGameCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    fetchRegistrations();

    // Optimized: Only update the changed row instead of refetching everything
    const channel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'registrations' },
        (payload) => {
          // Update only the changed record
          setRegistrations((prev) =>
            prev.map((reg) =>
              reg.id === payload.new.id ? (payload.new as Registration) : reg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registrations' },
        () => {
          // Refetch on new registration
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage, searchQuery]);

  const fetchRegistrations = async () => {
    try {
      let query = supabase.from('registrations').select('*', { count: 'exact' });

      // Apply search filter if exists
      if (searchQuery.trim()) {
        query = query.ilike('student_id', `%${searchQuery.trim()}%`);
      }

      // Get total count with filter
      const { count } = await query;
      setTotalCount(count || 0);

      // Get checked-in count
      let checkedInQuery = supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('attended', true);

      if (searchQuery.trim()) {
        checkedInQuery = checkedInQuery.ilike('student_id', `%${searchQuery.trim()}%`);
      }

      const { count: attendedCount } = await checkedInQuery;
      setCheckedInCount(attendedCount || 0);

      // Get played game count (users with ghost_result not null)
      let playedGameQuery = supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .not('ghost_result', 'is', null);

      if (searchQuery.trim()) {
        playedGameQuery = playedGameQuery.ilike('student_id', `%${searchQuery.trim()}%`);
      }

      const { count: playedCount } = await playedGameQuery;
      setPlayedGameCount(playedCount || 0);

      // Reset to page 1 if search changes and current page is out of bounds
      const maxPage = Math.ceil((count || 0) / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(1);
        return;
      }

      // Fetch paginated data
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let dataQuery = supabase.from('registrations').select('*');

      // Apply search filter
      if (searchQuery.trim()) {
        dataQuery = dataQuery.ilike('student_id', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setRegistrations(data || []);
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

    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          attended: !currentStatus,
          attended_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', id);

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
      // Supabase caps each request at 1000 rows, so page through everything
      const pageSize = 1000;
      const allRows: Record<string, unknown>[] = [];
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allRows.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }

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
      link.download = `SHIVIDNI-PHEEDU-2026-registrations-${today}.xlsx`;
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
    { id: 'email', label: 'อีเมล' },
    { id: 'department', label: 'คณะ' },
    { id: 'attended_at', label: 'เวลาเช็คอิน' },
  ];

  if (loading) {
    return <div className="text-halloween-cream text-center font-iannnnn-owl">กำลังโหลด...</div>;
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const checkInPercentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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

        {/* Played Game */}
        <div className="bg-halloween-charcoal border-2 border-halloween-blue rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-halloween-gray text-sm font-bold mb-1 font-iannnnn-owl">จำนวนผู้เล่นเกม</p>
              <p className="text-halloween-blue text-4xl font-black">{playedGameCount}</p>
            </div>
            <div className="bg-halloween-blue/20 p-4 rounded-lg">
              <svg className="w-8 h-8 text-halloween-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21,6H3A1,1,0,0,0,2,7V17a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V7A1,1,0,0,0,21,6ZM11,15H9V13H7V11H9V9h2v2h2v2H11ZM16.5,13A1.5,1.5,0,1,1,18,11.5,1.5,1.5,0,0,1,16.5,13Zm2-3A1.5,1.5,0,1,1,20,8.5,1.5,1.5,0,0,1,18.5,10Z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-halloween-charcoal border-2 border-halloween-purple rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-halloween-cream font-bold font-iannnnn-owl">ความคืบหน้าการเช็คอิน</p>
          <p className="text-halloween-orange text-2xl font-black">{checkInPercentage}%</p>
        </div>
        <div className="w-full bg-halloween-dark rounded-full h-6 overflow-hidden border-2 border-halloween-purple">
          <div
            className="bg-linear-to-r from-halloween-orange to-halloween-red h-full transition-all duration-500 ease-out flex items-center justify-end px-2"
            style={{ width: `${checkInPercentage}%` }}
          >
            {checkInPercentage > 10 && (
              <span className="text-white text-xs font-bold">{checkedInCount}/{totalCount}</span>
            )}
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
                        onChange={() => toggleAttendance(reg.id, reg.attended)}
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
                  {!hiddenColumns.has('email') && (
                    <td className="px-4 py-3 text-halloween-cream">{reg.email}</td>
                  )}
                  {!hiddenColumns.has('department') && (
                    <td className="px-4 py-3 text-halloween-cream">{reg.department}</td>
                  )}
                  {!hiddenColumns.has('attended_at') && (
                    <td className="px-4 py-3 text-halloween-cream">
                      {reg.attended_at
                        ? new Date(reg.attended_at).toLocaleString('th-TH')
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
function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const [processing, setProcessing] = useState(false);
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
    // Fetch initial recent attendees
    const fetchRecentAttendees = async () => {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('attended', true)
        .order('attended_at', { ascending: false })
        .limit(20);

      if (data) setRecentAttendees(data);
    };

    fetchRecentAttendees();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('scanner-attendance')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'registrations', filter: 'attended=eq.true' },
        (payload) => {
          setRecentAttendees((prev) => {
            const newAttendee = payload.new as Registration;
            // Add to top and keep only 20
            return [newAttendee, ...prev.filter(a => a.id !== newAttendee.id)].slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Request camera permission and start scanning
  const startCamera = async () => {
    setCameraError(null);

    // Stop any existing stream
    if (mediaStream) {
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

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  // Scan QR code from video feed
  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && !processing) {
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
            processQRCode(code.data);
          }
        }
      }
    }, 500); // Scan every 500ms
  };

  const processQRCode = async (decodedText: string) => {
    // Prevent processing multiple scans at once
    if (processing) return;

    setProcessing(true);

    try {
      // Optimistic update: Update directly using QR code (indexed column)
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('qr_code', decodedText)
        .single();

      if (error || !data) {
        // QR not found - silently ignore and continue scanning
        setProcessing(false);
        return;
      }

      if (data.attended) {
        setResult({
          success: false,
          message: `${data.full_name} เช็คอินแล้ว`,
        });
        setProcessing(false);
        setTimeout(() => setResult(null), 3000);
        return;
      }

      // Update using QR code directly (faster, uses index)
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          attended: true,
          attended_at: new Date().toISOString(),
        })
        .eq('qr_code', decodedText)
        .eq('attended', false); // Double-check to prevent race conditions

      if (updateError) throw updateError;

      // Immediately update the recent attendees list with full data
      const updatedAttendee: Registration = {
        ...data,
        attended: true,
        attended_at: new Date().toISOString()
      };

      // Optimistically update the list - add to top immediately
      setRecentAttendees((prev) => {
        return [updatedAttendee, ...prev.filter(a => a.id !== updatedAttendee.id)].slice(0, 20);
      });

      setResult({
        success: true,
        message: `เช็คอินสำเร็จ!`,
        name: data.full_name
      });

      // Clear result and allow next scan after 3 seconds (mobile gets confirm button)
      if (!isMobileDevice) {
        setTimeout(() => {
          setResult(null);
          setProcessing(false);
        }, 3000);
      } else {
        // Mobile waits for user action
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setResult({ success: false, message: 'เกิดข้อผิดพลาด' });
      setProcessing(false);
      setTimeout(() => setResult(null), 3000);
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

            {/* Close button */}
            <button
              type="button"
              onClick={stopCamera}
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
                <div className="text-xl mb-6 font-iannnnn-owl">{result.name}</div>
              )}
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setProcessing(false);
                }}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-lg transition-colors font-iannnnn-owl"
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
                        ? new Date(attendee.attended_at).toLocaleTimeString('th-TH')
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
          </div>
        </div>
      )}
      </div>

      {/* Fixed Sponsors centered at bottom */}
      <Sponsors />
    </div>
  );
}
