import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

export default function PublicScrollProgress() {
    const reduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 28,
        restDelta: 0.001,
    });

    if (reduceMotion) {
        return null;
    }

    return (
        <motion.div
            className="bccc-public-scroll-progress"
            style={{ scaleX }}
            aria-hidden="true"
        />
    );
}
