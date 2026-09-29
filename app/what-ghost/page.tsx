'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';
import FloatingGhost from '@/components/FloatingGhost';

// Ghost image mapping - All 7 ghosts
const ghostImages: Record<string, string> = {
  'ผีนางรำ': '/ghosts/ผีนางรำ.webp',
  'ผีแม่นาค': '/ghosts/ผีแม่นาค.webp',
  'แวมไพร์': '/ghosts/แวมไพร์.webp',
  'ซอมบี้': '/ghosts/ซอมบี้.webp',
  'ผีสาวญี่ปุ่นคอยาว': '/ghosts/ผีญี่ปุ่นคอยาว.webp',
  'ผีปอบ': '/ghosts/ผีปอบ.webp',
  'Zatan': '/ghosts/zatan.webp',
};

export default function WhatGhostPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const questions: Array<{
    q: string;
    image?: string;
    options: Array<{ text: string; value: string }>;
  }> = [
    {
      q: 'คืนฮาโลวีน คุณเลือกแต่งตัวเป็นอะไร?',
      image: '/questions/q1.webp',
      options: [
        { text: 'ผีขี้เล่นถือหัวฟักทอง', value: 'A' },
        { text: 'ผีเจ้าสาวแสนเศร้าเพราะผัวทิ้ง', value: 'B' },
        { text: 'แวมไพร์ old money', value: 'C' },
        { text: 'ปีศาจเขาแดงแรงฤทธิ์', value: 'D' },
      ],
    },
    {
      q: 'เมื่อขบวน Trick or Treat เริ่มขึ้น! คุณจะ...',
      image: '/questions/q2.webp',
      options: [
        { text: 'แกล้ง Gen alpha ให้ตกใจเบา ๆ ก่อนให้ขนม', value: 'A' },
        { text: 'ฉีกยิ้มอันอ่อนโยนและยื่นลูกอมให้', value: 'B' },
        { text: 'ยื่นลูกอมอย่างมีสไตล์ พร้อมสายตาเยือกเย็น', value: 'C' },
        { text: 'แจกขนมเฉพาะคนที่เติมไฟจนไฟสีม่วง', value: 'D' },
      ],
    },
    {
      q: 'เสียงประตูบ้านผีสิงดังเอี๊ยด... คุณจะทำยังไง?',
      image: '/questions/q3.webp',
      options: [
        { text: 'ผลักประตูเข้าหาผีในบ้านเลย', value: 'A' },
        { text: 'ยืนดูสถานการณ์ก่อน แล้วค่อย ๆ เดินตามแสงเทียน', value: 'B' },
        { text: 'ก้าวช้า ๆ ด้วยท่าทางสงบ แต่สายตาจ้องลึก', value: 'C' },
        { text: 'ยิ้มมุมปาก แล้วเดินนำทุกคนเข้าไปพร้อมท่า zigma', value: 'D' },
      ],
    },
    {
      q: 'ในงานฮาโลวีนมีประกวดชุดผี คุณมั่นใจว่าคุณจะ',
      image: '/questions/q4.webp',
      options: [
        { text: 'ชุดของฉันต้องตลก ตลก หัวเราะน้ำตาเล็ดทั้งงาน', value: 'A' },
        { text: 'ชุดของฉันต้องมีเรื่องราวเศร้า ๆ ที่จะต้องเป็นตำนาน', value: 'B' },
        { text: 'ชุดของฉันต้องเท่ ลึกลับ ดูดี สะกดทุกสายตาในงาน', value: 'C' },
        { text: 'ชุดของฉันต้องมีออร่า +999', value: 'D' },
      ],
    },
    {
      q: 'หากมีเพื่อนโดน "ผีในบ้านสิง" เล่นงาน คุณจะ...',
      image: '/questions/q5.webp',
      options: [
        { text: 'หัวเราะก่อน แล้วค่อยช่วยเพื่อนที่โดนหลอก', value: 'A' },
        { text: 'วิ่งไปปลอบผีด้วยความเป็นห่วง', value: 'B' },
        { text: 'เฝ้าดูด้วยความสงบ แล้วค่อยช่วยอย่างมีจังหวะ', value: 'C' },
        { text: 'เข้าจัดการผีตนนั้นด้วยความมั่นใจ ไม่กลัว', value: 'D' },
      ],
    },
    {
      q: 'ของตกแต่งฮาโลวีนที่คุณชอบที่สุดคือ...',
      image: '/questions/q6.webp',
      options: [
        { text: 'ฟักทองหัวเราะถือ tung tung tung sahur', value: 'A' },
        { text: 'เทียนและกลีบดอกไม้', value: 'B' },
        { text: 'โลงศพจำลอง / โคมไฟสีเลือด', value: 'C' },
        { text: 'รูปดาวห้าแฉกกับควันสีดำ', value: 'D' },
      ],
    },
    {
      q: 'คืนนี้มีหนังผีฉายกลางแปลง คุณจะเลือกดูเรื่องไหน?',
      image: '/questions/q7.webp',
      options: [
        { text: 'Friday 13', value: 'A' },
        { text: 'พี่มาก พระโขนง', value: 'B' },
        { text: 'The nun', value: 'C' },
        { text: 'The Conjuring', value: 'D' },
      ],
    },
    {
      q: 'ถ้าคุณได้ขับรถผ่านสุสานตอนเที่ยงคืน...',
      image: '/questions/q8.webp',
      options: [
        { text: 'เปิดเพลงหลอนแล้วถ่ายคลิปลงสตอรี่ เช็คอิน', value: 'A' },
        { text: 'เปิดเพลงเบา ๆ แล้วภาวนาให้ถึงบ้านโดยไม่มีอะไรตามมา', value: 'B' },
        { text: 'มองกระจกหลังอย่างจงใจ พร้อมพูดว่ากลับบ้านกันมั้ย', value: 'C' },
        { text: 'แวะจอดดูหน่อย เผื่อมี "น่าอะไรสนุก"', value: 'D' },
      ],
    },
    {
      q: 'กลิ่นไหนที่คุณรู้สึกว่า "ฮาโลวีนมาก"',
      image: '/questions/q9.webp',
      options: [
        { text: 'กลิ่นขนมอบใหม่ ๆ', value: 'A' },
        { text: 'กลิ่นเทียนไขผสมกลีบดอกไม้', value: 'B' },
        { text: 'กลิ่นฝนกับผ้ากำมะหยี่', value: 'C' },
        { text: 'กลิ่นควันและกำยาน', value: 'D' },
      ],
    },
    {
      q: 'ถ้าได้เป็น "ผีในตำนานจุฬา" สักคืน คุณอยากเป็นแบบไหน?',
      image: '/questions/q10.webp',
      options: [
        { text: 'ผีแสบ ๆ หลอกแล้วหัวเราะด้วยความสะใจ', value: 'A' },
        { text: 'ผีสุดเศร้ารอใครสักคนที่จริงใจ', value: 'B' },
        { text: 'ผีเท่และสงบแต่ทำให้คนขนลุก', value: 'C' },
        { text: 'ผีผู้ควบคุมพลังในเงามืด พร้อมให้พรนิสิต', value: 'D' },
      ],
    },
  ];

  const progressWidthClasses = [
    'w-[10%]',
    'w-[20%]',
    'w-[30%]',
    'w-[40%]',
    'w-[50%]',
    'w-[60%]',
    'w-[70%]',
    'w-[80%]',
    'w-[90%]',
    'w-full',
  ] as const;

  const progressClass = progressWidthClasses[
    Math.min(currentQuestion, progressWidthClasses.length - 1)
  ];

  // 7 Ghost Types with personality scoring
  const ghostTypes = {
    'ผีนางรำ': {
      name: 'ผีนางรำ',
      description: 'สนุก ขี้เล่น - ผีไทยสายปั่นคนอื่น',
      theme: 'คุณเป็นคนสนุกสนาน ชอบหัวเราะ และทำให้คนรอบข้างมีความสุข!',
    },
    'ผีแม่นาค': {
      name: 'ผีแม่นาค',
      description: 'ละเมียด ละไม มีความรัก - ผีไทยสายดราม่าอบอุ่น',
      theme: 'คุณเป็นคนอ่อนโยน รักลึก และพร้อมเสียสละเพื่อคนที่รัก',
    },
    'แวมไพร์': {
      name: 'แวมไพร์',
      description: 'เท่ หรู ลึกลับ - ผีต่างชาติสายมีสไตล์',
      theme: 'คุณมีเสน่ห์ลึกลับ มีรสนิยม และดึงดูดสายตาคนทุกคน',
    },
    'ซอมบี้': {
      name: 'ซอมบี้',
      description: 'ตลก ขี้เกียจ แต่จริงใจ - ผีขี้เล่นสายชิล',
      theme: 'คุณเป็นคนสบาย ๆ ไม่ซีเรียส และมีความเป็นตัวของตัวเองสูง!',
    },
    'ผีสาวญี่ปุ่นคอยาว': {
      name: 'ผีสาวญี่ปุ่นคอยาว',
      description: 'เศร้า เยือกเย็น มีศิลป์ - ผีญี่ปุ่นสายสงบแต่หลอน',
      theme: 'คุณเป็นคนสงบ ลึกซึ้ง มีความรู้สึกที่ละเอียดอ่อน',
    },
    'ผีปอบ': {
      name: 'ผีปอบ',
      description: 'ดาร์ก ขรึม เงียบแต่แรง - ผีไทยสายมืดแต่เท่',
      theme: 'คุณเป็นคนลึกลับ มีพลัง และไม่ชอบความวุ่นวาย',
    },
    'Zatan': {
      name: 'Zatan',
      description: 'มีอำนาจ นำทีม - ผีหัวหน้าสุดขลังแห่งฮาโลวีน',
      theme: 'คุณเป็นผู้นำโดยกำเนิด มีความมั่นใจและควบคุมสถานการณ์ได้อย่างเยี่ยม!',
    },
  };

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      router.push('/');
      return;
    }
    setIsLoggedIn(true);
  }, [router]);

  // Wait for current question image to load before showing content
  useEffect(() => {
    setImageLoaded(false);

    const currentImageSrc = questions[currentQuestion].image;
    if (currentImageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageLoaded(true); // Show content even if image fails to load
      };
      img.src = currentImageSrc;
    } else {
      setImageLoaded(true); // No image, show content immediately
    }
  }, [currentQuestion]);

  // Preload next question image
  useEffect(() => {
    if (currentQuestion < questions.length - 1) {
      const nextImageSrc = questions[currentQuestion + 1].image;
      if (nextImageSrc) {
        const nextImage = new window.Image();
        nextImage.src = nextImageSrc;
      }
    }
  }, [currentQuestion]);

  const handleAnswer = async (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // Show loading animation for next question
      setLoadingQuestion(true);

      // Wait for 500ms before showing next question
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentQuestion(currentQuestion + 1);
      setLoadingQuestion(false);
    } else {
      // Show full-page loading for result
      setLoadingResult(true);

      // Quiz complete - calculate and save result
      const ghostResult = calculateGhostResult(newAnswers);

      // Save to database
      const studentId = localStorage.getItem('studentId');
      if (studentId) {
        try {
          await fetch('/api/save-ghost-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, ghostResult }),
          });

          // Update localStorage userData
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            userData.ghost_result = ghostResult;
            localStorage.setItem('userData', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Error saving ghost result:', error);
        }
      }

      // Wait a bit before showing result
      await new Promise(resolve => setTimeout(resolve, 800));

      setLoadingResult(false);
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateGhostResult = (answersList: string[]): string => {
    // Count A, B, C, D answers
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    answersList.forEach((ans) => {
      counts[ans as keyof typeof counts]++;
    });

    // Find dominant answer type
    const maxCount = Math.max(...Object.values(counts));
    const dominantTypes = Object.keys(counts).filter(
      (key) => counts[key as keyof typeof counts] === maxCount
    );

    // If there's a tie, use first answer as tiebreaker
    const primaryType = dominantTypes.includes(answersList[0])
      ? answersList[0]
      : dominantTypes[0];

    // Map to specific ghost based on primary type + secondary patterns
    if (primaryType === 'A') {
      // A = Fun/Playful → ผีนางรำ (Thai playful) vs ซอมบี้ (lazy chill)
      // Check questions 1,3,4 for style preference
      const styleAnswers = [answersList[0], answersList[2], answersList[3]];
      const hasTraditionalThai = styleAnswers.filter(a => a === 'A' || a === 'B').length >= 2;
      return hasTraditionalThai ? 'ผีนางรำ' : 'ซอมบี้';
    }
    else if (primaryType === 'B') {
      // B = Sad/Romantic → ผีแม่นาค (Thai romantic) vs ผีสาวญี่ปุ่นคอยาว (Japanese cold/artistic)
      // Check questions 5,8 for warmth vs coldness
      const warmthAnswers = [answersList[4], answersList[7]];
      const isWarm = warmthAnswers.filter(a => a === 'B' || a === 'A').length >= 1;
      return isWarm ? 'ผีแม่นาค' : 'ผีสาวญี่ปุ่นคอยาว';
    }
    else if (primaryType === 'C') {
      // C = Cool/Mysterious → แวมไพร์ (elegant stylish) vs ผีปอบ (dark strong)
      // Check questions 0,3 for elegance vs darkness
      const eleganceAnswers = [answersList[0], answersList[3]];
      const isElegant = eleganceAnswers.filter(a => a === 'C').length >= 1;
      return isElegant ? 'แวมไพร์' : 'ผีปอบ';
    }
    else {
      // D = Powerful leader → Zatan
      return 'Zatan';
    }
  };

  const calculateResult = () => {
    const ghostName = calculateGhostResult(answers);
    return ghostTypes[ghostName as keyof typeof ghostTypes];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
  };

  const handleNavigate = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  if (!isLoggedIn) {
    return <LoadingScreen message="กำลังเรียกวิญญาณมาตั้งคำถาม..." />;
  }

  if (navigating) {
    return <LoadingScreen />;
  }

  if (loadingResult) {
    return <LoadingScreen message="กำลังส่องดูว่าคุณเป็นผีตนไหน..." />;
  }

  return (
    <div className="image-background min-h-screen relative overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-3 py-3 sm:px-6 sm:py-6">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => handleNavigate('/menu')}
          className="self-start mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-halloween-orange hover:text-halloween-red transition-colors shrink-0"
        >
          <svg
            className="w-4 h-4 sm:w-6 sm:h-6"
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

        {/* Quiz Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            {showResult ? (
              // Result View
              <div className="bg-halloween-charcoal/95 border-2 border-halloween-orange hand-cut p-4 sm:p-8 text-center">
                <h2 className="text-xl sm:text-4xl font-bold text-halloween-orange mb-3 sm:mb-6 font-iannnnn-owl">
                  คุณคือ... {calculateResult().name}!
                </h2>

                {/* Ghost Image */}
                {ghostImages[calculateResult().name] && (
                  <div className="mb-4 sm:mb-6 flex justify-center">
                    <Image
                      src={ghostImages[calculateResult().name]}
                      alt={calculateResult().name}
                      width={200}
                      height={200}
                      className="rounded-lg w-32 h-32 sm:w-[200px] sm:h-[200px]"
                      priority
                      quality={75}
                    />
                  </div>
                )}

                <div className="bg-halloween-dark p-3 sm:p-5 rounded-lg border border-halloween-purple mb-4 sm:mb-6">
                  <p className="text-halloween-bone text-sm sm:text-xl mb-2 sm:mb-4 font-iannnnn-owl">
                    {calculateResult().description}
                  </p>
                  <p className="text-halloween-cream text-xs sm:text-base font-iannnnn-owl">
                    {calculateResult().theme}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/menu')}
                    className="bg-halloween-purple hover:bg-halloween-orange border-2 border-halloween-orange text-halloween-cream hover:text-halloween-dark font-bold px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base rounded-lg transition-colors active:scale-95 font-iannnnn-owl"
                  >
                    กลับหน้าหลัก
                  </button>
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base rounded-lg transition-colors active:scale-95 font-iannnnn-owl"
                  >
                    เล่นอีกครั้ง
                  </button>
                </div>
              </div>
            ) : (
              // Question View
              <div className="bg-halloween-charcoal/95 border-2 border-halloween-orange hand-cut p-3 sm:p-5">
                {loadingQuestion || !imageLoaded ? (
                  // Loading animation within quiz card
                  <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                    <FloatingGhost className="w-14 sm:w-20" />
                    <p className="mt-4 text-halloween-cream text-sm sm:text-lg font-iannnnn-owl">
                      {loadingQuestion ? 'ผีกำลังคิดคำถามข้อต่อไป...' : 'กำลังเสกรูปขึ้นมา...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 sm:mb-4">
                      <div className="flex justify-between items-center text-halloween-gray text-[10px] sm:text-sm mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-2">
                          {currentQuestion > 0 && (
                            <button
                              type="button"
                              onClick={handleBack}
                              className="text-halloween-orange hover:text-halloween-red transition-colors"
                              aria-label="Previous question"
                            >
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
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
                            </button>
                          )}
                          <span className="font-iannnnn-owl">คำถามที่ {currentQuestion + 1}</span>
                        </div>
                        <span>
                          {currentQuestion + 1} / {questions.length}
                        </span>
                      </div>
                      <div className="bg-halloween-dark h-1.5 sm:h-2 rounded-full">
                        <div className={`bg-halloween-orange h-1.5 sm:h-2 rounded-full transition-all ${progressClass}`}></div>
                      </div>
                    </div>

                    {/* Question Image */}
                    {questions[currentQuestion].image && (
                      <div className="mb-2 sm:mb-4 flex justify-center">
                        <Image
                          src={questions[currentQuestion].image}
                          alt={questions[currentQuestion].q}
                          width={700}
                          height={700}
                          sizes="(max-width: 640px) 100vw, 700px"
                          className="rounded-lg w-full max-h-40 sm:max-h-64 object-contain"
                          priority={currentQuestion === 0}
                          quality={75}
                        />
                      </div>
                    )}

                    <h3 className="text-base sm:text-xl font-bold text-halloween-cream mb-2 sm:mb-4 font-iannnnn-owl">
                      {questions[currentQuestion].q}
                    </h3>

                    <div className="space-y-1.5 sm:space-y-2">
                      {questions[currentQuestion].options.map((option, index) => {
                        const isSelected = answers[currentQuestion] === option.value;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleAnswer(option.value)}
                            className={`w-full text-left border-2 rounded-lg px-2.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-base transition-all active:scale-98 font-iannnnn-owl ${
                              isSelected
                                ? 'bg-halloween-orange/90 border-halloween-orange text-halloween-dark font-semibold'
                                : 'bg-halloween-dark/90 hover:bg-halloween-purple border-halloween-purple hover:border-halloween-orange text-halloween-cream'
                            }`}
                          >
                            <span className={`font-bold mr-1.5 sm:mr-3 ${isSelected ? 'text-halloween-dark' : 'text-halloween-orange'}`}>
                              {option.value}.
                            </span>
                            {isSelected && (
                              <span className="mr-1.5 sm:mr-2">✓</span>
                            )}
                            {option.text}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
