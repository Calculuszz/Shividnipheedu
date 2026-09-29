'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventName from '@/components/EventName';
import Image from 'next/image';

type FormData = {
  studentId: string;
  fullName: string;
  faculty: string;
  gender: string;
  year: string;
  referralSource: string;
  interestedActivities: string[];
  transportation: string;
  email: string;
};

const FACULTIES = [
  'คณะวิศวกรรมศาสตร์',
  'คณะพาณิชยศาสตร์และบัญชี',
  'คณะครุศาสตร์',
  'คณะนิติศาสตร์',
  'คณะนิเทศศาสตร์',
  'คณะจิตวิทยา',
  'คณะทันตแพทย์ศาสตร์',
  'คณะพยาบาลศาสตร์',
  'คณะแพทย์ศาสตร์',
  'คณะเภสัชศาสตร์',
  'คณะรัฐศาสตร์',
  'คณะวิทยาศาสตร์',
  'คณะวิทยาศาสตร์การกีฬา',
  'คณะศิลปกรรมศาสตร์',
  'คณะเศรษฐศาสตร์',
  'คณะสถาปัตยกรรมศาสตร์',
  'คณะสหเวชศาสตร์',
  'คณะสัตวแพทยศาสตร์',
  'คณะอักษรศาสตร์',
  'School of Integrated Innovation (SCII)',
  'School of Agriculture Resources (SAR)',
  'อื่นๆ'
];

const GENDERS = ['ชาย', 'หญิง', 'ไม่ต้องการระบุ'];

const YEARS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'มหาบัณฑิต (ป.โท)', 'ดุษฎีบัณฑิต (ป.เอก)', 'อื่นๆ'];

const REFERRAL_SOURCES = [
  'รุ่นพี่ / รุ่นน้อง',
  'เพื่อน',
  'Social media (IG, Facebook)',
  'อื่นๆ'
];

const ACTIVITIES = ['โชว์เปิดงาน', 'ตลาดขายของ', 'บ้านผีสิง', 'หนังกลางแปลง'];

const TRANSPORTATION = [
  'BTS / MRT',
  'CU POP BUS',
  'รถยนต์ส่วนตัว',
  'รถตู้',
  'รถโดยสารประจำทาง (รถเมย์)',
  'รถจักรยานยนต์',
  'เดินเท้า',
  'อื่นๆ'
];

export default function RegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    fullName: '',
    faculty: '',
    gender: '',
    year: '',
    referralSource: '',
    interestedActivities: [],
    transportation: '',
    email: '',
  });
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'pdpa' | 'interestedActivities', string>>>({});

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCheckbox = (activity: string) => {
    const activities = formData.interestedActivities.includes(activity)
      ? formData.interestedActivities.filter((a) => a !== activity)
      : [...formData.interestedActivities, activity];
    updateField('interestedActivities', activities);
    // Clear activities error when user selects something
    if (errors.interestedActivities && activities.length > 0) {
      setErrors((prev) => ({ ...prev, interestedActivities: undefined }));
    }
  };

  // Validation for step 2
  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof FormData | 'interestedActivities', string>> = {};

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'กรุณากรอกรหัสนิสิต';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    }
    if (!formData.faculty) {
      newErrors.faculty = 'กรุณาเลือกคณะ';
    }
    if (!formData.gender) {
      newErrors.gender = 'กรุณาเลือกเพศ';
    }
    if (!formData.year) {
      newErrors.year = 'กรุณาเลือกชั้นปี';
    }
    if (!formData.referralSource) {
      newErrors.referralSource = 'กรุณาเลือกช่องทางรับรู้งาน';
    }
    if (formData.interestedActivities.length === 0) {
      newErrors.interestedActivities = 'กรุณาเลือกกิจกรรมที่สนใจอย่างน้อย 1 กิจกรรม';
    }
    if (!formData.transportation) {
      newErrors.transportation = 'กรุณาเลือกวิธีการเดินทาง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    // Validate PDPA consent
    if (!pdpaConsent) {
      setErrors({ pdpa: 'กรุณายอมรับข้อตกลง PDPA' });
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Register the user
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Registration successful:', responseData);

        // Redirect to home page (login) with success flag
        window.location.href = '/?registered=true';
      } else {
        const errorData = await response.json();
        console.error('❌ Registration failed:', errorData);
        setSubmitError('การลงทะเบียนล้มเหลว: ' + (errorData.error || 'เกิดข้อผิดพลาด'));
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setSubmitError('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-background min-h-screen px-4 py-8 sm:py-12">
      {/* Full-screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-16 w-16 border-4 border-halloween-orange border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-halloween-cream text-lg">กำลังส่งข้อมูล...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto pb-8">
        {/* Step 1: Event Details */}
        {step === 1 && (
          <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-6 sm:p-8 lg:p-10 xl:p-12">
            {/* Back to Login Button */}
            <button
              onClick={() => router.push('/')}
              className="mb-4 sm:mb-6 flex items-center gap-2 text-halloween-orange hover:text-halloween-red transition-colors"
              type="button"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm sm:text-base font-semibold">Back</span>
            </button>

            <h1 className="display-font text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-halloween-orange mb-5 sm:mb-6 lg:mb-8 text-center">
              <EventName />
            </h1>

            <div className="text-halloween-cream space-y-3 sm:space-y-4 lg:space-y-5 mb-6 sm:mb-8 lg:mb-10">
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed">
                ครั้งแรกของ งานฮาโลวีนสุดหลอนแต่โคตรมันส์จาก{' '}
                <span className="text-halloween-orange font-bold">
                  &quot;คณะพาณิชยศาสตร์และการบัญชี&quot;
                </span>{' '}
                X{' '}
                <span className="text-halloween-orange font-bold">
                  &quot;คณะวิศวกรรมศาสตร์&quot;
                </span>{' '}
                X{' '}
                <span className="text-halloween-orange font-bold">
                  &quot;คณะนิเทศศาสตร์&quot;
                </span>
              </p>

              <p className="text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed">
                เตรียมตัวให้พร้อม... เพราะความสนุกครั้งนี้มาพร้อมเสียงกรี๊ด ความหลอน
                และเซอร์ไพรส์สุดขนหัวลุก! 💀✨
              </p>

                <div className="flex items-start gap-2 lg:gap-3 mt-3 sm:mt-4 lg:mt-5 text-halloween-bone">
                <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 shrink-0 mt-0.5 text-halloween-orange"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed">
                  Larngear, Faculty of Engineering, Chulalongkorn University
                </p>
              </div>

              <div className="bg-halloween-dark p-4 sm:p-5 lg:p-6 xl:p-8 rounded-lg border border-halloween-purple mt-4 sm:mt-5 lg:mt-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-halloween-orange mb-3 sm:mb-4 lg:mb-5">
                  🕸️ กิจกรรมที่คุณต้องลอง
                </h2>
                <ul className="space-y-2 lg:space-y-3 text-sm sm:text-base lg:text-lg xl:text-xl text-halloween-bone">
                  <li>🎬 หนังกลางแปลงสุดหลอน</li>
                  <li>🏚️ บ้านผีสิงที่แค่เดินผ่านก็ใจสั่น</li>
                  <li>💃 โชว์สุดพิเศษ</li>
                  <li>🛍️ ร้านค้านิสิตมากมาย</li>
                </ul>
              </div>

              <div className="mt-4 sm:mt-5 lg:mt-6 text-center px-2">
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-halloween-gray mb-2 lg:mb-3">
                  ติดตามรายละเอียดเพิ่มเติมได้ที่
                </p>
                <a
                  href="https://www.instagram.com/shividni.pheedu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg xl:text-xl text-halloween-orange font-bold hover:text-halloween-red transition-colors underline break-all"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="break-all">IG: @shividni.pheedu</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl py-3 sm:py-4 lg:py-5 xl:py-6 rounded-lg transition-colors active:scale-95"
            >
              ถัดไป
            </button>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-6 sm:p-8">
            {/* Back to Login Button */}
            <button
              onClick={() => router.push('/')}
              className="mb-4 sm:mb-6 flex items-center gap-2 text-halloween-orange hover:text-halloween-red transition-colors"
              type="button"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm sm:text-base font-semibold">Back</span>
            </button>

            <h1 className="display-font text-3xl sm:text-4xl text-halloween-orange mb-2 text-center">
              <EventName />
            </h1>
            <p className="text-xs sm:text-sm text-halloween-gray text-center mb-5 sm:mb-6">
              * จำเป็นต้องกรอก
            </p>

            <form className="space-y-5 sm:space-y-6">
              {/* Student ID */}
              <div>
                <label className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2">
                  รหัสนิสิต *
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => updateField('studentId', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.studentId ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  placeholder="กรอกรหัสนิสิต"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                />
                {errors.studentId && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.studentId}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2">
                  อีเมล *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.email ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  placeholder="example@email.com"
                  autoComplete="email"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.email}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2">
                  ชื่อ - นามสกุล *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.fullName ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  placeholder="กรอกชื่อ-นามสกุล"
                  autoComplete="name"
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.fullName}</p>
                )}
              </div>

              {/* Faculty */}
              <div>
                <label htmlFor="faculty" className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2 font-iannnnn-owl">
                  คณะ *
                </label>
                <select
                  id="faculty"
                  value={formData.faculty}
                  onChange={(e) => updateField('faculty', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base font-iannnnn-owl focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.faculty ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  required
                >
                  <option value="">เลือกคณะ</option>
                  {FACULTIES.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
                {errors.faculty && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.faculty}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm sm:text-base text-halloween-cream font-semibold mb-3 font-iannnnn-owl">
                  เพศ *
                </label>
                <div className={`space-y-2.5 ${errors.gender ? 'p-3 border-2 border-halloween-error rounded-lg' : ''}`}>
                  {GENDERS.map((option) => (
                    <label key={option} className="flex items-center text-sm sm:text-base text-halloween-cream cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={(e) => updateField('gender', e.target.value)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-halloween-purple peer-checked:border-halloween-orange peer-checked:bg-halloween-orange/20 transition-all duration-200 flex items-center justify-center mr-3 group-hover:border-halloween-orange">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-halloween-orange opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      </div>
                      <span className="group-hover:text-halloween-orange transition-colors duration-200 font-iannnnn-owl">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <p className="mt-2 text-sm text-halloween-error">{errors.gender}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2 font-iannnnn-owl">
                  ชั้นปี *
                </label>
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => updateField('year', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base font-iannnnn-owl focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.year ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  required
                >
                  <option value="">เลือกชั้นปี</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.year}</p>
                )}
              </div>

              {/* Referral Source */}
              <div>
                <label htmlFor="referralSource" className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2 font-iannnnn-owl">
                  ช่องทางรับรู้งาน *
                </label>
                <select
                  id="referralSource"
                  value={formData.referralSource}
                  onChange={(e) => updateField('referralSource', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base font-iannnnn-owl focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.referralSource ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  required
                >
                  <option value="">เลือกช่องทาง</option>
                  {REFERRAL_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                {errors.referralSource && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.referralSource}</p>
                )}
              </div>

              {/* Interested Activities */}
              <div>
                <label className="block text-sm sm:text-base text-halloween-cream font-semibold mb-3 font-iannnnn-owl">
                  กิจกรรมที่สนใจ *
                </label>
                <div className={`space-y-2.5 ${errors.interestedActivities ? 'p-3 border-2 border-halloween-error rounded-lg' : ''}`}>
                  {ACTIVITIES.map((activity) => (
                    <label key={activity} className="flex items-center text-sm sm:text-base text-halloween-cream cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.interestedActivities.includes(activity)}
                          onChange={() => handleCheckbox(activity)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-halloween-purple peer-checked:border-halloween-orange peer-checked:bg-halloween-orange transition-all duration-200 flex items-center justify-center mr-3 group-hover:border-halloween-orange">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-halloween-dark opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                      <span className="group-hover:text-halloween-orange transition-colors duration-200 font-iannnnn-owl">{activity}</span>
                    </label>
                  ))}
                </div>
                {errors.interestedActivities && (
                  <p className="mt-2 text-sm text-halloween-error">{errors.interestedActivities}</p>
                )}
              </div>

              {/* Transportation */}
              <div>
                <label htmlFor="transportation" className="block text-sm sm:text-base text-halloween-cream font-semibold mb-2 font-iannnnn-owl">
                  วิธีการเดินทาง *
                </label>
                <select
                  id="transportation"
                  value={formData.transportation}
                  onChange={(e) => updateField('transportation', e.target.value)}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-halloween-cream text-base font-iannnnn-owl focus:border-halloween-orange focus:outline-none focus:ring-2 focus:ring-halloween-orange/20 transition-all duration-200 ${
                    errors.transportation ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  required
                >
                  <option value="">เลือกวิธีการเดินทาง</option>
                  {TRANSPORTATION.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                {errors.transportation && (
                  <p className="mt-1 text-sm text-halloween-error">{errors.transportation}</p>
                )}
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:flex-1 bg-halloween-gray hover:bg-halloween-blue text-halloween-dark font-bold py-3 rounded-lg transition-colors active:scale-95"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleNextToStep3}
                className="w-full sm:flex-1 bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold py-3 rounded-lg transition-colors active:scale-95"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}

        {/* Step 3: PDPA */}
        {step === 3 && (
          <div className="bg-halloween-charcoal border-2 border-halloween-orange rounded-lg p-6 sm:p-8">
            {/* Back to Login Button */}
            <button
              onClick={() => router.push('/')}
              className="mb-4 sm:mb-6 flex items-center gap-2 text-halloween-orange hover:text-halloween-red transition-colors"
              type="button"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm sm:text-base font-semibold">Back</span>
            </button>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-halloween-orange mb-4 sm:mb-5 md:mb-6 text-center leading-tight px-2">
              ความยินยอมให้สิทธิ์ในการใช้กฎหมาย PDPA
            </h1>

            <div className="bg-halloween-dark p-4 sm:p-5 md:p-6 rounded-lg border border-halloween-purple mb-5 sm:mb-6 md:mb-8">
              <p className="text-xs sm:text-sm md:text-base text-halloween-cream leading-relaxed">
                พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ.2562 หรือ Personal Data Protection
                Act (PDPA) เป็นกฎหมายว่าด้วยการให้สิทธิ์กับเจ้าของข้อมูลส่วนบุคคล
                สร้างมาตรฐานการรักษาข้อมูลส่วนบุคคลให้ปลอดภัย
                และนำไปใช้ให้ถูกวัตถุประสงค์ตามคำยินยอมที่เจ้าของข้อมูลส่วนบุคคลอนุญาต
                ทางผู้จัดทำจึงต้องขอความยินยอม (Consent)
                ของผู้กรอกฟอร์มทุกท่านในการเก็บข้อมูลส่วนตัว
              </p>
            </div>

            <div className="mb-5 sm:mb-6 md:mb-8">
                <label className={`flex items-start text-xs sm:text-sm md:text-base text-halloween-cream cursor-pointer group ${
                errors.pdpa ? 'p-3 border-2 border-halloween-error rounded-lg' : ''
              }`}>
                <div className="relative flex items-start">
                  <input
                    type="checkbox"
                    checked={pdpaConsent}
                    onChange={(e) => {
                      setPdpaConsent(e.target.checked);
                      if (e.target.checked && errors.pdpa) {
                        setErrors((prev) => ({ ...prev, pdpa: undefined }));
                      }
                    }}
                    required
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-halloween-purple peer-checked:border-halloween-orange peer-checked:bg-halloween-orange transition-all duration-200 flex items-center justify-center mr-2 sm:mr-3 mt-0.5 shrink-0 group-hover:border-halloween-orange">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-halloween-dark opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <span className="group-hover:text-halloween-orange transition-colors duration-200">ข้าพเจ้ายอมรับและยินยอม *</span>
              </label>
              {errors.pdpa && (
                <p className="mt-2 text-xs sm:text-sm text-halloween-error">{errors.pdpa}</p>
              )}
            </div>

            {submitError && (
              <div role="alert" className="mb-4 flex items-start gap-2 bg-halloween-error/15 border border-halloween-error rounded-lg p-3 text-halloween-error text-sm sm:text-base font-iannnnn-owl">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:flex-1 bg-halloween-gray hover:bg-halloween-blue text-halloween-dark font-bold py-3 rounded-lg transition-colors active:scale-95"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:flex-1 bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold py-3 rounded-lg transition-colors disabled:opacity-50 active:scale-95"
              >
                ยืนยันการลงทะเบียน
              </button>
            </div>
          </div>
        )}

        {/* Sponsors Section - Only on Step 1 (Scrollable) */}
        {step === 1 && (
          <div className="mt-8">
            <p className="text-center text-halloween-orange font-bold text-xs mb-3">Our Sponsors</p>
            <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-2">
              {[
                { src: '/sponsors/cqk-hotpot-logo-2-copy.png', alt: 'CQK Hotpot' },
                { src: '/sponsors/escaperoomlogo.png', alt: 'Escape Room' },
                { src: '/sponsors/tri-petch-isuzu-sales-.png', alt: 'Tri Petch Isuzu Sales' },
                { src: '/sponsors/img_0628.jpg', alt: 'Sponsor' },
                { src: '/sponsors/img_7475.jpg', alt: 'Sponsor' },
                { src: '/sponsors/img_7476.jpg', alt: 'Sponsor' },
                { src: '/sponsors/img_7484.jpg', alt: 'Sponsor' },
              ].map((sponsor, index) => (
                <div
                  key={index}
                  className="w-[50px] h-[50px] sm:w-[55px] sm:h-[55px] md:w-[60px] md:h-[60px] lg:w-[65px] lg:h-[65px] hover:scale-110 transition-transform flex items-center justify-center"
                >
                  <Image
                    src={sponsor.src}
                    alt={sponsor.alt}
                    width={65}
                    height={65}
                    className="w-full h-full object-contain"
                    quality={75}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
