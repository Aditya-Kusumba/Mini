// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import './Nav.css';
// import { useNavigate } from 'react-router-dom';

// function Nav() {
//   const navigate = useNavigate();
//   const [expanded, setExpanded] = useState(false);

//   const items = [
//     { id: 1, label: 'Home', icon: '📊', path: '/' },
//     { id: 2, label: 'Login', icon: '📝', path: '/login' },
//     { id: 3, label: 'Register', icon: '🤖', path: '/register' },
//     { id: 4, label: 'About', icon: '🛣', path: '/about' },
//     { id: 5, label: 'Contact', icon: '⚙', path: '/contact' },
//   ];

//   return (
//     <motion.div
//       className="nav-container"
//       animate={{
//         position: expanded ? 'fixed' : 'absolute',
//         top: expanded ? 0 : '20px',
//         right: expanded ? 0 : '20px',
//         width: expanded ? '70vw' : '120px',
//         height: expanded ? '70vh' : '120px',
//         margin: 0,
//         padding: expanded ? '40px' : '10px',
//         backgroundColor: expanded ? 'transparent' : 'transparent',
//         zIndex: 999,
//         borderRadius: expanded ? '0px' : '16px',
//       }}
//       transition={{ type: 'tween', ease: 'easeInOut', duration: 0.6 }}
//     >
//       {/* Central Hexagon */}
//       <motion.div
//         role="button"
//         aria-expanded={expanded}
//         onClick={() => setExpanded((prev) => !prev)}
//         className="hexagon"
//         initial={{ scale: 1 }}
//         animate={{
//           scale: expanded ? 1.3 : 1,
//           rotate: expanded ? 24 : 0,
//         }}
//         transition={{ type: 'tween', ease: 'easeInOut', duration: 0.6 }}
//         style={{ cursor: 'pointer' }}
//       >
//         <svg viewBox="0 0 200 200" className="drop-shadow-2xl" aria-hidden>
//       <defs>
//         <linearGradient id="semiOpaqueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor="#444444ff" stopOpacity="0.7" /> {/* 70% opacity for the first color */}
//           <stop offset="100%" stopColor="#5a5a5aff" stopOpacity="0.7" /> {/* 70% opacity for the second color */}
//         </linearGradient>
//       </defs>

//           <polygon
//     points="100,10 180,45 180,155 100,190 20,155 20,45"
//     style={{
//       fill: "url(#semiOpaqueGradient)", // Apply the gradient
//       stroke: "none",                    // No border
//     }}
//   />
// </svg>

//         <motion.img
//           src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
//           alt="Student icon"
//           className="hexagon-icon"
//           initial={{ rotateY: 0, rotateX: 0, rotateZ: 0 }}
//           animate={{
//             top : expanded ? 210 : 37.5, 
//             left: expanded ? 460 : 40,
//             rotateY: expanded ? 13 : 0,
//             rotateX: expanded ? 6 : 0,
//             rotateZ: expanded ? -23 : 0,
//             scale: expanded ? 1.03 : 1,
//           }}
//           transition={{ type: 'tween', ease: 'easeInOut', duration: 0.6 }}
//         />
//       </motion.div>

//       {/* Radial Navigation Items */}
//       <AnimatePresence>
//         {expanded &&
//           items.map((it, idx) => {
//             const angle = (idx / items.length) * Math.PI * 2 - Math.PI / 2;
//             const radius = 140;
//             const x = Math.cos(angle) * radius;
//             const y = Math.sin(angle) * radius;

//             return (
//               <motion.button
//                 key={it.id}
//                 initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
//                 animate={{ opacity: 1, x, y, scale: 1 }}
//                 exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
//                 transition={{
//                   delay: 0 * 0.05,
//                   type: 'spring',
//                   stiffness: 220,
//                   damping: 20,
//                 }}
//                 onClick={() => navigate(it.path)}
//                 className="nav-item"
//                 style={{ transformOrigin: 'center', position: 'absolute', top: '45%', left: '46.4%' }}
//                 aria-label={it.label}
//               >
//                 <motion.div
//                   whileHover={{
//                     scale: 1.08,
//                     rotateX: 8,
//                     boxShadow: '0 12px 30px rgba(2,6,23,0.24)',
//                   }}
//                   whileTap={{ scale: 0.98 }} 
//                   className="nav-item-button"
//                 >
//                   <span className="nav-item-icon">{it.icon}</span>
//                   <span className="nav-item-label">{it.label}</span>
//                 </motion.div>
//               </motion.button>
//             );
//           })}
//       </AnimatePresence>

//     </motion.div>
//   );
// }

// export default Nav;