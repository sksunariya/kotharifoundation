import { useState, useEffect, useRef, useCallback } from 'react';

const HeroCarousel = ({ slides, interval = 4 }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);

  const total = slides.length;

  const goTo = useCallback((index) => {
    setCurrent((index + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setTimeout(next, interval * 1000);
    return () => clearTimeout(timerRef.current);
  }, [current, paused, interval, next, total]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (!total) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-900 select-none rounded-2xl shadow-md"
      style={{ height: '60vh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Image carousel"
    >
      {/* Slides */}
      {slides.map((slide, i) => {
        const offset = i - current;
        return (
          <div
            key={slide._id}
            className="absolute inset-0 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${offset * 100}%)` }}
            aria-hidden={i !== current}
          >
            {slide.link ? (
              <a href={slide.link} target="_blank" rel="noreferrer" className="block w-full h-full">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || `Slide ${i + 1}`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </a>
            ) : (
              <img
                src={slide.imageUrl}
                alt={slide.title || `Slide ${i + 1}`}
                className="w-full h-full object-contain"
                draggable={false}
              />
            )}
            {slide.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4 sm:py-6">
                <p className="text-white text-sm sm:text-base md:text-lg font-medium drop-shadow">
                  {slide.title}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Prev / Next arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/65 text-white rounded-full w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/65 text-white rounded-full w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all focus:outline-none ${
                i === current
                  ? 'bg-white w-6 h-2.5'
                  : 'bg-white/50 hover:bg-white/80 w-2.5 h-2.5'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
