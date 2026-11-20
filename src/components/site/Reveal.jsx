import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function Reveal({ children, delay = 0, y = 22, className = "", as = "div" }) {
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.65, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}