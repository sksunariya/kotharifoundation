import { useRef } from 'react';

/**
 * Six individual digit boxes.
 * Props:
 *   value   – string of up to 6 digits (controlled)
 *   onChange – (newValue: string) => void
 *   disabled – boolean
 */
const OtpInput = ({ value = '', onChange, disabled = false }) => {
  const refs = useRef([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const focus = (idx) => refs.current[idx]?.focus();

  const handleChange = (idx, raw) => {
    // Accept only the last character typed (handles rapid input)
    const char = raw.replace(/\D/g, '').slice(-1);
    const arr = digits.slice();
    arr[idx] = char;
    const next = arr.join('');
    onChange(next);
    if (char && idx < 5) focus(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        // Clear current box
        const arr = digits.slice();
        arr[idx] = '';
        onChange(arr.join(''));
      } else if (idx > 0) {
        // Move to previous box and clear it
        const arr = digits.slice();
        arr[idx - 1] = '';
        onChange(arr.join(''));
        focus(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focus(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < 5) {
      focus(idx + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6).trimEnd() || pasted);
    // Focus the box after the last pasted digit
    const nextIdx = Math.min(pasted.length, 5);
    focus(nextIdx);
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={el => refs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          placeholder="-"
          disabled={disabled}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onFocus={e => e.target.select()}
          className={`
            w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-colors outline-none
            placeholder:text-gray-300
            ${d ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 bg-white text-gray-800'}
            focus:border-primary-500 focus:ring-2 focus:ring-primary-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  );
};

export default OtpInput;
