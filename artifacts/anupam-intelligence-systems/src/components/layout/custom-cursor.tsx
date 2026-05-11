import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 500, damping: 40 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 40 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX - 12);
      mouseY.set(e.clientY - 12);
      setVisible(true);
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{ translateX: springX, translateY: springY }}
      animate={{
        opacity: visible ? 1 : 0,
        scale: clicking ? 0.7 : 1,
      }}
      transition={{ scale: { duration: 0.12 } }}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-6 w-6 rounded-full border border-primary/60 bg-primary/10 backdrop-blur-xl md:block"
    />
  );
}
