
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface BinaryIntroProps {
  onAnimationComplete: () => void;
}

const BinaryIntro: React.FC<BinaryIntroProps> = ({ onAnimationComplete }) => {
  const [isComplete, setIsComplete] = useState(false);
  const binaryRef = useRef<HTMLDivElement>(null);
  const rows = 20;
  const cols = 40;

  // Create binary matrix
  useEffect(() => {
    if (!binaryRef.current) return;

    const binaryElements: HTMLDivElement[] = [];
    
    for (let i = 0; i < rows; i++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'flex justify-center';
      
      for (let j = 0; j < cols; j++) {
        const binaryEl = document.createElement('div');
        binaryEl.className = 'w-6 h-6 inline-flex items-center justify-center text-[#66B3FF] opacity-0 font-mono text-sm';
        binaryEl.textContent = Math.random() > 0.5 ? '1' : '0';
        
        // Random animation delay
        const delay = Math.random() * 1.5;
        binaryEl.style.animation = `fadeIn 0.5s ${delay}s forwards, binaryChange 2s ${delay + 0.5}s infinite`;
        
        rowEl.appendChild(binaryEl);
        binaryElements.push(binaryEl);
      }
      
      binaryRef.current.appendChild(rowEl);
    }

    // Change binary values randomly
    const changeBinary = () => {
      binaryElements.forEach(el => {
        if (Math.random() > 0.9) {
          el.textContent = el.textContent === '1' ? '0' : '1';
        }
      });
    };

    const intervalId = setInterval(changeBinary, 300);

    // Complete animation after 2.5 seconds
    const timeoutId = setTimeout(() => {
      setIsComplete(true);
      onAnimationComplete();
    }, 2500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [onAnimationComplete]);

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center bg-[#0A0C14] z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div 
          ref={binaryRef}
          className="grid gap-2"
        ></div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 0.8; }
            }
            
            @keyframes binaryChange {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 0.5; }
            }
          `
        }} />
      </div>
    </motion.div>
  );
};

export default BinaryIntro;
